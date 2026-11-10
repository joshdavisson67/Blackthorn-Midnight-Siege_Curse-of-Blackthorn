import {nextRank} from './weapon-ranks.mjs?v=191';
import {ARMOR,armorRank} from './armor.mjs?v=94';
import {FORGE,forgeBonuses} from './soul-forge.mjs?v=205';
import {POWERUPS} from './powerups.mjs?v=205';
import {weapons} from './weapon-stats.mjs?v=205';
import {KATANA_STATION} from './katana.mjs?v=205';

// Stations (v202, Dead Tide step 1), for any mode: what the shared stations sell and
// how they look (perks, ammunition crates, the pistol bench, weapon racks and their
// ranks, body armor and the Nano Shield, the Soul Forge and the timed shrines), and
// the interaction around them: the nearest station within reach, the prompt it shows,
// and what pressing E there does. Moved from game.js unchanged;
// scripts/golden-trace.mjs visits every station early and late in a run and checks
// the mansion behaves identically. Where a station stands is the mode's choice, and
// the models come from station-models.mjs. A mode's own kinds of station (the
// mansion's kennel, Olivia, the grave, its doors, the shed's M4 and the Warden LMG;
// later, Dead Tide's own) plug in through rules; the README's version 202 section
// lists every hook. v205: the katana's rack, shared by every mode.

// The four perks. Ironheart doubles maximum health when bought.
export const PERKS=Object.freeze([Object.freeze({id:'iron',name:'IRONHEART',icon:'♥',price:2500,color:0xd54337,hex:'#ef7969',desc:'Double maximum health'}),Object.freeze({id:'quick',name:'QUICKHANDS',icon:'ϟ',price:1500,color:0x46bea1,hex:'#66dcb7',desc:'Reload twice as fast'}),Object.freeze({id:'eye',name:'DEADEYE',icon:'◎',price:2000,color:0xc79435,hex:'#e6bf61',desc:'Increase weapon damage 50%'}),Object.freeze({id:'stride',name:'NIGHTSTRIDE',icon:'»',price:1500,color:0x4d88c7,hex:'#7aaff0',desc:'Move and sprint 30% faster'})]);
// Weapon racks that sell their weapon's ranks once it is owned (v161 SMG, v164 shotgun,
// v165 Bushmaster, v191 the M4 and the Warden LMG). Values are the equip keys.
export const RANK_RACKS=Object.freeze({smg:3,shotgun:2,bushmaster:5,rifle:6,lmg:4});
// What each shared station is, for stationBuilder.add({x,z,y,rotation,...def}).
export function rackStation(type,name,price){if(type==='katana')return {...KATANA_STATION,name,price};return {name,type,price,hex:type==='smg'?'#7aaff0':type==='ammo'?'#67efbb':type==='glock'?'#ef7969':'#e6bf61',modelCaption:type==='ammo'?'RESTOCK · ALL WEAPONS':type==='glock'?'.45 SIDEARM · FOUR UPGRADE RANKS · THEN PISTOL AMMO':type==='shotgun'?'M12 · CLOSE-RANGE STOPPING POWER':type==='bushmaster'?'15 ROUNDS · SEMI-AUTO · 10× SCOPE':'RAVEN · RAPID FIRE · UPGRADE RANKS ONCE OWNED'};}
export function shrineStation(power){const def=POWERUPS[power];return {type:'powerup',power,name:def.name,price:power==='double'?800:900,hex:def.hex,modelCaption:power==='double'?'THE TWOFOLD RELIC · 20 SECONDS':'THE ENDLESS ARSENAL · 12 SECONDS'};}
export const ARMOR_STATION=Object.freeze({name:'AEGIS / BODY ARMOR',type:'armor',price:ARMOR.bodyPrice,hex:'#8ee0df',modelCaption:'2,500 ESSENCE · HEALTH SHIELD'});
export function forgeStation(name){return {name,type:'upgrade',price:FORGE.prices[0],hex:'#c1a1ff',modelCaption:'2× BASE DAMAGE · +25% AMMO · 25% FASTER RELOAD'};}

// stations: every interactable, the mode's own included. rules (all optional):
//   stillOpen(s)  a used station that still sells (true keeps it reachable)
//   hidden(s)     a station out of reach for now (true skips it)
//   label(s)      the price tag for the mode's own kinds (undefined: the shared one)
//   describe(s)   the line under it for the mode's own kinds (undefined: shared)
//   use(s)        E at the mode's own kinds, before anything is charged (true: handled)
//   equip(s)      E at the mode's own weapon once bought (true: handled)
//   buy(s)        after the price is paid, the mode's own purchases (true: handled)
export function createStations({stations,player,state:S,isPlaying,arms:{selectWeapon,buyWeaponRank,ammoFull,restockWeapon,refillAmmo,grantPowerup},hud:{notify,updateHud},sound:{tone},rules={}}){
  const armorStations=stations.filter(s=>s.type==='armor'),forgeStations=stations.filter(s=>s.type==='upgrade');
  // The pistol bench sells the Glock's ranks in order, then restocks its ammo.
  // The bench's price always reflects the next rank (or the 250 restock once all are earned).
  for(const s of stations)if(s.type==='glock')Object.defineProperty(s,'price',{get(){const next=nextRank('glock',S.inventory.glock.weaponRank);return next?next.price:250;}});
  const ranksAtRack=s=>s.type in RANK_RACKS&&S.inventory[s.type].owned;
  // Forge stations show the held weapon's Forge rank (v205: a blade's plaques show only damage).
  const blade=()=>!!weapons[S.weapon]?.melee;
  function updateForges(){const melee=blade();for(const s of forgeStations)if(s.forgeRank!==S.inventory[S.weapon].forgeRank||!!s.forgeMelee!==melee)s.setForgeRank(S.inventory[S.weapon].forgeRank,melee);}
  function closest(){let nearest=null,min=2.3;for(const s of stations){if((s.used&&s.type!=='armor'&&!rules.stillOpen?.(s))||s.locked||rules.hidden?.(s))continue;const d=Math.hypot(s.x-player.x,s.z-player.z);if(Math.abs((s.y||0)-player.y)<1.2&&d<min){nearest=s;min=d;}}return nearest;}
  function armorDescription(){
    if(S.armorTier===0)return `Absorbs ${S.maxHealth} damage before health · Unlocks Nano Shield Rank 1 at both stations`;
    const maximum=ARMOR.nanoRanks.length+1,rank=armorRank(Math.min(S.armorTier+1,maximum));
    const recharge=rank.regenDelay?`Regenerates ${rank.regenRate} shield/s after ${rank.regenDelay}s without a hit`:`Regenerates ${rank.regenRate} shield/s continuously · No hit delay`;
    return `${S.armorTier===maximum?'ACTIVE':'UPGRADE'} · ${recharge}${S.armorTier<maximum?' · Keeps current shield':''}`;
  }
  function describe(s){if(ranksAtRack(s)){const next=nextRank(s.type,S.inventory[s.type].weaponRank);return next?`RANK ${next.numeral} · ${next.name.toUpperCase()} · ${next.effect} · ${next.flavor}`:`ALL RANKS EARNED · WEAPON OWNED · PRESS ${RANK_RACKS[s.type]} TO EQUIP`;}const own=rules.describe?.(s);if(own!==undefined)return own;if(s.type==='bushmaster'&&!ranksAtRack(s))return '8-round semi-auto · 2× M4 damage · 10× precision scope';if(s.type==='armor')return armorDescription();if(s.type==='powerup')return s.power==='double'?'Double bullet and blade damage for 20 seconds':'Unlimited throws for 12 seconds · 0.5s recovery after each throw';if(s.type==='perk')return S.perkOwned.has(s.id)?'PERK ACTIVE':s.desc;if(s.type==='ammo')return 'Restock every owned weapon · Reload to fill magazines · +1 grenade';
    if(s.type==='glock'){const next=nextRank('glock',S.inventory.glock.weaponRank);if(next)return `RANK ${next.numeral} · ${next.name.toUpperCase()} · ${next.effect} · ${next.flavor}`;return ammoFull('glock')?'ALL RANKS EARNED · PISTOL AMMO FULL · PRESS 1 TO EQUIP':'ALL RANKS EARNED · Restock the Glock 21 · Reload to fill the magazine';}if(s.type==='upgrade')return s.forgeMaximum?'FORGED 3/3 · '+forgeBonuses(FORGE.maxRank).damageMultiplier+'× base damage · Maximum rank · Switch weapons to forge another':'RANK '+(S.inventory[S.weapon].forgeRank+1)+' OF 3 · '+forgeBonuses(S.inventory[S.weapon].forgeRank+1).damageMultiplier+'× base damage'+(blade()?' · A blade gains damage only':' · 25% faster reload · +25% magazine and reserve capacity');
    if(s.type==='katana')return S.inventory.katana?.owned?'WEAPON OWNED · PRESS 7 TO EQUIP':'Melee · Slashes everything in a 100° arc within 4 yards · Three cuts in turn · No upgrade ranks · The Soul Forge raises its damage';return S.inventory[s.type].owned?'WEAPON OWNED · USE NUMBER KEYS':'Unlock a new weapon for this run';}
  function label(s){const own=rules.label?.(s);if(own!==undefined)return own;if(s.type==='katana'&&S.inventory.katana?.owned)return 'OWNED';return ranksAtRack(s)?(nextRank(s.type,S.inventory[s.type].weaponRank)?nextRank(s.type,S.inventory[s.type].weaponRank).price.toLocaleString()+' ESSENCE':'ALL RANKS'):s.type==='glock'&&!nextRank('glock',S.inventory.glock.weaponRank)&&ammoFull('glock')?'FULL':s.type==='upgrade'&&s.forgeMaximum?'MAX RANK':(s.type==='perk'&&S.perkOwned.has(s.id))||(s.type==='armor'&&s.used)?'ACTIVE':s.price===0?'FREE':s.price.toLocaleString()+' ESSENCE';}
  function prompt(s,key){return `<strong>${key}</strong> ${s.name} <span style="color:#d4b77a">${label(s)}</span><small>${describe(s)}</small>`;}
  function interact(){
    if(!isPlaying())return;
    updateForges();const s=closest();if(!s)return;
    if(rules.use?.(s))return;
    if(s.type==='perk'&&S.perkOwned.has(s.id)){notify('THIS PERK IS ALREADY ACTIVE');return;}
    if(s.type==='armor'&&s.used){notify(`${armorRank(S.armorTier).name} IS ALREADY ACTIVE`);return;}
    if(s.type==='upgrade'&&s.forgeMaximum){notify('SOUL FORGE RANK 3 · THIS WEAPON IS FULLY FORGED');return;}
    if(ranksAtRack(s)&&nextRank(s.type,S.inventory[s.type].weaponRank)){
      // Short of the next rank: the rack still hands you the weapon (v165).
      if(S.points<nextRank(s.type,S.inventory[s.type].weaponRank).price)selectWeapon(s.type);
      buyWeaponRank(s.type);return;}
    if((s.type==='shotgun'||s.type==='smg'||s.type==='bushmaster'||s.type==='katana')&&S.inventory[s.type]?.owned){selectWeapon(s.type);return;}
    if(rules.equip?.(s))return;
    if(s.type==='glock'&&nextRank('glock',S.inventory.glock.weaponRank)){buyWeaponRank('glock');return;}
    if(s.type==='glock'&&ammoFull('glock')){selectWeapon('glock');notify('PISTOL AMMUNITION IS FULL');return;}
    if(S.points<s.price){notify(`NEED ${s.price-S.points} MORE ESSENCE`);tone(110,.2,.03,'square');return;}
    S.points-=s.price;
    if(rules.buy?.(s))return;
    if(s.type==='armor'){
      if(S.armorTier===0){S.armorTier=1;S.armor=S.armorMax=S.maxHealth;notify(`AEGIS BODY ARMOR · +${S.armorMax} SHIELD · NANO SHIELD RANK 1 UNLOCKED`);}
      else{S.armorTier++;const rank=armorRank(S.armorTier),next=ARMOR.nanoRanks[rank.rank];notify(`${rank.name} ONLINE · ${rank.regenRate} SHIELD/S ${rank.regenDelay?`AFTER ${rank.regenDelay}S WITHOUT A HIT`:'CONTINUOUS REGENERATION'}${next?` · RANK ${next.rank} UNLOCKED`:''}`);}
      for(const station of armorStations)station.setArmorTier(S.armorTier);
      tone(620,.4,.1,'triangle',1000);updateHud();return;
    }
    if(s.type==='perk'){S.perkOwned.add(s.id);if(s.id==='iron'){if(S.armorMax>0){S.armor*=200/S.maxHealth;S.armorMax=200;}S.maxHealth=200;S.health=200;}notify(`${s.name} ACQUIRED`);}
    else if(s.type==='powerup'){grantPowerup(s.power);}
    else if(s.type==='ammo'){refillAmmo();notify('AMMUNITION RESTOCKED');}
    else if(s.type==='glock'){restockWeapon('glock');selectWeapon('glock');notify('GLOCK 21 AMMUNITION RESTOCKED');}
    else if(s.type==='upgrade'){S.inventory[S.weapon].forgeRank++;if(S.reloadLeft>0){S.reloadLeft*=FORGE.reloadMultiplier;S.reloadDuration*=FORGE.reloadMultiplier;}notify(`SOUL FORGE RANK ${S.inventory[S.weapon].forgeRank}/3 · ${forgeBonuses(S.inventory[S.weapon].forgeRank).damageMultiplier}× DAMAGE${blade()?'':' · +25% AMMO · 25% FASTER RELOAD'}`);}
    else {S.inventory[s.type].owned=true;S.reloadLeft=0;selectWeapon(s.type);notify(`${s.name} ACQUIRED`);}
    tone(440,.3,.09,'triangle',880);updateHud();
  }
  return {closest,prompt,label,describe,interact,updateForges,ranksAtRack,armorStations,forgeStations};
}

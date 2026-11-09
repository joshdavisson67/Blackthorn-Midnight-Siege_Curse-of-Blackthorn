import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v202 (Dead Tide step 1): stations are a shared module (tests/stations.mjs checks where
// the mansion's stand and how they look). The mansion's still behave
// identically (scripts/golden-trace.mjs visits every one, early and late in a run);
// this test runs the stations with a run, a player and stations of its own, including
// a kind of station the module has never heard of (the slot Dead Tide's katana will use).
export async function verifySharedStations(){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  assert.deepEqual(imports('stations.mjs'),['weapon-ranks.mjs','armor.mjs','soul-forge.mjs','powerups.mjs'],'Stations import only the shared rank, armor, Forge and power-up rules');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('stations.mjs');
  const mansion=['vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','world-event-visuals.mjs','curse.mjs','curse-ui.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','lighting.mjs','estate-layout.mjs'];
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing the stations load builds or holds the mansion');
  const src=read('game.js');
  for(const name of ['closestStation','stationDescription','armorStationDescription','interact','buyPistolRank','updateForgeStations'])assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  for(const text of ['RANK_RACKS','ranksAtRack=','pistolBench'])assert(!src.includes(text),`nor ${text}`);
  assert(/const stationKit=createStations\(\{stations:interactables,/.test(src)&&/stationKit\.prompt\(s,/.test(src)&&/const perkDefs=PERKS\.map\(/.test(src),'The mansion places the shared stations and adds its own kinds through rules');

  // ---- What the shared stations are ------------------------------------------------------
  const {createStations,PERKS,RANK_RACKS,rackStation,shrineStation,ARMOR_STATION,forgeStation}=await import('../.qa/stations.mjs');
  const {nextRank}=await import('../.qa/weapon-ranks.mjs');const {ARMOR,armorRank}=await import('../.qa/armor.mjs');const {FORGE}=await import('../.qa/soul-forge.mjs');const {createRunState}=await import('../.qa/player.mjs');
  assert.deepEqual(PERKS.map(p=>[p.id,p.price]),[['iron',2500],['quick',1500],['eye',2000],['stride',1500]],'Four perks at their prices');
  assert(PERKS.every(p=>Object.isFrozen(p)&&!('x' in p)),'Perks carry no position: each mode places them');
  assert.deepEqual(rackStation('ammo','CRATE',350),{name:'CRATE',type:'ammo',price:350,hex:'#67efbb',modelCaption:'RESTOCK · ALL WEAPONS'},'An ammunition crate');
  assert.equal(rackStation('glock','BENCH',250).modelCaption,'.45 SIDEARM · FOUR UPGRADE RANKS · THEN PISTOL AMMO');
  assert.deepEqual([shrineStation('double').price,shrineStation('grenades').price,ARMOR_STATION.price,forgeStation('F').price],[800,900,2500,5000],'Shrines, armor and the Forge at their prices');
  assert.deepEqual(RANK_RACKS,{smg:3,shotgun:2,bushmaster:5,rifle:6,lmg:4},'Rank racks and their equip keys');

  // ---- A run, a player and stations of its own -------------------------------------------
  const R=createRunState(),player={x:0,y:0,z:0},log=[],toasts=[];let playing=true,huds=0;
  R.inventory=Object.fromEntries(['glock','shotgun','smg','bushmaster','rifle','lmg'].map(k=>[k,{owned:k==='glock',ammo:5,reserve:10,weaponRank:0,forgeRank:0}]));R.weapon='glock';
  let full=false;
  const arms={selectWeapon:k=>{R.weapon=k;log.push('select '+k);},ammoFull:()=>full,restockWeapon:k=>log.push('restock '+k),refillAmmo:()=>log.push('refill'),grantPowerup:p=>log.push('power '+p),
    buyWeaponRank(k){const inv=R.inventory[k],next=nextRank(k,inv.weaponRank);if(!next)return false;if(R.points<next.price){log.push('short '+k);return false;}R.points-=next.price;inv.weaponRank++;log.push('rank '+k);return true;}};
  const armor=()=>({type:'armor',...ARMOR_STATION,setArmorTier(t){this.armorTier=t;this.used=t===ARMOR.nanoRanks.length+1;this.price=t===0?ARMOR.bodyPrice:(ARMOR.nanoRanks[t-1]||armorRank(t)).price;}});
  const forge=()=>({...forgeStation('FORGE'),forgeRank:0,setForgeRank(r){this.forgeRank=r;this.forgeMaximum=r>=FORGE.maxRank;this.price=FORGE.prices[r]??0;}});
  const at=(def,x,z,y=0)=>({...def,x,z,y});
  const S={perk:at({...PERKS[1],type:'perk'},0,0),iron:at({...PERKS[0],type:'perk'},30,0),ammo:at(rackStation('ammo','CRATE',350),10,0),bench:at(rackStation('glock','BENCH',250),20,0),smg:at(rackStation('smg','RAVEN SMG',1500),40,0),
    armorA:at(armor(),50,0),armorB:at(armor(),50,40),forgeA:at(forge(),60,0),forgeB:at(forge(),60,40),shrine:at(shrineStation('double'),70,0),upstairs:at(rackStation('ammo','UPPER CRATE',350),0,0,4.3),
    katana:at({type:'katana',name:'THE KATANA',price:3000},80,0),gate:at({type:'gate',name:'LOCKED GATE',price:0,locked:true},90,0),spent:at({type:'relic',name:'SPENT RELIC',price:0,used:true},100,0),
    ward:at({type:'relic',name:'GLOWING RELIC',price:0,used:true,glowing:true},110,0),hiddenCrate:at(rackStation('ammo','SECRET CRATE',350),120,0)};
  const stations=Object.values(S);
  const K=createStations({stations,player,state:R,isPlaying:()=>playing,arms,hud:{notify:t=>toasts.push(t),updateHud:()=>huds++},sound:{tone:(...a)=>log.push('tone '+a[0])},
    rules:{stillOpen:s=>s.glowing,hidden:s=>s.name==='SECRET CRATE',
      // The slot a new kind of station uses (Dead Tide's katana will).
      label:s=>s.type==='katana'?(R.inventory.katana?'OWNED':undefined):undefined,
      describe:s=>s.type==='katana'?'A blade for close work':undefined,
      use(s){if(s.type==='katana'&&!R.inventory.smg.owned){toasts.push('BUY THE SMG FIRST');return true;}},
      equip(s){if(s.type==='katana'&&R.inventory.katana){arms.selectWeapon('katana');return true;}},
      buy(s){if(s.type==='katana'){R.inventory.katana={owned:true};arms.selectWeapon('katana');toasts.push('KATANA ACQUIRED');return true;}}}});
  const go=(s,dz=1.5)=>{player.x=s.x;player.y=s.y;player.z=s.z+dz;return K.closest();};
  const last=()=>toasts.at(-1),tag=s=>K.label(s);
  // Reach: within 2.3 m on the same floor; locked, used and hidden stations are skipped.
  assert.equal(go(S.perk),S.perk,'The nearest station within reach');assert.equal(go(S.perk,2.4),null,'but not beyond 2.3 m');
  player.y=4.3;player.z=0;assert.equal(K.closest(),S.upstairs,'Each floor finds its own');
  assert.equal(go(S.gate),null,'Locked stations are skipped');assert.equal(go(S.spent),null,'and spent ones');assert.equal(go(S.ward),S.ward,'unless the mode keeps them open');assert.equal(go(S.hiddenCrate),null,'and the mode can hide one');
  // The prompt: key, name, price, then what it does.
  go(S.perk);assert.equal(K.prompt(S.perk,'E'),'<strong>E</strong> QUICKHANDS <span style="color:#d4b77a">1,500 ESSENCE</span><small>Reload twice as fast</small>','The prompt shows the key, the name, the price and the effect');
  // Short of essence; not while paused.
  R.points=100;K.interact();assert(last()==='NEED 1400 MORE ESSENCE'&&log.at(-1)==='tone 110','Short of essence it says how much more');
  playing=false;R.points=1e6;const before=toasts.length;K.interact();assert.equal(toasts.length,before,'Nothing happens unless play is live');playing=true;
  // Perks.
  K.interact();assert(R.perkOwned.has('quick')&&R.points===1e6-1500&&last()==='QUICKHANDS ACQUIRED'&&log.at(-1)==='tone 440'&&huds===1,'A perk is bought once');
  K.interact();assert(last()==='THIS PERK IS ALREADY ACTIVE'&&tag(S.perk)==='ACTIVE'&&K.describe(S.perk)==='PERK ACTIVE','and then shows as active');
  R.armorMax=100;R.armor=50;go(S.iron);K.interact();assert(R.maxHealth===200&&R.health===200&&R.armorMax===200&&R.armor===100,'Ironheart doubles health and scales armor with it');
  // Ammunition.
  go(S.ammo);K.interact();assert(log.includes('refill')&&last()==='AMMUNITION RESTOCKED','The crate restocks everything');
  // The pistol bench: its ranks in order, then 250 restocks.
  go(S.bench);assert.equal(S.bench.price,nextRank('glock',0).price,'The bench is priced at the next pistol rank');
  for(let i=0;i<4;i++)K.interact();assert.equal(R.inventory.glock.weaponRank,4,'and sells all four');
  assert(S.bench.price===250&&/ALL RANKS EARNED/.test(K.describe(S.bench)),'then restocks for 250');
  full=true;K.interact();assert(last()==='PISTOL AMMUNITION IS FULL'&&R.weapon==='glock'&&tag(S.bench)==='FULL','A full pistol is just equipped');
  full=false;const p=R.points;K.interact();assert(R.points===p-250&&log.includes('restock glock')&&last()==='GLOCK 21 AMMUNITION RESTOCKED','or restocked');
  // A weapon rack: buy it, then its ranks; short of a rank, it still hands the weapon over.
  go(S.smg);assert.equal(K.describe(S.smg),'Unlock a new weapon for this run');K.interact();
  assert(R.inventory.smg.owned&&R.weapon==='smg'&&last()==='RAVEN SMG ACQUIRED','A rack sells its weapon');
  assert(K.ranksAtRack(S.smg)&&tag(S.smg)===nextRank('smg',0).price.toLocaleString()+' ESSENCE','then its ranks');
  R.weapon='glock';const keep=R.points;R.points=10;K.interact();assert(R.weapon==='smg'&&log.at(-1)==='short smg','Short of a rank, the rack still hands over the weapon');R.points=keep;
  while(nextRank('smg',R.inventory.smg.weaponRank))K.interact();
  assert(tag(S.smg)==='ALL RANKS'&&K.describe(S.smg)==='ALL RANKS EARNED · WEAPON OWNED · PRESS 3 TO EQUIP','With every rank it says how to equip it');
  R.weapon='glock';K.interact();assert.equal(R.weapon,'smg','and equips it');
  // Armor: Aegis, then the Nano Shield ranks, at both stations.
  go(S.armorA);assert(/^Absorbs 200 damage/.test(K.describe(S.armorA)),'Aegis absorbs a full health bar');K.interact();
  assert(R.armorTier===1&&R.armor===200&&S.armorB.armorTier===1&&S.armorB.price===ARMOR.nanoRanks[0].price,'Aegis is bought and both stations offer the next rank');
  for(let i=0;i<3;i++)K.interact();assert(R.armorTier===4&&S.armorA.used&&S.armorB.used,'then each Nano Shield rank');
  K.interact();assert(last()===`${armorRank(4).name} IS ALREADY ACTIVE`&&/^ACTIVE/.test(K.describe(S.armorA)),'and the last stays active');
  // The Soul Forge forges the held weapon; every forge shows its rank.
  R.weapon='smg';R.reloadLeft=2;R.reloadDuration=4;go(S.forgeA);K.updateForges();K.interact();
  assert(R.inventory.smg.forgeRank===1&&R.reloadLeft===1.5&&R.reloadDuration===3&&/^SOUL FORGE RANK 1\/3/.test(last()),'The Forge ranks the held weapon and speeds a reload in progress');
  K.updateForges();assert(S.forgeA.forgeRank===1&&S.forgeB.forgeRank===1,'Both forges show it');
  K.interact();K.updateForges();K.interact();K.updateForges();K.interact();assert(last()==='SOUL FORGE RANK 3 · THIS WEAPON IS FULLY FORGED'&&tag(S.forgeA)==='MAX RANK','At rank 3 it is fully forged');
  // The shrine.
  go(S.shrine);K.interact();assert.equal(log.filter(l=>l==='tone 440').length>0&&log.includes('power double'),true,'A shrine grants its power');
  // A kind of its own: the mode's label, description and every step of the purchase.
  go(S.katana);R.inventory.smg.owned=false;K.interact();assert.equal(last(),'BUY THE SMG FIRST','The mode decides first');R.inventory.smg.owned=true;
  assert.equal(K.prompt(S.katana,'USE'),'<strong>USE</strong> THE KATANA <span style="color:#d4b77a">3,000 ESSENCE</span><small>A blade for close work</small>','with its own description and the shared price tag');
  const k=R.points;K.interact();assert(R.points===k-3000&&R.inventory.katana.owned&&R.weapon==='katana'&&last()==='KATANA ACQUIRED','the shared price check, then its own purchase');
  R.weapon='glock';K.interact();assert(R.weapon==='katana'&&R.points===k-3000&&tag(S.katana)==='OWNED','and equipping it once owned');
  console.log(`PASS: shared stations — imports only the rank, armor, Forge and power-up rules (${closure.size} files, none of them mansion builders or state), game.js keeps no copy; with stations of its own it finds the nearest within 2.3 m on the same floor (skipping locked, spent and hidden ones), prompts with key, name, price and effect, charges essence or says how much more, sells perks once (Ironheart doubling health and armor), restocks, sells the Glock's four ranks then 250 restocks, sells a rack's weapon then its ranks (handing it over when short), Aegis and all three Nano Shield ranks at both stations, three Forge ranks on the held weapon shown at every forge, and shrines; a kind of station it has never seen (a katana) plugs in through the mode's rules.`);
}

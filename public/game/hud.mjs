import * as T from './three.module.js';
import {weapons} from './weapon-stats.mjs?v=204';
import {rankInfo} from './weapon-ranks.mjs?v=191';
import {armorRank} from './armor.mjs?v=94';
import {POWERUPS,powerupIcon} from './powerups.mjs?v=190';

// The HUD (v199, Dead Tide step 1), for any mode: health, armor, essence, kills, the
// held weapon and its ammunition, grenades, perks and power-ups; the reload bar;
// toasts and banners; and the hit marker and damage flash. Moved from game.js
// unchanged; scripts/golden-trace.mjs checks the mansion's page identically, element by
// element. A mode keeps its own readouts (the mansion: its wave, frenzy, bone chips,
// events, curse and Sir Blackthorn) and passes the page helpers (dom), its mode
// (session), the run (state), its perks and its own badges (rules); the README's
// version 199 section lists every field.
export function createHud({dom,session,state:S,perks,rules}){
  const {$,setMarkup,setOpacity}=dom;
  const clamp=T.MathUtils.clamp;
  let hitTime=0,damageFlash=0,nukeFlashTime=0,toastTime=0,bannerTime=0;
  let reloadHudVisible=false,reloadHudProgress=-1,reloadHudPercent=-1;
  function notify(s,duration=2.6){$('toast').textContent=s;toastTime=duration;}
  function announce(title,sub=''){ $('banner').innerHTML=title+(sub?`<small>${sub}</small>`:'');bannerTime=3.2;}
  // Reuse two HUD nodes; transform the fill each frame without changing layout.
  function updateReloadHud(){
    const visible=S.reloadLeft>0&&S.reloadDuration>0&&session.mode!=='menu'&&session.mode!=='dead';
    const progress=visible?clamp(1-S.reloadLeft/S.reloadDuration,0,1):0;
    if(visible!==reloadHudVisible){$('reloadProgress').classList.toggle('hidden',!visible);reloadHudVisible=visible;}
    if(progress!==reloadHudProgress){$('reloadProgressFill').style.transform=`scaleX(${progress})`;reloadHudProgress=progress;}
    const percent=Math.round(progress*100);
    if(percent!==reloadHudPercent){$('reloadProgress').setAttribute('aria-valuenow',String(percent));reloadHudPercent=percent;}
  }
  // Health, armor, essence, kills, the held weapon and its ammunition, grenades, perks
  // and power-ups. The mode adds its own badges (the mansion: Bella).
  function updateVitals(){
    const rank=armorRank(S.armorTier);$('armorLabel').textContent=rank?.name||'AEGIS SHIELD';$('armorHud').classList.toggle('nano',!!rank);$('armorHud').classList.toggle('nanoRank2',rank?.rank===2);$('armorHud').classList.toggle('nanoRank3',rank?.rank===3);const recovering=!!rank&&S.armor<S.armorMax;const shieldWait=rank?Math.max(0,rank.regenDelay-(S.runTime-S.lastHurt)):0;$('armorStatus').classList.toggle('hidden',!rank);$('armorStatus').textContent=!recovering?'FULL SHIELD':shieldWait>0?`RECHARGE IN ${Math.ceil(shieldWait)}s`:`${rank.regenDelay===0?'CONTINUOUS':'RECHARGING'} · ${rank.regenRate} SHIELD/S`;$('armorHud').classList.toggle('regenerating',recovering&&shieldWait===0&&session.mode==='playing');$('armorHud').classList.toggle('depleted',S.armorMax>0&&S.armor<=0);$('armorHud').classList.toggle('hidden',S.armorMax===0);$('armorValue').textContent=Math.ceil(S.armor)+' / '+S.armorMax;$('armorBar').style.width=(S.armorMax?S.armor/S.armorMax*100:0)+'%';
    const inv=S.inventory[S.weapon];$('points').textContent=S.points.toLocaleString();$('kills').textContent=S.kills;$('healthLabel').textContent=S.doubleTime>0?`SPECTRAL FURY · ${Math.ceil(S.doubleTime)}s`:'VITAL SIGNS';$('health').textContent=Math.max(0,Math.ceil(S.health));$('healthBar').style.width=`${Math.max(0,S.health/S.maxHealth*100)}%`;$('healthReadout').classList.toggle('critical',S.health<S.maxHealth*.35);$('healthReadout').classList.toggle('spectral',S.doubleTime>0);$('weaponName').textContent=weapons[S.weapon].name+(inv.weaponRank?` / ${rankInfo(S.weapon,inv.weaponRank).name.toUpperCase()}`:'')+(inv.forgeRank?` / FORGED ${inv.forgeRank}/3`:'');$('ammo').textContent=inv.ammo;$('reserve').textContent=inv.reserve;$('reloadStatus').innerHTML=`R RELOAD <span> · </span> G GRENADE ${S.grenadeTime>0?'∞ · '+Math.ceil(S.grenadeTime)+'s':S.grenades}`;
    const perkMarkup=perks.filter(p=>S.perkOwned.has(p.id)).map(p=>`<span title="${p.name}" style="color:${p.hex}">${p.icon}</span>`).join('');setMarkup('perks',perkMarkup);const powerupMarkup=[['double',S.doubleTime],['grenades',S.grenadeTime]].filter(([,time])=>time>0).map(([type,time])=>`<div class="powerupBadge" style="color:${POWERUPS[type].hex}">${powerupIcon(type)}<span>${POWERUPS[type].name}<b>${Math.ceil(time)}s</b></span></div>`).join('')+rules.badges();setMarkup('powerups',powerupMarkup);
  }
  // The hit marker, damage flash (and the low-health vignette), toasts and banners fade.
  function markHit(headshot){hitTime=headshot?.22:.14;}
  function flashDamage(shielded){damageFlash=shielded?.28:.75;}
  function clearFlashes(){damageFlash=nukeFlashTime=hitTime=0;}
  function clearToast(){toastTime=0;setOpacity('toast',0);}
  function clearBanner(){bannerTime=0;setOpacity('banner',0);}
  function fadeHud(dt,playing){hitTime=Math.max(0,hitTime-dt);setOpacity('hit',hitTime>0?1:0);damageFlash=Math.max(0,damageFlash-dt*.8);setOpacity('damage',Math.max(damageFlash,playing&&S.health<30?.16:0));nukeFlashTime=Math.max(0,nukeFlashTime-dt*1.5);setOpacity('nukeFlash',nukeFlashTime);toastTime=Math.max(0,toastTime-dt);setOpacity('toast',toastTime>0?1:0);bannerTime=Math.max(0,bannerTime-dt);setOpacity('banner',bannerTime>0?1:0);}
  return {notify,announce,updateReloadHud,updateVitals,markHit,flashDamage,clearFlashes,clearToast,clearBanner,fadeHud,
    get hitTime(){return hitTime;},get damageFlash(){return damageFlash;},get nukeFlashTime(){return nukeFlashTime;},get toastTime(){return toastTime;},get bannerTime(){return bannerTime;}};
}

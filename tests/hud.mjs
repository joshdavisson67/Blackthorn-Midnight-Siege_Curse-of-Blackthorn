import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';

// v199 (Dead Tide step 1): the HUD's shared readouts are a module. The mansion's page
// still updates identically (scripts/golden-trace.mjs hashes every element at every
// sample); this test runs the HUD on a bare page of its own with a run of its own.
export async function verifyHud(){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  assert.deepEqual(imports('hud.mjs'),['three.module.js','core.mjs','weapon-ranks.mjs','armor.mjs','powerups.mjs'],'The HUD imports only shared modules');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('hud.mjs');
  const mansion=['vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','world-event-visuals.mjs','curse.mjs','curse-ui.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','lighting.mjs'];
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing the HUD loads builds or holds the mansion');
  const src=read('game.js');
  for(const name of ['notify','announce','updateReloadHud'])assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  for(const name of ['hitTime','damageFlash','toastTime','bannerTime','reloadHudVisible'])assert(!new RegExp(`\\b${name}\\b`).test(src),`nor ${name}`);
  assert(/const hud=createHud\(\{/.test(src)&&/function updateHud\(\)\{[\s\S]*?updateVitals\(\);\}/.test(src),'The mansion keeps its own readouts and calls the shared ones');

  // ---- A bare page and a run of its own ---------------------------------------------
  const ids=['toast','banner','reloadProgress','reloadProgressFill','armorLabel','armorHud','armorStatus','armorValue','armorBar','points','kills','healthLabel','health','healthBar','healthReadout','weaponName','ammo','reserve','reloadStatus','perks','powerups','hit','damage','nukeFlash'];
  const {document}=parseHTML(`<!doctype html><html><body>${ids.map(id=>`<div id="${id}"></div>`).join('')}</body></html>`);
  const $=id=>document.getElementById(id),opacity=id=>$(id).style.opacity;
  const {createHud}=await import('../.qa/hud.mjs');const {createRunState}=await import('../.qa/player.mjs');const {weapons}=await import('../.qa/core.mjs');const {POWERUPS}=await import('../.qa/powerups.mjs');
  const S=createRunState();S.inventory={glock:{ammo:9,reserve:40,weaponRank:0,forgeRank:0,owned:true}};let mode='playing';
  const perks=[{id:'stride',name:'NIGHTSTRIDE',hex:'#abc',icon:'S'},{id:'eye',name:'DEADEYE',hex:'#def',icon:'E'}];
  const hud=createHud({dom:{$,setMarkup:(id,m)=>{$(id).innerHTML=m;},setOpacity:(id,v)=>{$(id).style.opacity=v;}},session:{get mode(){return mode;}},state:S,perks,rules:{badges:()=>'<i id="modeBadge"></i>'}});
  // The readouts follow the run.
  S.points=1234;S.kills=7;hud.updateVitals();
  assert($('points').textContent==='1,234'&&$('kills').textContent==='7'&&$('health').textContent==='100'&&$('healthBar').style.width==='100%','Essence, kills and health are shown');
  assert($('weaponName').textContent===weapons.glock.name&&$('ammo').textContent==='9'&&$('reserve').textContent==='40'&&/G GRENADE 3/.test($('reloadStatus').innerHTML),'and the held weapon, its ammunition and the grenade count');
  assert($('armorHud').classList.contains('hidden')&&$('powerups').innerHTML==='<i id="modeBadge"></i>'&&$('perks').innerHTML==='','No armor, perks or power-ups yet; the mode adds its own badge');
  S.health=30;S.doubleTime=4.2;S.grenadeTime=7.5;S.perkOwned.add('eye');S.inventory.glock.weaponRank=1;S.inventory.glock.forgeRank=2;hud.updateVitals();
  assert($('healthReadout').classList.contains('critical')&&$('healthReadout').classList.contains('spectral')&&$('healthLabel').textContent==='SPECTRAL FURY · 5s','Low health is critical; double damage shows its countdown');
  assert(/FORGED 2\/3/.test($('weaponName').textContent)&&/ \/ /.test($('weaponName').textContent)&&/∞ · 8s/.test($('reloadStatus').innerHTML),'Ranks, the Forge and infinite grenades are named');
  assert(/DEADEYE/.test($('perks').innerHTML)&&!/NIGHTSTRIDE/.test($('perks').innerHTML),'Only owned perks show');
  assert($('powerups').innerHTML.includes(POWERUPS.double.name)&&$('powerups').innerHTML.includes(POWERUPS.grenades.name)&&$('powerups').innerHTML.endsWith('<i id="modeBadge"></i>'),'Active power-ups show, the mode’s badge last');
  S.armorTier=2;S.armorMax=50;S.armor=20;S.lastHurt=0;S.runTime=99;hud.updateVitals();
  assert(!$('armorHud').classList.contains('hidden')&&$('armorHud').classList.contains('nano')&&$('armorValue').textContent==='20 / 50'&&$('armorBar').style.width==='40%','Nano Shield armor shows its rank and charge');
  assert($('armorHud').classList.contains('regenerating'),'and regenerates while play is live');mode='paused';hud.updateVitals();assert(!$('armorHud').classList.contains('regenerating'),'but not while paused');mode='playing';
  // The reload bar.
  S.reloadDuration=2;S.reloadLeft=.5;hud.updateReloadHud();
  assert(!$('reloadProgress').classList.contains('hidden')&&$('reloadProgressFill').style.transform==='scaleX(0.75)'&&$('reloadProgress').getAttribute('aria-valuenow')==='75','The reload bar fills as the reload runs');
  mode='menu';hud.updateReloadHud();assert($('reloadProgress').classList.contains('hidden'),'and hides on the menu');mode='playing';
  // Toasts, banners, the hit marker and the damage flash fade on time.
  hud.notify('HELLO');hud.announce('WAVE 01','THE ESTATE HAS AWAKENED');const fade=(s,playing=true)=>{for(let i=0;i<Math.round(s*60);i++)hud.fadeHud(1/60,playing);};
  hud.markHit(true);hud.flashDamage(false);fade(.1);
  assert($('toast').textContent==='HELLO'&&opacity('toast')==1&&$('banner').innerHTML==='WAVE 01<small>THE ESTATE HAS AWAKENED</small>'&&opacity('banner')==1&&opacity('hit')==1,'A toast, a banner and the hit marker show');
  fade(.2);assert(opacity('hit')==0,'The headshot marker lasts .22 s');
  fade(2.4);assert(opacity('toast')==0&&opacity('banner')==1,'The toast lasts 2.6 s');fade(.6);assert(opacity('banner')==0,'the banner 3.2 s');
  S.health=20;fade(1);assert(opacity('damage')==.16,'At low health a faint red stays on while playing');fade(.1,false);assert(opacity('damage')==0,'but not while paused');
  hud.flashDamage(true);hud.fadeHud(0,true);assert(opacity('damage')==.28,'A hit the armor soaks flashes faintly');hud.clearFlashes();hud.fadeHud(0,false);assert(opacity('damage')==0,'Clearing removes it');
  console.log(`PASS: shared HUD — imports only shared modules (${closure.size} files, none of them mansion builders or state), game.js keeps no copy and calls it from its own updateHud; on a bare page with its own run it shows essence, kills, health (critical and spectral), the weapon with its ranks, Forge and ammunition, grenades, owned perks, power-ups with the mode's badge last, Nano Shield armor (regenerating only while playing), the reload bar, and toasts, banners, hit markers and damage flashes that fade on time.`);
}

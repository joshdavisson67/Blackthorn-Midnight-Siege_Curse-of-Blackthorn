import assert from 'node:assert/strict';
import vm from 'node:vm';
import {parseHTML} from 'linkedom';
import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {writeThreeStub} from './qa-stub.mjs';

// v204 (Dead Tide step 2): Dead Tide's own page and the grey-box island. Run on its own
// (its page is a different document from the mansion's): node tests/dead-tide.mjs.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
const {CURRENT_VERSION:V}=await import('../public/game/version.mjs');

// ---- 1. Runtime isolation: neither mode loads the other ---------------------------------
const imports=f=>[...read(f).matchAll(/(?:^\s*(?:import|export)[^'"]*?from\s*|^\s*import\s*|import\(\s*)['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
function closure(...entries){const seen=new Set(),walk=f=>{if(seen.has(f))return;seen.add(f);if(/\.(m?js)$/.test(f))for(const g of imports(f))walk(g);};entries.forEach(walk);return seen;}
const pageLoads=html=>[...read(html).matchAll(/(?:src|href)="([\w.-]+?)(?:\?v=(\d+))?"/g)].map(m=>[m[1],m[2]]);
const tidePage=pageLoads('tide.html'),mansionPage=pageLoads('index.html');
assert.deepEqual(tidePage.map(([f])=>f),['style.css','tide.css','tide-boot.js'],'Dead Tide’s page loads the shared styles, its own and its own boot script, nothing else');
assert(tidePage.every(([,v])=>v===String(V)),'with this version’s cache keys');
assert(!mansionPage.some(([f])=>/tide/.test(f))&&!/tide/i.test(read('boot.js')),'The mansion’s page and boot script never mention Dead Tide');
const tide=closure('tide-boot.js'),mansion=closure('boot.js');
// Everything that builds, lays out, lights or runs the mansion, by name.
const MANSION_ONLY=['boot.js','game.js','core.mjs','estate-layout.mjs','graveyard-layout.mjs','cellar-layout.mjs','shed-layout.mjs','vertical.mjs','cellar.mjs','graveyard.mjs','shed.mjs','mansion-expansion.mjs','second-floor.mjs','upper-shell.mjs','exterior-stairs.mjs','facade.mjs','furnishings.mjs','rugs.mjs','signage.mjs','grounds.mjs','estate-detail.mjs','rotunda-bell.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','curse.mjs','curse-ui.mjs','world-events.mjs','world-event-visuals.mjs','blackout.mjs','camp-spawns.mjs','lighting.mjs','environment-lights.mjs','combat-lights.mjs','minimap-settings.mjs','leaderboard.mjs','changelog.mjs','changelog-data.mjs','column-surfaces.mjs'];
for(const f of MANSION_ONLY){assert(existsSync(resolve(game,f)),`${f} exists`);assert(mansion.has(f),`the mansion loads ${f}`);}
assert.deepEqual([...tide].filter(f=>MANSION_ONLY.includes(f)),[],'Dead Tide loads nothing that builds, lays out, lights or runs the mansion');
const TIDE_ONLY=['tide-boot.js','tide.mjs','island.mjs'];
assert.deepEqual([...mansion].filter(f=>TIDE_ONLY.includes(f)),[],'and the mansion loads nothing of Dead Tide');
const shared=[...tide].filter(f=>mansion.has(f));
for(const f of ['display.mjs','audio.mjs','first-person.mjs','player.mjs','hud.mjs','controls.mjs','weapon-runtime.mjs','enemy-combat.mjs','weapon-stats.mjs','batching.mjs','stations.mjs','grenade-throw.mjs','touch-controls.mjs','gamepad-controls.mjs','input-scheme.mjs'])
  assert(shared.includes(f),`Dead Tide plays with the shared ${f}`);
assert(!/three\.module|game\.js|boot\.js|tide/.test(read('modes.html').replace(/Dead Tide|data-active="tide"|tideEl|tideNote|\.tide|drawTide|--tide[\w-]*|id="tide"|'tide'|tide\b/g,'')),'The mode picker still loads no game code');
console.log(`PASS: Dead Tide loads only its page, tide.css, tide-boot.js and ${tide.size-1} modules (${shared.length} of them shared with the mansion), none of the ${MANSION_ONLY.length} that build, lay out, light or run the mansion; the mansion loads nothing of Dead Tide.`);

// ---- 2. Its boot script: enter in the click, report failures -----------------------------
{
  const boot=read('tide-boot.js'),load=`import('./tide.mjs?v=${V}')`;assert(boot.includes(load),'The boot script loads this version of tide.mjs');
  const source=boot.replace(load,'loadGame()');
  function fixture(){
    const elements=new Map(),events={},state={starts:0,inClick:false,gestures:[],reloaded:0,href:null};
    function get(id){if(!elements.has(id)){const classes=new Set(id==='error'?['hidden']:[]);elements.set(id,{disabled:false,textContent:'',innerHTML:'',classList:{add(c){classes.add(c)},remove(c){classes.delete(c)},contains(c){return classes.has(c)}},addEventListener(name,fn){this[name]=fn;}});}return elements.get(id);}
    let resolveLoad,rejectLoad;const loaded=new Promise((yes,no)=>{resolveLoad=yes;rejectLoad=no;});
    const window={addEventListener(name,fn){events[name]=fn;}};const location={reload(){state.reloaded++;},set href(v){state.href=v;},get href(){return state.href;}};
    vm.runInNewContext(source,{document:{getElementById:get},window,location,setTimeout(){return 1;},clearTimeout(){},loadGame:()=>loaded});
    return {get,state,window,resolveLoad,rejectLoad,ready(start=()=>{}){window.Blackthorn.ready(()=>{state.starts++;state.gestures.push(state.inClick);start();});},click(){state.inClick=true;try{get('start').click();}finally{state.inClick=false;}}};
  }
  const f=fixture();assert(f.get('start').disabled&&f.get('start').textContent==='PREPARING THE ISLAND…');f.click();assert.equal(f.state.starts,0,'No start before the island is ready');
  f.ready();assert(!f.get('start').disabled);assert.equal(f.get('start').innerHTML,'WADE ASHORE <span>→</span>');assert(f.get('loading').classList.contains('hidden'));
  f.click();assert.deepEqual([f.state.starts,f.state.gestures[0]],[1,true],'Wade Ashore starts the run inside the click, so mouse capture keeps its gesture');f.click();assert.equal(f.state.starts,1,'A second click does nothing');
  f.get('modesLink').click();assert.equal(f.state.href,'modes.html','◂ ALL MODES returns to the mode picker');
  const broken=fixture();broken.rejectLoad(new Error('A module failed'));await Promise.resolve();await Promise.resolve();assert(!broken.get('error').classList.contains('hidden')&&broken.get('errorDetails').textContent==='A module failed');broken.get('retry').click();assert.equal(broken.state.reloaded,1);
  const thrown=fixture();thrown.ready(()=>{throw new Error('Launch failed');});thrown.click();assert.equal(thrown.get('errorDetails').textContent,'Launch failed');
  console.log('PASS: Dead Tide’s boot script waits for the island, starts the run inside the Wade Ashore click (once), returns to the mode picker, and reports load and launch failures with a reload button.');
}

// ---- 3. The island ----------------------------------------------------------------------
const {ISLAND,coastRadius,shoreFraction,groundHeight,buildIsland}=await import('../public/game/island.mjs');
const T=await import('../public/game/three.module.js');
{
  let low=Infinity,high=-Infinity,steepest=0;for(let a=0;a<Math.PI*2;a+=.005){const r=coastRadius(a);low=Math.min(low,r);high=Math.max(high,r);}
  assert(low>48&&high<78,`The coast runs between ${low.toFixed(1)} and ${high.toFixed(1)} m from the centre`);
  const H=ISLAND.hill,summit=groundHeight(H.x,H.z);let top=-Infinity;
  for(let x=-90;x<=90;x+=1.5)for(let z=-90;z<=90;z+=1.5)top=Math.max(top,groundHeight(x,z));
  assert(Math.abs(top-summit)<1e-9&&summit>13,'Radio Hill is the highest ground');
  for(let a=0;a<6.28;a+=.3)for(const d of [1,4,7.9])assert(Math.abs(groundHeight(H.x+Math.cos(a)*d,H.z+Math.sin(a)*d)-summit)<1e-6,'and its top is flat');
  // Every bearing has a beach: the ground crosses the waterline on a slope, never flat
  // (where the sea would flicker against the sand).
  for(let a=0;a<Math.PI*2;a+=.05){
    let r=30;while(groundHeight(Math.cos(a)*r,Math.sin(a)*r)>0)r+=.05;
    const slope=(groundHeight(Math.cos(a)*(r-.5),Math.sin(a)*(r-.5))-groundHeight(Math.cos(a)*(r+.5),Math.sin(a)*(r+.5)));
    assert(slope>.05&&slope<.25,`The beach meets the sea on a gentle slope at bearing ${a.toFixed(2)}`);
  }
  for(let x=-90;x<=90;x+=.5)for(let z=-90;z<=90;z+=.5){if(groundHeight(x,z)<-ISLAND.wade)continue;
    const g=Math.hypot(groundHeight(x+.25,z)-groundHeight(x-.25,z),groundHeight(x,z+.25)-groundHeight(x,z-.25))/.5;steepest=Math.max(steepest,g);}
  assert(steepest<.85,`Everywhere you can stand is walkable (steepest ${(Math.atan(steepest)*180/Math.PI).toFixed(0)}°)`);
}
const scene=new T.Scene(),world=new T.Group();scene.add(world);const I=buildIsland({scene,world});
{
  const S=ISLAND.shack,W=ISLAND.tower,H=ISLAND.hill,flat=(x,z)=>Math.hypot(x-H.x,z-H.z)<H.flat;
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){assert(flat(S.x+dx*(S.w/2+.15),S.z+dz*(S.d/2+.15)),'The shack stands on the flat summit');assert(flat(W.x+dx*W.base/2,W.z+dz*W.base/2),'and so does the tower');}
  const t=shoreFraction(I.wreckAt.x,I.wreckAt.z),h=groundHeight(I.wreckAt.x,I.wreckAt.z);assert(t>.9&&t<1.05&&h>-.6&&h<1.2,'The wreck lies on the beach, at the water’s edge');
  const sp=ISLAND.spawn,spawnY=groundHeight(sp.x,sp.z);assert(spawnY>.3&&!I.isBlocked(sp.x,sp.z,.32,I.colliders,null,spawnY,1.8)&&I.zoneAt(sp.x,sp.z)==='SOUTH BEACH','Runs start on dry sand on the south beach, in the open');
  for(const p of I.palms){assert(groundHeight(p.x,p.z)>.3,'Palms grow on land');assert(Math.hypot(p.x-sp.x,p.z-sp.z)>3,'clear of the landing spot');}
  for(const r of I.rocks)assert(groundHeight(r.x,r.z)>-.4,'Rocks sit on land or in the shallows');
  assert(I.palms.length>=40&&I.rocks.length>=20,'The island has its palms and rocks');
  const names=new Set(world.children.map(o=>o.name));
  for(const n of ['Island ground','The sea','Radio shack','Radio tower','Tower beacon','Wreck','Palm trunks','Palm crowns','Rocks'])assert(names.has(n),`The island has ${n.toLowerCase()}`);
  let meshes=0,triangles=0;world.traverse(o=>{if(o.isMesh){meshes++;const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  assert(meshes<80&&triangles<60000,`The grey-box island is light: ${meshes} meshes, ${Math.round(triangles/1000)}k triangles`);
  // The beacon blinks: on for 0.55 s of every 1.6 s.
  I.update(.1);assert(I.beaconLight.intensity>0);I.update(.9);assert.equal(I.beaconLight.intensity,0);I.update(1.7);assert(I.beaconLight.intensity>0,'The tower’s red beacon blinks');
  console.log(`PASS: the island: a coast 50–75 m out, Radio Hill highest and flat-topped with the shack and tower on it, a sloping beach on every bearing, walkable everywhere you can stand, the wreck at the water’s edge, ${I.palms.length} palms and ${I.rocks.length} rocks on land, the south-beach landing spot clear, ${meshes} meshes and ${Math.round(triangles/1000)}k triangles, and a blinking beacon.`);
}

// ---- 4. Playing Dead Tide ---------------------------------------------------------------
const qaDir=resolve(root,'.qa-tide');mkdirSync(qaDir,{recursive:true});writeThreeStub(qaDir);
for(const f of closure('tide.mjs'))if(f!=='three.module.js'&&f!=='tide.mjs')writeFileSync(resolve(qaDir,f),read(f));
writeFileSync(resolve(qaDir,'tide.mjs'),read('tide.mjs')+`
export const qa={tick,keys,resetRun,returnToMenu,shoot,reload,grenade,selectWeapon,hurtPlayer,openControls,closeControls,explode:p=>combat.explode(p),
  setKeys(list){keys.clear();for(const k of list)keys.add(k);},setAim(yaw,pitch){session.lookYaw=yaw;session.lookPitch=pitch;},
  setPlayer(x,z,y=groundHeight(x,z)){player.set(x,y,z);runState.grounded=true;runState.jumpV=0;},
  get(){return {mode:session.mode,pointer:session.pointer,player,run:runState,session,camera,island,zone,effects,firstPerson,gunRoot,renderer,scene,world,explosionFx,markPool,display};}};`);
const {document,window:domWindow}=parseHTML(read('tide.html'));
for(const select of document.querySelectorAll('select'))Object.defineProperty(select,'value',{configurable:true,get(){return (select.querySelector('option[selected]')||select.querySelector('option'))?.getAttribute('value')||'';},set(value){for(const option of select.querySelectorAll('option'))option.toggleAttribute('selected',option.getAttribute('value')===String(value));}});
const ctx=new Proxy({createRadialGradient(){return {addColorStop(){}};},createLinearGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:(()=>{});},set(o,k,v){o[k]=v;return true;}});
domWindow.HTMLCanvasElement.prototype.getContext=()=>ctx;
const $=id=>document.getElementById(id),listeners={},windowEvents={},canvas=$('game');canvas.events={};canvas.addEventListener=(name,fn)=>{canvas.events[name]=fn;};
const acquire=()=>{document.pointerLockElement=canvas;listeners.pointerlockchange?.();return Promise.resolve();};canvas.requestPointerLock=acquire;
document.addEventListener=(name,fn)=>{listeners[name]=fn;};document.exitPointerLock=()=>{document.pointerLockElement=null;listeners.pointerlockchange?.();};
let enter=null;const storage=new Map();
globalThis.document=document;globalThis.window={addEventListener(name,fn){windowEvents[name]=fn;},Blackthorn:{ready(fn){enter=fn;}}};
Object.assign(globalThis,{devicePixelRatio:1,innerWidth:1280,innerHeight:720,requestAnimationFrame(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}});
$('sound').checked=true;
const random=Math.random;Math.random=()=>.25;   // impact marks and the like, made repeatable
const {qa}=await import(pathToFileURL(resolve(qaDir,'tide.mjs')).href);
let clock=performance.now();const frames=(n,step=1000/60)=>{for(let i=0;i<n;i++){clock+=step;qa.tick(clock);}};
const G=()=>qa.get(),key=e=>listeners.keydown({preventDefault(){},...e});
try{
  // Loading: the island is built, its shaders compiled, and the title screen waits.
  assert(typeof enter==='function'&&$('loading').classList.contains('hidden')&&!$('menu').classList.contains('hidden')&&G().mode==='menu','The island loads to its title screen');
  assert(G().renderer.compileCalls?.length===2,'Every shader is compiled under the loading screen (world and weapon)');
  const top=new Set(G().world.children.map(o=>o.name));
  assert.deepEqual([...top].sort(),['Blood particles','Bullet impact marks','Explosion effects','Island ground','Palm crowns','Palm trunks','Radio shack','Radio tower','Rocks','The sea','Tower beacon','Wreck'].sort(),'The world holds the island and the shared effects, nothing else');
  frames(30);const orbit=G().camera.position.clone();frames(30);assert(orbit.distanceTo(G().camera.position)>.05&&!G().gunRoot.visible,'The title screen circles the island with no gun in view');
  // Enter: capture in the click, then play from the south beach.
  enter();await Promise.resolve();assert.equal(G().mode,'playing');assert(G().pointer&&$('menu').classList.contains('hidden')&&!$('hud').classList.contains('hidden'));
  const sp=ISLAND.spawn;assert(Math.abs(G().player.x-sp.x)<1e-9&&Math.abs(G().player.z-sp.z)<1e-9&&Math.abs(G().player.y-groundHeight(sp.x,sp.z))<1e-9,'The run starts on the south beach');
  frames(2);assert($('location').textContent.includes('SOUTH BEACH')&&$('ammo').textContent==='13'&&$('reserve').textContent==='78'&&$('points').textContent==='500'&&$('health').textContent==='100','The HUD shows the beach, a full pistol, 500 essence and full health');
  // Walking north up the beach, the feet follow the ground.
  qa.setAim(0,0);qa.setKeys(['KeyW']);frames(60);qa.setKeys([]);frames(1);
  let p=G().player;assert(sp.z-p.z>3.3&&sp.z-p.z<3.8,`Walking covers about 3.6 m a second (${(sp.z-p.z).toFixed(2)} m)`);assert(Math.abs(p.y-groundHeight(p.x,p.z))<.02,'with the feet on the ground');
  const camY=G().camera.position.y;assert(Math.abs(camY-(p.y+1.68))<.03,'and the eye 1.68 m above them');
  qa.setKeys(['KeyW','ShiftLeft']);const z0=G().player.z;frames(60);qa.setKeys([]);assert(z0-G().player.z>5,'Sprinting is faster');
  // Jumping: up, and back down onto the sand.
  key({code:'Space'});frames(1);assert(!G().run.grounded&&G().player.y>groundHeight(G().player.x,G().player.z),'Space jumps');
  let peak=0;for(let i=0;i<60;i++){frames(1);peak=Math.max(peak,G().player.y-groundHeight(G().player.x,G().player.z));}listeners.keyup({code:'Space'});
  assert(G().run.grounded&&peak>.6&&peak<.9,`and lands again (${peak.toFixed(2)} m up)`);
  // Climbing Radio Hill from the beach on foot.
  // (Boulders lie on its flanks; take a line between them, as a player would.)
  const H=ISLAND.hill,clearLine=b=>{for(let d=8;d<=34;d+=.25){const x=H.x+Math.cos(b)*d,z=H.z+Math.sin(b)*d;if(I.isBlocked(x,z,.45,I.colliders,null,groundHeight(x,z),1.8))return false;}return true;};
  let bearing=Math.PI/2;while(!clearLine(bearing))bearing+=.05;
  qa.setPlayer(H.x+Math.cos(bearing)*34,H.z+Math.sin(bearing)*34);qa.setAim(Math.atan2(Math.cos(bearing),Math.sin(bearing)),0);qa.setKeys(['KeyW','ShiftLeft']);let reached=false;for(let i=0;i<60*10&&!reached;i++){frames(1);if(G().zone.includes('SUMMIT'))reached=true;}qa.setKeys([]);
  assert(reached&&G().player.y>14,`Sprinting straight up Radio Hill reaches the summit (stopped at ${G().player.x.toFixed(1)},${G().player.z.toFixed(1)} ${G().player.y.toFixed(1)} m, ${G().zone})`);
  // The shack: in through the door, never through a wall, and the roof stops a jump.
  const S=ISLAND.shack,summitY=I.summit;
  qa.setPlayer(S.x,S.z+S.d/2+2);qa.setAim(0,0);qa.setKeys(['KeyW']);frames(110);qa.setKeys([]);
  assert(G().zone==='RADIO SHACK'&&Math.abs(G().player.y-(summitY+S.deck))<.02,'The door leads in, up onto the shack’s deck');
  key({code:'Space'});peak=0;for(let i=0;i<60;i++){frames(1);peak=Math.max(peak,G().player.y);}listeners.keyup({code:'Space'});
  assert(peak+1.8<=summitY+S.deck+S.wall+.01,'Jumping inside, the head stops under the roof');
  qa.setKeys(['KeyW']);frames(240);qa.setKeys([]);assert(G().player.z>S.z-S.d/2+.3,'The back wall stops you');
  qa.setPlayer(S.x+S.w/2+1.5,S.z);qa.setAim(Math.PI/2,0);qa.setKeys(['KeyW']);frames(120);qa.setKeys([]);assert(G().player.x>S.x+S.w/2,'and so does the side wall');
  // The sea: wade into the shallows, slower as it deepens, and no further.
  const a=Math.PI/2+.4,far=coastRadius(a)*1.4;qa.setPlayer(Math.cos(a)*coastRadius(a)*.9,Math.sin(a)*coastRadius(a)*.9);qa.setAim(Math.atan2(-Math.cos(a),-Math.sin(a)),0);
  qa.setKeys(['KeyW']);frames(60*12);qa.setKeys([]);p=G().player;
  assert(G().zone==='THE SHALLOWS'&&groundHeight(p.x,p.z)<-.5&&groundHeight(p.x,p.z)>=-ISLAND.wade,`You wade out to ${(-groundHeight(p.x,p.z)).toFixed(2)} m of water and no deeper`);
  assert(Math.hypot(p.x,p.z)<far,'The open sea is out of reach');
  // Shooting: the pistol fires, marks the sand and reloads.
  qa.setPlayer(sp.x,sp.z);qa.setAim(0,-.6);frames(2);const marks=G().effects.length;qa.shoot();
  assert.equal(G().run.inventory.glock.ammo,12,'Firing spends a round');assert(G().effects.length>marks,'and leaves a mark on the ground');assert(G().firstPerson.flashTime>0,'with a muzzle flash');
  frames(20);qa.reload();assert(G().run.reloadLeft>0,'R reloads');frames(130);assert.equal(G().run.inventory.glock.ammo,13,'back to a full magazine');assert.equal(G().run.inventory.glock.reserve,77);
  canvas.events.mousedown({button:0,preventDefault(){}});assert.equal(G().run.inventory.glock.ammo,12,'A click fires');listeners.mouseup({button:0});
  canvas.events.mousedown({button:2,preventDefault(){}});frames(40);assert(G().session.aiming&&G().camera.fov<70,'Right mouse aims down the sights');listeners.mouseup({button:2});frames(40);
  // A grenade: thrown, it lands, bursts and scorches.
  const bursts=G().explosionFx.bursts;key({code:'KeyG'});listeners.keyup({code:'KeyG'});assert.equal(G().run.grenades,2,'G throws a grenade');
  frames(60*4);assert.equal(G().explosionFx.bursts,bursts+1,'It bursts on the island');assert(G().run.health===100,'far enough away to be safe');
  // Too close: a blast hurts, and the tide takes you.
  qa.explode(G().player.clone().add(new T.Vector3(1,.3,0)));assert.equal(G().run.health,75,'A blast within 3 m hurts');frames(10);
  qa.hurtPlayer(500);assert.equal(G().mode,'dead');assert.equal($('pauseTitle').textContent,'The tide takes you.');assert(!$('pause').classList.contains('hidden')&&$('resume').classList.contains('hidden'));
  $('restart').onclick();await Promise.resolve();assert.equal(G().mode,'playing','New Run starts at once after a death');assert.equal(G().run.health,100);assert.equal(G().run.grenades,3);
  // Pausing, settings, the controls card, and back to the title.
  key({code:'Escape'});assert.equal(G().mode,'paused');assert(!$('pause').classList.contains('hidden'));assert($('pauseText').textContent.startsWith('South beach · 0 kills'));
  $('settingsPause').onclick();assert(!$('pauseSettings').classList.contains('hidden'));assert.equal($('settingsEyebrow').textContent,'DEAD TIDE / PAUSED');
  key({code:'Escape'});assert($('pauseSettings').classList.contains('hidden'),'Esc closes Settings');
  $('controlsPause').onclick();assert(!$('controlsCard').classList.contains('hidden'));key({code:'Escape'});assert($('controlsCard').classList.contains('hidden'),'Esc closes the controls card');
  $('resume').onclick();assert.equal(G().mode,'playing','Resume locks the mouse and plays on');
  key({code:'Escape'});$('mainMenuPause').onclick();assert(!$('pauseConfirm').classList.contains('hidden'));$('confirmYes').onclick();
  assert.equal(G().mode,'menu');assert(!$('menu').classList.contains('hidden')&&$('hud').classList.contains('hidden')&&!$('start').disabled,'Title Screen asks first, then returns to the title');
  console.log('PASS: playing Dead Tide: it loads to a circling title screen with only the island and shared effects in its world and every shader compiled; Wade Ashore captures the mouse and lands you on the south beach with the HUD up; you walk and sprint with your feet on the ground, jump and land, sprint up Radio Hill to the summit, go into the shack by its door (its walls and roof hold), wade into the shallows but not the open sea; the pistol fires, marks the sand, reloads and aims; a grenade bursts, a close blast hurts, and death, New Run, pause, Settings, the controls card, Resume and the title screen all work.');
}finally{Math.random=random;}
process.exit(0);

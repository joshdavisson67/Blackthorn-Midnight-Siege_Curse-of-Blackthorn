import * as T from './three.module.js';
import {createDisplay} from './display.mjs?v=205';
import {createAudio} from './audio.mjs?v=201';
import {batchArticulated} from './batching.mjs?v=204';
import {createFirstPerson} from './first-person.mjs?v=205';
import {createGrenadeAssets,createGrenadeThrow} from './grenade-throw.mjs?v=186';
import {createExplosionFx} from './explosion-fx.mjs?v=191';
import {createEffectPool} from './effect-pool.mjs?v=47';
import {createWeaponRecoil,createCombatHud} from './combat-feedback.mjs?v=205';
import {createReticleHud} from './reticles.mjs?v=205';
import {weaponSurfaces} from './weapon-surfaces.mjs?v=153';
import {katanaSurfaces} from './katana.mjs?v=205';
import {ambientEnvironment} from './graphics.mjs?v=205';
import {SHOT_RUMBLE} from './weapon-stats.mjs?v=205';
import {createRunState,createPlayer} from './player.mjs?v=198';
import {createHud} from './hud.mjs?v=205';
import {createSession,createControls,WEAPON_CYCLE} from './controls.mjs?v=205';
import {createWeaponRuntime} from './weapon-runtime.mjs?v=205';
import {createCombat} from './enemy-combat.mjs?v=205';
import {PERKS} from './stations.mjs?v=205';
import {createControlScheme} from './input-scheme.mjs?v=142';
import {createTouchControls} from './touch-controls.mjs?v=148';
import {createGamepadControls} from './gamepad-controls.mjs?v=128';
import {ISLAND,buildIsland,groundHeight} from './island.mjs?v=204';

// Dead Tide (v204, Dead Tide step 2): the island mode's entry, loaded only by tide.html
// through tide-boot.js. It builds the island and nothing of the mansion, and plays with
// the shared modules: the screen and sound, the first-person view, the player's run,
// the weapon runtime, combat, the HUD and the play session (keyboard and mouse, touch,
// controller). This grey-box build has no dead yet: walk the island, jump, shoot and
// throw grenades. The dead (v205), the threat director (step 3) and stations, the
// leaderboard and the run summary (step 4) come next.
performance.mark?.('tide:modules');
const domCache=new Map(),$=id=>{if(!domCache.has(id))domCache.set(id,document.getElementById(id));return domCache.get(id);};
const shownMarkup=new Map(),shownOpacity=new Map();
const setMarkup=(id,markup)=>{if(shownMarkup.get(id)!==markup){shownMarkup.set(id,markup);$(id).innerHTML=markup;}};
const setOpacity=(id,value)=>{if(shownOpacity.get(id)!==value){shownOpacity.set(id,value);$(id).style.opacity=value;}};
let seed=204;const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},rand=(a,b)=>a+rng()*(b-a);

// ---- The screen, the night and the island ------------------------------------------------
const canvas=$('game');
const display=createDisplay({canvas,far:420,onFailure(message){$('loading').classList.add('hidden');$('error').classList.remove('hidden');$('errorDetails').textContent=message;}});
const {renderer,scene,camera}=display;
const FOG=0x0b2224;scene.background=new T.Color(FOG);scene.fog=new T.FogExp2(FOG,.0105);
const world=new T.Group();world.name='Dead Tide island';scene.add(world);
const island=buildIsland({scene,world}),{supportBelow,isBlocked}=island,{colliders,solidMeshes}=island;
// The guns' metal reflects the same soft surroundings as in the mansion.
scene.environment=ambientEnvironment();scene.environmentIntensity=.48;
const hemisphere=new T.HemisphereLight(0x6f8f96,0x121c1a,1.05);scene.add(hemisphere);
const moonlight=new T.DirectionalLight(0xb5d8d4,1.8);moonlight.position.copy(island.moonDir).multiplyScalar(120);scene.add(moonlight);
// The sky: deep teal overhead, the fog's colour at the horizon, stars and the moon.
const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{time:{value:0},moonDir:{value:island.moonDir.clone()},top:{value:new T.Color(0x03100f)},horizon:{value:new T.Color(FOG)}},
  vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float time;uniform vec3 moonDir;uniform vec3 top;uniform vec3 horizon;varying vec3 vDir;
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
void main(){vec3 d=normalize(vDir);float h=max(d.y,0.);vec3 col=mix(horizon,top,pow(h,.5));
  vec3 cell=floor(d*640.);float star=step(.9991,hash(cell))*smoothstep(.04,.3,d.y);col+=vec3(.75,.9,.88)*star*(.35+.3*sin(time*1.7+hash(cell+3.)*40.));
  float m=dot(d,moonDir);col+=vec3(.9,.97,.94)*smoothstep(.99935,.9997,m)*2.4+vec3(.3,.55,.5)*pow(max(m,0.),160.)*.5+vec3(.16,.3,.28)*pow(max(m,0.),10.)*.2;
  col=mix(col,horizon,smoothstep(.0,-.06,d.y));gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
const sky=new T.Mesh(new T.SphereGeometry(380,32,16),skyMat);sky.renderOrder=-5;sky.name='Night sky';scene.add(sky);

// ---- The guns in hand, grenades and effects ------------------------------------------------
const reticleHud=createReticleHud($('crosshair'));
const firstPerson=createFirstPerson({camera,batchArticulated}),{gunRoot,gunGroups,bushDot,smgDual,dualGuns,dualMuzzle,scopedGuns}=firstPerson;
const explosionFx=createExplosionFx(world);
const grenadeAssets=createGrenadeAssets(batchArticulated),grenadeThrow=createGrenadeThrow(grenadeAssets,batchArticulated);camera.add(grenadeThrow.root);
const {flash}=firstPerson.addLights(scene),{toggleFlashlight}=firstPerson;
display.addFilm();
const effects=[],zombies=[],pickups=[];
const bloodPool=createEffectPool(world,new T.MeshStandardMaterial({color:0x402018,roughness:.6}),'particle',256),markPool=createEffectPool(world,new T.MeshStandardMaterial({color:0x151c1d,roughness:.5,metalness:.65}),'mark',96);
const SPHERE=new T.SphereGeometry(1,12,8);
function sphere(x,y,z,sx,sy,sz,material){const m=new T.Mesh(SPHERE,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);world.add(m);return m;}

// ---- The run -------------------------------------------------------------------------------
const session=createSession(),runState=createRunState(),keys=new Set();
const spawn=ISLAND.spawn,player=new T.Vector3(spawn.x,groundHeight(spawn.x,spawn.z),spawn.z);
let elapsed=0,lastTime=performance.now(),hudTick=0,zone='SOUTH BEACH';
const soundOn=()=>$('sound').checked,gameAudio=createAudio({isOn:soundOn}),{init:initAudio,tone,noise,suppressedReport}=gameAudio;
const {walk,recover,hurtPlayer}=createPlayer({
  level:{colliders,supportBelow,move:(pos,dx,dz,r)=>island.move(pos,dx,dz,r,{grounded:runState.grounded}),updateHeight:island.updateHeight},
  run:{player,tone,noise,rumble:padRumble,gameOver,onHurt(source,shielded){flashDamage(shielded);combatHud.hurt(player,source,session.lookYaw+weaponRecoil.yaw,shielded);}},
  state:runState
});
const hud=createHud({dom:{$,setMarkup,setOpacity},session,state:runState,perks:PERKS,rules:{badges:()=>''}});
const {notify,announce,updateReloadHud,updateVitals,markHit,flashDamage,clearFlashes,clearToast,clearBanner,fadeHud}=hud;
const weaponRecoil=createWeaponRecoil(),combatHud=createCombatHud({hit:$('hit'),headshot:$('headshotIndicator'),directions:$('damageDirections'),toggle:$('headshotToggle')});
function addPoints(n){runState.points+=n;runState.totalScore+=n;return n;}
// The weapon runtime reaches the run, the session and the view through one object.
const armsState={};
function link(source,names,as=names){names.forEach((name,i)=>Object.defineProperty(armsState,as[i],{enumerable:true,get:()=>source[name],set:v=>{source[name]=v;}}));}
link(runState,['inventory','weapon','perkOwned','points','reloadLeft','reloadDuration','shotTimer','grenades','grenadeTime','grenadeCooldown','doubleTime','shotId']);
link(session,['mode','aiming','lookYaw','lookPitch']);
link(firstPerson,['flashTime','recoil','dualSide','viewFov'],['flashTime','recoil','dualSide','weaponViewFov']);
const raycaster=new T.Raycaster();let combat=null;
const {swing,updateMelee,freshInventory,shoot,reload,finishReload,holdToFire,grenade,grenadeCue,releaseGrenade,grantPowerup,dualOn,selectWeapon,applyWeaponRanks,viewGun,zoomOf,aimFovOf,aimHeight}=createWeaponRuntime({
  level:{colliders,isBlocked,solidMeshes},
  view:{camera,gunGroups,bushDot,smgDual,dualGuns,dualMuzzle,flash,reticleHud,weaponRecoil,grenadeThrow,grenadeAssets},
  run:{scene:world,zombies,effects,markPool,rand,tone,noise,notify,rumble:padRumble,suppressedReport,updateHud,updateReloadHud,shotRumble:SHOT_RUMBLE,raycaster,player},
  state:armsState,
  combat:{get damageEnemy(){return combat.damageEnemy;},get bloodBurst(){return combat.bloodBurst;},get detonateRound(){return combat.detonateRound;}}
});
firstPerson.bind({player,state:runState,session,weaponRecoil,grenadeThrow,arms:{aimFovOf,zoomOf,dualOn,aimHeight,viewGun,swing}});
// Combat on the island: grenade blasts, blood and impact marks (the dead arrive in v205).
combat=createCombat({
  level:{supportBelow,floorHeight:island.floorHeight,solidMeshes,visibleFloor:island.visibleFloor,colliders,isBlocked},
  run:{player,zombies,scene:world,rand,rng,tone,noise,notify,rumble:padRumble,sphere,effects,bloodPool,explosionFx,blastLight:{release(){}},powerupAssets:null,pickups,enemyAssets:null,
    get elapsed(){return elapsed;},get playing(){return session.mode==='playing';},
    addPoints,addKill:()=>{runState.kills++;},hurtPlayer,kick:()=>{firstPerson.recoil=.1;},killHeal(){},
    hitFeedback(headshot,impact){markHit(headshot);if(combatHud.hit(headshot,impact.shotId)){tone(1250,.055,.035,'triangle',1850);tone(1850,.07,.022,'sine',1200);}},
    collect(p){grantPowerup(p.type);},releasePickup(){}},
  rules:{killReward:base=>base,onKill(){},bonusDrop(){},hitAmount:(e,amount)=>amount}
});
runState.inventory=freshInventory();
selectWeapon('glock');

// ---- The play session ------------------------------------------------------------------------
let touchControls=null,gamepad=null;
const controlsOpen=()=>!$('controlsCard').classList.contains('hidden');
const controlScheme=createControlScheme({win:window,controllerSupported:true,onChange:schemeChanged});
const {hasMouseLock,clearPlayInput,releaseMouse,requestPointer,resumeLabel,pauseGame,showPauseMenu,settingsOpen,openSettings,closeSettings,confirmOpen,askConfirm,cancelConfirm,acceptConfirm,resumeGame,
  directControls,padPlay,touchActions,padActions,onPointerLockChange,onPointerLockError,onVisibilityChange,onMouseMove,onMouseDown,onMouseUp,playKey,onKeyUp,onBlur}=createControls({
  page:{$,canvas,keys},session,state:runState,
  act:{shoot,reload,grenade,selectWeapon,zoomOf,interact(){},toggleFlashlight,openEstateMap(){},initAudio,fitTouchStick},
  ui:{get touchControls(){return touchControls;},get controlScheme(){return controlScheme;}},
  hooks:{
    onPause(){},onPauseMenu(){},
    pauseSummary:()=>`${zone[0]+zone.slice(1).toLowerCase()} · ${runState.kills} kills · ${runState.points.toLocaleString()} essence.`,
    settingsEyebrow:from=>from==='menu'?'DEAD TIDE':'DEAD TIDE / PAUSED',settingsFromMenu(){},
    confirm:{
      restart:['Start a new run?','You wash up on the south beach again with a fresh pistol.','YES, START A NEW RUN',()=>resetRun()],
      menu:['Return to the title screen?','Your current run on the island ends here.','YES, GO TO THE TITLE',()=>returnToMenu()]
    },
    lookBlocked:controlsOpen
  }
});
// Shared settings: the same saved choices as the mansion's.
const SENSITIVITY_KEY='blackthorn-sensitivity',SOUND_KEY='blackthorn-sound',RUMBLE_KEY='blackthorn-controller-rumble';
function showSensitivity(){$('sensitivityValue').textContent=`${Number($('sensitivity').value).toFixed(1)}×`;}
function showSound(){const label=document.querySelector('[data-sound-setting]');if(label)label.textContent=soundOn()?'ON':'OFF';}
try{const sens=Number(localStorage.getItem(SENSITIVITY_KEY)),sound=localStorage.getItem(SOUND_KEY);if(sens>=.5&&sens<=2)$('sensitivity').value=String(sens);if(sound==='0'||sound==='1')$('sound').checked=sound==='1';}catch{}
$('sensitivity').oninput=$('sensitivity').onchange=()=>{showSensitivity();try{localStorage.setItem(SENSITIVITY_KEY,$('sensitivity').value);}catch{}};
$('sound').onchange=()=>{gameAudio.syncAmbience();showSound();try{localStorage.setItem(SOUND_KEY,soundOn()?'1':'0');}catch{}};
showSensitivity();showSound();
let rumbleOn=true;try{rumbleOn=localStorage.getItem(RUMBLE_KEY)!=='off';}catch{}
function applyRumbleSetting(){$('rumbleToggle').setAttribute('aria-checked',String(rumbleOn));$('rumbleToggle').querySelector('[data-rumble-setting]').textContent=rumbleOn?'VIBRATION ON':'VIBRATION OFF';}
$('rumbleToggle').onclick=()=>{rumbleOn=!rumbleOn;try{localStorage.setItem(RUMBLE_KEY,rumbleOn?'on':'off');}catch{}applyRumbleSetting();if(rumbleOn)padRumble(.5,.3,140);};
applyRumbleSetting();
function padRumble(strong,weak,ms){if(rumbleOn&&padPlay())gamepad?.rumble(strong,weak,ms);}
function applyFormFactor(){controlScheme.refresh('device');document.body.classList.toggle('phone-ui',controlScheme.phone);}
let stickClearance=-1,vitalsWatch=null;
function fitTouchStick(){
  const vitals=$('hudVitals');if(!vitals||!touchControls?.root)return;
  if(!vitalsWatch&&typeof ResizeObserver==='function'){vitalsWatch=new ResizeObserver(()=>fitTouchStick());vitalsWatch.observe(vitals);}
  const top=vitals.getBoundingClientRect?.().top;if(!(top>0))return;
  const clear=Math.round(innerHeight-top);if(clear===stickClearance)return;
  stickClearance=clear;touchControls.root.style.setProperty('--vitals-clear',`${clear}px`);
}
for(const type of ['keydown','mousedown','pointerdown'])window.addEventListener(type,e=>{
  if(e.isTrusted===false)return;if(type==='pointerdown'&&e.pointerType==='mouse')return;
  controlScheme.noteInput(type==='pointerdown'?'touch':'keyboard');
},true);
touchControls=createTouchControls({document,toggle:$('touchToggle'),fireToggle:$('tapFireToggle'),fireSetting:$('tapFireSetting'),enabled:controlScheme.scheme==='touch',onToggle:on=>controlScheme.choose(on?'touch':'standard'),actions:touchActions});
function schemeChanged(scheme){
  touchControls?.setEnabled(scheme==='touch');document.body.classList.toggle('pad-controls',scheme==='controller');
  if(scheme!=='controller')gamepad?.reset();updateControllerStatus();
  if(session.mode!=='paused')return;
  if(!$('captureHelp').classList.contains('hidden')){$('captureHelp').classList.add('hidden');$('pauseTitle').textContent='Catch your breath.';}
  $('pauseText').textContent=scheme==='controller'?'Controller connected. Press Menu, or A on Resume, to keep going.':scheme==='touch'?'Touch controls are on. Tap Resume to keep going.':'Click Resume to lock the mouse again.';
  $('resume').textContent=resumeLabel();
}
let shownController='';
function updateControllerStatus(){
  const status=$('controllerStatus'),pad=gamepad?.connected?gamepad.name.replace(/\s*\((?:STANDARD GAMEPAD|Vendor:)[^)]*\)/gi,'').replace(/\s*\(.*\)\s*$/,'').trim()||'Controller':'';
  const text=!pad?'No controller detected. Connect one and press any button to play with it.':padPlay()?`${pad} · in use. A key, click or tap switches back.`:`${pad} connected. Press any button on it to play with it.`;
  if(text!==shownController){shownController=text;status.textContent=text;status.classList.toggle('inUse',padPlay());}
}
// The controls card, from the title screen or the pause menu.
let controlsReturn=null;
function openControls(trigger){pauseGame();controlsReturn=trigger;$('controlsCard').classList.remove('hidden');$('controlsBody').scrollTop=0;$('controlsBody').focus({preventScroll:true});}
function closeControls(){$('controlsCard').classList.add('hidden');controlsReturn?.focus({preventScroll:true});controlsReturn=null;}
// Which menu the controller is driving, topmost first.
function padLayer(){if(controlsOpen())return $('controlsCard');if(!$('pause').classList.contains('hidden'))return $('pause');if(session.mode==='menu'&&!$('menu').classList.contains('hidden'))return $('menu');return null;}
function padBack(){if(controlsOpen()){closeControls();return;}if(confirmOpen()){cancelConfirm();return;}if(settingsOpen()){closeSettings();return;}if(session.mode==='paused')resumeGame();}
function padStart(){
  if(session.mode==='playing'){pauseGame();return;}
  if(controlsOpen()){closeControls();return;}if(session.mode==='paused'){resumeGame();return;}
  if(confirmOpen()){cancelConfirm();return;}if(settingsOpen()){closeSettings();return;}
  if(session.mode==='menu'&&!$('start').disabled)$('start').click();
}
gamepad=createGamepadControls({win:window,document,actions:{...padActions,start:padStart,back:padBack}});
schemeChanged(controlScheme.scheme);
display.useScreen({select:$('quality'),fps:$('fps'),layout(){applyFormFactor();fitTouchStick();}});

// ---- Runs, the title screen and the end of a run ---------------------------------------------
function startFromMenu(){resetRun();}
function resetRun({capture=true}={}){
  applyFormFactor();releaseMouse();grenadeThrow.cancel();
  for(const e of effects){world.remove(e.mesh);if(e.type==='blast')e.mesh.material?.dispose();}effects.length=0;explosionFx.clear();bloodPool.reset();markPool.reset();
  player.set(spawn.x,groundHeight(spawn.x,spawn.z),spawn.z);session.lookYaw=spawn.yaw;session.lookPitch=0;camera.fov=firstPerson.viewFov=75;camera.updateProjectionMatrix();
  Object.assign(runState,{health:100,maxHealth:100,armor:0,armorMax:0,armorTier:0,points:500,totalScore:0,kills:0,runTime:0,lastHurt:-20,grenades:3,doubleTime:0,grenadeTime:0,grenadeCooldown:0});
  runState.perkOwned.clear();runState.inventory=freshInventory();applyWeaponRanks();
  Object.assign(runState,{reloadLeft:0,shotTimer:0,feetY:0,jumpV:0,grounded:true,shotId:0});clearFlashes();
  weaponRecoil.reset();combatHud.reset();clearToast();clearPlayInput();firstPerson.resetSlide(runState.inventory.glock.ammo);selectWeapon('glock');
  session.mode='paused';$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('hud').classList.remove('hidden');
  if(capture)requestPointer();
  else{$('pauseTitle').textContent='The island is ready.';$('pauseText').textContent=padPlay()?'Press A to begin. Menu pauses the game.':touchControls?.enabled?'Tap Play to begin. The II button pauses the game.':'Click Play to lock your mouse and begin. Esc releases it and pauses the game.';$('captureHelp').classList.add('hidden');$('resume').classList.remove('hidden');$('resume').textContent=padPlay()?'PRESS A TO PLAY →':touchControls?.enabled?'TAP TO PLAY →':'CLICK TO PLAY →';showPauseMenu();}
  announce('DEAD TIDE','GREY-BOX PREVIEW · WALK THE ISLAND · THE DEAD COME ASHORE NEXT BUILD');updateHud();
}
function returnToMenu(){
  if(session.mode!=='paused'&&session.mode!=='dead')return;
  resetRun({capture:false});
  session.mode='menu';clearPlayInput();releaseMouse();touchControls?.setActive(false);
  $('pause').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');clearBanner();
  const start=$('start');start.disabled=false;start.innerHTML='WADE ASHORE <span>→</span>';start.focus({preventScroll:true});
}
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function gameOver(){
  if(session.mode==='dead')return;grenadeThrow.cancel();runState.grenadeCooldown=0;session.mode='dead';clearPlayInput();releaseMouse();
  $('captureHelp').classList.add('hidden');$('pauseTitle').textContent='The tide takes you.';
  $('pauseText').textContent=`${clock(runState.runTime)} on the island · ${runState.kills} kills · ${runState.totalScore.toLocaleString()} essence earned.`;
  $('resume').classList.add('hidden');showPauseMenu();tone(90,2,.12,'sawtooth',25);
}
function updateHud(){updateReloadHud();updateVitals();}

// ---- Page events ----------------------------------------------------------------------------
if(!window.Blackthorn)$('start').onclick=startFromMenu;
$('resume').onclick=resumeGame;$('restart').onclick=()=>askConfirm('restart',$('restart'));$('mainMenuPause').onclick=()=>askConfirm('menu',$('mainMenuPause'));
$('settingsPause').onclick=()=>openSettings('pause');$('settingsMenu').onclick=()=>openSettings('menu');$('settingsBack').onclick=closeSettings;
$('confirmYes').onclick=acceptConfirm;$('confirmNo').onclick=cancelConfirm;
$('controlsPause').onclick=()=>openControls($('controlsPause'));$('controlsMenu').onclick=()=>openControls($('controlsMenu'));$('closeControls').onclick=closeControls;$('controlsDone').onclick=closeControls;
document.addEventListener('pointerlockchange',onPointerLockChange);
document.addEventListener('pointerlockerror',onPointerLockError);
document.addEventListener('visibilitychange',onVisibilityChange);
document.addEventListener('mousemove',onMouseMove);
canvas.addEventListener('mousedown',onMouseDown);document.addEventListener('mouseup',onMouseUp);canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{
  if(controlsOpen()){if(e.code==='Escape'){e.preventDefault?.();closeControls();}return;}
  if(e.code==='Escape'&&confirmOpen()){e.preventDefault?.();cancelConfirm();return;}
  if(e.code==='Escape'&&settingsOpen()){e.preventDefault?.();closeSettings();return;}
  if(['INPUT','TEXTAREA'].includes(e.target?.tagName))return;
  playKey(e);
});
document.addEventListener('keyup',onKeyUp);window.addEventListener('blur',onBlur);

// ---- Every frame ----------------------------------------------------------------------------
const MENU_ORBIT=96;
function tick(now){
  requestAnimationFrame(tick);
  gamepad.poll(Math.min(Math.max(0,(now-lastTime)/1000),.05),{enabled:padPlay(),playing:session.mode==='playing'&&!controlsOpen(),layer:padLayer(),sensitivity:Number($('sensitivity').value),aiming:session.aiming&&!grenadeThrow.active,zoom:(zoomOf(runState.weapon)||1),onTarget:false});
  updateControllerStatus();document.body.classList.toggle('pad-playing',padPlay()&&session.mode==='playing');
  if(session.mode==='playing'&&!directControls()&&!hasMouseLock())pauseGame();
  touchControls?.setActive(session.mode==='playing'&&!controlsOpen());
  const frameSeconds=Math.max(0,(now-lastTime)/1000),dt=Math.min(frameSeconds,.05);lastTime=now;elapsed+=dt;display.frame(frameSeconds,session.mode==='playing'&&!document.hidden);
  if(session.mode==='playing'){
    weaponRecoil.update(dt);runState.runTime+=dt;runState.shotTimer=Math.max(0,runState.shotTimer-dt);runState.grenadeCooldown=Math.max(0,runState.grenadeCooldown-dt);
    if(session.mouseDown&&holdToFire())shoot();
    updateMelee(dt);
    if(runState.reloadLeft>0){runState.reloadLeft-=dt;if(runState.reloadLeft<=0){runState.reloadLeft=0;finishReload();}}
    const stick=touchControls?.active?touchControls.move:padPlay()&&gamepad.connected?gamepad.move:null;
    const moving=keys.has('KeyW')||keys.has('KeyS')||keys.has('KeyA')||keys.has('KeyD')||!!(stick&&(stick.x||stick.z));
    const aimingWeapon=session.aiming&&!grenadeThrow.active&&runState.reloadLeft===0;
    const sprint=(keys.has('ShiftLeft')||keys.has('ShiftRight')||!!touchControls?.sprint||(padPlay()&&gamepad.sprint))&&!aimingWeapon&&!session.mouseDown;
    let x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),z=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);if(stick&&!x&&!z){x=stick.x;z=stick.z;}
    walk(dt,x,z,{sprint,aiming:aimingWeapon,yaw:session.lookYaw});
    firstPerson.pose(dt,{moving,sprint,aiming:aimingWeapon});
    grenadeThrow.update(dt,releaseGrenade,grenadeCue);combat.updateEffects(dt);explosionFx.update(dt);combat.updatePickups(dt);
    recover(dt,true);runState.doubleTime=Math.max(0,runState.doubleTime-dt);runState.grenadeTime=Math.max(0,runState.grenadeTime-dt);
    zone=island.zoneAt(player.x,player.z,player.y);setMarkup('location',`DEAD TIDE <span> / ${zone}</span>`);setMarkup('interaction','');
    touchControls?.update({playing:true,aiming:session.aiming,canInteract:false,flashlight:firstPerson.flashlightOn,canSwap:WEAPON_CYCLE.filter(k=>runState.inventory[k]?.owned).length>1});
    gunRoot.visible=true;
    const ads=firstPerson.updateGun(dt,{moving,sprint});setOpacity('crosshair',ads?0:1);
    hudTick-=dt;if(hudTick<=0){updateHud();hudTick=.1;}
  }else if(session.mode==='menu'){
    // The title screen circles the island, the beacon blinking on Radio Hill.
    const a=elapsed*.045+2.2,H=ISLAND.hill;camera.position.set(H.x+Math.cos(a)*MENU_ORBIT,22,H.z+Math.sin(a)*MENU_ORBIT);camera.lookAt(H.x,11,H.z);gunRoot.visible=false;
  }
  updateReloadHud();combatHud.update(dt,player,session.lookYaw+weaponRecoil.yaw);firstPerson.updateFlash(dt);fadeHud(dt,session.mode==='playing');
  bloodPool.sync();markPool.sync();island.update(elapsed);sky.position.copy(camera.position);skyMat.uniforms.time.value=elapsed;
  display.render(gunRoot.visible||grenadeThrow.root.visible,world,firstPerson.viewFov);
}
window.addEventListener('resize',display.resize);display.resize();

// What Dead Tide warms before play: every gun and the grenade in hand, the scope masks,
// a grenade and the explosion's effects, with the island lit as in play.
async function prepareRendering(){
  return display.prepare(()=>{
    const viewModels=[...Object.values(gunGroups),bushDot],savedVisibility=viewModels.map(g=>g.visible),savedGun=gunRoot.visible;
    const scopeMasks=scopedGuns.map(({sight})=>sight.mask),savedMasks=scopeMasks.map(mask=>mask.visible);scopeMasks.forEach(mask=>mask.visible=true);
    camera.position.set(player.x,player.y+1.68,player.z);camera.rotation.set(0,0,0);gunRoot.visible=true;viewModels.forEach(g=>g.visible=true);grenadeThrow.warm();
    return {world,warm:[grenadeAssets.create(),explosionFx.warmGroup()],
      textures:()=>[...weaponSurfaces().textures,...katanaSurfaces().textures,island.depthMap],
      done(){viewModels.forEach((g,i)=>g.visible=savedVisibility[i]);scopeMasks.forEach((mask,i)=>mask.visible=savedMasks[i]);gunRoot.visible=savedGun;grenadeThrow.cancel();}};
  });
}
display.restoreQuality();
performance.mark?.('tide:world');
await prepareRendering();
performance.mark?.('tide:shaders');
lastTime=performance.now();$('loading').classList.add('hidden');window.Blackthorn?.ready(startFromMenu);requestAnimationFrame(tick);

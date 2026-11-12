import * as T from './three.module.js';
import {createDisplay} from './display.mjs?v=205';
import {createAudio} from './audio.mjs?v=201';
import {batchArticulated} from './batching.mjs?v=204';
import {mergeStationPalette,mergeModelPalette,mergeStationParts,mergeStationPlaques} from './tide-palette.mjs?v=212';
import {createFirstPerson} from './first-person.mjs?v=205';
import {createGrenadeAssets,createGrenadeThrow} from './grenade-throw.mjs?v=186';
import {createExplosionFx} from './explosion-fx.mjs?v=191';
import {createEffectPool} from './effect-pool.mjs?v=47';
import {createWeaponRecoil,createCombatHud} from './combat-feedback.mjs?v=205';
import {createReticleHud} from './reticles.mjs?v=205';
import {weaponSurfaces} from './weapon-surfaces.mjs?v=153';
import {katanaSurfaces,KATANA_STATION} from './katana.mjs?v=205';
import {ambientEnvironment} from './graphics.mjs?v=205';
import {SHOT_RUMBLE} from './weapon-stats.mjs?v=205';
import {createRunState,createPlayer} from './player.mjs?v=198';
import {createHud} from './hud.mjs?v=205';
import {createSession,createControls,WEAPON_CYCLE} from './controls.mjs?v=205';
import {createWeaponRuntime} from './weapon-runtime.mjs?v=206';
import {createCombat} from './enemy-combat.mjs?v=206';
import {PERKS,createStations,rackStation,ARMOR_STATION,forgeStation} from './stations.mjs?v=205';
import {createStationBuilder,createModelKit} from './station-models.mjs?v=205';
import {createSignage} from './signage.mjs?v=94';
import {createControlScheme} from './input-scheme.mjs?v=142';
import {createTouchControls} from './touch-controls.mjs?v=148';
import {createGamepadControls} from './gamepad-controls.mjs?v=128';
import {ISLAND,buildIsland,groundHeight} from './island.mjs?v=219';
import {loadIslandTextures} from './island-art.mjs?v=219';
import {buildEnemyAssets} from './enemy-assets.mjs?v=207';
import {createCrowd,enemyBody} from './crowd.mjs?v=123';
import {createEnemySpawner} from './enemy-spawn.mjs?v=206';
import {createEnemyAI} from './enemy-ai.mjs?v=206';
import {createPowerupAssets,POWERUPS} from './powerups.mjs?v=205';
import {fadeMaterials} from './drop-fade.mjs?v=169';
import {createIslandLevel,followPlayer,playerOccupancy,createThreatDirector} from './tide-dead.mjs?v=219';
import {THREAT_RULES,TIDE_KINDS,threatLevel,threatStats,threatProgress,threatRank,tideMix} from './tide-threat.mjs?v=219';
import {createTideLeaderboard} from './tide-leaderboard.mjs?v=219';
import {armorRank} from './armor.mjs?v=94';

// Dead Tide (v204, Dead Tide step 2): the island mode's entry, loaded only by tide.html
// through tide-boot.js. It builds the island and nothing of the mansion, and plays with
// the shared modules: the screen and sound, the first-person view, the player's run,
// the weapon runtime, combat, the HUD and the play session (keyboard and mouse, touch,
// controller). v206: the dead come ashore, with the shared enemy AI, spawner and combat,
// through the island's view of itself in tide-dead.mjs. v208: the threat director (step 3a,
// tide-threat.mjs): kills raise the threat level, which sets the population, the next
// arrivals' strength and the mix of kinds. v209 (step 3b): the spawn network (tide-dead.mjs)
// and the threat tracker with its cue (below). v210–v211: the island's map. v212 (step 5): the
// stations on its pads (below). v214: the run summary on death, and Dead Tide's own leaderboard.
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
// v215 (the art pass, design spec 10.4): a moonlit night, bluer and clearer, the island textured.
const FOG=0x10293a;scene.background=new T.Color(FOG);scene.fog=new T.FogExp2(FOG,.0088);
const world=new T.Group();world.name='Dead Tide island';scene.add(world);
const islandTextures=await loadIslandTextures({anisotropy:Math.min(16,renderer.capabilities?.getMaxAnisotropy?.()??8)});
const island=buildIsland({scene,world,textures:islandTextures}),{supportBelow,isBlocked}=island,{colliders,solidMeshes}=island;
// ---- The stations (v212, Dead Tide step 5) ------------------------------------------------------
// The mansion's own station models and what they sell (stations.mjs, station-models.mjs), each on
// its pad (island.mjs: islandSites().stations): every weapon at its landmark, the Soul Forge in
// its clearing, the armour by B-01, one perk in each quarter of the island and ammunition on
// North Beach, at Shipwreck Cove, the South Dock and the Forge, and the radio tent's ammo crate.
// The same prices and effects as the mansion. No shrines: neither the timed double damage nor
// endless grenades is sold here. They are placed before the routes are built, so the dead walk
// round them, and they block as the island's own props do (never something to stand on).
const signage=createSignage({anisotropy:Math.min(16,renderer.capabilities?.getMaxAnisotropy?.()??16)});
// (They stand in a group of their own, so their still parts can be merged by material below.)
const interactables=[],stationColliders=[],stationsRoot=new T.Group();stationsRoot.name='Stations';world.add(stationsRoot);
const stationBuilder=createStationBuilder({world:stationsRoot,colliders:stationColliders,solidMeshes,interactables,label:signage.label});
const PERK_DEFS=Object.fromEntries(PERKS.map(p=>[p.id,p]));
// The M4 and the Warden LMG are the mansion's own kinds there (the shed's bench, the cellar's
// exhibit); here they stand on racks like the others, built as an SMG's rack with their gun on it.
const OWN_RACKS={rifle:{name:'M4 / ASSAULT RIFLE',price:4500,hex:'#e6bf61',modelCaption:'M4 · SELECT FIRE · UPGRADE RANKS ONCE OWNED'},
  lmg:{name:'WARDEN / BELT-FED LMG',price:5000,hex:'#e6bf61',modelCaption:'WARDEN · BELT-FED · 3× SCOPE · UPGRADE RANKS ONCE OWNED'}};
const WEAPON_STATIONS={bushmaster:['AR-15 / .450 BUSHMASTER',2500],katana:['TSURU KATANA',undefined],smg:['RAVEN SMG',1500],shotgun:['M12 SHOTGUN',1200],glock:['GLOCK 21 PISTOL',250]};
function stationDef(p){
  if(p.kind==='forge')return forgeStation('THE SOUL FORGE');
  if(p.kind==='armor')return {...ARMOR_STATION};
  if(p.kind==='perk'){const d=PERK_DEFS[p.id];return {...d,type:'perk',modelCaption:d.desc};}
  if(OWN_RACKS[p.id])return {...rackStation('smg',OWN_RACKS[p.id].name,OWN_RACKS[p.id].price),...OWN_RACKS[p.id]};
  const [name,price]=WEAPON_STATIONS[p.id];return p.id==='katana'?{...KATANA_STATION}:rackStation(p.id,name,price);
}
const rackKit=createModelKit();
for(const p of island.stations){
  const y=(p.y??groundHeight(p.x,p.z))+.02,def=stationDef(p),made=stationBuilder.add({x:p.x,z:p.z,y,rotation:p.angle,...def});
  made.station.padId=p.id;made.station.landmark=p.landmark;
  if(OWN_RACKS[p.id]){
    made.station.type=p.id;
    const shown=[];made.group.traverse(o=>{if(o.userData?.weaponType==='smg')shown.push(o);});
    for(const o of shown){const gun=rackKit.gun(p.id);gun.position.copy(o.position);gun.scale.copy(o.scale).multiplyScalar(p.id==='lmg'?.88:1);o.parent.add(gun);o.parent.remove(o);}
  }
}
// The island's one ammunition station (v212): the standard one, in the radio tent's corner where
// v211's test crate stood.
{const A=island.sites.ammo,made=stationBuilder.add({x:A.x,z:A.z,y:island.summit+.02,rotation:A.angle,...rackStation('ammo','AMMUNITION',350)});made.station.padId='ammo-tent';made.station.landmark='LOOKOUT COMPOUND';}
// The Warden LMG's boathouse stays locked until the threat reaches its level (v212).
const boathouse=island.boathouse,boathouseStation=interactables.find(s=>s.padId==='lmg');boathouseStation.locked=true;
// Their still parts merged (v212): the painted ones with their colours baked into a shared
// material and the plaques' lettering into one atlas (tide-palette.mjs), the rest by material,
// all indexed and in cells, as the mansion merges its world (though wider than the mansion's 24 m: the stations
// stand apart on open ground, so a station's parts would draw in calls of their own otherwise).
// The moving and changing parts (the Forge's stone, the armour and Nano Shield models, the
// armour's and the Forge's plates) are marked dynamic by their kits and stay apart. Plaques cast no shadow.
const STATION_CELL=48;
stationsRoot.traverse(m=>{if(m.isMesh&&m.material?.userData?.sign)m.castShadow=m.receiveShadow=false;});
// The Forge's soul stone is an octahedron, whose faces already have normals of their own: drawn
// smooth-shaded it looks the same, and needs no flat-shaded shader of its own (its kit is ours).
stationsRoot.getObjectByName('Faceted soul stone').material.flatShading=false;
// Its seams are lines; drawn with the plain unlit material instead of a line material, they look
// the same and share a shader the island already has.
{const seams=stationsRoot.getObjectByName('Soul stone luminous seams');seams.material=new T.MeshBasicMaterial({color:seams.material.color});}
{const parts=new Set();stationsRoot.traverse(m=>{if(m.isMesh)parts.add(m);});
 // The armour and its Nano Shields show one at a time, each merged within itself.
 for(const st of interactables)if(st.nanoModels)for(const model of [st.model,...st.nanoModels])mergeModelPalette(model,{textured:false});
 mergeStationPalette(stationsRoot,{cell:STATION_CELL,textured:false});mergeStationPlaques(stationsRoot,{cell:STATION_CELL});
 mergeStationParts(stationsRoot,{cell:STATION_CELL});
 // Bullets, grenades and blasts stop at each station's box (its collider), not at its thousands
 // of merged triangles: a box each, never drawn, stands in for them.
 for(let i=solidMeshes.length-1;i>=0;i--)if(parts.has(solidMeshes[i]))solidMeshes.splice(i,1);
 solidMeshes.push(...stationHitBoxes(stationColliders));}
// The stations never move: once merged, the per-frame matrix pass skips them (only the Forge's
// hovering stone, animated by the builder, keeps updating).
{stationsRoot.updateMatrixWorld(true);const moving=new Set();for(const {core} of stationBuilder.visuals)core?.traverse(o=>moving.add(o));
 stationsRoot.traverse(o=>{if(!moving.has(o))o.matrixAutoUpdate=false;});
 for(const child of stationsRoot.children){let still=true;child.traverse(o=>{if(moving.has(o))still=false;});if(still)child.matrixWorldAutoUpdate=false;}}
function stationHitBoxes(list){
  const material=new T.MeshBasicMaterial({visible:false});
  return list.map(c=>{const mesh=new T.Mesh(new T.BoxGeometry(c.w,c.maxY-c.minY,c.d),material);mesh.position.set(c.x,(c.minY+c.maxY)/2,c.z);mesh.name='Station hit box';mesh.updateMatrixWorld(true);return mesh;});
}
// The builder's colliders (upright boxes, minY to maxY) as the island's: never low enough to
// climb onto from the ground round them.
for(const c of stationColliders){let ground=-Infinity;const reach=Math.hypot(c.w,c.d)/2+.4;for(let a=0;a<6.3;a+=.3)for(const f of [.5,1]){const h=groundHeight(c.x+Math.cos(a)*reach*f,c.z+Math.sin(a)*reach*f);if(h>ground)ground=h;}
  colliders.push({x:c.x,z:c.z,w:c.w,d:c.d,bottom:c.minY-2,top:Math.max(c.maxY,ground+1.05),cos:1,sin:0,kind:'station'});}
// The guns' metal reflects the same soft surroundings as in the mansion.
scene.environment=ambientEnvironment();scene.environmentIntensity=.48;
const hemisphere=new T.HemisphereLight(0x86a8bc,0x1a2420,1.2);scene.add(hemisphere);
// v215: a brighter moon, casting shadows round wherever you are (its shadow box follows you,
// stepping a whole shadow texel at a time so the edges never crawl). The box is 90 m across;
// its texture's size follows the graphics quality.
const moonlight=new T.DirectionalLight(0xc6dcea,2.7);moonlight.castShadow=true;scene.add(moonlight,moonlight.target);
{const cam=moonlight.shadow.camera;cam.left=cam.bottom=-45;cam.right=cam.top=45;cam.near=1;cam.far=260;cam.updateProjectionMatrix();
 moonlight.shadow.bias=-.0006;moonlight.shadow.normalBias=.045;moonlight.shadow.mapSize.set(2048,2048);}
const MOON_SHADOW={low:1024,high:2048,ultra:4096};
function moonShadowQuality(q){const n=MOON_SHADOW[q]??2048;if(moonlight.shadow.mapSize.x===n)return;moonlight.shadow.mapSize.set(n,n);moonlight.shadow.map?.dispose();moonlight.shadow.map=null;}
const moonAt=new T.Vector3();
function followMoon(x,z){const step=90/moonlight.shadow.mapSize.x*2,sx=Math.round(x/step)*step,sz=Math.round(z/step)*step;moonAt.set(sx,0,sz);moonlight.target.position.copy(moonAt);moonlight.position.copy(island.moonDir).multiplyScalar(130).add(moonAt);}
followMoon(0,0);
// The sky: deep teal overhead, the fog's colour at the horizon, stars and the moon.
const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,uniforms:{time:{value:0},moonDir:{value:island.moonDir.clone()},top:{value:new T.Color(0x040f1c)},horizon:{value:new T.Color(FOG)}},
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
// v206: the dead. `hunter` is where the player stands for them (height above the ground);
// the crowd keeps bodies apart; the routes lead them to you (the brutes' wider ones are
// built the first time something asks for them).
// v207: the dead's bodies are built behind the title screen, one body a frame, not while
// loading; their shaders then compile off to the side (a scene of their own, lit by the
// island's lights, never drawn). Pressing Play first finishes the build at once, and the
// shore sends no one until their shaders are ready. `enemyAssets` stands in for the
// finished assets, so the shared modules can be wired before they exist.
const enemyBuild=buildEnemyAssets(batchArticulated);let enemyReal=null,deadWarm=null,deadReady=false;
const enemyAssets=new Proxy({},{get:(_,key)=>enemyReal?.[key]}),powerupAssets=createPowerupAssets();
const hunter=new T.Vector3();followPlayer(hunter,player,island);
const crowd=createCrowd(zombies,hunter),playerCanOccupy=playerOccupancy({crowd,island,player});
const routes=island.buildRoutes({radius:.44});let bruteRoutes=null,navTarget=null;
Object.defineProperty(routes,'brutes',{get(){if(!bruteRoutes){const b=enemyBody({brute:true});bruteRoutes=island.buildRoutes({radius:Math.max(.44,b.radius),height:b.height});if(navTarget)bruteRoutes.rebuild(...navTarget);}return bruteRoutes;}});
// v208: the brutes' routes are rebuilt only while a brute is on the island or next to come
// ashore (the director's pending kind); walkers, dogs, ferals and lurkers share the fine grid.
// v209: and whenever the level's mix has brutes (from level 6), so they are current when one is
// rolled (they are built behind the title screen now; a rebuild takes about 0.5 ms).
const BRUTE_SHARE=TIDE_KINDS.indexOf('brute');
const brutesNeedRoutes=()=>{if(shore.pending==='brute'||tideMix(threatLevel(runState.kills))[BRUTE_SHARE]>0)return true;for(const e of zombies)if(e.brute&&!e.dead)return true;return false;};
// The boathouse (v212): opened for the rest of the run once the threat reaches its level, shut again by
// a new run. Its doorway's cells are worked out again for the routes either way.
function setBoathouse(open){if(boathouse.open===open)return;boathouse.setOpen(open);boathouseStation.locked=!open;routes.refresh(boathouse.x,boathouse.z,3);bruteRoutes?.refresh(boathouse.x,boathouse.z,3);}
const BOATHOUSE_PROMPT=`<strong>LOCKED</strong> BOATHOUSE <span style="color:#d4b77a">OPENS AT THREAT LEVEL ${boathouse.opens}</span><small>The Warden LMG is inside</small>`;
const boathouseLocked=()=>!boathouse.open&&Math.hypot(player.x-boathouse.x,player.z-boathouse.z)<2.8;
const rebuildRoutes=()=>{navTarget=[player.x,player.z];routes.rebuild(player.x,player.z);if(bruteRoutes&&brutesNeedRoutes())bruteRoutes.rebuild(player.x,player.z);};
const islandLevel=createIslandLevel({island,crowd,routes,hunter});
let elapsed=0,lastTime=performance.now(),hudTick=0,zone='SOUTH BEACH';
const soundOn=()=>$('sound').checked,gameAudio=createAudio({isOn:soundOn}),{init:initAudio,tone,noise,suppressedReport}=gameAudio;
const {walk,recover,hurtPlayer}=createPlayer({
  level:{colliders,supportBelow,move:(pos,dx,dz,r)=>island.move(pos,dx,dz,r,{grounded:runState.grounded,canOccupy:zombies.length?playerCanOccupy:null}),updateHeight:island.updateHeight},
  run:{player,tone,noise,rumble:padRumble,gameOver,onHurt(source,shielded){flashDamage(shielded);combatHud.hurt(player,source,session.lookYaw+weaponRecoil.yaw,shielded);}},
  state:runState
});
const hud=createHud({dom:{$,setMarkup,setOpacity},session,state:runState,perks:PERKS,rules:{badges:()=>''}});
const {notify,announce,updateReloadHud,updateVitals,markHit,flashDamage,clearFlashes,clearToast,clearBanner,fadeHud}=hud;
// ---- The threat tracker (v209, Dead Tide step 3b) -----------------------------------------------
// Top left, in the mansion's wave counter's place: the threat level, its rank, the kills and
// the progress to the next level (spec section 7). Each new level pulses the number and plays a
// low, quiet pulse; a new rank glows its name and plays a deeper one. No banner, no pause.
const threatTracker={level:1,rank:0,kills:-1,pulse:0,rankGlow:0,cues:0,rankCues:0,shownClass:'',shownWidth:'',shownRank:''};
function showThreat(){
  const T=threatTracker,{level,into,of}=threatProgress(runState.kills),rank=threatRank(level);
  setMarkup('threatLevel',String(level));setMarkup('threatRank',rank.name);setMarkup('threatKills',runState.kills.toLocaleString('en-US'));setMarkup('threatNext',`${into} / ${of}`);
  const width=`${(into/of*100).toFixed(1)}%`;if(width!==T.shownWidth){T.shownWidth=width;$('threatFill').style.width=width;}
  const r=String(rank.index);if(r!==T.shownRank){T.shownRank=r;$('threatHud').setAttribute('data-rank',r);}
}
function threatCue(rankUp){
  if(rankUp){tone(55,1.8,.045,'sine',40);tone(110,1.4,.018,'triangle',82);tone(277,1.1,.007,'sine',262);noise(1,.018,260);}
  else{tone(98,1,.03,'sine',74);tone(392,.6,.006,'triangle',372);}
}
function updateThreat(dt){
  const T=threatTracker,level=threatLevel(runState.kills);
  if(level>T.level){const rank=threatRank(level).index,rankUp=rank>T.rank;T.level=level;T.rank=rank;T.pulse=.9;if(rankUp)T.rankGlow=1.6;T.cues++;if(rankUp)T.rankCues++;threatCue(rankUp);}
  T.pulse=Math.max(0,T.pulse-dt);T.rankGlow=Math.max(0,T.rankGlow-dt);
  const cls=(T.pulse>0?'pulse':'')+(T.rankGlow>0?' rankUp':'');
  if(cls!==T.shownClass){T.shownClass=cls;const el=$('threatHud');el.classList.toggle('pulse',T.pulse>0);el.classList.toggle('rankUp',T.rankGlow>0);}
  if(runState.kills!==T.kills){T.kills=runState.kills;showThreat();}
}
// A new run starts again at level 1, quietly.
function resetThreat(){Object.assign(threatTracker,{level:threatLevel(runState.kills),rank:threatRank(threatLevel(runState.kills)).index,kills:runState.kills,pulse:0,rankGlow:0});updateThreat(0);showThreat();}
const weaponRecoil=createWeaponRecoil(),combatHud=createCombatHud({hit:$('hit'),headshot:$('headshotIndicator'),directions:$('damageDirections'),toggle:$('headshotToggle')});
function addPoints(n){runState.points+=n;runState.totalScore+=n;return n;}
// The weapon runtime reaches the run, the session and the view through one object.
const armsState={};
function link(source,names,as=names){names.forEach((name,i)=>Object.defineProperty(armsState,as[i],{enumerable:true,get:()=>source[name],set:v=>{source[name]=v;}}));}
link(runState,['inventory','weapon','perkOwned','points','reloadLeft','reloadDuration','shotTimer','grenades','grenadeTime','grenadeCooldown','doubleTime','shotId']);
link(session,['mode','aiming','lookYaw','lookPitch']);
link(firstPerson,['flashTime','recoil','dualSide','viewFov'],['flashTime','recoil','dualSide','weaponViewFov']);
const raycaster=new T.Raycaster();let combat=null;
const {swing,updateMelee,freshInventory,shoot,reload,finishReload,holdToFire,grenade,grenadeCue,releaseGrenade,grantPowerup,dualOn,ammoFull,refillAmmo,restockWeapon,buyWeaponRank,selectWeapon,applyWeaponRanks,viewGun,zoomOf,aimFovOf,aimHeight}=createWeaponRuntime({
  level:{colliders,isBlocked,solidMeshes,floorOf:islandLevel.floorOf},
  view:{camera,gunGroups,bushDot,smgDual,dualGuns,dualMuzzle,flash,reticleHud,weaponRecoil,grenadeThrow,grenadeAssets},
  run:{scene:world,zombies,effects,markPool,rand,tone,noise,notify,rumble:padRumble,suppressedReport,updateHud,updateReloadHud,shotRumble:SHOT_RUMBLE,raycaster,player},
  state:armsState,
  combat:{get damageEnemy(){return combat.damageEnemy;},get bloodBurst(){return combat.bloodBurst;},get detonateRound(){return combat.detonateRound;}}
});
firstPerson.bind({player,state:runState,session,weaponRecoil,grenadeThrow,arms:{aimFovOf,zoomOf,dualOn,aimHeight,viewGun,swing}});
// v212: what the stations sell, and E (B, USE) at the nearest one, as in the mansion. Dead Tide's
// only rule of its own: an owned M4 or Warden with every rank earned is simply taken up again.
const stationKit=createStations({stations:interactables,player,state:runState,isPlaying:()=>session.mode==='playing',
  arms:{selectWeapon,buyWeaponRank,ammoFull,restockWeapon,refillAmmo,grantPowerup},hud:{notify,updateHud},sound:{tone},
  rules:{equip(s){if((s.type==='rifle'||s.type==='lmg')&&runState.inventory[s.type].owned){selectWeapon(s.type);return true;}}}});
// Combat on the island: hits, kills and essence, grenade blasts, blood, impact marks and the
// power-ups the dead drop. Blasts and pickups are in the world's heights; enemies' heights
// go through the island's standAt (v206).
const {makeZombie,spawnKind,placement,choosePoint,disposeEnemy}=createEnemySpawner({
  level:islandLevel,
  run:{player:hunter,zombies,scene:world,enemyAssets,rng,rand,sharedResources:()=>({geometries:new Set(),materials:new Set()})},
  // v208: each arrival rises at the strength of the threat level when it comes ashore.
  rules:{enemyStats:()=>threatStats(threatLevel(runState.kills))}
});
combat=createCombat({
  level:{supportBelow,floorHeight:island.floorHeight,solidMeshes,visibleFloor:island.visibleFloor,colliders,isBlocked,standAt:islandLevel.standAt},
  run:{player,zombies,scene:world,rand,rng,tone,noise,notify,rumble:padRumble,sphere,effects,bloodPool,explosionFx,blastLight:{release(){}},powerupAssets,pickups,enemyAssets,
    get elapsed(){return elapsed;},get playing(){return session.mode==='playing';},
    addPoints,addKill:()=>{runState.kills++;},hurtPlayer,kick:()=>{firstPerson.recoil=.1;},killHeal(){},
    hitFeedback(headshot,impact){runStats.hits++;if(headshot)runStats.headshots++;markHit(headshot);if(combatHud.hit(headshot,impact.shotId)){tone(1250,.055,.035,'triangle',1850);tone(1850,.07,.022,'sine',1200);}},
    collect(p){grantPowerup(p.type);},releasePickup(){}},
  rules:{killReward:base=>base,onKill(){},bonusDrop(){},hitAmount:(e,amount)=>amount}
});
// How the dead hunt, walk and strike: the shared AI, with none of the mansion's extras
// (no Bella, no attic, no frenzy waves, no world events, no Sir Blackthorn).
const NO_BOSS={rules:{meleeMultiplier:1,cry:{speed:1,damage:1}},warden:{damageMultiplier:1},update:()=>false,pose(){},endWarCry(){}};
const {updateEnemies}=createEnemyAI({
  level:islandLevel,
  run:{player:hunter,camera,zombies,scene:world,rand,tone,noise,get elapsed(){return elapsed;},get health(){return runState.health;},hurtPlayer,gameOver,killZombie:combat.killZombie,disposeEnemy,lurkerBursts:combat.lurkerBursts,lurkerBurst:combat.lurkerBurst},
  rules:{decoy:()=>null,decoyStruck(){},detour:()=>null,baseDamage:()=>THREAT_RULES.base.damage,surge:()=>1,speedScale:()=>1,attackRate:()=>1,boss:NO_BOSS}
});
const shore=createThreatDirector({spawner:{placement,choosePoint,spawnKind},zombies,player,look:()=>session.lookYaw,noise,kills:()=>runState.kills,rng,ready:()=>deadReady});
let navTimer=0;
function clearTheDead(){
  for(const e of zombies){world.remove(e.group);disposeEnemy(e);}zombies.length=0;
  for(const p of pickups){p.fade?.dispose();world.remove(p.mesh);}pickups.length=0;
  shore.reset();navTimer=0;followPlayer(hunter,player,island);rebuildRoutes();
}
runState.inventory=freshInventory();
// v214: hits and headshots this run, for the summary and the leaderboard (each hit, as the HUD marks it).
const runStats={hits:0,headshots:0};
selectWeapon('glock');

// ---- The play session ------------------------------------------------------------------------
let touchControls=null,gamepad=null;
const controlsOpen=()=>!$('controlsCard').classList.contains('hidden');
const controlScheme=createControlScheme({win:window,controllerSupported:true,onChange:schemeChanged});
const {hasMouseLock,clearPlayInput,releaseMouse,requestPointer,resumeLabel,pauseGame,showPauseMenu,settingsOpen,openSettings,closeSettings,confirmOpen,askConfirm,cancelConfirm,acceptConfirm,resumeGame,
  directControls,padPlay,touchActions,padActions,onPointerLockChange,onPointerLockError,onVisibilityChange,onMouseMove,onMouseDown,onMouseUp,playKey,onKeyUp,onBlur}=createControls({
  page:{$,canvas,keys},session,state:runState,
  act:{shoot,reload,grenade,selectWeapon,zoomOf,interact(){stationKit.interact();},toggleFlashlight,openEstateMap(){},initAudio,fitTouchStick},
  ui:{get touchControls(){return touchControls;},get controlScheme(){return controlScheme;}},
  hooks:{
    onPause(){},onPauseMenu(){showSummary(session.mode==='dead');},
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
function padLayer(){if(leaderboard.visible)return $('leaderboard');if(controlsOpen())return $('controlsCard');if(!$('pause').classList.contains('hidden'))return $('pause');if(session.mode==='menu'&&!$('menu').classList.contains('hidden'))return $('menu');return null;}
function padBack(){if(leaderboard.visible){leaderboard.close();return;}if(controlsOpen()){closeControls();return;}if(confirmOpen()){cancelConfirm();return;}if(settingsOpen()){closeSettings();return;}if(session.mode==='paused')resumeGame();}
function padStart(){
  if(session.mode==='playing'){pauseGame();return;}
  if(controlsOpen()){closeControls();return;}if(session.mode==='paused'){resumeGame();return;}
  if(confirmOpen()){cancelConfirm();return;}if(settingsOpen()){closeSettings();return;}
  if(session.mode==='menu'&&!$('start').disabled)$('start').click();
}
gamepad=createGamepadControls({win:window,document,actions:{...padActions,start:padStart,back:padBack}});
schemeChanged(controlScheme.scheme);
display.useScreen({select:$('quality'),fps:$('fps'),layout(){applyFormFactor();fitTouchStick();},quality:moonShadowQuality});

// ---- Runs, the title screen and the end of a run ---------------------------------------------
function startFromMenu(){finishTheDead();resetRun();}
// One step of the dead's build (a body); true once they are built.
// v209: then, one more step, the brutes' wider routes (about 0.1 s), so the first brute to come
// ashore no longer stalls a frame building them.
function growTheDead(){if(enemyReal){if(!bruteRoutes)void routes.brutes;return true;}const step=enemyBuild.next();if(!step.done)return false;enemyReal=step.value;quietTheDead(enemyReal);warmTheDead();return false;}
// v215: the dead cast no moon shadow (45 bodies drawn twice more than quadrupled a fight's draws); they still
// take the island's shadows. Their templates, so every body cloned from them.
function quietTheDead(real){for(const g of [...real.templates.map(r=>r.group),real.injuries?.group,real.faces?.group])g?.traverse(o=>{if(o.isMesh)o.castShadow=false;});}
function finishTheDead(){while(!growTheDead());return deadWarm;}
function warmTheDead(){
  const warmScene=new T.Scene(),rage=enemyReal.templates.map(r=>{const group=r.group.clone(true);enemyReal.enrage({group});return group;});
  const groups=[...enemyReal.templates.map(r=>r.group),enemyReal.injuries.group,enemyReal.faces.group,...rage];
  for(const g of groups)warmScene.add(g);
  deadWarm=(async()=>{
    // Compiled for the film pass's target, as everything warmed at load is (a program's key
    // depends on where it draws), so play finds these programs ready. The target is only
    // needed while compileAsync makes the programs, before its first await.
    try{const was=renderer.getRenderTarget?.()??null;let compiling;renderer.setRenderTarget?.(display.rt);try{compiling=renderer.compileAsync?.(warmScene,camera,scene);}finally{renderer.setRenderTarget?.(was);}
      await compiling;for(const t of [enemyReal.surfaces.map,enemyReal.surfaces.bumpMap,enemyReal.surfaces.detail])renderer.initTexture?.(t);}
    finally{for(const g of groups)g.removeFromParent();deadReady=true;performance.mark?.('tide:dead');}
  })();
  return deadWarm;
}
function resetRun({capture=true}={}){
  applyFormFactor();releaseMouse();grenadeThrow.cancel();
  for(const e of effects){world.remove(e.mesh);if(e.type==='blast')e.mesh.material?.dispose();}effects.length=0;explosionFx.clear();bloodPool.reset();markPool.reset();
  player.set(spawn.x,groundHeight(spawn.x,spawn.z),spawn.z);clearTheDead();session.lookYaw=spawn.yaw;session.lookPitch=0;camera.fov=firstPerson.viewFov=75;camera.updateProjectionMatrix();
  Object.assign(runState,{health:100,maxHealth:100,armor:0,armorMax:0,armorTier:0,points:500,totalScore:0,kills:0,runTime:0,lastHurt:-20,grenades:3,doubleTime:0,grenadeTime:0,grenadeCooldown:0});
  runState.perkOwned.clear();runState.inventory=freshInventory();applyWeaponRanks();
  Object.assign(runState,{reloadLeft:0,shotTimer:0,feetY:0,jumpV:0,grounded:true,shotId:0});clearFlashes();
  weaponRecoil.reset();combatHud.reset();clearToast();clearPlayInput();resetThreat();stationBuilder.reset();setBoathouse(false);runStats.hits=runStats.headshots=0;leaderboard.startRun();firstPerson.resetSlide(runState.inventory.glock.ammo);selectWeapon('glock');
  session.mode='paused';$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('hud').classList.remove('hidden');
  if(capture)requestPointer();
  else{$('pauseTitle').textContent='The island is ready.';$('pauseText').textContent=padPlay()?'Press A to begin. Menu pauses the game.':touchControls?.enabled?'Tap Play to begin. The II button pauses the game.':'Click Play to lock your mouse and begin. Esc releases it and pauses the game.';$('captureHelp').classList.add('hidden');$('resume').classList.remove('hidden');$('resume').textContent=padPlay()?'PRESS A TO PLAY →':touchControls?.enabled?'TAP TO PLAY →':'CLICK TO PLAY →';showPauseMenu();}
  announce('DEAD TIDE','THE DEAD COME ASHORE · SURVIVE');updateHud();
}
function returnToMenu(){
  if(session.mode!=='paused'&&session.mode!=='dead')return;
  resetRun({capture:false});
  session.mode='menu';clearPlayInput();releaseMouse();touchControls?.setActive(false);
  $('pause').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');clearBanner();
  const start=$('start');start.disabled=false;start.innerHTML='WADE ASHORE <span>→</span>';start.focus({preventScroll:true});
}
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
// The run summary (v214, spec 8.5): what the run came to, on the death card, with the existing New
// Run and Title Screen, and the run kept for the leaderboard (named and saved from there, if wanted).
function runSummary(){
  const level=threatLevel(runState.kills),owned=WEAPON_CYCLE.filter(k=>k!=='glock'&&runState.inventory[k]?.owned).length,armour=runState.armorTier===0?'None':runState.armorTier===1?'Aegis body armour':armorRank(runState.armorTier).name.replace('NANO SHIELD','Nano Shield').replace('RANK','rank');
  return [['Enemies killed',runState.kills.toLocaleString()],['Time survived',clock(runState.runTime)],['Threat level',String(level)],['Threat rank',threatRank(level).name],
    ['Essence earned',runState.totalScore.toLocaleString()],['Headshots',runStats.hits?`${runStats.headshots.toLocaleString()} (${Math.round(runStats.headshots/runStats.hits*100)}% of hits)`:'0'],
    ['Weapons bought',String(owned)],['Perks',`${runState.perkOwned.size} of 4`],['Armour',armour]];
}
function showSummary(dead){$('tideSummary').classList.toggle('hidden',!dead);$('leaderboardDead').classList.toggle('hidden',!dead);}
function gameOver(){
  if(session.mode==='dead')return;grenadeThrow.cancel();runState.grenadeCooldown=0;session.mode='dead';clearPlayInput();releaseMouse();
  $('captureHelp').classList.add('hidden');$('pauseTitle').textContent='The tide takes you.';
  $('pauseText').textContent='Save this run to the Dead Tide leaderboard, or go again.';
  const list=$('tideSummary');list.replaceChildren();for(const [term,value] of runSummary()){const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=value;row.append(dt,dd);list.appendChild(row);}
  leaderboard.endRun({kills:runState.kills,duration:runState.runTime,score:runState.totalScore,headshots:runStats.headshots});
  $('resume').classList.add('hidden');showPauseMenu();tone(90,2,.12,'sawtooth',25);
}
function updateHud(){updateReloadHud();updateVitals();}

// ---- Page events ----------------------------------------------------------------------------
// v214: Dead Tide's leaderboard, from the title screen and the run summary.
const leaderboard=createTideLeaderboard({document,onOpen:()=>{if(session.mode==='playing')pauseGame();},onNewRun:()=>resetRun()});
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
  if(leaderboard.visible){if(e.code==='Escape'){e.preventDefault?.();leaderboard.close();}return;}
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
  if(!enemyReal||!bruteRoutes)growTheDead();
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
    // The dead: routes follow you, the shore sends more, and they hunt.
    // (Routes are only rebuilt while there are dead to lead, or the shore is about to send more.)
    followPlayer(hunter,player,island);navTimer-=dt;if(navTimer<=0&&(shore.alive()>0||shore.wanting())){rebuildRoutes();navTimer=.6;}
    shore.update(dt);updateEnemies(dt);updateThreat(dt);
    if(!boathouse.open&&threatLevel(runState.kills)>=boathouse.opens){setBoathouse(true);notify('THE BOATHOUSE AT THE SOUTH DOCK IS OPEN');}
    grenadeThrow.update(dt,releaseGrenade,grenadeCue);combat.updateEffects(dt);explosionFx.update(dt);combat.updatePickups(dt);
    recover(dt,true);runState.doubleTime=Math.max(0,runState.doubleTime-dt);runState.grenadeTime=Math.max(0,runState.grenadeTime-dt);
    zone=island.zoneAt(player.x,player.z,player.y);setMarkup('location',`DEAD TIDE <span> / ${zone}</span>`);
    stationKit.updateForges();const near=stationKit.closest();setMarkup('interaction',near?stationKit.prompt(near,padPlay()?'B':touchControls?.enabled?'USE':'E'):boathouseLocked()?BOATHOUSE_PROMPT:'');
    touchControls?.update({playing:true,aiming:session.aiming,canInteract:!!near,flashlight:firstPerson.flashlightOn,canSwap:WEAPON_CYCLE.filter(k=>runState.inventory[k]?.owned).length>1});
    gunRoot.visible=true;
    const ads=firstPerson.updateGun(dt,{moving,sprint});setOpacity('crosshair',ads?0:1);
    hudTick-=dt;if(hudTick<=0){updateHud();hudTick=.1;}
  }else if(session.mode==='menu'){
    // The title screen circles the island, the beacon blinking on Radio Hill.
    const a=elapsed*.045+2.2,H=ISLAND.hill;camera.position.set(H.x+Math.cos(a)*MENU_ORBIT,22,H.z+Math.sin(a)*MENU_ORBIT);camera.lookAt(H.x,11,H.z);gunRoot.visible=false;
  }
  updateReloadHud();combatHud.update(dt,player,session.lookYaw+weaponRecoil.yaw);firstPerson.updateFlash(dt);fadeHud(dt,session.mode==='playing');
  bloodPool.sync();markPool.sync();island.update(elapsed);stationBuilder.update(elapsed);sky.position.copy(camera.position);followMoon(camera.position.x,camera.position.z);skyMat.uniforms.time.value=elapsed;
  display.render(gunRoot.visible||grenadeThrow.root.visible,world,firstPerson.viewFov);
}
window.addEventListener('resize',display.resize);display.resize();

// What Dead Tide warms before play: every gun and the grenade in hand, the scope masks,
// a grenade and the explosion's effects, with the island lit as in play, and every power-up,
// solid and fading. The dead warm themselves once built (v207, warmTheDead).
async function prepareRendering(){
  return display.prepare(()=>{
    const viewModels=[...Object.values(gunGroups),bushDot],savedVisibility=viewModels.map(g=>g.visible),savedGun=gunRoot.visible;
    const scopeMasks=scopedGuns.map(({sight})=>sight.mask),savedMasks=scopeMasks.map(mask=>mask.visible);scopeMasks.forEach(mask=>mask.visible=true);
    camera.position.set(player.x,player.y+1.68,player.z);camera.rotation.set(0,0,0);gunRoot.visible=true;viewModels.forEach(g=>g.visible=true);grenadeThrow.warm();
    const warmPickups=Object.keys(POWERUPS).map(type=>powerupAssets.create(type)),warmFading=Object.keys(POWERUPS).map(type=>powerupAssets.create(type));
    for(const g of warmFading){g.visible=true;fadeMaterials(g).set(.5);}
    return {world,warm:[...warmPickups,...warmFading,grenadeAssets.create(),explosionFx.warmGroup()],
      textures:()=>[...weaponSurfaces().textures,...katanaSurfaces().textures,island.depthMap],
      done(){viewModels.forEach((g,i)=>g.visible=savedVisibility[i]);scopeMasks.forEach((mask,i)=>mask.visible=savedMasks[i]);gunRoot.visible=savedGun;grenadeThrow.cancel();}};
  });
}
display.restoreQuality();
performance.mark?.('tide:world');
await prepareRendering();
performance.mark?.('tide:shaders');
lastTime=performance.now();$('loading').classList.add('hidden');window.Blackthorn?.ready(startFromMenu);requestAnimationFrame(tick);

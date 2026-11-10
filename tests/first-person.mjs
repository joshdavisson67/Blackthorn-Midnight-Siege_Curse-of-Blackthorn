import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v203 (Dead Tide step 2): the first-person view is a shared module. The mansion's view
// is still identical (scripts/golden-trace.mjs records the pose of every part of the
// guns in hand, the camera, both fields of view, the muzzle flash and the flashlight,
// every sample); this test runs the view with a camera, a run and weapons of its own.
export async function verifyFirstPerson(){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  assert.deepEqual(imports('first-person.mjs'),['three.module.js','weapon-models.mjs','reload-pose.mjs','graphics.mjs','katana.mjs'],'The view imports only three.js, the gun models, the reload pose, the graphics toolkit and (v205) the katana');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('first-person.mjs');
  const mansion=['vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','world-event-visuals.mjs','curse.mjs','curse-ui.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','lighting.mjs','estate-layout.mjs','environment-lights.mjs'];
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing the view loads builds or holds the mansion');
  const src=read('game.js');
  for(const text of ['function buildGun(','const gunRoot=new T.Group()','FLASHLIGHT','reloadPose','updatePistolSlide(','weaponViewFov=','reloadDrop'])assert(!src.includes(text),`game.js no longer keeps its own ${text}`);
  assert(/const firstPerson=createFirstPerson\(\{camera,batchArticulated\}\)/.test(src)&&/firstPerson\.pose\(dt,/.test(src)&&/firstPerson\.updateGun\(dt,/.test(src)&&/firstPerson\.updateFlash\(dt\)/.test(src),'The mansion moves its view through the shared one');

  // ---- A camera, a run and weapons of its own -------------------------------------------
  const T=await import('../.qa/three.module.js');const {createFirstPerson,FLASHLIGHT,ADS_DEPTH}=await import('../.qa/first-person.mjs');
  const {createRunState}=await import('../.qa/player.mjs');const {createSession}=await import('../.qa/controls.mjs');
  const scene=new T.Scene(),camera=new T.PerspectiveCamera(75,2,.09,240);camera.rotation.order='YXZ';scene.add(camera);
  const V=createFirstPerson({camera,batchArticulated:()=>{}});
  assert(V.gunRoot.parent===camera&&V.gunRoot.position.toArray().join()==='0.28,-0.26,-0.48','The guns ride on the camera at the hip');
  assert.deepEqual(Object.keys(V.gunGroups),['glock','rifle','shotgun','smg','lmg','bushmaster','katana'],'Every gun (and, v205, the katana) is built');
  assert(!V.bushDot.visible&&!V.smgDual.visible&&V.dualGuns.length===2&&V.dualGuns.every(d=>d.g.parent===V.smgDual),'with the dot-sight Bushmaster and the Twin Ravens hidden until earned');
  assert.deepEqual(V.scopedGuns.map(s=>s.type),['lmg','bushmaster'],'Magnified sights get a mask');assert(V.scopedGuns.every(s=>s.sight.mask&&!s.sight.mask.visible));
  let meshes=0;V.gunRoot.traverse(o=>{if(o.isMesh){meshes++;assert(!o.castShadow&&!o.receiveShadow,'Guns in hand cast no shadows');}});assert(meshes>50);
  V.addLights(scene);
  let onLayer=true;V.gunRoot.traverse(o=>{if(!o.layers.isEnabled(1))onLayer=false;});
  assert(onLayer&&V.viewFill.layers.mask===2&&V.viewKey.layers.mask===2&&V.viewKey.target===V.gunRoot,'The guns and their own lights sit on the weapon layer');
  assert(!V.flash.visible&&V.flash.parent===V.gunRoot&&V.muzzleLight.intensity===0,'The muzzle flash waits for a shot');
  assert(V.flashlight.parent===camera&&V.flashlight.intensity===FLASHLIGHT.intensity&&V.flashlight.distance===FLASHLIGHT.distance&&V.flashlight.angle===FLASHLIGHT.angle&&V.flashlight.target.parent===camera,'The flashlight is on, aimed down the view (its beam texture needs a real canvas)');
  const S=createRunState(),session=createSession(),player=new T.Vector3(3,0,5);
  S.inventory=Object.fromEntries(Object.keys(V.gunGroups).map(k=>[k,{owned:true,ammo:5,reserve:10,weaponRank:0,forgeRank:0}]));S.weapon='glock';
  const recoil={pitch:0,yaw:0,back:0,lift:0},grenadeThrow={active:false,lower:0,sway:{pitch:0,yaw:0,roll:0}};let dual=false;
  V.bind({player,state:S,session,weaponRecoil:recoil,grenadeThrow,arms:{aimFovOf:()=>50,zoomOf:k=>k==='bushmaster'?10:0,dualOn:()=>dual,aimHeight:()=>.1,viewGun:k=>V.gunGroups[k]}});
  const settle=(n,f)=>{for(let i=0;i<n;i++)f();};
  // The eye.
  session.lookYaw=.4;session.lookPitch=2;S.walkPhase=Math.PI/2;
  V.pose(1/60,{moving:false,sprint:false,aiming:false});
  assert(camera.position.toArray().join()==='3,1.68,5'&&camera.rotation.x===1.3&&camera.rotation.y===.4,'The eye stands 1.68 m up; looking up stops at the limit');
  V.pose(1/60,{moving:true,sprint:false,aiming:false});assert(Math.abs(camera.position.y-(1.68+.025))<1e-12,'Walking bobs the eye');
  S.grounded=false;V.pose(1/60,{moving:true,sprint:false,aiming:false});assert.equal(camera.position.y,1.68,'but not in the air');S.grounded=true;
  recoil.pitch=.1;session.lookPitch=0;grenadeThrow.sway.roll=.05;V.pose(1/60,{moving:false,sprint:false,aiming:false});assert(Math.abs(camera.rotation.x-.1)<1e-12&&camera.rotation.z===.05,'Recoil and throwing sway move the look');recoil.pitch=0;grenadeThrow.sway.roll=0;
  settle(120,()=>V.pose(1/60,{moving:true,sprint:true,aiming:false}));assert(Math.abs(camera.fov-81)<.01&&V.viewFov===camera.fov,'Sprinting widens the view');
  settle(120,()=>V.pose(1/60,{moving:false,sprint:false,aiming:true}));assert(Math.abs(camera.fov-50)<.01,'Aiming narrows it to the gun’s aim');
  S.weapon='bushmaster';settle(120,()=>V.pose(1/60,{moving:false,sprint:false,aiming:true}));assert(Math.abs(V.viewFov-16)<.01,'and a magnified sight narrows the gun’s own view further');
  // The guns in hand.
  S.weapon='glock';session.aiming=false;settle(120,()=>V.updateGun(1/60,{moving:false,sprint:false}));
  assert(Math.abs(V.gunRoot.position.x-.28)<1e-3&&Math.abs(V.gunRoot.position.y+.26)<1e-3&&Math.abs(V.gunRoot.position.z+.48)<1e-3,'At the hip');
  session.aiming=true;let ads=0;settle(120,()=>{ads=V.updateGun(1/60,{moving:false,sprint:false});});
  assert(ads===1&&Math.abs(V.gunRoot.position.x)<1e-3&&Math.abs(V.gunRoot.position.y+.1)<1e-3&&Math.abs(V.gunRoot.position.z-ADS_DEPTH.glock)<1e-3,'Aimed: centred, at sight height, at the gun’s aim depth');
  S.reloadLeft=.5;S.reloadDuration=1;assert.equal(V.updateGun(1/60,{moving:false,sprint:false}),0,'Reloading lowers the sights');
  assert(V.reloadDrop>0,'and drops the gun');S.reloadLeft=0;
  session.aiming=false;V.updateGun(1/60,{moving:true,sprint:true});assert.equal(V.gunRoot.rotation.z,-.25,'Sprinting tilts it');
  dual=true;V.dualGuns[0].kick=1;V.updateGun(.01,{moving:false,sprint:false});assert(V.dualGuns[0].kick<1&&V.dualGuns[0].g.position.z>0,'Each Raven kicks back on its own');dual=false;
  S.weapon='bushmaster';session.aiming=true;V.viewFov=16;V.updateGun(1/60,{moving:false,sprint:false});
  const scope=V.scopedGuns.find(s=>s.type==='bushmaster').sight;
  assert(scope.mask.visible&&!V.gunGroups.bushmaster.userData.body.visible&&!scope.housing.visible,'Through a magnified sight only the lens shows');
  session.aiming=false;V.updateGun(1/60,{moving:false,sprint:false});assert(!scope.mask.visible&&V.gunGroups.bushmaster.userData.body.visible,'and the rifle returns when the sight comes down');
  // The muzzle flash and the kick of a shot.
  S.weapon='glock';V.flashTime=.05;V.recoil=.1;V.updateFlash(.01);
  assert(V.flash.visible&&V.muzzleLight.intensity===15&&V.muzzleLight.position.equals(V.gunGroups.glock.userData.muzzle)&&Math.abs(V.recoil-(.1-.004))<1e-12,'A shot flashes at the muzzle and the kick settles');
  S.weapon='smg';V.updateFlash(.01);assert.equal(V.muzzleLight.intensity,5,'The suppressed MP5 flashes dimmer');
  V.updateFlash(.1);assert(!V.flash.visible&&V.muzzleLight.intensity===0,'and the flash goes out');
  // The flashlight and the pistol slide.
  V.toggleFlashlight();assert(!V.flashlightOn&&V.flashlight.intensity===0,'F turns the flashlight off');V.toggleFlashlight();assert(V.flashlightOn&&V.flashlight.intensity===FLASHLIGHT.intensity,'and on again');
  V.gunGroups.glock.userData.slideTime=.3;V.resetSlide(5);assert.equal(V.gunGroups.glock.userData.slideTime,0,'A new run racks the slide home');
  console.log(`PASS: shared first-person view — imports only three.js, the gun models, the reload pose and the graphics toolkit (${closure.size} files, none of them mansion builders or state), game.js keeps no copy; with a camera and a run of its own it builds every gun on the camera (dot sight and Twin Ravens hidden, masks on magnified sights, no shadows) with their own lights on the weapon layer, a waiting muzzle flash and the flashlight; holds the eye at 1.68 m with a walking bob only on the ground, look limits, recoil and throwing sway, wider for sprinting and narrower for aiming and magnified sights; carries the guns at the hip, aimed at each gun's height and depth, lowered for reloads, tilted for sprinting, with each Raven kicking alone and only the lens showing through a magnified sight; flashes the muzzle (dimmer for the MP5) and settles the kick; and toggles the flashlight.`);
}

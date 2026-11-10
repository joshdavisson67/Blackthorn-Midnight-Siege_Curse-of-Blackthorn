import * as T from './three.module.js';
import {createWeaponModel,updatePistolSlide} from './weapon-models.mjs?v=205';
import {reloadPose} from './reload-pose.mjs?v=151';
import {flashlightBeamTexture} from './graphics.mjs?v=205';
import {createKatanaModel,katanaPose,katanaRest} from './katana.mjs?v=205';

// The first-person view (v203, Dead Tide step 2), for any mode: every gun in hand
// (with scope masks, the Blood Moon dot sight and the Twin Ravens), the muzzle flash
// and its light, the lights that show the guns, the flashlight, and how the view
// moves: eye height and walking bob, look with recoil and throwing sway, the field of
// view for aiming and sprinting, and the guns' aim, sway, recoil, reload and sprint
// poses. Moved from game.js unchanged; scripts/golden-trace.mjs records the pose of
// every part of the guns every sample and checks the mansion's view is identical.
// The guns are made first and the lights later (addLights), as the mansion always
// has: the order objects are made in decides their ids. v205: the katana in hand, made
// after the guns, and its three slashes.
// A shaped torch beam: wider cone, soft rim, and a core that no longer clips the floor to white.
// v182: 25% brighter, reaching 25% further and 15% wider than before (22, 28 m, 0.5 rad).
export const FLASHLIGHT=Object.freeze({intensity:22*1.25,distance:28*1.25,angle:.5*1.15,penumbra:.35,decay:1.1});
// How far ahead of the eye each gun sits when aimed. The shotgun's iron sights
// (v153) bring the eye in to a cheek weld just behind the rear aperture, so the
// stock stays out of the sight picture; the ring stays beyond the .09 near plane
// even at full recoil.
export const ADS_DEPTH=Object.freeze({glock:-.39,shotgun:-.20});

export function createFirstPerson({camera,batchArticulated}){
  const gunRoot=new T.Group();camera.add(gunRoot);gunRoot.position.set(.28,-.26,-.48);const gunGroups={};
  function buildGun(type,options={}){
    const g=createWeaponModel(type,{hands:false,...options});gunRoot.add(g);
    if(g.userData.optic)batchArticulated(g.userData.optic.housing);
    if(g.userData.optic?.magnification){
      // A single opaque annulus frames the magnified view without another world
      // render target. The rack keeps the complete, unmasked scope model.
      const sight=g.userData.optic,mask=new T.Mesh(new T.RingGeometry(sight.maskRadius??.023,.9,64),new T.MeshBasicMaterial({color:0x05090c,side:T.DoubleSide}));
      mask.position.set(0,0,sight.maskZ??.094);mask.name='Scope peripheral mask';mask.visible=false;sight.group.add(mask);sight.mask=mask;
    }
    // Batch the fixed gun by finish; the clear optic and reticle remain separate.
    batchArticulated(g.userData.body);
    viewMaterials(g);
    return g;
  }
  function viewMaterials(g){const viewMats=new Map();g.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=false;if(!viewMats.has(o.material)){const vm=o.material.clone();vm.depthTest=true;vm.depthWrite=!vm.transparent&&!o.userData.reticle;viewMats.set(o.material,vm);}o.material=viewMats.get(o.material);o.renderOrder=o.userData.reticle?4:o.material.transparent?2:0;}});}
  for(const k of ['glock','rifle','shotgun','smg','lmg','bushmaster'])gunGroups[k]=buildGun(k);
  // Blood Moon (v165, Bushmaster Rank I): the same rifle with a red dot on a
  // riser instead of the 10x scope. It replaces the scoped model while held.
  const bushDot=buildGun('bushmaster',{dotSight:true});bushDot.visible=false;
  // Twin Ravens (v161, SMG capstone): an MP5 in each hand, without optics,
  // toed in slightly. They fire alternately; each kicks back on its own shot.
  const smgDual=new T.Group();smgDual.name='Twin Ravens';smgDual.visible=false;gunRoot.add(smgDual);
  const dualGuns=[1,-1].map(side=>{const g=buildGun('smg',{optic:false});smgDual.add(g);g.position.set(side*.25,0,0);g.rotation.y=side*.04;g.visible=true;return {g,side,kick:0,muzzle:new T.Vector3()};});
  const dualMuzzle=new T.Vector3();
  // v205: the katana in hand, held where the guns sit and posed by its slashes.
  {const k=createKatanaModel();gunRoot.add(k);batchArticulated(k.userData.body);viewMaterials(k);const rest=katanaRest();k.position.copy(rest.p);k.quaternion.copy(rest.q);gunGroups.katana=k;}
  const katanaFrom={p:new T.Vector3(),q:new T.Quaternion()},katanaNow={p:new T.Vector3(),q:new T.Quaternion()};let katanaSwing=-1;
  const scopedGuns=Object.entries(gunGroups).filter(([,g])=>g.userData.optic?.mask).map(([type,g])=>({type,sight:g.userData.optic}));
  let flash=null,muzzleLight=null,flashlight=null;
  // The run's values the view reads, joined once the weapon runtime exists (bind).
  let S=null,session=null,player=null,weaponRecoil=null,grenadeThrow=null,aimFovOf=null,zoomOf=null,dualOn=null,aimHeight=null,viewGun=null,swing=null;
  const view={gunRoot,gunGroups,bushDot,smgDual,dualGuns,dualMuzzle,scopedGuns,flash:null,muzzleLight:null,viewFill:null,viewKey:null,flashlight:null,
    // The view's own values: the held weapon's field of view, the kick of the last
    // shot, the muzzle flash's remaining time, the twin SMG firing next and the drop
    // of a reload in progress.
    viewFov:75,recoil:0,flashTime:0,dualSide:0,reloadDrop:0,flashlightOn:true,
    addLights,bind,pose,updateGun,updateFlash,toggleFlashlight,resetSlide};
  function addLights(scene){
    const flashMat=new T.MeshBasicMaterial({color:0xffd37a,transparent:true,opacity:1,depthWrite:false});flash=new T.Mesh(new T.ConeGeometry(.1,.32,8),flashMat);flash.position.set(0,0,-.9);flash.castShadow=false;flash.receiveShadow=false;gunRoot.add(flash);flash.rotation.x=-Math.PI/2;flash.renderOrder=3;flash.material.depthTest=true;flash.visible=false;muzzleLight=new T.PointLight(0xffc278,0,6);gunRoot.add(muzzleLight);muzzleLight.position.set(0,0,-.7);
    gunRoot.traverse(o=>o.layers.set(1));muzzleLight.layers.enable(1);const viewFill=new T.HemisphereLight(0xcbd9df,0x4d5544,2.2);viewFill.layers.set(1);scene.add(viewFill);const viewKey=new T.DirectionalLight(0xe6d0af,2.3);viewKey.layers.set(1);viewKey.position.set(-1,3,2);viewKey.target=gunRoot;camera.add(viewKey);
    flashlight=new T.SpotLight(0xe2eddd,FLASHLIGHT.intensity,FLASHLIGHT.distance,FLASHLIGHT.angle,FLASHLIGHT.penumbra,FLASHLIGHT.decay);flashlight.map=flashlightBeamTexture();flashlight.position.set(.18,-.1,0);camera.add(flashlight);camera.add(flashlight.target);flashlight.target.position.set(0,0,-15);flashlight.visible=true;
    Object.assign(view,{flash,muzzleLight,viewFill,viewKey,flashlight});return view;
  }
  function bind(rig){({player,state:S,session,weaponRecoil,grenadeThrow}=rig);({aimFovOf,zoomOf,dualOn,aimHeight,viewGun,swing=null}=rig.arms);}
  // The eye: height and walking bob, look with recoil and throwing sway, and the
  // fields of view for aiming and sprinting.
  function pose(dt,{moving,sprint,aiming:aimingWeapon}){
    camera.position.set(player.x,1.68+player.y+(moving&&S.grounded?Math.sin(S.walkPhase)*.025:0),player.z);camera.rotation.set(T.MathUtils.clamp(session.lookPitch+weaponRecoil.pitch+grenadeThrow.sway.pitch,-1.3,1.3),session.lookYaw+weaponRecoil.yaw+grenadeThrow.sway.yaw,grenadeThrow.sway.roll);camera.fov=T.MathUtils.lerp(camera.fov,aimingWeapon?aimFovOf(S.weapon):sprint?81:75,dt*9);camera.updateProjectionMatrix();view.viewFov=zoomOf(S.weapon)?T.MathUtils.lerp(view.viewFov,aimingWeapon?(gunGroups[S.weapon].userData.optic.viewFov??16):sprint?81:75,dt*9):camera.fov;
  }
  // The guns in hand, every frame of play; returns whether the sights are up.
  function updateGun(dt,{moving,sprint}){
    updatePistolSlide(gunGroups.glock,dt,S.inventory.glock.ammo);
    const melee=S.weapon==='katana',dual=dualOn(),ads=session.aiming&&!grenadeThrow.active&&S.reloadLeft===0&&!dual&&!melee?1:0;if(melee)poseKatana();gunRoot.position.y+=view.reloadDrop;gunRoot.position.x=T.MathUtils.lerp(gunRoot.position.x,ads||dual?0:.28,dt*14);if(dual)for(const d of dualGuns){d.kick=Math.max(0,d.kick-dt*14);d.g.position.z=d.kick*.045;d.g.rotation.x=d.kick*.06;}gunRoot.position.y=T.MathUtils.lerp(gunRoot.position.y,(ads?-aimHeight(S.weapon):-.26)-grenadeThrow.lower*.43,dt*14);gunRoot.position.z=T.MathUtils.lerp(gunRoot.position.z,(ads?(ADS_DEPTH[S.weapon]??-.34):-.48)+weaponRecoil.back*(ads?.6:1),dt*14)+view.recoil*dt*4;gunRoot.rotation.set((ads?0:weaponRecoil.lift+view.recoil*1.2)+grenadeThrow.lower*.25,0,zoomOf(S.weapon)&&ads?0:Math.sin(S.walkPhase*.5)*(moving?(ads?.001:.012):.001));{const pose=reloadPose(S.reloadLeft>0&&S.reloadDuration>0?1-S.reloadLeft/S.reloadDuration:0);view.reloadDrop=pose.drop;gunRoot.position.y-=pose.drop;gunRoot.rotation.z+=pose.roll;gunRoot.rotation.x+=pose.pitch;}if(sprint&&moving)gunRoot.rotation.z=-.25;for(const {type,sight} of scopedGuns){sight.mask.visible=S.weapon===type&&ads>0&&view.viewFov<(sight.viewFov??16)+1;
    // v167: once the mask covers the screen, only the lens window shows, so the
    // rifle and scope body are hidden; the tube interior and mounts can't intrude.
    gunGroups[type].userData.body.visible=sight.housing.visible=!sight.mask.visible;}
    return ads;
  }
  // The katana at rest, or through the slash under way (katana.mjs), starting from
  // wherever the blade was when the slash began.
  function poseKatana(){
    const g=gunGroups.katana;
    if(swing?.active){if(swing.id!==katanaSwing){katanaSwing=swing.id;katanaFrom.p.copy(g.position);katanaFrom.q.copy(g.quaternion);}katanaPose(swing.kind,swing.time,katanaFrom,katanaNow);}
    else{const rest=katanaRest();katanaNow.p.copy(rest.p);katanaNow.q.copy(rest.q);}
    g.position.copy(katanaNow.p);g.quaternion.copy(katanaNow.q);
  }
  function updateFlash(dt){view.recoil=Math.max(0,view.recoil-dt*.4);view.flashTime=Math.max(0,view.flashTime-dt);flash.visible=view.flashTime>0;muzzleLight.position.copy(dualOn()?dualMuzzle:viewGun(S.weapon).userData.muzzle);muzzleLight.intensity=view.flashTime>0?(S.weapon==='smg'?5:15):0;}
  function toggleFlashlight(){view.flashlightOn=!view.flashlightOn;view.flashlight.intensity=view.flashlightOn?FLASHLIGHT.intensity:0;}
  function resetSlide(ammo){gunGroups.glock.userData.slideTime=0;updatePistolSlide(gunGroups.glock,0,ammo);}
  return view;
}

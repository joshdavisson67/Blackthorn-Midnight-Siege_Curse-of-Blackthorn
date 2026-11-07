import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {GRENADE_THROW,createGrenadeAssets,createGrenadeThrow} from '../public/game/grenade-throw.mjs';

// v186: a realistic throwing arm (sleeve, glove, jointed hand), the left hand
// pulling the pin, an overhand windup with body sway, and the spoon flying off.
export function verifyThrowArm(qa,frames){
  const assets=createGrenadeAssets(),arm=createGrenadeThrow(assets),P=arm.PIN;
  // ---- The arms ---------------------------------------------------------------------------------
  for(const side of [arm.right,arm.left]){
    for(const n of ['Jacket upper sleeve','Elbow','Jacket forearm sleeve','Sleeve cuff','Cuff button','Glove gauntlet','Velcro wrist strap','Glove back','Leather palm','Knuckle guard'])assert(side.root.getObjectByName(n),`Each arm has a ${n.toLowerCase()}`);
    assert.equal(side.fingers.length,4);assert(side.fingers.every(f=>f.joints.length===3),'Four fingers of three joints');assert.equal(side.thumb.length,3,'and a three-jointed thumb');
    const lengths=side.fingers.map(f=>f.len.reduce((a,b)=>a+b));assert(lengths[1]>lengths[0]&&lengths[1]>lengths[2]&&lengths[3]<lengths[2],'Middle finger longest, little finger shortest');
    const sleeve=side.root.getObjectByName('Jacket upper sleeve').geometry.attributes.position;let lo=Infinity,hi=0;
    for(let i=0;i<sleeve.count;i++){const y=sleeve.getY(i);if(y<.3||y>.32)continue;const r=Math.hypot(sleeve.getX(i),sleeve.getZ(i)/.9);lo=Math.min(lo,r);hi=Math.max(hi,r);}
    assert(hi-lo>.003,'The sleeve has folds');
  }
  assert(arm.left.root.parent.scale.x===-1,'The left arm is the right arm mirrored');
  // ---- One throw, frame by frame -----------------------------------------------------------------
  const cues=[];let releaseAt=-1;const v=new T.Vector3();
  arm.begin();const fps=60;
  const sample=[];
  for(let i=0;i<Math.ceil(GRENADE_THROW.duration*fps)+2;i++){
    const before=arm.time;arm.update(1/fps,()=>{releaseAt=arm.time;},c=>cues.push([c,arm.time]));arm.root.updateMatrixWorld(true);
    const t=arm.time;if(!arm.active)break;
    for(const side of [arm.right,arm.left]){if(!side.root.visible)continue;
      assert(Math.abs(side.upper.position.distanceTo(side.forearm.position)-side.upperLength)<1e-6&&Math.abs(side.forearm.position.distanceTo(side.hand.position)-side.foreLength)<1e-6,'Both arms stay connected without stretching');}
    sample.push({t,left:arm.left.root.visible,heldPin:arm.heldPin.visible,pulled:arm.pulledPin.visible,sway:{...arm.sway},index:-arm.right.fingers[0].joints[0].rotation.x,pinch:arm.pulledPin.getWorldPosition(new T.Vector3())});
  }
  assert.deepEqual(cues.map(c=>c[0]),['pin'],'One pin cue per throw');assert(Math.abs(cues[0][1]-P.grab)<1.5/fps+1e-9,'at the grab');
  assert(Math.abs(releaseAt-GRENADE_THROW.release)<1/fps+1e-9,'Release timing is unchanged');
  const at=t=>sample.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a);
  assert(!at(.03).left&&at(P.grab).left&&!at(GRENADE_THROW.release).left,'The left hand appears only to pull the pin');
  assert(at(P.grab-.02).heldPin&&!at(P.grab+.02).heldPin&&at(P.grab+.02).pulled&&!at(GRENADE_THROW.release).pulled,'The pin leaves the grenade in the left hand');
  assert(at(P.yank).pinch.distanceTo(at(P.grab).pinch)>.08,'and is yanked well away');
  assert(at(.3).index>.8&&at(.48).index<.2&&at(.75).index>.25,'Fingers grip, open at release, then relax');
  assert(at(.3).sway.pitch>.015&&at(.54).sway.pitch<-.015,'The body leans back on the draw and dips through the follow-through');
  for(const s of sample)if(s.t>.37&&s.t<.465)assert(s.sway.pitch===0&&s.sway.yaw===0&&s.sway.roll===0,'The view is level around release, so aim is exact');
  frames?.(0);
  arm.update(1,()=>{});assert(!arm.active&&arm.sway.pitch===0&&arm.sway.roll===0);
  arm.begin();arm.update(.2,()=>{});arm.cancel();assert(arm.heldPin.visible&&!arm.pulledPin.visible&&arm.sway.pitch===0,'Cancel restores the pin and the view');

  // ---- In the game: no pin in flight; the spoon flips off ---------------------------------------------
  qa.start();qa.holdSpawns();qa.setPlayer(0,20);frames(1);qa.grenade();
  while(!qa.get().effects.some(e=>e.type==='grenade'))frames(1);
  const s=qa.get(),g=s.effects.find(e=>e.type==='grenade'),spoon=s.effects.find(e=>e.type==='spoon');
  assert(!g.mesh.getObjectByName('Pin and ring').visible&&!g.mesh.getObjectByName('Spoon').visible,'The thrown grenade has no pin, and its spoon has gone');
  assert(spoon&&spoon.mesh.position.distanceTo(g.mesh.position)<.3,'The spoon flies off from the grenade');
  const start=spoon.mesh.position.clone();frames(80);
  assert(spoon.mesh.position.distanceTo(start)>.8&&spoon.mesh.position.y<start.y-1.2,'tumbles away and lands');
  frames(120);assert(!s.effects.includes(spoon)&&!spoon.mesh.parent,'and is cleaned up');
  assert(Math.abs(s.camera.rotation.z)<1e-9,'The view is level again after the throw');
  console.log('PASS: throwing arm: jacket sleeves with folds and a buttoned cuff, tactical gloves, four three-jointed fingers and a thumb; the left hand pulls the pin (one click cue), overhand windup and whip with staggered finger release at the unchanged 0.42 s, body sway that is level at release, follow-through; thrown grenades fly pinless and shed their spoon.');
}

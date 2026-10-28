import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {createWeaponModel,SHOTGUN_SIGHT_HEIGHT} from '../public/game/weapon-models.mjs';
import {weapons} from '../public/game/core.mjs';
import {createModelKit} from '../public/game/station-models.mjs';

function verifyLensSeating(model,repeat,type){
  model.updateMatrixWorld(true);
  const sight=model.userData.optic,lens=sight.glass,housing=sight.housing;
  assert.equal(lens.geometry,repeat.userData.optic.glass.geometry,'Repeated optics reuse their lens geometry');
  assert.equal(lens.material,repeat.userData.optic.glass.material,'Repeated optics reuse their glass finish');
  assert(sight.dot.material.color.r>sight.dot.material.color.g,'Red-dot sights use a red aiming mark');
  const hood=housing.getObjectByName('Reflex sight hood');
  if(hood){
    const aperture=hood.geometry.parameters.shapes.holes[0].getPoints(64),edge=lens.geometry.parameters.shapes.getPoints(64);
    assert.equal(edge.length,aperture.length);
    for(let i=0;i<edge.length;i++)assert(edge[i].distanceTo(aperture[i])<.00001,`${type} lens edge follows the actual sight opening, including rounded corners`);
    const lensBounds=new T.Box3().setFromObject(lens),hoodBounds=new T.Box3().setFromObject(hood);
    assert(lensBounds.min.z>hoodBounds.min.z&&lensBounds.max.z<hoodBounds.max.z,'Glass is seated within the hood depth');
  }else{
    const rim=housing.getObjectByName(type==='bushmaster'?'Scope rim':'Sight lens retaining ring'),innerRadius=rim.geometry.parameters.radius-rim.geometry.parameters.tube;
    const radius=lens.geometry.parameters.radius;
    assert(radius<=innerRadius+.00001&&innerRadius-radius<.001,'Circular lenses meet their retaining rim without protruding or leaving a gap');
  }
  // Probe just inside the entire lens perimeter, not only the center dot. A
  // frame intruding into a corner (or a mismatched rectangular pane) fails here.
  const vertices=lens.geometry.attributes.position,forward=new T.Vector3(0,0,-1).applyQuaternion(sight.group.getWorldQuaternion(new T.Quaternion()));
  for(let i=0;type!=='bushmaster'&&i<vertices.count;i++){
    const edge=sight.group.worldToLocal(lens.localToWorld(new T.Vector3(vertices.getX(i)*.96,vertices.getY(i)*.96,0))),origin=sight.group.localToWorld(edge.setZ(.15));
    const hits=new T.Raycaster(origin,forward,0,.50).intersectObject(housing,true);
    assert.equal(hits.length,0,`${type} housing leaves its fitted lens perimeter open`);
  }
  const risers=model.userData.parts.filter(p=>p.name==='Optic riser'||p.name==='Precision scope mount'||p.name==='LMG scope mount');
  assert(risers.some(r=>new T.Box3().setFromObject(r).intersectsBox(new T.Box3().setFromObject(housing))),'The optic physically meets its mount');
}

export function verifyWeaponModels(qa,frames,listeners,gameCanvas){
  const kit=createModelKit(),lengths={},reports=[];
  verifyShotgunIrons(qa,frames,listeners,gameCanvas,kit,lengths,reports);
  for(const type of ['rifle','smg','lmg','bushmaster']){
    const model=createWeaponModel(type),repeat=createWeaponModel(type);
    assert(model.userData.parts.every((p,i)=>p.geometry===repeat.userData.parts[i].geometry),'Repeated weapons reuse cached geometry');
    verifyLensSeating(model,repeat,type);
    const exhibit=kit.gun(type);assert.equal(exhibit.userData.weaponType,type);
    const worldModel=exhibit.children[0];assert.equal(worldModel.userData.reference,model.userData.reference,'The rack uses the same weapon as the held model');
    const dimensions=new T.Box3().setFromObject(model).getSize(new T.Vector3());lengths[type]=dimensions.z;
    const rackBounds=new T.Box3().setFromObject(exhibit);assert(rackBounds.max.x-rackBounds.min.x<1.7,'Weapon fits the existing rack');
    assert(Math.abs(rackBounds.max.x+rackBounds.min.x)<.002,'Rack weapon is centered');

    qa.start();qa.holdSpawns();qa.get().inventory[type].owned=true;qa.selectWeapon(type);qa.setAim(0,0);
    gameCanvas.events.mousedown({button:2});frames(85);qa.get().scene.updateMatrixWorld(true);
    const state=qa.get(),gun=state.gunGroups[type],sight=gun.userData.optic;
    assert(Math.abs(gun.userData.muzzle.x)<1e-7&&gun.userData.muzzle.z<-.5,'Muzzle lies on the actual barrel axis');
    const projected=sight.dot.getWorldPosition(new T.Vector3()).project(state.camera);assert(Math.hypot(projected.x,projected.y)<.004,'Reticle remains aligned after the model change');
    for(const x of [-.014,0,.014])for(const y of [-.014,0,.014]){
      const target=sight.group.localToWorld(new T.Vector3(x,y,.054)),direction=target.sub(state.camera.position).normalize();
      const hits=new T.Raycaster(state.camera.position,direction).intersectObject(gun,true).filter(h=>h.object.isMesh&&!h.object.material.transparent&&!h.object.userData.reticle);
      assert.equal(hits.length,0,`${type} has a clear central aiming window at ${x},${y}: ${hits.map(h=>h.object.name).join(',')}`);
    }
    let meshes=0,triangles=0;
    gun.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert(o.geometry.attributes.position.array.every(Number.isFinite),'Model vertices remain finite');});
    assert(meshes<=24,`${type} preserves a small draw-call budget: ${meshes}`);assert(triangles<20000,`${type} stays within its geometry budget`);
    assert(sight.glass.material.opacity<=.04&&sight.glass.material.depthWrite===false);
    reports.push({type,meshes,triangles});listeners.mouseup({button:2});
  }
  // v156: the MP5 was enlarged 15% at Josh's request, so it now outsizes the M4.
  assert(lengths.rifle<lengths.shotgun&&lengths.shotgun<lengths.lmg&&lengths.smg<lengths.shotgun,'Carbine, combat shotgun and heavy LMG keep distinct proportions; the enlarged MP5 stays shorter than the shotgun');
  const smg=createWeaponModel('smg');assert(Math.abs(smg.scale.x-1.15)<1e-9&&Math.abs(smg.userData.sightHeight/smg.userData.optic.height-1.15)<1e-9,'The MP5 is drawn 15% larger, with its sight height scaled to match');
  console.log('PASS: five distinct weapon silhouettes, matching centered exhibits, shared model/optic geometry, fitted lens contours and perimeter rays, seated optic mounts, 36 unobstructed optic aim rays, aligned shotgun iron sights, muzzle alignment and bounded view-model draw calls:',JSON.stringify(reports));qa.start();
}

// v153: the combat shotgun aims with flip-up iron sights on its rail instead of
// a red dot. The rear aperture and front post share the sight line, both sights
// stand on the rail, and the post sits just under the point of aim.
function verifyShotgunIrons(qa,frames,listeners,gameCanvas,kit,lengths,reports){
  const model=createWeaponModel('shotgun'),repeat=createWeaponModel('shotgun');model.updateMatrixWorld(true);
  assert(model.userData.parts.every((p,i)=>p.geometry===repeat.userData.parts[i].geometry),'Repeated shotguns reuse cached geometry');
  assert(!model.userData.optic,'The shotgun has no red dot');
  // v154: fire rate +15% (0.72 s between shots → 0.626 s, 1.39 → 1.60 shots/s).
  assert(Math.abs(.72/weapons.shotgun.rate-1.15)<.002,'Shotgun fires 15% faster than its original 0.72 s cycle');
  assert(!model.userData.parts.some(p=>/Optic riser|Optic clamp/.test(p.name)),'No optic riser is left on the rail');
  assert.equal(model.userData.sightHeight,SHOTGUN_SIGHT_HEIGHT);
  const part=name=>model.userData.parts.find(p=>p.name===name),bounds=name=>new T.Box3().setFromObject(part(name));
  for(const name of ['Shotgun upper receiver','Slim M-LOK handguard','Ribbed muzzle device','Shotgun box magazine','Squared trigger guard','Hunter-style shoulder stock','Adjustable cheek riser','Knurled charging handle','Rear aperture ring','Front sight post'])assert(part(name),`Shotgun has its ${name}`);
  // Both sights stand on the rail's top surface.
  const slots=model.userData.parts.filter(p=>p.name==='Picatinny cross slot'),railTop=Math.max(...slots.map(p=>new T.Box3().setFromObject(p).max.y));
  for(const name of ['Rear sight base','Front sight base']){const b=bounds(name);assert(Math.abs(b.min.y-railTop)<.0005,`${name} sits on the rail`);
    assert(slots.some(p=>new T.Box3().setFromObject(p).intersectsBox(b.clone().expandByScalar(.001))),`${name} clamps onto rail slots`);}
  const ring=part('Rear aperture ring'),ringCenter=ring.getWorldPosition(new T.Vector3()),post=bounds('Front sight post');
  assert(Math.abs(ringCenter.y-SHOTGUN_SIGHT_HEIGHT)<1e-6&&Math.abs(ringCenter.x)<1e-6,'Rear aperture is centred on the sight line');
  assert(post.max.y<SHOTGUN_SIGHT_HEIGHT&&SHOTGUN_SIGHT_HEIGHT-post.max.y<.0015,'Front post tip sits just under the sight line');
  assert(Math.abs((post.min.x+post.max.x)/2)<1e-6,'Front post is centred');
  for(const ear of model.userData.parts.filter(p=>p.name==='Front sight protective ear'))assert(new T.Box3().setFromObject(ear).max.y>SHOTGUN_SIGHT_HEIGHT,'Front ears rise above the post to protect it');
  const dot=bounds('Front sight glow dot');assert(dot.max.y<=post.max.y+1e-6&&dot.max.z>=post.max.z-1e-4,'Glow dot sits on the post tip, facing the shooter');
  const exhibit=kit.gun('shotgun');assert.equal(exhibit.children[0].userData.reference,model.userData.reference);
  const rack=new T.Box3().setFromObject(exhibit);assert(rack.max.x-rack.min.x<1.7&&Math.abs(rack.max.x+rack.min.x)<.002,'Shotgun fits and centres on its rack');
  lengths.shotgun=new T.Box3().setFromObject(model).getSize(new T.Vector3()).z;

  qa.start();qa.holdSpawns();qa.get().inventory.shotgun.owned=true;qa.selectWeapon('shotgun');qa.setAim(0,0);
  gameCanvas.events.mousedown({button:2});frames(85);qa.get().scene.updateMatrixWorld(true);
  const state=qa.get(),gun=state.gunGroups.shotgun;
  assert(Math.abs(gun.userData.muzzle.x)<1e-7&&gun.userData.muzzle.z<-.5,'Muzzle lies on the actual barrel axis');
  // From the aimed camera, the aperture centre and the post tip land on screen centre.
  const ringWorld=gun.localToWorld(ringCenter.clone()),ringScreen=ringWorld.clone().project(state.camera);
  const tip=gun.localToWorld(new T.Vector3(0,post.max.y,(post.min.z+post.max.z)/2)).project(state.camera);
  assert(Math.hypot(ringScreen.x,ringScreen.y)<.004,'Rear aperture is centred in the aimed view');
  assert(Math.abs(tip.x)<.002&&tip.y<0&&tip.y>-.01,'Front post tip sits just under screen centre');
  // The rear sight stays beyond the near plane, even at full recoil travel.
  const near=state.camera.near,rearDepth=-ringWorld.clone().applyMatrix4(state.camera.matrixWorldInverse).z;
  assert(rearDepth-.06>near,`Rear aperture stays in front of the near plane under recoil (${rearDepth.toFixed(3)})`);
  // The point of aim is open; just under it, the ray meets the post.
  const hitsAt=(x,y)=>{const target=gun.localToWorld(new T.Vector3(x,y,(post.min.z+post.max.z)/2)),ray=new T.Raycaster(state.camera.position,target.sub(state.camera.position).normalize());ray.layers.set(1);return ray.intersectObject(gun,true).filter(h=>h.object.isMesh&&!h.object.material.transparent);};
  for(const x of [-.002,0,.002])for(const y of [.0005,.002])assert.equal(hitsAt(x,SHOTGUN_SIGHT_HEIGHT+y).length,0,`Iron sights keep the point of aim open at ${x},${y}`);
  assert(hitsAt(0,post.max.y-.004).length>0,'Just under the point of aim the ray meets the front post');
  let meshes=0,triangles=0;
  gun.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert(o.geometry.attributes.position.array.every(Number.isFinite));});
  assert(meshes<=24,`shotgun preserves a small draw-call budget: ${meshes}`);assert(triangles<20000,'shotgun stays within its geometry budget');
  reports.push({type:'shotgun',meshes,triangles});listeners.mouseup({button:2});
}

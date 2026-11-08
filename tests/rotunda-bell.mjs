import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {ROTUNDA_BELL,BELL_BUDGET} from '../public/game/rotunda-bell.mjs';
import {BRUTE} from '../public/game/brute.mjs';
import {roomAt} from '../public/game/estate-layout.mjs';
import {isBlocked} from '../public/game/core.mjs';
import {drawStationMarker} from '../public/game/station-models.mjs';

export function verifyRotundaBell(qa,frames,listeners,elements){
  const state=qa.get(),bell=state.rotundaBell,station=bell.station;
  assert.equal(roomAt(ROTUNDA_BELL.x,ROTUNDA_BELL.z).id,'rotunda');
  assert.equal(state.interactables.filter(s=>s.type==='bell').length,0,'The bell is a landmark, not a curse choice (v130)');
  assert.equal(station.y,0);assert.equal(station.price,0);assert(bell.group.parent);
  assert(bell.bodyBounds.getSize(new T.Vector3()).x>2.6,'The bell is a large fixture rather than a small prop');
  assert(bell.bodyBounds.min.y>BRUTE.height,'Large brutes retain headroom under the bell');
  assert(bell.handleBounds.min.y>1&&bell.handleBounds.max.y<1.6,'A standing player can reach the rope loop');
  assert(bell.bounds.max.y>=13.35&&bell.bounds.max.y<=13.42,'Suspension reaches and embeds in the dome apex');
  let meshes=0,triangles=0;bell.group.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;assert(o.geometry.attributes.position.array.every(Number.isFinite));assert(o.geometry.attributes.normal.array.every(Number.isFinite));assert(!o.matrixAutoUpdate,'Bell joins the frozen static world');}});
  assert(meshes<=BELL_BUDGET.meshes);assert(triangles<=BELL_BUDGET.triangles);assert.equal(triangles,bell.triangles);
  for(const material of bell.materials)assert(!material.map&&!material.bumpMap&&!material.normalMap,'Bell adds no texture memory');
  const shell=bell.solids.find(o=>o.name==='Hollow bronze bell shell');assert(shell);
  const p=shell.geometry.attributes.position,n=shell.geometry.attributes.normal;
  let exterior=0;
  for(let i=0;i<p.count;i++)if(p.getY(i)>.55&&p.getY(i)<.65&&Math.hypot(p.getX(i),p.getZ(i))>.90){assert(p.getX(i)*n.getX(i)+p.getZ(i)*n.getZ(i)>0,'Cast exterior faces outward, rather than vanishing through back-face culling');exterior++;}
  assert(exterior>30);
  state.world.updateMatrixWorld(true);
  const ray=new T.Raycaster(new T.Vector3(ROTUNDA_BELL.x+.13,1.68,ROTUNDA_BELL.z+.07),new T.Vector3(0,1,0));
  assert.equal(ray.intersectObject(shell,false).length,1,'Bell mouth is hollow, with a single inner ceiling rather than a cap at its lip');
  assert(ray.intersectObject(shell,false)[0].point.y>ROTUNDA_BELL.lipY+1.7);

  qa.start();qa.holdSpawns();qa.setPlayer(station.x,station.z+.6);qa.setAim(0,0);frames(2);
  assert(!elements.get('interaction').innerHTML.includes('GREAT ROTUNDA BELL'),'No prompt appears at the rope');
  const snapshot=()=>{const s=qa.get();return {points:s.points,totalScore:s.totalScore,health:s.health,wave:s.wave,toSpawn:s.toSpawn,mode:s.mode,rank:s.curse.rank};};
  const before=snapshot();qa.interact();listeners.keydown({code:'KeyE',repeat:false});listeners.keyup({code:'KeyE'});
  assert.deepEqual(snapshot(),before,'E at the rope does nothing');
  // v188: the Soul Forge stands in the middle of the rotunda, right under the bell,
  // facing the grand hall. Lanes either side of it stay open for players and brutes.
  const forge=state.interactables.find(s=>s.type==='upgrade'&&s.y===0&&roomAt(s.x,s.z)?.id==='rotunda');
  assert(forge&&forge.x===ROTUNDA_BELL.x&&forge.z===ROTUNDA_BELL.z&&!(forge.rotation||0),'The ground-floor Soul Forge stands under the bell, facing the hall');
  assert(!state.interactables.some(s=>s.type==='upgrade'&&s.y===0&&roomAt(s.x,s.z)?.id==='original'),'and has left the grand hall');
  assert(bell.bodyBounds.min.y>6.84,'The bell hangs up inside the dome, above the ceiling ring');
  assert(bell.bounds.max.y-bell.bodyBounds.max.y>1.2,'and still hangs on a visible length of chain');
  for(const height of [1.8,BRUTE.height])for(const lane of [-2.4,2.4])for(let z=ROTUNDA_BELL.z-4;z<=ROTUNDA_BELL.z+4;z+=.25)assert(!isBlocked(ROTUNDA_BELL.x+lane,z,.58,state.colliders,undefined,0,height));
  // Out of sight from the grand hall: no line from a standing or jumping eye in the
  // hall (more than 6 m back from the rotunda doorway) reaches the bell.
  {
    const skip=new Set();bell.group.traverse(o=>skip.add(o));const blockers=[];
    state.world.traverse(o=>{if(!o.isMesh||skip.has(o)||o.isInstancedMesh||!o.visible||o.userData.dynamic||Array.isArray(o.material))return;if(o.material.transparent&&o.material.opacity<.99)return;blockers.push(o);});
    const targets=[];for(let i=0;i<8;i++){const a=i/8*Math.PI*2;targets.push(new T.Vector3(ROTUNDA_BELL.x+Math.sin(a)*1.3,ROTUNDA_BELL.lipY+.05,ROTUNDA_BELL.z+Math.cos(a)*1.3));}
    targets.push(new T.Vector3(ROTUNDA_BELL.x,ROTUNDA_BELL.lipY+1.9,ROTUNDA_BELL.z));
    const sees=eye=>targets.some(p=>{const d=p.clone().sub(eye),len=d.length();const r=new T.Raycaster(eye,d.normalize(),0,len-.05);return !r.intersectObjects(blockers,false).length;});
    for(const x of [-4,-1.5,0,1.5,4])for(const z of [-6,-4.5,-3,1,5,9])for(const y of [1.7,2.7])assert(!sees(new T.Vector3(x,y,z)),`The bell is hidden from the hall at ${x},${y},${z}`);
    assert(sees(new T.Vector3(ROTUNDA_BELL.x+4,1.7,ROTUNDA_BELL.z+3)),'but is in view from the rotunda floor');
  }
  qa.setPlayer(ROTUNDA_BELL.x+2.4,ROTUNDA_BELL.z+3);qa.setAim(0,0);qa.setKeys(['KeyW']);frames(105);qa.setKeys([]);
  assert(qa.get().player.z<ROTUNDA_BELL.z-3,'The real keyboard loop walks past the forge beneath the bell');
  qa.setPlayer(ROTUNDA_BELL.x+2.4,ROTUNDA_BELL.z);listeners.keydown({code:'Space',preventDefault(){}});let peak=0;
  for(let i=0;i<70;i++){frames(1);peak=Math.max(peak,qa.get().player.y+1.8);}
  listeners.keyup({code:'Space'});assert(peak<bell.bodyBounds.min.y);assert.equal(qa.get().player.y,0);assert(qa.get().grounded);
  console.log(`PASS: rotunda bell landmark with no interaction, hollow outward-facing shell, hung on its chain inside the dome out of sight from the grand hall, the Soul Forge beneath it, clear lanes past the forge for players, jumps and brutes, and restart; ${meshes} static meshes / ${triangles} triangles / no new textures or lights.`);qa.start();
}

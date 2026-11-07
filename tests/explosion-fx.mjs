import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {EXPLOSION_FX} from '../public/game/explosion-fx.mjs';
import {GRENADE_MODEL,createGrenadeAssets} from '../public/game/grenade-throw.mjs';

// v185: a real-looking grenade and explosion.
export function verifyExplosionFx(qa,frames){
  // ---- The grenade model -------------------------------------------------------------------------
  {
    const {template}=createGrenadeAssets(),named=n=>template.getObjectByName(n);
    for(const n of ['Pineapple grenade body','Threaded fuse neck','Fuse striker housing','Safety lever','Safety pin','Pull ring','HE band','Base filler plug'])assert(named(n),`The grenade has a ${n.toLowerCase()}`);
    const body=named('Pineapple grenade body').geometry,p=body.attributes.position,c=body.attributes.color;
    assert(c&&named('Pineapple grenade body').material.vertexColors,'The body is painted in vertex colours');
    // Relief: around the equator the surface steps between segment faces and grooves.
    let lo=Infinity,hi=0;for(let i=0;i<p.count;i++){if(Math.abs(p.getY(i))>.006)continue;const r=Math.hypot(p.getX(i),p.getZ(i));lo=Math.min(lo,r);hi=Math.max(hi,r);}
    assert(hi-lo>GRENADE_MODEL.relief*.8&&hi<=GRENADE_MODEL.radius+GRENADE_MODEL.relief*.3,`Segments stand ${((hi-lo)*1000).toFixed(1)} mm proud of the grooves`);
    // Paint: grimy grooves, lighter worn faces, and a range of tones.
    const lum=[];for(let i=0;i<c.count;i++)lum.push(c.getX(i)+c.getY(i)+c.getZ(i));lum.sort((a,b)=>a-b);
    assert(lum[Math.floor(lum.length*.95)]>lum[Math.floor(lum.length*.05)]*2.2,'Paint varies from grime to worn edges');
    // The spoon lever hugs the body below the fuse: just clear of it, never through it.
    const lever=named('Safety lever').geometry.attributes.position;let gaps=[];
    for(let i=0;i<lever.count;i++){const y=lever.getY(i);if(y>.035||y<-.015)continue;const body=GRENADE_MODEL.radius*Math.sqrt(1-(y/GRENADE_MODEL.halfHeight)**2);gaps.push(Math.hypot(lever.getX(i),lever.getZ(i))-body);}
    assert(gaps.length&&Math.min(...gaps)>-.0002&&Math.max(...gaps)<.006,`The lever follows the body (${(Math.min(...gaps)*1000).toFixed(1)} to ${(Math.max(...gaps)*1000).toFixed(1)} mm)`);
    let tris=0;template.traverse(o=>{if(o.isMesh)tris+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});assert(tris<40000,`Within budget (${tris} triangles)`);
  }

  // ---- The explosion ---------------------------------------------------------------------------------
  qa.start();qa.holdSpawns();qa.setPlayer(0,24);frames(1);
  const s=qa.get(),fx=s.explosionFx,count=()=>{let n=0;s.world.traverse(()=>n++);return n;};
  const before=count();
  qa.explode(new T.Vector3(0,.12,15));
  const blast=s.effects.find(e=>e.type==='blast'),slot=blast.burst;
  assert(slot.active&&slot.ground&&!blast.mesh.castShadow,'A grounded burst, anchoring the light flash');
  assert(slot.floorY>.02&&slot.floorY<.1,`Scorch sits on the visible paving (${slot.floorY.toFixed(3)} m), not under it`);
  frames(9);
  const shown=list=>list.filter(p=>p.mesh.visible).length;
  assert(slot.flash.visible||shown(slot.fire)>EXPLOSION_FX.fire*.6,'A white-hot flash and fireball');
  assert(shown(slot.fire)>EXPLOSION_FX.fire*.6,'The fireball is up within a few frames');
  assert(slot.sparks.visible&&slot.debris.visible&&slot.ring.visible,'Sparks, debris and a dust ring');
  const fire=slot.fire.find(p=>p.mesh.visible).mesh.material.color;assert(fire.r>fire.g&&fire.g>fire.b,'Fire is hot orange');
  frames(45);
  assert(shown(slot.fire)<EXPLOSION_FX.fire*.5&&shown(slot.smoke)>EXPLOSION_FX.smoke*.6&&shown(slot.soot)>0,'After a second the fire gives way to soot and smoke');
  const top=Math.max(...slot.smoke.filter(p=>p.mesh.visible).map(p=>p.mesh.position.y));assert(top>1.2,`Smoke rises (${top.toFixed(2)} m)`);
  const scorch=fx.scorches.find(c=>c.mesh.visible);assert(scorch&&Math.abs(scorch.mesh.position.y-slot.floorY)<.03,'A scorch mark is left on the floor');
  frames(60*4);assert(!slot.active&&!fx.active,'Everything but the scorch is gone within five seconds');assert(scorch.mesh.visible,'The scorch lingers');
  frames(60*12);assert(!scorch.mesh.visible,'and fades after about 16 seconds');
  // Mid-air bursts (thrown off a balcony, Bella's shells over a rail) leave no scorch or ring.
  {qa.explode(new T.Vector3(0,5,15));const air=s.effects.find(e=>e.type==='blast').burst;assert(!air.ground&&!air.ring.visible);const scorches=fx.scorches.filter(c=>c.mesh.visible).length;assert.equal(scorches,0,'No scorch from a mid-air burst');}
  // Pooled: a storm of explosions builds nothing new and recycles the oldest slots.
  qa.start();qa.holdSpawns();qa.setPlayer(0,24);frames(1);const base=count();
  for(let i=0;i<20;i++){qa.explode(new T.Vector3(-6+i*.6,.12,14));frames(3);}
  assert.equal(count(),base,'Twenty explosions add no objects to the world');assert(fx.active<=EXPLOSION_FX.slots);
  assert.equal(before,base,'and neither did the first');
  qa.start();assert(!fx.active&&fx.scorches.every(c=>!c.mesh.visible),'A new run clears smoke and scorch marks');
  console.log(`PASS: grenade: Mk 2 pineapple with ${GRENADE_MODEL.columns}×${GRENADE_MODEL.rows} raised segments, grimy grooves and worn paint, threaded fuse, a spoon lever that hugs the body, split pin and pull ring; explosion: flash, cooling fireball with soot, rising smoke, sparks, debris, dust ring and a scorch on the visible floor; mid-air bursts leave no scorch; fully pooled, cleared each run.`);
}

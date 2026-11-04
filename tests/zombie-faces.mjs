import assert from 'node:assert/strict';
import {FACES,faceRecipe,rollFace,clearFace} from '../public/game/zombie-faces.mjs';

const own=node=>node.children.find(o=>o.isMesh&&o.material.userData.bakedPalette),eyes=node=>node.children.find(o=>o.isMesh&&o.material.userData.enemyEyes);
const bytes=g=>Object.values(g.attributes).reduce((s,a)=>s+a.array.byteLength,0)+(g.index?.array.byteLength||0);

// v183: more faces: extra heads per body made at load, plus each zombie's own
// head proportions, jaw hang and eye glow.
export function verifyZombieFaces(qa,frames){
  const assets=qa.get().enemyAssets,kit=assets.faces;
  // ---- The kit ------------------------------------------------------------------
  for(const [index,count] of Object.entries(FACES.variants)){
    const list=kit.faces.get(+index),t=assets.templates[+index];
    assert.equal(list?.length,count,`Body ${index} has ${count} extra faces`);
    const base=own(t.head).geometry;
    for(const v of list){
      assert(v.head!==base&&v.head.attributes.position.count!==base.attributes.position.count||[...v.head.attributes.position.array.slice(0,300)].some((x,i)=>x!==base.attributes.position.array[i]),'Each extra face is its own sculpt');
      for(const name of Object.keys(base.attributes))assert(v.head.attributes[name],`with the same ${name} layout the body’s materials expect`);
      assert(v.head.attributes.normal.normalized&&v.head.attributes.color.array instanceof Uint8Array,'packed to save memory');
    }
    assert(new Set(list.map(v=>`${v.recipe.style.nose}/${v.recipe.style.hair}`)).size===list.length,'No two extra faces of a body share both nose and hair');
  }
  let total=0,n=0;for(const list of kit.faces.values())for(const v of list){total+=bytes(v.head)+bytes(v.jaw)+bytes(v.eyes);n++;}
  assert.equal(n,17);assert(total<20*1048576,`All ${n} extra faces take ${(total/1048576).toFixed(1)} MB`);
  assert.deepEqual(faceRecipe(2,1),faceRecipe(2,1),'Recipes are fixed, so faces are the same every run');

  // ---- Rolls ----------------------------------------------------------------------
  {
    const N=4000,counts=[0,0,0,0];
    for(let i=0;i<N;i++){const f=rollFace(1000+i*7919,3);counts[f.variant]++;
      for(const [axis,[lo,hi]] of Object.entries(FACES.headScale))assert(f.scale[axis]>=lo&&f.scale[axis]<=hi);
      assert(f.jawHang>=FACES.jawHang[0]&&f.jawHang<=FACES.jawHang[1]&&f.eye>=0&&f.eye<FACES.eyeBright.length*FACES.eyeHue.length);}
    assert(counts.every(c=>Math.abs(c/N-.25)<.03),`Each of a walker body's four faces turns up about equally (${counts})`);
    assert.deepEqual(rollFace(42,3),rollFace(42,3),'A zombie’s face is reproducible from its seed');
  }

  // ---- Spawned zombies ---------------------------------------------------------------
  qa.start();qa.holdSpawns();qa.setHealth(1e9);for(const z of qa.get().zombies)qa.damageEnemy(z,1e7);frames(2);
  const crowd=[];for(let i=0;i<48;i++)crowd.push(qa.makeZombie(-24+i,12+(i%3)*2));
  const combos=new Set(crowd.map(e=>`${e.templateIndex}:${e.face.variant}`));
  assert(combos.size>=13,`48 walkers show ${combos.size} different faces`);
  for(const e of crowd){
    const t=assets.templates[e.templateIndex],v=e.face.variant?kit.faces.get(e.templateIndex)[e.face.variant-1]:null;
    assert.equal(own(e.head).geometry,v?v.head:own(t.head).geometry,'The head wears its rolled face');
    assert.equal(own(e.jaw).geometry,v?v.jaw:own(t.jaw).geometry,'with the matching jaw');
    assert.equal(eyes(e.head).geometry,v?v.eyes:eyes(t.head).geometry,'and eyes seated in it');
    assert(Math.abs(e.head.scale.x/t.head.scale.x-e.face.scale.x)<1e-9&&Math.abs(e.head.scale.y/t.head.scale.y-e.face.scale.y)<1e-9,'Its own head proportions');
    const m=eyes(e.head).material,base=eyes(t.head).material;
    assert(kit.eyePool.includes(m)&&m===kit.eyePool[e.face.eye]&&String(m.onBeforeCompile)===String(base.onBeforeCompile),'One of the shared eye glows, on the same eye shader');
    assert(m.emissive.r>=m.emissive.g&&m.emissive.r>.9&&m.emissive.b<.1,'always a hostile red to ember orange');
  }
  assert(!eyes(assets.templates[0].head).material.userData.pooledEyes,'The templates themselves are untouched');
  assert.equal(kit.eyePool.length,FACES.eyeBright.length*FACES.eyeHue.length,'Twelve eye glows are made once, at load');
  const hues=crowd.map(e=>eyes(e.head).material.emissive.g),glows=crowd.map(e=>eyes(e.head).material.emissiveIntensity);
  assert(Math.max(...hues)-Math.min(...hues)>.015&&Math.max(...glows)/Math.min(...glows)>1.6,'Eyes range from dim embers to hot orange-red');
  frames(30);const jaws=crowd.slice(0,20).map(e=>e.jaw.rotation.x);assert(Math.max(...jaws)-Math.min(...jaws)>.06,'Jaws hang at different angles');

  // ---- No per-spawn geometry; crushed skulls; elites --------------------------------------
  {
    const known=new Set();for(const t of assets.templates)t.group.traverse(o=>{if(o.isMesh)known.add(o.geometry);});
    for(const list of kit.faces.values())for(const v of list){known.add(v.head);known.add(v.jaw);known.add(v.eyes);}
    for(const list of assets.injuries.crushed.values())for(const g of list)known.add(g);
    for(const g of Object.values(assets.injuries.props))known.add(g);for(const g of Object.values(assets.injuries.caps))known.add(g);
    qa.start();for(let i=0;i<12;i++)qa.startWave();qa.holdSpawns();qa.setPlayer(0,0);qa.setHealth(1e9);
    let spawned=0,crushed=null;
    for(let i=0;i<260;i++){for(const z of qa.get().zombies)if(!z.dead&&z!==crushed)qa.damageEnemy(z,1e7);frames(1);if(!qa.spawnEnemy()){qa.startWave();qa.holdSpawns();continue;}const e=qa.get().zombies.at(-1);spawned++;
      e.group.traverse(o=>{if(o.isMesh)assert(known.has(o.geometry),'No spawn builds geometry of its own');});
      if(!crushed&&e.injury?.major==='skull'&&e.face?.variant>0)crushed=e;}
    assert(spawned>150);
    if(crushed){const t=assets.templates[crushed.templateIndex];assert(own(crushed.head).geometry.userData.crushedHead&&own(crushed.jaw).geometry===own(t.jaw).geometry&&eyes(crushed.head).geometry===eyes(t.head).geometry,'A crushed skull is made from the body’s own head, with its own jaw and eyes');}
    const warden=qa.makeElite('warden',4,8);
    assert(!warden.face&&!eyes(warden.head).material.userData.pooledEyes,'Elite bosses keep their own faces');
    const e=qa.makeZombie(3,8),m=eyes(e.head).material;let disposed=false;m.addEventListener('dispose',()=>{disposed=true;});clearFace(e);
    assert(!disposed&&!e.face&&eyes(e.head).material===eyes(assets.templates[e.templateIndex].head).material,'Clearing a face restores its body’s eyes and releases nothing shared');
  }
  console.log(`PASS: more faces: ${n} extra heads made at load (${(total/1048576).toFixed(1)} MB packed): 3 per walker body, 2 for brutes and ferals, 1 for Lurkers, each with its own nose, hair, ears, jaw, lips and skull; spawns pick one evenly (${combos.size} faces in 48 walkers) plus their own head proportions, jaw hang and one of 12 shared eye glows; crushed skulls use the body's own head; elites untouched; no per-spawn geometry.`);
}

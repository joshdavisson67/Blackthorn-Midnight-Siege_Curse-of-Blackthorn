import assert from 'node:assert/strict';
import {CELLAR,inCellar} from '../public/game/cellar-layout.mjs';
import {OLIVIA_ATTIC as A} from '../public/game/vertical.mjs';
import {EASTER_EGG} from '../public/game/olivia.mjs';
import {CAMP_RULES,CAMP_AREAS,campKindAllowed} from '../public/game/camp-spawns.mjs';

// v174: neither the storm cellar nor Olivia's room is a safe place to camp.
// After a short grace, one wave spawn in three claws up through the floor in
// the room with the player, at its far side, and comes for them.
export function verifyCampSpawns(qa,frames){
  const st=()=>qa.get(),alive=()=>st().zombies.filter(e=>!e.dead);
  const clear=()=>{for(const e of alive())qa.damageEnemy(e,1e7);frames(2);};
  const place=(x,z,y)=>{qa.setPlayer(x,z,y);st().nav.rebuild(x,z,y);frames(1);};
  qa.start();while(st().wave<CELLAR.unlockWave)qa.startWave();qa.holdSpawns();st().cellar.update(2);qa.setHealth(1e9);clear();
  const spawnOne=()=>{const before=new Set(st().zombies);st().toSpawn=Math.max(st().toSpawn,5);assert(qa.spawnEnemy(),'A wave spawn goes ahead');return st().zombies.find(e=>!before.has(e));};

  // Out in the hall nothing changes: spawns keep their 10 m distance.
  place(0,5,0);frames(Math.ceil(CAMP_RULES.grace*60)+10);
  for(let i=0;i<4;i++){const e=spawnOne();assert(!e.campBorn&&Math.hypot(e.walkPos.x,e.walkPos.z-5)>10,'Away from the camping rooms, spawns stay at least 10 m off');}
  clear();

  // The storm cellar: a short grace first, then the floor gives way.
  const cx=CELLAR.x,cz=CELLAR.entryZ+2.5;place(cx,cz,CELLAR.y);assert(inCellar(cx,cz));
  frames(60);assert.equal(st().campWatch.area,null,'Passing through is free for the first few seconds');
  assert(!spawnOne().campBorn,'Nothing rises during the grace period');clear();
  frames(Math.ceil(CAMP_RULES.grace*60));assert.equal(st().campWatch.area?.id,'cellar','Holding the cellar counts as camping');
  const pattern=[];let first=null;
  for(let i=0;i<6;i++){const e=spawnOne();pattern.push(e.campBorn?1:0);if(e.campBorn&&!first)first=e;}
  assert.deepEqual(pattern,[1,0,0,1,0,0],`One spawn in three rises inside the cellar (${pattern})`);
  for(const e of alive().filter(e=>e.campBorn)){
    assert(inCellar(e.walkPos.x,e.walkPos.z)&&Math.abs(e.floorY-CELLAR.y)<.01,'It rises on the cellar floor');
    assert(Math.hypot(e.walkPos.x-cx,e.walkPos.z-cz)>=CAMP_RULES.minDistance,'and never under the player’s feet');
  }
  assert(first.emergeLeft>0&&first.group.position.y<CELLAR.y-1,'It claws up out of the floor rather than popping in');
  for(const e of alive())if(!e.campBorn)qa.damageEnemy(e,1e7);frames(2);
  frames(Math.ceil(CAMP_RULES.emergeTime*60)+2);
  assert(first.emergeLeft===0&&Math.abs(first.group.position.y-(CELLAR.y-.02))<.05,`Once up, it stands on the cellar floor (${first.group.position.y.toFixed(2)})`);
  const hp=st().health;for(let i=0;i<1200&&st().health>=hp;i++)frames(1);
  assert(st().health<hp,'and the cellar camper takes hits');
  clear();

  // Olivia's room: walkers and dogs only, never more than three at once.
  assert(!campKindAllowed(CAMP_AREAS.find(a=>a.id==='attic'),'brute')&&campKindAllowed(CAMP_AREAS.find(a=>a.id==='cellar'),'brute'),'Brutes rise in the cellar but never under the garret ceiling');
  qa.openAttic();frames(Math.ceil(EASTER_EGG.openTime*60)+4);
  const ax=A.x+1.6,az=A.z+3.0;place(ax,az,A.y);frames(Math.ceil(CAMP_RULES.grace*60)+4);
  assert.equal(st().campWatch.area?.id,'attic','Holding Olivia’s room counts as camping');
  let up=null;for(let i=0;i<12&&!up;i++){const e=spawnOne();if(e.campBorn)up=e;}
  assert(up,'Something rises in Olivia’s room');assert(!up.brute);
  assert(Math.abs(up.walkPos.x-A.x)<=A.w/2&&Math.abs(up.walkPos.z-A.z)<=A.d/2&&Math.abs(up.floorY-A.y)<.01,'It rises on the attic floor');
  assert(Math.hypot(up.walkPos.x-ax,up.walkPos.z-az)>=CAMP_RULES.minDistance,'at the far side of the room');
  for(let i=0;i<30;i++){st().toSpawn=5;qa.spawnEnemy();for(const e of alive())if(e.campBorn!=='attic')qa.damageEnemy(e,1e7);frames(1);}
  {const n=alive().filter(e=>e.campBorn==='attic').length;assert(n>=2&&n<=3,`No more than three crowd up into the room at once (${n})`);}
  for(const e of alive())if(e.campBorn!=='attic')qa.damageEnemy(e,1e7);frames(2);
  const hp2=st().health;for(let i=0;i<1200&&st().health>=hp2;i++)frames(1);
  assert(st().health<hp2,'and the attic camper takes hits');
  qa.start();assert.equal(st().campWatch.area,null,'A new run starts with no camping clock');
  console.log(`PASS: camping is dangerous: after a ${CAMP_RULES.grace}s grace, one spawn in ${CAMP_RULES.every} claws up through the floor of the storm cellar or Olivia’s room at least ${CAMP_RULES.minDistance} m away (brutes only in the cellar, at most 3 in the attic) and lands hits; hall spawns keep their 10 m distance.`);
}

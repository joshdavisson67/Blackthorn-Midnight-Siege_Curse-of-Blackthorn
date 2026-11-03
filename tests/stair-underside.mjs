import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {isBlocked} from '../public/game/core.mjs';
import {UPPER_Y,STAIR,OLIVIA_ATTIC,stairHeight} from '../public/game/vertical.mjs';
import {EASTER_EGG} from '../public/game/olivia.mjs';

// v173: nothing can get under (or behind) the main staircase or Olivia's attic
// stairs, and knocked-down crawlers still climb and descend both.
export function verifyStairUnderside(qa,frames){
  qa.start();qa.holdSpawns();qa.setHealth(1e9);for(const e of [...qa.get().zombies])qa.damageEnemy(e,1e7);frames(2);
  const st=()=>qa.get(),C=st().colliders,ZR=.38;
  // Main flight: the floor under it is solid all the way from the hall wall to the banister.
  const fill=C.find(c=>c.underStair&&!c.attic);assert(fill,'The main staircase has a solid underside');
  for(const z of [-3,-4.5,-6,-7.5,-8.8])for(const x of [-5.2,-4.6,-3.9,-3.1,-2.85])assert(isBlocked(x,z,ZR,C,undefined,0,1.8),`Nothing stands under the flight at (${x}, ${z})`);
  // ...while the flight itself is still walkable at every height.
  for(const z of [-2.6,-4,-5.6,-7,-8.6]){const y=stairHeight(STAIR.x,z);assert(!isBlocked(STAIR.x,z,ZR,C,undefined,y,1.8),`The treads stay walkable at z ${z}`);}
  assert(!isBlocked(STAIR.x,-10.4,ZR,C,undefined,UPPER_Y,1.8)&&!isBlocked(-3.9,-.8,ZR,C,undefined,0,1.8),'Both ends of the flight stay open');

  // A knocked-down walker crawls up to a player on the landing, then back down.
  const crawler=(x,z,y=0)=>{const e=qa.makeZombie(x,z,false,false,false,y);const leg={part:'leg',side:1,direction:new T.Vector3(0,0,-1),force:1,source:'glock'};for(let i=0;i<30&&!e.crawling;i++)qa.damageEnemy(e,e.maxHp*.05,false,leg);assert(e.crawling&&!e.dead,'The walker is down and crawling');e.speed=2.2;return e;};
  qa.setPlayer(0,-10.4,UPPER_Y);st().nav.rebuild(0,-10.4,UPPER_Y);
  const up=crawler(1,-.5);frames(90);
  for(let i=0;i<5400&&up.floorY<UPPER_Y-.02;i++)frames(1);
  assert(up.floorY>UPPER_Y-.02,`A crawler climbs the main flight (${up.walkPos.toArray().map(v=>v.toFixed(1))})`);
  qa.setPlayer(1,1,0);st().nav.rebuild(1,1,0);for(let i=0;i<5400&&up.floorY>.02;i++)frames(1);
  assert(up.floorY<.02,`and crawls back down it (${up.walkPos.toArray().map(v=>v.toFixed(1))})`);
  qa.damageEnemy(up,1e7);frames(2);

  // Olivia's attic stairs: supports appear and the underside turns solid only once they are down.
  const A=OLIVIA_ATTIC,S=A.stair,attic=st().attic;
  assert(attic.underStair.length>=5&&attic.underStair.every(c=>c.disabled),'Closed, the bedchamber floor under the hatch is free');
  assert(!attic.supports.visible);
  // Someone standing where the flight lands is moved out to its side.
  qa.setPlayer(S.x,-6.6,UPPER_Y);frames(1);qa.openAttic();frames(Math.ceil(EASTER_EGG.openTime*60)+4);
  assert(attic.supports.visible&&attic.underStair.every(c=>!c.disabled),'Open, the supports stand and the underside is solid');
  assert(Math.abs(st().player.x-S.x)>S.w/2,'The player standing underneath is moved out to the side');
  for(const z of [-5,-6,-7,-7.4])assert(isBlocked(S.x,z,ZR,C,undefined,UPPER_Y,1.8),`Nothing gets under the attic stairs at z ${z}`);
  for(const z of [-5,-6,-7])assert(!isBlocked(S.x,z,ZR,C,undefined,0,1.8)||isBlocked(S.x,z,ZR,C.filter(c=>!c.underStair),undefined,0,1.8),'The hall below is untouched');
  for(const z of [-4.2,-5.6,-7])assert(!isBlocked(S.x,z,.3,C,undefined,stairHeight(S.x,z),1.2),`The attic treads stay walkable at z ${z}`);

  // A crawler follows the player up into the attic and back down.
  qa.setPlayer(A.x+.6,A.z-1,A.y);frames(1);
  const climber=crawler(-35.5,-3.2,UPPER_Y);frames(60);
  for(let i=0;i<7200&&climber.floorY<A.y-.3;i++)frames(1);
  assert(climber.floorY>A.y-.3,`A crawler climbs the attic stairs (${climber.walkPos.toArray().map(v=>v.toFixed(1))})`);
  qa.setPlayer(-36,-3,UPPER_Y);frames(1);for(let i=0;i<7200&&climber.floorY>UPPER_Y+.3;i++)frames(1);
  assert(climber.floorY<UPPER_Y+.3,`and crawls back down them (${climber.walkPos.toArray().map(v=>v.toFixed(1))})`);
  qa.start();assert(attic.underStair.every(c=>c.disabled)&&!attic.supports.visible,'A new run folds the stairs and frees the floor');
  console.log('PASS: the main staircase is panelled in and solid underneath (treads and both ends still open); the attic stairs gain supports and a solid underside once down (the hall below untouched, anyone underneath moved aside); crawlers climb and descend both flights.');
}

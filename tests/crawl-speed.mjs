import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {CRAWL} from '../public/game/zombies.mjs';

// v180: crawlers haul themselves along at 65% of a walker's speed.
export function verifyCrawlSpeed(qa,frames){
  assert.equal(CRAWL.speed,.65);
  const leg={part:'leg',side:1,direction:new T.Vector3(0,0,-1),force:1,source:'glock'};
  const travel=crawl=>{
    qa.start();qa.startWave();qa.holdSpawns();qa.setHealth(1e9);qa.setPlayer(0,0);
    const e=qa.makeZombie(0,16);e.life=null;e.flank=0;e.speed=1.2;e.attack=100;
    if(crawl){for(let i=0;i<30&&!e.crawling;i++)qa.damageEnemy(e,e.maxHp*.05,false,leg);assert(e.crawling&&!e.dead);e.legWounds=[0,0];e.hobble=0;}
    frames(Math.ceil(CRAWL.drop*60)+30);const z0=e.walkPos.z;frames(120);return (z0-e.walkPos.z)/2;
  };
  const walk=travel(false),crawl=travel(true);
  assert(Math.abs(crawl/walk-CRAWL.speed)<.03,`Crawlers move at 65% of walking speed (${crawl.toFixed(2)} vs ${walk.toFixed(2)} m/s, ${(crawl/walk*100).toFixed(1)}%)`);
  console.log(`PASS: crawlers move at ${(crawl/walk*100).toFixed(0)}% of a walker's speed (${crawl.toFixed(2)} vs ${walk.toFixed(2)} m/s).`);
}

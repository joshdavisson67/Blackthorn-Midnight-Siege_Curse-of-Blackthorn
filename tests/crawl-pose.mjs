import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {createZombieRig,animateZombie,CRAWL,crawlPose} from '../public/game/zombies.mjs';

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const SPEED=.65;
function crawler(seed,legless=null){
  const r=createZombieRig({rng:seeded(seed)});
  return Object.assign(r,{speed:1,attack:100,attackTime:-1,motion:0,legHit:0,staggerLeft:0,hp:100,maxHp:100,phase:0,crawling:true,crawl:1,crawlDrop:0,injury:legless?{legless}:null});
}
// Crawl in place (the rig itself does not travel), sampling in world space.
function sample(e,frames=360){
  const v=new T.Vector3(),out=[];
  for(let i=0;i<frames;i++){
    animateZombie(e,1/60,6,SPEED/60);e.group.updateMatrixWorld(true);if(i<120)continue;
    const s={};e.arms[0].pivot.getWorldPosition(v);s.shoulder=v.y;
    s.hands=e.arms.map(a=>{a.hand.getWorldPosition(v);return {y:v.y,z:v.z};});
    s.knees=e.legs.map(l=>{l.calf.getWorldPosition(v);return v.y;});
    s.joints=[e.root.position.y,e.root.rotation.x,e.spine.rotation.x,e.head.rotation.x,...e.arms.flatMap(a=>[a.pivot.rotation.x,a.forearm.rotation.x,a.hand.rotation.x]),...e.legs.map(l=>l.pivot.rotation.x)];
    out.push(s);
  }
  return out;
}

// v181: crawlers ride with the chest up on planted hands; with no legs left
// they are propped higher still on near-straight arms.
export function verifyCrawlPose(qa,frames){
  const kinds=[['both legs',null],['one leg',[false,true]],['no legs',[true,true]]];
  const shoulders=[],pitches=[],elbows=[];
  for(const [name,legless] of kinds){
    const e=crawler(17,legless),run=sample(e);
    assert.equal(crawlPose(e),CRAWL.poses[2-(legless?legless.filter(Boolean).length:0)]);
    const sh=Math.min(...run.map(s=>s.shoulder));shoulders.push(sh);pitches.push(e.root.rotation.x);
    elbows.push(Math.max(...run.map(s=>Math.max(e.arms[0].forearm.rotation.x,-9))));
    assert(sh>.48,`${name}: the chest is carried up off the floor (shoulders ${sh.toFixed(2)} m)`);
    // Each hand spends its stance down on the floor, then lifts to reach.
    for(const j of [0,1]){
      // The wrist joint sits a hand's length above the floor when the palm is down.
      const ys=run.map(s=>s.hands[j].y),floor=Math.min(...ys),down=ys.filter(y=>y<floor+.03).length/ys.length;
      assert(floor<.15&&down>.35&&Math.max(...ys)>floor+.08,`${name}: hand ${j} plants and lifts (${(down*100).toFixed(0)}% planted)`);
    }
    // Planted hands hold their ground: while down, each slides back about as
    // far as the body travels over it, not further.
    for(const j of [0,1]){
      const floor=Math.min(...run.map(s=>s.hands[j].y))+.03;let slide=0,frames=0;for(let i=1;i<run.length;i++)if(run[i].hands[j].y<floor&&run[i-1].hands[j].y<floor){slide+=run[i-1].hands[j].z-run[i].hands[j].z;frames++;}
      const body=frames*SPEED/60;assert(frames>20&&slide>body*.45&&slide<body*1.5,`${name}: planted hand ${j} keeps pace with the body (${slide.toFixed(2)} m vs ${body.toFixed(2)} m)`);
    }
    // Whatever legs remain trail along the floor.
    assert(run.every(s=>s.knees.every(y=>y<.2)),`${name}: the legs drag along the floor`);
    // No snapping anywhere through the cycle.
    for(let i=2;i<run.length;i++)run[i].joints.forEach((x,k)=>assert(Math.abs(x-2*run[i-1].joints[k]+run[i-2].joints[k])<.08,`${name}: joint ${k} snaps mid-crawl`));
  }
  assert(shoulders[2]>shoulders[0]+.06&&shoulders[1]>shoulders[0],`With fewer legs the body is propped higher (${shoulders.map(v=>v.toFixed(2))})`);
  assert(pitches[2]<pitches[1]&&pitches[1]<pitches[0],'and more upright');
  assert(elbows[2]>elbows[0]-.05,'on straighter arms');

  // In the estate: a legless spawn arrives propped up and crawls at 65%.
  qa.start();qa.startWave();qa.holdSpawns();qa.setHealth(1e9);qa.setPlayer(0,0);
  const e=qa.makeZombie(0,14);e.life=null;e.flank=0;e.speed=1.2;e.injury={major:null,side:0,legless:[true,true],props:[]};e.crawling=true;e.crawl=1;e.crawlDrop=0;e.bodyHeight=CRAWL.height;
  frames(60);const z0=e.walkPos.z;frames(120);
  assert(Math.abs(e.root.rotation.x-CRAWL.poses[0].pitch)<.06,'A legless spawn crawls propped up on its arms');
  assert(Math.abs((z0-e.walkPos.z)/2/e.speed-CRAWL.speed)<.05,'still at 65% speed');
  console.log(`PASS: crawlers carry the chest up on planted hands (shoulders ${shoulders.map(v=>v.toFixed(2)).join(' / ')} m for both / one / no legs), hands plant, hold and lift hand-over-hand without skating, remaining legs drag flat, legless crawlers prop up near-upright on straighter arms; no snaps.`);
}

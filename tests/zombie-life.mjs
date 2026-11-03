import assert from 'node:assert/strict';
import {createZombieRig,animateZombie} from '../public/game/zombies.mjs';
import {LIFE,createLife,updateLife,settleLife} from '../public/game/zombie-life.mjs';

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const range=v=>Math.max(...v)-Math.min(...v);
const open={dist:30,sameFloor:true,clear:false,stairs:false,attackReady:false};
// Walk a bare actor for `seconds`, advancing its stride phase by the ground covered.
function walk(e,seconds,ctx=open,speed=1.2){const out=[];let moved=0;for(let i=0;i<seconds*60;i++){const r=updateLife(e,1/60,{...ctx,moved});moved=speed*r.pace/60;e.phase+=moved*6.4/e.stride;out.push({...r,stumbleW:e.stumbleW,lungeW:e.lungeW});}return out;}
const actor=(seed,opts)=>({phase:0,stride:1.25,life:createLife(seed,opts)});

// v175: lively walkers. Temperaments give each zombie its own lurch, surges,
// weave, stumbles and lunges, without changing how fast they get anywhere.
export function verifyZombieLife(qa,frames){
  // ---- Temperaments --------------------------------------------------------
  const crowd=Array.from({length:200},(_,i)=>createLife(1000+i*7919));
  const types=new Set(crowd.map(l=>l.type));
  for(const t of ['shambler','lurcher','stalker','staggerer'])assert(types.has(t),`Some walkers are ${t}s`);
  assert(range(crowd.map(l=>l.rhythm))>.25&&range(crowd.map(l=>Math.abs(l.weave)))>.2&&range(crowd.map(l=>l.vigor))>.7,'Rhythm, weave and sway vary across a crowd');
  assert(crowd.some(l=>l.weave>0)&&crowd.some(l=>l.weave<0),'They weave to either side first');
  assert.deepEqual({...createLife(4242),rand:0},{...createLife(4242),rand:0},'A temperament is reproducible from its seed');
  for(let i=0;i<20;i++){assert.equal(createLife(i*31,{feral:true}).type,'stalker');const b=createLife(i*31,{brute:true});assert(b.type==='plodder'&&b.weave===0&&b.lungeChance===0,'Brutes plod: no weave, no lunge');}

  // ---- Same average speed, very different shape ----------------------------
  for(let i=0;i<40;i++){
    const e=actor(500+i*977);e.life.stumbleIn=1e9;e.life.stumbleEvery=[1e9,1e9];
    const pace=walk(e,120).map(r=>r.pace),avg=pace.reduce((a,b)=>a+b,0)/pace.length;
    // Time-average of the multiplier; distance covered per second is what counts.
    assert(avg>.97&&avg<1.04,`${e.life.type} keeps its average speed (${avg.toFixed(3)})`);
  }
  for(let i=0;i<20;i++){const e=actor(9000+i*131),pace=walk(e,180).map(r=>r.pace),avg=pace.reduce((a,b)=>a+b,0)/pace.length;assert(avg>.95&&avg<1.05,`Stumbles and their catch-up even out (${e.life.type} ${avg.toFixed(3)})`);}
  {
    const lurch=crowd.findIndex(l=>l.type==='lurcher'),stalk=crowd.findIndex(l=>l.type==='stalker');
    const swing=seed=>{const e=actor(seed);e.life.stumbleIn=1e9;return range(walk(e,6).map(r=>r.pace));};
    const a=swing(1000+lurch*7919),b=swing(1000+stalk*7919);
    assert(a>.45,`A lurcher surges and drags with every step (${a.toFixed(2)})`);assert(b<a*.6,`A stalker moves far more evenly (${b.toFixed(2)})`);
  }

  // ---- Weave: across open floor, straightening near the player and on stairs --
  {
    const seed=1000+crowd.findIndex(l=>l.type==='staggerer'&&Math.abs(l.weave)>.18)*7919,e=actor(seed);e.life.stumbleIn=1e9;
    const far=walk(e,20).slice(120).map(r=>r.weave);
    assert(Math.max(...far.map(Math.abs))>Math.abs(e.life.weave)*.8,'Out in the open it drifts side to side');
    assert(far.some(v=>v>0)&&far.some(v=>v<0),'to both sides');
    const near=walk(e,3,{...open,dist:2}).slice(90).map(r=>Math.abs(r.weave));assert(Math.max(...near)<.01,'It walks straight at a player within reach');
    const stairs=walk(e,3,{...open,stairs:true}).slice(90).map(r=>Math.abs(r.weave));assert(Math.max(...stairs)<.01,'and straight up and down stairs');
  }

  // ---- Stumbles ---------------------------------------------------------------
  {
    const seed=1000+crowd.findIndex(l=>l.type==='staggerer')*7919,e=actor(seed),run=walk(e,30);
    const first=run.findIndex(r=>r.stumbleW>0);assert(first>=0&&first<12*60,'A staggerer trips within a few strides');
    const trip=run.slice(first,first+Math.round(LIFE.stumble.time*60));
    assert(Math.min(...trip.map(r=>r.pace))<.5,'It nearly stops as it trips');
    assert(Math.max(...trip.map(r=>r.stumbleW))>.95&&run[first].stumbleW<.15,'The trip eases in and out');
    for(const ctx of [{...open,stairs:true},{...open,dist:2}]){const s=actor(seed);assert(walk(s,40,ctx).every(r=>r.stumbleW===0),'Never on stairs, never right at the player');}
    const brute=actor(77,{brute:true});assert(walk(brute,60).every(r=>r.stumbleW===0),'Brutes never trip');
  }

  // ---- Lunges -------------------------------------------------------------------
  {
    const seed=1000+crowd.findIndex(l=>l.type==='stalker')*7919,ready={...open,dist:3.4,clear:true,attackReady:true};
    const e=actor(seed);e.life.stumbleIn=1e9;e.life.lungeCd=0;const run=walk(e,20,ready);
    const lunges=run.filter((r,i)=>r.lungeW>.5&&!(run[i-1]?.lungeW>.5)).length;
    assert(lunges>=2,`A stalker lunges when the player is a few strides away (${lunges})`);
    assert(Math.max(...run.map(r=>r.pace))>1.35,'Lunges are a real burst of speed');
    assert(lunges<=20/LIFE.lunge.cooldown[0]+1,'with a cooldown between them');
    for(const ctx of [{...ready,dist:7},{...ready,clear:false},{...ready,stairs:true},{...ready,attackReady:false},{...ready,sameFloor:false}]){
      const s=actor(seed);s.life.stumbleIn=1e9;s.life.lungeCd=0;assert(walk(s,10,ctx).every(r=>r.lungeW<.01),`No lunge ${JSON.stringify(ctx)}`);
    }
    const s=actor(seed);s.life.lunge=.3;settleLife(s,1/60);assert(s.life.lunge===0&&s.stumbleW===0,'Crawling or attacking settles it at once');
  }

  // ---- The body sells it ------------------------------------------------------
  {
    const rig=seed=>{const r=createZombieRig({rng:seeded(seed)});return Object.assign(r,{speed:1.2,attack:100,attackTime:-1,motion:0,legHit:0,staggerLeft:0,hp:100,maxHp:100,phase:0});};
    const settle=(e,n=40)=>{for(let i=0;i<n;i++)animateZombie(e,1/60,6,e.speed/60);};
    // Rigs differ call to call, so compare one rig with and without the pose.
    const snap=e=>({spine:e.spine.rotation.x,head:e.head.rotation.x,arms:e.arms.map(a=>a.pivot.rotation.x)});
    const trip=rig(3);settle(trip,120);const calm=snap(trip);trip.stumbleW=1;settle(trip,20);const tripped=snap(trip);
    assert(tripped.spine>calm.spine+.3,'A stumble pitches the body forward');
    assert(tripped.arms.every((a,j)=>a<calm.arms[j]-.5),'and flings both arms out to catch it');
    assert(tripped.head<calm.head-.25,'while the head comes up to see where it is going');
    const lunge=rig(5);settle(lunge,120);const before=snap(lunge);lunge.lungeW=1;settle(lunge,20);
    assert(snap(lunge).arms.every((a,j)=>a<before.arms[j]-.7),'A lunge throws both arms forward');
    const sway=v=>{const e=rig(9);e.gait={...e.gait,sway:1};e.vigor=v;const out=[];for(let i=0;i<300;i++){animateZombie(e,1/60,6,e.speed/60);if(i>120)out.push(e.root.rotation.z);}return range(out);};
    assert(sway(1.5)>sway(.7)*1.6,'Vigorous walkers rock far more than heavy plodders');
    const e=rig(11),still=[],pushed=[];for(let i=0;i<480;i++){e.lurchPulse=i<240?0:.35*Math.sin(i/10);animateZombie(e,1/60,6,e.speed/60);if(i>60&&i<240)still.push(e.spine.rotation.x);if(i>300)pushed.push(e.spine.rotation.x);}
    assert(range(pushed)>range(still)+.12,'The chest pitches into each lurching push-off');
  }

  // ---- In the estate ------------------------------------------------------------
  {
    qa.start();qa.holdSpawns();qa.setHealth(1e9);for(const z of qa.get().zombies)qa.damageEnemy(z,1e7);frames(2);
    const z0=26,p0=-4;
    const chase=(setup)=>{
      qa.start();qa.holdSpawns();qa.setHealth(1e9);qa.setPlayer(0,p0);qa.get().nav.rebuild(0,p0,0);
      const e=qa.makeZombie(0,z0);e.speed=1.2;e.flank=0;setup(e);let lateral=0,t=0;
      for(;t<60*60&&Math.hypot(e.walkPos.x,e.walkPos.z-p0)>2.2;t++){frames(1);lateral=Math.max(lateral,Math.abs(e.walkPos.x));}
      return {e,t:t/60,lateral};
    };
    const plain=chase(e=>{e.life=null;});
    const weaver=chase(e=>{e.life.type='staggerer';e.life.weave=.24;e.life.stumbleIn=1e9;e.life.lungeChance=0;});
    assert(weaver.lateral>plain.lateral+.25,`A weaving walker sways off the straight line (${weaver.lateral.toFixed(2)} m vs ${plain.lateral.toFixed(2)} m)`);
    assert(weaver.t<plain.t*1.15&&weaver.t>plain.t*.85,`and still arrives on time (${weaver.t.toFixed(1)} s vs ${plain.t.toFixed(1)} s)`);
    const tripper=chase(e=>{e.life.stumbleIn=.5;e.life.stumbleEvery=[2,3];});
    assert(tripper.t<plain.t*1.2,`Stumbling walkers still keep up (${tripper.t.toFixed(1)} s vs ${plain.t.toFixed(1)} s)`);
    // Crawlers, dogs and elites keep their own scripted movement.
    const dog=qa.makeZombie(4,10,false,true);assert(!dog.life,'Dogs have their own gait');
    const knight=qa.makeElite('warden',6,10);frames(30);assert(knight.stumbleW===0||knight.stumbleW===undefined,'Elites do not stumble');
  }
  console.log('PASS: lively walkers: shamblers, lurchers, stalkers and staggerers each surge and drag with their steps, weave across open floor (straight near the player and on stairs), stumble and catch themselves, and lunge from a few strides out; average speed and arrival times unchanged; brutes plod; dogs, crawlers and elites keep their own movement.');
}

import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {createZombieRig,animateZombie,noteLegDamage,CRAWL} from '../public/game/zombies.mjs';
import {BUILD,rollBuild,applyBuild,resetBuild} from '../public/game/zombie-build.mjs';

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const range=v=>Math.max(...v)-Math.min(...v);
function walker(seed,gait={}){
  const rig=createZombieRig({rng:seeded(seed)});
  const e=Object.assign(rig,{speed:1.2,attack:100,attackTime:-1,motion:0,legHit:0,staggerLeft:0,hp:100,maxHp:100,dead:false,dog:false,brute:false});
  e.gait={...e.gait,...gait};e.limp=.15;e.phase=0;return e;
}
const step=(e,n=1,moving=true)=>{for(let i=0;i<n;i++)animateZombie(e,1/60,6,moving?e.speed/60:0);};
// A build with every offset set to a chosen value (for exact pose checks).
const fixed=(over={})=>({dropSide:1,shoulderDrop:0,spineBend:0,spineTwist:0,pelvisTilt:0,headJut:0,headTurn:0,headTilt:0,kneeBend:0,stanceWidth:0,toeOut:[0,0],arms:[{swingFwd:0,splay:0,elbow:0,twist:0,wrist:0},{swingFwd:0,splay:0,elbow:0,twist:0,wrist:0}],...over});

// v177: every walker its own build, from joint offsets on the same four bodies.
export function verifyZombieBuilds(qa,frames){
  // ---- Variety ------------------------------------------------------------------
  const crowd=Array.from({length:120},(_,i)=>rollBuild(3000+i*7717));
  const flat=b=>[b.shoulderDrop,b.spineBend,b.spineTwist,b.pelvisTilt,b.headJut,b.headTurn,b.headTilt,b.kneeBend,b.stanceWidth,...b.toeOut,...b.arms.flatMap(a=>[a.swingFwd,a.splay,a.elbow,a.twist,a.wrist])];
  assert.equal(new Set(crowd.map(b=>flat(b).map(v=>v.toFixed(3)).join())).size,120,'Every walker rolls its own build');
  assert.deepEqual(rollBuild(77),rollBuild(77),'A build is reproducible from its seed');
  const spans={spineBend:BUILD.spineBend*2,spineTwist:BUILD.spineTwist*2,pelvisTilt:BUILD.pelvisTilt*2,headTurn:BUILD.headTurn*2,headTilt:BUILD.headTilt*2,headJut:BUILD.headJut[1]-BUILD.headJut[0],kneeBend:BUILD.kneeBend[1],stanceWidth:BUILD.stanceWidth[1]-BUILD.stanceWidth[0]};
  for(const [k,span] of Object.entries(spans))assert(range(crowd.map(b=>b[k]))>span*.7,`${k} varies across a crowd`);
  for(const k of ['swingFwd','splay','elbow','twist','wrist'])assert(range(crowd.flatMap(b=>b.arms.map(a=>a[k])))>.2,`Arm ${k} varies across a crowd`);
  assert(crowd.some(b=>b.arms[0].elbow-b.arms[1].elbow>.15)&&crowd.some(b=>b.arms[1].elbow-b.arms[0].elbow>.15),'Many walkers carry their two arms differently');
  assert(crowd.filter(b=>b.shoulderDrop>.03).length>15&&crowd.some(b=>b.dropSide===0)&&crowd.some(b=>b.dropSide===1),'Plenty have a collapsed shoulder, on either side');
  const brutes=Array.from({length:60},(_,i)=>rollBuild(9000+i*31,{brute:true}));
  assert(range(brutes.map(b=>b.spineBend))<range(crowd.map(b=>b.spineBend))*.6&&Math.max(...brutes.map(b=>b.kneeBend))<.21,'Brutes stand stiffer and straighter');

  // ---- Each offset lands on its joint --------------------------------------------
  {
    // Rigs differ call to call, so pose one rig twice from the same state.
    const snap=e=>({spine:e.spine.rotation.clone(),root:e.root.rotation.clone(),head:e.head.rotation.clone(),legs:e.legs.map(l=>l.pivot.rotation.clone()),arms:e.arms.map(a=>({pivot:a.pivot.rotation.clone(),forearm:a.forearm.rotation.clone()}))});
    const pose=(e,build)=>{e.build=build;Object.assign(e,{idle:0,springs:undefined,phase:0,motion:0,twitchIn:99,dragW:undefined,limpDepth:0});step(e,200,false);return snap(e);};
    const rig=walker(41),pair=over=>[pose(rig,null),pose(rig,fixed(over))];
    let [a,b]=pair({spineBend:.07});assert(Math.abs(b.spine.z-a.spine.z-.07)<.01,'Spine side-bend');
    [a,b]=pair({spineTwist:-.08});assert(Math.abs(b.spine.y-a.spine.y+.08)<.01,'Spine twist');
    [a,b]=pair({pelvisTilt:.04});assert(Math.abs(b.root.z-a.root.z-.04)<.01,'Pelvis tilt');
    [a,b]=pair({headTilt:.09,headJut:.12});assert(Math.abs(b.head.z-a.head.z-.09)<.01&&Math.abs(b.head.x-a.head.x-.12)<.01,'Head tilt and jut');
    [a,b]=pair({stanceWidth:.06,toeOut:[.15,.1]});
    assert(Math.abs(b.legs[1].z-a.legs[1].z-.06)<1e-6&&Math.abs(b.legs[0].z-a.legs[0].z+.06)<1e-6,'Wider stance on both legs');
    assert(Math.abs(b.legs[0].y-a.legs[0].y+.15)<1e-6&&Math.abs(b.legs[1].y-a.legs[1].y-.1)<1e-6,'Each foot turns out its own amount');
    [a,b]=pair({arms:[{swingFwd:-.18,splay:.15,elbow:.15,twist:.3,wrist:.3},{swingFwd:0,splay:0,elbow:0,twist:0,wrist:0}]});
    assert(b.arms[0].pivot.x<a.arms[0].pivot.x-.12,'An arm can hang forward');
    assert(b.arms[0].pivot.z<a.arms[0].pivot.z-.12,'and splay out from the body');
    assert(b.arms[0].forearm.x<a.arms[0].forearm.x-.1,'with its own elbow bend');
    assert(Math.abs(b.arms[1].pivot.x-a.arms[1].pivot.x)<.01,'while the other arm is untouched');
    const drop=walker(42),y0=drop.arms[1].pivot.position.y;applyBuild(drop,fixed({dropSide:1,shoulderDrop:.045}));
    assert(Math.abs(drop.arms[1].pivot.position.y-(y0-.045))<1e-9&&drop.arms[0].pivot.position.y!==drop.arms[1].pivot.position.y,'A collapsed shoulder sags');
    resetBuild(drop);assert(Math.abs(drop.arms[1].pivot.position.y-y0)<1e-9&&drop.build===null,'and an elite’s rig is restored to its own pose');
  }

  // ---- Crouched stance keeps the feet on the floor ----------------------------------
  {
    const lowest=e=>{const out=[],v=new T.Vector3();for(let i=0;i<240;i++){step(e);e.group.updateMatrixWorld(true);e.legs[0].foot.getWorldPosition(v);out.push(v.y);}return out;};
    const one=walker(51),reset=build=>{one.build=build;Object.assign(one,{idle:0,springs:undefined,phase:0,motion:0,twitchIn:99});step(one,120);};
    reset(null);const u=lowest(one),hipU=one.root.position.y;reset(fixed({kneeBend:.48}));const c=lowest(one),hipC=one.root.position.y;const crouch=one;
    assert(hipC<hipU-.02,`A crouched walker carries its hips lower (${hipU.toFixed(3)} vs ${hipC.toFixed(3)})`);
    assert(Math.abs(Math.min(...c)-Math.min(...u))<.015,`and its planted foot still meets the floor (${Math.min(...u).toFixed(3)} vs ${Math.min(...c).toFixed(3)})`);
    assert(Math.max(...lowest(crouch).map((v,i,a)=>i?Math.abs(v-a[i-1]):0))<.03,'without the feet popping');
  }

  // ---- Extreme builds stay human and smooth -------------------------------------------
  {
    const extreme=s=>fixed({dropSide:s,shoulderDrop:.05,spineBend:.08,spineTwist:-.09,pelvisTilt:.045,headJut:.16,headTurn:.14,headTilt:-.1,kneeBend:.5,stanceWidth:.075,toeOut:[.2,-.05],arms:[{swingFwd:.2,splay:.2,elbow:-.28,twist:.35,wrist:.4},{swingFwd:-.2,splay:-.02,elbow:.18,twist:-.35,wrist:-.25}]});
    for(const arms of ['reach','dangle','clutch','claw','broken','mixed']){
      const e=walker(61,{arms});applyBuild(e,extreme(arms.length%2));const hist={};
      for(let i=0;i<360;i++){step(e);if(i<90)continue;
        for(const a of e.arms){assert(a.forearm.rotation.x<=.05,`${arms}: elbows never bend backwards`);assert(a.forearm.rotation.x>-2.35,`${arms}: elbows stay in a human range`);}
        for(const [k,f] of Object.entries({pelvis:r=>r.root.rotation.z,spine:r=>r.spine.rotation.z,hip:r=>r.legs[0].pivot.rotation.x,knee:r=>r.legs[0].calf.rotation.x})){const h=hist[k]??=[];h.push(f(e));if(h.length>3)h.shift();if(h.length===3)assert(Math.abs(h[2]-2*h[1]+h[0])<(k==='knee'?.1:.05),`${arms}: ${k} snaps with an extreme build`);}
      }
    }
    // A built walker still drops into the same crawl pose.
    const c=walker(63);applyBuild(c,extreme(0));step(c,60);noteLegDamage(c,1000,1);step(c,Math.ceil(CRAWL.drop*60)+30,true);
    assert(Math.abs(c.root.position.y-CRAWL.hip)<.03&&c.arms.every(a=>a.pivot.rotation.x<-1.7),'Crawlers still lie low and haul on both arms');
  }

  // ---- In the estate ---------------------------------------------------------------------
  {
    qa.start();qa.holdSpawns();qa.setHealth(1e9);for(const z of qa.get().zombies)qa.damageEnemy(z,1e7);frames(2);
    const walkers=[];for(let i=0;i<60;i++){const e=qa.makeZombie(-30+(i%10)*6,18+Math.floor(i/10)*2);walkers.push(e);}
    const speeds=walkers.map(e=>e.speed),hi=Math.max(...speeds),lo=Math.min(...speeds);
    assert(hi/lo<=1.07,`Walker speeds stay within 7% of each other (${lo.toFixed(3)}–${hi.toFixed(3)}, ${((hi/lo-1)*100).toFixed(1)}%)`);
    assert(hi/lo>1.035,'but still differ');
    assert(walkers.every(e=>e.build)&&new Set(walkers.map(e=>JSON.stringify(e.build))).size===60,'Every walker in the estate stands its own way');
    frames(20);
    const poses=walkers.slice(0,20).map(e=>[e.spine.rotation.z,e.head.rotation.z,e.arms[0].pivot.rotation.z,e.legs[0].pivot.rotation.z].map(v=>v.toFixed(2)).join());
    assert(new Set(poses).size>=18,'and visibly holds itself differently');
    for(const e of walkers)qa.damageEnemy(e,1e7);frames(2);
    const brute=qa.makeZombie(0,10,true),dog=qa.makeZombie(2,10,false,true);
    assert(brute.build&&brute.build.kneeBend<.21,'Brutes get a stiffer build');assert(!dog.build,'Dogs keep their own bodies');
    const warden=qa.makeElite('warden',6,10);assert.equal(warden.build,null,'Elite bosses keep their scripted poses');
  }
  console.log('PASS: every walker its own build: collapsed shoulders, side-bent and twisted spines, pelvis tilt, head jut/turn/tilt, crouched or upright stance, stance width and toe-out, and per-arm hang, splay, elbow bend, forearm twist and wrist; feet stay planted, elbows stay human, no snaps, crawls unchanged; walker speeds within 7%; brutes stiffer, dogs and elites untouched.');
}

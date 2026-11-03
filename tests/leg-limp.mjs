import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {createZombieRig,animateZombie,noteLegDamage,legWounds,CRAWL,LIMP} from '../public/game/zombies.mjs';
import {createLife,updateLife,HOBBLE} from '../public/game/zombie-life.mjs';

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const range=v=>Math.max(...v)-Math.min(...v);
function walker(seed,opts={},gait={}){
  const rig=createZombieRig({rng:seeded(seed),...opts});
  const e=Object.assign(rig,{speed:1.2,attack:100,attackTime:-1,motion:0,legHit:0,staggerLeft:0,hp:100,maxHp:100,dead:false,dog:false,brute:!!opts.brute});
  e.gait={...e.gait,...gait};e.limp=.15;e.phase=0;return e;
}
const step=(e,n=1)=>{for(let i=0;i<n;i++)animateZombie(e,1/60,6,e.speed/60);};
const hips=(e,j,n=240)=>{const v=[];for(let i=0;i<n;i++){step(e);v.push(e.legs[j].pivot.rotation.x);}return range(v);};
const scale=CRAWL.legShare*100;

// v176: damage-driven limp. Leg hits stay with the leg that took them: that leg
// starts to drag, the limp deepens as damage builds toward the crawl, the body
// slows a little, and the walker stops lunging and weaving.
export function verifyLegLimp(qa,frames){
  // ---- Bookkeeping: each leg keeps its own wound -------------------------------
  {
    const e=walker(1);
    noteLegDamage(e,scale*.25,1);assert.deepEqual(legWounds(e),[0,.25],'A right-leg hit wounds the right leg');
    noteLegDamage(e,scale*.1,-1);assert.deepEqual(legWounds(e),[.1,.25],'and a left-leg hit the left');
    noteLegDamage(e,scale*.1);assert.deepEqual(legWounds(e).map(v=>+v.toFixed(3)),[.15,.3],'An untagged leg hit is shared');
    assert.equal(e.hobble,.3,'Hobble follows the worse leg');assert(!e.crawling);
    noteLegDamage(e,scale*.55,1);assert(e.crawling,'The crawl threshold is unchanged: total leg damage still drops a walker');
    const brute=walker(2,{brute:true});assert.equal(noteLegDamage(brute,scale*.6,-1),false,'Brutes still never crawl');
    assert(brute.hobble>.55&&!brute.crawling,'but they carry the wound');
    const dog={dog:true,maxHp:100};noteLegDamage(dog,50,1);assert(!dog.hobble,'Dogs keep their own gait');
  }

  // ---- The hit leg takes over the drag, smoothly ----------------------------------
  {
    const e=walker(5,{},{dragLeg:0,scuff:.9});step(e,240);
    const before=[hips(e,0),hips(e,1)];assert(before[0]<before[1]*.85,'Unhurt, it drags its own rolled leg');
    // Watch every joint across the hand-over for snaps.
    noteLegDamage(e,scale*.7,1);
    const reads={pelvisSway:r=>r.root.position.x,pelvisHeight:r=>r.root.position.y,pelvisRoll:r=>r.root.rotation.z,hip0:r=>r.legs[0].pivot.rotation.x,hip1:r=>r.legs[1].pivot.rotation.x,knee1:r=>r.legs[1].calf.rotation.x,ankle1:r=>r.legs[1].foot.rotation.x};
    const limits={pelvisSway:.006,pelvisHeight:.01,pelvisRoll:.012,hip0:.06,hip1:.06,knee1:.12,ankle1:.12},hist={};
    for(let i=0;i<180;i++){step(e);for(const [k,f] of Object.entries(reads)){const h=hist[k]??=[];h.push(f(e));if(h.length>3)h.shift();if(h.length===3)assert(Math.abs(h[2]-2*h[1]+h[0])<limits[k],`${k} snaps as the limp changes legs (frame ${i})`);}}
    assert(e.dragW[1]>.95&&e.dragW[0]<.05,'Within a few strides the wounded right leg is the one dragging');
    const after=[hips(e,0),hips(e,1)];assert(after[1]<after[0]*.85,`The wounded leg now takes the shorter stride (${after.map(v=>v.toFixed(2))})`);
  }

  // ---- Worse wounds, worse limp --------------------------------------------------------
  {
    // One rig, wounded in stages (rigs differ call to call).
    const e=walker(9,{},{dragLeg:1}),stage=()=>{step(e,240);const v=[];for(let i=0;i<240;i++){step(e);v.push(e.root.rotation.z);}return {roll:range(v),stride:hips(e,1)/hips(e,0)};};
    const none=stage();noteLegDamage(e,scale*.3,1);const light=stage();noteLegDamage(e,scale*.55,1);const heavy=stage();
    assert(light.roll>none.roll*1.15&&heavy.roll>light.roll*1.15,`The hip drops harder as the wound deepens (${[none,light,heavy].map(r=>r.roll.toFixed(3))})`);
    assert(heavy.stride<none.stride-.05,`and the wounded leg's stride shortens (${[none,heavy].map(r=>r.stride.toFixed(2))})`);
    const brute=walker(12,{brute:true},{dragLeg:0});noteLegDamage(brute,scale*.8,1);step(brute,300);assert(brute.dragW[1]>.95,'A brute limps on the leg you shot');
  }

  // ---- No lunges, a narrower weave and more trips on a bad leg ----------------------------
  {
    const seedOf=type=>{for(let s=1;;s++)if(createLife(s).type===type)return s;};
    const lunges=hobble=>{const e={phase:0,stride:1.25,life:createLife(seedOf('stalker'))};e.life.stumbleIn=1e9;e.life.lungeCd=0;let n=0,was=false;
      for(let i=0;i<20*60;i++){updateLife(e,1/60,{dist:3.4,sameFloor:true,clear:true,stairs:false,attackReady:true,moved:.02,hobble});e.phase+=.1;const on=e.lungeW>.5;if(on&&!was)n++;was=on;}return n;};
    assert(lunges(0)>=2&&lunges(HOBBLE.noLunge+.05)===0,'A walker on a bad leg no longer lunges');
    const weave=hobble=>{const e={phase:0,stride:1.25,life:createLife(seedOf('staggerer'))};e.life.stumbleIn=1e9;let m=0;for(let i=0;i<20*60;i++){const r=updateLife(e,1/60,{dist:30,sameFloor:true,clear:false,stairs:false,attackReady:false,moved:.02,hobble});m=Math.max(m,Math.abs(r.weave));}return m;};
    assert(weave(1)<weave(0)*(1-HOBBLE.weaveDamp)+.01,'and weaves far less');
    const trips=hobble=>{const e={phase:0,stride:1.25,life:createLife(seedOf('shambler'))};let n=0,was=false;for(let i=0;i<120*60;i++){updateLife(e,1/60,{dist:30,sameFloor:true,clear:false,stairs:false,attackReady:false,moved:.02,hobble});const on=e.stumbleW>0;if(on&&!was)n++;was=on;}return n;};
    assert(trips(1)>trips(0)*1.8,`but trips more often (${trips(0)} → ${trips(1)} in two minutes)`);
  }

  // ---- In play: a real shot to the right leg ---------------------------------------------
  {
    qa.start();qa.holdSpawns();qa.setHealth(1e9);for(const z of qa.get().zombies)qa.damageEnemy(z,1e7);frames(2);
    qa.setPlayer(0,20);qa.selectWeapon('glock');qa.setPoints(0);frames(1);
    const e=qa.makeZombie(.15,17.6);e.speed=0;e.attack=100;frames(20);
    let hit=false;
    for(let tries=0;tries<12&&!hit;tries++){
      qa.get().scene.updateMatrixWorld(true);
      const knee=new T.Vector3();e.legs[1].calf.getWorldPosition(knee);knee.y+=.08;
      const cam=qa.get().camera.position,d=knee.clone().sub(cam);
      qa.setAim(Math.atan2(-d.x,-d.z),Math.atan2(d.y,Math.hypot(d.x,d.z)));frames(1);
      const w=[...(e.legWounds||[0,0])];qa.get().inventory.glock.ammo=13;qa.shoot();frames(16);
      hit=(e.legWounds?.[1]||0)>w[1];
    }
    assert(hit,'A Glock round to the right knee lands');
    assert((e.legWounds[1]||0)>(e.legWounds[0]||0),'and the wound is booked to the right leg');
    frames(120);assert(e.dragW[1]>.9,'The shot leg becomes the dragging one');
    // A wounded walker slows a little, in proportion to the wound.
    const travel=hobble=>{qa.start();qa.holdSpawns();qa.setPlayer(0,23);const z=qa.makeZombie(0,15);z.speed=2;z.flank=0;z.life=null;if(hobble){z.legWounds=[0,hobble*z.maxHp*CRAWL.legShare];z.hobble=hobble;}frames(40);return z.walkPos.z-15;};
    const fresh=travel(0),hurt=travel(.8);
    assert(Math.abs(hurt/fresh-(1-LIMP.slow*.8))<.02,`A badly wounded walker is ${(100*LIMP.slow*.8).toFixed(0)}% slower (${(hurt/fresh).toFixed(3)})`);
    const bruteTravel=hobble=>{qa.start();qa.holdSpawns();qa.setPlayer(0,23);const z=qa.makeZombie(0,15,true);z.speed=2;z.flank=0;z.life=null;if(hobble){z.legWounds=[hobble*z.maxHp*CRAWL.legShare,0];z.hobble=hobble;}frames(40);return z.walkPos.z-15;};
    const b0=bruteTravel(0),b1=bruteTravel(1);
    assert(Math.abs(b1/b0-(1-LIMP.slow*LIMP.bruteSlow))<.03,`Brutes slow by half as much (${(b1/b0).toFixed(3)})`);
  }
  console.log(`PASS: damage-driven limp: leg hits are booked to the leg that took them; that leg takes over the drag over a few strides without snapping, the hip drops harder and its stride shortens as the wound deepens, walkers slow up to ${LIMP.slow*100}% (brutes half) before the unchanged crawl threshold, and a bad leg stops lunges, narrows the weave and trips more; brutes limp but never crawl.`);
}

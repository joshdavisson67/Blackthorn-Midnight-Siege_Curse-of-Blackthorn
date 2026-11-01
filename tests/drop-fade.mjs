import assert from 'node:assert/strict';
import {DROP_FADE,dropOpacity} from '../public/game/drop-fade.mjs';
import {EVENT_RULES} from '../public/game/world-events.mjs';

// v169: expiring drops fade out and in over their last five seconds, faster
// for the final two; grave essence crystals pay a 100-essence baseline.
export function verifyDropFade(qa,frames){
  // The pulse: solid until five seconds remain, four slow dips, then eight quick ones.
  for(const life of [20,10,5.01,5])assert.equal(dropOpacity(life),1,`Solid with ${life}s left`);
  let dips=0,fastDips=0,prev=1,falling=false;
  for(let t=5;t>=0;t-=.001){
    const o=dropOpacity(t);assert(o>=DROP_FADE.floor-1e-9&&o<=1+1e-9);
    if(o<prev)falling=true;else if(falling&&o>prev){dips++;if(t<DROP_FADE.fast)fastDips++;falling=false;}prev=o;
  }
  assert.equal(dips,12,'Twelve fades in all');assert.equal(fastDips,8,'Eight of them in the final two seconds, three times as fast');
  assert(Math.abs(dropOpacity(DROP_FADE.fast)-1)<1e-9,'The rhythm quickens at full opacity, without a jump');

  qa.start();qa.holdSpawns();qa.setPlayer(0,20);frames(2);
  const st=()=>qa.get(),materials=g=>{const out=[];g.traverse(o=>{if(o.isMesh||o.isSprite)out.push(o.material);});return out;};
  // Two power-ups of the same kind: only the expiring one fades.
  qa.dropPickup(6,20,'double');qa.dropPickup(-6,20,'double');frames(1);
  const [a,b]=st().pickups.slice(-2),shared=materials(b.mesh);
  a.life=5.3;frames(1);assert(!a.fade&&materials(a.mesh).every((m,i)=>m===shared[i]),'No fade while more than five seconds remain');
  a.life=4.62;frames(1);assert(a.fade,'Inside five seconds the drop gets its own fading finish');
  const own=materials(a.mesh);assert(own.every((m,i)=>m!==shared[i]&&m.transparent),'Its materials are its own see-through copies');
  assert(shared.every(m=>m.opacity===1),'The other Double Damage drop stays solid');
  let low=1;for(let i=0;i<60;i++){frames(1);low=Math.min(low,a.fade.opacity);}assert(low<.3,`It really fades out (${low.toFixed(2)})`);
  assert(own.every(m=>m.onBeforeCompile===shared[own.indexOf(m)].onBeforeCompile),'The copies keep the estate lighting patch');
  a.life=.01;frames(2);assert(!st().pickups.includes(a),'It vanishes at the end');
  assert(materials(a.mesh).every((m,i)=>m===shared[i]),'Expiry puts the shared finishes back');

  // Grave essence: fades too, and pays 100 (times the curse) when collected.
  assert.equal(EVENT_RULES.graveBonus,100);
  const coin=st().eventVisuals.dropEssence(3,20,0,st().pickups),base=coin.mesh.material;
  coin.life=1.4;frames(1);assert(coin.fade&&coin.mesh.material!==base&&coin.mesh.material.transparent,'Grave essence flickers before it vanishes');
  const before=st().totalScore;qa.setPlayer(3,20);frames(2);
  assert.equal(st().totalScore-before,100,'Grave essence pays 100 essence baseline');assert.equal(coin.mesh.material,base,'The pooled crystal gets its shared finish back');
  // Bone chips fade the same way.
  qa.setPlayer(0,20);qa.dropBoneChip({walkPos:{x:-3,z:24},floorY:0});frames(1);const chip=st().pickups.find(p=>p.type==='bone');
  chip.life=3;frames(1);assert(chip.fade,'Bone chips flicker before they vanish');
  // A new run clears every fade.
  qa.start();assert.equal(st().pickups.length,0);assert.equal(coin.mesh.material,base);
  console.log(`PASS: expiring drops (power-ups, grave essence, bone chips) fade over the last ${DROP_FADE.window}s, ${DROP_FADE.slowPeriod}s pulses then ${DROP_FADE.fastPeriod}s pulses for the final ${DROP_FADE.fast}s, each with its own see-through finish (others stay solid), restored on collection, expiry and a new run; grave essence pays 100 baseline.`);
}

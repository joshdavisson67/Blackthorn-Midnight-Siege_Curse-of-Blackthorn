import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {BELLA} from '../public/game/bella.mjs';
import {UPPER_Y} from '../public/game/vertical.mjs';

// v158: a 15-yard guard radius, 25% more bite reach, bitten zombies turn on
// Bella until they die, and a rat-dragon fire cone twice as long and twice as
// wide that burns 25% hotter while still scaling with the wave.
export function verifyBellaUpgrades(qa,frames,elements){
  assert(Math.abs(BELLA.radius-15*.9144)<1e-9,'Bella guards a 15-yard radius');
  assert(Math.abs(BELLA.biteReach/.95-1.25)<1e-9,'Bite reach is 25% longer than before');
  assert(Math.abs(BELLA.fire.range/4.6-2)<1e-9,'Fire reaches twice as far');
  assert(Math.abs(Math.tan(BELLA.fire.angle)/Math.tan(.5)-2)<1e-9,'Fire cone is twice as wide at every distance');

  // An ordinary zombie beside the player hits the player.
  qa.start();qa.startWave();qa.holdSpawns();qa.setPlayer(0,20);qa.setHealth(1000);
  const control=qa.makeZombie(0,18.7);control.hp=control.maxHp=1e6;
  for(let i=0;i<240&&qa.get().health===1000;i++)frames(1);
  assert(qa.get().health<1000,'An unbitten zombie still attacks the player');

  // Free Bella and bring her down to the courtyard.
  qa.start();qa.startWave();qa.holdSpawns();
  const b=qa.get().bella;qa.setPlayer(b.station.x,b.station.z+1.5,UPPER_Y);qa.setPoints(BELLA.price);qa.interact();assert(b.unlocked);
  frames(240);qa.setPlayer(0,20);b.pos.set(3.5,0,21);frames(2);
  // A zombie right beside the player is bitten: it turns and fights Bella.
  qa.setHealth(1000);const z=qa.makeZombie(0,18.7);z.hp=z.maxHp=1e6;z.attack=0;
  qa.bellaBite(z,1,new T.Vector3(-1,0,0));
  assert(z.bellaAggro,'A bitten zombie marks Bella as its target');
  const start=Math.hypot(b.pos.x-z.walkPos.x,b.pos.z-z.walkPos.z);
  for(let i=0;i<300;i++)frames(1);
  assert.equal(qa.get().health,1000,'A zombie fighting Bella no longer hurts the player, even next to them');
  assert(z.bellaSwings>0,'The bitten zombie swings at Bella');
  const gap=Math.hypot(b.pos.x-z.walkPos.x,b.pos.z-z.walkPos.z);assert(gap<1.8,`The bitten zombie closes on Bella (gap ${gap.toFixed(2)}, started ${start.toFixed(2)})`);
  const facing=Math.atan2(b.pos.x-z.walkPos.x,b.pos.z-z.walkPos.z),turn=Math.atan2(Math.sin(facing-z.group.rotation.y),Math.cos(facing-z.group.rotation.y));
  assert(Math.abs(turn)<.6,'The bitten zombie turns to face Bella');
  assert(!b.dead&&b.unlocked,'Bella cannot be hurt by its blows');
  qa.damageEnemy(z,1e9,false,{source:'glock'});assert(z.dead,'The fight lasts until the zombie dies');

  // Bosses and elite guardians ignore her bites.
  const warden=qa.makeElite?.('warden',4,14);
  if(warden){qa.bellaBite(warden,1,new T.Vector3(1,0,0));assert(!warden.bellaAggro,'Elite guardians keep hunting the player');qa.damageEnemy(warden,1e9,false,{source:'glock'});}

  // Rat-dragon fire: twice the reach and width, 25% hotter, still wave-scaled.
  const origin=new T.Vector3(0,.45,24),dir=new T.Vector3(0,0,-1);
  const pulse=w=>(40+7*Math.max(1,w))*1.25*BELLA.fire.pulse;
  const burn=(x,z)=>{const e=qa.makeZombie(x,z);e.speed=0;e.hp=e.maxHp=1e6;qa.bellaBreath(origin.clone(),dir.clone(),BELLA.fire.range,BELLA.fire.angle);const lost=1e6-e.hp;qa.damageEnemy(e,1e9,false,{source:'glock'});return lost;};
  let w=qa.get().wave;
  assert(Math.abs(burn(0,16.5)-pulse(w))<1e-6,'Fire reaches 7.5 m ahead, beyond the old 4.6 m cone, for the full pulse');
  const a=40*Math.PI/180;assert(Math.abs(burn(3*Math.sin(a),24-3*Math.cos(a))-pulse(w))<1e-6,'Fire catches undead 40 degrees off-centre, outside the old cone');
  assert.equal(burn(3,24),0,'Fire still burns only inside its cone');
  for(let i=0;i<5;i++)qa.startWave();qa.holdSpawns();w=qa.get().wave;
  const late=burn(0,20);assert(Math.abs(late-pulse(w))<1e-6&&late>pulse(1),'Fire damage keeps scaling with the wave');
  console.log(`PASS: Bella guards 15 yards with 25% more bite reach; bitten zombies turn, close on and swing at her (not the player) until they die, while elites ignore her; rat-dragon fire reaches ${BELLA.fire.range} m with a cone twice as wide and burns ${pulse(1).toFixed(2)} per pulse at wave 1, scaling each wave.`);
}

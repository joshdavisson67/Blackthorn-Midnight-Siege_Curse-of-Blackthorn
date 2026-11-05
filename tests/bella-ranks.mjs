import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {BELLA,nextBellaRank} from '../public/game/bella.mjs';
import {weapons} from '../public/game/core.mjs';
import {UPPER_Y} from '../public/game/vertical.mjs';

// v184: Bella costs 1,500 essence; ranks II-IV are bought at her kennel with
// 25 / 50 / 75 bone chips: a back pistol, then a laser, then a towed grenade
// cart plus the rat dragon. All damage is flat, like her bite.
export function verifyBellaRanks(qa,frames,elements){
  const st=()=>qa.get(),b=st().bella;
  // ---- The ladder -------------------------------------------------------------------
  assert.equal(BELLA.price,1500);assert.equal(BELLA.maxRank,4);
  assert.deepEqual(BELLA.ranks.map(r=>[r.rank,r.chips]),[[2,25],[3,50],[4,75]],'Ranks II-IV cost 25, 50 and 75 bone chips');
  const [r2,r3,r4]=BELLA.ranks;
  assert(r2.gun.kind==='pistol'&&r2.gun.interval===.5&&r2.gun.damage===weapons.glock.damage&&r2.gun.damage===32,'Rank II: a pistol every 0.5s for the starting pistol’s damage');
  assert(r3.gun.kind==='laser'&&r3.gun.interval===.4&&Math.abs(r3.gun.damage-weapons.glock.damage*1.25)<1e-9,'Rank III: a laser every 0.4s for 25% more');
  assert(r4.launcher.interval===1,'Rank IV: a grenade launcher every second');
  assert.equal(nextBellaRank(0),null);assert.equal(nextBellaRank(1),r2);assert.equal(nextBellaRank(4),null);

  // ---- Buying ranks at the kennel ------------------------------------------------------
  qa.start();qa.startWave();qa.holdSpawns();qa.setHealth(1e9);
  const k=b.station,atKennel=()=>{qa.setPlayer(k.x,k.z+1.5,UPPER_Y);frames(1);};
  atKennel();qa.setPoints(BELLA.price);qa.interact();assert(b.unlocked&&b.rank===1&&st().points===0,'1,500 essence frees Bella at rank I');
  assert(b.gear.parts.every(p=>!p.visible),'Rank I has no gear');
  frames(1);assert(elements.get('interaction').innerHTML.includes('RANK II · 25 BONE CHIPS'),'The kennel offers rank II for 25 chips');
  for(let i=0;i<24;i++)qa.collectBoneChip();qa.setPoints(1e6);qa.interact();
  assert.equal(b.rank,1);assert.equal(st().boneChips,24);assert.equal(st().points,1e6,'Ranks cost chips, never essence');
  assert(elements.get('toast').textContent.includes('NEED 1 MORE BONE CHIP'),'Short of chips, the kennel says how many more');
  qa.collectBoneChip();assert(elements.get('toast').textContent.includes('UPGRADE BELLA AT HER KENNEL')||st().atticState.opening,'Enough chips points you to the kennel');
  qa.interact();assert.equal(b.rank,2);assert.equal(st().boneChips,0);assert(elements.get('banner').textContent.includes('RANK II'));
  assert(b.gear.harness.visible&&b.gear.pistol.visible&&!b.gear.laser.visible&&!b.gear.cart.visible,'Rank II wears the harness and back pistol');
  for(let i=0;i<50;i++)qa.collectBoneChip();qa.interact();assert.equal(b.rank,3);
  assert(b.gear.harness.visible&&!b.gear.pistol.visible&&b.gear.laser.visible&&!b.gear.cart.visible&&!b.dragon,'Rank III swaps the pistol for a laser');
  for(let i=0;i<75;i++)qa.collectBoneChip();qa.interact();assert.equal(b.rank,4);assert.equal(st().boneChips,0);
  assert(b.gear.laser.visible&&b.gear.cart.visible&&b.dragon&&b.dragonParts.parts.every(p=>p.visible),'Rank IV tows the grenade cart and is the rat dragon');
  frames(1);assert(!elements.get('interaction').innerHTML.includes('KENNEL'),'A fully ranked Bella’s kennel offers nothing more');
  assert(elements.get('boneHud').classList.contains('hidden'),'No chip tally once every rank is bought');
  assert(elements.get('powerups').textContent.includes('RANK IV'),'Her badge shows her rank');
  const z=qa.makeZombie(-20,20);qa.damageEnemy(z,1e9,false,{source:'Bella'});assert(!st().pickups.some(p=>p.type==='bone'),'A rank IV Bella’s kills drop no more chips');

  // ---- Ranged fire, driven directly ------------------------------------------------------
  const setRank=rank=>{qa.start();qa.startWave();qa.holdSpawns();qa.setHealth(1e9);b.unlock();while(b.rank<rank)b.upgrade();b.kennel.progress=1;};
  const run=(rank,seconds,{see=()=>true,place=[0,8],player=[0,20]}={})=>{
    setRank(rank);const s=st();qa.setPlayer(...player);b.pos.set(0,0,20);b.setNavigation(null);
    for(let i=0;i<60;i++)b.update(.05,{player:s.player,yaw:0,enemies:[],onBite(){}});
    b.pos.set(0,0,20);const e=qa.makeZombie(place[0],20-place[1]);e.speed=0;e.hp=e.maxHp=1e9;
    const log={shots:[],bites:0,blasts:[]};
    for(let i=0;i<Math.round(seconds/.05);i++){b.pos.set(0,0,20);b.update(.05,{player:s.player,yaw:0,enemies:[e],onBite:()=>log.bites++,onShot:(t,damage,dir,kind)=>log.shots.push({t,damage,kind,dir:dir.clone()}),onBlast:p=>log.blasts.push(p),canSee:see});}
    qa.damageEnemy(e,1e12,false,{source:'glock'});return {log,e};
  };
  {
    const {log,e}=run(2,5);
    assert(log.shots.length>=9&&log.shots.length<=11,`Rank II fires every 0.5s (${log.shots.length} shots in 5s)`);
    assert(log.shots.every(s=>s.t===e&&s.damage===32&&s.kind==='pistol'),'Pistol rounds at the target for 32 each');
    assert(log.shots[0].dir.z<-.9,'aimed at it');assert.equal(log.blasts.length,0,'No launcher before rank IV');
    assert(b.shots.active>0||b.shotsFired>0,'Tracers fly');
  }
  {
    const {log}=run(3,5);
    assert(log.shots.length>=12&&log.shots.length<=13,`Rank III fires every 0.4s (${log.shots.length} shots in 5s)`);
    assert(log.shots.every(s=>s.damage===40&&s.kind==='laser'),'Laser bolts for 40 each');
  }
  {
    const {log}=run(4,5.6);
    assert(log.blasts.length>=4&&log.blasts.length<=5,`Rank IV lobs a shell every second (${log.blasts.length} bursts)`);
    assert(log.blasts.every(p=>Math.hypot(p.x,p.z-12)<.5),'Shells burst on the target');
    assert(log.shots.length>=12&&log.shots.every(s=>s.kind==='laser'),'while the laser keeps firing');
  }
  assert.equal(run(3,3,{see:()=>false}).log.shots.length,0,'No shots without a clear line of sight');
  assert.equal(run(3,3,{place:[0,BELLA.gunRange+1]}).log.shots.length,0,'Nothing beyond her gun range');
  assert.equal(run(3,3,{player:[BELLA.radius+12,20],place:[-4,0]}).log.shots.length,0,'Nothing outside the 15-yard guard radius around you');
  {
    // Up close she still bites, between shots.
    setRank(2);const s=st();qa.setPlayer(0,20);b.pos.set(0,0,20);b.setNavigation(null);
    const e=qa.makeZombie(.9,20);e.speed=0;e.hp=e.maxHp=1e9;let bites=0,shots=0;
    for(let i=0;i<80;i++)b.update(.05,{player:s.player,yaw:0,enemies:[e],onBite:()=>bites++,onShot:()=>shots++,canSee:()=>true});
    assert(bites>=3&&shots>=7,`Rank II still bites in reach (${bites} bites, ${shots} shots)`);qa.damageEnemy(e,1e12,false,{source:'glock'});
  }

  // ---- Damage through the game -------------------------------------------------------------
  qa.start();qa.startWave();qa.holdSpawns();qa.setHealth(1000);qa.setPlayer(0,20);b.unlock();
  {
    const e=qa.makeZombie(0,12);e.speed=0;e.hp=e.maxHp=1e6;qa.bellaShot(e,32,new T.Vector3(0,0,-1),'pistol');
    assert.equal(1e6-e.hp,32,'A pistol round takes 32, flat');assert(!e.bellaAggro,'Shots do not pull zombies off you');
    e.hp=1;qa.bellaShot(e,40,new T.Vector3(0,0,-1),'laser');assert(e.dead&&st().pickups.some(p=>p.type==='bone'),'Her gun kills count as her kills and drop chips');
  }
  {
    const blast=(fn)=>{qa.setHealth(1000);const near=qa.makeZombie(2,14),far=qa.makeZombie(10.5,14);for(const e of [near,far]){e.speed=0;e.hp=e.maxHp=1e6;}
      fn(new T.Vector3(0,.2,14));const out=[1e6-near.hp,1e6-far.hp,1000-st().health];for(const e of [near,far])qa.damageEnemy(e,1e12,false,{source:'glock'});return out;};
    qa.setPlayer(0,15);const mine=blast(p=>qa.explode(p)),hers=blast(p=>qa.bellaBlast(p));
    assert.deepEqual(hers.slice(0,2),mine.slice(0,2),`Her shells hit exactly as hard as a grenade (${hers.slice(0,2)})`);
    assert(hers[0]===450&&hers[1]===225,'450 up close, half at the edge');
    assert(mine[2]>0&&hers[2]===0,'and unlike your grenade, never hurt you');
  }

  // ---- In play: nothing allocated per shot; reset ------------------------------------------
  {
    qa.start();qa.startWave();qa.holdSpawns();qa.setHealth(1e9);atKennel();qa.setPoints(BELLA.price);qa.interact();
    for(let i=0;i<150;i++)qa.collectBoneChip();qa.interact();qa.interact();qa.interact();assert.equal(b.rank,4);
    qa.setPlayer(0,20);frames(60);b.pos.set(1.5,0,21);frames(60);
    const world=st().world.children.length,targets=[0,1,2].map(i=>{const e=qa.makeZombie(-3+i*3,10);e.speed=0;e.hp=e.maxHp=1e6;return e;});
    const meshes=new Set();st().world.traverse(o=>{if(o.isMesh)meshes.add(o.geometry);});
    frames(300);
    assert(b.shotsFired>=8&&b.launches>=3,`In play she shoots (${b.shotsFired}) and lobs (${b.launches})`);
    assert(targets.some(e=>e.hp<1e6-450),'and her shells land');
    let fresh=0;st().world.traverse(o=>{if(o.isMesh&&o.userData.companion==='Bella'&&!meshes.has(o.geometry))fresh++;});
    assert.equal(fresh,0,'Her shots reuse pooled meshes');
    assert(st().world.children.length<=world+targets.length+2,'No meshes pile up from her fire');
    for(const e of targets)qa.damageEnemy(e,1e12,false,{source:'glock'});
    const geo=new Set();b.rig.group.traverse(o=>{if(o.isMesh)geo.add(o.geometry);});assert(geo.size<32,`The companion stays below 32 geometries with all gear (${geo.size})`);
  }
  qa.start();
  assert(b.rank===0&&!b.dragon&&b.gear.parts.every(p=>!p.visible)&&b.station.name==='FREE BELLA / MALTIPOO','A new run puts Bella back in her kennel at rank 0 with no gear');
  assert.equal(st().boneChips,0);
  console.log(`PASS: Bella ranks: 1,500 essence frees her; 25/50/75 bone chips at the kennel buy a back pistol (32 every 0.5s), a laser (40 every 0.4s) and a grenade cart (a grenade’s 450 every 1s, never hurting you) plus the rat dragon; line of sight, gun range and guard radius respected; bites continue; pooled shots; reset each run.`);
}

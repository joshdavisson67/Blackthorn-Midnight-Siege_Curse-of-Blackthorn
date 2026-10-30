import assert from 'node:assert/strict';
import {WEAPON_RANKS,rankMagazine,rankReserve,rankReloadTime,rankFireRate,rankDual} from '../public/game/weapon-ranks.mjs';

// v161: the Raven SMG's ranks, sold at either SMG rack once the SMG is owned.
export function verifySmgRanks(qa,frames,listeners,elements,gameCanvas){
  const ladder=WEAPON_RANKS.smg;
  assert.deepEqual(ladder.map(r=>[r.name,r.price]),[['Quickened Talons',2000],['Unkindness',4000],['Black Flock',8000],['Twin Ravens',16000]]);
  assert.deepEqual([0,1,2,3,4].map(r=>rankMagazine('smg',r,40)),[40,40,70,100,100]);
  assert.deepEqual([0,1,2,3,4].map(r=>rankReserve('smg',r,40,240)),[240,240,420,600,600],'Reserve keeps six magazines and stops growing at the twin guns');
  assert.deepEqual([0,1,4].map(r=>[rankReloadTime('smg',r),rankFireRate('smg',r),rankDual('smg',r)]),[[1,1,false],[.7,1,false],[.7,2,true]]);

  qa.start();qa.holdSpawns();
  const st=()=>qa.get(),smg=()=>st().inventory.smg,racks=st().interactables.filter(s=>s.type==='smg');
  assert.equal(racks.length,2,'Both SMG racks sell the ranks');
  const front=s=>({x:s.x+Math.sin(s.rotation||0)*1.6,z:s.z+Math.cos(s.rotation||0)*1.6});
  const ground=racks.find(s=>(s.y||0)===0),upper=racks.find(s=>s!==ground);
  const at=(s=ground)=>{const p=front(s);qa.setPlayer(p.x,p.z,s.y||0);frames(1);};
  const label=()=>elements.get('interaction').innerHTML;

  // Before purchase the rack still sells the SMG itself.
  at();qa.setPoints(1500);assert(label().includes('1,500 ESSENCE'));qa.interact();assert(smg().owned&&st().points===0);
  // Rank I: 30% faster reload.
  frames(1);assert(label().includes('2,000 ESSENCE')&&label().includes('QUICKENED TALONS'),'An owned SMG rack offers Rank I');
  smg().ammo=1;smg().reserve=500;qa.reload();const slow=st().reloadDuration;frames(400);
  qa.setPoints(2000);qa.interact();assert.equal(smg().weaponRank,1);assert.equal(st().points,0);
  smg().ammo=1;qa.reload();const quick=st().reloadDuration;frames(400);
  assert(Math.abs(quick/slow-.7)<1e-9,`Quickened Talons reloads 30% faster (${slow}s -> ${quick}s)`);
  // Ranks II and III: bigger magazines, loaded, with the reserve to match.
  smg().ammo=40;smg().reserve=240;qa.setPoints(4000);at();assert(label().includes('UNKINDNESS'));qa.interact();
  assert.equal(smg().weaponRank,2);assert.equal(smg().ammo,70);assert.equal(smg().reserve,420,'Unkindness adds 180 reserve rounds');
  qa.setPoints(8000);qa.interact();assert.equal(smg().weaponRank,3);assert.equal(smg().ammo,100);assert.equal(smg().reserve,600,'Black Flock adds 180 more');
  assert(elements.get('weaponName').textContent.includes('BLACK FLOCK'));

  // Rank IV: twin MP5s without optics, two loaded magazines, no extra reserve.
  qa.setPoints(16000);at(upper);assert(label().includes('16,000 ESSENCE')&&label().includes('TWIN RAVENS'),'The upstairs rack sells the same ranks');
  qa.interact();assert.equal(smg().weaponRank,4);
  assert.equal(smg().ammo,200,'Both magazines arrive loaded (100 + 100)');assert.equal(smg().reserve,600,'The twin guns add no reserve');
  const dual=st().smgDual,pair=st().dualGuns;
  assert(dual.visible&&!st().gunGroups.smg.visible,'The single MP5 is swapped for the pair');
  assert.equal(pair.length,2);
  for(const {g} of pair){assert(!g.userData.optic,'Dual-wielded MP5s carry no red dot');let optic=false;g.traverse(o=>{if(/Holographic|Reflex sight|clear-optic-glass/.test(o.name))optic=true;});assert(!optic);}
  assert(pair[0].g.position.x*pair[1].g.position.x<0,'One gun in each hand');
  // Alternating fire at twice the rate.
  qa.setAim(0,.4);frames(30);const ammo=smg().ammo;qa.shoot();const first=pair.findIndex(d=>d.kick>0);
  assert(Math.abs(st().shotTimer-.075/2)<1e-9,'Alternating guns fire twice as fast');
  frames(4);qa.shoot();const second=pair.reduce((best,d,i)=>d.kick>pair[best].kick?i:best,0);
  assert.notEqual(first,second,'The guns take turns');assert.equal(smg().ammo,ammo-2);
  // One reload fills both magazines from the shared reserve.
  smg().ammo=0;qa.reload();frames(400);assert.equal(smg().ammo,200);assert.equal(smg().reserve,400);
  // Aiming tightens the spread but keeps both guns at the hip with the crosshair.
  gameCanvas.events.mousedown({button:2});frames(60);
  assert(Math.abs(st().gunRoot.position.x)<.01,'The pair stays centred at the hip while aiming');
  assert.equal(Number(elements.get('crosshair').style.opacity),1,'The crosshair stays up: there are no sights to look down');
  listeners.mouseup({button:2});frames(10);
  // Switching weapons hides the pair; switching back restores it.
  qa.selectWeapon('glock');assert(!dual.visible&&st().gunGroups.glock.visible);qa.selectWeapon('smg');assert(dual.visible&&!st().gunGroups.smg.visible);
  // With every rank earned the rack just hands you the SMG.
  at();assert(label().includes('ALL RANKS'));qa.selectWeapon('glock');qa.setPoints(500);qa.interact();assert.equal(st().weapon,'smg');assert.equal(st().points,500);
  // A new run starts over.
  qa.start();assert.equal(qa.get().inventory.smg.weaponRank,0);assert(!dual.visible,'A new run puts the pair away');
  console.log('PASS: Raven ranks Quickened Talons (30% faster reload), Unkindness (70 + reserve 420), Black Flock (100 + reserve 600), Twin Ravens (two optic-free MP5s, alternating at 2x rate, 100+100 loaded, one shared reserve, hip-aimed with the crosshair), sold at both SMG racks once owned; reset each run.');
}

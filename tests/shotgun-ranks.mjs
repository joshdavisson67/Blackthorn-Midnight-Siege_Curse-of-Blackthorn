import assert from 'node:assert/strict';
import {WEAPON_RANKS,rankMagazine,rankReserve,rankReloadTime,rankFireRate,rankAuto} from '../public/game/weapon-ranks.mjs';
import {weapons} from '../public/game/core.mjs';

// v164: the M12 shotgun's ranks, sold at any of its three racks once it is owned.
export function verifyShotgunRanks(qa,frames,listeners,elements,gameCanvas){
  const ladder=WEAPON_RANKS.shotgun,w=weapons.shotgun;
  assert.deepEqual(ladder.map(r=>[r.name,r.price]),[['Gravedigger’s Haste',2000],['Coffin Nails',4000],['Charnel Feast',8000],['Requiem Storm',16000]]);
  assert(ladder.every(r=>r.flavor&&r.effect&&r.numeral),'Every rank has its flavor text');
  assert.deepEqual([0,1,2,3,4].map(r=>rankMagazine('shotgun',r,w.mag)),[8,8,16,24,24]);
  assert.deepEqual([0,1,2,3,4].map(r=>rankReserve('shotgun',r,w.mag,w.reserve)),[56,56,112,168,168],'Reserve keeps seven magazines');
  assert.deepEqual([0,1,4].map(r=>[rankReloadTime('shotgun',r),rankFireRate('shotgun',r),rankAuto('shotgun',r)]),[[1,1,false],[.7,1,false],[.7,2,true]]);
  assert(w.semiAuto,'The M12 is semi-auto until its capstone');

  qa.start();qa.holdSpawns();
  const st=()=>qa.get(),gun=()=>st().inventory.shotgun,racks=st().interactables.filter(s=>s.type==='shotgun');
  assert.equal(racks.length,3,'All three shotgun racks sell the ranks');
  const front=s=>({x:s.x+Math.sin(s.rotation||0)*1.6,z:s.z+Math.cos(s.rotation||0)*1.6});
  const at=s=>{const p=front(s);qa.setPlayer(p.x,p.z,s.y||0);frames(1);};
  const label=()=>elements.get('interaction').innerHTML;
  const pull=()=>gameCanvas.events.mousedown({button:0}),release=()=>listeners.mouseup({button:0});

  // Before purchase the rack sells the shotgun itself.
  at(racks[0]);qa.setPoints(1200);assert(label().includes('1,200 ESSENCE'));qa.interact();assert(gun().owned&&st().points===0&&st().weapon==='shotgun');
  frames(1);assert(label().includes('2,000 ESSENCE')&&label().includes('GRAVEDIGGER’S HASTE'),'An owned shotgun rack offers Rank I');

  // Semi-auto: one shell per pull, like the Glock; holding does not refire and early pulls respect the cooldown.
  qa.setAim(0,.4);frames(30);gun().ammo=8;pull();assert.equal(gun().ammo,7);frames(120);assert.equal(gun().ammo,7,'Holding a semi-auto trigger fires once');
  release();frames(5);pull();assert.equal(gun().ammo,6);release();frames(5);pull();assert.equal(gun().ammo,6,'Too early: the cooldown blocks the pull');
  frames(60);assert.equal(gun().ammo,6,'A blocked pull is not queued');release();frames(1);pull();assert.equal(gun().ammo,5,'The next pull fires');release();

  // Rank I: 30% faster reload, stacking with Quickhands and the Soul Forge.
  gun().ammo=1;gun().reserve=500;qa.reload();const slow=st().reloadDuration;frames(400);
  qa.setPoints(2000);at(racks[1]);qa.interact();assert.equal(gun().weaponRank,1);assert.equal(st().points,0);
  gun().ammo=1;qa.reload();assert(Math.abs(st().reloadDuration/slow-.7)<1e-9,`Gravedigger’s Haste reloads 30% faster (${slow}s -> ${st().reloadDuration}s)`);frames(400);
  st().perkOwned.add('quick');gun().forgeRank=1;gun().ammo=1;qa.reload();
  assert(Math.abs(st().reloadDuration-w.reload*.7*.5*.75)<1e-9,'The rank stacks with Quickhands and the Soul Forge');frames(400);
  st().perkOwned.delete('quick');gun().forgeRank=0;

  // Ranks II and III: bigger magazines, loaded, with the reserve to match.
  gun().ammo=8;gun().reserve=56;qa.setPoints(4000);at(racks[2]);assert(label().includes('COFFIN NAILS'),'Every rack sells the same ranks');qa.interact();
  assert.equal(gun().weaponRank,2);assert.equal(gun().ammo,16);assert.equal(gun().reserve,112,'Coffin Nails adds 56 reserve shells');
  qa.setPoints(8000);qa.interact();assert.equal(gun().weaponRank,3);assert.equal(gun().ammo,24);assert.equal(gun().reserve,168,'Charnel Feast adds 56 more');
  assert(elements.get('weaponName').textContent.includes('CHARNEL FEAST'));
  // The Soul Forge's +25% capacity applies on top of the ranked magazine.
  gun().forgeRank=1;gun().ammo=0;gun().reserve=500;qa.reload();frames(400);assert.equal(gun().ammo,30,'Forged: 24 x 1.25 = 30 shells');gun().forgeRank=0;gun().ammo=24;gun().reserve=168;

  // Capstone: full-auto at twice the rate.
  qa.setPoints(16000);at(racks[0]);assert(label().includes('16,000 ESSENCE')&&label().includes('REQUIEM STORM'));qa.interact();
  assert.equal(gun().weaponRank,4);assert.equal(gun().ammo,24,'The capstone does not change the magazine');assert.equal(gun().reserve,168);
  qa.setAim(0,.4);frames(30);pull();assert(Math.abs(st().shotTimer-w.rate/2)<1e-9,'Requiem Storm fires twice as fast');
  frames(60);const fired=24-gun().ammo;release();
  assert(fired>=3&&fired<=5,`Holding the trigger keeps firing (${fired} shells in about one second)`);
  // Forge damage scales the capstone too (checked in the shared damage formula).
  at(racks[0]);frames(1);assert(label().includes('ALL RANKS'));qa.selectWeapon('glock');qa.setPoints(500);qa.interact();assert.equal(st().weapon,'shotgun');assert.equal(st().points,500,'With every rank earned the rack just hands you the shotgun');
  // The other weapons keep their own trigger: the Glock stays semi-auto.
  qa.selectWeapon('glock');frames(30);const g=st().inventory.glock;g.ammo=13;pull();frames(60);assert.equal(g.ammo,12,'The Glock is still one shot per pull');release();
  // A new run starts over.
  qa.start();assert.equal(qa.get().inventory.shotgun.weaponRank,0);
  console.log('PASS: M12 ranks Gravedigger’s Haste (30% faster reload, stacking with Quickhands and the Soul Forge), Coffin Nails (16 + reserve 112), Charnel Feast (24 + reserve 168, 30 when forged), Requiem Storm (full-auto at 2x rate), sold at all three shotgun racks once owned; semi-auto (one shell per pull) until then; reset each run.');
}

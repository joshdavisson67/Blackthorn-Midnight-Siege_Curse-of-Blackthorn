import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {WEAPON_RANKS,rankMagazine,rankReserve,rankFireRate,rankDamage,rankRecoil,rankHasDot} from '../public/game/weapon-ranks.mjs';
import {weapons,weaponAimFov} from '../public/game/core.mjs';
import {COMBAT} from '../public/game/combat-feedback.mjs';

// v165: the .450 Bushmaster's ranks, sold at its east-study rack once it is owned.
export function verifyBushmasterRanks(qa,frames,listeners,elements,gameCanvas){
  const ladder=WEAPON_RANKS.bushmaster,w=weapons.bushmaster;
  assert.deepEqual(ladder.map(r=>[r.name,r.price]),[['Blood Moon',2000],['Bone Orchard',4000],['Ossuary',8000],['Executioner’s Calm',16000]]);
  assert(ladder.every(r=>r.flavor&&r.effect&&r.numeral),'Every rank has its flavor text');
  assert.deepEqual([w.mag,w.reserve],[8,48],'The base magazine holds 8, with six magazines in reserve');
  assert.deepEqual([0,1,2,3,4].map(r=>rankMagazine('bushmaster',r,w.mag)),[8,8,16,24,24]);
  assert.deepEqual([0,1,2,3,4].map(r=>rankReserve('bushmaster',r,w.mag,w.reserve)),[48,48,96,144,144],'Reserve keeps six magazines');
  assert.deepEqual([0,1,4].map(r=>[rankHasDot('bushmaster',r),rankFireRate('bushmaster',r),rankDamage('bushmaster',r),rankRecoil('bushmaster',r)]),[[false,1,1,1],[true,1.5,1,1],[true,1.5,2,.05]]);

  qa.start();qa.holdSpawns();
  const st=()=>qa.get(),gun=()=>st().inventory.bushmaster,rack=st().interactables.find(s=>s.type==='bushmaster');
  const p={x:rack.x+Math.sin(rack.rotation||0)*1.6,z:rack.z+Math.cos(rack.rotation||0)*1.6},at=()=>{qa.setPlayer(p.x,p.z,rack.y);frames(1);};
  const label=()=>elements.get('interaction').innerHTML;
  const scoped=st().gunGroups.bushmaster,dotSight=st().gunRoot.getObjectByName('Bushmaster red-dot sight');assert(dotSight,'A red-dot Bushmaster view model is prepared at load');
  let dotted=dotSight;while(dotted.parent!==st().gunRoot)dotted=dotted.parent;
  // v166: the Ruger AR-556-style model, and the Raven's holographic sight for Blood Moon.
  const names=g=>{const n=new Set();g.traverse(o=>n.add(o.name));return n;},rifle=names(scoped),dotNames=names(dotted);
  for(const part of ['M-LOK handguard side panel','Handguard upper chamfer','Radial-port muzzle brake','Brake port','Short .450 Bushmaster magazine','Slim adjustable stock','Compact polymer pistol grip','10x precision scope'])assert(rifle.has(part),`The Bushmaster has its ${part}`);
  assert(dotNames.has('Holographic sight body')&&dotNames.has('Reflex sight hood')&&!dotNames.has('Red-dot sight tube')&&!dotNames.has('10x precision scope'),'Blood Moon fits the Raven holographic sight, not the M4 tube');
  assert(!dotNames.has('Precision scope mount'),'No scope rings remain on the red-dot rifle');
  at();qa.setPoints(2500);qa.interact();assert(gun().owned&&st().weapon==='bushmaster');assert.deepEqual([gun().ammo,gun().reserve],[8,48]);
  frames(8);assert(label().includes('2,000 ESSENCE')&&label().includes('BLOOD MOON'),'The owned rack offers Rank I: '+label());
  assert(scoped.visible&&!dotted.visible,'The 10x scope is fitted before Rank I');

  // Rank I: the red dot replaces the scope (no 10x zoom), and it fires 50% faster.
  qa.setPoints(2000);qa.interact();assert.equal(gun().weaponRank,1);assert.equal(st().points,0);
  assert(!scoped.visible&&dotted.visible,'Blood Moon swaps in the red-dot rifle');
  qa.setAim(0,0);frames(20);gameCanvas.events.mousedown({button:2});frames(140);
  assert(Math.abs(st().camera.fov-weaponAimFov('rifle'))<1e-4,`Aiming uses the red dot's 1x view (${st().camera.fov.toFixed(1)} degrees), not the 10x scope`);
  assert(!scoped.userData.optic.mask.visible,'No scope mask around the red dot');
  const optic=dotted.userData.optic,center=optic.dot.getWorldPosition(new T.Vector3()).project(st().viewCamera);
  assert(Math.hypot(center.x,center.y)<.01,`The red dot sits on the line of fire (${center.x.toFixed(4)}, ${center.y.toFixed(4)})`);
  listeners.mouseup({button:2});frames(60);
  gameCanvas.events.mousedown({button:0});assert(Math.abs(st().shotTimer-w.rate/1.5)<1e-9,'Blood Moon fires 50% faster');listeners.mouseup({button:0});frames(60);
  const hipKick=st().weaponRecoil.pitch;

  // Ranks II and III: bigger magazines, loaded, with the reserve to match; forged capacity stacks.
  gun().ammo=8;gun().reserve=48;qa.setPoints(4000);at();assert(label().includes('BONE ORCHARD'));qa.interact();
  assert.equal(gun().weaponRank,2);assert.deepEqual([gun().ammo,gun().reserve],[16,96],'Bone Orchard adds 48 reserve rounds');
  qa.setPoints(8000);qa.interact();assert.equal(gun().weaponRank,3);assert.deepEqual([gun().ammo,gun().reserve],[24,144],'Ossuary adds 48 more');
  assert(elements.get('weaponName').textContent.includes('OSSUARY'));
  gun().forgeRank=1;gun().ammo=0;gun().reserve=500;qa.reload();frames(400);assert.equal(gun().ammo,30,'Forged: 24 x 1.25 = 30 rounds');gun().forgeRank=0;gun().ammo=24;gun().reserve=144;

  // Capstone: effectively no recoil and double damage (stacking with the forge).
  st().weaponRecoil.reset();qa.setAim(0,0);gameCanvas.events.mousedown({button:0});const r3=st().weaponRecoil.pitch;listeners.mouseup({button:0});frames(60);
  assert(Math.abs(r3-COMBAT.bushmaster.kick)<1e-9,'Before the capstone the rifle kicks as usual');
  qa.setPoints(16000);at();assert(label().includes('16,000 ESSENCE')&&label().includes('EXECUTIONER’S CALM'));qa.interact();assert.equal(gun().weaponRank,4);
  assert.deepEqual([gun().ammo,gun().reserve],[23,144],'The capstone leaves the magazine alone (one round spent on the recoil check)');
  st().weaponRecoil.reset();gameCanvas.events.mousedown({button:0});const r4=st().weaponRecoil;
  assert(Math.abs(r4.pitch/r3-.05)<1e-9&&r4.lift<COMBAT.bushmaster.lift*.06,`Executioner’s Calm all but removes recoil (${r3.toFixed(4)} -> ${r4.pitch.toFixed(4)} rad)`);listeners.mouseup({button:0});
  function bulletDamage(rank,forge=0){
    qa.start();qa.startWave();qa.holdSpawns();const inv=qa.get().inventory.bushmaster;inv.owned=true;inv.weaponRank=rank;inv.forgeRank=forge;qa.selectWeapon('bushmaster');
    qa.setPlayer(0,20);qa.setAim(0,-.15);frames(1);qa.setSeed(312);const enemy=qa.makeZombie(0,16);enemy.hp=enemy.maxHp=100000;qa.get().scene.updateMatrixWorld(true);qa.setSeed(821);qa.shoot();assert(enemy.hp<100000);return 100000-enemy.hp;
  }
  const d3=bulletDamage(3),d4=bulletDamage(4),f4=bulletDamage(4,1);
  assert(Math.abs(d4/d3-2)<1e-9,`Executioner’s Calm doubles damage (${d3} -> ${d4})`);assert(Math.abs(f4/d4-2)<1e-9,'And the Soul Forge doubles it again');
  at();frames(1);assert(label().includes('ALL RANKS'));
  // Switching weapons hides the red-dot rifle; a new run brings the scope back.
  qa.selectWeapon('glock');assert(!dotted.visible&&!scoped.visible);qa.selectWeapon('bushmaster');assert(dotted.visible&&!scoped.visible);
  qa.start();const inv=qa.get().inventory.bushmaster;assert.equal(inv.weaponRank,0);inv.owned=true;qa.selectWeapon('bushmaster');assert(scoped.visible&&!dotted.visible,'A new run refits the 10x scope');
  console.log(`PASS: Ruger-style Bushmaster model (M-LOK handguard, brake, short magazine, slim stock); Bushmaster ranks Blood Moon (Raven holographic red dot replaces the 10x scope, ${weaponAimFov('rifle').toFixed(0)}-degree aim, dot on the line of fire, 50% faster fire), Bone Orchard (16 + reserve 96), Ossuary (24 + reserve 144, 30 when forged), Executioner’s Calm (recoil x0.05, 2x damage stacking with the forge); 8-round base with 48 reserve; reset each run.`);
}

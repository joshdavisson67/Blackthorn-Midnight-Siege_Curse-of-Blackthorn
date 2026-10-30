import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {WEAPON_RANKS,rankMagazine,rankDamage,rankFireRate} from '../public/game/weapon-ranks.mjs';
import {PISTOL_DOT_HEIGHT} from '../public/game/weapon-models.mjs';

// v159: the Glock's four upgrade ranks, bought in order at the pistol bench.
export function verifyPistolRanks(qa,frames,listeners,elements,gameCanvas){
  const ladder=WEAPON_RANKS.glock;
  assert.deepEqual(ladder.map(r=>[r.name,r.price]),[['Bloodsight',2000],['Long Vigil',4000],['Grave Hunger',8000],['Last Rites',16000]]);
  assert.deepEqual([0,1,2,3,4].map(r=>rankMagazine('glock',r,13)),[13,13,18,24,24]);
  assert.deepEqual([0,3,4].map(r=>[rankDamage('glock',r),rankFireRate('glock',r)]),[[1,1],[1,1],[2,1.5]]);

  qa.start();qa.holdSpawns();
  const st=()=>qa.get(),glock=()=>st().inventory.glock,bench=st().interactables.find(s=>s.type==='glock');
  const front={x:bench.x+Math.sin(bench.rotation||0)*1.6,z:bench.z+Math.cos(bench.rotation||0)*1.6};
  const at=()=>{qa.setPlayer(front.x,front.z);frames(1);};
  const dot=st().gunGroups.glock.userData.pistolDot;
  assert(!dot.group.visible&&dot.cover.visible,'A fresh run has the plain MOS cover plate');

  // Rank I: price shown, short of essence, then bought.
  at();qa.setPoints(1999);frames(1);
  const prompt=elements.get('interaction').innerHTML;
  assert(prompt.includes('2,000 ESSENCE')&&prompt.includes('BLOODSIGHT'),'The bench offers Rank I Bloodsight for 2,000');
  qa.interact();assert.equal(glock().weaponRank,0);assert.equal(st().points,1999);assert.equal(elements.get('toast').textContent,'NEED 1 MORE ESSENCE');
  qa.setPoints(2000);qa.get().inventory.smg.owned=true;qa.selectWeapon('smg');qa.interact();
  assert.equal(glock().weaponRank,1);assert.equal(st().points,0);assert.equal(st().weapon,'glock','Buying a rank equips the pistol');
  assert(dot.group.visible&&!dot.cover.visible,'Bloodsight fits the red dot in place of the cover plate');
  assert(elements.get('toast').textContent.includes('BLOODSIGHT'));
  assert(elements.get('weaponName').textContent.includes('BLOODSIGHT'),'The HUD names the pistol rank');

  // Aiming lines the eye up with the red dot, and the window is open around it.
  qa.setAim(0,0);gameCanvas.events.mousedown({button:2});frames(85);st().scene.updateMatrixWorld(true);
  const gun=st().gunGroups.glock,mark=gun.getObjectByName('Red dot reticle');
  assert(mark&&mark.userData.reticle,'The red aiming dot is a separate reticle mark');
  const centre=mark.getWorldPosition(new T.Vector3()).project(st().camera);
  assert(Math.hypot(centre.x,centre.y)<.004,'The red dot sits on the firing line when aimed');
  for(const [x,y] of [[0,.004],[0,-.004],[.006,0],[-.006,0]]){
    const target=gun.localToWorld(new T.Vector3(x,PISTOL_DOT_HEIGHT+y,.10)),ray=new T.Raycaster(st().camera.position,target.sub(st().camera.position).normalize());ray.layers.set(1);
    const hits=ray.intersectObject(gun,true).filter(h=>h.object.visible&&h.object.isMesh&&!h.object.material.transparent&&!h.object.userData.reticle);
    assert.equal(hits.length,0,`The red dot window is clear around the aim point (${x},${y}): ${hits.map(h=>h.object.name).join(',')}`);
  }
  listeners.mouseup({button:2});frames(30);

  // Ranks II and III: bigger magazines that arrive loaded and reload to size.
  qa.setPoints(4000);at();assert(elements.get('interaction').innerHTML.includes('4,000 ESSENCE'));qa.interact();
  assert.equal(glock().weaponRank,2);assert.equal(glock().ammo,18,'Long Vigil arrives with a full 18-round magazine');
  qa.setPoints(8000);qa.interact();assert.equal(glock().weaponRank,3);assert.equal(glock().ammo,24,'Grave Hunger arrives with a full 24-round magazine');
  glock().ammo=0;glock().reserve=200;qa.reload();frames(200);assert.equal(glock().ammo,24,'Reloads fill the 24-round magazine');
  glock().forgeRank=1;glock().ammo=0;qa.reload();frames(200);assert.equal(glock().ammo,30,'The Soul Forge capacity bonus applies on top (24 x 1.25)');
  glock().forgeRank=0;

  // Capstone: twice the damage per shot and 50% faster fire.
  const shotDamage=()=>{qa.setPlayer(0,20);qa.setAim(0,-.15);frames(30);glock().ammo=20;const e=qa.makeZombie(0,16);e.hp=e.maxHp=1e6;st().scene.updateMatrixWorld(true);qa.setSeed?.(5);qa.shoot();const d=1e6-e.hp;qa.damageEnemy(e,1e9,false,{source:'glock'});return d;};
  const before=shotDamage();assert(before>0);
  const cycle=()=>{frames(30);glock().ammo=20;qa.shoot();return st().shotTimer;};
  const slow=cycle();
  qa.setPoints(16000);at();assert(elements.get('interaction').innerHTML.includes('16,000 ESSENCE')&&elements.get('interaction').innerHTML.includes('LAST RITES'));qa.interact();
  assert.equal(glock().weaponRank,4);
  const after=shotDamage();assert(Math.abs(after/before-2)<1e-6,`Last Rites doubles damage (${before} -> ${after})`);
  const fast=cycle();assert(Math.abs(slow/fast-1.5)<1e-6,`Last Rites fires 50% faster (${slow.toFixed(3)}s -> ${fast.toFixed(3)}s)`);
  glock().forgeRank=2;const forged=shotDamage();
  glock().weaponRank=3;const forgedPlain=shotDamage();glock().weaponRank=4;glock().forgeRank=0;
  assert(forgedPlain>before,'The Soul Forge raises pistol damage');
  assert(Math.abs(forged/forgedPlain-2)<1e-6,'The capstone doubles damage on top of the Soul Forge');

  // With every rank earned the bench goes back to restocking for 250.
  at();assert(elements.get('interaction').innerHTML.includes('ALL RANKS EARNED'));
  glock().reserve=0;frames(1);assert(elements.get('interaction').innerHTML.includes('250 ESSENCE'));
  qa.setPoints(1000);qa.interact();assert.equal(st().points,750);assert(glock().reserve>0);assert.equal(glock().weaponRank,4);

  // A new run starts over.
  qa.start();assert.equal(qa.get().inventory.glock.weaponRank,0);assert(!dot.group.visible&&dot.cover.visible,'A new run removes the red dot');
  console.log('PASS: Glock ranks Bloodsight (red dot on the firing line, clear window), Long Vigil (18), Grave Hunger (24, forge-scaled), Last Rites (2x damage stacking with the Soul Forge, 50% faster fire), bought in order at the pistol bench, then ammo restock; reset each run.');
}

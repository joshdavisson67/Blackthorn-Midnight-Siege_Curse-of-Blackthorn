import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {WEAPON_RANKS,rankMagazine,rankReserve,rankFireRate,rankDamage,rankRecoil,rankDetonate,rankKillHeal} from '../public/game/weapon-ranks.mjs';
import {weapons} from '../public/game/core.mjs';
import {CELLAR} from '../public/game/cellar-layout.mjs';

// v191: the M4's ranks at the tool-shed rack and the Warden LMG's at its cellar exhibit.
export function verifyRifleLmgRanks(qa,frames,listeners,elements,gameCanvas){
  // ---- The ladders -----------------------------------------------------------------------
  const m4=WEAPON_RANKS.rifle,lmg=WEAPON_RANKS.lmg;
  assert.deepEqual(m4.map(r=>[r.name,r.price]),[['Iron Psalm',2000],['Night Watch',4000],['Long Wake',8000],['Hellfire Litany',16000]]);
  assert.deepEqual(lmg.map(r=>[r.name,r.price]),[['Steady Vigil',2000],['Iron Procession',4000],['Endless Cortège',8000],['Wrath of the Warden',16000]]);
  assert([...m4,...lmg].every(r=>r.flavor&&r.effect&&r.numeral),'Every rank has its flavor text');
  assert.deepEqual([weapons.rifle.mag,weapons.lmg.mag],[30,100]);
  assert.deepEqual([0,1,2,3,4].map(r=>rankMagazine('rifle',r,30)),[30,30,40,50,50],'M4: 40, then 50 rounds');
  assert.deepEqual([0,1,2,3,4].map(r=>rankReserve('rifle',r,30,180)),[180,180,240,300,300],'and six magazines in reserve');
  assert.deepEqual([0,1,4].map(r=>rankDamage('rifle',r)),[1,1.25,1.25],'APC rounds: 25% more damage');
  assert.equal(rankDetonate('rifle',3),null);assert.deepEqual({...rankDetonate('rifle',4)},{radius:5,fraction:.33},'Capstone: 5 m blasts at 33% of a grenade');
  assert.deepEqual([0,1,2,3,4].map(r=>rankMagazine('lmg',r,100)),[100,100,150,200,200],'LMG: 150, then 200 rounds');
  assert.deepEqual([0,1,2,3,4].map(r=>rankReserve('lmg',r,100,500)),[500,500,750,1000,1000]);
  assert.deepEqual([0,1,4].map(r=>rankRecoil('lmg',r)),[1,.6,.6],'Rank I: 40% more stability');
  assert.deepEqual([3,4].map(r=>[rankFireRate('lmg',r),rankKillHeal('lmg',r)]),[[1,0],[1.33,2]],'Capstone: 33% faster fire and 2 health per kill');

  const st=()=>qa.get(),label=()=>elements.get('interaction').innerHTML;
  const click=()=>{gameCanvas.events.mousedown({button:0});listeners.mouseup({button:0});};
  // ---- M4 at the tool shed ------------------------------------------------------------------
  qa.start();qa.setHealth(1e6);for(let i=0;i<7;i++)qa.startWave();qa.holdSpawns();frames(50);
  const rack=st().shed.weapon,gun=()=>st().inventory.rifle,atRack=()=>{qa.setPlayer(rack.x,rack.z+1.4);frames(1);};
  atRack();qa.setPoints(4500);qa.interact();assert(gun().owned&&rack.purchased);
  frames(1);assert(label().includes('2,000 ESSENCE'),'The owned M4 rack offers Rank I: '+label());
  qa.interact();assert.equal(gun().weaponRank,0,'Short of essence, nothing is bought');
  qa.setPoints(2000);qa.interact();assert.equal(gun().weaponRank,1);assert.equal(st().points,0);
  assert(elements.get('toast').textContent.includes('M4 RANK I · IRON PSALM'),elements.get('toast').textContent);
  // Iron Psalm: 25% more damage per round.
  qa.setPlayer(-6,20);qa.setAim(0,-.12);frames(1);
  {const e=qa.makeZombie(-6,14);e.speed=0;e.hp=e.maxHp=1e6;st().scene.updateMatrixWorld(true);const before=e.hp;qa.shoot();const dealt=before-e.hp;
    assert(dealt>0&&[weapons.rifle.damage*1.25,weapons.rifle.damage*1.25*2.6].some(d=>Math.abs(dealt-d)<1e-6),`An APC round deals ${dealt}`);qa.damageEnemy(e,1e12);}
  atRack();gun().ammo=30;gun().reserve=180;qa.setPoints(4000);qa.interact();assert.equal(gun().weaponRank,2);assert.deepEqual([gun().ammo,gun().reserve],[40,240]);
  qa.setPoints(8000);qa.interact();assert.equal(gun().weaponRank,3);assert.deepEqual([gun().ammo,gun().reserve],[50,300]);
  frames(1);assert(label().includes('16,000 ESSENCE'));assert(elements.get('interaction').textContent.length>0);
  qa.setPoints(16000);qa.interact();assert.equal(gun().weaponRank,4);
  // Hellfire Litany: the round bursts where it strikes, hurting zombies within 5 m.
  qa.setPlayer(0,24);qa.setAim(0,-.12);frames(30);
  {
    const fx=st().explosionFx,popped=fx.popped,bursts=fx.bursts,health=st().health;
    const target=qa.makeZombie(0,18),near=qa.makeZombie(2.5,18),edge=qa.makeZombie(-4.2,18),far=qa.makeZombie(6,18);
    for(const e of [target,near,edge,far]){e.speed=0;e.hp=e.maxHp=1e6;}st().scene.updateMatrixWorld(true);
    qa.shoot();
    assert.equal(fx.popped,popped+1,'The round detonates');assert.equal(fx.bursts,bursts,'with its own small burst, not a grenade slot');
    const hit=e=>1e6-e.hp,full=450*.33,round=weapons.rifle.damage*1.25;
    assert([round,round*2.6].some(d=>Math.abs(hit(target)-d-full)<1e-6),`The struck zombie takes the round and the blast (${hit(target)})`);
    assert(Math.abs(hit(near)-full)<1e-6,`Within 3.75 m: a third of a grenade (${hit(near)})`);
    assert(Math.abs(hit(edge)-full/2)<1e-6,`Out to 5 m: half that (${hit(edge)})`);
    assert.equal(hit(far),0,'Nothing beyond 5 m');
    assert.equal(st().health,health,'The blasts never hurt you');
    frames(90);assert.equal(fx.popping,0,'The burst is gone within a second and a half');
    for(const e of [target,near,edge,far])qa.damageEnemy(e,1e12);
  }
  // ---- The Warden LMG at its cellar exhibit -------------------------------------------------
  qa.start();qa.setHealth(1e6);for(let i=0;i<10;i++)qa.startWave();qa.holdSpawns();st().cellar.update(2);
  const lmgGun=()=>st().inventory.lmg,exhibit=st().cellar.weapon,atExhibit=()=>{qa.setPlayer(CELLAR.x-3.4,-68.4,-4.2);frames(1);};
  atExhibit();qa.setPoints(5000);qa.interact();assert(lmgGun().owned&&exhibit.used);
  st().waveDelay=5;atExhibit();assert(label().includes('2,000 ESSENCE')&&label().includes('WARDEN'),'The empty exhibit sells Rank I, even between waves: '+label());
  const kick=rank=>{lmgGun().weaponRank=rank;qa.selectWeapon('lmg');frames(80);st().weaponRecoil.reset?.();qa.setAim(0,0);frames(30);const before=st().weaponRecoil.pitch;qa.shoot();return st().weaponRecoil.pitch-before;};
  const plain=kick(0);
  qa.setPoints(2000);atExhibit();qa.interact();assert.equal(lmgGun().weaponRank,1);
  assert(elements.get('toast').textContent.includes('WARDEN RANK I · STEADY VIGIL'));
  const steady=kick(1);assert(Math.abs(steady/plain-.6)<.02,`Steady Vigil: 40% less kick (${(steady/plain).toFixed(3)})`);
  atExhibit();lmgGun().ammo=100;lmgGun().reserve=500;qa.setPoints(4000);qa.interact();assert.deepEqual([lmgGun().weaponRank,lmgGun().ammo,lmgGun().reserve],[2,150,750]);
  qa.setPoints(8000);qa.interact();assert.deepEqual([lmgGun().weaponRank,lmgGun().ammo,lmgGun().reserve],[3,200,1000]);
  qa.setPoints(16000);qa.interact();assert.equal(lmgGun().weaponRank,4);
  frames(1);assert(!label().includes('WARDEN'),'A fully ranked LMG’s exhibit offers nothing more');
  qa.selectWeapon('lmg');frames(80);click();assert(Math.abs(st().shotTimer-weapons.lmg.rate/1.33)<1e-9,'Wrath of the Warden fires 33% faster');frames(30);
  // +2 health per LMG kill, capped at full health; other weapons' kills heal nothing.
  qa.setHealth(50);
  {const e=qa.makeZombie(0,10);qa.damageEnemy(e,1e9,false,{source:'lmg'});assert.equal(st().health,52,'An LMG kill mends 2 health');}
  {const e=qa.makeZombie(0,10);qa.damageEnemy(e,1e9,false,{source:'glock'});assert.equal(st().health,52,'Other kills mend nothing');}
  qa.setHealth(st().maxHealth-1);{const e=qa.makeZombie(0,10);qa.damageEnemy(e,1e9,false,{source:'lmg'});assert.equal(st().health,st().maxHealth,'Never above full health');}
  qa.start();assert.deepEqual([st().inventory.rifle.weaponRank,st().inventory.lmg.weaponRank],[0,0],'A new run resets both ladders');
  console.log('PASS: M4 ranks at the shed (Iron Psalm +25% damage, 40- and 50-round magazines, Hellfire Litany detonating rounds: 5 m, a third of a grenade, half at the edge, never hurting you, with their own pooled bursts) and Warden LMG ranks at its cellar exhibit (Steady Vigil 40% less recoil, 150- and 200-round belts, Wrath of the Warden 33% faster fire and +2 health per kill); flavor text on every rank; reset each run.');
}

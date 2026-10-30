import assert from 'node:assert/strict';
import {isBlocked} from '../public/game/core.mjs';

export function verifyPistolBench(qa,frames,elements){
  qa.start();qa.holdSpawns?.();
  const state=qa.get(),ground=state.interactables.filter(s=>(s.y||0)===0);
  const bench=ground.find(s=>s.type==='glock'),crate=ground.find(s=>s.type==='ammo'&&s.name==='AMMUNITION');
  assert(bench,'The courtyard has a pistol bench');
  assert.equal(bench.name,'GLOCK 21 PISTOL');assert.equal(bench.price,2000,'A fresh run offers pistol Rank I (v159)');

  // Placement: the ammunition crate's mirror image across the front door.
  assert.equal(bench.x,-crate.x,'Pistol bench mirrors the ammunition crate across the door');
  assert.equal(bench.z,crate.z,'Pistol bench sits the same distance from the facade as the crate');
  assert.equal(bench.rotation||0,crate.rotation||0,'Pistol bench faces the courtyard like the crate');
  const footprint=state.colliders.find(c=>c.x===bench.x&&c.z===bench.z);
  assert(footprint,'Pistol bench has a collision volume');
  for(const c of state.colliders){
    if(c===footprint||(c.maxY??Infinity)<=0||(c.minY??0)>=footprint.maxY)continue;
    const overlap=Math.abs(c.x-footprint.x)<(c.w+footprint.w)/2-.01&&Math.abs(c.z-footprint.z)<(c.d+footprint.d)/2-.01;
    assert(!overlap,`Pistol bench must not intersect other scenery at ${c.x},${c.z}`);
  }
  const front={x:bench.x+Math.sin(bench.rotation||0)*1.6,z:bench.z+Math.cos(bench.rotation||0)*1.6};
  assert(!isBlocked(front.x,front.z,.32,state.colliders),'Pistol bench has a clear purchase approach');
  state.nav.rebuild(0,20);assert(state.nav.direction(front.x,front.z).reachable,'Pistol bench is reachable from the courtyard');

  // Exhibit: the Glock on its own rack with spare magazines.
  const visual=state.stationBuilder.visuals.find(v=>v.station===state.interactables.find(s=>s.type==='glock'));
  const names=visual.parts.map(p=>p.name).join('|');
  for(const part of ['Weapon rack back','Pistol rack peg','Spare pistol magazine'])assert(names.includes(part),`Pistol bench shows ${part}`);
  let gun=false;visual.group.traverse(o=>{if(o.userData.weaponType==='glock')gun=true;});assert(gun,'Pistol bench displays the Glock model');

  // v159: the bench sells the four pistol ranks first; restocking follows.
  qa.get().inventory.glock.weaponRank=4;qa.get().inventory.glock.ammo=24;qa.get().inventory.glock.reserve=144;
  assert.equal(bench.price,250,'With every rank earned, the bench restocks for 250');
  const at=()=>{qa.setPlayer(front.x,front.z);frames(1);};
  const glock=()=>qa.get().inventory.glock;

  // Full ammo: no charge, just equip the pistol.
  qa.setPoints(1000);qa.get().inventory.smg.owned=true;qa.selectWeapon('smg');at();
  assert(elements.get('interaction').innerHTML.includes('FULL'),'A full Glock shows FULL instead of a price');
  qa.interact();
  assert.equal(qa.get().points,1000,'A full pistol is not charged');
  assert.equal(qa.get().weapon,'glock','The bench switches to the pistol');
  assert.equal(elements.get('toast').textContent,'PISTOL AMMUNITION IS FULL');

  // Restock: follows the ammo rule (magazine untouched, reserve covers the next reload).
  glock().ammo=5;glock().reserve=0;qa.selectWeapon('smg');frames(1);
  assert(elements.get('interaction').innerHTML.includes('250 ESSENCE'));
  qa.interact();
  assert.equal(qa.get().points,750,'Restocking the pistol costs 250 essence');
  assert.equal(glock().ammo,5,'Restocking leaves the current magazine unchanged');
  assert.equal(glock().reserve,144+19,'Reserve (six 24-round magazines with all ranks) is full plus the rounds missing from the magazine');
  assert.equal(qa.get().weapon,'glock','Buying from the bench equips the pistol');
  assert.equal(elements.get('toast').textContent,'GLOCK 21 AMMUNITION RESTOCKED');
  qa.reload();frames(200);assert.equal(glock().ammo,24);assert.equal(glock().reserve,144,'One reload leaves magazine and reserve full');
  qa.interact();assert.equal(qa.get().points,750,'Topped-up pistol is not charged again');

  // A reload in progress is preserved.
  glock().ammo=2;glock().reserve=20;qa.reload();frames(5);const left=qa.get().reloadLeft;assert(left>0);
  qa.interact();assert.equal(qa.get().points,500);assert(qa.get().reloadLeft>0&&qa.get().reloadLeft<=left,'Restocking keeps the reload going');

  // Not enough essence: no purchase.
  frames(200);glock().reserve=0;qa.setPoints(100);frames(1);qa.interact();
  assert.equal(qa.get().points,100);assert.equal(glock().reserve,0);assert.equal(elements.get('toast').textContent,'NEED 150 MORE ESSENCE');

  // Only the Glock is restocked; other guns are left alone.
  qa.setPoints(1000);glock().reserve=0;qa.get().inventory.smg.reserve=7;qa.interact();
  assert.equal(qa.get().inventory.smg.reserve,7,'The pistol bench restocks only the Glock');
  console.log('PASS: pistol bench mirrors the courtyard ammunition crate across the front door, displays the Glock, restocks only the pistol for 250 (no charge when full), equips it, and keeps reloads intact.');
}

import assert from 'node:assert/strict';
import * as T from '../public/game/three.module.js';
import {isBlocked} from '../public/game/core.mjs';
import {UPPER_Y} from '../public/game/vertical.mjs';
import {ESTATE_ROOMS} from '../public/game/estate-layout.mjs';
import {weapons} from '../public/game/weapon-stats.mjs';
import {KATANA,SLASHES,slashTargets,slashImpact,createKatanaModel,createKatanaStand,katanaSurfaces,katanaPose,katanaRest} from '../public/game/katana.mjs';
import {WEAPON_CYCLE} from '../public/game/controls.mjs';
import {FORGE,forgeBonuses} from '../public/game/soul-forge.mjs';

// v205: the katana. A melee weapon shared by every mode, bought for 2,500 essence from its
// stand in the servants' quarters, equipped with 7, slashing everything in a frontal arc
// (100°, narrower than a half circle) within 4 yards, in three slashes that play in turn.
// No upgrade ranks; the Soul Forge raises its damage and nothing else.
export function verifyKatana({qa,frames,listeners,elements,canvas}){
  const press=code=>listeners.keydown({code,key:code,repeat:false,preventDefault(){},target:{}});
  // ---- The rules ------------------------------------------------------------------------
  assert.equal(KATANA.price,2500);assert(Math.abs(KATANA.reach-4*.9144)<.01,'Reach is about 4 yards');
  assert(KATANA.arc>0&&KATANA.arc<180,'The arc is frontal, narrower than a half circle, leaving room to widen it later');
  const w=weapons.katana;assert(w.melee&&w.mag===0&&w.reserve===0&&w.reload===0,'A blade has no magazine, reserve or reload');
  assert.equal(SLASHES.length,3,'Three slashes');assert.equal(new Set(SLASHES.map(s=>s.name)).size,3);
  assert.deepEqual(WEAPON_CYCLE.at(-1),'katana','Touch and controller cycling reach the katana');
  for(const s of SLASHES)assert(s.hitAt>s.windup&&s.hitAt<s.windup+s.cut&&s.length>=s.windup+s.cut+s.hold,'Each slash lands as the blade crosses the middle');
  // The three cuts take different paths: compare where the blade points at the middle of each.
  const tip=q=>new T.Vector3(0,1,0).applyQuaternion(q);
  const starts=SLASHES.map((s,k)=>katanaPose(k,s.windup,null));
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert(tip(starts[i].q).angleTo(tip(starts[j].q))>.4||starts[i].p.distanceTo(starts[j].p)>.2,'Each slash winds up differently');
  for(const [k,s] of SLASHES.entries()){const a=katanaPose(k,s.windup,null),b=katanaPose(k,s.windup+s.cut,null);assert(tip(a.q).angleTo(tip(b.q))>1.2,`The ${s.name} sweeps the blade well over 60°`);
    const end=katanaPose(k,s.length,null),rest=katanaRest();assert(end.p.distanceTo(rest.p)<1e-6&&Math.abs(end.q.dot(rest.q))>.99999,'and returns to rest');
    for(let t=0;t<=s.length;t+=.01){const p=katanaPose(k,t,null);assert([p.p.x,p.p.y,p.p.z,p.q.x,p.q.y,p.q.z,p.q.w].every(Number.isFinite));}}
  console.log(`PASS: the katana costs ${KATANA.price.toLocaleString()} essence, reaches ${KATANA.reach} m (4 yards) through a ${KATANA.arc}° frontal arc, has no ammunition or reload, and plays three distinct slashes that each return to rest.`);

  // ---- The model ------------------------------------------------------------------------
  const sword=createKatanaModel(),stand=createKatanaStand(),names=o=>{const n=[];o.traverse(m=>{if(m.isMesh)n.push(m.name);});return n;};
  for(const part of ['Damascus blade','Blade collar','Round guard','Cord-bound grip','Pommel cap','Grip ornament'])assert(names(sword).includes(part),`The sword has its ${part}`);
  for(const part of ['Lacquered scabbard','Wound cord','Tassel','Scabbard mouth','Stand base','Stand upright'])assert(names(stand).includes(part),`The stand shows its ${part}`);
  assert(!names(sword).includes('Lacquered scabbard')&&!names(stand).includes('Damascus blade'),'Drawn in hand; sheathed on the stand');
  const box=new T.Box3().setFromObject(sword),length=box.max.y-box.min.y;assert(length>.98&&length<1.1,`A full-length katana (${length.toFixed(2)} m)`);
  stand.updateMatrixWorld(true);const sbox=new T.Box3().setFromObject(stand);assert(sbox.max.x-sbox.min.x>1&&sbox.max.y<.32,'It lies level along its low stand');
  const S=katanaSurfaces();assert.equal(S.textures.length,5);assert(S.bytes<1.1*1024*1024,'Its five painted finishes stay under 1.1 MB');assert(S.textures.every(t=>t.isDataTexture),'painted from formulas, with no image fetches');
  let tris=0;sword.traverse(o=>{if(o.isMesh)tris+=o.geometry.index.count/3;});assert(tris<3000,`The sword in hand is light (${tris} triangles)`);
  console.log(`PASS: the katana model: curved Damascus blade, brass collar, round guard, white diamonds in the black grip, and on its rosewood stand the lacquered scabbard with its cord and tassels; ${tris} triangles in hand, ${Math.round(S.bytes/1024)} KB of finishes.`);

  // ---- Who a slash reaches (pure) -------------------------------------------------------
  const player=new T.Vector3(0,0,0),enemy=(x,z,y=0,extra={})=>({walkPos:new T.Vector3(x,y,z),radius:.35,group:{position:new T.Vector3(x,y,z),rotation:{y:0}},...extra});
  const deg=a=>a*Math.PI/180,at=(a,d)=>enemy(Math.sin(deg(a))*d,-Math.cos(deg(a))*d);
  const open=()=>false,reach=list=>slashTargets({player,yaw:0,zombies:list,blocked:open}).map(h=>h.enemy);
  const ahead=at(0,2),edge=at(0,3.66+.34),beyond=at(0,3.66+.4),inArc=at(45,2.5),outArc=at(66,2.5),behind=at(180,1.5),side=at(90,1),dead={...at(0,1.5),dead:true},upstairs=enemy(0,-2,UPPER_Y);
  const hit=reach([ahead,edge,beyond,inArc,outArc,behind,side,dead,upstairs]);
  assert.deepEqual(hit,[ahead,inArc,edge],'Ahead, inside the arc and just within 4 yards are cut, nearest first');
  assert(!hit.includes(outArc)&&!hit.includes(side)&&!hit.includes(behind),'Nothing outside the frontal arc, beside or behind');
  assert(!hit.includes(beyond),'Nothing beyond reach');assert(!hit.includes(upstairs)&&!hit.includes(dead),'Nothing on another floor, and not the dead');
  assert.deepEqual(slashTargets({player,yaw:Math.PI/2,zombies:[ahead,enemy(-2,0)],blocked:open}).map(h=>h.enemy.walkPos.x),[-2],'The arc turns with the view');
  assert.deepEqual(slashTargets({player,yaw:0,zombies:[ahead],blocked:(x,z)=>z<-1}),[],'A wall between stops the blade');
  const half=enemy(Math.sin(deg(52))*2,-Math.cos(deg(52))*2);assert.equal(reach([half]).length,1,'A body half inside the arc is cut');
  const impact=slashImpact(0,{player,yaw:0,enemy:ahead});assert(impact.source==='katana'&&impact.part==='torso'&&impact.force===KATANA.force&&impact.stagger===KATANA.stagger);
  const warden=enemy(0,-2,0,{shield:[{}],group:{position:new T.Vector3(0,0,-2),rotation:{y:0}}});
  assert.equal(slashImpact(1,{player,yaw:0,enemy:warden}).part,'shield','A Gravewarden facing you takes the cut on its shield');
  warden.group.rotation.y=Math.PI;assert.equal(slashImpact(1,{player,yaw:0,enemy:warden}).part,'torso','but not from behind');
  console.log('PASS: a slash cuts everything inside its 100° arc within 4 yards on your floor, nearest first, turns with the view, counts bodies half inside, and stops at walls; Gravewardens facing you block with their shields.');

  // ---- In the mansion: the stand in the servants' quarters ------------------------------
  qa.start();qa.holdSpawns();qa.setHealth(1e6);
  const state=qa.get(),stations=state.interactables.filter(s=>s.type==='katana'),room=ESTATE_ROOMS.find(r=>r.id==='servants');
  assert.equal(stations.length,1,'One katana stand');const k=stations[0];
  assert(Math.abs(k.x-room.x)<room.w/2&&Math.abs(k.z-room.z)<room.d/2&&k.y===0,'in the servants’ quarters, on the ground floor');
  assert.equal(k.price,2500);assert.equal(k.name,'TSURU KATANA');
  const visual=state.stationBuilder.visuals.find(v=>v.station===k),parts=visual.parts.map(p=>p.name);
  for(const part of ['Cabinet plinth','Weapon rack back','Stand upright','Lacquered scabbard','Cord-bound grip'])assert(parts.includes(part),`Its bench shows ${part}`);
  const front={x:k.x+Math.sin(k.rotation||0)*1.6,z:k.z+Math.cos(k.rotation||0)*1.6};
  assert(!isBlocked(front.x,front.z,.32,state.colliders),'The stand has a clear approach');
  assert(isBlocked(k.x,k.z,.1,state.colliders,undefined,0,1.8),'and its bench is solid');
  state.nav.rebuild(0,20,0);assert(state.nav.direction(front.x,front.z,0).reachable,'reachable on foot from the courtyard');
  for(const [x,z] of [[28,-60],[14,-72]])for(const d of [-1,1])assert(!isBlocked(x+(z===-60?d*2:0),z+(z===-60?0:d*2),.32,state.colliders),'The servants’ quarters doorways stay clear');
  // Locked until bought: key 7 does nothing.
  press('Digit7');assert.equal(qa.get().weapon,'glock','Key 7 does nothing until the katana is bought');
  qa.setPlayer(front.x,front.z);frames(1);
  const prompt=()=>elements.get('interaction').innerHTML;frames(1);assert(prompt().includes('TSURU KATANA')&&prompt().includes('2,500 ESSENCE')&&/100° arc within 4 yards/.test(prompt()),'The prompt names it, its price and what it does');
  qa.setPoints(2400);qa.interact();assert(!qa.get().inventory.katana.owned&&qa.get().points===2400&&elements.get('toast').textContent==='NEED 100 MORE ESSENCE','Short of essence it says how much more');
  qa.setPoints(3000);const score=qa.get().totalScore;qa.interact();
  assert(qa.get().inventory.katana.owned&&qa.get().weapon==='katana'&&qa.get().points===500,'2,500 essence buys it, and it is drawn at once');
  assert.equal(qa.get().totalScore,score,'Buying it does not change the leaderboard score');
  assert.equal(elements.get('toast').textContent,'TSURU KATANA ACQUIRED');frames(1);
  assert(prompt().includes('OWNED')&&prompt().includes('PRESS 7 TO EQUIP'),'Then the stand says it is owned and how to draw it');
  press('Digit1');assert.equal(qa.get().weapon,'glock');qa.interact();assert.equal(qa.get().weapon,'katana','E at the stand draws it again, free');assert.equal(qa.get().points,500);
  press('Digit1');press('Digit7');assert.equal(qa.get().weapon,'katana','Key 7 draws it');
  assert(qa.get().gunGroups.katana.visible&&Object.entries(qa.get().gunGroups).every(([t,g])=>g.visible===(t==='katana')),'Only the katana is in hand');
  assert.equal(elements.get('ammo').textContent,'MELEE');assert(!/RELOAD/.test(elements.get('reloadStatus').textContent),'The HUD shows MELEE, no ammunition and no reload');
  assert(/TSURU \/ KATANA/.test(elements.get('weaponName').textContent));assert.equal(qa.get().reticleHud.weapon,'katana');
  qa.reload();assert.equal(qa.get().reloadLeft,0,'It never reloads');
  canvas.events.mousedown({button:2,preventDefault(){}});frames(30);assert.equal(qa.get().aiming,false,'and never aims');listeners.mouseup({button:2});
  console.log('PASS: the katana stand stands against the servants’ quarters’ north wall with a clear, reachable approach; 2,500 essence buys it and draws it, E or key 7 draws it again, the HUD reads MELEE with no reload, and it cannot aim.');

  // ---- Slashing in the mansion ----------------------------------------------------------
  const swing=()=>qa.get().swing;
  const arena=()=>{for(const e of qa.get().zombies)if(!e.dead)qa.damageEnemy(e,1e9);qa.setPlayer(0,20);qa.setAim(0,0);frames(2);};
  const dummy=(x,z,y=0)=>{const e=qa.makeZombie(x,z,false,false,false,y);e.hp=e.maxHp=5000;e.speed=0;return e;};
  const once=()=>{qa.shoot();frames(Math.ceil(SLASHES[swing().kind].hitAt*60)+1);};
  arena();qa.setPoints(0);
  const a=dummy(0,17.6),b=dummy(1.77,18.23),c=dummy(2.3,19.03),d=dummy(0,15.6),e=dummy(0,22.6);qa.get().scene.updateMatrixWorld(true);
  const essence=qa.get().points;once();
  assert(a.hp===5000-150&&b.hp===5000-150,'One slash cuts the enemy ahead and the one 45° to the side, 150 each');
  assert(c.hp===5000&&d.hp===5000&&e.hp===5000,'but not one 67° to the side, one beyond 4 yards or one behind');
  assert.equal(qa.get().points-essence,20,'Each enemy cut pays the usual 10 essence a hit');
  assert(qa.get().hitTime>0,'The hit marker shows');
  // Three slashes in turn, then the set starts again after a pause.
  const kinds=[swing().kind];for(let i=0;i<4;i++){frames(Math.ceil(KATANA.swing*60)+1);once();kinds.push(swing().kind);}
  assert.deepEqual(kinds,[0,1,2,0,1],'The three slashes play in turn');
  frames(Math.ceil((SLASHES[1].length+KATANA.combo)*60)+2);once();assert.equal(swing().kind,0,'After a pause the set starts again with the first');
  // Hold to keep slashing, at the katana's pace.
  frames(60);const before=swing().id;canvas.events.mousedown({button:0,preventDefault(){}});frames(Math.round(KATANA.swing*60*3)+2);listeners.mouseup({button:0});
  assert(swing().id-before>=3&&swing().id-before<=4,'Holding the trigger keeps slashing, one every 0.48 s');
  // The view in hand: the blade moves through each slash and comes back to rest.
  frames(60);const g=qa.get().gunGroups.katana,rest=g.quaternion.clone();const poses=[];
  for(let i=0;i<3;i++){frames(90);qa.shoot();frames(Math.round(SLASHES[swing().kind].hitAt*60));poses.push(g.quaternion.clone());}
  frames(60);assert(Math.abs(g.quaternion.dot(rest))>.9999,'The blade settles back to rest');
  for(const q of poses)assert(Math.abs(q.dot(rest))<.97,'Mid-slash the blade is well away from rest');
  assert(Math.abs(poses[0].dot(poses[1]))<.99&&Math.abs(poses[1].dot(poses[2]))<.99&&Math.abs(poses[0].dot(poses[2]))<.99,'Each slash holds the blade differently');
  console.log('PASS: a slash cuts the enemies ahead and 45° aside for 150 each (10 essence a hit), not those 67° aside, beyond 4 yards or behind; the three slashes play in turn and restart after a pause; holding keeps slashing every 0.48 s; the blade in hand moves differently through each slash and settles back to rest.');

  // Walls and floors stop it; the Forge, Deadeye and Double Damage raise its damage.
  arena();qa.setPlayer(20,-61.2);qa.setAim(Math.PI,0);frames(2);const through=dummy(20,-58.7);qa.get().scene.updateMatrixWorld(true);frames(70);once();
  assert.equal(through.hp,5000,'A slash does not pass through a wall');
  arena();qa.setPlayer(-24,-3);qa.setAim(0,0);frames(2);const above=dummy(-24,-5,UPPER_Y);frames(70);once();assert.equal(above.hp,5000,'or through a floor');
  arena();const f=dummy(0,17.6);frames(70);
  const inv=qa.get().inventory.katana,damage=()=>{f.hp=5000;frames(70);once();return 5000-f.hp;};
  assert.equal(damage(),150);inv.forgeRank=1;assert.equal(damage(),150*forgeBonuses(1).damageMultiplier,'The Soul Forge multiplies it');inv.forgeRank=3;assert.equal(damage(),150*forgeBonuses(3).damageMultiplier);
  inv.forgeRank=0;qa.get().perkOwned.add('eye');assert.equal(damage(),225,'Deadeye adds 50%');qa.get().perkOwned.delete('eye');
  qa.dropPickup(0,20,'double');frames(2);assert.equal(damage(),300,'Double Damage doubles it');
  console.log('PASS: walls and floors stop a slash; the Soul Forge (2×, 4×, 6×), Deadeye and Double Damage raise its damage.');

  // ---- The Soul Forge with the katana in hand -------------------------------------------
  qa.start();qa.holdSpawns();qa.setHealth(1e6);const own=qa.get().inventory.katana;own.owned=true;qa.selectWeapon('katana');
  const forge=qa.get().interactables.find(s=>s.type==='upgrade'&&s.y===0),plateText=()=>qa.get().stationBuilder.visuals.find(v=>v.station===forge).parts.filter(p=>p.material?.userData?.sign).map(p=>p.material.userData.sign.text).join(' | ');
  qa.setPlayer(forge.x+Math.sin(forge.rotation||0)*1.6,forge.z+Math.cos(forge.rotation||0)*1.6);frames(2);
  assert(!/AMMO|RELOAD|magazine|reload/.test(elements.get('interaction').innerHTML),'With the katana held the Forge’s prompt says nothing of ammunition or reloads');
  assert(/2× base damage/.test(elements.get('interaction').innerHTML));
  assert(forge.forgeMelee&&/2× BASE DAMAGE/.test(plateText())&&!/AMMO|RELOAD/.test(plateText()),'and its plaques show only the damage');
  qa.setPoints(FORGE.prices[0]);qa.interact();assert.equal(own.forgeRank,1);assert.equal(elements.get('toast').textContent,'SOUL FORGE RANK 1/3 · 2× DAMAGE','Forging the blade adds damage and nothing else');
  assert(/TSURU \/ KATANA \/ FORGED 1\/3/.test(elements.get('weaponName').textContent),'The HUD shows its Forge rank');
  qa.get().inventory.glock.owned=true;press('Digit1');frames(2);assert(!forge.forgeMelee&&/AMMO/.test(plateText()),'Drawing a gun brings back the gun plaques');
  press('Digit7');frames(2);assert(forge.forgeMelee&&/4× BASE DAMAGE/.test(plateText()),'and the blade’s own rank returns with it');
  // No weapon ranks: the stand never sells any.
  const rack=qa.get().interactables.find(s=>s.type==='katana');qa.setPlayer(rack.x+Math.sin(rack.rotation||0)*1.6,rack.z+Math.cos(rack.rotation||0)*1.6);frames(2);
  const points=qa.get().points;qa.interact();assert.equal(qa.get().points,points,'Once owned the stand sells nothing more (no upgrade ranks)');assert.equal(own.weaponRank,0);
  // A new run takes it away.
  qa.start();assert(!qa.get().inventory.katana.owned&&qa.get().weapon==='glock'&&qa.get().inventory.katana.forgeRank===0,'A new run starts without it');
  console.log('PASS: with the katana held the Soul Forge’s prompt and plaques show only damage, forging it adds damage alone, gun plaques return with a gun; the stand sells no ranks, and a new run starts without the katana.');
}

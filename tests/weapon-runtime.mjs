import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v197 (Dead Tide step 1): the weapon runtime is a shared module. The mansion still
// plays identically (scripts/golden-trace.mjs fires every gun, buys ranks, reloads and
// throws); this test checks the module runs on a range of its own, with its own state.
export async function verifyWeaponRuntime(qa){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  const shared=['three.module.js','weapon-stats.mjs','combat-feedback.mjs','zombie-injuries.mjs','soul-forge.mjs','weapon-models.mjs','weapon-ranks.mjs','grenade-throw.mjs','powerups.mjs','katana.mjs'];
  assert.deepEqual(imports('weapon-runtime.mjs').filter(f=>!shared.includes(f)),[],'The weapon runtime imports only shared modules');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('weapon-runtime.mjs');
  // v204: the weapon table lives in weapon-stats.mjs, so the estate's bounds (core.mjs and
  // its layout tables) stay out too. graphics.mjs is the shared optics and film-pass
  // toolkit the weapon models use; it builds nothing.
  const mansion=['core.mjs','estate-layout.mjs','graveyard-layout.mjs','vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','world-event-visuals.mjs','curse.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','lighting.mjs'];
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing the weapon runtime loads builds or holds the mansion');
  const src=read('game.js');
  for(const name of ['shoot','reload','finishReload','ammoCapacity','freshInventory','selectWeapon','buyWeaponRank','grenade','releaseGrenade','grantPowerup','refillAmmo','holdToFire','viewGun','zoomOf','aimHeight'])
    assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  assert(/import \{createWeaponRuntime\} from '\.\/weapon-runtime\.mjs\?v=\d+'/.test(src)&&/=createWeaponRuntime\(\{/.test(src),'The mansion drives the shared weapon runtime');

  // ---- A firing range with no mansion -------------------------------------------------
  const T=await import('../.qa/three.module.js');
  const {createWeaponRuntime}=await import('../.qa/weapon-runtime.mjs');
  const {createWeaponRecoil}=await import('../.qa/combat-feedback.mjs');
  const {createEffectPool}=await import('../.qa/effect-pool.mjs');
  const {weapons}=await import('../.qa/core.mjs');
  const {POWERUPS}=await import('../.qa/powerups.mjs');
  qa.start();qa.holdSpawns();
  const g=qa.get(),range=new T.Group(),camera=new T.PerspectiveCamera(75,16/9,.05,200),effects=[],hits=[],detonations=[],notes=[];
  // The guns on screen are the game's own models; everything else belongs to the range.
  const bushDot=new T.Group();bushDot.userData={...g.gunGroups.bushmaster.userData};
  const view={camera,gunGroups:g.gunGroups,bushDot,smgDual:g.smgDual,dualGuns:g.dualGuns,dualMuzzle:new T.Vector3(),flash:new T.Mesh(new T.BoxGeometry(),new T.MeshBasicMaterial()),
    reticleHud:{select(){}},weaponRecoil:createWeaponRecoil(),grenadeThrow:{active:false,begin:()=>true},grenadeAssets:g.grenadeAssets};
  // A target 5 m ahead: a body, and a head above it.
  const target={dead:false,group:new T.Group()},body=new T.Mesh(new T.BoxGeometry(1.2,1.6,.4),new T.MeshBasicMaterial()),head=new T.Mesh(new T.BoxGeometry(1.2,.6,.4),new T.MeshBasicMaterial());
  body.position.set(0,-.4,-5);head.position.set(0,.8,-5);body.userData={enemy:target,part:'torso'};head.userData={enemy:target,head:true,part:'head'};target.group.add(body,head);range.add(target.group);range.updateMatrixWorld(true);
  let seed=9;const rand=(a,b)=>{seed=(seed*1664525+1013904223)>>>0;return a+seed/4294967296*(b-a);};
  const S={inventory:null,weapon:'glock',mode:'playing',aiming:false,lookYaw:0,lookPitch:0,perkOwned:new Set(),points:0,reloadLeft:0,reloadDuration:0,shotTimer:0,shotId:0,grenades:2,grenadeTime:0,grenadeCooldown:0,doubleTime:0,flashTime:0,recoil:0,dualSide:0,weaponViewFov:75};
  const arms=createWeaponRuntime({level:{colliders:[],isBlocked:()=>false,solidMeshes:[]},view,
    run:{scene:range,zombies:[target],effects,markPool:createEffectPool(range,new T.MeshBasicMaterial(),'mark',8),rand,tone(){},noise(){},notify:t=>notes.push(t),rumble(){},suppressedReport(){},updateHud(){},updateReloadHud(){},shotRumble:{},raycaster:new T.Raycaster()},
    state:S,combat:{damageEnemy:(e,amount,headshot,impact)=>hits.push({amount,headshot,source:impact.source}),bloodBurst(){},detonateRound:(p,d,source)=>detonations.push(source)}});
  // A fresh inventory: the pistol is owned and loaded; nothing else is.
  S.inventory=arms.freshInventory();const glock=S.inventory.glock;
  assert(glock.owned&&glock.ammo===weapons.glock.mag&&glock.reserve===weapons.glock.reserve&&!S.inventory.smg.owned,'A fresh inventory holds a loaded pistol');
  arms.selectWeapon('smg');assert.equal(S.weapon,'glock','An unowned weapon cannot be drawn');
  arms.selectWeapon('glock');assert(g.gunGroups.glock.visible&&!g.gunGroups.smg.visible,'The held gun is the one on screen');
  // Firing: a round, the fire-rate timer, and the weapon's damage on the body.
  arms.shoot();assert(glock.ammo===weapons.glock.mag-1&&Math.abs(S.shotTimer-weapons.glock.rate)<1e-12&&S.shotId===1,'A shot spends a round and starts the fire-rate timer');
  assert(hits.length===1&&Math.abs(hits[0].amount-weapons.glock.damage)<1e-9&&!hits[0].headshot&&hits[0].source==='glock','and hits the body for the pistol’s damage');
  arms.shoot();assert.equal(hits.length,1,'The next shot waits for the timer');
  // Headshots, Deadeye and double damage multiply.
  S.shotTimer=0;S.lookPitch=Math.atan2(.8,5);S.perkOwned.add('eye');S.doubleTime=5;arms.shoot();
  assert(hits[1].headshot&&Math.abs(hits[1].amount-weapons.glock.damage*1.5*2.6*2)<1e-9,'A headshot with Deadeye and double damage: ×1.5 ×2.6 ×2');
  S.lookPitch=0;S.perkOwned.clear();S.doubleTime=0;
  // The shotgun fires all its pellets; the semi-autos fire once per pull.
  S.inventory.shotgun.owned=true;arms.selectWeapon('shotgun');S.shotTimer=0;const before=hits.length;arms.shoot();
  assert.equal(hits.length-before,weapons.shotgun.pellets,'Every shotgun pellet lands');
  assert(!arms.holdToFire(),'The shotgun fires once per pull');S.inventory.smg.owned=true;arms.selectWeapon('smg');assert(arms.holdToFire(),'The SMG fires while held');
  // An empty magazine starts a reload; Quick Hands halves it; the reload refills.
  arms.selectWeapon('glock');glock.ammo=0;S.shotTimer=0;arms.shoot();
  assert(S.reloadLeft>0&&Math.abs(S.reloadDuration-weapons.glock.reload)<1e-9,'Firing on empty starts a reload');
  const r0=glock.reserve;arms.finishReload();S.reloadLeft=0;assert(glock.ammo===weapons.glock.mag&&glock.reserve===r0-weapons.glock.mag,'which loads from the reserve');
  glock.ammo=3;S.perkOwned.add('quick');arms.reload();assert(Math.abs(S.reloadDuration-weapons.glock.reload*.5)<1e-9,'Quick Hands halves the reload');S.reloadLeft=0;S.perkOwned.clear();
  // Ranks: bought with essence, never on credit; magazine ranks grow the magazine.
  S.points=10;assert(!arms.buyWeaponRank('glock')&&S.inventory.glock.weaponRank===0,'No rank on credit');
  S.points=1e6;assert(arms.buyWeaponRank('glock')&&S.inventory.glock.weaponRank===1&&S.points<1e6,'A rank is bought with essence');
  S.inventory.rifle.owned=true;S.inventory.rifle.weaponRank=2;assert.equal(arms.ammoCapacity('rifle').mag,40,'The M4’s second rank holds 40');
  // The M4 capstone's rounds burst where they strike.
  S.inventory.rifle.weaponRank=4;arms.selectWeapon('rifle');S.shotTimer=0;S.reloadLeft=0;arms.shoot();assert.deepEqual(detonations,['rifle'],'The M4 capstone’s round detonates');
  // Grenades: counted, then infinite with a cooldown; a thrown one and its spoon fly.
  assert(arms.grenade()&&S.grenades===1,'A grenade is thrown from the count');
  arms.releaseGrenade(new T.Vector3(.2,-.2,-.5),new T.Quaternion(),0);assert(effects.some(e=>e.type==='grenade')&&effects.some(e=>e.type==='spoon'),'The grenade and its spoon fly');
  S.grenades=0;assert(!arms.grenade(),'None left, none thrown');
  arms.grantPowerup('grenades');assert(Math.abs(S.grenadeTime-POWERUPS.grenades.duration)<1e-9,'Infinite grenades last their duration');
  assert(arms.grenade()&&S.grenades===0&&S.grenadeCooldown>0&&!arms.grenade(),'Infinite throws cost nothing but recover between throws');
  // Power-ups: double damage, and a full restock with one more grenade.
  arms.grantPowerup('double');assert.equal(S.doubleTime,POWERUPS.double.duration);
  glock.reserve=0;arms.grantPowerup('ammo');assert(arms.ammoFull('glock')&&S.grenades===1,'Max ammo restocks every owned gun and adds a grenade');
  qa.start();
  console.log(`PASS: shared weapon runtime — imports only shared modules (${closure.size} files, none of them mansion builders or state), game.js keeps no copy; on a range with its own state it draws only owned guns, fires for the weapon's damage with headshot, Deadeye and double-damage multipliers, fires every shotgun pellet, reloads on empty and faster with Quick Hands, sells ranks for essence only, grows the M4's magazine, detonates its capstone rounds, throws counted and infinite grenades, and applies every power-up.`);
}

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v196 (Dead Tide step 1): hits, kills, blasts, drops and pickups are a shared module.
// The mansion still plays identically (scripts/golden-trace.mjs); this test checks the
// module stands on its own, on a yard with none of the mansion's rewards or extras.
export async function verifyEnemyCombat(qa){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  const shared=['three.module.js','zombies.mjs','combat-feedback.mjs','enrage.mjs','lurker.mjs','powerups.mjs','explosion-fx.mjs','drop-fade.mjs'];
  assert.deepEqual(imports('enemy-combat.mjs').filter(f=>!shared.includes(f)),[],'Combat imports only shared modules');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('enemy-combat.mjs');
  const mansion=['vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','graveyard-layout.mjs','estate-layout.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','world-event-visuals.mjs','curse.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','lighting.mjs'];
  // (Power-up models reuse the weapon models, and with them graphics.mjs, the shared
  // toolkit for optics and the film pass; it builds nothing when loaded.)
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing combat loads builds or holds the mansion');
  const src=read('game.js');
  for(const name of ['damageEnemy','killZombie','bloodBurst','blastLine','explode','detonateRound','lurkerBurst','dropPickup','updatePickups'])assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  assert(/import \{createCombat\} from '\.\/enemy-combat\.mjs\?v=\d+'/.test(src)&&/=createCombat\(\{\n  level:mansionLevel,/.test(src),'The mansion hands combat the same map as the spawner and the AI');

  // ---- A yard with no mansion -----------------------------------------------------------
  const T=await import('../.qa/three.module.js');
  const {createCombat,GRENADE_DAMAGE}=await import('../.qa/enemy-combat.mjs');
  const {createEnemySpawner}=await import('../.qa/enemy-spawn.mjs');
  const {createEnemyAI}=await import('../.qa/enemy-ai.mjs');
  const {createCrowd}=await import('../.qa/crowd.mjs');
  const {createEffectPool}=await import('../.qa/effect-pool.mjs');
  const {createExplosionFx}=await import('../.qa/explosion-fx.mjs');
  qa.start();qa.holdSpawns();
  const {enemyAssets,powerupAssets}=qa.get();
  const yard=new T.Group(),player=new T.Vector3(0,0,8),zombies=[],effects=[],pickups=[],log={hits:0,kills:[],collected:[],bonus:0};
  let seed=3,points=0,kills=0,health=100,elapsed=0;
  const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},rand=(a,b)=>a+rng()*(b-a);
  // A low stone wall west of the player blocks blasts and shots behind it.
  const wall=new T.Mesh(new T.BoxGeometry(.4,2,6),new T.MeshBasicMaterial());wall.position.set(-6,1,2);yard.add(wall);wall.updateMatrixWorld(true);
  const routes={direction:(x,z)=>({reachable:true,distance:Math.hypot(x-player.x,z-player.z),x:player.x,z:player.z})};
  const level={colliders:[],isBlocked:()=>false,supportBelow:()=>0,floorHeight:()=>0,rampHeight:()=>null,move(p,dx,dz){p.x+=dx;p.z+=dz;},crouchAt:()=>false,canStand:()=>true,
    nav:{...routes,brutes:routes},crowd:createCrowd(zombies,player),solidMeshes:[wall],visibleFloor:(x,z,s)=>s};
  const sphere=(x,y,z,sx,sy,sz,m)=>{const o=new T.Mesh(new T.SphereGeometry(1,8,6),m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);yard.add(o);return o;};
  const run={player,zombies,scene:yard,rand,rng,tone(){},noise(){},notify(){},rumble(){},sphere,effects,bloodPool:createEffectPool(yard,new T.MeshBasicMaterial(),'particle',64),
    explosionFx:createExplosionFx(yard),blastLight:{release(){}},powerupAssets,pickups,enemyAssets,get elapsed(){return elapsed;},get playing(){return true;},
    addPoints(n){points+=n;return n;},addKill(){kills++;},hurtPlayer(n){health-=n;},kick(){},killHeal(){},hitFeedback(){log.hits++;},collect(p){log.collected.push(p.type);},releasePickup(){}};
  const combat=createCombat({level,run,rules:{killReward:b=>b*2,onKill:(e,impact)=>log.kills.push(impact.source),bonusDrop:()=>log.bonus++,hitAmount:(e,a)=>a}});
  const spawner=createEnemySpawner({level,run:{player,zombies,scene:yard,enemyAssets,rng,rand,sharedResources:()=>({geometries:new Set(),materials:new Set()})},rules:{enemyStats:()=>({health:100,speed:0})}});
  const ai=createEnemyAI({level,run:{player,camera:{position:new T.Vector3(0,1.6,8)},zombies,scene:yard,rand,tone(){},noise(){},get elapsed(){return elapsed;},get health(){return health;},
    hurtPlayer(n){health-=n;},gameOver(){},killZombie:combat.killZombie,disposeEnemy:spawner.disposeEnemy,lurkerBursts:combat.lurkerBursts,lurkerBurst:combat.lurkerBurst},
    rules:{decoy:()=>null,decoyStruck(){},detour:()=>null,baseDamage:()=>5,surge:()=>1,speedScale:()=>1,attackRate:()=>1}});
  const step=n=>{for(let i=0;i<n;i++){elapsed+=1/60;ai.updateEnemies(1/60);combat.updatePickups(1/60);}};
  const quiet=fn=>{const old=Math.random;Math.random=()=>.99;try{return fn();}finally{Math.random=old;}};
  const fresh=(kind,x,z)=>{const e=spawner.spawnKind(kind,x,z,0);e.emergeLeft=0;return e;};

  // Hits pay 10; kills pay the mode's reward (doubled here) and count once.
  const w=fresh('walker',2,0);
  quiet(()=>{combat.damageEnemy(w,40,false,{part:'torso',source:'glock'});});
  assert(w.hp===60&&points===10&&log.hits===1&&!w.dead,'A hit takes health and pays 10');
  quiet(()=>combat.damageEnemy(w,100,false,{part:'torso',source:'glock'}));
  assert(w.dead&&kills===1&&points===10+10+100&&log.kills.join()==='glock','A kill pays the mode’s reward (2 × 50) once, and the mode hears about it');
  quiet(()=>combat.damageEnemy(w,100,false,{source:'glock'}));assert(kills===1,'The dead take no more hits');
  const b=fresh('brute',4,0);quiet(()=>combat.damageEnemy(b,1e9,true,{part:'head',source:'glock'}));
  assert(kills===2&&points===120+10+400,'A brute headshot pays 2 × 200');
  // Leg hits bring a walker down to crawl.
  const c=fresh('walker',6,0);for(let i=0;i<40&&!c.crawling;i++)quiet(()=>combat.damageEnemy(c,c.maxHp*.04,false,{part:'leg',side:1,direction:new T.Vector3(0,0,-1),force:1,source:'glock'}));
  assert(c.crawling&&!c.dead,'Leg hits leave a walker crawling');
  // Grenades: full damage through 9 m, half beyond, none behind the wall; the player
  // is hurt within 3 m unless the blast is safe.
  for(const e of zombies)if(!e.dead)quiet(()=>combat.damageEnemy(e,1e9,false,{source:'glock'}));
  const near=fresh('walker',0,4),outer=fresh('walker',10.5,0),beyond=fresh('walker',13,0),hidden=fresh('walker',-8,2);
  for(const e of [near,outer,beyond,hidden])e.hp=e.maxHp=1e4;
  quiet(()=>combat.explode(new T.Vector3(0,.3,0)));
  assert(Math.abs(near.hp-(1e4-GRENADE_DAMAGE))<1e-6&&Math.abs(outer.hp-(1e4-GRENADE_DAMAGE/2))<1e-6&&beyond.hp===1e4,'A grenade does full damage close in, half at the edge, nothing past 12 m');
  assert(hidden.hp===1e4,'The yard’s own wall shields an enemy from the blast');
  assert(health===100,'The player 8 m away is unhurt');
  quiet(()=>combat.explode(new T.Vector3(1.5,.3,8),{safe:true}));assert(health===100,'A safe blast never hurts the player');
  quiet(()=>combat.explode(new T.Vector3(1.5,.3,8)));assert(health===75,'A grenade beside the player hurts for 25');
  // Detonating rounds: a small blast for a fraction of a grenade.
  const before=near.hp;quiet(()=>combat.detonateRound(new T.Vector3(0,.9,4.5),{radius:5,fraction:.33},'rifle'));
  assert(Math.abs(before-near.hp-GRENADE_DAMAGE*.33)<1e-6,'A detonating round does a third of a grenade');
  // A lurker's burst, set off by the shared AI on its next update, hurts what is near.
  for(const e of zombies)if(!e.dead)quiet(()=>combat.damageEnemy(e,1e9,false,{source:'glock'}));
  const l=fresh('lurker',0,5),by=fresh('walker',1.5,5);by.hp=by.maxHp=1e4;quiet(()=>combat.damageEnemy(l,1e9,false,{source:'glock'}));
  assert(combat.lurkerBursts.length===1,'A killed lurker queues its burst');
  const h0=health;quiet(()=>step(1));
  assert(combat.lurkerBursts.length===0&&by.hp<1e4&&health<h0,'which goes off on the next update, hurting a neighbour and the player 3 m away');
  // Drops: one kill in about eight leaves a power-up; walking over it collects it, and
  // an uncollected one fades away after 20 seconds.
  const lucky=fresh('walker',3,8);const old=Math.random;Math.random=()=>.01;try{combat.damageEnemy(lucky,1e9,false,{source:'glock'});}finally{Math.random=old;}
  assert.equal(pickups.length,1,'An unlucky kill leaves a power-up');
  player.set(pickups[0].mesh.position.x,0,pickups[0].mesh.position.z);step(1);
  assert(pickups.length===0&&log.collected.length===1,'Walking over it collects it through the mode');
  combat.dropPickup(30,30,'ammo');step(20*60+2);assert.equal(pickups.length,0,'An uncollected power-up expires');
  // Bonus drops are the mode's to make; the corpse limit keeps at most 14 ragdolls.
  const bonus=fresh('walker',20,0);bonus.bonusEssence=25;quiet(()=>combat.damageEnemy(bonus,1e9,false,{source:'glock'}));assert.equal(log.bonus,1,'An enemy carrying a bonus asks the mode to drop it');
  for(let i=0;i<18;i++)quiet(()=>combat.damageEnemy(fresh('walker',-20+i*2,-20),1e9,false,{source:'grenade'}));
  const lingering=zombies.filter(e=>e.dead&&e.ragdoll.life>e.death).length;assert(lingering<=15,`Old corpses are cleared beyond the limit (${lingering} lingering)`);
  for(const e of zombies)spawner.disposeEnemy(e);
  qa.start();
  console.log(`PASS: shared enemy combat — imports only shared modules (${closure.size} files, none of them mansion builders or state), game.js keeps no copy; on a bare yard hits pay 10 and kills the mode's own reward once, legs bring walkers down, grenades do full, half and no damage by range, stop at the yard's wall and spare the player unless close, detonating rounds hit for a third, a lurker's burst goes off on the AI's next update, drops are collected through the mode and expire, bonus drops are the mode's, and the corpse limit holds.`);
}

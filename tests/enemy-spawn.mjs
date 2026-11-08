import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v195 (Dead Tide step 1): making and placing enemies is a shared module too. The
// mansion still plays identically (scripts/golden-trace.mjs records every enemy's
// birth as well as its moves); this test checks the spawner stands on its own and,
// with the shared AI, runs a whole fight on a map that has no mansion in it.
export async function verifyEnemySpawn(qa){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  const shared=['three.module.js','brute.mjs','feral.mjs','crowd.mjs','combat-feedback.mjs','zombie-dog.mjs','zombies.mjs','zombie-life.mjs','zombie-build.mjs','zombie-injuries.mjs','lurker.mjs','zombie-faces.mjs'];
  assert.deepEqual(imports('enemy-spawn.mjs').filter(f=>!shared.includes(f)),[],'The spawner imports only shared enemy modules');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('enemy-spawn.mjs');
  const mansion=['vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','curse.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','graphics.mjs','lighting.mjs'];
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing the spawner loads builds or holds the mansion');
  const src=read('game.js');
  for(const name of ['makeZombie','makeLurker','injure','disposeEnemy'])assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  assert(!/function valid\(/.test(src)&&!/let options=reachable/.test(src),'nor its own spawn-point checks');
  assert(/import \{createEnemySpawner\} from '\.\/enemy-spawn\.mjs\?v=\d+'/.test(src)&&/=createEnemySpawner\(\{\n  level:mansionLevel,/.test(src)&&/=createEnemyAI\(\{\n  level:mansionLevel,/.test(src),'The mansion hands the spawner and the AI the same map');

  // ---- A map with no mansion at all ------------------------------------------------------
  const T=await import('../.qa/three.module.js');
  const {createEnemySpawner}=await import('../.qa/enemy-spawn.mjs');
  const {createEnemyAI}=await import('../.qa/enemy-ai.mjs');
  const {createCrowd}=await import('../.qa/crowd.mjs');
  const {BRUTE}=await import('../.qa/brute.mjs');
  const {LURKER}=await import('../.qa/lurker.mjs');
  qa.start();qa.holdSpawns();
  const enemyAssets=qa.get().enemyAssets;
  // A flat yard: one wall, a raised ledge in one corner, a pond nobody can stand in,
  // and routes that reach the player from everywhere west of x=20.
  const colliders=[{x:0,z:3,w:6,d:.4}];
  const blocked=(x,z,r)=>colliders.some(c=>Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
  const player=new T.Vector3(0,0,8),zombies=[],added=[],stats={health:100,speed:2};let seed=1,health=100,elapsed=0;
  const rng=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;},rand=(a,b)=>a+rng()*(b-a);
  const routes={direction:(x,z)=>x>20?null:{reachable:true,distance:Math.hypot(x-player.x,z-player.z),x:player.x,z:player.z}};
  const level={colliders,isBlocked:blocked,supportBelow:(x,z)=>x<-15&&z<-15?1:0,floorHeight:()=>0,rampHeight:()=>null,
    move(pos,dx,dz,r){if(!blocked(pos.x+dx,pos.z+dz,r)){pos.x+=dx;pos.z+=dz;}},crouchAt:()=>false,canStand:(x,z)=>Math.hypot(x+10,z-20)>3,
    nav:{...routes,brutes:routes},crowd:createCrowd(zombies,player)};
  const spawner=createEnemySpawner({level,run:{player,zombies,scene:{add:g=>added.push(g)},enemyAssets,rng,rand,sharedResources:()=>({geometries:new Set(),materials:new Set()})},rules:{enemyStats:()=>stats}});
  // Every kind is made from the mode's stats and joins its scene and enemy list.
  const kinds=['walker','brute','dog','ashfang','feral','lurker'],made=kinds.map((k,i)=>spawner.spawnKind(k,-8+i*3,-6,0));
  assert.equal(zombies.length,6);assert.equal(added.length,6);
  const [walker,brute,dog,ash,feral,lurker]=made;
  assert(walker.hp===100&&!walker.dog&&!walker.brute,'A walker has the mode’s health');
  assert(brute.brute&&Math.abs(brute.hp-100*BRUTE.healthMultiplier)<1e-9&&Math.abs(brute.speed-2*.77)<1e-9,'A brute is tougher and slower');
  assert(dog.dog&&!dog.rareDog&&Math.abs(dog.hp-85)<1e-9,'A dog has 85% health');
  assert(ash.dog&&ash.rareDog&&Math.abs(ash.hp-170)<1e-9,'An Ashfang has twice a dog’s');
  assert(feral.feral&&!feral.dog&&!feral.brute,'A feral is its own kind');
  assert(lurker.lurker&&Math.abs(lurker.speed-2*LURKER.speed)<1e-9&&Math.abs(lurker.maxHp-100*LURKER.health)<1e-9,'A lurker uses the lurker multipliers');
  for(const e of made)assert(e.group.position.y===-.02&&e.radius>0&&e.navigation&&typeof e.canOccupy==='function','and every enemy is placed on the yard’s floor, ready for the crowd and the AI');
  // Placement uses the yard's own walls, floors, standing rules and routes.
  for(const e of made)spawner.disposeEnemy(e);zombies.length=0;
  const {valid}=spawner.placement('walker');
  assert(valid([0,-6]),'Open floor away from the player is a valid spawn');
  assert(!valid([0,7]),'Not within 10 m of the player');
  assert(!valid([0,3]),'Not inside a wall');
  assert(!valid([-18,-18]),'Not where the floor is a different height');
  assert(!valid([-10,20]),'Not where the mode says nothing can stand');
  assert(!valid([25,-6]),'Not where no route reaches the player');
  assert(valid([0,-2,0],5)&&!valid([0,-2,0]),'The minimum distance is the mode’s to set');
  // Points with a shorter route are preferred; nothing valid means no spawn.
  const place=spawner.placement('brute'),near=[[-6,-20],[6,-20]],far=[[-30,-60]];
  for(let i=0;i<8;i++){const at=spawner.choosePoint([...near,...far],place);assert(Math.abs(at[1]+20)<=.2&&Math.abs(Math.abs(at[0])-6)<=.2,'Spawns pick points under 42 m first');}
  assert.deepEqual(spawner.choosePoint(far,place).map(v=>Math.round(v)),[-30,-60,0],'A distant point is used when it is the only one');
  assert.equal(spawner.choosePoint([],place),null,'No valid point means no spawn');

  // ---- A whole fight with no mansion: spawner plus AI -----------------------------------
  const ai=createEnemyAI({level,run:{player,camera:{position:new T.Vector3(0,1.6,8)},zombies,scene:{remove(){}},rand,tone(){},noise(){},get elapsed(){return elapsed;},get health(){return health;},
    hurtPlayer(n){health-=n;},gameOver(){},killZombie(){},disposeEnemy:spawner.disposeEnemy,lurkerBursts:[],lurkerBurst(){}},
    rules:{decoy:()=>null,decoyStruck(){},detour:()=>null,baseDamage:()=>5,surge:()=>1,speedScale:()=>1,attackRate:()=>1}});
  const points=[[-12,-8],[12,-8],[-14,16],[14,16],[12,22]];
  for(const kind of ['walker','walker','dog','feral','brute']){const at=spawner.choosePoint(points.filter(p=>spawner.placement(kind).valid(p)),spawner.placement(kind));assert(at,`A ${kind} finds a spawn point`);spawner.spawnKind(kind,...at);}
  for(let i=0;i<1500;i++){elapsed+=1/60;ai.updateEnemies(1/60);}
  const close=zombies.filter(e=>Math.hypot(e.walkPos.x-player.x,e.walkPos.z-player.z)<2.5).length;
  assert(close>=4&&health<100,`The yard's own spawns close in and attack (${close} of ${zombies.length} within reach, health ${health.toFixed(1)})`);
  for(const e of zombies)spawner.disposeEnemy(e);
  qa.start();
  console.log(`PASS: shared enemy spawner — imports only enemy modules (${closure.size} files, none of them mansion builders or state), game.js keeps no copy; on a bare yard it makes all six kinds from the mode's stats, places them by the yard's own walls, floors, standing rules and routes, prefers short routes, and with the shared AI runs a fight in which ${close} of 5 spawned enemies close in and attack.`);
}

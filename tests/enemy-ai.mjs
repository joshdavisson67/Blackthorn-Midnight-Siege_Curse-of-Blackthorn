import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v194 (Dead Tide step 1): enemy AI is a shared module that any mode can drive with
// its own map. The mansion still plays identically (scripts/golden-trace.mjs checks
// that frame by frame); this test checks the module stands on its own.
export async function verifyEnemyAI(qa){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  const shared=['three.module.js','brute.mjs','feral.mjs','enrage.mjs','crowd.mjs','combat-feedback.mjs','zombie-dog.mjs','zombies.mjs','zombie-life.mjs','zombie-injuries.mjs','lurker.mjs'];
  assert.deepEqual(imports('enemy-ai.mjs').filter(f=>!shared.includes(f)),[],'The AI imports only shared enemy modules');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('enemy-ai.mjs');
  // Nothing that builds or holds the mansion: no rooms, floors, stairs, Bella, Olivia,
  // Sir Blackthorn, curses or world events. (core.mjs still carries the estate's
  // bounds as two small constant tables; a later step moves those out.)
  const mansion=['vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','curse.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','graphics.mjs','lighting.mjs'];
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing the AI loads builds or holds the mansion');
  const src=read('game.js');
  for(const name of ['updateEnemies','hasClearPath','shoulderNeighbour','corpseFloor','corpseBlocked'])assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  assert(/import \{createEnemyAI\} from '\.\/enemy-ai\.mjs\?v=\d+'/.test(src)&&/const \{updateEnemies,hasClearPath\}=createEnemyAI\(\{/.test(src),'The mansion drives the shared AI');

  // ---- A map with no mansion at all ------------------------------------------------------
  // A flat yard with one wall, no stairs, no routes, no Bella, no attic and no boss:
  // what Dead Tide will look like to the AI.
  const T=await import('../.qa/three.module.js');
  const {createEnemyAI}=await import('../.qa/enemy-ai.mjs');
  const {createCrowd}=await import('../.qa/crowd.mjs');
  const {INJURY}=await import('../.qa/zombie-injuries.mjs');
  function yard({wall=false,ramp=null,decoy=null}={}){
    const colliders=wall?[{x:0,z:3,w:6,d:.4}]:[];
    const blocked=(x,z,r)=>colliders.some(c=>Math.abs(x-c.x)<c.w/2+r&&Math.abs(z-c.z)<c.d/2+r);
    const player=new T.Vector3(0,0,8),zombies=[],hits=[],struck=[],calls=new Set();let health=100,elapsed=0;
    const crowd=createCrowd(zombies,player);
    const ai=createEnemyAI({
      level:{colliders,isBlocked:blocked,supportBelow:()=>0,floorHeight:()=>0,rampHeight:(x,z)=>ramp&&Math.abs(z-ramp.z)<.5?ramp.y:null,
        move(pos,dx,dz,r){if(!blocked(pos.x+dx,pos.z+dz,r)){pos.x+=dx;pos.z+=dz;}},crouchAt:()=>false,nav:{direction:()=>null,brutes:{direction:()=>null}},crowd},
      run:{player,camera:{position:new T.Vector3(0,1.6,8)},zombies,scene:{remove(){}},rand:(a,b)=>(a+b)/2,tone(){},noise(){},get elapsed(){return elapsed;},get health(){return health;},
        hurtPlayer(n){hits.push(n);health-=n;},gameOver(){calls.add('gameOver');},killZombie(){calls.add('kill');},disposeEnemy(){},lurkerBursts:[],lurkerBurst(){}},
      rules:{decoy:()=>decoy,decoyStruck:e=>struck.push(e),detour:()=>null,baseDamage:()=>10,surge:()=>1,speedScale:()=>1,attackRate:()=>1}
    });
    return {ai,player,zombies,hits,struck,calls,step(n){for(let i=0;i<n;i++){elapsed+=1/60;ai.updateEnemies(1/60);}},get health(){return health;}};
  }
  qa.start();qa.holdSpawns();
  const walker=()=>{const e=qa.makeZombie(0,15);e.emergeLeft=0;e.walkPos.set(0,0,0);e.life=null;e.enraged=false;return e;};
  // A walker crosses the open yard and strikes for the mode's damage.
  const a=yard(),e=walker();a.zombies.push(e);a.step(600);
  assert(Math.hypot(e.walkPos.x,e.walkPos.z-8)<1.7,`The walker reaches the player (${e.walkPos.toArray().map(v=>v.toFixed(2))})`);
  assert(a.hits.length>0,'and hits them');
  const expected=10*(e.armless?INJURY.oneArmDamage:1);
  assert(a.hits.every(n=>Math.abs(n-expected)<1e-9),`Each blow is the mode's base damage (${a.hits[0]} vs ${expected})`);
  assert(!a.calls.has('kill'),'Nothing in the yard needs a boss, Bella, an attic or world events');
  // Clear-path checks use the yard's own walls and ramps.
  const b=yard({wall:true});
  assert(a.ai.hasClearPath(0,0,0,8)&&!b.ai.hasClearPath(0,0,0,8),'A wall in the yard blocks the line of approach');
  const c=yard({ramp:{z:4,y:1}});assert(!c.ai.hasClearPath(0,0,0,8),'and so does a ramp too steep to walk straight up');
  // A wall in the way: the walker cannot walk through it.
  const w=walker();b.zombies.push(w);b.step(240);assert(w.walkPos.z<3,'Walls hold the walker back');
  // A decoy draws the walker away; blows at it never reach the player.
  const lure=new T.Vector3(-6,0,0),d=yard({decoy:lure}),v=walker();d.zombies.push(v);d.step(600);
  assert(Math.hypot(v.walkPos.x+6,v.walkPos.z)<1.7&&d.struck.length>0&&d.hits.length===0,'A decoy draws the walker and takes its blows instead of the player');
  qa.start();
  console.log(`PASS: shared enemy AI — imports only enemy modules (${closure.size} files, none of them mansion builders or state), game.js keeps no copy, and a flat test yard with no stairs, routes, Bella, attic or boss drives it: walkers cross it, strike for the mode's damage, respect its walls and ramps, and follow a decoy.`);
}

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v198 (Dead Tide step 1): the run's own values and the player's movement, hurt and
// recovery are a shared module. The mansion still plays identically
// (scripts/golden-trace.mjs walks, sprints, jumps, climbs, gets hurt and buys armor);
// this test checks the module works on flat ground of its own.
export async function verifyPlayerRun(qa){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  assert.deepEqual(imports('player.mjs'),['crowd.mjs','armor.mjs'],'The player module imports only the body radius and the armor ranks');
  const src=read('game.js');
  const moved=['health','maxHealth','armor','armorMax','armorTier','points','totalScore','kills','runTime','lastHurt','perkOwned','inventory','weapon','reloadLeft','reloadDuration','shotTimer','shotId','grenades','grenadeTime','grenadeCooldown','doubleTime','jumpV','feetY','grounded','walkPhase'];
  const lets=[...src.matchAll(/^let ([^;]*);/gm)].flatMap(m=>m[1].split(',').map(d=>d.split('=')[0].trim()));
  assert.deepEqual(moved.filter(n=>lets.includes(n)),[],'game.js no longer keeps the run’s values as its own variables');
  assert(/const runState=createRunState\(\);/.test(src)&&/import \{createRunState,createPlayer\} from '\.\/player\.mjs\?v=\d+'/.test(src),'They live in one runState from player.mjs');
  assert(!/function hurtPlayer\(/.test(src)&&!/footstepTime/.test(src),'and so do getting hurt and footsteps');

  // ---- A fresh run --------------------------------------------------------------------
  const {createRunState,createPlayer}=await import('../.qa/player.mjs');
  const {ARMOR}=await import('../.qa/armor.mjs');
  const a=createRunState(),b=createRunState();
  assert.deepEqual(Object.keys(a).sort(),[...moved].sort(),'A run holds exactly the values game.js used to');
  assert(a.health===100&&a.maxHealth===100&&a.points===500&&a.grenades===3&&a.weapon==='glock'&&a.grounded===true&&a.lastHurt===-20,'with the same starting values');
  assert(a.perkOwned!==b.perkOwned&&a.inventory!==b.inventory,'and each run gets its own perks and inventory');

  // ---- Flat ground with no mansion ----------------------------------------------------
  const T=await import('../.qa/three.module.js');
  const player=new T.Vector3(),sounds=[],hurts=[];let over=0;
  // Plain gravity over a flat floor.
  const updateHeight=(p,v,dt,grounded)=>{if(grounded&&v<=0)return {velocity:0,grounded:true};v-=9.8*dt;p.y+=v*dt;if(p.y<=0){p.y=0;return {velocity:0,grounded:true};}return {velocity:v,grounded:false};};
  const S=createRunState();
  const me=createPlayer({level:{colliders:[],supportBelow:()=>0,move:(p,dx,dz)=>{p.x+=dx;p.z+=dz;},updateHeight},run:{player,tone:f=>sounds.push(f),noise(){},rumble(){},onHurt:(src,shielded)=>hurts.push(shielded),gameOver:()=>over++},state:S});
  const go=(n,x,z,o={})=>{for(let i=0;i<n;i++)me.walk(1/60,x,z,{sprint:false,aiming:false,yaw:0,...o});};
  const speed=(x,z,o)=>{player.set(0,0,0);go(60,x,z,o);return Math.hypot(player.x,player.z);};
  assert(Math.abs(speed(0,-1)-3.6)<1e-9,'Walking covers 3.6 m a second');
  assert(Math.abs(speed(0,-1,{sprint:true})-5.6)<1e-9,'sprinting 5.6');
  assert(Math.abs(speed(0,-1,{aiming:true})-2.1)<1e-9,'and aiming 2.1');
  assert(Math.abs(speed(1,-1)-3.6)<1e-9,'Diagonals are no faster');
  assert(Math.abs(speed(0,-.5)-1.8)<1e-9&&Math.abs(speed(0,-.5,{sprint:true})-5.6)<1e-9,'A half-pushed stick walks at half pace but sprints at full');
  S.perkOwned.add('stride');assert(Math.abs(speed(0,-1)-3.6*1.3)<1e-9,'Nightstride is 30% faster');S.perkOwned.clear();
  player.set(0,0,0);go(1,0,-1,{yaw:Math.PI/2});assert(player.x<0&&Math.abs(player.z)<1e-9,'Forward follows the look direction');
  // A step every .43 s walking and every .27 s sprinting (each frame's step lands on the
  // first frame past the mark): about 14 and 21 in six seconds.
  sounds.length=0;player.set(0,0,0);go(360,0,-1);const walkSteps=sounds.length;sounds.length=0;go(360,0,-1,{sprint:true});const runSteps=sounds.length;
  assert(walkSteps>=13&&walkSteps<=14&&runSteps>=20&&runSteps<=22,`Footsteps keep time (${walkSteps} walking, ${runSteps} sprinting in 6 s)`);
  // Jumping: up, airborne (no footsteps), and down again.
  S.jumpV=4.2;S.grounded=false;sounds.length=0;let peak=0,air=0;for(let i=0;i<120;i++){go(1,0,-1);peak=Math.max(peak,player.y);if(!S.grounded)air++;}
  assert(peak>.8&&air>40&&S.grounded&&player.y===0&&S.feetY===0,`A jump rises (${peak.toFixed(2)} m) and lands`);
  // Hurt: armor first, then health; a fatal hit ends the run.
  S.armor=20;S.health=100;S.runTime=10;me.hurtPlayer(15,player);assert(S.armor===5&&S.health===100&&S.lastHurt===10&&hurts.at(-1)===true,'Armor soaks up a hit it can cover');
  me.hurtPlayer(25,player);assert(S.armor===0&&S.health===80&&hurts.at(-1)===false,'and passes the rest on to health');
  me.hurtPlayer(80,player);assert(S.health===0&&over===1,'A fatal hit ends the run');
  // Recovery: health 6 s after the last hit; Nano Shield armor after its rank's delay.
  S.health=50;S.lastHurt=0;S.runTime=5;me.recover(1,true);assert.equal(S.health,50,'Nothing comes back within 6 s of a hit');
  S.runTime=7;me.recover(1,true);assert.equal(S.health,61,'then 11 health a second');
  S.armorTier=2;S.armorMax=50;S.armor=10;S.lastHurt=0;const rank=ARMOR.nanoRanks[0];S.runTime=rank.regenDelay+1;me.recover(1,true);
  assert.equal(S.armor,10+rank.regenRate,'Nano Shield armor regrows after its delay');
  me.recover(1,false);assert.equal(S.armor,10+rank.regenRate,'but not while play is paused');
  S.armorTier=1;S.armor=10;me.recover(1,true);assert.equal(S.armor,10,'Plain armor never regrows');
  console.log('PASS: shared player run — game.js keeps none of the run’s 25 values as variables; a fresh run starts as before; on flat ground the player walks 3.6, sprints 5.6, aims at 2.1 and strides 30% faster, diagonals and half-pushed sticks behave, footsteps keep time, a jump lands, armor soaks hits before health, a fatal hit ends the run, and health and Nano Shield armor recover on time.');
}

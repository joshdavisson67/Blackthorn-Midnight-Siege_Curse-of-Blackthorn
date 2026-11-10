#!/usr/bin/env node
// Frame logic (v198): how long the game's own per-frame work takes, with rendering
// stubbed out by the test harness. Headless frame times are dominated by software
// rendering (seconds a frame), so a JavaScript change that costs a fraction of a
// millisecond cannot be seen there; this shows it directly. Randomness is seeded, so
// two builds play the same frames.
//
//   node scripts/frame-logic.mjs                         # the mansion: a 32-zombie fight
//   node scripts/frame-logic.mjs <other checkout>
//   node scripts/frame-logic.mjs --mode tide [<checkout>]  # Dead Tide (v206): see below
//
// Dead Tide (--mode tide): the player's own frames, walking a circle on the beach with the
// Glock, firing four times a second, with the shore held (v206) so builds before and after
// the dead play the same frames. --mode tide-fight (v206): the 45-enemy stress test, a mixed
// ring of unkillable dead around an unkillable player who keeps firing (builds with the dead
// only). A checkout from before v206 has no Dead Tide harness of its own, so this checkout's
// tests/tide-harness.mjs plays its game.
//
// Prints the median and the fastest of five 300-frame samples, in ms per frame.
import {existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const here=resolve(dirname(fileURLToPath(import.meta.url)),'..'),argv=process.argv.slice(2);
const mi=argv.indexOf('--mode'),mode=mi>=0?argv[mi+1]:'mansion',repo=resolve(argv.filter((a,i)=>mi<0||i!==mi&&i!==mi+1)[0]||here);
if(!['mansion','tide','tide-fight'].includes(mode)){console.error('--mode is mansion, tide or tide-fight');process.exit(2);}
let seed=1;Math.random=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const log=console.log;
let frames;
if(mode==='mansion'){
  const h=await import(pathToFileURL(resolve(repo,'tests/harness.mjs')).href),qa=h.qa;frames=h.frames;console.log=()=>{};
  qa.start();qa.holdSpawns();qa.setHealth(1e9);qa.setPlayer(0,22);qa.setAim(0,-.05);
  for(let i=0;i<32;i++){const a=i/32*Math.PI*2,r=9+(i%4)*1.6;const e=qa.makeZombie(Math.sin(a)*r,22+Math.cos(a)*r*.55,i%8===3,i%8===7,false,0,i%8===5);e.hp=e.maxHp=1e9;}
  frames(120);
}else{
  const own=resolve(repo,'tests/tide-harness.mjs');if(!existsSync(own))process.env.BLACKTHORN_GAME_DIR=resolve(repo,'public/game');
  const h=await import(pathToFileURL(existsSync(own)?own:resolve(here,'tests/tide-harness.mjs')).href),qa=h.qa,step=h.frames;console.log=()=>{};
  h.entry()();await Promise.resolve();
  if(qa.get().mode!=='playing')throw new Error('Dead Tide did not start');
  if(qa.get().shore)qa.get().shore.target=0;
  if(mode==='tide-fight'){const g=qa.get();if(!g.spawnKind)throw new Error('This build has no dead');g.run.health=g.run.maxHealth=1e9;qa.setPlayer(0,40);
    const kinds=['walker','walker','walker','brute','walker','feral','walker','dog','walker','walker','ashfang','walker','feral','walker','brute','walker'];
    for(let i=0;i<45;i++){const a=i/45*Math.PI*2,r=9+(i%4)*1.6;const e=g.spawnKind(kinds[i%kinds.length],Math.sin(a)*r,40+Math.cos(a)*r*.55,0);e.hp=e.maxHp=1e9;}}
  let n=0;const start=qa.get().player.clone();qa.setPlayer(start.x,start.z);qa.setKeys(mode==='tide'?['KeyW']:[]);
  frames=count=>{for(let i=0;i<count;i++,n++){qa.setAim(n/600*Math.PI*2,-.05);if(n%15===0){qa.get().run.inventory.glock.ammo=13;qa.shoot();}step(1);}};
  frames(120);const g=qa.get();
  if(g.player.distanceTo(start)<1&&mode==='tide'||!g.effects.length&&mode==='tide')throw new Error('Dead Tide frame logic: the player should be walking and firing');
  if(mode==='tide-fight'&&g.zombies.filter(e=>!e.dead).length!==45)throw new Error('the stress test needs 45 dead');
}
const samples=[];for(let k=0;k<5;k++){const t=performance.now();frames(300);samples.push((performance.now()-t)/300);}
samples.sort((a,b)=>a-b);
log(JSON.stringify({repo,mode,medianMs:+samples[2].toFixed(3),fastestMs:+samples[0].toFixed(3),samples:samples.map(x=>+x.toFixed(3))}));
process.exit(0);

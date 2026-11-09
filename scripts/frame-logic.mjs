#!/usr/bin/env node
// Frame logic (v198): how long the game's own per-frame work takes in a 32-zombie
// fight, with rendering stubbed out by the test harness. Headless frame times are
// dominated by software rendering (seconds a frame), so a JavaScript change that
// costs a fraction of a millisecond cannot be seen there; this shows it directly.
// Randomness is seeded, so two builds play the same fight.
//
//   node scripts/frame-logic.mjs                 # this checkout
//   node scripts/frame-logic.mjs <other checkout>
//
// Prints the median and the fastest of five 300-frame samples, in ms per frame.
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const repo=resolve(process.argv[2]||resolve(dirname(fileURLToPath(import.meta.url)),'..'));
let seed=1;Math.random=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const {qa,frames}=await import(pathToFileURL(resolve(repo,'tests/harness.mjs')).href);
const log=console.log;console.log=()=>{};
qa.start();qa.holdSpawns();qa.setHealth(1e9);qa.setPlayer(0,22);qa.setAim(0,-.05);
for(let i=0;i<32;i++){const a=i/32*Math.PI*2,r=9+(i%4)*1.6;const e=qa.makeZombie(Math.sin(a)*r,22+Math.cos(a)*r*.55,i%8===3,i%8===7,false,0,i%8===5);e.hp=e.maxHp=1e9;}
frames(120);
const samples=[];for(let k=0;k<5;k++){const t=performance.now();frames(300);samples.push((performance.now()-t)/300);}
samples.sort((a,b)=>a-b);
log(JSON.stringify({repo,medianMs:+samples[2].toFixed(3),fastestMs:+samples[0].toFixed(3),samples:samples.map(x=>+x.toFixed(3))}));
process.exit(0);

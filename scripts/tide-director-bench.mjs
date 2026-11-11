#!/usr/bin/env node
// The threat director's own cost in play (v209): time inside the shore's update at The
// Apocalypse (460 kills) on the south beach, the island culled every 5 s so the shore keeps
// sending, for 120 s of play. Prints the slowest updates (ms, how many came ashore, which kinds:
// B brute, L lurker, D dog, F feral, w walker), how many took over 16 ms, and the averages.
// The frame-logic fight holds the shore, so this is where the director's work is measured.
//
//   node scripts/tide-director-bench.mjs [<checkout>]   (a checkout from v206 on)
import {resolve,dirname} from 'node:path';import {pathToFileURL,fileURLToPath} from 'node:url';
const repo=resolve(process.argv[2]||resolve(dirname(fileURLToPath(import.meta.url)),'..')),h=await import(pathToFileURL(resolve(repo,'tests/tide-harness.mjs')).href);
const T=await import(pathToFileURL(resolve(repo,'public/game/three.module.js')).href),{qa,frames,entry}=h,G=()=>qa.get(),log=console.log;console.log=()=>{};
frames(30);for(let i=0;i<6;i++)await Promise.resolve();entry()();await Promise.resolve();
qa.resetRun();await Promise.resolve();G().run.kills=460;G().run.health=1e9;qa.setPlayer(0,40);qa.setSeed?.(209);
const s=G().shore,u=s.update.bind(s),Z=G().zombies;let ms=0,calls=0,worst=0;const top=[];s.update=dt=>{const n=Z.length,t=performance.now();u(dt);const d=performance.now()-t;ms+=d;calls++;worst=Math.max(worst,d);top.push([+d.toFixed(1),Z.length-n,Z.slice(n).map(e=>e.brute?"B":e.lurker?"L":e.dog?"D":e.feral?"F":"w").join("")]);};
const born=new Set();
for(let i=0;i<60*120;i++){frames(1);G().run.health=1e9;for(const e of G().zombies)born.add(e);
  if(i%300===299)for(const e of G().zombies)if(!e.dead)G().combat.damageEnemy(e,1e9,false,{part:'torso',direction:new T.Vector3(0,0,1),source:'glock'});}
top.sort((a,b)=>b[0]-a[0]);const spawnFrames=top.filter(x=>x[1]>0);log(JSON.stringify({top:top.slice(0,8),over16:top.filter(x=>x[0]>16).length,perSpawn:+(spawnFrames.reduce((a,x)=>a+x[0],0)/spawnFrames.reduce((a,x)=>a+x[1],0)).toFixed(2)}));log(JSON.stringify({repo,arrivals:born.size,msPerFrame:+(ms/calls).toFixed(4),msPerArrival:+(ms/born.size).toFixed(3),worstMs:+worst.toFixed(2)}));process.exit(0);

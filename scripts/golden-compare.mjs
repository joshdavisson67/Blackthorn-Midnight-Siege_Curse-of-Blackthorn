#!/usr/bin/env node
// Golden-trace comparison (v205), for a change that adds something rather than only moving
// code. scripts/golden-trace.mjs output from two builds is compared scenario by scenario
// and channel by channel: births, the player, enemies, pickups, the run, the session, the
// weapons in hand, the screen, the view in hand, the page and the sound.
//
//   node scripts/golden-compare.mjs before.json after.json
//
// When the older trace predates the katana (v204 and earlier) its own additions are set
// aside: its slot in the inventory and its flag among the guns in hand (`arms`), its stand's
// row in the station tour and its entry in each row's run digest, and its own scenario.
// The screen, view and page are hashed whole, so anything new in the scene or on the page
// changes them; the other channels must match exactly.
import {readFileSync} from 'node:fs';
const [before,after]=process.argv.slice(2).map(f=>JSON.parse(readFileSync(f,'utf8')));
if(!before||!after){console.error('usage: node scripts/golden-compare.mjs before.json after.json');process.exit(2);}
const CHANNELS=['player','zombies','pickups','run','session','arms','screen','view','dom','audio'];
const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
const katanaNew=!before.katana&&!!after.katana;
// arms: 12 values, then 5 for each of the seven inventory slots (the katana's is the last),
// then one flag for each weapon in hand (the katana's is the last).
const arms=a=>{if(!katanaNew)return a;const k=[...a];k.splice(12+6*5,5);k.pop();return k;};
let failures=0;
console.log(['scenario','samples','births',...CHANNELS].join('\t'));
for(const name of Object.keys(before)){
  if(name==='stationTour'||name==='boot')continue;
  const a=before[name],b=after[name];if(!b){console.log(name,'missing in the second trace');failures++;continue;}
  const row=[name,a.frames.length,same(a.births,b.births)?'=':'≠'];
  for(const ch of CHANNELS){let diff=0;for(let i=0;i<a.frames.length;i++){const x=a.frames[i][ch],y=ch==='arms'?arms(b.frames[i][ch]):b.frames[i][ch];if(!same(x,y))diff++;}row.push(diff);
    if(diff&&!['screen','view','dom'].includes(ch))failures++;}
  if(row[2]!=='=')failures++;
  console.log(row.join('\t'));
}
const tour=katanaNew?after.stationTour.filter(r=>r[2]!=='katana'):after.stationTour;
const clean=r=>katanaNew?JSON.stringify(r).replace(/,"katana",[01],0,0,0,\d+/g,''):JSON.stringify(r);
const differing=before.stationTour.map((r,i)=>JSON.stringify(r)===clean(tour[i])?null:`${i} ${r[3]}`).filter(Boolean);
console.log(`station tour: ${before.stationTour.length} rows; ${before.stationTour.length-differing.length} identical${katanaNew?` (the katana stand's ${after.stationTour.length-tour.length} row set aside)`:''}${differing.length?'; different: '+differing.join(', '):''}`);
if(katanaNew)console.log('the katana scenario is new in the second trace');
console.log(failures?`${failures} gameplay channel difference(s)`:'every gameplay channel matches (screen, view and page hashes aside)');

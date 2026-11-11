#!/usr/bin/env node
// Pictures of Dead Tide's island (v210 tooling): the game itself, loaded in headless Chromium,
// photographed from named viewpoints with the HUD hidden and the shore held (no dead). For
// looking at a layout before a person does; software rendering, so judge shapes and placing,
// not frame rates, and expect its colours to be close to a real GPU's, not identical.
//
//   node scripts/tide-shots.mjs <out dir> [--only name,name] [--hud]
//
// Each view is [name, eye x, eye y above the ground (or absolute with a leading '='), eye z,
// looking at x, y, z]. Add views here as the map grows.
import http from 'node:http';
import {cpSync,mkdtempSync,readFileSync,appendFileSync,existsSync,statSync,rmSync,mkdirSync} from 'node:fs';
import {join,extname,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),argv=process.argv.slice(2),outDir=resolve(argv.find(a=>!a.startsWith('--'))||join(root,'.tier/shots'));
const only=(()=>{const i=argv.indexOf('--only');return i>=0?argv[i+1].split(','):null;})(),hud=argv.includes('--hud');
const {islandSites,ISLAND}=await import('../public/game/island.mjs'),S=islandSites().sites,H=ISLAND.hill;
const VIEWS=[
  ['overview-south',0,'=70',135,0,6,0],['overview-north-east',95,'=60',-95,0,6,0],['overview-west',-135,'=55',10,0,6,0],['overview-top',0,'=175',1,0,0,0],
  ['spawn',ISLAND.spawn.x,1.68,ISLAND.spawn.z,H.x,10,H.z],
  ['summit-compound',H.x+8,1.68,H.z+8,H.x-3,1.4,H.z-3],['summit-tent',S.tent.x+2,1.68,S.tent.z+8,S.tent.x,1.6,S.tent.z],
  ['summit-view-north-east',H.x,1.68,H.z,S.bunker.x,-6,S.bunker.z],['summit-view-south-west',H.x,1.68,H.z,S.camp.x,-6,S.camp.z],
  ['summit-view-west',H.x,1.68,H.z,S.wreck.x,-10,S.wreck.z],['summit-view-south-east',H.x,1.68,H.z,S.cove.x,-8,S.cove.z],
  ['bunker',S.bunker.x-9,1.68,S.bunker.z+9,S.bunker.x,1.8,S.bunker.z],['ruin',S.ruin.x+10,2.4,S.ruin.z+10,S.ruin.x,1.6,S.ruin.z],
  ['wreck',S.wreck.x+19,1.68,S.wreck.z+6,S.wreck.x,1.5,S.wreck.z],['camp',S.camp.x+11,3.2,S.camp.z-9,S.camp.x,.8,S.camp.z],
  ['dock',S.dock.x-7,1.68,S.dock.z-13,S.dock.x+1,.8,S.dock.z+3],['cove',S.cove.x+9,1.68,S.cove.z+9,S.cove.x,1.4,S.cove.z],
  ['forge',S.forge.x-10,1.68,S.forge.z+5,S.forge.x,1.4,S.forge.z],['north-beach',S.north.x+14,1.68,S.north.z+8,S.north.x-12,1,S.north.z-4],
  ['wash',-9,1.68,6,-22,-1,30]
];
async function loadPlaywright(){for(const spec of [process.env.PLAYWRIGHT_MODULE,'playwright','/opt/npm-tools/node_modules/playwright/index.mjs'].filter(Boolean)){try{return await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);}catch{}}
  console.error('Playwright is not installed.');process.exit(2);}
const stage=mkdtempSync(join(tmpdir(),'blackthorn-shots-'));cpSync(resolve(root,'public/game'),stage,{recursive:true});
appendFileSync(join(stage,'tide.mjs'),`
// ---- tide-shots hook (staged copy only) ----
{const orig=renderer.render.bind(renderer),fogDensity=scene.fog.density,hemi=hemisphere.intensity;
 // Overviews (an absolute eye height) thin the fog and lift the sky's light, to show the whole island's shape.
 renderer.render=function(s,c){const p=window.__shot;if(p&&c===camera){gunRoot.visible=false;c.position.set(p.x,p.y,p.z);c.lookAt(p.tx,p.ty,p.tz);c.fov=p.fov||70;c.updateProjectionMatrix();c.updateMatrixWorld(true);sky.position.copy(c.position);scene.fog.density=p.far?.0022:fogDensity;hemisphere.intensity=p.far?2.2:hemi;}return orig(s,c);};
 window.__shots={
   start(hud){Object.defineProperty(document,'pointerLockElement',{configurable:true,get:()=>canvas});finishTheDead();shore.target=0;session.mode='playing';session.pointer=true;keys.clear();
     $('menu').classList.add('hidden');$('pause').classList.add('hidden');if(hud)$('hud').classList.remove('hidden');else $('hud').classList.add('hidden');
     display.renderScale.reset('high');display.renderScale.sample=()=>{};display.resize();},
   view(x,y,z,tx,ty,tz){const g=groundHeight(x,z),eye=typeof y==='string'?Number(y.slice(1)):g+y,tg=groundHeight(tx,tz);
     player.set(ISLAND.spawn.x,groundHeight(ISLAND.spawn.x,ISLAND.spawn.z),ISLAND.spawn.z);runState.grounded=true;runState.jumpV=0;
     window.__shot={x,y:eye,z,tx,ty:typeof y==='string'?ty:Math.max(tg,0)+ty,tz,far:typeof y==='string'};}
 };}
`);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((q,r)=>{const f=join(stage,decodeURIComponent(q.url.split('?')[0]));if(!existsSync(f)||statSync(f).isDirectory()){r.writeHead(404);r.end();return;}r.writeHead(200,{'content-type':types[extname(f)]||'application/octet-stream','cache-control':'no-store'});r.end(readFileSync(f));}).listen(0);
await new Promise(r=>server.once('listening',r));
const {chromium}=await loadPlaywright(),browser=await chromium.launch({args:['--use-angle=gl-egl','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('blackthorn-quality','high');localStorage.setItem('blackthorn-touch-controls','off');}catch{}});
const tab=await ctx.newPage();tab.setDefaultTimeout(900000);const errors=[];tab.on('pageerror',e=>errors.push(e.message));
await tab.goto(`http://localhost:${server.address().port}/tide.html`,{waitUntil:'load'});
await tab.waitForFunction(()=>document.getElementById('loading')?.classList.contains('hidden'),null,{timeout:900000});
const err=await tab.evaluate(()=>document.getElementById('errorDetails')?.textContent||'');if(err)throw new Error('Load error: '+err);
await tab.evaluate(h=>window.__shots.start(h),hud);
const frames=n=>tab.evaluate(n=>new Promise(res=>{let k=0;const tick=()=>{if(k++<n)requestAnimationFrame(tick);else res();};requestAnimationFrame(tick);}),n);
mkdirSync(outDir,{recursive:true});
for(const v of VIEWS){if(only&&!only.includes(v[0]))continue;await tab.evaluate(v=>window.__shots.view(...v.slice(1)),v);await frames(3);
  const file=join(outDir,v[0]+'.png');await tab.screenshot({path:file});console.log(file);}
if(errors.length)console.error('page errors:',errors);
await browser.close();server.close();rmSync(stage,{recursive:true,force:true});process.exit(errors.length?1:0);

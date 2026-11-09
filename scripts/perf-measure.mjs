#!/usr/bin/env node
// Blackthorn performance probe (v193). Loads one page of public/game in headless
// Chromium and records what the Dead Tide plan promises to keep unchanged for the
// mansion: transferred bytes, time to playable, compiled shader programs, memory,
// draw calls and triangles at fixed camera views, and frame times both in those
// views and in a 32-zombie fight (the mansion's live-enemy limit).
//
//   node scripts/perf-measure.mjs                      # the mansion (index.html)
//   node scripts/perf-measure.mjs --page modes.html    # the mode picker
//   node scripts/perf-measure.mjs --out perf/v193-siege.json --label v193
//   node scripts/perf-measure.mjs --game ../old-checkout/public/game   # another build
//   node scripts/perf-measure.mjs --load-only                          # time to playable only
//
// Headless Chromium usually renders in software, so frame times here are only
// comparable with other runs on the same machine; use them to spot regressions,
// not as real-world FPS. Byte, request, shader, geometry and draw-call counts are
// deterministic and comparable anywhere.
import http from 'node:http';
import {cpSync,mkdtempSync,readFileSync,writeFileSync,appendFileSync,existsSync,statSync,rmSync,mkdirSync} from 'node:fs';
import {join,extname,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=(name,fallback)=>{const i=process.argv.indexOf(`--${name}`);return i>0?process.argv[i+1]:fallback;};
const page=arg('page','index.html'),label=arg('label',''),out=arg('out',''),gameDir=resolve(arg('game',join(root,'public/game')));
const log=m=>process.stderr.write(`[perf ${((Date.now()-started)/1000).toFixed(0)}s] ${m}\n`),started=Date.now();
const mansion=page==='index.html';

async function loadPlaywright(){
  for(const spec of [process.env.PLAYWRIGHT_MODULE,'playwright','/opt/npm-tools/node_modules/playwright/index.mjs'].filter(Boolean)){
    try{return await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);}catch{}
  }
  console.error('Playwright is not installed. Run `npm i -D playwright && npx playwright install chromium`, or set PLAYWRIGHT_MODULE.');process.exit(2);
}

// ---- Stage a copy of the game; the mansion gets a measuring hook ---------------------
const stage=mkdtempSync(join(tmpdir(),'blackthorn-perf-'));
cpSync(gameDir,stage,{recursive:true});
if(mansion)appendFileSync(join(stage,'game.js'),`
// ---- perf-measure hook (staged copy only) ----
{const orig=renderer.render.bind(renderer);let cpu=0;
 renderer.info.autoReset=false;
 renderer.render=function(s,c){const p=window.__perfPhoto;if(p&&c===camera){gunRoot.visible=false;c.position.set(p.x,p.y,p.z);c.rotation.set(p.pitch,p.yaw,0,'YXZ');c.fov=62;c.updateProjectionMatrix();c.updateMatrixWorld(true);}
   const t=performance.now();const r=orig(s,c);cpu+=performance.now()-t;return r;};
 window.__perf={
   fixRes(){renderScale.reset('high');renderScale.sample=()=>{};resize();},
   stats(){const i=renderer.info;return {calls:i.render.calls,triangles:i.render.triangles,cpu,programs:i.programs?.length??0,geometries:i.memory.geometries,textures:i.memory.textures};},
   pause(){hasMouseLock=()=>true;resetRun({capture:false});spawnTimer=Infinity;toSpawn=0;for(const z of zombies)z.group.visible=false;mode='paused';},
   view(eye,target){const dx=target[0]-eye[0],dy=target[1]-eye[1],dz=target[2]-eye[2];player.set(eye[0],eye[1]>3.5?4.3:0,eye[2]);window.__perfPhoto={x:eye[0],y:eye[1],z:eye[2],yaw:Math.atan2(-dx,-dz),pitch:Math.atan2(dy,Math.hypot(dx,dz))};},
   fight(n){window.__perfPhoto=null;hasMouseLock=()=>true;resetRun({capture:false});mode='playing';spawnTimer=Infinity;toSpawn=0;
     // v198 moved the run's values into runState; older builds keep them as variables.
     player.set(0,0,22);if(typeof runState==='object'){runState.feetY=0;runState.health=runState.maxHealth=1e9;}else{feetY=0;health=maxHealth=1e9;}lookYaw=0;lookPitch=-.05;
     const kinds=['walker','walker','walker','brute','walker','feral','walker','dog','walker','walker','ash','walker','feral','walker','brute','walker'];
     for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=9+(i%4)*1.6,k=kinds[i%kinds.length];
       makeZombie(Math.sin(a)*r,22+Math.cos(a)*r*.55,k==='brute',k==='dog'||k==='ash',k==='ash',0,k==='feral');}
     return zombies.filter(e=>!e.dead).length;},
   alive(){return zombies.filter(e=>!e.dead).length;}
 };}
`);

// ---- Static server that counts every byte it sends ----------------------------------
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.txt':'text/plain'};
const served=[];let t0=0;
const server=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=join(stage,p);
  if(!existsSync(f)||statSync(f).isDirectory()){r.writeHead(404);r.end();served.push({path:p,bytes:0,at:Date.now()-t0,status:404});return;}
  const body=readFileSync(f);r.writeHead(200,{'content-type':types[extname(f)]||'application/octet-stream','cache-control':'no-store'});r.end(body);served.push({path:p,bytes:body.length,at:Date.now()-t0,status:200});}).listen(0);
await new Promise(r=>server.once('listening',r));

const {chromium}=await loadPlaywright();
const browser=await chromium.launch({args:['--use-angle=gl-egl','--ignore-gpu-blocklist','--enable-precise-memory-info']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('blackthorn-quality','high');localStorage.setItem('blackthorn-touch-controls','off');}catch{}});
const tab=await ctx.newPage();tab.setDefaultTimeout(900000);const errors=[];tab.on('pageerror',e=>errors.push(e.message));
const q=(fn,a)=>tab.evaluate(fn,a);
// Frame samples are kept small: software rendering can take seconds per frame.
const VIEW_FRAMES=Number(arg('view-frames',8)),FIGHT_FRAMES=Number(arg('fight-frames',40));
const frames=n=>q(n=>new Promise(res=>{const d=[];let last=performance.now(),k=0;const tick=()=>{const now=performance.now();if(k++)d.push(now-last);last=now;if(k<=n)requestAnimationFrame(tick);else res(d);};requestAnimationFrame(tick);}),n);
const summary=d=>{const s=[...d].sort((a,b)=>a-b),avg=d.reduce((a,b)=>a+b,0)/d.length;return {avgMs:+avg.toFixed(2),p95Ms:+s[Math.floor(s.length*.95)].toFixed(2),maxMs:+s.at(-1).toFixed(2)};};
const heap=()=>q(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576*10)/10:null);
const bytesUpTo=ms=>{const list=served.filter(s=>s.at<=ms&&s.status===200);return {requests:list.length,kb:Math.round(list.reduce((a,s)=>a+s.bytes,0)/1024)};};

t0=Date.now();
await tab.goto(`http://localhost:${server.address().port}/${page}`,{waitUntil:'load'});
const result={label,page,date:new Date().toISOString(),note:'Headless Chromium; frame times are relative to this machine only.'};
if(mansion){
  await tab.waitForFunction(()=>document.getElementById('loading')?.classList.contains('hidden'),null,{timeout:900000});
  const playable=Date.now()-t0;log(`playable after ${(playable/1000).toFixed(1)}s`);await new Promise(r=>setTimeout(r,1500));
  const err=await q(()=>document.getElementById('errorDetails')?.textContent||'');if(err)throw new Error('Load error: '+err);
  result.load={timeToPlayableMs:playable,untilPlayable:bytesUpTo(playable),total:bytesUpTo(Date.now()-t0),heapMB:await heap()};
  if(process.argv.includes('--load-only')){result.errors=errors;await browser.close();server.close();rmSync(stage,{recursive:true,force:true});console.log(JSON.stringify(result));process.exit(0);}
  await q(()=>window.__perf.fixRes());
  const s0=await q(()=>window.__perf.stats());result.gpu={shaderPrograms:s0.programs,geometries:s0.geometries,textures:s0.textures};
  // Fixed views with the world paused and no enemies.
  await q(()=>window.__perf.pause());
  const views=[['hall',[0,1.7,10.5],[0,2.2,-6]],['ballroom',[-17,1.7,8],[-36,1.6,-6]],['rotunda',[8,1.7,-15],[-4,2.5,-30]],['chapel',[-28,1.7,-62],[-28,2,-83]],['upstairs-west',[-15,6,-4],[-40,5.4,-10]],['courtyard',[0,1.7,30],[0,3,0]]];
  result.views={};
  for(const [name,eye,target] of views){
    await q(([e,t])=>window.__perf.view(e,t),[eye,target]);await frames(3);
    const a=await q(()=>window.__perf.stats()),d=await frames(VIEW_FRAMES),b=await q(()=>window.__perf.stats());
    result.views[name]={drawCalls:Math.round((b.calls-a.calls)/VIEW_FRAMES),trianglesK:Math.round((b.triangles-a.triangles)/VIEW_FRAMES/1000),renderCpuMs:+((b.cpu-a.cpu)/VIEW_FRAMES).toFixed(2),...summary(d)};log(`view ${name}: ${JSON.stringify(result.views[name])}`);
  }
  // A 32-zombie fight in the front courtyard: the mansion's live-enemy cap.
  const alive=await q(n=>window.__perf.fight(n),32);
  const hitch=await frames(10);await frames(5);
  const a=await q(()=>window.__perf.stats()),d=await frames(FIGHT_FRAMES),b=await q(()=>window.__perf.stats());
  result.fight={enemies:alive,stillAlive:await q(()=>window.__perf.alive()),firstFramesMaxMs:+Math.max(...hitch).toFixed(2),drawCalls:Math.round((b.calls-a.calls)/FIGHT_FRAMES),trianglesK:Math.round((b.triangles-a.triangles)/FIGHT_FRAMES/1000),renderCpuMs:+((b.cpu-a.cpu)/FIGHT_FRAMES).toFixed(2),...summary(d),heapMB:await heap()};log(`fight: ${JSON.stringify(result.fight)}`);
  const s1=await q(()=>window.__perf.stats());result.gpu.shaderProgramsAfterFight=s1.programs;
}else{
  const loaded=Date.now()-t0;await new Promise(r=>setTimeout(r,800));
  result.load={timeToInteractiveMs:loaded,total:bytesUpTo(Date.now()-t0),heapMB:await heap(),files:served.filter(s=>s.status===200).map(s=>s.path)};
  result.webglContexts=await q(()=>[...document.querySelectorAll('canvas')].filter(c=>{try{return !!(c.__gl);}catch{return false;}}).length);
  result.loadsGameCode=served.some(s=>/three\.module|game\.js|boot\.js/.test(s.path));
  result.animation=summary(await frames(120));
}
result.errors=errors;
await browser.close();server.close();rmSync(stage,{recursive:true,force:true});
const text=JSON.stringify(result,null,2);
if(out){mkdirSync(dirname(resolve(root,out)),{recursive:true});writeFileSync(resolve(root,out),text+'\n');}
console.log(text);
if(errors.length)process.exitCode=1;

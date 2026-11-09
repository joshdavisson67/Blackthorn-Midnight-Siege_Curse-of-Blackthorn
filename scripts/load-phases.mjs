#!/usr/bin/env node
// Load phases (v197): times where the mansion's loading goes, in headless Chromium.
// A total time-to-playable difference between two builds can then be traced to its
// phase:
//   modules  from navigation to the first line of game.js (every module fetched and run)
//   world    building the estate, enemies, guns and HUD (the rest of game.js's setup)
//   shaders  prepareRendering: compiling every shader and drawing the first frame
// JavaScript changes show up in the first two; the third is the same work for any build
// with the same shader programs, and under software rendering it varies by seconds.
//
//   node scripts/load-phases.mjs [--game <public/game dir>] [--label name]
import http from 'node:http';
import {cpSync,mkdtempSync,readFileSync,writeFileSync,existsSync,statSync,rmSync} from 'node:fs';
import {join,extname,resolve,dirname} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const arg=(name,fallback)=>{const i=process.argv.indexOf(`--${name}`);return i>0?process.argv[i+1]:fallback;};
const dir=resolve(arg('game',join(root,'public/game'))),label=arg('label','');
async function loadPlaywright(){
  for(const spec of [process.env.PLAYWRIGHT_MODULE,'playwright','/opt/npm-tools/node_modules/playwright/index.mjs'].filter(Boolean)){
    try{return await import(spec.startsWith('/')?pathToFileURL(spec).href:spec);}catch{}
  }
  console.error('Playwright is not installed. Run `npm i -D playwright && npx playwright install chromium`, or set PLAYWRIGHT_MODULE.');process.exit(2);
}
// Stage a copy with three timestamps added; the source is untouched.
const stage=mkdtempSync(join(tmpdir(),'blackthorn-phases-'));cpSync(dir,stage,{recursive:true});
// v201 moved the prepared flag into display.mjs; every build still awaits prepareRendering() once.
let game=readFileSync(join(stage,'game.js'),'utf8');const anchor='await prepareRendering();';
if(game.split(anchor).length!==2)throw new Error('game.js no longer ends its setup with prepareRendering()');
game='window.__tTop=performance.now();\n'+game.replace(anchor,'window.__tWorld=performance.now();await prepareRendering();window.__tPrep=performance.now();');
writeFileSync(join(stage,'game.js'),game);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json'};
const server=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p==='/')p='/index.html';const f=join(stage,p);
  if(!existsSync(f)||statSync(f).isDirectory()){r.writeHead(404);r.end();return;}
  r.writeHead(200,{'content-type':types[extname(f)]||'application/octet-stream','cache-control':'no-store'});r.end(readFileSync(f));}).listen(0);
await new Promise(r=>server.once('listening',r));
const {chromium}=await loadPlaywright();
const browser=await chromium.launch({args:['--use-angle=gl-egl','--ignore-gpu-blocklist']});
const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1});
await ctx.addInitScript(()=>{try{localStorage.setItem('blackthorn-quality','high');localStorage.setItem('blackthorn-touch-controls','off');}catch{}});
const tab=await ctx.newPage();tab.setDefaultTimeout(900000);
await tab.goto(`http://localhost:${server.address().port}/index.html`,{waitUntil:'load'});
await tab.waitForFunction(()=>document.getElementById('loading')?.classList.contains('hidden'),null,{timeout:900000});
const t=await tab.evaluate(()=>({top:window.__tTop,world:window.__tWorld,prep:window.__tPrep}));
console.log(JSON.stringify({label,modulesMs:Math.round(t.top),worldMs:Math.round(t.world-t.top),shadersMs:Math.round(t.prep-t.world),totalMs:Math.round(t.prep)}));
await browser.close();server.close();rmSync(stage,{recursive:true,force:true});

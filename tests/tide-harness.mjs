// Dead Tide's test harness: tide.mjs, run in Node on the three.js stand-in and a parsed
// tide.html, with a `qa` hook appended to a staged copy. Moved out of tests/dead-tide.mjs
// so the measuring scripts can play Dead Tide too, as tests/harness.mjs lets them play
// the mansion (scripts/frame-logic.mjs --mode tide).
//
//   const {qa,frames,$,listeners,canvas,entry}=await import('./tide-harness.mjs');
//
// Math.random is seeded while the harness is loaded (impact marks and the like, made
// repeatable); `random` is the original, for a test to restore when it ends.
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {parseHTML} from 'linkedom';
import {writeThreeStub} from './qa-stub.mjs';

// BLACKTHORN_GAME_DIR plays another build's public/game with this harness (a checkout from
// before v206 has none of its own); the staged copy goes to .qa-tide here either way.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(process.env.BLACKTHORN_GAME_DIR||resolve(root,'public/game')),read=f=>readFileSync(resolve(game,f),'utf8');
// Every module tide.mjs imports, followed through their own imports.
const imports=f=>[...read(f).matchAll(/(?:^\s*(?:import|export)[^'"]*?from\s*|^\s*import\s*|import\(\s*)['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
function closure(...entries){const seen=new Set(),walk=f=>{if(seen.has(f))return;seen.add(f);if(/\.(m?js)$/.test(f))for(const g of imports(f))walk(g);};entries.forEach(walk);return seen;}

const qaDir=resolve(root,'.qa-tide');mkdirSync(qaDir,{recursive:true});writeThreeStub(qaDir);
for(const f of closure('tide.mjs'))if(f!=='three.module.js'&&f!=='tide.mjs')writeFileSync(resolve(qaDir,f),read(f));
writeFileSync(resolve(qaDir,'tide.mjs'),read('tide.mjs')+`
export const qa={tick,keys,resetRun,returnToMenu,shoot,reload,grenade,selectWeapon,hurtPlayer,openControls,closeControls,explode:p=>combat.explode(p),
  setKeys(list){keys.clear();for(const k of list)keys.add(k);},setAim(yaw,pitch){session.lookYaw=yaw;session.lookPitch=pitch;},
  setPlayer(x,z,y=groundHeight(x,z)){player.set(x,y,z);runState.grounded=true;runState.jumpV=0;},
  // v206 (golden trace): reseed the game's own generator so every scenario starts alike.
  setSeed(s){seed=s>>>0;},
  get(){return {mode:session.mode,pointer:session.pointer,player,run:runState,session,camera,island,zone,effects,firstPerson,gunRoot,renderer,scene,world,explosionFx,markPool,display,swing:typeof swing==='undefined'?undefined:swing,
    zombies,pickups,weaponRecoil,flash,grenadeThrow,keys,shore:typeof shore==='undefined'?undefined:shore,hunter:typeof hunter==='undefined'?undefined:hunter,routes:typeof routes==='undefined'?undefined:routes,
    updateEnemies:typeof updateEnemies==='undefined'?undefined:updateEnemies,spawnKind:typeof spawnKind==='undefined'?undefined:spawnKind,combat};}};`);
const {document,window:domWindow}=parseHTML(read('tide.html'));
for(const select of document.querySelectorAll('select'))Object.defineProperty(select,'value',{configurable:true,get(){return (select.querySelector('option[selected]')||select.querySelector('option'))?.getAttribute('value')||'';},set(value){for(const option of select.querySelectorAll('option'))option.toggleAttribute('selected',option.getAttribute('value')===String(value));}});
const ctx=new Proxy({createRadialGradient(){return {addColorStop(){}};},createLinearGradient(){return {addColorStop(){}};}},{get(o,k){return k in o?o[k]:(()=>{});},set(o,k,v){o[k]=v;return true;}});
domWindow.HTMLCanvasElement.prototype.getContext=()=>ctx;
const $=id=>document.getElementById(id),listeners={},windowEvents={},canvas=$('game');canvas.events={};canvas.addEventListener=(name,fn)=>{canvas.events[name]=fn;};
const acquire=()=>{document.pointerLockElement=canvas;listeners.pointerlockchange?.();return Promise.resolve();};canvas.requestPointerLock=acquire;
document.addEventListener=(name,fn)=>{listeners[name]=fn;};document.exitPointerLock=()=>{document.pointerLockElement=null;listeners.pointerlockchange?.();};
let enter=null;const storage=new Map();
globalThis.document=document;globalThis.window={addEventListener(name,fn){windowEvents[name]=fn;},Blackthorn:{ready(fn){enter=fn;}}};
Object.assign(globalThis,{devicePixelRatio:1,innerWidth:1280,innerHeight:720,requestAnimationFrame(){},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)}});
$('sound').checked=true;
// v206: seeded rather than a constant, as the mansion's harness is. A constant gave every
// three.js object the same uuid, which the batcher keys on (the dead's bodies merged wrongly).
export const random=Math.random;{let s=0x71de5;Math.random=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export const {qa}=await import(pathToFileURL(resolve(qaDir,'tide.mjs')).href);
let clock=performance.now();
export const frames=(n,step=1000/60)=>{for(let i=0;i<n;i++){clock+=step;qa.tick(clock);}};
// The page's "enter" callback (the title screen's start), once the island has loaded.
export const entry=()=>enter;
export {$,document,listeners,windowEvents,canvas,storage};

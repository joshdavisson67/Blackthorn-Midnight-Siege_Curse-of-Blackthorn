import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v193 (Dead Tide step 0): the mode picker is its own lightweight page. It must
// never load the 3D engine or any game code, and the mansion must load exactly as
// before: the only change there is a hidden "all modes" link that boot.js reveals
// when the player arrived from the picker.
export function verifyModePicker(){
  const game=resolve(dirname(fileURLToPath(import.meta.url)),'../public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  const picker=read('modes.html');
  // ---- Isolation -------------------------------------------------------------------------
  assert(!/<script[^>]+src=/i.test(picker),'The picker loads no external scripts');
  assert(!/type=["']module["']/i.test(picker)&&!/\bimport\s*\(|\bimport\s+[\w{*]/.test(picker),'and imports no modules');
  assert(!/three\.module|game\.js|boot\.js|\.mjs/.test(picker),'It never references the engine or any game module');
  assert(!/getContext\(\s*['"]webgl/i.test(picker)&&/getContext\('2d'\)/.test(picker),'It draws with a 2D canvas, never WebGL');
  // Everything it fetches exists and stays small.
  const refs=new Set([...picker.matchAll(/url\('([^')]+)'\)|src="([^"]+)"/g)].map(m=>m[1]||m[2]));
  assert(refs.size>=5,'Fonts, logo mask and wounds are referenced');
  let bytes=Buffer.byteLength(picker);
  for(const ref of refs){const f=resolve(game,ref);assert(existsSync(f),`The picker's ${ref} exists`);bytes+=statSync(f).size;}
  assert(bytes<160*1024,`The whole picker stays under 160 KB (${(bytes/1024).toFixed(1)} KB)`);
  assert(/<title>Blackthorn<\/title>/.test(picker));
  // ---- Navigation --------------------------------------------------------------------------
  assert(/<a class="half siege" id="siege" href="siege\.html"/.test(picker),'Midnight Siege opens siege.html');
  // v217: Dead Tide is no longer marked as a preview or in development; its button matches the island's own.
  assert(/<a class="half tide" id="tide" href="tide.html"/.test(picker)&&/Wade ashore/.test(picker),'Dead Tide opens with Wade ashore');
  assert(!/preview/i.test(picker.replace(/<script[\s\S]*?<\/script>/g,''))&&!/In development/i.test(picker),'No preview or in-development wording left on the picker');
  assert(!/aria-disabled|deny\(/.test(picker),'and is no longer refused');
  assert(/sessionStorage\.setItem\('blackthorn-from','modes'\)/.test(picker),'Launching remembers that the player came from the picker');
  for(const key of ['arrowleft','arrowright','enter','getGamepads','prefers-reduced-motion','visibilitychange'])assert(picker.includes(key),`The picker handles ${key}`);
  const siege=read('siege.html');
  assert(/http-equiv="refresh" content="0;url=index\.html"/.test(siege)&&/location\.replace\('index\.html'/.test(siege),'siege.html forwards to the mansion on the site');
  assert(!/boot\.js|game\.js|three/.test(siege),'and loads nothing itself');
  // ---- The mansion is unchanged apart from the hidden link -----------------------------------
  const index=read('index.html'),boot=read('boot.js');
  assert.deepEqual([...index.matchAll(/<script[^>]*src="([^"]+)"/g)].map(m=>m[1].split('?')[0]),['boot.js'],'The mansion still loads only boot.js');
  assert(/<button id="modesLink" class="textBtn hidden" hidden type="button">◂ ALL MODES<\/button>/.test(index),'Its modes link starts hidden');
  assert(/sessionStorage\.getItem\('blackthorn-from'\)==='modes'/.test(boot)&&/back\.hidden=false/.test(boot)&&/location\.href='modes\.html'/.test(boot),'boot.js reveals it only for players who came from the picker');
  assert(!/modes\.html/.test(read('game.js')),'The game itself knows nothing about the picker');
  console.log(`PASS: mode picker — a ${(bytes/1024).toFixed(0)} KB page with no engine, modules or WebGL; Midnight Siege via siege.html, Dead Tide via tide.html (Wade ashore, no preview wording); keyboard, gamepad, reduced motion and background pausing; the mansion still loads only boot.js, with a hidden link back for picker players.`);
}

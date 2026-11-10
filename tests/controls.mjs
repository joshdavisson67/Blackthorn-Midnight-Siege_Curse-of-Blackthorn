import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';

// v200 (Dead Tide step 1): the play session is a shared module. The mansion still
// plays identically (scripts/golden-trace.mjs pauses, resumes, captures the mouse,
// opens settings and both prompts, and returns to the menu); this test runs the
// session on a bare page with play actions of its own.
export async function verifyControls(){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  assert.deepEqual(imports('controls.mjs'),['three.module.js','touch-controls.mjs','weapon-stats.mjs'],'The session imports only three.js, the touch look speed and (v205) the weapon table, to keep a blade from aiming');
  const src=read('game.js');
  for(const name of ['requestPointer','pauseGame','resumeGame','captureAcquired','openSettings','askConfirm','touchLook','cycleWeapon','directControls'])assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  const lets=[...src.matchAll(/^let ([^;]*);/gm)].flatMap(m=>m[1].split(',').map(d=>d.split('=')[0].trim()));
  assert.deepEqual(['mode','pointer','mouseDown','aiming','lookYaw','lookPitch','capturePending','captureWanted','captureAttempt','captureTimer'].filter(n=>lets.includes(n)),[],'nor the session’s values as variables');
  assert(/const session=createSession\(\);/.test(src)&&/=createControls\(\{/.test(src)&&/playKey\(e\);/.test(src),'The mansion keeps its own menus first and hands the play keys on');

  // ---- A bare page with play actions of its own -----------------------------------------
  const ids=['pause','pauseTitle','pauseText','resume','restart','captureHelp','pauseMain','pauseSettings','pauseConfirm','settingsEyebrow','settingsBack','settingsMenu','settingsPause','confirmTitle','confirmText','confirmYes','confirmNo'];
  const bare=parseHTML(`<!doctype html><html><body>${ids.map(id=>`<button id="${id}" class="hidden"></button>`).join('')}<input id="sensitivity" value="1.5"><canvas id="game"></canvas></body></html>`).document;
  const $=id=>bare.getElementById(id),canvas=$('game'),saved=globalThis.document;
  let locked=null,lockResult=()=>Promise.resolve();
  Object.defineProperty(bare,'pointerLockElement',{configurable:true,get:()=>locked});bare.exitPointerLock=()=>{locked=null;};
  canvas.requestPointerLock=()=>lockResult();canvas.focus=()=>{};
  globalThis.document=bare;
  try{
    const {createSession,createControls,WEAPON_CYCLE}=await import('../.qa/controls.mjs');const {createRunState}=await import('../.qa/player.mjs');
    const S=createSession(),R=createRunState(),keys=new Set(),did=[];
    assert.deepEqual({mode:S.mode,pointer:S.pointer,lookYaw:S.lookYaw,captureAttempt:S.captureAttempt},{mode:'menu',pointer:false,lookYaw:0,captureAttempt:0},'A session starts on the menu');
    R.inventory=Object.fromEntries(WEAPON_CYCLE.map(k=>[k,{owned:k==='glock'||k==='smg'}]));
    let scheme='standard',zoom=0;const touch={enabled:false,active:false,reset(){},setActive(on){this.active=on;}};
    const C=createControls({page:{$,canvas,keys},session:S,state:R,
      act:{shoot:()=>did.push('shoot'),reload:()=>did.push('reload'),grenade:()=>did.push('grenade'),selectWeapon:k=>{did.push('select '+k);R.weapon=k;},zoomOf:()=>zoom,interact:()=>did.push('interact'),toggleFlashlight:()=>did.push('flashlight'),openEstateMap:()=>did.push('map'),initAudio(){},fitTouchStick(){}},
      ui:{get touchControls(){return touch;},controlScheme:{get scheme(){return scheme;},noteInput:k=>k}},
      hooks:{onPause(){},onPauseMenu(){},pauseSummary:()=>'Round 3 · 12 kills.',settingsEyebrow:from=>'YARD / '+from,settingsFromMenu(){},
        confirm:{restart:['Again?','Sure?','YES',()=>did.push('restart')],menu:['Leave?','Sure?','YES',()=>did.push('menu')]},lookBlocked:()=>false}});
    // Capturing the mouse: waiting, then playing once the browser locks it.
    S.mode='paused';C.requestPointer();
    assert(S.mode==='capturing'&&S.capturePending&&$('resume').disabled&&$('pauseTitle').textContent==='Locking your mouse…'&&!$('pause').classList.contains('hidden'),'Resume waits for the mouse lock');
    locked=canvas;C.onPointerLockChange();
    assert(S.mode==='playing'&&S.pointer&&!S.capturePending&&$('pause').classList.contains('hidden')&&!$('resume').disabled,'and play starts once the browser locks it');
    // Mouse look, scaled by sensitivity and slowed when aiming through a zoom.
    C.onMouseMove({movementX:100,movementY:-1000});
    assert(Math.abs(S.lookYaw+100*1.5*.002)<1e-12&&S.lookPitch===1.3,'Mouse look turns by the sensitivity and stops at the vertical limit');
    S.lookYaw=0;S.aiming=true;zoom=4;C.onMouseMove({movementX:100,movementY:0});assert(Math.abs(S.lookYaw+100*1.5*.002*.62/4)<1e-12,'and turns slower aiming through a 4× sight');S.aiming=false;
    // Fire and aim: one shot per press; the right button aims.
    C.onMouseDown({button:0});C.onMouseDown({button:0});C.onMouseDown({button:2});
    assert(did.filter(a=>a==='shoot').length===1&&S.mouseDown&&S.aiming,'A press fires once and the right button aims');
    C.onMouseUp({button:0});C.onMouseUp({button:2});assert(!S.mouseDown&&!S.aiming,'Releasing stops both');
    // Play keys.
    did.length=0;const key=(code,more={})=>C.playKey({code,preventDefault(){},...more});
    for(const code of ['KeyR','KeyG','KeyE','KeyF','Digit3'])key(code);key('KeyR',{repeat:true});
    assert.deepEqual(did,['reload','grenade','interact','flashlight','select smg'],'Each key does its job once, and a held key does not repeat it');
    assert(keys.has('KeyR')&&keys.has('Digit3'),'Held keys are tracked for movement');C.onKeyUp({code:'KeyR'});assert(!keys.has('KeyR'));
    key('Space');assert(R.jumpV===4.2&&!R.grounded,'Space jumps from the ground');R.jumpV=0;key('Space');assert.equal(R.jumpV,0,'but not again in the air');
    // Pausing: Escape, the summary from the mode, and the mouse let go.
    key('Escape');
    assert(S.mode==='paused'&&!S.pointer&&locked===null&&keys.size===0&&$('pauseText').textContent==='Round 3 · 12 kills. Click Resume to lock the mouse again.'&&!$('pause').classList.contains('hidden'),'Escape pauses with the mode’s summary and lets the mouse go');
    // Settings and the prompts.
    C.openSettings('menu');assert(!$('pauseSettings').classList.contains('hidden')&&$('settingsEyebrow').textContent==='YARD / menu'&&C.settingsOpen(),'Settings opens with the mode’s heading');C.closeSettings();assert(!C.settingsOpen()&&$('pause').classList.contains('hidden'),'and closing it returns to the title screen it came from');
    C.showPauseMenu();C.askConfirm('restart',$('restart'));assert(C.confirmOpen()&&$('confirmTitle').textContent==='Again?','A prompt asks first');C.cancelConfirm();assert(!C.confirmOpen()&&!did.includes('restart'));
    C.askConfirm('menu',$('restart'));C.acceptConfirm();assert(did.includes('menu'),'and acts on Yes');
    S.mode='dead';C.askConfirm('restart',$('restart'));assert(did.includes('restart')&&!C.confirmOpen(),'After a death it acts at once');
    // A refused lock, a hidden tab and lost focus.
    S.mode='paused';S.capturePending=false;lockResult=()=>Promise.reject(Object.assign(new Error('no'),{name:'NotAllowedError'}));C.resumeGame();await new Promise(r=>setTimeout(r,0));
    assert(S.mode==='paused'&&$('pauseTitle').textContent==='Let’s lock your mouse.'&&$('resume').textContent==='TRY MOUSE LOCK AGAIN →'&&!$('captureHelp').classList.contains('hidden'),'A refused lock explains itself and offers a retry');
    lockResult=()=>Promise.resolve();C.resumeGame();locked=canvas;C.onPointerLockChange();assert.equal(S.mode,'playing');
    bare.hidden=true;C.onVisibilityChange();bare.hidden=false;assert.equal(S.mode,'paused','A hidden tab pauses');
    C.resumeGame();locked=canvas;C.onPointerLockChange();C.onBlur();assert.equal(S.mode,'paused','So does losing focus');
    // Touch and controller play need no mouse lock and share the actions.
    scheme='touch';touch.enabled=true;C.resumeGame();assert(S.mode==='playing'&&!S.pointer&&touch.active,'Touch play starts without the mouse');
    did.length=0;C.touchActions.fireStart();C.touchActions.fireStart();C.touchActions.fireEnd();C.touchActions.nextWeapon();C.touchActions.aimToggle();
    assert.deepEqual(did,['shoot','select glock'],'Touch fires once per press and cycles to the next owned weapon');assert(S.aiming,'and toggles aim');
    scheme='controller';did.length=0;S.lookYaw=S.lookPitch=0;C.padActions.aim(false);C.padActions.previousWeapon();C.padActions.look(.1,-.2);
    assert(!S.aiming&&did[0]==='select smg'&&Math.abs(S.lookYaw-(-.1))<1e-9&&Math.abs(S.lookPitch-.2)<1e-9,'The controller aims, cycles back and looks');
    assert(C.padActions.used()===true&&C.directControls()&&C.padPlay(),'and counts as direct play');
  }finally{globalThis.document=saved;}
  console.log('PASS: shared play session — game.js keeps none of the session’s values or its capture, pause, settings, prompt and control code; on a bare page it waits for and takes the mouse lock, looks by sensitivity and sight, fires once per press, aims, runs every play key once, jumps from the ground only, pauses on Escape, a hidden tab or lost focus with the mode’s summary, opens settings and both prompts, explains a refused lock, and plays by touch and controller without the mouse.');
}

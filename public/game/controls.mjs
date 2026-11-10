import * as T from './three.module.js';
import {TOUCH} from './touch-controls.mjs?v=148';
import {weapons} from './weapon-stats.mjs?v=205';

// The play session (v200, Dead Tide step 1), for any mode: the session's own values
// (mode, mouse capture, look angles, trigger and aim); capturing the mouse, pausing
// and resuming; the pause menu's settings page and are-you-sure prompts; and the
// play controls for keyboard and mouse, touch and controller. Moved from game.js
// unchanged; scripts/golden-trace.mjs checks the mansion plays identically. A mode
// keeps its own menus and overlays (the mansion: the field guide, estate map, curse
// choice, changelog and leaderboard, and which of them a key or button reaches
// first) and passes the page, its play actions and its own pause wording (hooks);
// the README's version 200 section lists every field.
// The order touch and controller players cycle through the weapons they own.
export const WEAPON_CYCLE=['glock','shotgun','smg','lmg','bushmaster','rifle','katana'];
export function createSession(){
  return {mode:'menu',pointer:false,mouseDown:false,aiming:false,lookYaw:0,lookPitch:0,capturePending:false,captureWanted:false,captureAttempt:0,captureTimer:null};
}
export function createControls({page,session:S,state:R,act,ui,hooks}){
  const {$,canvas,keys}=page;
  const {shoot,reload,grenade,selectWeapon,zoomOf,interact,toggleFlashlight,openEstateMap,initAudio,fitTouchStick}=act;
  const clamp=T.MathUtils.clamp;
  function hasMouseLock(){return document.pointerLockElement===canvas;}
  // v205: a blade has no sights. Aiming stays off while the katana is out.
  function canAim(){return !weapons[R.weapon]?.melee;}
  function equip(k){selectWeapon(k);if(!canAim())S.aiming=false;}
  function clearPlayInput(){S.mouseDown=false;S.aiming=false;keys.clear();ui.touchControls?.reset();}
  function finishCaptureRequest(){clearTimeout(S.captureTimer);S.captureTimer=null;S.capturePending=false;$('resume').disabled=false;$('restart').disabled=false;}
  function releaseMouse(){
    S.captureWanted=false;S.captureAttempt++;finishCaptureRequest();S.pointer=false;
    canvas.classList.remove('mouse-locked');
    if(hasMouseLock()&&typeof document.exitPointerLock==='function')try{document.exitPointerLock();}catch{}
  }
  function captureAcquired(){
    if(!hasMouseLock())return;
    if(!S.captureWanted||document.hidden||S.mode==='dead'){releaseMouse();return;}
    finishCaptureRequest();if(S.pointer&&S.mode==='playing')return;S.pointer=true;S.mode='playing';clearPlayInput();
    canvas.classList.add('mouse-locked');$('pause').classList.add('hidden');$('captureHelp').classList.add('hidden');
    $('resume').textContent=resumeLabel();
  }
  function captureFailed(attempt,error){
    if(attempt!==S.captureAttempt||!S.capturePending)return;
    if(hasMouseLock()){captureAcquired();return;}
    S.captureWanted=false;S.captureAttempt++;finishCaptureRequest();S.pointer=false;S.mode='paused';clearPlayInput();
    canvas.classList.remove('mouse-locked');
    $('pauseTitle').textContent='Let’s lock your mouse.';
    $('pauseText').textContent=error?.name==='NotAllowedError'?'Your browser did not allow mouse control. Click Retry and allow mouse control if asked.':'The game is paused until your mouse is locked inside it.';
    $('captureHelp').classList.remove('hidden');$('resume').classList.remove('hidden');
    $('resume').textContent='TRY MOUSE LOCK AGAIN →';showPauseMenu();
  }
  function requestPointer(){
    if(S.capturePending||S.mode==='dead'||S.mode==='menu')return;
    if(directControls()){startDirectPlay();return;}
    S.captureWanted=true;
    if(hasMouseLock()){captureAcquired();return;}
    clearPlayInput();S.pointer=false;S.mode='capturing';S.capturePending=true;
    const attempt=++S.captureAttempt;
    $('pauseTitle').textContent='Locking your mouse…';
    $('pauseText').textContent='Allow mouse control if your browser asks. Esc releases the mouse and pauses survival.';
    $('captureHelp').classList.add('hidden');$('resume').classList.remove('hidden');
    $('resume').textContent='WAITING FOR MOUSE LOCK…';$('resume').disabled=true;$('restart').disabled=true;
    showPauseMenu();
    // Keep this call in the original click/keypress, without awaiting other work.
    try{canvas.focus({preventScroll:true});}catch{try{canvas.focus();}catch{}}
    if(typeof canvas.requestPointerLock!=='function'){captureFailed(attempt);return;}
    S.captureTimer=setTimeout(()=>captureFailed(attempt),15000);
    try{
      const result=canvas.requestPointerLock();
      // Firefox/older implementations can return void and signal via events.
      if(result?.then)result.then(()=>{if(attempt===S.captureAttempt&&hasMouseLock())captureAcquired();},error=>captureFailed(attempt,error));
      initAudio();
    }catch(error){captureFailed(attempt,error);}
  }
  // Touch and controller play need no mouse capture. For touch, fullscreen and
  // landscape lock are requested inside the Resume tap, where phones permit them.
  function startDirectPlay(){
    S.captureWanted=false;S.captureAttempt++;finishCaptureRequest();S.pointer=false;
    S.mode='playing';clearPlayInput();canvas.classList.remove('mouse-locked');
    $('pause').classList.add('hidden');$('captureHelp').classList.add('hidden');
    ui.touchControls.setActive(ui.touchControls.enabled);fitTouchStick();initAudio();
    const root=document.documentElement;
    if(ui.touchControls.enabled&&!document.fullscreenElement&&typeof root?.requestFullscreen==='function')try{root.requestFullscreen({navigationUI:'hide'}).then(()=>screen.orientation?.lock?.('landscape')).catch(()=>{});}catch{}
  }
  function resumeLabel(){return directControls()?'RESUME →':'LOCK MOUSE & RESUME →';}
  function resumeHint(){return padPlay()?'Press Menu, or A on Resume, to keep fighting.':ui.touchControls?.enabled?'Tap Resume to keep fighting.':'Click Resume to lock the mouse again.';}
  function pauseGame(){
    if(S.mode!=='playing'&&S.mode!=='capturing'&&S.mode!=='curse')return;
    ui.touchControls?.setActive(false);
    hooks.onPause();
    S.mode='paused';clearPlayInput();releaseMouse();
    $('pauseTitle').textContent='Catch your breath.';
    $('pauseText').textContent=`${hooks.pauseSummary()} ${resumeHint()}`;
    $('captureHelp').classList.add('hidden');$('resume').classList.remove('hidden');
    $('resume').textContent=resumeLabel();showPauseMenu();
  }
  function showPauseMenu(){hooks.onPauseMenu();showPausePage('main');$('pause').classList.remove('hidden');}
  // Pause pages (v143): the main list, the Settings page or a confirm prompt.
  // Settings also opens from the title screen (v144), over the menu.
  function showPausePage(page){for(const [id,name] of [['pauseMain','main'],['pauseSettings','settings'],['pauseConfirm','confirm']])$(id).classList.toggle('hidden',page!==name);}
  const pausePageOpen=id=>!$('pause').classList.contains('hidden')&&!$(id).classList.contains('hidden');
  function settingsOpen(){return pausePageOpen('pauseSettings');}
  let settingsFrom='pause';
  function openSettings(from='pause'){
    settingsFrom=from;$('settingsEyebrow').textContent=hooks.settingsEyebrow(from);
    if(from==='menu'){hooks.settingsFromMenu();$('pause').classList.remove('hidden');}
    showPausePage('settings');$('settingsBack').focus({preventScroll:true});
  }
  function closeSettings(){
    showPausePage('main');
    if(settingsFrom==='menu'){$('pause').classList.add('hidden');$('settingsMenu').focus({preventScroll:true});return;}
    $('settingsPause').focus({preventScroll:true});
  }
  // Are-you-sure prompts (v144) before New Run or Main Menu throw a run away.
  // After a death the run is already over, so those act at once.
  const CONFIRM=hooks.confirm;
  let confirmAction=null,confirmReturn=null;
  function confirmOpen(){return pausePageOpen('pauseConfirm');}
  function askConfirm(kind,trigger){
    const [title,text,yes,act]=CONFIRM[kind];
    if(S.mode==='dead'){act();return;}
    confirmAction=act;confirmReturn=trigger;
    $('confirmTitle').textContent=title;$('confirmText').textContent=text;$('confirmYes').textContent=yes;
    showPausePage('confirm');$('confirmNo').focus({preventScroll:true});
  }
  function cancelConfirm(){confirmAction=null;showPausePage('main');confirmReturn?.focus({preventScroll:true});confirmReturn=null;}
  function acceptConfirm(){const act=confirmAction;confirmAction=confirmReturn=null;showPausePage('main');act?.();}
  function resumeGame(){if(S.mode==='paused')requestPointer();}
  // Weapons in turn for touch and controller; touch look is as fast as the sensitivity setting.
  function cycleWeapon(step=1){const owned=WEAPON_CYCLE.filter(k=>R.inventory[k]?.owned);if(owned.length<2)return;equip(owned[(owned.indexOf(R.weapon)+step+owned.length)%owned.length]);}
  function touchLook(dx,dy){if(S.mode!=='playing')return;const sens=Number($('sensitivity').value)*TOUCH.lookSpeed*(S.aiming?.62/((zoomOf(R.weapon)||1)):1);S.lookYaw-=dx*sens;S.lookPitch=clamp(S.lookPitch-dy*sens,-1.3,1.3);}
  function directControls(){return ui.controlScheme.scheme==='touch'||ui.controlScheme.scheme==='controller';}
  function padPlay(){return ui.controlScheme.scheme==='controller';}
  // The touch and controller play actions (the mode adds the controller's Menu and Back).
  const touchActions={
    look:touchLook,
    fireStart(){if(S.mode!=='playing')return;if(!S.mouseDown){S.mouseDown=true;shoot();}},
    fireEnd(){S.mouseDown=false;},
    aimToggle(){if(S.mode==='playing')S.aiming=!S.aiming&&canAim();},
    jump(){if(S.mode==='playing'&&R.grounded){R.jumpV=4.2;R.grounded=false;}},
    reload(){if(S.mode==='playing')reload();},grenade(){if(S.mode==='playing')grenade();},interact(){if(S.mode==='playing')interact();},
    nextWeapon(){if(S.mode==='playing')cycleWeapon();},flashlight(){if(S.mode==='playing')toggleFlashlight();},
    map(){openEstateMap();},pause(){pauseGame();}
  };
  const padActions={
    used(){return ui.controlScheme.noteInput('controller')==='controller';},
    look(dx,dy){if(S.mode!=='playing')return;S.lookYaw-=dx;S.lookPitch=clamp(S.lookPitch-dy,-1.3,1.3);},
    fireStart(){if(S.mode!=='playing')return;if(!S.mouseDown){S.mouseDown=true;shoot();}},
    fireEnd(){S.mouseDown=false;},
    aim(on){if(S.mode==='playing'||!on)S.aiming=on&&canAim();},
    jump(){if(S.mode==='playing'&&R.grounded){R.jumpV=4.2;R.grounded=false;}},
    reload(){if(S.mode==='playing')reload();},interact(){if(S.mode==='playing')interact();},grenade(){if(S.mode==='playing')grenade();},
    nextWeapon(){if(S.mode==='playing')cycleWeapon();},previousWeapon(){if(S.mode==='playing')cycleWeapon(-1);},
    flashlight(){if(S.mode==='playing')toggleFlashlight();},
    map(){openEstateMap();}
  };
  // Browser events: the mode registers these where it registers its own.
  function onPointerLockChange(){
    if(hasMouseLock()){captureAcquired();return;}
    const wasLocked=S.pointer;S.pointer=false;canvas.classList.remove('mouse-locked');
    if(wasLocked&&S.mode==='playing')pauseGame();
  }
  function onPointerLockError(){captureFailed(S.captureAttempt);}
  function onVisibilityChange(){if(document.hidden)pauseGame();}
  function onMouseMove(e){if(S.mode==='playing'&&S.pointer&&hasMouseLock()&&!hooks.lookBlocked()){const sens=Number($('sensitivity').value)*.002*(S.aiming?.62/((zoomOf(R.weapon)||1)):1);S.lookYaw-=e.movementX*sens;S.lookPitch=clamp(S.lookPitch-e.movementY*sens,-1.3,1.3);}}
  function onMouseDown(e){if(S.mode!=='playing'||directControls())return;if(!hasMouseLock()){pauseGame();requestPointer();return;}e.preventDefault?.();if(e.button===0&&!S.mouseDown){S.mouseDown=true;shoot();}if(e.button===2)S.aiming=canAim();}
  function onMouseUp(e){if(e.button===0)S.mouseDown=false;if(e.button===2)S.aiming=false;}
  // The play keys, once the mode has given its menus and overlays first refusal.
  function playKey(e){if(e.code==='Escape'){pauseGame();return;}if(S.mode!=='playing'||!(hasMouseLock()||directControls()))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyR')reload();if(e.code==='KeyE')interact();if(e.code==='KeyF')toggleFlashlight();if(e.code==='KeyG')grenade();if(e.code==='Digit1')equip('glock');if(e.code==='Digit2')equip('shotgun');if(e.code==='Digit3')equip('smg');if(e.code==='Digit4')equip('lmg');if(e.code==='Digit5')equip('bushmaster');if(e.code==='Digit6')equip('rifle');if(e.code==='Digit7')equip('katana');if(e.code==='Space'&&R.grounded){R.jumpV=4.2;R.grounded=false;}}
  function onKeyUp(e){keys.delete(e.code);}
  function onBlur(){if((S.mode==='playing'||S.mode==='curse')&&!S.capturePending)pauseGame();}
  return {hasMouseLock,clearPlayInput,releaseMouse,captureAcquired,captureFailed,requestPointer,startDirectPlay,resumeLabel,resumeHint,pauseGame,showPauseMenu,showPausePage,settingsOpen,openSettings,closeSettings,confirmOpen,askConfirm,cancelConfirm,acceptConfirm,resumeGame,
    directControls,padPlay,cycleWeapon,touchLook,touchActions,padActions,onPointerLockChange,onPointerLockError,onVisibilityChange,onMouseMove,onMouseDown,onMouseUp,playKey,onKeyUp,onBlur};
}

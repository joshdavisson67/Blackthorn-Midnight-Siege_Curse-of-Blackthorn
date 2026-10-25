import assert from 'node:assert/strict';

// Pause menu (v143): one list in a fixed order, a Settings page holding every
// switch, no leaderboard entry, and Main Menu returning to the title screen.
export function verifyPauseMenu(qa,frames,listeners,elements,gameCanvas){
  const pause=elements.get('pause'),main=elements.get('pauseMain'),settings=elements.get('pauseSettings'),menu=elements.get('menu');
  const order=[...main.querySelectorAll('.pauseMenu button')].map(b=>[b.id,b.textContent.trim()]);
  assert.deepEqual(order.map(([id])=>id),['resume','mapPause','settingsPause','controlsPause','guidePause','restart','mainMenuPause'],'Resume, Estate Map, Settings, Controls, Field Guide, New Run, Main Menu');
  assert.deepEqual(order.slice(1).map(([,label])=>label),['ESTATE MAP','SETTINGS','CONTROLS','FIELD GUIDE','NEW RUN','MAIN MENU']);
  assert(!elements.get('leaderboardPause')&&!pause.textContent.includes('LEADERBOARD'),'The leaderboard is gone from the pause menu');
  assert(elements.get('leaderboardMenu'),'The title screen keeps its leaderboard');
  for(const id of ['quality','sensitivity','sound','minimapToggle','headshotToggle','touchToggle','tapFireToggle','rumbleToggle']){
    assert(settings.contains(elements.get(id)),`${id} lives on the Settings page`);assert(!main.contains(elements.get(id)),`${id} is off the main pause list`);
  }
  assert.equal(main.querySelectorAll('.pauseSetting').length,0,'No settings clutter the main list');
  // v144: the title screen lost its settings strip and gained a Settings entry.
  for(const id of ['quality','sensitivity','sound'])assert(!menu.contains(elements.get(id)),`${id} is off the title screen`);
  assert(menu.contains(elements.get('settingsMenu'))&&elements.get('settingsMenu').textContent.trim()==='SETTINGS','The title screen has a Settings entry');

  // Settings opens over the list; Back and Esc return to it; pausing again starts on the list.
  qa.start();qa.holdSpawns();frames(2);listeners.keydown({code:'Escape',preventDefault(){}});assert.equal(qa.get().mode,'paused');
  assert(!main.classList.contains('hidden')&&settings.classList.contains('hidden'));
  elements.get('settingsPause').onclick();assert(main.classList.contains('hidden')&&!settings.classList.contains('hidden'),'Settings replaces the list');
  elements.get('headshotToggle').onclick();elements.get('headshotToggle').onclick();
  elements.get('settingsBack').onclick();assert(!main.classList.contains('hidden')&&settings.classList.contains('hidden'),'Back returns to the list');
  elements.get('settingsPause').onclick();listeners.keydown({code:'Escape',preventDefault(){}});
  assert(settings.classList.contains('hidden'),'Esc leaves Settings');assert.equal(qa.get().mode,'paused','Esc on Settings does not resume');
  elements.get('settingsPause').onclick();elements.get('resume').onclick();assert.equal(qa.get().mode,'playing');
  listeners.keydown({code:'Escape',preventDefault(){}});assert(!main.classList.contains('hidden')&&settings.classList.contains('hidden'),'A new pause opens on the list');

  // Are-you-sure prompts (v144): cancel keeps the run, Esc cancels, yes acts.
  const confirm=elements.get('pauseConfirm');
  qa.makeZombie(2,14);qa.setPoints(4321);assert(qa.get().zombies.length>0);
  elements.get('restart').onclick();
  assert(!confirm.classList.contains('hidden')&&main.classList.contains('hidden'),'New Run asks first');
  assert.equal(elements.get('confirmTitle').textContent,'Start a new run?');
  elements.get('confirmNo').onclick();assert(confirm.classList.contains('hidden')&&!main.classList.contains('hidden'));
  assert.equal(qa.get().points,4321,'Cancel keeps the run');assert.equal(qa.get().mode,'paused');
  elements.get('mainMenuPause').onclick();assert.equal(elements.get('confirmTitle').textContent,'Return to the main menu?');
  listeners.keydown({code:'Escape',preventDefault(){}});assert(confirm.classList.contains('hidden'),'Esc cancels the prompt');assert.equal(qa.get().mode,'paused','Esc on the prompt does not resume');
  assert.equal(qa.get().points,4321);
  elements.get('restart').onclick();elements.get('confirmYes').onclick();
  assert.equal(qa.get().points,500,'Confirming New Run starts over');assert.equal(qa.get().zombies.length,0);
  qa.holdSpawns();frames(2);if(qa.get().mode!=='paused')listeners.keydown({code:'Escape',preventDefault(){}});

  // Main Menu abandons the run and brings back the title screen, ready to enter again.
  qa.makeZombie(2,14);qa.setPoints(4321);assert(qa.get().zombies.length>0);
  elements.get('mainMenuPause').onclick();assert.equal(qa.get().mode,'paused','Main Menu asks first');elements.get('confirmYes').onclick();
  assert.equal(qa.get().mode,'menu','Main Menu returns to the title screen');
  assert(!menu.classList.contains('hidden')&&pause.classList.contains('hidden')&&elements.get('hud').classList.contains('hidden'));
  assert.equal(qa.get().zombies.length,0,'The abandoned run is cleared');assert.equal(document.pointerLockElement,null);
  assert.equal(elements.get('start').disabled,false,'Enter the Estate works again');
  frames(30);assert.equal(qa.get().mode,'menu','The title screen stays put');
  // Settings from the title screen opens over the menu and Back returns to it.
  elements.get('settingsMenu').onclick();
  assert(!pause.classList.contains('hidden')&&!settings.classList.contains('hidden')&&main.classList.contains('hidden'),'Settings opens on its own from the title');
  assert(elements.get('pauseCurse').classList.contains('hidden'),'No curse panel over the title');
  assert.equal(elements.get('settingsEyebrow').textContent,'BLACKTHORN ESTATE');assert.equal(qa.get().mode,'menu','Opening Settings does not start a run');
  const sens=elements.get('sensitivity');sens.value='1.4';sens.oninput();assert.equal(elements.get('sensitivityValue').textContent,'1.4×','The sensitivity readout follows the slider');
  const sound=elements.get('sound');sound.checked=false;sound.onchange();assert.equal(document.querySelector('[data-sound-setting]').textContent,'OFF');
  sound.checked=true;sound.onchange();sens.value='1';sens.oninput();
  listeners.keydown({code:'Escape',preventDefault(){}});
  assert(pause.classList.contains('hidden')&&!menu.classList.contains('hidden'),'Esc closes title Settings back to the menu');assert.equal(qa.get().mode,'menu');
  elements.get('settingsMenu').onclick();elements.get('settingsBack').onclick();assert(pause.classList.contains('hidden'),'Back closes title Settings');

  elements.get('start').onclick();assert.notEqual(qa.get().mode,'menu','Entering again starts a fresh run');assert.equal(qa.get().points,500);
  // It also works from the end-of-run screen.
  qa.setHealth(100);qa.hurtPlayer(200000,qa.get().player);assert.equal(qa.get().mode,'dead');
  elements.get('mainMenuPause').onclick();assert.equal(qa.get().mode,'menu','After a death Main Menu goes straight there (nothing left to lose)');
  elements.get('start').onclick();
  console.log('PASS: pause menu — are-you-sure prompts for New Run and Main Menu (cancel, Esc, confirm; none after death), graphics/sensitivity/sound moved into Settings and a title-screen Settings entry, Resume / Estate Map / Settings / Controls / Field Guide / New Run / Main Menu, all switches on a Settings page (Back and Esc return), no leaderboard entry, and Main Menu clearing the run back to a working title screen (also after death).');
}

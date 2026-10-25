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
  for(const id of ['minimapToggle','headshotToggle','touchToggle','rumbleToggle']){
    assert(settings.contains(elements.get(id)),`${id} lives on the Settings page`);assert(!main.contains(elements.get(id)),`${id} is off the main pause list`);
  }
  assert.equal(main.querySelectorAll('.pauseSetting').length,0,'No settings clutter the main list');

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

  // Main Menu abandons the run and brings back the title screen, ready to enter again.
  qa.makeZombie(2,14);qa.setPoints(4321);assert(qa.get().zombies.length>0);
  elements.get('mainMenuPause').onclick();
  assert.equal(qa.get().mode,'menu','Main Menu returns to the title screen');
  assert(!menu.classList.contains('hidden')&&pause.classList.contains('hidden')&&elements.get('hud').classList.contains('hidden'));
  assert.equal(qa.get().zombies.length,0,'The abandoned run is cleared');assert.equal(document.pointerLockElement,null);
  assert.equal(elements.get('start').disabled,false,'Enter the Estate works again');
  frames(30);assert.equal(qa.get().mode,'menu','The title screen stays put');
  elements.get('start').onclick();assert.notEqual(qa.get().mode,'menu','Entering again starts a fresh run');assert.equal(qa.get().points,500);
  // It also works from the end-of-run screen.
  qa.setHealth(100);qa.hurtPlayer(200000,qa.get().player);assert.equal(qa.get().mode,'dead');
  elements.get('mainMenuPause').onclick();assert.equal(qa.get().mode,'menu','Main Menu works after a death');
  elements.get('start').onclick();
  console.log('PASS: pause menu — Resume / Estate Map / Settings / Controls / Field Guide / New Run / Main Menu, all switches on a Settings page (Back and Esc return), no leaderboard entry, and Main Menu clearing the run back to a working title screen (also after death).');
}

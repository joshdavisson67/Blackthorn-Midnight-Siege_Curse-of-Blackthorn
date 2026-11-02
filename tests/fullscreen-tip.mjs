import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// v171: the first loading screen suggests full screen, just below its message.
export function verifyFullscreenTip(elements){
  const html=readFileSync(new URL('../public/game/index.html',import.meta.url),'utf8'),css=readFileSync(new URL('../public/game/style.css',import.meta.url),'utf8');
  const loading=html.match(/<div id="loading">([\s\S]*?)<\/div>/)[1];
  assert(loading.startsWith('PREPARING THE ESTATE'),'The loading message still comes first');
  assert(loading.includes('<p id="fullscreenTip" class="loadingTip">TIP: PRESS <kbd>F11</kbd> TO ENTER FULL SCREEN MODE</p>'),'The full-screen tip sits inside the loading screen');
  assert(/#loading \.loadingTip\{margin:22px 0 0;/.test(css),'A slight gap separates the tip from the message');
  assert(css.includes('@media(hover:none) and (pointer:coarse){#loading .loadingTip{display:none}}'),'Touch devices, which have no F11, skip the tip');
  assert(elements.get('fullscreenTip'),'The tip is part of the page');
  console.log('PASS: the loading screen shows "TIP: PRESS F11 TO ENTER FULL SCREEN MODE" a slight gap below "PREPARING THE ESTATE", hidden on touch devices.');
}

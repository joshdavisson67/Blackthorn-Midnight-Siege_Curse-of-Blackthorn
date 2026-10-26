import assert from 'node:assert/strict';

export function verifyFieldGuide(qa,frames,listeners,elements){
  const guide=elements.get('guide'),body=elements.get('guideBody');
  const controls=[...guide.querySelectorAll('button,a[href],[tabindex="0"]')];
  const tracked=[...controls,elements.get('howBtn'),elements.get('guidePause'),elements.get('controlsPause')];
  const originalFocus=tracked.map(el=>el.focus);
  const originalActive=Object.getOwnPropertyDescriptor(document,'activeElement');
  let focused=null;
  Object.defineProperty(document,'activeElement',{configurable:true,get:()=>focused});
  tracked.forEach(el=>{el.focus=()=>{focused=el;};});
  const press=(code,shiftKey=false)=>{
    let prevented=false;
    listeners.keydown({code,shiftKey,repeat:false,preventDefault(){prevented=true;}});
    return prevented;
  };
  try{
    // The landing guide starts at the top and closes back to its opener.
    const mode=qa.get().mode;
    body.scrollTop=500;
    elements.get('howBtn').onclick();
    assert(!guide.classList.contains('hidden'));
    assert.equal(guide.dataset.view,'guide','The title-screen Field Guide opens the guide view');
    assert.equal(qa.get().mode,mode);
    assert.equal(body.scrollTop,0);
    assert.equal(focused,body);
    for(const code of ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End','Space']){
      assert.equal(press(code),false,`${code} must retain native scrolling`);
    }
    assert.equal(press('KeyM'),false);
    assert(elements.get('estateMap').classList.contains('hidden'),'Guide input must not open a map behind it');
    assert.equal(press('Escape'),true);
    assert(guide.classList.contains('hidden'));
    assert.equal(focused,elements.get('howBtn'));

    // Every jump link has a real, readable destination in the scrolling region.
    for(const link of guide.querySelectorAll('.guideNav a')){
      const target=guide.querySelector(link.getAttribute('href'));
      assert(target&&body.contains(target));
      assert(target.querySelector('h3')?.textContent.trim());
    }

    // A guide opened during a run pauses it; closing does not recapture the mouse.
    qa.start();document.exitPointerLock();
    elements.get('guidePause').onclick();
    assert.equal(guide.dataset.view,'guide','Field Guide opens the guide view');assert.equal(elements.get('guideTitle').textContent,'Stay alive. Spend wisely.');
    const before=qa.get();frames(120);
    assert.equal(qa.get().mode,'paused');
    assert.equal(qa.get().wave,before.wave);
    assert.equal(qa.get().health,before.health);
    focused=controls.at(-1);assert(press('Tab'));assert.equal(focused,controls[0]);
    assert(press('Tab',true));assert.equal(focused,controls.at(-1));
    elements.get('closeGuide').onclick();
    assert(guide.classList.contains('hidden'));
    assert.equal(focused,elements.get('guidePause'));
    assert.equal(document.pointerLockElement,null);
    elements.get('guidePause').onclick();body.scrollTop=999;
    elements.get('guideDone').onclick();
    elements.get('guidePause').onclick();assert.equal(body.scrollTop,0);
    press('Escape');assert.equal(qa.get().mode,'paused');
    assert.equal(document.pointerLockElement,null);
    // Controls (v143) is its own pause-menu entry: the same window, controls only.
    elements.get('controlsPause').onclick();
    assert(!guide.classList.contains('hidden'));assert.equal(guide.dataset.view,'controls');
    assert.equal(elements.get('guideTitle').textContent,'Controls');assert.equal(elements.get('guideEyebrow').textContent,'BLACKTHORN / CONTROLS');
    assert(elements.get('guideControls').textContent.includes('DOUBLE-TAP RIGHT'),'Controls list the touch layout too');
    press('Escape');assert(guide.classList.contains('hidden'));assert.equal(focused,elements.get('controlsPause'));assert.equal(qa.get().mode,'paused');
  }finally{
    tracked.forEach((el,i)=>{el.focus=originalFocus[i];});
    if(originalActive)Object.defineProperty(document,'activeElement',originalActive);
    else delete document.activeElement;
  }
  console.log('PASS: field guide and controls views (pause-menu Controls and Field Guide, title-screen combined guide) reset scroll, preserves keyboard scrolling, contains focus, links to all sections, and closes safely from menu/pause.');
}

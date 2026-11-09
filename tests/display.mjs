import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseHTML} from 'linkedom';

// v201 (Dead Tide step 1): the screen is a shared module. The mansion still draws
// identically (scripts/golden-trace.mjs logs every renderer call, from the shader
// warm-up to each frame, through every quality, a portrait window and dynamic
// resolution); this test runs the screen on a bare page with a world of its own.
export async function verifyDisplay(){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  assert.deepEqual(imports('display.mjs'),['three.module.js','graphics.mjs','render-scale.mjs'],'The screen imports only three.js, the shared graphics toolkit and dynamic resolution');
  const closure=new Set(),walk=f=>{if(closure.has(f))return;closure.add(f);for(const g of imports(f))walk(g);};walk('display.mjs');
  const mansion=['vertical.mjs','cellar-layout.mjs','cellar.mjs','graveyard.mjs','mansion-expansion.mjs','second-floor.mjs','facade.mjs','furnishings.mjs','grounds.mjs','estate-detail.mjs','shed.mjs','shed-layout.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','rotunda-bell.mjs','world-events.mjs','world-event-visuals.mjs','curse.mjs','curse-ui.mjs','camp-spawns.mjs','upper-shell.mjs','exterior-stairs.mjs','lighting.mjs','estate-layout.mjs','environment-lights.mjs'];
  assert.deepEqual([...closure].filter(f=>mansion.includes(f)),[],'Nothing the screen loads builds or holds the mansion');
  const src=read('game.js');
  for(const text of ['new T.WebGLRenderer','renderCleanFrame(','makeFilmPass(','createRenderScale(','function resize(','QUALITY_KEY','rendererPrepared','fpsTime','compileAsync'])assert(!src.includes(text),`game.js no longer keeps its own ${text}`);
  assert(/const display=createDisplay\(\{canvas,/.test(src)&&/display\.useScreen\(\{/.test(src)&&/return display\.prepare\(\(\)=>\{/.test(src)&&/display\.render\(/.test(src)&&/display\.frame\(/.test(src),'The mansion draws through the shared screen and keeps its own warm-up list');

  // ---- A bare page and a world of its own -------------------------------------------
  const {document}=parseHTML(`<!doctype html><html><body><select id="quality"><option value="low">Performance</option><option value="high" selected>Balanced</option><option value="ultra">Ultra</option></select><div id="fps"></div></body></html>`);
  const select=document.getElementById('quality'),fps=document.getElementById('fps');
  Object.defineProperty(select,'value',{configurable:true,get(){return (select.querySelector('option[selected]')||select.querySelector('option')).getAttribute('value');},set(v){for(const o of select.querySelectorAll('option'))o.toggleAttribute('selected',o.getAttribute('value')===v);}});
  const saved={w:globalThis.innerWidth,h:globalThis.innerHeight,dpr:globalThis.devicePixelRatio,storage:globalThis.localStorage},store=new Map();
  globalThis.innerWidth=1000;globalThis.innerHeight=500;globalThis.devicePixelRatio=2;globalThis.localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,String(v))};
  try{
    const T=await import('../.qa/three.module.js');
    const {createDisplay,QUALITY_KEY,WEBGL_REQUIRED,pixelRatioFor}=await import('../.qa/display.mjs');
    assert.deepEqual(['low','high','ultra'].map(pixelRatioFor),[1,1.5,2],'Pixel ratio per quality (capped by the screen)');
    // No WebGL: the mode is told why, then the error stops the load.
    let told=null;assert.throws(()=>createDisplay({canvas:{noWebGL:true},onFailure:m=>{told=m;}}));assert.equal(told,WEBGL_REQUIRED,'Without WebGL the page explains what to enable');
    // The renderer and both cameras.
    const D=createDisplay({canvas:{},far:600}),{renderer:R,scene,camera,viewCamera}=D;
    assert(R.pr===1.5&&R.shadowMap.enabled&&R.shadowMap.type===T.PCFSoftShadowMap&&R.toneMapping===T.ACESFilmicToneMapping&&R.toneMappingExposure===1.22&&R.outputColorSpace===T.SRGBColorSpace,'The renderer starts at Balanced with soft shadows and filmic tone');
    assert(camera.fov===75&&camera.aspect===2&&camera.near===.09&&camera.far===600&&camera.rotation.order==='YXZ'&&camera.parent===scene&&viewCamera!==camera,'The world camera sees as far as the mode asks; the weapon has a camera of its own');
    assert.equal(createDisplay({canvas:{}}).camera.far,240,'240 m unless told otherwise');
    const {rt,postMat,postScene}=D.addFilm();
    assert(rt===D.rt&&postMat===D.postMat&&rt.width===1000&&rt.height===500&&rt.samples===4&&postScene.children[0].material===postMat,'The film pass renders the world offscreen and draws it to the screen');
    // Quality, layout and resizing.
    const order=[];const scale=D.useScreen({select,fps,layout:()=>order.push('layout'),quality:q=>order.push('quality '+q),detail:q=>order.push('detail '+q)});
    assert(scale===D.renderScale&&typeof select.onchange==='function','The quality menu is wired');
    D.resize();assert(order.join()==='layout'&&rt.width===1500&&rt.height===750,'A resize lays the page out, then sizes the scene by pixel ratio');
    globalThis.innerWidth=600;globalThis.innerHeight=900;D.resize();assert(Math.abs(camera.aspect-600/900)<1e-12&&rt.width===900&&rt.height===1350,'A portrait window reshapes the camera and the scene');
    order.length=0;select.value='low';select.onchange();
    assert(store.get(QUALITY_KEY)==='low'&&R.pr===1&&rt.samples===2&&order.join()==='quality low,detail low,layout','Performance: saved, one pixel per pixel, 2× antialiasing; the mode’s settings first, then its extras, then the layout');
    assert(Math.abs(D.renderScale.scale-.85)<1e-9&&rt.width===510&&rt.height===765,'and it starts at 85% resolution');
    assert.equal(R.compileCalls,undefined,'Nothing recompiles before the warm-up');
    select.value='ultra';select.onchange();assert(R.pr===2&&rt.samples===4&&rt.width===1200&&rt.height===1800,'Ultra: two pixels per pixel at full resolution');
    // Dynamic resolution measures live play only; the readout updates once a second.
    for(let i=0;i<40;i++)D.frame(.04,false);assert(D.renderScale.scale===1&&/^25 FPS · ULTRA$/.test(fps.textContent),'Paused, slow frames do not lower the resolution; the readout shows the rate and quality');
    for(let i=0;i<40;i++)D.frame(.04,true);
    assert(D.renderScale.scale<1&&rt.width===Math.round(600*2*D.renderScale.scale)&&/^25 FPS · ULTRA · \d+% RES$/.test(fps.textContent),'In play, slow frames lower it and the readout says so');
    // A frame: the world, the weapon over a cleared depth buffer, then the film.
    const calls=[],wrap=name=>{const f=R[name].bind(R);R[name]=(...a)=>{calls.push([name,...a]);return f(...a);};};['render','setRenderTarget','clear','clearDepth'].forEach(wrap);
    const world=new T.Group();scene.add(world);D.render(true,world,50);
    assert.deepEqual(calls.map(c=>c[0]),['setRenderTarget','clear','render','clearDepth','render','setRenderTarget','clear','render'],'A frame draws the world, then the weapon, then the film');
    assert(calls[0][1]===rt&&calls[2][2]===camera&&calls[4][2]===viewCamera&&viewCamera.fov===50&&viewCamera.layers.mask===2&&calls[5][1]===null&&calls[7][1]===postScene&&world.visible,'into the film target, the weapon at its own field of view on layer 1, the world shown again after');
    calls.length=0;D.render(false,world);assert(!calls.some(c=>c[0]==='clearDepth'),'With nothing in hand the weapon pass is skipped');
    // The warm-up: every warm model stands in front of the camera while shaders compile.
    const warm=Array.from({length:7},()=>new T.Group()),maps=[new T.Texture(),new T.Texture()];let during=null,stagedTarget=null,done=0;
    const compile=R.compileAsync.bind(R);R.compileAsync=(s,c)=>{if(!during){during=warm.map(g=>[g.parent===world,g.userData.lightingTransient,g.position.x,g.position.y,g.position.z]);stagedTarget=calls.filter(c=>c[0]==='setRenderTarget').at(-1)[1];}return compile(s,c);};
    calls.length=0;
    await D.prepare(()=>{camera.position.set(0,1.68,20);camera.rotation.set(0,0,0);return {world,warm,textures:()=>maps,done(){done++;}};});
    assert.deepEqual(during,warm.map((g,i)=>[true,true,(i%5-2)*.8,0,15-Math.floor(i/5)]),'Warm models stand in rows of five on the floor 5 m ahead of the camera');
    assert(stagedTarget===rt&&calls.filter(c=>c[0]==='setRenderTarget').at(-1)[1]===null,'Shaders compile for the film target, which is released after');
    assert.deepEqual(R.compileCalls,[1,2],'Both the world’s and the weapon’s lighting compile');
    assert(maps.every(m=>R.initializedTextures.has(m))&&calls.filter(c=>c[0]==='render').length===3,'Every texture uploads and one full frame is drawn');
    assert(done===1&&warm.every(g=>g.parent===null&&g.position.lengthSq()===0)&&D.prepared,'Then the warm models leave and the mode puts things back');
    select.value='high';select.onchange();assert.deepEqual(R.compileCalls,[1,2,1,2],'After the warm-up a quality change recompiles both');
    const E=createDisplay({canvas:{}});E.addFilm();E.renderer.compileAsync=undefined;let staged=false;await E.prepare(()=>{staged=true;return {world};});
    assert(!staged&&E.prepared,'A renderer that cannot compile ahead skips the warm-up');
    // The saved quality applies to every mode.
    store.set(QUALITY_KEY,'low');D.restoreQuality();assert(select.value==='low'&&R.pr===1,'The saved quality is restored');
    store.set(QUALITY_KEY,'cinematic');D.restoreQuality();assert.equal(select.value,'low','and an unknown one ignored');
  }finally{globalThis.innerWidth=saved.w;globalThis.innerHeight=saved.h;globalThis.devicePixelRatio=saved.dpr;globalThis.localStorage=saved.storage;}
  console.log(`PASS: shared screen — imports only three.js, the graphics toolkit and dynamic resolution (${closure.size} files, none of them mansion builders or state), game.js keeps no copy; on a bare page it explains a missing WebGL, sets up the renderer and both cameras, renders the world offscreen through the film pass, applies each quality (pixel ratio, antialiasing, starting resolution) with the mode's settings before its extras, resizes for portrait, lowers resolution only in live play with a readout, draws world, weapon and film in order, warms shaders and textures with the mode's models in front of the camera, recompiles on later quality changes and restores the saved quality.`);
}

import * as T from './three.module.js';
import {makeFilmPass,renderCleanFrame} from './graphics.mjs?v=205';
import {createRenderScale} from './render-scale.mjs?v=120';

// The screen (v201, Dead Tide step 1), for any mode: the WebGL renderer and its
// settings, the scene and both cameras (the world's, and the one that draws the
// held weapon over it), the film pass the world renders into, the quality setting
// (pixel ratio, antialiasing and dynamic resolution), resizing, the FPS readout,
// drawing a frame, and compiling every shader under the loading screen. Moved from
// game.js unchanged; scripts/golden-trace.mjs logs every renderer call and checks the
// mansion draws identically. A mode keeps its own world, sky, fog and lights, and
// passes hooks for what quality and layout change in it; the README's version 201
// section lists every field.
export const QUALITY_KEY='blackthorn-quality';
export const WEBGL_REQUIRED='This game needs WebGL hardware acceleration. Enable hardware acceleration in your browser and reload.';
// Rendered pixels per CSS pixel at each quality.
export const pixelRatioFor=q=>q==='ultra'?Math.min(devicePixelRatio,2):q==='low'?1:Math.min(devicePixelRatio,1.5);

export function createDisplay({canvas,far=240,onFailure=()=>{}}){
  let renderer;
  try{renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});}catch(e){onFailure(WEBGL_REQUIRED);throw e;}
  renderer.setPixelRatio(pixelRatioFor('high'));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;renderer.outputColorSpace=T.SRGBColorSpace;
  const scene=new T.Scene();
  const camera=new T.PerspectiveCamera(75,innerWidth/innerHeight,.09,far);camera.rotation.order='YXZ';scene.add(camera);const viewCamera=new T.PerspectiveCamera();
  let rt=null,postMat=null,postScene=null,postCamera=null,renderScale=null,page=null,prepared=false,frames=0,seconds=0;

  // The film pass (vignette, tone mapping, brightness). Added separately so a mode can
  // make it after its world, as the mansion always has: the order objects are made in
  // decides their ids.
  function addFilm(){
    const film=makeFilmPass(innerWidth,innerHeight);rt=film.target;postMat=film.material;postScene=new T.Scene();postCamera=new T.OrthographicCamera(-1,1,1,-1,0,1);postScene.add(new T.Mesh(new T.PlaneGeometry(2,2),postMat));
    return {rt,postMat,postScene,postCamera};
  }
  // The page's controls: the quality menu (select), the FPS readout (fps), and the
  // mode's hooks: layout() before every resize, quality(q) for what changes its
  // shaders (applied before they recompile), detail(q) for what it shows or hides.
  function useScreen(options){page=options;renderScale=createRenderScale(page.select.value);page.select.onchange=applyQuality;return renderScale;}
  function applyQuality(){const q=page.select.value;try{localStorage.setItem(QUALITY_KEY,q);}catch{}renderScale.reset(q);renderer.setPixelRatio(pixelRatioFor(q));page.quality?.(q);if(prepared)Promise.all([renderer.compileAsync?.(scene,camera),renderer.compileAsync?.(scene,viewCamera)]).catch(()=>{});rt.samples=Math.min(q==='low'?2:4,renderer.capabilities?.maxSamples??4);rt.dispose();page.detail?.(q);resize();}
  // The quality saved by any mode applies to every mode.
  function restoreQuality(){try{const select=page.select,saved=localStorage.getItem(QUALITY_KEY);if(saved&&saved!==select.value&&[...select.options].some(o=>o.value===saved)){select.value=saved;select.onchange();}}catch{}}
  function resize(){page?.layout?.();const pr=renderer.getPixelRatio();renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();const scale=renderScale.scale;rt.setSize(Math.max(1,Math.round(innerWidth*pr*scale)),Math.max(1,Math.round(innerHeight*pr*scale)));}
  // Every frame: dynamic resolution measures live play only, and the readout updates
  // once a second.
  function frame(frameSeconds,live){seconds+=frameSeconds;frames++;if(live){const before=renderScale.scale;renderScale.sample(frameSeconds);if(renderScale.scale!==before)resize();}else renderScale.interrupt();if(seconds>1){page.fps.textContent=`${Math.round(frames/seconds)} FPS · ${page.select.value.toUpperCase()}${renderScale.scale<1?` · ${Math.round(renderScale.scale*100)}% RES`:''}`;seconds=0;frames=0;}}
  // The world pass, then the held weapon (on layer 1, over a cleared depth buffer) at
  // its own field of view, then the film pass to the screen.
  function render(showView,world,fov){renderCleanFrame(renderer,scene,camera,viewCamera,rt,postScene,postCamera,showView,world,fov);}
  // Compile every shader and upload every texture while the loading screen is up, so
  // nothing stalls the first time it appears in play. stage() runs only when the
  // renderer can compile: the mode points the camera along -z, shows what it keeps
  // hidden, and returns its world, the models to warm (stood in rows of five on the
  // floor 5 m ahead of the camera, then removed), textures() and done() to put
  // everything back.
  async function prepare(stage){
    if(renderer.compileAsync){
      const {world,warm=[],textures=()=>[],done=()=>{}}=stage();
      warm.forEach((g,i)=>{g.userData.lightingTransient=true;g.position.set(camera.position.x+(i%5-2)*.8,camera.position.y-1.68,camera.position.z-5-Math.floor(i/5));world.add(g);});
      try{
        renderer.setRenderTarget(rt);
        await renderer.compileAsync(scene,camera);
        viewCamera.copy(camera,false);viewCamera.layers.set(1);await renderer.compileAsync(scene,viewCamera);
        for(const texture of textures())renderer.initTexture?.(texture);
        // Upload the shared buffers too.
        render(true,world);
      }finally{
        renderer.setRenderTarget(null);
        warm.forEach(g=>{g.removeFromParent();g.position.set(0,0,0);});
        done();
      }
    }
    prepared=true;
  }
  return {renderer,scene,camera,viewCamera,addFilm,useScreen,applyQuality,restoreQuality,resize,frame,render,prepare,
    get rt(){return rt;},get postMat(){return postMat;},get renderScale(){return renderScale;},get prepared(){return prepared;}};
}

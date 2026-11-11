import {writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
// The test stand-in for three.js (moved from harness.mjs in v204 so Dead Tide's harness
// can use it too). It models the renderer's frame-scoped state and shadow map
// dimensions, without claiming GPU rendering. The real renderer clears
// currentRenderState after every render; shadow passes cannot be called directly
// between frames.
export function writeThreeStub(qaDir){writeFileSync(resolve(qaDir,'three.module.js'),`export * from '../public/game/three.module.js';
import {WebGLRenderTarget} from '../public/game/three.module.js';
export class WebGLRenderer {
  constructor(options={}){if(options.canvas?.noWebGL)throw new Error('WebGL is unavailable');this.pr=1;this.renderDepth=0;this.shadowCalls=[];this.shadowMap={enabled:false,render:(lights,scene,camera)=>{
    if(!this.shadowMap.enabled)return;
    if(lights.length&&this.renderDepth===0)throw new Error('Cannot read currentRenderState.state outside a render frame');
    for(const light of lights){const shadow=light.shadow;if(!shadow.autoUpdate&&!shadow.needsUpdate)continue;
      const size=shadow.mapSize,extent=shadow.getFrameExtents();
      shadow.map??=new WebGLRenderTarget(size.x*extent.x,size.y*extent.y);
      for(let face=0;face<shadow.getViewportCount();face++)shadow.updateMatrices(light,face);
      const enemies=[];scene.traverseVisible(o=>{if(o.isMesh&&o.castShadow&&o.userData.enemy)enemies.push(o.uuid);});
      this.shadowCalls.push({light,views:shadow.getViewportCount(),enemies,renderDepth:this.renderDepth});shadow.needsUpdate=false;
    }
  }};}
  setPixelRatio(p){this.pr=p;}getPixelRatio(){return this.pr;}
  initTexture(texture){(this.initializedTextures??=new Set()).add(texture);}
  setSize(){}setRenderTarget(){}compileAsync(scene,camera,target=null){(this.compileCalls??=[]).push(camera.layers.mask);(this.compileScenes??=[]).push([scene,target]);return Promise.resolve();}
  clear(){}clearDepth(){}
  render(scene,camera){this.renderDepth++;
    try{if(scene.matrixWorldAutoUpdate===true)scene.updateMatrixWorld();if(camera.parent===null&&camera.matrixWorldAutoUpdate===true)camera.updateMatrixWorld();
      const lights=[];scene.traverseVisible(o=>{if(o.isLight&&o.castShadow&&o.layers.test(camera.layers))lights.push(o);});
      this.shadowMap.render(lights,scene,camera);
    }finally{this.renderDepth--;}
  }
}
// v201: scripts/golden-trace.mjs can log every call the game makes to the renderer.
for(const name of ['setPixelRatio','setSize','setRenderTarget','clear','clearDepth','render','compileAsync','initTexture']){
  const call=WebGLRenderer.prototype[name];WebGLRenderer.prototype[name]=function(...args){globalThis.__qaRenderLog?.(name,args,this);return call.apply(this,args);};
}`);}

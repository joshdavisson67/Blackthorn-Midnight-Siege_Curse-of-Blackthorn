// Expiring drops (v169): power-ups, grave essence crystals and Bella's bone
// chips fade out and back in over their last five seconds, four slow pulses
// and then eight quick ones in the final two, so you can see one is about to
// vanish.
export const DROP_FADE=Object.freeze({window:5,fast:2,slowPeriod:.75,fastPeriod:.25,floor:.12});

// Opacity for a drop with `life` seconds left: 1 until the last five seconds,
// then a smooth pulse that starts and (at the switch to the fast pulse) passes
// through full opacity, so the rhythm changes without a jump.
export function dropOpacity(life){
  const F=DROP_FADE;if(!(life<F.window))return 1;
  const left=Math.max(0,life),cycles=left>F.fast?(F.window-left)/F.slowPeriod:(F.window-F.fast)/F.slowPeriod+(F.fast-left)/F.fastPeriod;
  return F.floor+(1-F.floor)*(.5+.5*Math.cos(2*Math.PI*cycles));
}

// Give one drop its own transparent copies of its materials, so it can fade
// without touching other drops that share the same finish. The estate
// lighting patch (onBeforeCompile and program key) is carried over.
export function fadeMaterials(root){
  const swaps=[];
  root.traverse(o=>{
    if(!(o.isMesh||o.isSprite)||Array.isArray(o.material))return;
    const src=o.material,m=src.clone();
    m.onBeforeCompile=src.onBeforeCompile;m.customProgramCacheKey=src.customProgramCacheKey;m.transparent=true;
    swaps.push({o,src,m,base:src.opacity});o.material=m;
  });
  let value=1;
  return {
    swaps,
    get opacity(){return value;},
    set(v){value=v;for(const s of swaps)s.m.opacity=s.base*v;},
    // Put the shared finishes back and free the copies (textures are shared and kept).
    dispose(){for(const s of swaps){s.o.material=s.src;s.m.dispose();}swaps.length=0;},
  };
}

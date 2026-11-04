import * as T from './three.module.js';

// v183: more faces. Each body gets a few extra heads, built once while the game
// loads by re-running the face sculpting with different features (nose, hair,
// ears, jaw, lips, a torn cheek, slack, skull proportions). A spawn wears one
// of them, or its body's own, and also gets its own head proportions, jaw hang
// and eye glow. Nothing is built per spawn.
export const FACES=Object.freeze({
  // Extra faces per body (template index → count): walkers, brute, feral, lurker.
  variants:Object.freeze({0:3,1:3,2:3,3:3,4:2,9:2,10:1}),
  headScale:Object.freeze({x:Object.freeze([.93,1.07]),y:Object.freeze([.94,1.07]),z:Object.freeze([.95,1.05])}),
  jawHang:Object.freeze([0,.12]),
  // Eye glows, made once at load and shared: brightness × hue (0 = the base
  // red, 1 = full ember orange).
  eyeBright:Object.freeze([.55,.8,1.05,1.3]),
  eyeHue:Object.freeze([0,.2,.4]),
  ember:0xff4a10,
});
const NOSES=['broken','thin','flat','rotted'],HAIR=['cap','slick','strands','sparse','none'],EARS=[[1,1],[1,0],[0,1],[0,0],[1,1]];

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

// A face variant's features: always different from its neighbours.
export function faceRecipe(templateIndex,variant){
  const r=seeded(0x51ed27+templateIndex*977+variant*7919),pick=a=>a[Math.floor(r()*a.length)],k=(a,b)=>a+(b-a)*r();
  return {
    style:{nose:NOSES[(templateIndex+variant+1)%NOSES.length],hair:HAIR[(templateIndex*2+variant+1)%HAIR.length],ears:pick(EARS),jaw:k(.88,1.14),lipless:r()<.35,torn:r()<.4,slack:k(0,.08)},
    headMul:{w:k(.92,1.08),h:k(.94,1.08),d:k(.93,1.07),brow:k(.75,1.45),hollow:k(.8,1.35),cheek:k(.85,1.2),square:k(.85,1.15)},
  };
}

// Store normals, colours and surface finish as normalized 8-bit values: the
// GPU reads them exactly as before, at about half the memory.
function compact(g){
  const pack=(name,Type,lo,hi)=>{const a=g.attributes[name];if(!a||a.normalized)return;const src=a.array;let ok=true;for(let i=0;i<src.length;i++)if(src[i]<lo-1e-4||src[i]>hi+1e-4){ok=false;break;}if(!ok)return;
    const max=Type===Int8Array?127:255,out=new Type(src.length);for(let i=0;i<src.length;i++)out[i]=Math.round(Math.max(lo,Math.min(hi,src[i]))*max);g.setAttribute(name,new T.BufferAttribute(out,a.itemSize,true));};
  pack('normal',Int8Array,-1,1);for(const n of ['color','rageColor','surfaceFinish'])pack(n,Uint8Array,0,1);
  return g;
}
// Built once at load. `build(templateIndex,variant,recipe)` returns a baked and
// batched rig; the head, jaw and eye geometries are kept, the rest disposed.
export function createFaceKit(templates,build){
  const faces=new Map(),palette=node=>node?.children.filter(o=>o.isMesh&&o.material.userData.bakedPalette)||[],eyesOf=node=>node?.children.find(o=>o.isMesh&&o.material.userData.enemyEyes);
  for(const [index,count] of Object.entries(FACES.variants).map(([i,c])=>[+i,c])){
    const base=templates[index];if(!base||palette(base.head).length!==1||palette(base.jaw).length!==1||!eyesOf(base.head))continue;
    const list=[];
    for(let v=0;v<count;v++){
      const recipe=faceRecipe(index,v),rig=build(index,v,recipe),head=palette(rig.head),jaw=palette(rig.jaw),eyes=eyesOf(rig.head);
      if(head.length!==1||jaw.length!==1||!eyes)continue;
      const keep=new Set([head[0].geometry,jaw[0].geometry,eyes.geometry]);
      for(const g of keep){compact(g);g.computeBoundingBox();g.computeBoundingSphere();}
      rig.group.traverse(o=>{if(o.isMesh&&!keep.has(o.geometry))o.geometry.dispose();});
      for(const g of rig.resources?.geometries||[])if(!keep.has(g))g.dispose();
      for(const m of rig.resources?.materials||[])m.dispose();
      list.push({head:head[0].geometry,jaw:jaw[0].geometry,eyes:eyes.geometry,faceSnarl:rig.faceSnarl,recipe});
    }
    faces.set(index,list);
  }
  // A shared set of eye glows (no material is made per spawn).
  const baseEyes=eyesOf(templates[0].head).material,eyePool=[];
  for(const bright of FACES.eyeBright)for(const hue of FACES.eyeHue){
    const m=baseEyes.clone();m.onBeforeCompile=baseEyes.onBeforeCompile;if(baseEyes.customProgramCacheKey)m.customProgramCacheKey=baseEyes.customProgramCacheKey;
    m.emissive.copy(baseEyes.emissive).lerp(new T.Color(FACES.ember),hue);m.emissiveIntensity=baseEyes.emissiveIntensity*bright;m.userData={...baseEyes.userData,pooledEyes:true,bright,hue};eyePool.push(m);
  }
  // Every variant and eye glow once, for warm-up at load.
  const group=new T.Group();group.name='Face variants';for(const m of eyePool)group.add(new T.Mesh(eyesOf(templates[0].head).geometry,m));
  for(const [index,list] of faces){const t=templates[index],hm=palette(t.head)[0].material,jm=palette(t.jaw)[0].material,em=eyesOf(t.head).material;for(const v of list){group.add(new T.Mesh(v.head,hm),new T.Mesh(v.jaw,jm),new T.Mesh(v.eyes,em));}}
  return {faces,group,eyePool,count:i=>faces.get(i)?.length||0};
}

// Rolled from the zombie's own seed: reproducible, no shared dice consumed.
export function rollFace(seed,variants){
  const r=seeded(seed^0x6a09e667),k=([a,b])=>a+(b-a)*r(),F=FACES;
  return {variant:Math.floor(r()*(variants+1)),scale:{x:k(F.headScale.x),y:k(F.headScale.y),z:k(F.headScale.z)},jawHang:k(F.jawHang),eye:Math.floor(r()*F.eyeBright.length*F.eyeHue.length)};
}

const own=node=>node.children.find(o=>o.isMesh&&o.material.userData.bakedPalette),eyesMesh=node=>node.children.find(o=>o.isMesh&&o.material.userData.enemyEyes);
export function applyFace(e,face,kit){
  const head=own(e.head),jaw=own(e.jaw),eyes=eyesMesh(e.head);if(!head||!jaw||!eyes)return e;
  e.faceBase={head:head.geometry,jaw:jaw.geometry,eyes:eyes.geometry,eyeMaterial:eyes.material,scale:e.head.scale.clone(),snarl:e.faceSnarl??.14};
  e.face=face;
  const v=face.variant>0?kit?.faces.get(e.templateIndex)?.[face.variant-1]:null;
  if(v){head.geometry=v.head;jaw.geometry=v.jaw;eyes.geometry=v.eyes;e.faceSnarl=v.faceSnarl;}
  e.faceSnarl=(e.faceSnarl??.14)+face.jawHang;
  e.head.scale.set(e.faceBase.scale.x*face.scale.x,e.faceBase.scale.y*face.scale.y,e.faceBase.scale.z*face.scale.z);
  // One of the shared eye glows: dimmer or hotter, blood red toward ember.
  const m=kit?.eyePool?.[face.eye%kit.eyePool.length];if(m){eyes.material=m;e.faceEyes={mesh:eyes};}
  return e;
}
// Back to the body's own head shapes (crushed skulls are made from those).
export function resetFaceGeometry(e){
  const b=e.faceBase;if(!b)return;own(e.head).geometry=b.head;own(e.jaw).geometry=b.jaw;eyesMesh(e.head).geometry=b.eyes;e.faceSnarl=b.snarl+(e.face?.jawHang||0);
}
// Everything back as it was (elite bosses keep their scripted heads).
export function clearFace(e){
  const b=e.faceBase;if(!b)return;resetFaceGeometry(e);e.faceSnarl=b.snarl;e.head.scale.copy(b.scale);
  if(e.faceEyes)e.faceEyes.mesh.material=b.eyeMaterial;
  e.face=e.faceBase=e.faceEyes=null;
}
// Faces share everything, so nothing is released per zombie.
export function disposeFace(e){e.faceEyes=null;}

import * as T from './three.module.js';

// Dead Tide's stations (v212), drawn in few calls. The mansion's station models are built from
// many small parts in a few dozen materials, and spread over the island's open ground nothing
// hides them: merged by material alone, 17 stations still drew in some two hundred calls.
// Here every still part whose material is a plain MeshStandardMaterial has its colour, finish
// (roughness and metalness) and glow (emissive × intensity) written into its vertices, and
// parts that then differ only in those share one material: those with the same textures and
// render settings. Merged by that material and 24 m cell, a station's painted parts draw in a
// call or two. The look is unchanged: the shader reads the same numbers from the vertices that
// it read from the material.
//
// Left alone: anything moving or changing (marked userData.dynamic, on itself or a parent),
// textured lettering, transparent or custom-shaded parts, and every other material type.
const DEFAULT_COMPILE=T.Material.prototype.onBeforeCompile;
const MAPS=['map','normalMap','roughnessMap','metalnessMap','bumpMap','aoMap','emissiveMap','alphaMap','lightMap','displacementMap','envMap'];
function eligible(m){
  return m&&m.type==='MeshStandardMaterial'&&!m.transparent&&m.opacity===1&&!m.alphaTest&&!m.wireframe&&!m.userData?.sign&&
    m.onBeforeCompile===DEFAULT_COMPILE&&Object.keys(m.defines||{}).every(k=>k==='STANDARD')&&m.visible&&m.colorWrite&&!m.displacementMap&&!m.lightMap;
}
// Everything but colour, finish and glow that sets how a material draws.
function paletteKey(m){
  return JSON.stringify([...MAPS.map(k=>m[k]?.uuid||''),m.side,m.shadowSide,m.flatShading,m.fog,m.toneMapped,m.depthTest,m.depthWrite,m.dithering,
    m.polygonOffset,m.polygonOffsetFactor,m.polygonOffsetUnits,m.envMapIntensity,m.normalMapType,m.normalScale?.x,m.normalScale?.y,m.bumpScale,m.aoMapIntensity,
    m.vertexColors]);
}
function paletteMaterial(from){
  const m=from.clone();m.name='Station palette';m.color.setRGB(1,1,1);m.roughness=1;m.metalness=1;m.emissive.setRGB(1,1,1);m.emissiveIntensity=1;m.vertexColors=true;
  m.userData={stationPalette:true};
  // The material's own numbers become the vertices'. (three.js's emissive uniform is
  // already multiplied by the intensity; so are the vertices.)
  m.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 surfaceFinish;attribute vec3 surfaceGlow;varying vec2 vSurfaceFinish;varying vec3 vSurfaceGlow;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvSurfaceFinish=surfaceFinish;vSurfaceGlow=surfaceGlow;');
    // (Not by redefining the uniforms' names: the lighting code has fields of the same names.)
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vSurfaceFinish;varying vec3 vSurfaceGlow;')
      .replace('#include <roughnessmap_fragment>',T.ShaderChunk.roughnessmap_fragment.replace('= roughness;','= vSurfaceFinish.x;'))
      .replace('#include <metalnessmap_fragment>',T.ShaderChunk.metalnessmap_fragment.replace('= metalness;','= vSurfaceFinish.y;'))
      .replace('vec3 totalEmissiveRadiance = emissive;','vec3 totalEmissiveRadiance = vSurfaceGlow;');
  };
  m.customProgramCacheKey=()=>'tide-station-palette';
  return m;
}
const still=(mesh,root)=>{for(let p=mesh;p&&p!==root.parent;p=p.parent)if(p.userData.dynamic)return false;return true;};

// Merges each group's meshes into one indexed mesh, added to parent in its own frame. With
// bake, the materials' colour, finish and glow are written into the vertices for the shared
// palette material; without, the meshes share their material already. Returns the new meshes.
// (Indexed, written straight into the merged buffers: no copy of each part is made first.)
const M=new T.Matrix4(),N=new T.Matrix3();
function mergeInto(parent,groups,{bake=true}={}){
  parent.updateMatrixWorld(true);
  const inverse=new T.Matrix4().copy(parent.matrixWorld).invert(),out=[];
  for(const {material,list} of groups){
    const textured=MAPS.some(k=>material[k]),colored=!bake&&material.vertexColors;let count=0,indices=0;
    for(const mesh of list){const g=mesh.geometry;count+=g.attributes.position.count;indices+=g.index?g.index.count:g.attributes.position.count;}
    const position=new Float32Array(count*3),normal=new Float32Array(count*3),uv=textured?new Float32Array(count*2):null,index=new (count>65535?Uint32Array:Uint16Array)(indices),
      color=bake||colored?new Float32Array(count*3):null,finish=bake?new Float32Array(count*2):null,glow=bake?new Float32Array(count*3):null;
    let at=0,ia=0;
    for(const mesh of list){
      const g=mesh.geometry,m=mesh.material,P=g.attributes.position,Q=g.attributes.normal,U=g.attributes.uv,C=m.vertexColors?g.attributes.color:null,n=P.count;
      M.multiplyMatrices(inverse,mesh.matrixWorld);N.getNormalMatrix(M);const e=M.elements,f=N.elements,flip=M.determinant()<0;
      // Plain arrays when the attributes are (they always are here); getX() otherwise.
      const flat=a=>a&&!a.isInterleavedBufferAttribute&&!a.normalized?a.array:null,pa=flat(P),qa=flat(Q),ua=flat(U),ca=flat(C);
      // (Only the palette's parts have a finish and glow to bake; plaques and unlit parts do not.)
      const r=m.color?.r??1,gr=m.color?.g??1,bl=m.color?.b??1,ro=m.roughness,me=m.metalness,gi=m.emissiveIntensity??1,er=(m.emissive?.r??0)*gi,eg=(m.emissive?.g??0)*gi,eb=(m.emissive?.b??0)*gi;
      for(let v=0;v<n;v++){
        const k=(at+v)*3,v3=v*3;
        const x=pa?pa[v3]:P.getX(v),y=pa?pa[v3+1]:P.getY(v),z=pa?pa[v3+2]:P.getZ(v);
        position[k]=e[0]*x+e[4]*y+e[8]*z+e[12];position[k+1]=e[1]*x+e[5]*y+e[9]*z+e[13];position[k+2]=e[2]*x+e[6]*y+e[10]*z+e[14];
        const a=qa?qa[v3]:Q.getX(v),b=qa?qa[v3+1]:Q.getY(v),c=qa?qa[v3+2]:Q.getZ(v),nx=f[0]*a+f[3]*b+f[6]*c,ny=f[1]*a+f[4]*b+f[7]*c,nz=f[2]*a+f[5]*b+f[8]*c,l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;
        normal[k]=nx/l;normal[k+1]=ny/l;normal[k+2]=nz/l;
        if(uv&&U){uv[(at+v)*2]=ua?ua[v*2]:U.getX(v);uv[(at+v)*2+1]=ua?ua[v*2+1]:U.getY(v);}
        if(color){const cr=C?(ca?ca[v3]:C.getX(v)):1,cg=C?(ca?ca[v3+1]:C.getY(v)):1,cb=C?(ca?ca[v3+2]:C.getZ(v)):1;
          if(bake){color[k]=r*cr;color[k+1]=gr*cg;color[k+2]=bl*cb;}else{color[k]=cr;color[k+1]=cg;color[k+2]=cb;}}
        if(bake){finish[(at+v)*2]=ro;finish[(at+v)*2+1]=me;glow[k]=er;glow[k+1]=eg;glow[k+2]=eb;}
      }
      // A mirrored part's triangles turn the other way round once its mirroring is baked in.
      const I=g.index,ic=I?I.count:n;
      const ix=I?I.array:null;
      for(let t=0;t<ic;t+=3)for(let j=0;j<3;j++){const src=t+(flip?2-j:j);index[ia+t+j]=at+(ix?ix[src]:src);}
      at+=n;ia+=ic;
    }
    const geo=new T.BufferGeometry();geo.setIndex(new T.BufferAttribute(index,1));
    geo.setAttribute('position',new T.BufferAttribute(position,3));geo.setAttribute('normal',new T.BufferAttribute(normal,3));
    if(uv)geo.setAttribute('uv',new T.BufferAttribute(uv,2));
    if(color)geo.setAttribute('color',new T.BufferAttribute(color,3));
    if(bake){geo.setAttribute('surfaceFinish',new T.BufferAttribute(finish,2));geo.setAttribute('surfaceGlow',new T.BufferAttribute(glow,3));}
    geo.computeBoundingSphere();geo.computeBoundingBox();
    const mesh=new T.Mesh(geo,material);mesh.name='Station parts';mesh.castShadow=list.some(m=>m.castShadow);mesh.receiveShadow=list.some(m=>m.receiveShadow);
    mesh.userData={...list[0].userData};parent.add(mesh);out.push(mesh);
    for(const m of list)m.parent.remove(m);
  }
  return out;
}
const shared=new Map();
const keys=new WeakMap();
function sharedMaterial(m){let key=keys.get(m);if(key===undefined){key=paletteKey(m);keys.set(m,key);}let material=shared.get(key);if(!material){material=paletteMaterial(m);shared.set(key,material);}return material;}
const usable=(mesh,textured)=>mesh.isMesh&&!mesh.isInstancedMesh&&!mesh.isSkinnedMesh&&mesh.visible&&eligible(mesh.material)&&(textured||!MAPS.some(k=>mesh.material[k]));

// Bakes and merges root's eligible still parts in place, by shared material and cell.
export function mergeStationPalette(root,{cell=24,textured=true}={}){
  root.updateMatrixWorld(true);
  const buckets=new Map(),p=new T.Vector3();
  root.traverse(mesh=>{
    if(!usable(mesh,textured)||!still(mesh,root))return;
    const material=sharedMaterial(mesh.material);p.setFromMatrixPosition(mesh.matrixWorld);
    const bucket=material.uuid+':'+Math.floor(p.x/cell)+':'+Math.floor(p.z/cell)+':'+mesh.castShadow;
    if(!buckets.has(bucket))buckets.set(bucket,{material,list:[]});buckets.get(bucket).list.push(mesh);
  });
  return mergeInto(root,buckets.values());
}
// A model shown or hidden whole (the armour on its stand, a Nano Shield emitter), merged within
// itself: it still shows and hides as one. Only for models whose colours never change.
export function mergeModelPalette(model,{textured=true}={}){
  const groups=new Map();
  model.traverse(mesh=>{if(!usable(mesh,textured))return;const material=sharedMaterial(mesh.material);if(!groups.has(material))groups.set(material,{material,list:[]});groups.get(material).list.push(mesh);});
  return mergeInto(model,[...groups.values()].filter(g=>g.list.length>1));
}

// The rest of root's still parts (textured, or drawn unlit), merged by their own material and
// cell, as batching.mjs's batchStatic merges the mansion's, but indexed and without copies.
export function mergeStationParts(root,{cell=24,skip=()=>false}={}){
  root.updateMatrixWorld(true);
  const buckets=new Map(),p=new T.Vector3();
  root.traverse(mesh=>{
    if(!mesh.isMesh||mesh.isInstancedMesh||mesh.isSkinnedMesh||!mesh.visible||mesh.parent===root||!still(mesh,root)||skip(mesh))return;
    const g=mesh.geometry;if(Array.isArray(mesh.material)||!g.attributes.normal||Object.keys(g.morphAttributes||{}).length)return;
    p.setFromMatrixPosition(mesh.matrixWorld);
    const bucket=mesh.material.uuid+':'+Math.floor(p.x/cell)+':'+Math.floor(p.z/cell)+':'+mesh.castShadow;
    if(!buckets.has(bucket))buckets.set(bucket,{material:mesh.material,list:[]});buckets.get(bucket).list.push(mesh);
  });
  return mergeInto(root,[...buckets.values()].filter(b=>b.list.length>1),{bake:false});
}

// The plaques' lettering, likewise: each plaque is its own canvas texture (signage.mjs), so
// two dozen still plaques were two dozen textures and draw calls. Their canvases are packed
// into one atlas, in rows, and the plaques of a 24 m cell drawn as one mesh. Plaques whose
// text changes (the Forge's rank, the armour's price: under a dynamic parent) stay apart.
export function mergeStationPlaques(root,{cell=24,width=2048,pad=6,makeCanvas=()=>document.createElement('canvas')}={}){
  root.updateMatrixWorld(true);
  const plaques=[];
  root.traverse(mesh=>{if(mesh.isMesh&&mesh.material?.userData?.sign&&mesh.material.map?.image&&mesh.geometry.attributes.uv&&still(mesh,root))plaques.push(mesh);});
  if(plaques.length<2)return {replaced:[],merged:[],texture:null};
  // Shelf packing, tallest first: each distinct texture once.
  const images=[...new Set(plaques.map(m=>m.material.map))].sort((a,b)=>b.image.height-a.image.height||b.image.width-a.image.width),rect=new Map();
  let x=0,y=0,row=0;
  for(const t of images){const w=t.image.width,h=t.image.height;if(x+w>width){x=0;y+=row+pad;row=0;}rect.set(t,{x,y,w,h});x+=w+pad;row=Math.max(row,h);}
  const canvas=makeCanvas();canvas.width=width;canvas.height=y+row;
  const ctx=canvas.getContext('2d');
  for(const [t,r] of rect){
    // The plaque, then its edge pixels stretched into the gap, so its far-off mipmaps keep its colour.
    ctx.drawImage(t.image,r.x,r.y);
    ctx.drawImage(t.image,0,0,1,r.h,Math.max(0,r.x-pad/2),r.y,pad/2,r.h);ctx.drawImage(t.image,r.w-1,0,1,r.h,r.x+r.w,r.y,pad/2,r.h);
    ctx.drawImage(t.image,0,0,r.w,1,r.x,Math.max(0,r.y-pad/2),r.w,pad/2);ctx.drawImage(t.image,0,r.h-1,r.w,1,r.x,r.y+r.h,r.w,pad/2);
  }
  const first=images[0],texture=new T.CanvasTexture(canvas);texture.name='Sign atlas / Dead Tide stations';
  texture.colorSpace=first.colorSpace;texture.anisotropy=first.anisotropy;texture.minFilter=first.minFilter;texture.magFilter=first.magFilter;
  const material=new T.MeshBasicMaterial({map:texture,toneMapped:false});material.name='Sign atlas';
  material.userData.signAtlas={texts:images.map(t=>t.name.replace(/^Sign \/ /,''))};
  const buckets=new Map(),p=new T.Vector3();
  for(const mesh of plaques){p.setFromMatrixPosition(mesh.matrixWorld);const k=Math.floor(p.x/cell)+':'+Math.floor(p.z/cell);if(!buckets.has(k))buckets.set(k,[]);buckets.get(k).push(mesh);}
  const H=canvas.height,replaced=[],merged=[];
  for(const list of buckets.values()){
    // Merged as the painted parts are, then each plaque's corners moved onto its place in the atlas.
    const [mesh]=mergeInto(root,[{material,list}],{bake:false});mesh.name='Station plaques';mesh.castShadow=mesh.receiveShadow=false;
    const uv=mesh.geometry.attributes.uv;let at=0;
    for(const m of list){const r=rect.get(m.material.map),n=m.geometry.attributes.position.count;
      // The texture is flipped (flipY): v = 1 is the canvas's top row.
      for(let v=at;v<at+n;v++)uv.setXY(v,(r.x+uv.getX(v)*r.w)/width,1-(r.y+(1-uv.getY(v))*r.h)/H);
      at+=n;replaced.push(m);}
    merged.push(mesh);
  }
  return {replaced,merged,texture};
}

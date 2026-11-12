import * as T from './three.module.js';

// Dead Tide's island art (v215, the art pass; design spec 10.4). The island's textures
// (assets/island/*.webp, painted by scripts/island-textures.mjs), the materials that wear
// them, and the plants' and rocks' shapes. Loaded only by Dead Tide (island.mjs and tide.mjs);
// nothing here reaches the mansion.
//
// Three kinds of material, each one shader program however many materials use it:
//   textured(name)  structures and props: the texture laid on in world space from three
//                   sides (triplanar), so merged and scaled parts need no UVs and never
//                   stretch; its own shading lends a little relief (a bump from its brightness).
//   terrain()       the ground: sand, grass, earth and rock blended by weights painted into
//                   the ground's vertices, the rock laid on from three sides for the cliffs.
//   foliage(name)   fronds, ferns, grass, vines and leaves: alpha-cut cards, both sides lit,
//                   swaying a little in the wind.
export const ISLAND_TEXTURES=Object.freeze(['sand','grass','dirt','rock','concrete','camo','stone','paving','rust','wood','thatch','cloth','bark','frond','fern','tuft','vines','leaves','stencil']);
const CARDS=new Set(['frond','fern','tuft','vines','leaves','stencil']);
// How many metres each texture spans.
export const TILE=Object.freeze({sand:5,grass:4.5,dirt:4,rock:6,concrete:2.6,camo:3.4,stone:2.4,paving:3,rust:2.4,wood:2,thatch:1.6,cloth:1.4,bark:1});
// Average colours, for the stand-ins when no image can be decoded (the tests).
const AVERAGE={sand:0xc8b998,grass:0x46602f,dirt:0x6c5a44,rock:0x75746e,concrete:0x8f8e86,camo:0x8a7a58,stone:0x8a887c,paving:0x87847a,rust:0x6a3a22,wood:0x7d7262,thatch:0x7d6a44,cloth:0x77735a,bark:0x6a5c4a,frond:0x3c5c30,fern:0x3e6230,tuft:0x56743a,vines:0x3a5a2c,leaves:0x3a5e2e,stencil:0x161614};

// The textures, loaded once. Without an image decoder (tests, workers) each is a 1×1 stand-in.
function setup(t,name,anisotropy){t.name='island-'+name;t.colorSpace=T.SRGBColorSpace;t.anisotropy=anisotropy;
  t.wrapS=t.wrapT=CARDS.has(name)?T.ClampToEdgeWrapping:T.RepeatWrapping;
  t.minFilter=T.LinearMipmapLinearFilter;t.magFilter=T.LinearFilter;t.generateMipmaps=true;t.userData.tileMeters=TILE[name]??1;return t;}
function standIn(name){const c=new T.Color(AVERAGE[name]),t=new T.DataTexture(new Uint8Array([c.r*255,c.g*255,c.b*255,255]),1,1);t.needsUpdate=true;setup(t,name,1);t.generateMipmaps=false;t.minFilter=T.LinearFilter;return t;}
// A flat colour for every texture: what the island wears where no picture can be loaded.
export function standInTextures(){return Object.fromEntries(ISLAND_TEXTURES.map(name=>[name,standIn(name)]));}
// Where each texture is, spelled out so the release tooling's map of what each page loads can see them.
const TEXTURE_URLS=Object.freeze({sand:'./assets/island/sand.webp?v=215',grass:'./assets/island/grass.webp?v=215',dirt:'./assets/island/dirt.webp?v=215',rock:'./assets/island/rock.webp?v=215',concrete:'./assets/island/concrete.webp?v=215',camo:'./assets/island/camo.webp?v=215',stone:'./assets/island/stone.webp?v=215',paving:'./assets/island/paving.webp?v=215',rust:'./assets/island/rust.webp?v=215',wood:'./assets/island/wood.webp?v=215',thatch:'./assets/island/thatch.webp?v=215',cloth:'./assets/island/cloth.webp?v=215',bark:'./assets/island/bark.webp?v=215',frond:'./assets/island/frond.webp?v=215',fern:'./assets/island/fern.webp?v=215',tuft:'./assets/island/tuft.webp?v=215',vines:'./assets/island/vines.webp?v=215',leaves:'./assets/island/leaves.webp?v=215',stencil:'./assets/island/stencil.webp?v=215'});
export async function loadIslandTextures({anisotropy=8}={}){
  if(typeof Image!=='function'||typeof document==='undefined'||typeof createImageBitmap!=='function')return standInTextures();
  const loader=new T.TextureLoader(),out={};
  await Promise.all(ISLAND_TEXTURES.map(async name=>{
    try{out[name]=setup(await loader.loadAsync(TEXTURE_URLS[name]),name,anisotropy);}catch{out[name]=standIn(name);}
  }));
  return out;
}

// Shared by every island material: the wind's clock.
export const ART_UNIFORMS={time:{value:0}};

// The bump from a texture's brightness, the way three.js does a bump map, without UVs.
const PERTURB=`vec3 islandPerturb(vec3 surfPos,vec3 surfNorm,vec2 dHdxy,float faceDir){
  vec3 sx=normalize(dFdx(surfPos)),sy=normalize(dFdy(surfPos)),r1=cross(sy,surfNorm),r2=cross(surfNorm,sx);
  float det=dot(sx,r1)*faceDir;vec3 grad=sign(det)*(dHdxy.x*r1+dHdxy.y*r2);return normalize(abs(det)*surfNorm-grad);}
float islandLum(vec3 c){return dot(c,vec3(.299,.587,.114));}`;
// World position and normal, for anything laid on in world space (instanced or not).
const WORLD_VERTEX=`vec4 islandWorld=vec4(transformed,1.);vec3 islandN=objectNormal;
#ifdef USE_INSTANCING
islandWorld=instanceMatrix*islandWorld;islandN=mat3(instanceMatrix)*islandN;
#endif
islandWorld=modelMatrix*islandWorld;vIslandPos=islandWorld.xyz;vIslandNormal=normalize(mat3(modelMatrix)*islandN);`;
function worldVaryings(shader){
  shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vIslandPos;varying vec3 vIslandNormal;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\n'+WORLD_VERTEX);
  shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vIslandPos;varying vec3 vIslandNormal;\n'+PERTURB);
}
function bumpAfterNormals(shader){
  shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\nnormal=islandPerturb(-vViewPosition,normal,vec2(dFdx(islandH),dFdy(islandH))*islandBump,faceDirection);');
}

// A structure's or prop's material: `name`'s texture laid on in world space from three sides,
// tinted by `color`, and (with vertexColors) by each vertex's colour too.
export function textured(tex,name,{color=0xffffff,roughness=.9,metalness=0,bump=.9,scale=1,vertexColors=false,emissive=0x000000,side=T.FrontSide}={}){
  const map=tex[name],m=new T.MeshStandardMaterial({color,roughness,metalness,vertexColors,emissive,side});
  m.name='island-'+name;m.userData.islandTexture=name;
  const uniforms={islandMap:{value:map},islandScale:{value:1/((TILE[name]??1)*scale)},islandBump:{value:bump*.012}};
  m.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);worldVaryings(shader);bumpAfterNormals(shader);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D islandMap;uniform float islandScale;uniform float islandBump;')
      .replace('#include <map_fragment>',`vec3 bw=pow(abs(normalize(vIslandNormal)),vec3(4.));bw/=bw.x+bw.y+bw.z;vec3 p=vIslandPos*islandScale;
vec3 islandTex=texture2D(islandMap,p.zy).rgb*bw.x+texture2D(islandMap,p.xz).rgb*bw.y+texture2D(islandMap,vec2(p.x,-p.y)).rgb*bw.z;
float islandH=islandLum(islandTex);diffuseColor.rgb*=islandTex*1.6;`);
  };
  m.customProgramCacheKey=()=>'island-textured-215';
  m.userData.uniforms=uniforms;
  return m;
}

// The ground: four textures blended by the vertices' `splat` weights (sand, grass, earth, rock),
// each brightest grain winning at the borders, and the vertices' colours as a tint.
export function terrain(tex){
  const m=new T.MeshStandardMaterial({color:0xffffff,roughness:.96,metalness:0,vertexColors:true});m.name='island-terrain';
  const uniforms={tSand:{value:tex.sand},tGrass:{value:tex.grass},tDirt:{value:tex.dirt},tRock:{value:tex.rock},
    islandScales:{value:new T.Vector4(1/TILE.sand,1/TILE.grass,1/TILE.dirt,1/TILE.rock)},islandBump:{value:.014},
    // How bright each ground reads under the moon: pale sand would glare like snow at the shader's other gains.
    islandGains:{value:new T.Vector4(.82,1.55,1.4,1.05)}};
  m.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms);worldVaryings(shader);bumpAfterNormals(shader);
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 splat;varying vec4 vSplat;').replace('#include <begin_vertex>','#include <begin_vertex>\nvSplat=splat;');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tSand;uniform sampler2D tGrass;uniform sampler2D tDirt;uniform sampler2D tRock;uniform vec4 islandScales;uniform vec4 islandGains;uniform float islandBump;varying vec4 vSplat;')
      .replace('#include <map_fragment>',`vec2 xz=vIslandPos.xz;vec4 sc=islandScales;
// Two scales of each of the soft grounds, so their tiles do not show from afar.
vec3 sandT=mix(texture2D(tSand,xz*sc.x).rgb,texture2D(tSand,xz*sc.x*.23+.37).rgb,.35);
vec3 grassT=mix(texture2D(tGrass,xz*sc.y).rgb,texture2D(tGrass,xz*sc.y*.27+.61).rgb,.4);
vec3 dirtT=mix(texture2D(tDirt,xz*sc.z).rgb,texture2D(tDirt,xz*sc.z*.31+.13).rgb,.3);
vec3 bw=pow(abs(normalize(vIslandNormal)),vec3(4.));bw/=bw.x+bw.y+bw.z;vec3 rp=vIslandPos*sc.w;
vec3 rockT=texture2D(tRock,rp.zy).rgb*bw.x+texture2D(tRock,rp.xz).rgb*bw.y+texture2D(tRock,rp.xy).rgb*bw.z;
vec4 w=max(vSplat,0.)*(vec4(islandLum(sandT),islandLum(grassT),islandLum(dirtT),islandLum(rockT))*1.3+.25);w=w*w*w;w/=max(1e-5,w.x+w.y+w.z+w.w);
vec3 islandTex=sandT*w.x+grassT*w.y+dirtT*w.z+rockT*w.w;float islandH=islandLum(islandTex);diffuseColor.rgb*=islandTex*dot(w,islandGains);`);
  };
  m.customProgramCacheKey=()=>'island-terrain-215';
  return m;
}

// Alpha-cut plant cards, lit on both sides, swaying: `sway` metres at a card's top per
// metre of height (the wind leans the tops more than the bottoms).
export function foliage(tex,name,{color=0xffffff,sway=.05,roughness=.85}={}){
  const m=new T.MeshStandardMaterial({map:tex[name],color,roughness,metalness:0,alphaTest:.45,side:T.DoubleSide});m.name='island-'+name;
  const uniforms={islandSway:{value:sway}};
  m.onBeforeCompile=shader=>{
    Object.assign(shader.uniforms,uniforms,{islandTime:ART_UNIFORMS.time});
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float islandTime;uniform float islandSway;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
{vec3 base=vec3(0.);
#ifdef USE_INSTANCING
base=instanceMatrix[3].xyz;
#endif
base=(modelMatrix*vec4(base,1.)).xyz;float k=(max(transformed.y,0.)+length(transformed.xz)*.5)*islandSway;
transformed.x+=k*(sin(islandTime*1.3+base.x*.21+base.z*.13)+.4*sin(islandTime*2.9+base.z*.37));
transformed.z+=k*.7*sin(islandTime*1.1+base.z*.19-base.x*.07);}`);
    // Both faces lit alike: a leaf's back is not turned away from the sky.
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);');
  };
  m.customProgramCacheKey=()=>'island-foliage-215';
  return m;
}

// ---- Shapes ------------------------------------------------------------------------------------
function build(pos,uv,nor,index){const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
  if(nor)g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));if(index)g.setIndex(index);if(!nor)g.computeVertexNormals();g.computeBoundingSphere();return g;}
// One arching strip: from `origin`, out along `dir` (horizontal), rising then falling as
// `arc(t)` says, `width(t)` wide; its texture's u along it, v across (the card's middle at v .5).
function strip(pos,uv,nor,index,origin,dir,len,arc,width,segs=6,upNormal=.55){
  const side=new T.Vector3(-dir.z,0,dir.x),start=pos.length/3;
  for(let s=0;s<=segs;s++){const t=s/segs,c=new T.Vector3().copy(origin).addScaledVector(dir,t*len);c.y+=arc(t);const w=width(t);
    for(const k of [-1,1]){const p=c.clone().addScaledVector(side,k*w);pos.push(p.x,p.y,p.z);uv.push(t,.5+k*.5);
      // Normals lean up so the cards light like a canopy, not like flat sheets.
      const n=new T.Vector3(0,1,0).multiplyScalar(upNormal).addScaledVector(side,k*(1-upNormal)*.3).normalize();nor.push(n.x,n.y,n.z);}}
  for(let s=0;s<segs;s++){const a=start+s*2;index.push(a,a+2,a+1,a+1,a+2,a+3);}
}
// A palm's crown: eight drooping fronds and three young ones still rising, from the top of the trunk.
export function palmCrownGeometry(seed=1){
  const pos=[],uv=[],nor=[],index=[];let s=seed;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let f=0;f<11;f++){const young=f>=8,a=f/(young?3:8)*Math.PI*2+(young?.4:0)+r()*.3,dir=new T.Vector3(Math.cos(a),0,Math.sin(a)),len=young?1.8:2.7+r()*.6;
    const droop=young?-.2:1.4+r()*.5,rise=young?1.2:.55;
    strip(pos,uv,nor,index,new T.Vector3(0,0,0),dir,len,t=>rise*Math.sin(t*2.1)-droop*t*t,t=>(young?.32:.62)*Math.sin(Math.PI*Math.min(1,.12+t*.95)),7);}
  return build(pos,uv,nor,index);
}
// A fern clump: seven fronds arching out from the middle.
export function fernGeometry(){
  const pos=[],uv=[],nor=[],index=[];
  for(let f=0;f<7;f++){const a=f/7*Math.PI*2+(f%2)*.3,dir=new T.Vector3(Math.cos(a),0,Math.sin(a)),len=.85+(f%3)*.15;
    strip(pos,uv,nor,index,new T.Vector3(0,.05,0),dir,len,t=>.55*Math.sin(t*2.4)-.25*t*t,t=>.24*Math.sin(Math.PI*Math.min(1,.1+t)),5,.7);}
  return build(pos,uv,nor,index);
}
// A tuft of grass: three crossed cards, a metre wide and tall (scaled per tuft).
export function tuftGeometry(){
  const pos=[],uv=[],nor=[],index=[];
  for(let k=0;k<3;k++){const a=k/3*Math.PI,cx=Math.cos(a)*.5,cz=Math.sin(a)*.5,b=pos.length/3;
    pos.push(-cx,0,-cz, cx,0,cz, -cx,1,-cz, cx,1,cz);uv.push(0,0,1,0,0,1,1,1);for(let i=0;i<4;i++)nor.push(0,1,0);index.push(b,b+1,b+2,b+2,b+1,b+3);}
  return build(pos,uv,nor,index);
}
// A leafy shrub: a dome of leaf cards round its middle.
export function shrubGeometry(seed=3){
  const pos=[],uv=[],nor=[],index=[];let s=seed;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;};
  for(let k=0;k<12;k++){const a=k*2.4+r(),tilt=.3+r()*.9,cy=.25+r()*.5,size=.55+r()*.35,b=pos.length/3;
    const q=new T.Quaternion().setFromEuler(new T.Euler(tilt*(r()<.5?-1:1),a,0)),c=new T.Vector3(Math.cos(a)*.35,cy,Math.sin(a)*.35);
    const corners=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([x,y])=>new T.Vector3(x*size,y*size,0).applyQuaternion(q).add(c));
    for(const p of corners){pos.push(p.x,Math.max(0,p.y),p.z);const n=p.clone().sub(new T.Vector3(0,.2,0)).normalize();nor.push(n.x,n.y*.5+.5,n.z);}
    uv.push(0,0,1,0,0,1,1,1);index.push(b,b+1,b+2,b+2,b+1,b+3);}
  return build(pos,uv,nor,index);
}
// A curtain of vines hanging from y 0 down `drop` metres, `width` wide (its u across, v down).
export function vineGeometry(width=1,drop=1.6){return build([-width/2,0,0, width/2,0,0, -width/2,-drop,0, width/2,-drop,0],[0,1,1,1,0,0,1,0],[0,0,1,0,0,1,0,0,1,0,0,1],[0,2,1,1,2,3]);}
// A weathered boulder: a twice-split icosahedron, its corners pushed in and out by a seeded
// lumpiness (the same at a shared corner, so it stays closed), flat-shaded.
export function boulderGeometry(seed=5){
  const g=new T.IcosahedronGeometry(1,1),p=g.attributes.position,v=new T.Vector3();
  const lump=(x,y,z)=>{const h=Math.sin(x*3.1+seed)*Math.sin(y*2.7-seed*.5)*Math.sin(z*3.3+seed*1.7);return 1+.22*h+.1*Math.sin(x*7.3+y*5.1+z*6.7+seed);};
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const k=lump(v.x,v.y,v.z);p.setXYZ(i,v.x*k,v.y*k*(v.y<0?.6:1),v.z*k);}
  g.computeVertexNormals();g.computeBoundingSphere();return g;
}

// A freighter's hull (v215, the wreck), keel at y 0, bow toward +x, from `length` × `beam`,
// `depth` to the deck amidships: lofted through stations along her, each a section from one
// bulwark's top down round the bilge to the keel and up to the other's. The bow rises into a
// forecastle and is cut away below; the stern ends in a transom. The deck lies between the
// bulwarks with holes rusted through it. Vertex colours darken her lower hull (the boot top).
// Open shapes: draw it double-sided.
export function hullGeometry({length=13,beam=4.2,depth=2.4,holes=[]}={}){
  const N=30,pos=[],col=[],index=[],half=beam/2,L=length;
  const width=t=>{let w=half;if(t>.66)w*=Math.max(.02,1-Math.pow((t-.66)/.34,1.7));if(t<.05)w*=.9+t*2;return w;};
  const deck=t=>depth+.22*Math.pow(2*t-1,2)+(t>.8?1.1*(t-.8)/.2:0);
  const keel=t=>t>.8?Math.pow((t-.8)/.2,1.4)*depth*.8:t<.04?(.04-t)*6:0;
  const rows=[];
  for(let i=0;i<=N;i++){const t=i/N,x=-L/2+t*L,w=width(t),d=deck(t),k=keel(t);
    const side=[[w,d+.75],[w,d],[w*.985,k+(d-k)*.55],[w*.86,k+.38],[w*.52,k+.05]],row=[];
    const ring=[...side.map(([z,y])=>[-z,y]),[0,k],...side.slice().reverse()];
    for(const [z,y] of ring){row.push(pos.length/3);pos.push(x,y,z);const boot=y<1.1?.62:1;col.push(boot,boot*.92,boot*.9);}
    rows.push(row);}
  const M=rows[0].length;
  for(let i=0;i<N;i++)for(let j=0;j<M-1;j++){const a=rows[i][j],b=rows[i+1][j],c=rows[i][j+1],d=rows[i+1][j+1];index.push(a,b,c,c,b,d);}
  // The transom: a fan across the stern's section.
  {const c0=pos.length/3;pos.push(-L/2,deck(0)*.5,0);col.push(1,1,1);for(let j=0;j<M-1;j++)index.push(c0,rows[0][j+1],rows[0][j]);}
  // The deck, plate by plate, but for the holes ([from, to] along her, as fractions).
  for(let i=0;i<N;i++){const t0=i/N,t1=(i+1)/N;if(holes.some(([a,b])=>t1>a&&t0<b))continue;
    const a=pos.length/3;for(const t of [t0,t1])for(const s of [-1,1]){pos.push(-L/2+t*L,deck(t)-.02,s*width(t)*.97);col.push(1,1,1);}
    index.push(a,a+2,a+1,a+1,a+2,a+3);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();
  g.userData.deck=deck;g.userData.width=width;return g;
}
// A column shaft (v215, the ruin): fluted, standing on y 0, `height` tall; `broken` metres of
// jagged loss off its top (0: whole). Tapers a little upward, as an ancient shaft does.
export function columnGeometry({radius=.42,height=3,flutes=20,broken=0,seed=1}={}){
  const g=new T.CylinderGeometry(radius*.88,radius,height,flutes*4,8),p=g.attributes.position,v=new T.Vector3();
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);const r=Math.hypot(v.x,v.z),a=Math.atan2(v.z,v.x);
    let k=1;if(r>1e-4)k=1-.06*Math.pow(.5+.5*Math.cos(a*flutes),2);
    let y=v.y+height/2;if(broken>0&&y>height-1e-3)y=height-broken*(.35+.35*Math.sin(a*3+seed)+.3*Math.sin(a*7-seed*2));
    else if(broken>0&&y>height-broken*.4)y-=broken*.15*(.5+.5*Math.sin(a*5+seed));
    p.setXYZ(i,v.x*k,y,v.z*k);}
  g.computeVertexNormals();g.computeBoundingSphere();return g;
}

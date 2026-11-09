import * as T from './three.module.js';
import {combineMeshes} from './batching.mjs?v=204';

// Dead Tide's island (v204, Dead Tide step 2): the grey-box map. A central hill with the
// radio shack and a lattice tower on its flat top, a lowland ring, beaches all round,
// a wreck run aground on the south-east beach, palms, rocks, and the sea with its
// shallows and surf. Blockout shapes only; the art comes in step 5.
//
// Nothing here touches the mansion: the island is its own map, and the shared modules
// (player.mjs, weapon-runtime.mjs, enemy-combat.mjs) reach it only through the level
// functions buildIsland returns. North is -z, as in the mansion; y is height above the
// sea, which sits at 0.
export const ISLAND=Object.freeze({
  // The coast's distance from the centre wobbles with the bearing (radius, then
  // amplitude, frequency and phase of each wobble), between about 51 and 78 m.
  coast:Object.freeze({radius:64,waves:Object.freeze([[7,2,.6],[5,3,-1.1],[2.5,5,2]])}),
  lowland:2.2,           // inland ground height (m)
  seabed:2.2,            // depth of the open sea floor (m)
  shore:Object.freeze([.5,1.5]),  // the land falls to the seabed between these fractions of the coast radius
  hill:Object.freeze({x:-4,z:-8,top:12,flat:8,foot:38}),  // a 12 m hill, flat within 8 m, gone by 38 m
  wade:.8,               // the deepest water the player can wade into (m)
  bounds:120,            // half-width of the square nothing leaves (m)
  step:.31,              // the tallest step the player walks up
  spawn:Object.freeze({x:0,z:46.5,yaw:.073}),  // the south beach, facing the hill
  tower:Object.freeze({x:-7,z:-11,height:24,base:3.4,top:.9}),
  shack:Object.freeze({x:-.5,z:-5.8,w:5.2,d:4.2,deck:.28,wall:2.45,door:1.25}),
  wreck:Object.freeze({bearing:.75,at:.97,length:13,beam:4.2,roll:.42,sink:.9}),
  beacon:Object.freeze({period:1.6,on:.55})   // the tower's red light: on .55 s of every 1.6 s
});
const {coast:COAST,hill:HILL,lowland:LOW,seabed:DEEP}=ISLAND;
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export function coastRadius(bearing){let r=COAST.radius;for(const [a,f,p] of COAST.waves)r+=a*Math.sin(f*bearing+p);return r;}
// How far out from the centre a point is, as a fraction of the coast radius on its bearing.
export function shoreFraction(x,z){return Math.hypot(x,z)/coastRadius(Math.atan2(z,x));}
function hillHeight(x,z){const d=Math.hypot(x-HILL.x,z-HILL.z),u=Math.min(1,Math.max(0,(d-HILL.flat)/(HILL.foot-HILL.flat)));return HILL.top*(.5+.5*Math.cos(Math.PI*u));}
// The ground's height (m) anywhere: lowland, falling through the beach to the seabed,
// with the hill and gentle swells on the land (none on the hill's flat top).
export function groundHeight(x,z){
  const t=shoreFraction(x,z),fall=smooth(ISLAND.shore[0],ISLAND.shore[1],t),land=1-fall;
  const d=Math.hypot(x-HILL.x,z-HILL.z),swell=(.35*Math.sin(x*.19+1.3)*Math.sin(z*.23-.7)+.22*Math.sin(x*.41-z*.33+2.1))*smooth(HILL.flat+4,HILL.flat+14,d);
  // The swells die away behind the beach, so the sand meets the sea on an even slope.
  return LOW-(LOW+DEEP)*fall+hillHeight(x,z)*land+swell*smooth(.92,.7,t);
}
// Small seeded random numbers, so the island is the same on every load.
function seeded(seed){return ()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}

export function buildIsland({scene,world}){
  const colliders=[],platforms=[],solidMeshes=[],lights=[];
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.92,metalness:0,...extra});
  const S=ISLAND.shack,W=ISLAND.tower,summit=groundHeight(HILL.x,HILL.z);

  // ---- The ground ---------------------------------------------------------------------
  // 1.5 m squares in 30 m chunks out to 90 m; chunks wholly under the sea are left out.
  // Normals come from the height function, so chunk edges join without a seam.
  const SPACING=1.5,CHUNK=20,EXTENT=90,groundMat=material(0xffffff,{vertexColors:true,roughness:.97});
  const sand=new T.Color(0xbcae8e),wetSand=new T.Color(0x756a55),scrub=new T.Color(0x34492f),dryScrub=new T.Color(0x5b6143),dirt=new T.Color(0x6b5c47),rock=new T.Color(0x666962),c=new T.Color();
  function groundColor(x,z,h,slope){
    const t=shoreFraction(x,z),patch=.5+.5*Math.sin(x*.31+z*.17)*Math.sin(z*.27-x*.11);
    c.copy(wetSand).lerp(sand,smooth(-.1,.55,h));                                        // wet near the water, dry up the beach
    c.lerp(dryScrub,Math.min(1,smooth(.9,.76,t)*(.45+patch*.8)));                        // dune grass in patches behind the beach
    c.lerp(scrub,smooth(.8,.62,t)*smooth(1.4,2,h)*(.55+.45*patch));                      // scrub inland
    if(Math.hypot(x-HILL.x,z-HILL.z)<HILL.flat+1.5)c.lerp(dirt,.85);                    // the beaten summit
    c.lerp(rock,smooth(.35,.6,slope));                                                   // bare rock on the steep parts
    return c;
  }
  const chunks=Math.ceil(EXTENT*2/(SPACING*CHUNK));
  for(let cz=0;cz<chunks;cz++)for(let cx=0;cx<chunks;cx++){
    const x0=-EXTENT+cx*CHUNK*SPACING,z0=-EXTENT+cz*CHUNK*SPACING,n=CHUNK+1;
    const pos=new Float32Array(n*n*3),nor=new Float32Array(n*n*3),col=new Float32Array(n*n*3),uv=new Float32Array(n*n*2);let dry=false;
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const x=x0+i*SPACING,z=z0+j*SPACING,h=groundHeight(x,z),k=j*n+i;
      const gx=(groundHeight(x+.5,z)-groundHeight(x-.5,z)),gz=(groundHeight(x,z+.5)-groundHeight(x,z-.5)),len=Math.hypot(gx,1,gz);
      pos.set([x,h,z],k*3);nor.set([-gx/len,1/len,-gz/len],k*3);uv.set([x/8,z/8],k*2);
      groundColor(x,z,h,Math.hypot(gx,gz)).toArray(col,k*3);if(h>-.25)dry=true;
    }
    if(!dry)continue;
    const index=[];for(let j=0;j<CHUNK;j++)for(let i=0;i<CHUNK;i++){const a=j*n+i,b=a+1,d=a+n,e=d+1;index.push(a,d,b,b,d,e);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(nor,3));geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setIndex(index);geo.computeBoundingSphere();geo.computeBoundingBox();
    const mesh=new T.Mesh(geo,groundMat);mesh.name='Island ground';mesh.receiveShadow=true;world.add(mesh);solidMeshes.push(mesh);
  }

  // ---- The sea --------------------------------------------------------------------------
  // One flat sheet at y=0. Its shader reads the water's depth from a map of the ground,
  // so the shallows glow lighter and the surf rolls in exactly where the beach dips under.
  const MAP=256,MAP_SIZE=256,depthData=new Uint8Array(MAP*MAP);
  for(let j=0;j<MAP;j++)for(let i=0;i<MAP;i++){const x=(i+.5)/MAP*MAP_SIZE-MAP_SIZE/2,z=(j+.5)/MAP*MAP_SIZE-MAP_SIZE/2;depthData[j*MAP+i]=Math.round(Math.min(1,Math.max(0,-groundHeight(x,z)/DEEP))*255);}
  const depthMap=new T.DataTexture(depthData,MAP,MAP,T.RedFormat,T.UnsignedByteType);depthMap.magFilter=depthMap.minFilter=T.LinearFilter;depthMap.wrapS=depthMap.wrapT=T.ClampToEdgeWrapping;depthMap.needsUpdate=true;
  const moonDir=new T.Vector3(.6,.55,-.58).normalize();
  const seaMat=new T.ShaderMaterial({fog:true,
    uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{time:{value:0},depthMap:{value:null},moonDir:{value:new T.Vector3()},deep:{value:new T.Color(0x061a1c)},shallow:{value:new T.Color(0x1c4b47)},foam:{value:new T.Color(0x9cc6be)},mapSize:{value:MAP_SIZE},seabed:{value:DEEP}}]),
    vertexShader:`varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
    fragmentShader:`uniform float time;uniform sampler2D depthMap;uniform vec3 moonDir;uniform vec3 deep;uniform vec3 shallow;uniform vec3 foam;uniform float mapSize;uniform float seabed;varying vec3 vWorld;
#include <fog_pars_fragment>
void main(){
  vec2 p=vWorld.xz;float depth=texture2D(depthMap,p/mapSize+.5).r*seabed;
  vec3 col=mix(deep,shallow,(1.-smoothstep(0.,1.7,depth))*.7);
  // Ripples tilt a fake normal; the moon glints along them.
  vec3 n=normalize(vec3(cos(p.x*.35+time*.9)*.028+cos((p.x+p.y)*.9+time*1.6)*.02,1.,cos(p.y*.41-time*.7)*.033+sin(p.x*.7-p.y*.5+time*1.1)*.015));
  vec3 view=normalize(cameraPosition-vWorld);float glint=pow(max(dot(n,normalize(view+moonDir)),0.),260.);
  col+=vec3(.7,.95,.9)*glint*1.1+deep*.35*(1.-view.y);
  // Surf: bands rolling in over the shallows, and a ribbon of foam on the sand's edge.
  float surf=1.-smoothstep(.05,.55,depth),band=.5+.5*sin(depth*20.-time*2.3+sin(p.x*.13+p.y*.11)*2.);
  float froth=surf*smoothstep(.6,1.,band)*.7+(1.-smoothstep(.0,.09,depth))*.85;
  col=mix(col,foam,clamp(froth,0.,1.)*.55);
  gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`});
  seaMat.uniforms.depthMap.value=depthMap;seaMat.uniforms.moonDir.value.copy(moonDir);
  const sea=new T.Mesh(new T.PlaneGeometry(900,900,1,1),seaMat);sea.rotation.x=-Math.PI/2;sea.name='The sea';sea.userData.dynamic=true;sea.renderOrder=-1;world.add(sea);

  // ---- Collision ------------------------------------------------------------------------
  // Boxes (turned by their own angle) and circles, each with a bottom and top height.
  // Platforms hold the player up: the shack's deck, and the tops of rocks.
  function boxCollider(x,z,w,d,bottom,top,angle=0){colliders.push({x,z,w,d,bottom,top,cos:Math.cos(angle),sin:Math.sin(angle)});}
  function circleCollider(x,z,r,bottom,top){colliders.push({x,z,r,bottom,top});}
  const SKIN=.06;
  function touches(c,x,z,r,y,height){
    if(y+SKIN>=c.top||y+height<=c.bottom)return false;
    if(c.r!==undefined)return (x-c.x)**2+(z-c.z)**2<(r+c.r)**2;
    const dx=x-c.x,dz=z-c.z,lx=dx*c.cos-dz*c.sin,lz=dx*c.sin+dz*c.cos;
    const nx=Math.max(-c.w/2,Math.min(lx,c.w/2)),nz=Math.max(-c.d/2,Math.min(lz,c.d/2));return (nx-lx)**2+(nz-lz)**2<r*r;
  }
  function inPlatform(p,x,z){
    if(p.r!==undefined)return (x-p.x)**2+(z-p.z)**2<p.r*p.r;
    const dx=x-p.x,dz=z-p.z,lx=dx*p.cos-dz*p.sin,lz=dx*p.sin+dz*p.cos;return Math.abs(lx)<=p.w/2&&Math.abs(lz)<=p.d/2;
  }
  // What holds something up at (x,z) from height y: the ground, or a platform top no
  // higher than y plus the step it may take.
  function supportBelow(x,z,y=Infinity,step=0){let h=groundHeight(x,z);for(const p of platforms)if(p.top>h&&p.top<=y+step+1e-6&&inPlatform(p,x,z))h=p.top;return h;}
  const shackInside=(x,z)=>Math.abs(x-S.x)<S.w/2-.12&&Math.abs(z-S.z)<S.d/2-.12;
  function ceilingAt(x,z,y){return shackInside(x,z)&&y<summit+S.deck+S.wall?summit+S.deck+S.wall-.05:Infinity;}
  function isBlocked(x,z,r,_colliders,_bounds,y=0,height=1.8){
    const B=ISLAND.bounds;if(Math.abs(x)+r>B||Math.abs(z)+r>B)return true;
    for(const c of colliders)if(touches(c,x,z,r,y,height))return true;return false;
  }
  // Walking: short sub-steps, sliding along whatever blocks. On the ground the feet
  // follow it up and down; the sea is wadeable to ISLAND.wade and slows you as it deepens.
  function move(pos,dx,dz,r=.32,{grounded=true,height=1.8}={}){
    const depth=Math.max(0,-groundHeight(pos.x,pos.z)),drag=1-.45*Math.min(1,depth/ISLAND.wade);dx*=drag;dz*=drag;
    function step(x,z){
      if(groundHeight(x,z)<-ISLAND.wade)return;
      const surface=supportBelow(x,z,pos.y,ISLAND.step),near=Math.abs(surface-pos.y)<=ISLAND.step;
      if(grounded&&surface>pos.y+ISLAND.step)return;
      const y=grounded&&near?surface:pos.y;
      if(isBlocked(x,z,r,colliders,null,y,height))return;
      if(y+height>ceilingAt(x,z,y))return;
      pos.x=x;pos.z=z;if(grounded&&near)pos.y=surface;
    }
    const n=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.10));for(let i=0;i<n;i++){step(pos.x+dx/n,pos.z);step(pos.x,pos.z+dz/n);}return pos;
  }
  // Jumping and falling, as in the mansion: land on whatever is below, stop under a roof.
  function updateHeight(pos,velocity,dt,grounded,height=1.8){
    const support=supportBelow(pos.x,pos.z,pos.y,.02);
    if(grounded&&Math.abs(pos.y-support)<.031&&velocity<=0){pos.y=support;return {velocity:0,grounded:true};}
    velocity-=11*dt;const previous=pos.y;pos.y+=velocity*dt;
    const floor=supportBelow(pos.x,pos.z,previous,.01);
    if(pos.y<=floor&&velocity<=0){pos.y=floor;return {velocity:0,grounded:true};}
    const top=ceilingAt(pos.x,pos.z,pos.y)-height;if(pos.y>top){pos.y=top;velocity=Math.min(0,velocity);}
    return {velocity,grounded:false};
  }

  // ---- Landmarks --------------------------------------------------------------------------
  // Each is built from simple parts sharing a few materials, then merged per material.
  function part(group,geo,mat,x,y,z,{sx=1,sy=1,sz=1,rx=0,ry=0,rz=0}={}){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.set(rx,ry,rz);m.castShadow=m.receiveShadow=true;group.add(m);return m;}
  const BOX=new T.BoxGeometry(1,1,1),CYL=new T.CylinderGeometry(1,1,1,10),PRISM=new T.CylinderGeometry(1,1,1,3);
  function merge(group){group.updateMatrixWorld(true);const byMat=new Map();for(const m of [...group.children])if(m.isMesh){if(!byMat.has(m.material))byMat.set(m.material,[]);byMat.get(m.material).push(m);}for(const list of byMat.values())combineMeshes(list,group);group.traverse(o=>{if(o.isMesh)solidMeshes.push(o);});}
  // A bar between two points (the tower's legs and bracing).
  const up=new T.Vector3(0,1,0),along=new T.Vector3();
  function strut(group,mat,a,b,thick){along.subVectors(b,a);const m=new T.Mesh(BOX,mat);m.position.addVectors(a,b).multiplyScalar(.5);m.scale.set(thick,along.length(),thick);m.quaternion.setFromUnitVectors(up,along.normalize());group.add(m);return m;}

  // The radio shack: a timber hut on a low deck, its door to the south between two lit
  // windows, a radio desk inside under a warm lamp.
  const shack=new T.Group();shack.name='Radio shack';shack.position.set(S.x,summit,S.z);world.add(shack);
  const timber=material(0x5a4a3a),plank=material(0x3f3429),roofMat=material(0x2c3134,{roughness:.8,metalness:.25}),glow=new T.MeshStandardMaterial({color:0x1a1108,emissive:0xe8913c,emissiveIntensity:.85,roughness:.6}),steel=material(0x6a6f6c,{roughness:.55,metalness:.6});
  const wallT=.14,deckTop=S.deck,wallH=S.wall,hw=S.w/2,hd=S.d/2;
  part(shack,BOX,plank,0,deckTop/2,0,{sx:S.w+.3,sy:deckTop,sz:S.d+.3});
  part(shack,BOX,plank,0,deckTop/4,hd+.45,{sx:1.8,sy:deckTop/2,sz:.6});                    // the door step
  part(shack,BOX,timber,0,deckTop+wallH/2,-hd+wallT/2,{sx:S.w,sy:wallH,sz:wallT});           // north wall
  for(const side of [-1,1]){
    part(shack,BOX,timber,side*(hw-wallT/2),deckTop+wallH/2,0,{sx:wallT,sy:wallH,sz:S.d});    // east and west walls
    const seg=hw-S.door/2;part(shack,BOX,timber,side*(S.door/2+seg/2),deckTop+wallH/2,hd-wallT/2,{sx:seg,sy:wallH,sz:wallT}); // south wall beside the door
    part(shack,BOX,glow,side*(S.door/2+seg/2),deckTop+1.45,hd+.005,{sx:.8,sy:.55,sz:.02});      // the lit windows
    part(shack,BOX,glow,side*(S.door/2+seg/2),deckTop+1.45,hd-wallT-.005,{sx:.8,sy:.55,sz:.02});
    part(shack,BOX,plank,side*(S.door/2+seg/2),deckTop+1.45,hd+.02,{sx:.05,sy:.62,sz:.03});part(shack,BOX,plank,side*(S.door/2+seg/2),deckTop+1.45,hd+.02,{sx:.86,sy:.05,sz:.03}); // the window bars
  }
  part(shack,BOX,timber,0,deckTop+wallH-.18,hd-wallT/2,{sx:S.door,sy:.36,sz:wallT});         // over the door
  part(shack,BOX,roofMat,0,deckTop+wallH+.08,.1,{sx:S.w+.7,sy:.16,sz:S.d+1.1,rx:-.06});
  part(shack,BOX,timber,0,deckTop+.4,-hd+.55,{sx:2.6,sy:.06,sz:.8});                         // the desk
  for(const [x,z] of [[-1.2,-hd+.25],[1.2,-hd+.25],[-1.2,-hd+.85],[1.2,-hd+.85]])part(shack,BOX,timber,x,deckTop+.2,z,{sx:.06,sy:.4,sz:.06});
  part(shack,BOX,steel,-.4,deckTop+.62,-hd+.5,{sx:.9,sy:.38,sz:.42});                        // the radio set
  part(shack,BOX,glow,-.4,deckTop+.64,-hd+.72,{sx:.6,sy:.08,sz:.01});     // its dial
  merge(shack);
  const lamp=new T.PointLight(0xffb867,2.4,7.5,1.6);lamp.position.set(S.x+.6,summit+deckTop+2,S.z-.6);scene.add(lamp);lights.push(lamp);
  platforms.push({x:S.x,z:S.z,w:S.w+.3,d:S.d+.3,top:summit+deckTop,cos:1,sin:0},{x:S.x,z:S.z+hd+.45,w:1.8,d:.6,top:summit+deckTop/2,cos:1,sin:0});
  {const y0=summit-1,y1=summit+deckTop+wallH+.2,seg=hw-S.door/2;
    boxCollider(S.x,S.z-hd+wallT/2,S.w,wallT,y0,y1);
    for(const side of [-1,1]){boxCollider(S.x+side*(hw-wallT/2),S.z,wallT,S.d,y0,y1);boxCollider(S.x+side*(S.door/2+seg/2),S.z+hd-wallT/2,seg,wallT,y0,y1);}
    boxCollider(S.x,S.z+hd-wallT/2,S.door,wallT,summit+deckTop+2.1,y1);           // the lintel: walk under it
    boxCollider(S.x,S.z-hd+.55,2.6,.8,y0,summit+deckTop+.82);                       // the desk and the radio
  }

  // The lattice tower: four legs leaning in from a 3.4 m base to a 0.9 m top, girts every
  // three metres and cross-bracing on every face, with the red beacon on top.
  const tower=new T.Group();tower.name='Radio tower';tower.position.set(W.x,summit,W.z);world.add(tower);
  const towerMat=material(0x8c8f8a,{roughness:.6,metalness:.55}),redPaint=material(0x8f2a22,{roughness:.6,metalness:.4});
  const corner=(y,i)=>{const half=(W.base+(W.top-W.base)*y/W.height)/2;return new T.Vector3((i&1?1:-1)*half,y,(i&2?1:-1)*half);};
  const ring=[0,1,3,2];
  for(let i=0;i<4;i++)strut(tower,towerMat,corner(0,i),corner(W.height,i),.14);
  for(let y=0;y<W.height-.01;y+=3){const y2=Math.min(W.height,y+3),mat=Math.floor(y/3)%2?redPaint:towerMat;
    for(let k=0;k<4;k++){const a=ring[k],b=ring[(k+1)%4];strut(tower,mat,corner(y2,a),corner(y2,b),.07);strut(tower,mat,corner(y,a),corner(y2,b),.05);strut(tower,mat,corner(y,b),corner(y2,a),.05);}}
  part(tower,CYL,towerMat,0,W.height+1.6,0,{sx:.06,sy:3.2,sz:.06});                              // the mast on top
  for(const y of [W.height*.55,W.height*.8])part(tower,BOX,steel,.45,y,.45,{sx:.18,sy:1.1,sz:.18,ry:.6}); // two dish arms (blockout)
  merge(tower);
  const beaconMat=new T.MeshStandardMaterial({color:0x330806,emissive:0xff4334,emissiveIntensity:3,roughness:.4});
  const beacon=new T.Mesh(new T.SphereGeometry(.22,12,8),beaconMat);beacon.position.set(W.x,summit+W.height+3.3,W.z);beacon.name='Tower beacon';world.add(beacon);
  const beaconLight=new T.PointLight(0xff3b2c,0,46,1.4);beaconLight.position.copy(beacon.position);scene.add(beaconLight);lights.push(beaconLight);
  for(let i=0;i<4;i++){const p=corner(0,i);circleCollider(W.x+p.x,W.z+p.z,.2,summit-1,summit+6);}

  // The wreck: a trawler run aground and rolled onto her side, bow up the beach, stern
  // in the surf, half sunk in the sand.
  const R=ISLAND.wreck,wreckR=coastRadius(R.bearing)*R.at,wx=Math.cos(R.bearing)*wreckR,wz=Math.sin(R.bearing)*wreckR;
  const heading=R.bearing+Math.PI,wreck=new T.Group();wreck.name='Wreck';world.add(wreck);
  wreck.position.set(wx,groundHeight(wx,wz)-R.sink,wz);wreck.rotation.set(R.roll,-heading,0,'YXZ');
  const hullMat=material(0x2b464b,{roughness:.8,metalness:.2}),rust=material(0x6a3b24,{roughness:.9,metalness:.15}),cabin=material(0xb9b5a6,{roughness:.85});
  const L=R.length,B=R.beam;
  part(wreck,BOX,rust,0,.25,0,{sx:L*.86,sy:.5,sz:B*.55});
  for(const side of [-1,1])part(wreck,BOX,hullMat,-.4,1.25,side*B*.42,{sx:L*.9,sy:2.1,sz:.18,rx:side*.2});
  part(wreck,BOX,hullMat,-L*.47,1.3,0,{sx:.18,sy:2.2,sz:B*.86});                                   // the transom
  part(wreck,PRISM,hullMat,L*.47,1.25,0,{sx:B*.5,sy:2.3,sz:B*.6,ry:Math.PI/2});                     // the bow
  part(wreck,BOX,plank,-.8,2.25,0,{sx:L*.66,sy:.12,sz:B*.8});                                        // what's left of the deck
  part(wreck,BOX,cabin,-L*.2,3.35,0,{sx:3,sy:2.1,sz:2.6});                                           // the wheelhouse
  part(wreck,BOX,glow,-L*.2+1.51,3.6,0,{sx:.02,sy:.5,sz:1.6});                    // a dead glow in its window
  part(wreck,CYL,steel,L*.15,5.6,0,{sx:.12,sy:6.8,sz:.12,rz:-.08});                                 // the mast
  part(wreck,CYL,steel,L*.05,6.2,0,{sx:.07,sy:4,sz:.07,rz:1.2});                                     // a broken boom
  merge(wreck);
  boxCollider(wx,wz,L*.95,B*1.05,groundHeight(wx,wz)-2,groundHeight(wx,wz)+3.6,-heading);

  // Palms: leaning trunks and drooping crowns, instanced (two draw calls for all of them).
  const rand=seeded(204),palmSpots=[];
  const clear=(x,z,gap)=>Math.hypot(x-wx,z-wz)>gap+9&&Math.hypot(x-HILL.x,z-HILL.z)>HILL.flat+4&&Math.hypot(x-ISLAND.spawn.x,z-ISLAND.spawn.z)>gap+3&&palmSpots.every(p=>Math.hypot(p.x-x,p.z-z)>gap);
  // A grove on the west lowland, then singles along every beach.
  for(let tries=0;tries<400&&palmSpots.length<14;tries++){const a=Math.PI*(.85+rand()*.45),r=coastRadius(a)*(.55+rand()*.3),x=Math.cos(a)*r,z=Math.sin(a)*r;if(clear(x,z,3.2))palmSpots.push({x,z});}
  for(let tries=0;tries<900&&palmSpots.length<46;tries++){const a=rand()*Math.PI*2,r=coastRadius(a)*(.68+rand()*.25),x=Math.cos(a)*r,z=Math.sin(a)*r;if(groundHeight(x,z)>.35&&clear(x,z,5))palmSpots.push({x,z});}
  const trunkGeo=new T.CylinderGeometry(.15,.27,1,7,4);trunkGeo.translate(0,.5,0);
  const crownGeo=(()=>{const pos=[],nor=[],uv=[];
    for(let f=0;f<8;f++){const a=f/8*Math.PI*2+(f%2)*.2,dir=new T.Vector3(Math.cos(a),0,Math.sin(a)),side=new T.Vector3(-dir.z,0,dir.x);
      for(let s=0;s<5;s++){const t0=s/5,t1=(s+1)/5,p=t=>new T.Vector3().addScaledVector(dir,t*2.6).setY(.35*Math.sin(t*2.2)-t*t*1.5),w=t=>.42*Math.sin(Math.PI*Math.min(1,t*1.15+.05));
        const a0=p(t0),a1=p(t1),q=[a0.clone().addScaledVector(side,-w(t0)),a0.clone().addScaledVector(side,w(t0)),a1.clone().addScaledVector(side,-w(t1)),a1.clone().addScaledVector(side,w(t1))];
        for(const k of [0,2,1,1,2,3]){pos.push(...q[k].toArray());nor.push(0,1,0);uv.push(k&1,k>>1);}}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();return g;})();
  const trunks=new T.InstancedMesh(trunkGeo,material(0x5d5142),palmSpots.length),crowns=new T.InstancedMesh(crownGeo,material(0x2e4a2b,{side:T.DoubleSide}),palmSpots.length);
  trunks.name='Palm trunks';crowns.name='Palm crowns';
  const m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler(),v4=new T.Vector3(),s4=new T.Vector3();
  palmSpots.forEach((p,i)=>{
    const h=6+rand()*3.2,out=Math.atan2(p.z,p.x),lean=.12+rand()*.2,y=groundHeight(p.x,p.z)-.1;
    e4.set(Math.sin(out)*lean,0,-Math.cos(out)*lean);q4.setFromEuler(e4);m4.compose(v4.set(p.x,y,p.z),q4,s4.set(1,h,1));trunks.setMatrixAt(i,m4);
    const top=new T.Vector3(0,h,0).applyQuaternion(q4).add(v4.set(p.x,y,p.z));e4.set(0,rand()*Math.PI*2,0);q4.setFromEuler(e4);m4.compose(top,q4,s4.setScalar(.85+rand()*.35));crowns.setMatrixAt(i,m4);
    circleCollider(p.x,p.z,.28,y-1,y+h);p.top=top;
  });
  trunks.castShadow=crowns.castShadow=true;trunks.computeBoundingSphere();crowns.computeBoundingSphere();world.add(trunks,crowns);solidMeshes.push(trunks,crowns);

  // Rocks: half-buried boulders on the hill's flanks and the north shore. Small ones can
  // be stood on.
  const rockSpots=[];
  for(let tries=0;tries<600&&rockSpots.length<26;tries++){
    const north=rockSpots.length>=14,a=north?-Math.PI*(.15+rand()*.7):rand()*Math.PI*2,r=north?coastRadius(a)*(.86+rand()*.12):HILL.flat+5+rand()*(HILL.foot-HILL.flat-6),x=north?Math.cos(a)*r:HILL.x+Math.cos(a)*r,z=north?Math.sin(a)*r:HILL.z+Math.sin(a)*r,size=.5+rand()*1.6;
    if(groundHeight(x,z)>-.4&&Math.hypot(x-wx,z-wz)>12&&Math.hypot(x-ISLAND.spawn.x,z-ISLAND.spawn.z)>8&&palmSpots.every(p=>Math.hypot(p.x-x,p.z-z)>size+1.2)&&rockSpots.every(s=>Math.hypot(s.x-x,s.z-z)>s.size+size+.8))rockSpots.push({x,z,size});
  }
  const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),material(0x4d524c,{flatShading:true,roughness:.95}),rockSpots.length);rocks.name='Rocks';
  rockSpots.forEach((s,i)=>{const y=groundHeight(s.x,s.z)-s.size*.35;e4.set(rand()*.6,rand()*Math.PI*2,rand()*.6);q4.setFromEuler(e4);m4.compose(v4.set(s.x,y,s.z),q4,s4.set(s.size*(1+rand()*.3),s.size*.75,s.size));rocks.setMatrixAt(i,m4);
    const top=y+s.size*.62;s.top=top;circleCollider(s.x,s.z,s.size*.82,y-1,top);if(s.size<1.25)platforms.push({x:s.x,z:s.z,r:s.size*.7,top});});
  rocks.castShadow=rocks.receiveShadow=true;rocks.computeBoundingSphere();world.add(rocks);solidMeshes.push(rocks);

  // ---- Where you are ------------------------------------------------------------------------
  function zoneAt(x,z,y=groundHeight(x,z)){
    if(shackInside(x,z)&&y>summit-.5)return 'RADIO SHACK';
    const d=Math.hypot(x-HILL.x,z-HILL.z),h=groundHeight(x,z);
    if(d<HILL.flat+1.5)return 'RADIO HILL · SUMMIT';
    if(Math.hypot(x-wx,z-wz)<13)return 'THE WRECK';
    if(h<0)return 'THE SHALLOWS';
    if(d<HILL.foot*.8&&h>LOW+1.2)return 'RADIO HILL';
    if(shoreFraction(x,z)>.78){const a=Math.atan2(z,x);return Math.abs(a-Math.PI/2)<Math.PI/4?'SOUTH BEACH':Math.abs(a+Math.PI/2)<Math.PI/4?'NORTH SHORE':Math.abs(a)<Math.PI/4?'EAST BEACH':'WEST BEACH';}
    return x<-10?'PALM GROVE':'THE LOWLANDS';
  }
  // The beacon blinks and the sea moves.
  function update(elapsed){seaMat.uniforms.time.value=elapsed;const on=(elapsed%ISLAND.beacon.period)<ISLAND.beacon.on;beaconMat.emissiveIntensity=on?3.2:.25;beaconLight.intensity=on?26:0;}

  return {colliders,platforms,solidMeshes,lights,sea,seaMat,depthMap,beacon,beaconLight,lamp,palms:palmSpots,rocks:rockSpots,shack,tower,wreck,summit,moonDir,
    wreckAt:{x:wx,z:wz,heading},groundHeight,supportBelow,ceilingAt,isBlocked,move,updateHeight,zoneAt,update,
    shackInside,visibleFloor:(x,z,support)=>support,floorHeight:(x,z)=>groundHeight(x,z)};
}

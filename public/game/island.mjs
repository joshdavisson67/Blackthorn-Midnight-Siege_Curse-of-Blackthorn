import * as T from './three.module.js';
import {combineMeshes} from './batching.mjs?v=204';

// Dead Tide's island (v204, Dead Tide step 2): the grey-box map. A central hill with the
// radio tent and a lattice tower on its flat top, a lowland ring, beaches all round,
// a wreck run aground, palms, rocks, and the sea with its shallows and surf. Blockout
// shapes only; the art comes later.
//
// v210, the finished map: two coves, four smaller hills, a gully and rolling lowland; the
// design spec's landmarks (the Lookout Compound, Bunker B-01, the Jungle Ruin, Shipwreck Cove,
// the Coastal Camp, the South Dock, East Cove, the Soul Forge's clearing, North Beach); pads
// reserved for the stations; trails between them; and the spawn network placed on it all.
// Where everything stands is plain data (ISLAND, islandSites, SHORE), read by the director,
// the tests and scripts/island-map.mjs.
//
// Nothing here touches the mansion: the island is its own map, and the shared modules
// (player.mjs, weapon-runtime.mjs, enemy-combat.mjs) reach it only through the level
// functions buildIsland returns. North is -z, as in the mansion; y is height above the
// sea, which sits at 0.
export const ISLAND=Object.freeze({
  // The coast's distance from the centre wobbles with the bearing (radius, then
  // amplitude, frequency and phase of each wobble), between about 51 and 78 m.
  // v210: two coves are bitten out of it, [bearing, depth (m), width (rad)]: Shipwreck Cove on
  // the west and East Cove on the south-east.
  coast:Object.freeze({radius:64,waves:Object.freeze([[7,2,.6],[5,3,-1.1],[2.5,5,2]]),coves:Object.freeze([[Math.PI,12,.2],[.62,10,.17]])}),
  lowland:2.2,           // inland ground height (m)
  seabed:2.2,            // depth of the open sea floor (m)
  shore:Object.freeze([.5,1.5]),  // the land falls to the seabed between these fractions of the coast radius
  hill:Object.freeze({x:-4,z:-8,top:12,flat:9,foot:38}),  // a 12 m hill, flat within 9 m (v210: was 8), gone by 38 m
  // v210: the rest of the island's high and low ground, each a smooth mound (or hollow) with
  // its own flat top: [name, x, z, half-length, half-width, bearing of its long axis, height,
  // the fraction of it that is flat]. All of it walkable from every side, for everyone.
  mounds:Object.freeze([
    // v211: bolder. The ridge, knoll, bluff and headland stand taller, two new hills (a crag
    // above North Beach and the downs behind the east shore) and a dune field behind Shipwreck
    // Cove join them, the wash is a real ravine, a second gully runs north off Radio Hill, and
    // the east hollow is a boggy bowl. Every slope stays under about 40 degrees.
    ['BUNKER RIDGE',21,-30,20,14,Math.PI/4,6,.1],          // the rocky embankment B-01 comes out of
    ['RIDGE KNOB',33,-14,8,7,0,2.4,.2],                    // a knob on its south-east end
    ['RUIN KNOLL',-37,-29,20,18,0,5.4,.4],                 // the jungle ruin's plateau
    ['RUIN SPUR',-25,-22,11,8,.62,2,.1],                   // Radio Hill's shoulder toward the ruin
    ['NORTH CRAG',11,-45,10,8,.3,3,.15],                   // a crag between the ridge and North Beach
    ['CAMP BLUFF',-33,27,19,16,-.6,5,.4],                  // the coastal camp's bluff, above the south-west beach
    ['FORGE RISE',31,-3,11,10,0,1.5,.55],                  // the Soul Forge's clearing
    ['EAST DOWNS',47,12,10,7,1.25,2.8,.15],                // a long down behind the east shore
    ['COVE HEAD',31,42,13,10,.9,4.3,.12],                  // the headland between East Cove and the dock
    ['NORTH DUNE',-4,-51,17,7,0,1.9,.1],                   // the back of North Beach
    ['WEST DUNE',-45,-14,8,4.5,1.3,1.4,.1],                // dunes behind Shipwreck Cove
    ['WEST DUNE SOUTH',-46,15,7,4,1.9,1.2,.1],
    ['THE WASH',-20,28,17,10,2,-1.9,.2],                   // a ravine below the hill's south-west foot, toward the beach
    ['WASH BANK',-10,33,14,6,2,1.6,.15],                   // and the bank along its east side
    ['NORTH GULLY',-15,-43,10,7,-1.95,-.85,.2],             // a shallow gully north off Radio Hill
    ['EAST HOLLOW',22,19,11,9.5,.4,-1.3,.3]                  // a boggy bowl behind the south-east shore
  ].map(m=>Object.freeze(m))),
  wade:.8,               // the deepest water the player can wade into (m)
  bounds:120,            // half-width of the square nothing leaves (m)
  step:.31,              // the tallest step the player walks up
  spawn:Object.freeze({x:0,z:46.5,yaw:.073}),  // the south beach, facing the hill
  tower:Object.freeze({x:-9,z:-12,height:24,base:3.4,top:.9}),
  // v210: the radio tent (the shack before it): an open canopy on six poles, nothing to hide in.
  tent:Object.freeze({x:.5,z:-5.5,w:5.4,d:4.2,eave:3,ridge:3.8}),
  wreck:Object.freeze({bearing:Math.PI+.03,at:.955,length:13,beam:4.2,roll:.42,sink:.9}),   // v210: in Shipwreck Cove, on the west
  beacon:Object.freeze({period:1.6,on:.55})   // the tower's red light: on .55 s of every 1.6 s
});
const {coast:COAST,hill:HILL,lowland:LOW,seabed:DEEP}=ISLAND;
// v210: where three landmarks sit: the dock's bearing on the south shore; East Cove's bearing and
// how far in from the waterline its shelter stands; how far down the ridge's face B-01 is dug.
// v211: B-01 comes out of the ridge's north-east (seaward) face, `out` m from its crest line.
const DOCK=Object.freeze({bearing:1.36,length:15}),COVE=Object.freeze({bearing:.62,at:.79}),BUNKER=Object.freeze({out:9}),
  AMMO=Object.freeze({x:2,z:-1.4,size:.8,reach:2});   // v211: the test ammo crate, in the tent's own frame
// v206: the routes' grid (cell size and half-width, m).
export const NAV=Object.freeze({cell:.5,extent:84});
const TAU=Math.PI*2,COVES=COAST.coves.map(([b,depth,width])=>[b,depth,1/width]);
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t);};
export function coastRadius(bearing){
  let r=COAST.radius;for(const [a,f,p] of COAST.waves)r+=a*Math.sin(f*bearing+p);
  for(let i=0;i<COVES.length;i++){const c=COVES[i];let d=bearing-c[0];d=(d-TAU*Math.round(d/TAU))*c[2];if(d>-3&&d<3)r-=c[1]*Math.exp(-d*d);}
  return r;
}
// How far out from the centre a point is, as a fraction of the coast radius on its bearing.
export function shoreFraction(x,z){return Math.hypot(x,z)/coastRadius(Math.atan2(z,x));}
function hillHeight(x,z){const d=Math.hypot(x-HILL.x,z-HILL.z),u=Math.min(1,Math.max(0,(d-HILL.flat)/(HILL.foot-HILL.flat)));return HILL.top*(.5+.5*Math.cos(Math.PI*u));}
// v210: the mounds, ready to sum: centre, the long axis's cosine and sine, 1/half-length,
// 1/half-width, height, flat fraction and the square of the reach.
const ROCKY=new Set(['BUNKER RIDGE','NORTH CRAG','COVE HEAD','RIDGE KNOB']);
const MOUNDS=ISLAND.mounds.map(([name,x,z,a,b,angle,height,flat])=>[x,z,Math.cos(angle),Math.sin(angle),1/a,1/b,height,flat,Math.max(a,b)**2,ROCKY.has(name)?1:0]);
let calm=0,dip=0,crag=0;   // how flat the last relief() point is asked to be (1 on a mound's flat top); v211: how deep it lies in a hollow, and how much of it is rocky high ground
function relief(x,z){
  let h=0;calm=0;dip=0;crag=0;
  for(let i=0;i<MOUNDS.length;i++){const m=MOUNDS[i],dx=x-m[0],dz=z-m[1];if(dx*dx+dz*dz>=m[8])continue;
    const u=Math.hypot((dx*m[2]+dz*m[3])*m[4],(dz*m[2]-dx*m[3])*m[5]);if(u>=1)continue;
    let part;if(u<=m[7]){part=m[6];calm=1;}else{const k=(u-m[7])/(1-m[7]);part=m[6]*(.5+.5*Math.cos(Math.PI*k));if(1-k>calm)calm=1-k;}
    h+=part;if(part<0)dip-=part;else if(m[9])crag=Math.max(crag,part/m[6]);}
  return h;
}
// The height of one named mound's own ground (its flat top), for what stands on it.
export function moundAt(name){const m=ISLAND.mounds.find(m=>m[0]===name);return m?{x:m[1],z:m[2],length:m[3],width:m[4],angle:m[5],height:m[6],flat:m[7]}:null;}
// The ground's height (m) anywhere: lowland, falling through the beach to the seabed,
// with the hill, the mounds and gentle swells on the land (none on a flat top).
export function groundHeight(x,z){
  const t=shoreFraction(x,z),fall=smooth(ISLAND.shore[0],ISLAND.shore[1],t),land=1-fall;
  const d=Math.hypot(x-HILL.x,z-HILL.z),rise=relief(x,z);
  // Small swells, and (v210) a slow roll under them, so the lowland is never a table.
  const swell=(.35*Math.sin(x*.19+1.3)*Math.sin(z*.23-.7)+.22*Math.sin(x*.41-z*.33+2.1)+.45*Math.sin(x*.083+.4)*Math.sin(z*.071+1.9))*smooth(HILL.flat+4,HILL.flat+14,d)*(1-calm);
  // The swells die away behind the beach, so the sand meets the sea on an even slope.
  return LOW-(LOW+DEEP)*fall+(hillHeight(x,z)+rise)*land+swell*smooth(.92,.7,t);
}
// ---- Where everything stands (v210) ----------------------------------------------------------
// The landmarks of the design spec's section 3, the pads reserved for their stations (step 5
// builds the stations on them), and the trails between them. Plain numbers, worked out from the
// terrain above with no 3D engine, so the spawn director and the tests can read them too.
const polar=(bearing,fraction)=>{const r=coastRadius(bearing)*fraction;return [Math.cos(bearing)*r,Math.sin(bearing)*r];};
// A point in a site's own frame (x across, z toward its front) turned by the site's angle.
const turned=(x,z,angle,lx,lz)=>[x+lx*Math.cos(angle)+lz*Math.sin(angle),z-lx*Math.sin(angle)+lz*Math.cos(angle)];
let SITES=null;
export function islandSites(){
  if(SITES)return SITES;
  const T=ISLAND.tent,W=ISLAND.wreck,mound=n=>moundAt(n),ridge=mound('BUNKER RIDGE'),knoll=mound('RUIN KNOLL'),bluff=mound('CAMP BLUFF'),rise=mound('FORGE RISE');
  const [wx,wz]=polar(W.bearing,W.at),[dx,dz]=polar(DOCK.bearing,1),[cx,cz]=polar(COVE.bearing,COVE.at),[nx,nz]=polar(-Math.PI/2,.84);
  // v211: turned round (it faced Radio Hill): its door looks out to the north-east reef, its back in the ridge.
  const bunkerAngle=Math.PI-ridge.angle,[bx,bz]=turned(ridge.x,ridge.z,bunkerAngle,0,BUNKER.out);
  const sites={
    tent:{x:T.x,z:T.z,angle:0},tower:{x:ISLAND.tower.x,z:ISLAND.tower.z},
    // v211: an ammunition crate under the tent's canopy, for testing (free; the real stations come in step 5).
    ammo:{x:T.x+AMMO.x,z:T.z+AMMO.z,reach:AMMO.reach},
    bunker:{x:bx,z:bz,angle:bunkerAngle},ruin:{x:knoll.x,z:knoll.z,angle:.3},wreck:{x:wx,z:wz,heading:W.bearing+Math.PI},
    camp:{x:bluff.x,z:bluff.z,angle:-.6},dock:{x:dx,z:dz,angle:Math.atan2(dx,dz),bearing:DOCK.bearing},
    cove:{x:cx,z:cz,angle:Math.atan2(cx,cz)},forge:{x:rise.x,z:rise.z,angle:.4},north:{x:nx,z:nz}
  };
  const S=sites,at=(site,lx,lz)=>turned(site.x,site.z,site.angle||0,lx,lz);
  // What the HUD calls each place: a circle round it (the first that holds you wins).
  const landmarks=[
    ['BUNKER B-01',...at(S.bunker,0,.5),10],['JUNGLE RUIN',S.ruin.x,S.ruin.z,11],['SHIPWRECK COVE',S.wreck.x+5,S.wreck.z,15],['COASTAL CAMP',S.camp.x,S.camp.z,11],
    ['SOUTH DOCK',...at(S.dock,1.5,-6),10],['EAST COVE',...at(S.cove,0,3),12],['SOUL FORGE',S.forge.x,S.forge.z,8.5],['NORTH BEACH',S.north.x,S.north.z,17]
  ].map(([name,x,z,r])=>Object.freeze({name,x,z,r}));
  // The pads: one for every weapon the game sells, and the Forge (spec 4.1). Perks, ammunition,
  // armour and the shrines get theirs with the stations themselves, in step 5.
  const pad=(id,label,landmark,[x,z],angle=0)=>Object.freeze({id,label,landmark,x:+x.toFixed(3),z:+z.toFixed(3),angle});
  const stations=[
    pad('bushmaster','BUSHMASTER .450','LOOKOUT COMPOUND',[HILL.x+1,HILL.z-6.2]),
    pad('katana','KATANA','LOOKOUT COMPOUND',[HILL.x-7,HILL.z+.5],Math.PI/2),
    pad('smg','RAVEN SMG','JUNGLE RUIN',at(S.ruin,0,0),S.ruin.angle),
    pad('shotgun','SHOTGUN','SHIPWRECK COVE',[S.wreck.x+11.5,S.wreck.z+4.5],Math.PI/2),
    pad('rifle','M4','COASTAL CAMP',at(S.camp,.6,.4),S.camp.angle),
    pad('lmg','WARDEN LMG','SOUTH DOCK',at(S.dock,3.2,-8),S.dock.angle),
    pad('glock','GLOCK 21','EAST COVE',at(S.cove,0,4.2),S.cove.angle),
    pad('forge','SOUL FORGE','SOUL FORGE',[S.forge.x,S.forge.z],S.forge.angle)
  ];
  // The trails: the spec's seven cross-routes and two that close its loops. The beaches are
  // the perimeter loop.
  const trail=(name,...points)=>Object.freeze({name,points:Object.freeze(points.map(p=>Object.freeze(p)))});
  const trails=[
    trail('RUIN TO RADIO HILL',[S.ruin.x+5,S.ruin.z+3],[-25,-21],[-17,-15],[HILL.x-8.5,HILL.z-.5]),
    trail('WRECK TO CAMP',[S.wreck.x+11,S.wreck.z+3],[-41,10],[-35,17],at(S.camp,0,-6.5)),
    trail('NORTH BEACH TO RADIO HILL',[-5,-56],[-10,-44],[-5,-30],[HILL.x,HILL.z-9]),
    trail('BUNKER TO RADIO HILL',at(S.bunker,0,4.5),[22,-44],[12,-40],[4,-30],[HILL.x+7,HILL.z-6.5]),   // v211: round the ridge's north-west end
    trail('RADIO HILL TO FORGE',[HILL.x+9,HILL.z+1],[14,-5],[23,-3.5],[S.forge.x-3.5,S.forge.z]),
    trail('RADIO HILL TO DOCK',[HILL.x+2,HILL.z+9],[1,16],[5,32],[9,46],at(S.dock,2,-9)),
    trail('CAMP TO EAST COVE',[S.camp.x+4,S.camp.z+2],[-14,34],[4,37],[22,32],at(S.cove,-4.5,5)),
    trail('FORGE TO EAST COVE',[S.forge.x+1,S.forge.z+4],[36,13],at(S.cove,7.5,-3)),
    trail('RUIN TO WRECK',[S.ruin.x-2,S.ruin.z+5],[-45,-13],[S.wreck.x+13,S.wreck.z-1])
  ];
  return SITES=Object.freeze({sites:Object.freeze(sites),landmarks:Object.freeze(landmarks),stations:Object.freeze(stations),trails:Object.freeze(trails)});
}
// How far (x, z) is from the nearest trail's centre line.
let SEGMENTS=null;
export function trailDistance(x,z){
  if(!SEGMENTS){SEGMENTS=[];for(const t of islandSites().trails)for(let k=1;k<t.points.length;k++){const [ax,az]=t.points[k-1],[bx,bz]=t.points[k],ux=bx-ax,uz=bz-az;SEGMENTS.push(ax,az,ux,uz,1/(ux*ux+uz*uz));}}
  let best=Infinity;for(let i=0;i<SEGMENTS.length;i+=5){const px=x-SEGMENTS[i],pz=z-SEGMENTS[i+1],ux=SEGMENTS[i+2],uz=SEGMENTS[i+3],f=Math.min(1,Math.max(0,(px*ux+pz*uz)*SEGMENTS[i+4])),dx=px-ux*f,dz=pz-uz*f,d=dx*dx+dz*dz;if(d<best)best=d;}
  return Math.sqrt(best);
}
// Small seeded random numbers, so the island is the same on every load.
function seeded(seed){return ()=>{seed=(seed+0x6D2B79F5)>>>0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}

export function buildIsland({scene,world}){
  const colliders=[],platforms=[],solidMeshes=[],lights=[];
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.92,metalness:0,...extra});
  const TENT=ISLAND.tent,W=ISLAND.tower,summit=groundHeight(HILL.x,HILL.z),{sites:SITE,landmarks:LANDMARKS,stations,trails}=islandSites();

  // ---- The ground ---------------------------------------------------------------------
  // 1.5 m squares in 30 m chunks out to 90 m; chunks wholly under the sea are left out.
  // Normals come from the height function, so chunk edges join without a seam.
  const SPACING=1.5,CHUNK=20,EXTENT=90,groundMat=material(0xffffff,{vertexColors:true,roughness:.97});
  const sand=new T.Color(0xbcae8e),wetSand=new T.Color(0x756a55),scrub=new T.Color(0x34492f),dryScrub=new T.Color(0x5b6143),dirt=new T.Color(0x6b5c47),rock=new T.Color(0x666962),c=new T.Color();
  // v211: the ground's kinds: dark jungle floor round the ruin, dry grass on the south and east
  // lowland, mud in the hollows and gullies, and bare stone on the rocky hills.
  const jungle=new T.Color(0x22341d),dryGrass=new T.Color(0x6e6a3e),mud=new T.Color(0x3a3527),stoneGround=new T.Color(0x5d605a),RUIN=moundAt('RUIN KNOLL');
  function groundColor(x,z,h,slope){
    const t=shoreFraction(x,z),patch=.5+.5*Math.sin(x*.31+z*.17)*Math.sin(z*.27-x*.11);
    c.copy(wetSand).lerp(sand,smooth(-.1,.55,h));                                        // wet near the water, dry up the beach
    c.lerp(dryScrub,Math.min(1,smooth(.9,.76,t)*(.45+patch*.8)));                        // dune grass in patches behind the beach
    c.lerp(scrub,smooth(.8,.62,t)*smooth(1.4,2,h)*(.55+.45*patch));                      // scrub inland
    if(Math.hypot(x-HILL.x,z-HILL.z)<HILL.flat+1.5)c.lerp(dirt,.85);                    // the beaten summit
    else if(h>.25){const d=trailDistance(x,z);if(d<2.6)c.lerp(dirt,.8*smooth(2.6,1.1,d));}   // v210: the trails, worn to dirt
    // v211: the kinds of ground (h > .4: never on the beach).
    if(h>.4){relief(x,z);const inland=smooth(.8,.66,t);
      c.lerp(jungle,inland*smooth(30,12,Math.hypot(x-RUIN.x,z-RUIN.z))*(.55+.35*patch));      // the jungle floor round the ruin
      c.lerp(dryGrass,inland*smooth(-6,14,z+x*.35)*(.25+.45*(1-patch))*(1-smooth(0,1.2,dip))); // dry grass to the south and east
      c.lerp(mud,smooth(.25,1.1,dip)*.8);                                                    // mud down in the hollows and gullies
      c.lerp(stoneGround,smooth(.25,.75,crag)*(.35+.5*patch));                               // stone showing on the rocky hills
    }
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
  // Platforms hold the player up: the tops of small rocks, and low slabs (a step up).
  // (v210: `kind` says what it is, for the map and the tests.)
  function boxCollider(x,z,w,d,bottom,top,angle=0,kind='prop'){colliders.push({x,z,w,d,bottom,top,cos:Math.cos(angle),sin:Math.sin(angle),kind});}
  function circleCollider(x,z,r,bottom,top,kind='prop'){colliders.push({x,z,r,bottom,top,kind});}
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
  // v210: with twice as many props, a coarse grid says which colliders and platforms can be near
  // a point (each is listed in every 6 m cell its footprint, plus a body's reach, touches), so
  // a check looks at a few of them, not all. The lists are indexed again if they ever grow.
  const CELL=6,SPAN=Math.ceil(ISLAND.bounds*2/CELL)+2,REACH=1.6,cellAt=v=>Math.min(SPAN-1,Math.max(0,Math.floor((v+ISLAND.bounds)/CELL)+1));
  function gridOf(list){const cells=Array.from({length:SPAN*SPAN},()=>[]);for(const c of list){const R=(c.r??Math.hypot(c.w,c.d)/2)+REACH;for(let j=cellAt(c.z-R);j<=cellAt(c.z+R);j++)for(let i=cellAt(c.x-R);i<=cellAt(c.x+R);i++)cells[j*SPAN+i].push(c);}return {cells,count:list.length};}
  let colliderGrid=null,platformGrid=null;
  const nearColliders=(x,z)=>{if(!colliderGrid||colliderGrid.count!==colliders.length)colliderGrid=gridOf(colliders);return colliderGrid.cells[cellAt(z)*SPAN+cellAt(x)];};
  const nearPlatforms=(x,z)=>{if(!platformGrid||platformGrid.count!==platforms.length)platformGrid=gridOf(platforms);return platformGrid.cells[cellAt(z)*SPAN+cellAt(x)];};
  function supportBelow(x,z,y=Infinity,step=0){let h=groundHeight(x,z);const near=nearPlatforms(x,z);for(let i=0;i<near.length;i++){const p=near[i];if(p.top>h&&p.top<=y+step+1e-6&&inPlatform(p,x,z))h=p.top;}return h;}
  // v210: under the radio tent's canopy (its eaves are the ceiling; a brute stands under them).
  const tentInside=(x,z)=>Math.abs(x-TENT.x)<TENT.w/2&&Math.abs(z-TENT.z)<TENT.d/2;
  function ceilingAt(x,z,y){return tentInside(x,z)&&y<summit+TENT.eave?summit+TENT.eave-.05:Infinity;}
  function isBlocked(x,z,r,_colliders,_bounds,y=0,height=1.8){
    const B=ISLAND.bounds;if(Math.abs(x)+r>B||Math.abs(z)+r>B)return true;
    const near=r<=REACH?nearColliders(x,z):colliders;for(let i=0;i<near.length;i++)if(touches(near[i],x,z,r,y,height))return true;return false;
  }
  // Walking: short sub-steps, sliding along whatever blocks. On the ground the feet
  // follow it up and down; the sea is wadeable to ISLAND.wade and slows you as it deepens.
  function move(pos,dx,dz,r=.32,{grounded=true,height=1.8,canOccupy=null}={}){
    const depth=Math.max(0,-groundHeight(pos.x,pos.z)),drag=1-.45*Math.min(1,depth/ISLAND.wade);dx*=drag;dz*=drag;
    function step(x,z){
      if(groundHeight(x,z)<-ISLAND.wade)return;
      const surface=supportBelow(x,z,pos.y,ISLAND.step),near=Math.abs(surface-pos.y)<=ISLAND.step;
      if(grounded&&surface>pos.y+ISLAND.step)return;
      const y=grounded&&near?surface:pos.y;
      if(isBlocked(x,z,r,colliders,null,y,height))return;
      if(y+height>ceilingAt(x,z,y))return;
      if(canOccupy&&!canOccupy(x,z,y))return;   // v206: bodies never overlap
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

  // v210: everything new stands in one group, merged by material once it is all placed (a
  // handful of draw calls for the whole island's props). A site places parts in its own frame:
  // x across, z toward its front, turned by its angle; heights are above the ground under each
  // part, or above `base` for a rigid structure. A part that blocks gets a collider as tall as
  // itself; nothing here can be stood on above head height (the dead could not follow).
  const props=new T.Group();props.name='Landmarks';world.add(props);
  const timber=material(0x5a4a3a),plank=material(0x3f3429),roofMat=material(0x2c3134,{roughness:.8,metalness:.25}),glow=new T.MeshStandardMaterial({color:0x1a1108,emissive:0xe8913c,emissiveIntensity:.85,roughness:.6}),steel=material(0x6a6f6c,{roughness:.55,metalness:.6});
  const canvas=material(0x7d7a5c,{roughness:1}),concrete=material(0x7c7e78,{roughness:.95}),stone=material(0x6c6f66,{roughness:1}),rustMat=material(0x6a3b24,{roughness:.9,metalness:.15}),crate=material(0x66573d),padMat=material(0xc9c4b2,{roughness:.8}),ammoMat=material(0x4b5a2c),band=material(0xc9a227,{roughness:.6});
  const warn=new T.MeshStandardMaterial({color:0x2a0705,emissive:0xff1a10,emissiveIntensity:1.2,roughness:.5}),rune=new T.MeshStandardMaterial({color:0x140a26,emissive:0x8a4dff,emissiveIntensity:1.05,roughness:.5});
  // No prop can be jumped onto: what blocks reaches at least 1.05 m above the highest ground
  // round it (on a slope that is above the prop's own top on its uphill side).
  const lifted=(wx,wz,reach,top)=>{let g=-Infinity;for(let a=0;a<6.3;a+=.2)for(const f of [.4,.7,1]){const h=groundHeight(wx+Math.cos(a)*(reach+.4)*f,wz+Math.sin(a)*(reach+.4)*f);if(h>g)g=h;}return Math.max(top,g+1.05);};
  function site(x,z,angle=0,base=null,kind='prop'){
    const at=(lx,lz)=>turned(x,z,angle,lx,lz),ground=(wx,wz)=>base??groundHeight(wx,wz);
    const add=(geo,mat,wx,y,wz,sx,sy,sz,rx,ry,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(wx,y,wz);m.scale.set(sx,sy,sz);m.rotation.set(rx,angle+ry,rz,'YXZ');m.castShadow=m.receiveShadow=true;props.add(m);return m;};
    return {x,z,angle,at,
      // A box sx wide, sy high and sz deep, its foot ly above the ground.
      box(mat,lx,ly,lz,sx,sy,sz,{rx=0,ry=0,rz=0,collide=false,platform=false,tall=0}={}){
        const [wx,wz]=at(lx,lz),g=ground(wx,wz);add(BOX,mat,wx,g+ly+sy/2,wz,sx,sy,sz,rx,ry,rz);
        if(collide)boxCollider(wx,wz,sx,sz,g-2,lifted(wx,wz,Math.hypot(sx,sz)/2,g+ly+sy+tall),angle+ry,kind);
        if(platform)platforms.push({x:wx,z:wz,w:sx,d:sz,top:g+ly+sy,cos:Math.cos(angle+ry),sin:Math.sin(angle+ry)});
        return [wx,g,wz];},
      // A post of radius r and height h.
      post(mat,lx,ly,lz,r,h,{rx=0,rz=0,collide=false,reach=0}={}){
        const [wx,wz]=at(lx,lz),g=ground(wx,wz);add(CYL,mat,wx,g+ly+h/2,wz,r,h,r,rx,0,rz);
        if(collide)circleCollider(wx,wz,Math.max(.12,r+reach),g-2,lifted(wx,wz,Math.max(.12,r+reach),g+ly+h),kind);return [wx,g,wz];},
      // A crate, or a barrel, standing on the ground: both block.
      crate(lx,lz,size=1.25,ry=0){return this.box(crate,lx,0,lz,size,size,size,{ry,collide:true});},
      barrel(lx,lz){return this.post(rustMat,lx,0,lz,.33,1.15,{collide:true,reach:.04});},
      // Something that only blocks (no shape of its own), `height` tall.
      block(lx,lz,sx,sz,height,ry=0){const [wx,wz]=at(lx,lz),g=ground(wx,wz);boxCollider(wx,wz,sx,sz,g-2,lifted(wx,wz,Math.hypot(sx,sz)/2,g+height),angle+ry,kind);},
      sub(lx,lz,ry=0){const [wx,wz]=at(lx,lz);return site(wx,wz,angle+ry,base,kind);}
    };
  }
  // A canvas ridge tent on the ground: two sloped sheets `length` long over a `width` floor.
  function ridgeTent(at,length,width,height,{collide=true}={}){
    const half=width/2,slope=Math.hypot(half,height),tilt=Math.atan2(height,half);
    for(const side of [-1,1])at.box(canvas,0,height/2-.03,side*half/2,length,.06,slope,{rx:side*tilt});
    at.post(timber,-length/2,0,0,.05,height+.15);at.post(timber,length/2,0,0,.05,height+.15);
    at.box(canvas,0,0,0,length-.1,.02,width-.1);if(collide)at.block(0,0,length-.1,width-.1,height);   // its floor, and all it blocks
  }

  // The radio tent (v210; the timber shack before it): an open canopy on six poles at the
  // summit, the radio desk under it in the lamp's light. Open on every side: it hides no one.
  {const A=site(TENT.x,TENT.z,0,summit,'tent'),hw=TENT.w/2,hd=TENT.d/2,rise=TENT.ridge-TENT.eave,slope=Math.hypot(hd+.25,rise),tilt=Math.atan2(rise,hd+.25);
    for(const side of [-1,1]){
      A.box(canvas,0,(TENT.eave+TENT.ridge)/2-.03,side*(hd+.25)/2,TENT.w+.5,.06,slope,{rx:side*tilt});          // the canopy
      for(const x of [-hw,0,hw])A.post(timber,x,0,side*hd,.06,TENT.eave,{collide:true});                           // the eave poles
      A.post(timber,side*hw,0,0,.06,TENT.ridge,{collide:true});                                                    // the ridge poles
    }
    A.box(timber,0,TENT.ridge-.1,0,TENT.w+.5,.1,.1);                                                               // the ridge pole
    A.box(canvas,0,0,0,TENT.w-.4,.02,TENT.d-.4);                                                                   // a groundsheet
    A.box(timber,-.9,.74,-1.2,2.6,.06,.8);for(const [x,z] of [[-2.1,-1.5],[.3,-1.5],[-2.1,-.9],[.3,-.9]])A.box(timber,x,0,z,.06,.74,.06);   // the desk
    A.box(steel,-1.3,.8,-1.25,.9,.38,.42);A.box(glow,-1.3,.9,-1.03,.6,.08,.01);                                    // the radio set and its dial
    A.block(-.9,-1.2,2.6,.8,1.2);                                                                                  // what the desk blocks
    A.crate(-2.1,1.3,1.1,.4);
    // v211: the ammunition crate, olive with a yellow band, in the north-east corner (clear of the walk through).
    A.box(ammoMat,AMMO.x,0,AMMO.z,AMMO.size,AMMO.size*.75,AMMO.size,{collide:true});A.box(band,AMMO.x,AMMO.size*.3,AMMO.z,AMMO.size+.02,.08,AMMO.size+.02);A.box(band,AMMO.x,AMMO.size*.75,AMMO.z,AMMO.size*.5,.03,AMMO.size*.12);
  }
  const lamp=new T.PointLight(0xffb867,2.4,7.5,1.6);lamp.position.set(TENT.x-.4,summit+TENT.eave-.25,TENT.z-.4);scene.add(lamp);lights.push(lamp);
  // The rest of the Lookout Compound: a dish on its mount, crates, barrels and what is left of
  // the fence, all at the edge of the summit so the top stays open.
  {const A=site(HILL.x,HILL.z,0,summit,'compound');
    A.post(steel,-4.6,0,4.6,.16,1.7,{collide:true,reach:.5});A.post(steel,-4.6,1.55,4.9,1.05,.1,{rx:.95});A.post(steel,-4.6,1.9,5.25,.04,.9,{rx:.95});   // the dish
    A.crate(7.2,-3.4,1.25,.3);A.crate(7.5,-1.9,1.1,-.2);A.barrel(-1.6,7.6);A.barrel(-.8,7.9);
    for(const [x,z,ry] of [[3.2,-8.3,-.25]]){const F=A.sub(x,z,ry);F.box(steel,0,.1,0,3,1.5,.05,{collide:true});for(const px of [-1.5,0,1.5])F.post(steel,px,0,0,.045,1.75);}
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
  const R=ISLAND.wreck,wx=SITE.wreck.x,wz=SITE.wreck.z;
  const heading=SITE.wreck.heading,wreck=new T.Group();wreck.name='Wreck';world.add(wreck);
  wreck.position.set(wx,groundHeight(wx,wz)-R.sink,wz);wreck.rotation.set(R.roll,-heading,0,'YXZ');
  const hullMat=material(0x2b464b,{roughness:.8,metalness:.2}),rust=rustMat,cabin=material(0xb9b5a6,{roughness:.85});
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
  boxCollider(wx,wz,L*.95,B*1.05,groundHeight(wx,wz)-2,groundHeight(wx,wz)+3.6,-heading,'wreck');

  // ---- The landmarks (v210): grey-box shapes for the design spec's section 3 -------------------
  // Bunker B-01: a concrete portal coming out of the ridge's north-east face (v211: turned to
  // face the reef, its back in the hill), its steel door sealed. The portal runs 6 m into the
  // ridge, so its roof sinks into the slope behind; it blocks only as far back as it shows.
  // Reserved for later: nothing opens, nothing spawns in or near it, the ground round it is open.
  {const B=SITE.bunker,front=turned(B.x,B.z,B.angle,0,1.6),A=site(B.x,B.z,B.angle,groundHeight(front[0],front[1])-.05,'bunker');
    A.box(concrete,0,0,-1.6,5.4,3.6,6);A.block(0,-.9,5.4,4.6,3.6);                       // the portal, and as much of it as stands out
    A.box(concrete,0,3.6,-1.4,6,.35,6.4);                                                 // its roof slab
    A.box(steel,0,.05,1.33,2.3,2.5,.12);A.box(rustMat,0,.05,1.4,.12,2.5,.04);             // the sealed door, and its seam
    A.box(concrete,0,2.65,1.36,3,.5,.2);                                                  // the lintel (B-01's lettering comes with the art)
    for(const side of [-1,1]){
      A.box(warn,side*1.75,2.95,1.36,.22,.22,.1);                                          // warning lamps
      A.box(concrete,side*3.9,0,1.1,3.4,2.6,.45,{ry:side*-.55,collide:true});              // wing walls, holding back the cut
    }
    A.post(steel,1.7,3.95,-2.4,.16,1.1);A.post(steel,-1.5,3.95,-2.9,.12,.7);              // vents, where the roof meets the hill
    const G=site(B.x,B.z,B.angle,null,'bunker');G.crate(-4.6,5.4,1.3,.3);G.crate(-5.9,4.9,1.15,-.4);G.barrel(4.4,5.6);
  }
  // The Jungle Ruin, on its knoll: two lengths of broken wall, an arch you can walk through, a
  // column stub and a floor slab. Open on every side.
  {const A=site(SITE.ruin.x,SITE.ruin.z,SITE.ruin.angle,null,'ruin');
    A.box(stone,0,0,0,3.6,.14,2.8,{platform:true});                                       // the floor slab (a step up)
    A.box(stone,-4.8,0,-5.4,5.6,2.5,.75,{ry:.12,collide:true});A.box(stone,-6.1,2.5,-5.55,2.4,.9,.7,{ry:.12});     // the north wall, higher at one end
    A.box(stone,6,0,-1.2,4.2,1.9,.75,{ry:1.42,collide:true});A.box(stone,6.1,1.9,-.3,1.6,.7,.7,{ry:1.42});          // the east wall
    for(const x of [-2.3,2.3])A.box(stone,x,0,5.6,.9,3.3,.9,{collide:true});A.box(stone,0,3.3,5.6,6,.7,.8);           // the arch
    A.post(stone,-6.2,0,2.6,.5,1.4,{collide:true});A.box(stone,-5,0,3.6,1.5,.2,.8,{ry:.7,platform:true});       // a column stub, and its fallen drum
  }
  // Shipwreck Cove: what washed out of her, up the beach from the wreck.
  {const A=site(wx,wz,0,null,'cove');A.crate(8.5,-6.5,1.3,.5);A.crate(9.9,-7.2,1.1,1.1);A.barrel(8.6,7.4);
    A.box(plank,7,0,-6.5,3.4,.1,.5,{ry:.5});A.box(plank,12.5,0,7.5,2.6,.1,.4,{ry:-.8});}
  // The Coastal Camp, on its bluff: three ridge tents round a dead fire, and the supplies.
  {const A=site(SITE.camp.x,SITE.camp.z,SITE.camp.angle,null,'camp');
    ridgeTent(A.sub(-5,-3.3,.35),3,2.3,1.75);ridgeTent(A.sub(5.3,-3.7,-.5),3,2.3,1.75);ridgeTent(A.sub(-3.3,5.6,1.45),3,2.3,1.75);
    for(let k=0;k<7;k++)A.box(stone,2.4+Math.cos(k*.9)*.7,0,2.6+Math.sin(k*.9)*.7,.3,.18,.26,{ry:k});A.box(plank,2.4,.05,2.6,.9,.1,.12,{ry:.6});   // the fire ring
    A.crate(6.4,1.2,1.3,.2);A.crate(7.2,2.5,1.1,-.5);A.barrel(5.9,3.3);
    A.post(timber,-1.4,0,-4.6,.05,2.1,{collide:true});A.box(glow,-1.4,1.9,-4.6,.16,.2,.16);                              // a lantern on a pole
  }
  // The South Dock: what is left of it. The first span has gone, so the stumps stand on the
  // sand and the deck beyond them stands in the surf, out of reach. Its supplies are ashore.
  {const D=SITE.dock,A=site(D.x,D.z,D.angle,0,'dock'),S2=site(D.x,D.z,D.angle,null,'dock'),start=2.2,len=DOCK.length;
    for(let d=-5;d<=len;d+=2.6)for(const side of [-1,1]){const out=d>=start;(out?A:S2).post(timber,side*1.05,out?-2.6:-.4,d,.13,out?3.9:1.5+(Math.abs(Math.round(d*7))%3)*.2,{collide:!out});}
    A.box(plank,0,1.05,start+(len-start)/2,2.5,.14,len-start);A.box(timber,-1.2,1.19,start+(len-start)/2,.1,.1,len-start);                  // the deck and a kerb
    A.box(plank,.4,.25,start-1.1,2.2,.12,2.4,{rx:.5});                                                                                     // the fallen span
    A.block(0,start+(len-start)/2,2.7,len-start,2.4);                                                                                      // the deck: a wall in the surf
    S2.crate(6.6,-6.2,1.3,.3);S2.crate(7.7,-7.4,1.15,-.4);S2.barrel(7.1,-5);S2.barrel(-1.8,-11);
    S2.post(timber,0,0,-5.4,.07,2.6,{collide:true});S2.box(glow,0,2.35,-5.4,.2,.24,.2);                                                 // a lamp post
  }
  // East Cove: an equipment shelter open to the water (a back wall, four posts and a high roof),
  // a bench of kit and the stores beside it.
  {const A=site(SITE.cove.x,SITE.cove.z,SITE.cove.angle,null,'cove');
    A.box(timber,0,0,-1.9,5,2.9,.14,{collide:true});for(const x of [-2.4,2.4]){A.post(timber,x,0,1.7,.08,3.5,{collide:true});A.post(timber,x,0,-1.8,.08,3);}
    A.box(roofMat,0,3.2,-.05,5.6,.1,4.3,{rx:-.13});
    A.box(timber,-.6,.8,-1.3,2.4,.06,.75);A.box(steel,-1,.86,-1.3,.7,.3,.4);A.block(-.6,-1.3,2.4,.75,1.2);
    A.crate(3.9,-.6,1.3,.2);A.crate(4.4,.9,1.1,-.6);A.barrel(-3.6,-1);A.barrel(-4.2,-.2);
  }
  // The Soul Forge's clearing: a stone dais in a ring of four standing stones, their marks alight.
  {const A=site(SITE.forge.x,SITE.forge.z,SITE.forge.angle,null,'forge');
    A.box(stone,0,0,0,3,.12,3,{platform:true});
    for(let k=0;k<4;k++){const a=k*Math.PI/2+1.25,x=Math.cos(a)*6.3,z=Math.sin(a)*6.3;A.box(stone,x,0,z,.95,2.7+(k%2)*.4,.7,{ry:-a+Math.PI/2,rz:(k%2?-.06:.05),collide:true});
      A.box(rune,x-Math.cos(a)*.37,1.1,z-Math.sin(a)*.37,.12,.9,.04,{ry:-a+Math.PI/2});}
  }
  // North Beach: driftwood above the tide line (too low to block).
  {const A=site(SITE.north.x,SITE.north.z,0,null,'north');for(const [x,z,l,ry] of [[-9,3,3.6,.3],[7,4.5,2.8,-.5],[14,1.5,3.2,1.1],[-17,5,2.4,-.2]])A.post(timber,x,.02,z,.14,l,{rz:Math.PI/2,rx:ry});}
  // The station pads (step 5 builds the stations on them): a pale slab apiece, flush with the ground.
  for(const p of stations){const y=supportBelow(p.x,p.z,Infinity)+.012,m=new T.Mesh(BOX,padMat);m.position.set(p.x,y,p.z);m.scale.set(1.6,.04,1.05);m.rotation.set(0,p.angle,0);m.receiveShadow=true;props.add(m);}
  merge(props);

  // Where nothing may grow or lie: the landmarks, the pads, the trails, the landing spot, the
  // summit, where the dead rise inland and (v210) the beach itself, the island's perimeter loop.
  const KEEP=[[TENT.x,TENT.z,6],[W.x,W.z,4],...LANDMARKS.filter(l=>l.name!=='NORTH BEACH'&&l.name!=='SHIPWRECK COVE').map(l=>[l.x,l.z,l.r-1.5]),[wx,wz,11],...stations.map(p=>[p.x,p.z,4.5]),...shoreSpawns().interior.flatMap(z=>z.points.map(([x,z])=>[x,z,0]))];
  const free=(x,z,gap,beach=.8)=>KEEP.every(([kx,kz,r])=>Math.hypot(x-kx,z-kz)>r+gap)&&Math.hypot(x-HILL.x,z-HILL.z)>HILL.flat+3&&Math.hypot(x-ISLAND.spawn.x,z-ISLAND.spawn.z)>gap+6&&trailDistance(x,z)>gap+2.4&&shoreFraction(x,z)<beach;
  // Palms: leaning trunks and drooping crowns, instanced (two draw calls for all of them).
  const rand=seeded(210),palmSpots=[];
  // (None on Radio Hill's upper slopes: the climb stays open from every side.)
  const clear=(x,z,gap)=>free(x,z,gap)&&groundHeight(x,z)>.5&&Math.hypot(x-HILL.x,z-HILL.z)>HILL.foot-9&&palmSpots.every(p=>Math.hypot(p.x-x,p.z-z)>gap);
  // Thick round the ruin (the jungle), a grove behind Shipwreck Cove, then singles inland of every beach.
  for(let tries=0;tries<900&&palmSpots.length<22;tries++){const a=rand()*Math.PI*2,r=9+rand()*13,x=SITE.ruin.x+Math.cos(a)*r,z=SITE.ruin.z+Math.sin(a)*r*.9;if(clear(x,z,3.4))palmSpots.push({x,z});}
  for(let tries=0;tries<500&&palmSpots.length<34;tries++){const a=Math.PI*(.86+rand()*.4),r=coastRadius(a)*(.5+rand()*.26),x=Math.cos(a)*r,z=Math.sin(a)*r;if(clear(x,z,3.4))palmSpots.push({x,z});}
  for(let tries=0;tries<3000&&palmSpots.length<72;tries++){const a=rand()*Math.PI*2,r=coastRadius(a)*(.56+rand()*.23),x=Math.cos(a)*r,z=Math.sin(a)*r;if(clear(x,z,5.5))palmSpots.push({x,z});}
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
    circleCollider(p.x,p.z,.28,y-1,y+h,'palm');p.top=top;
  });
  trunks.castShadow=crowns.castShadow=true;trunks.computeBoundingSphere();crowns.computeBoundingSphere();world.add(trunks,crowns);solidMeshes.push(trunks,crowns);

  // Rocks: half-buried boulders. v210: on Radio Hill's flanks, thick on the bunker's ridge and
  // the cove's headland, and as reefs in the deep water off the north-east and north-west shores
  // (out of anyone's reach, so those block nothing). Small ones on land can be stood on.
  const rockSpots=[],rockOk=(x,z,size)=>palmSpots.every(p=>Math.hypot(p.x-x,p.z-z)>size+1.4)&&rockSpots.every(s=>Math.hypot(s.x-x,s.z-z)>s.size+size+2.4);   // far enough apart that a brute always passes between two
  const scatter=(count,pick)=>{for(let tries=0,made=0;tries<count*40&&made<count;tries++){const [x,z,size]=pick();if(free(x,z,size+.6,.76)&&groundHeight(x,z)>.6&&rockOk(x,z,size)){rockSpots.push({x,z,size});made++;}}};
  scatter(7,()=>{const a=rand()*Math.PI*2,r=HILL.flat+7+rand()*(HILL.foot-HILL.flat-12);return [HILL.x+Math.cos(a)*r,HILL.z+Math.sin(a)*r,.5+rand()*1.5];});
  {const m=moundAt('BUNKER RIDGE');scatter(9,()=>{const [x,z]=turned(m.x,m.z,-m.angle,(rand()*2-1)*m.length*.8,(rand()*2-1)*m.width*.45);return [x,z,.7+rand()*1.6];});}
  {const m=moundAt('COVE HEAD');scatter(6,()=>{const [x,z]=turned(m.x,m.z,-m.angle,(rand()*2-1)*m.length*.7,(rand()*2-1)*m.width*.6);return [x,z,.6+rand()*1.4];});}
  const landRocks=rockSpots.length;
  for(const [bearing,count] of [[-Math.PI/4,9],[-Math.PI*3/4,9],[.95,4],[Math.PI-.42,3]])for(let k=0,tries=0;k<count&&tries<200;tries++){
    const a=bearing+(rand()-.5)*.5,r=coastRadius(a)*(1.13+rand()*.2),x=Math.cos(a)*r,z=Math.sin(a)*r,size=.9+rand()*1.7;
    if(groundHeight(x,z)<-ISLAND.wade-.5&&rockOk(x,z,size)){rockSpots.push({x,z,size,reef:true});k++;}}
  const rocks=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),material(0x4d524c,{flatShading:true,roughness:.95}),rockSpots.length);rocks.name='Rocks';
  rockSpots.forEach((s,i)=>{const y=s.reef?-.35*s.size:groundHeight(s.x,s.z)-s.size*.35;e4.set(rand()*.6,rand()*Math.PI*2,rand()*.6);q4.setFromEuler(e4);m4.compose(v4.set(s.x,y,s.z),q4,s4.set(s.size*(1+rand()*.3),s.size*(s.reef?1:.75),s.size));rocks.setMatrixAt(i,m4);
    const top=y+s.size*.62;s.top=top;if(s.reef)return;circleCollider(s.x,s.z,s.size*.82,y-1,top,'rock');if(s.size<1.25)platforms.push({x:s.x,z:s.z,r:s.size*.7,top});});
  rocks.castShadow=rocks.receiveShadow=true;rocks.computeBoundingSphere();world.add(rocks);solidMeshes.push(rocks);

  // Brush (v210): low scrub where the dead will rise inland, in the wash and round the ruin. It
  // hides and blocks nothing: you and they push straight through it.
  const brushSpots=[],bush=(x,z,size)=>{if(groundHeight(x,z)>.6&&Math.hypot(x-HILL.x,z-HILL.z)>HILL.flat+2&&stations.every(p=>Math.hypot(p.x-x,p.z-z)>3)&&trailDistance(x,z)>1.6)brushSpots.push({x,z,size});};
  for(const zone of shoreSpawns().interior)for(const [px,pz] of zone.points)for(let k=0;k<4;k++){const a=rand()*Math.PI*2,r=.8+rand()*2.6;bush(px+Math.cos(a)*r,pz+Math.sin(a)*r,.7+rand()*.7);}
  for(let k=0;k<26;k++){const a=rand()*Math.PI*2,r=coastRadius(a)*(.5+rand()*.26);bush(Math.cos(a)*r,Math.sin(a)*r,.6+rand()*.6);}
  const brush=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),material(0x2f4a2c,{flatShading:true,roughness:1}),brushSpots.length);brush.name='Brush';
  brushSpots.forEach((b,i)=>{e4.set(rand()*.5,rand()*Math.PI*2,rand()*.5);q4.setFromEuler(e4);m4.compose(v4.set(b.x,groundHeight(b.x,b.z)+b.size*.28,b.z),q4,s4.set(b.size*(1.1+rand()*.5),b.size*.62,b.size*(1.1+rand()*.4)));brush.setMatrixAt(i,m4);});
  brush.receiveShadow=true;brush.computeBoundingSphere();world.add(brush);

  // ---- Where you are ------------------------------------------------------------------------
  function zoneAt(x,z,y=groundHeight(x,z)){
    const d=Math.hypot(x-HILL.x,z-HILL.z);
    if(d<HILL.flat+1.5)return tentInside(x,z)?'RADIO HILL · SUMMIT · RADIO TENT':'RADIO HILL · SUMMIT';
    const h=groundHeight(x,z);if(h<0)return 'THE SHALLOWS';
    for(const l of LANDMARKS)if((x-l.x)**2+(z-l.z)**2<l.r*l.r)return l.name;
    if(d<HILL.foot*.8&&h>LOW+1.2)return 'RADIO HILL';
    if(shoreFraction(x,z)>.78){const a=Math.atan2(z,x);return Math.abs(a-Math.PI/2)<Math.PI/4?'SOUTH BEACH':Math.abs(a+Math.PI/2)<Math.PI/4?'NORTH SHORE':Math.abs(a)<Math.PI/4?'EAST BEACH':'WEST BEACH';}
    return x<-10?(z<0?'THE JUNGLE':'PALM GROVE'):'THE LOWLANDS';
  }
  // The beacon blinks and the sea moves.
  function update(elapsed){seaMat.uniforms.time.value=elapsed;const on=(elapsed%ISLAND.beacon.period)<ISLAND.beacon.on;beaconMat.emissiveIntensity=on?3.2:.25;beaconLight.intensity=on?26:0;}

  // ---- Routes (v206) ---------------------------------------------------------------------------
  // A flow field toward the player over the land and the wadeable shallows, in 0.5 m cells (fine
  // enough for the gaps between props). A cell is open when a body of the given radius stands
  // there clear of every collider, on the ground or a low slab; it is rebuilt only when the
  // player reaches another cell. The shape the shared enemy AI expects: direction(x,z,y,
  // preference) gives the next cell on the way, whether the player can be reached from here,
  // and how far it is (m). Heights are the enemies' own, relative to the ground.
  function buildRoutes({radius=.44,height=1.8}={}){
    const C=NAV.cell,E=NAV.extent,w=Math.round(2*E/C)+1,n=w*w,blocked=new Uint8Array(n),distance=new Int32Array(n),queue=new Int32Array(n);
    const at=i=>[(i%w)*C-E,Math.floor(i/w)*C-E];
    for(let i=0;i<n;i++){const [x,z]=at(i);if(groundHeight(x,z)<-(ISLAND.wade-.05)||Math.abs(x)+radius>ISLAND.bounds||Math.abs(z)+radius>ISLAND.bounds)blocked[i]=1;}
    // Only cells near a collider can be blocked by one.
    for(const c of colliders){const reach=(c.r??Math.hypot(c.w,c.d)/2)+radius+C;
      for(let iz=Math.max(0,Math.floor((c.z-reach+E)/C));iz<=Math.min(w-1,Math.ceil((c.z+reach+E)/C));iz++)for(let ix=Math.max(0,Math.floor((c.x-reach+E)/C));ix<=Math.min(w-1,Math.ceil((c.x+reach+E)/C));ix++){
        const i=iz*w+ix;if(blocked[i])continue;const [x,z]=at(i),y=supportBelow(x,z,groundHeight(x,z),ISLAND.step);
        if(isBlocked(x,z,radius,colliders,null,y,height)||y+height>ceilingAt(x,z,y))blocked[i]=1;}}
    const index=(x,z)=>{const ix=Math.round((x+E)/C),iz=Math.round((z+E)/C);return ix<0||ix>=w||iz<0||iz>=w?-1:iz*w+ix;};
    distance.fill(99999);let target=-2;
    return {cell:C,w,blocked,distance,index,
      rebuild(x,z){let t=index(x,z);if(t<0){distance.fill(99999);target=-2;return;}
        if(blocked[t]){let best=Infinity;const ix=t%w,iz=Math.floor(t/w);for(let r=1;r<=12&&best===Infinity;r++)for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const jx=ix+dx,jz=iz+dz;if(jx<0||jz<0||jx>=w||jz>=w)continue;const j=jz*w+jx,d=dx*dx+dz*dz;if(!blocked[j]&&d<best){best=d;t=j;}}}
        if(t===target)return;target=t;distance.fill(99999);let head=0,tail=0;queue[tail++]=t;distance[t]=0;
        while(head<tail){const i=queue[head++],ix=i%w,next=distance[i]+1;
          if(ix>0&&!blocked[i-1]&&distance[i-1]>next){distance[i-1]=next;queue[tail++]=i-1;}
          if(ix<w-1&&!blocked[i+1]&&distance[i+1]>next){distance[i+1]=next;queue[tail++]=i+1;}
          if(i>=w&&!blocked[i-w]&&distance[i-w]>next){distance[i-w]=next;queue[tail++]=i-w;}
          if(i<n-w&&!blocked[i+w]&&distance[i+w]>next){distance[i+w]=next;queue[tail++]=i+w;}}
      },
      direction(x,z,y=0,preference=null){
        const i=index(x,z);if(i<0)return null;let best=i,bestCost=Infinity;const ix=i%w;
        for(const j of [ix>0?i-1:-1,ix<w-1?i+1:-1,i>=w?i-w:-1,i<n-w?i+w:-1]){
          if(j<0||blocked[j]||distance[j]>=distance[i])continue;
          if(!preference){if(distance[j]<distance[best])best=j;continue;}
          const [px,pz]=at(j);let hash=Math.imul(j^preference.seed,0x45d9f3b);hash^=hash>>>16;
          const cost=distance[j]+(hash>>>0)/4294967296*.65+preference.crowding(px,pz,0)*2;
          if(cost<bestCost){bestCost=cost;best=j;}
        }
        const [px,pz]=at(best);return {x:px,z:pz,y:0,reachable:distance[best]<99999,distance:distance[best]*C};
      }};
  }

  return {colliders,platforms,solidMeshes,lights,sea,seaMat,depthMap,beacon,beaconLight,lamp,palms:palmSpots,rocks:rockSpots,landRocks,brush:brushSpots,props,tower,wreck,summit,moonDir,buildRoutes,
    sites:SITE,landmarks:LANDMARKS,stations,trails,
    wreckAt:{x:wx,z:wz,heading},groundHeight,supportBelow,ceilingAt,isBlocked,move,updateHeight,zoneAt,update,
    tentInside,visibleFloor:(x,z,support)=>support,floorHeight:(x,z)=>groundHeight(x,z)};
}

// ---- Where the dead come ashore (v206; v210: on the finished map) -----------------------------
// The spawn network from the Dead Tide plan (spec 5.2): 8 major shoreline zones, each a stretch
// of waterline with five points along it; 14 minor shoreline points between them, each at a
// feature of the shore; and 6 concealed interior zones in the brush, shut until The Swarm.
// North is -z; a bearing of 0 is east and pi/2 south. Shoreline points sit in the shallows,
// SHORE.depth deep, where the dead rise out of the surf. v210: the zones carry the names of the
// landmarks now built, the dock's and the wreck's zones stand clear of them (the wreck's on
// either side of her), and the interior zones are where the spec puts them. These are
// candidates only: the director still checks each one before using it.
const EVEN=Object.freeze([-2,-1,0,1,2]);
export const SHORE=Object.freeze({depth:.35,zoneSpread:.09,
  // [name, bearing, the five points' places along the zone (in half-spreads)]
  major:Object.freeze([['NORTH BEACH',-Math.PI/2,EVEN],['NORTH-EAST REEF',-Math.PI/4,EVEN],['EAST SHORE',-.02,EVEN],['SOUTH-EAST COVE',COVE.bearing,EVEN],
    ['SOUTH DOCK SHORE',DOCK.bearing-.12,EVEN],['SOUTH-WEST BEACH',Math.PI*3/4,EVEN],['SHIPWRECK COVE',ISLAND.wreck.bearing,Object.freeze([-5,-3.8,-2.6,2.6,3.8])],['NORTH-WEST REEF',-Math.PI*3/4,EVEN]]),
  minor:Object.freeze([['NORTH TIDE POOL',-1.25],['NORTH ROCKS',-1.05],['REEF SHALLOWS',-.47],['EAST ROCKS',-.3],['EAST FLATS',.3],['COVE HEAD',.9],['DOCK DEBRIS',1.08],
    ['SOUTH DRIFTWOOD',1.64],['SOUTH BEACH',1.9],['SOUTH-WEST ROCKS',2.1],['WRECK DEBRIS SOUTH',2.72],['WRECK DEBRIS NORTH',-2.72],['WEST TIDE POOL',-2.05],['NORTH-WEST DRIFTWOOD',-1.85]]),
  // [name, x, z] with two more points beside each (spec 5.2's six, in its order).
  interior:Object.freeze([['JUNGLE RUIN BRUSH',-27,-38],['NORTH BRUSH',-12,-42],['BUNKER FOLIAGE',16,-40],['EAST THICKET',43,-7],['SOUTH BRUSH',-8,27],['SOUTH-WEST FOLIAGE',-20,16]])
});
// The point in the shallows on a bearing: walking out from the land until the water is this deep.
export function waterline(bearing,depth=SHORE.depth){
  const c=Math.cos(bearing),s=Math.sin(bearing);let r=coastRadius(bearing)*.7;
  while(groundHeight(c*r,s*r)>-depth&&r<120)r+=.05;
  return [+(c*r).toFixed(3),+(s*r).toFixed(3)];
}
// (Worked out once: finding each waterline point walks the seabed.)
let SPAWNS=null;
export function shoreSpawns(){
  if(SPAWNS)return SPAWNS;
  const major=SHORE.major.map(([name,bearing,places])=>({name,bearing,kind:'major',points:places.map(k=>waterline(bearing+k*SHORE.zoneSpread/2))}));
  const minor=SHORE.minor.map(([name,bearing])=>({name,bearing,kind:'minor',points:[waterline(bearing)]}));
  const interior=SHORE.interior.map(([name,x,z])=>({name,kind:'interior',points:[[x,z],[x+2.5,z+1],[x-2,z+2]]}));
  const frozen=list=>Object.freeze(list.map(z=>Object.freeze({...z,points:Object.freeze(z.points.map(p=>Object.freeze(p)))})));
  return SPAWNS=Object.freeze({major:frozen(major),minor:frozen(minor),interior:frozen(interior)});
}

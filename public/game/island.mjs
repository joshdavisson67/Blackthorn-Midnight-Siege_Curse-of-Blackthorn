import * as T from './three.module.js';
import {combineMeshes} from './batching.mjs?v=204';
import {textured,terrain,foliage,standInTextures,ART_UNIFORMS,palmCrownGeometry,fernGeometry,tuftGeometry,shrubGeometry,vineGeometry,boulderGeometry,hullGeometry,columnGeometry} from './island-art.mjs?v=216';

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
    ['RIDGE KNOB',35,-17,8,7,0,2.4,.2],                    // a knob on its south-east end (v212: moved off the Forge's clearing)
    ['RUIN KNOLL',-37,-29,20,18,0,5.4,.42],                // the jungle ruin's plateau (v212: a little more of it flat)
    ['RUIN SPUR',-21,-19,10,7,.62,1.2,.1],                 // Radio Hill's shoulder toward the ruin (v212: lower, and back from the ruin)
    ['NORTH CRAG',11,-45,10,8,.3,3,.15],                   // a crag between the ridge and North Beach
    ['CAMP BLUFF',-31.5,24,20.5,17.5,-.6,5,.45],           // the coastal camp's bluff, above the south-west beach (v212: about a quarter more of it on top)
    ['FORGE RISE',34,-3,12,11,0,1.5,.65],                  // the Soul Forge's clearing (v212: east, off Radio Hill's foot, and flatter)
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
  // v210: in Shipwreck Cove, on the west. v212: twice the size (scale), aground in the shallows along the
  // shore (her landward side at the waterline), her bow turned `skew` up the beach.
  wreck:Object.freeze({bearing:Math.PI+.03,at:1.07,length:13,beam:4.2,scale:2,skew:-.2,roll:.42,sink:.9}),
  beacon:Object.freeze({period:1.6,on:.55})   // the tower's red light: on .55 s of every 1.6 s
});
const {coast:COAST,hill:HILL,lowland:LOW,seabed:DEEP}=ISLAND;
// v210: where three landmarks sit: the dock's bearing on the south shore; East Cove's bearing and
// how far in from the waterline its shelter stands; how far down the ridge's face B-01 is dug.
// v211: B-01 comes out of the ridge's north-east (seaward) face, `out` m from its crest line.
// v212: B-01's apron, a level of earth before its door (in its frame: centre, radius, the edge it eases out over).
const DOCK=Object.freeze({bearing:1.36,length:15}),COVE=Object.freeze({bearing:.62,at:.79}),BUNKER=Object.freeze({out:9,apron:Object.freeze([0,3.6,4.2,5])}),
  AMMO=Object.freeze({x:2.05,z:-1.45,reach:2});   // v211: the tent's ammo crate, in the tent's own frame (v212: the ammunition station, facing the tent's middle)
// v212: the landmarks the stations now stand in or against, in each site's own frame (x across, z
// toward its front). The pads below are worked out from these, and buildIsland builds them.
//   camp       on the bluff's flattest ground (x, z), the fire at the middle; `tents` ridge tents in a half circle of radius `ring` behind
//              it, open toward Radio Hill; two torches at the opening; the outhouse a little outside.
//   boathouse  beside the dock, its seaward end over the surf: `x` across from the dock, from `back`
//              (its door, ashore) to `front` (over the water); locked until threat level `opens`.
//   cove       the wreck's spill: crate stacks up the beach from her, the shotgun against the middle one.
//   ruin       the ruin's walls: [x, z, length, height, thickness, turn], the first two with a station.
const CAMP=Object.freeze({x:-32,z:21.5,ring:6.6,tents:5,torch:Object.freeze([3.1,4.9]),outhouse:Object.freeze({x:-3.83,z:-9.24,ry:.393,w:1.4,d:1.4,h:2.4})}),
  BOATHOUSE=Object.freeze({x:6.2,back:-4.2,front:3.2,w:4.6,wall:3.3,door:1.9,doorHeight:2.85,opens:10}),
  WRECK_SPILL=Object.freeze({stack:Object.freeze([0,8.6]),crate:1.25}),
  RUIN=Object.freeze([[-4.8,-5.4,5.6,2.5,.75,.12],[6,-1.2,4.2,1.9,.75,1.42],[-8.9,-.6,4.4,2.2,.7,1.62],[3.6,-7.9,3.2,1.5,.7,-.08],[8.2,-6.6,1.7,3.4,1.7,.3]].map(w=>Object.freeze(w)));
// Station sizes (station-models.mjs): how deep each kind's cabinet is, so one can stand back to a wall.
const STATION_DEPTH=Object.freeze({weapon:.9,perk:.8,armor:.8,ammo:.65,forge:1.2});
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
// v212: the ground, with B-01's apron filled level in front of its door (at the height of the ground there).
let APRON=null;
// v216 (the user): the coastal camp stands on a plateau, flat right across its tents, outhouse and stations
// (13.5 m from its middle) at the height of its middle; behind it, toward the sea, a cliff falls 1.3 m out
// (too steep for anyone to climb: the dead will be given a way up later) to sand running down to the
// water; in front and at the sides the plateau ramps into the land round it over 10 m or more (longer where the
// land round it lies lower, so no ramp is steeper than about 25 degrees).
export const CAMP_PLATEAU=Object.freeze({flat:13.5,front:10.2,face:1.3,ramp:10,longest:20,foot:2.3,beach:.25});
let CAMPLAND=null;
function campFrame(x,z){
  const C=CAMPLAND??=(()=>{const a=Math.atan2(HILL.x-CAMP.x,HILL.z-CAMP.z);return {c:Math.cos(a),s:Math.sin(a),top:landHeight(CAMP.x,CAMP.z)};})();
  const dx=x-CAMP.x,dz=z-CAMP.z;return {C,lx:dx*C.c-dz*C.s,lz:dx*C.s+dz*C.c,d:Math.hypot(dx,dz)};
}
const campBehind=lz=>smooth(-.5,-4,lz);   // 1 behind the camp (toward the sea), 0 from its middle forward
// ...and toward the Wash, the ravine at its east side: there too it stands on a bluff, its edge a cliff above the
// ravine (a gentle ramp down into a ravine so close would fill it). 1 within 20 degrees of the ravine's middle.
let WASHDIR=null;
function campWashward(lx,lz,d){if(!WASHDIR){const w=moundAt('THE WASH'),{lx:wx,lz:wz,d:wd}=campFrame(w.x,w.z);WASHDIR=[wx/wd,wz/wd];}return d>1e-6?smooth(Math.cos(.7),Math.cos(.35),(lx*WASHDIR[0]+lz*WASHDIR[1])/d):0;}
// How much of a cliff the plateau's edge is there (to the sea, or to the ravine), and how much of that is the sea's.
const campCliffWeight=(lx,lz,d)=>Math.max(campBehind(lz),campWashward(lx,lz,d));
// The plateau's edge toward a direction (given by the sine of its angle from across the camp, so -1 straight
// behind): flat to 13.5 m behind, where the cliff is; to 10.2 m in front and at the sides, enough for the tents
// and torches, so the ramps leave the Wash (the ravine at its east side) its depth. The ground, the cliff's
// rock and the ground's mesh all use this same edge.
function campEdge(sinPhi){const P=CAMP_PLATEAU;let r=P.flat;for(let i=0;i<4;i++)r=P.front+(P.flat-P.front)*campBehind(r*sinPhi);return r;}
function campGround(x,z,h){
  const P=CAMP_PLATEAU,{C,lz,d}=campFrame(x,z);if(d>=P.flat+P.longest)return h;
  const behind=campBehind(lz),{lx}=campFrame(x,z),cw=campCliffWeight(lx,lz,d),sea=cw>1e-6?behind/cw:0,edge=campEdge(d>1e-6?lz/d:0);
  if(d<=edge){calm=1;return C.top;}
  // (Where the land round it is higher, the hill's foot is cut back only as far as it must be.)
  // (Its length is set once for each direction, by the land 10 m out, so the ramp never warps where the land
  // dips or rises under it.)
  const out=(edge+10)/d,ref=landHeight(CAMP.x+(x-CAMP.x)*out,CAMP.z+(z-CAMP.z)*out);
  const L=Math.min(P.flat+P.longest-edge-1,ref>C.top?Math.max(7,(ref-C.top)*3.4):Math.max(P.ramp,(C.top-ref)*2.7)),ramp=C.top+(h-C.top)*smooth(edge,edge+L,d),k=(d-edge)/P.face;
  // (Below the cliff the sand falls toward the sea, never above the land that was there, and is the land again 10 m out.)
  // (To the sea its foot is the sand; to the ravine, the ravine's own side.)
  const footAt=h+(Math.min(h,P.foot)-h)*sea,cliff=k<1?C.top+(footAt-C.top)*k:h+Math.min(0,P.foot-P.beach*(d-edge-P.face)-h)*smooth(edge+P.face+10,edge+P.face+4,d)*sea;
  return ramp+(cliff-ramp)*cw;
}
// The ground as its mesh draws it. Its vertices are 1.5 m apart, too far to draw the cliff's step: lines
// from the plateau's edge to the sand would stand out past the face. So under the rock (the face, and the
// rim of rock 1.7 m deep along the top: CAMP_RIM) the mesh lies at the foot's height, all of it behind
// the rock that covers it; where you stand is still the plateau (groundHeight), on the rim's rock.
export const CAMP_RIM=1.7;
export function campMeshHeight(x,z){const P=CAMP_PLATEAU,{lx,lz,d}=campFrame(x,z),edge=campEdge(d>1e-6?lz/d:0);
  if(d<=edge-CAMP_RIM+.05||d>=edge+P.face+.05||campCliffWeight(lx,lz,d)<=.02)return groundHeight(x,z);
  const C=CAMPLAND,dir=(r)=>[CAMP.x+(lx*C.c+lz*C.s)*r/d,CAMP.z+(-lx*C.s+lz*C.c)*r/d],foot=groundHeight(...dir(edge+P.face+.15));
  if(C.top-foot<.6)return groundHeight(x,z);   // (where the face stands less than 0.6 m, there is no rock: the ground as it is)
  return Math.min(groundHeight(x,z),foot);}
// Where the camp's cliff face is, and its shoulders, where it curves round the plateau's back half and
// meets the side ramps: ground no one stands on, by design.
export function campCliff(x,z){const P=CAMP_PLATEAU,{lx,lz,d}=campFrame(x,z),edge=campEdge(d>1e-6?lz/d:0);return campCliffWeight(lx,lz,d)>.02&&d>edge-.3&&d<edge+P.longest;}
export function groundHeight(x,z){
  if(!APRON){const R=moundAt('BUNKER RIDGE'),a=Math.PI-R.angle,[bx,bz]=turned(R.x,R.z,a,0,BUNKER.out),[fx,fz]=turned(bx,bz,a,0,1.6),[cx,cz,r,edge]=BUNKER.apron,[ax,az]=turned(bx,bz,a,cx,cz);APRON=[ax,az,r,edge,(r+edge)**2,landHeight(fx,fz)];}
  const h=campGround(x,z,landHeight(x,z)),dx=x-APRON[0],dz=z-APRON[1],d2=dx*dx+dz*dz;if(d2>=APRON[4])return h;
  // (It only fills: the ridge behind the door keeps its height.)
  const w=smooth(APRON[2]+APRON[3],APRON[2],Math.sqrt(d2));if(w>=1)calm=1;return h+Math.max(0,APRON[5]-h)*w;
}
function landHeight(x,z){
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
  const T=ISLAND.tent,W=ISLAND.wreck,mound=n=>moundAt(n),ridge=mound('BUNKER RIDGE'),knoll=mound('RUIN KNOLL'),rise=mound('FORGE RISE');
  const [wx,wz]=polar(W.bearing,W.at),[dx,dz]=polar(DOCK.bearing,1),[cx,cz]=polar(COVE.bearing,COVE.at),[nx,nz]=polar(-Math.PI/2,.84);
  // v211: turned round (it faced Radio Hill): its door looks out to the north-east reef, its back in the ridge.
  const bunkerAngle=Math.PI-ridge.angle,[bx,bz]=turned(ridge.x,ridge.z,bunkerAngle,0,BUNKER.out);
  // v212: the wreck lies along the shore; the cove's frame is at her middle, facing inland.
  const cove2=Math.atan2(-Math.cos(W.bearing),-Math.sin(W.bearing));
  const sites={
    tent:{x:T.x,z:T.z,angle:0},tower:{x:ISLAND.tower.x,z:ISLAND.tower.z},
    // v211: an ammunition crate under the tent's canopy (v212: the ammunition station, the island's only one).
    ammo:{x:T.x+AMMO.x,z:T.z+AMMO.z,reach:AMMO.reach,angle:-Math.PI/2},
    bunker:{x:bx,z:bz,angle:bunkerAngle},ruin:{x:knoll.x,z:knoll.z,angle:.3},wreck:{x:wx,z:wz,heading:W.bearing-Math.PI/2+W.skew,angle:cove2},
    // v212: the camp's half circle opens toward Radio Hill.
    camp:{x:CAMP.x,z:CAMP.z,angle:Math.atan2(HILL.x-CAMP.x,HILL.z-CAMP.z)},dock:{x:dx,z:dz,angle:Math.atan2(dx,dz),bearing:DOCK.bearing},
    cove:{x:cx,z:cz,angle:Math.atan2(cx,cz)},forge:{x:rise.x,z:rise.z,angle:.4},north:{x:nx,z:nz}
  };
  const S=sites,at=(site,lx,lz)=>turned(site.x,site.z,site.angle||0,lx,lz);
  // What the HUD calls each place: a circle round it (the first that holds you wins).
  const landmarks=[
    ['BUNKER B-01',...at(S.bunker,0,.5),10],['JUNGLE RUIN',S.ruin.x,S.ruin.z,12],['SHIPWRECK COVE',...at(S.wreck,0,4),17],['COASTAL CAMP',S.camp.x,S.camp.z,12.5],
    ['SOUTH DOCK',...at(S.dock,3,-4),11],['EAST COVE',...at(S.cove,0,3),12],['SOUL FORGE',S.forge.x,S.forge.z,9],['NORTH BEACH',S.north.x,S.north.z,17]
  ].map(([name,x,z,r])=>Object.freeze({name,x,z,r}));
  // The pads: one for every weapon the game sells and the Forge (spec 4.1), the armour and the four
  // perks, spread round the island so that kitting out means moving. No shrines: Dead Tide sells
  // neither the timed double damage nor endless grenades. (v212, revised: one ammunition station,
  // in the radio tent; the others stand against what is built round them: `angle` is the way a
  // station faces, `slab` whether it has a pad of its own, `y` the floor it stands on, if not the ground.)
  const pad=(id,kind,label,landmark,[x,z],{angle=Math.atan2(HILL.x-x,HILL.z-z),slab=true,y=null}={})=>Object.freeze({id,kind,label,landmark,x:+x.toFixed(3),z:+z.toFixed(3),angle:+angle.toFixed(4),slab,y});
  // A station standing with its back to a wall: the wall's frame (centre and turn) and its thickness,
  // the station's kind, how far along the wall it stands, and which face (+1 the wall's front, -1 its back).
  const against=(frame,thick,kind,along=0,face=1)=>{const a=frame.angle+(face<0?Math.PI:0),off=thick/2+STATION_DEPTH[kind]/2+.03,[x,z]=turned(frame.x,frame.z,frame.angle,along,face*off);return [[x,z],{angle:a,slab:false}];};
  const frame=(site,lx,lz,ry=0)=>{const [x,z]=at(site,lx,lz);return {x,z,angle:(site.angle||0)+ry};};
  // The camp's outhouse and the ruin's walls, each a frame of its own.
  const O=CAMP.outhouse,outhouse=frame(S.camp,O.x,O.z,O.ry),wall=k=>frame(S.ruin,RUIN[k][0],RUIN[k][1],RUIN[k][5]);
  // The boathouse's plank floor is level with the sand at its door; the Warden stands on it.
  const B2=BOATHOUSE,floor=+(groundHeight(...at(S.dock,B2.x,B2.back))+.06).toFixed(3),spill=frame(S.wreck,...WRECK_SPILL.stack);
  const wing=frame(S.bunker,3.9,1.1,-.55),hut=frame(S.cove,0,-1.9);
  const stations=[
    pad('bushmaster','weapon','BUSHMASTER .450','LOOKOUT COMPOUND',[HILL.x+1,HILL.z-6.2]),
    pad('katana','weapon','KATANA','LOOKOUT COMPOUND',[HILL.x-7,HILL.z+.5]),
    // Against the ruin's north wall, and Quickhands against the inside of its east wall.
    pad('smg','weapon','RAVEN SMG','JUNGLE RUIN',...against(wall(0),RUIN[0][4],'weapon',.9)),
    // Against the middle stack of crates washed up from the wreck, facing inland.
    pad('shotgun','weapon','SHOTGUN','SHIPWRECK COVE',...against(spill,WRECK_SPILL.crate,'weapon')),
    // Against the outhouse: the M4 on one side, Ironheart on the other.
    pad('rifle','weapon','M4','COASTAL CAMP',...against({...outhouse,angle:outhouse.angle-Math.PI/2},O.w,'weapon')),
    // Inside the boathouse, against its east wall, facing the door's side of the room.
    pad('lmg','weapon','WARDEN LMG','SOUTH DOCK',...(([p,o])=>[p,{...o,y:floor}])(against({...frame(S.dock,B2.x+B2.w/2,B2.back+1.7),angle:S.dock.angle-Math.PI/2},.14,'weapon'))),
    // Side by side in the shelter, backs to its wall, facing the water.
    pad('glock','weapon','GLOCK 21','EAST COVE',...against(hut,.14,'weapon',-1.05)),
    pad('forge','forge','SOUL FORGE','SOUL FORGE',[S.forge.x,S.forge.z]),
    // Against B-01's right-hand wing wall (as you face the door), facing the reef.
    pad('armor','armor','AEGIS BODY ARMOR','BUNKER B-01',...against(wing,.45,'armor',.8)),
    pad('quick','perk','QUICKHANDS','JUNGLE RUIN',...against(wall(1),RUIN[1][4],'perk',.4,-1)),
    // Nearer the water, on the open sand.
    pad('stride','perk','NIGHTSTRIDE','NORTH BEACH',polar(-1.51,.925)),
    pad('iron','perk','IRONHEART','COASTAL CAMP',...against({...outhouse,angle:outhouse.angle+Math.PI/2},O.w,'perk')),
    pad('eye','perk','DEADEYE','EAST COVE',...against(hut,.14,'perk',1.05))
  ];
  // The trails: the spec's seven cross-routes and two that close its loops. The beaches are
  // the perimeter loop.
  const trail=(name,...points)=>Object.freeze({name,points:Object.freeze(points.map(p=>Object.freeze(p)))});
  const trails=[
    trail('RUIN TO RADIO HILL',[S.ruin.x+5,S.ruin.z+3],[-25,-21],[-17,-15],[HILL.x-8.5,HILL.z-.5]),
    trail('WRECK TO CAMP',at(S.wreck,3.2,13.8),[-41,10],[-34,7.5],at(S.camp,0,9.6)),
    trail('NORTH BEACH TO RADIO HILL',[-5,-56],[-10,-44],[-5,-30],[HILL.x,HILL.z-9]),
    trail('BUNKER TO RADIO HILL',at(S.bunker,0,4.5),at(S.bunker,3.5,7.5),[22,-44],[12,-40],[4,-30],[HILL.x+7,HILL.z-6.5]),   // v211: round the ridge's north-west end (v212: and out round the armour)
    trail('RADIO HILL TO FORGE',[HILL.x+9,HILL.z+1],[14,-5],[23,-3.5],[S.forge.x-3.5,S.forge.z]),
    trail('RADIO HILL TO DOCK',[HILL.x+2,HILL.z+9],[1,16],[5,32],[9,46],at(S.dock,-.8,-10.5)),
    trail('CAMP TO EAST COVE',at(S.camp,1.5,9.6),[-14,34],[4,37],[22,32],at(S.cove,-4.5,5)),
    trail('FORGE TO EAST COVE',[S.forge.x+1,S.forge.z+4],[36,13],at(S.cove,7.5,-3)),
    trail('RUIN TO WRECK',[S.ruin.x-2,S.ruin.z+5],[-45,-13],at(S.wreck,-3.2,13.4))
  ];
  return SITES=Object.freeze({sites:Object.freeze(sites),landmarks:Object.freeze(landmarks),stations:Object.freeze(stations),trails:Object.freeze(trails),boathouse:Object.freeze({...BOATHOUSE,floor})});
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

export function buildIsland({scene,world,textures=standInTextures(),audit=false}){
  const colliders=[],platforms=[],solidMeshes=[],lights=[],TEX=textures;
  const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:.92,metalness:0,...extra});
  const TENT=ISLAND.tent,W=ISLAND.tower,summit=groundHeight(HILL.x,HILL.z),{sites:SITE,landmarks:LANDMARKS,stations,trails,boathouse:{floor:BOATHOUSE_FLOOR}}=islandSites();

  // ---- The ground ---------------------------------------------------------------------
  // 1.5 m squares in 30 m chunks out to 90 m; chunks wholly under the sea are left out.
  // Normals come from the height function, so chunk edges join without a seam.
  // v215 (the art pass): the ground wears four textures, sand, grass, earth and rock (island-art.mjs),
  // blended by weights each vertex carries; its colour is now a tint over them (wet sand darker,
  // dry grass yellower, the jungle floor deeper, mud darker). The kinds of ground are as before.
  const SPACING=1.5,CHUNK=20,EXTENT=90,groundMat=terrain(TEX);
  const SAND=[1,0,0,0],GRASS=[0,1,0,0],EARTH=[0,0,1,0],ROCK=[0,0,0,1],weights=[0,0,0,0],c=new T.Color(),tint=new T.Color();
  const dry=new T.Color(.96,.93,.88),wet=new T.Color(.58,.57,.56),duneTint=new T.Color(1.12,1.08,.86),scrubTint=new T.Color(.92,.98,.9),jungleTint=new T.Color(.7,.84,.72),dryGrassTint=new T.Color(1.3,1.18,.82),mudTint=new T.Color(.62,.58,.54),trailTint=new T.Color(1.05,1,.95),stoneTint=new T.Color(.96,.97,.95);
  const KNOLL=moundAt('RUIN KNOLL');
  // The weights (sand, grass, earth, rock) and the tint at a point, by the same rules as v211's colours.
  function groundKind(x,z,h,slope){
    const t=shoreFraction(x,z),patch=.5+.5*Math.sin(x*.31+z*.17)*Math.sin(z*.27-x*.11);
    weights.splice(0,4,...SAND);tint.copy(wet).lerp(dry,smooth(-.1,.55,h));
    const to=(target,k,amount)=>{if(amount<=0)return;for(let i=0;i<4;i++)weights[i]+=(target[i]-weights[i])*Math.min(1,amount);if(k)tint.lerp(k,Math.min(1,amount));};
    to(GRASS,duneTint,Math.min(1,smooth(.9,.76,t)*(.45+patch*.8))*.85);                    // dune grass in patches behind the beach
    to(GRASS,scrubTint,smooth(.8,.62,t)*smooth(1.4,2,h)*(.55+.45*patch));                    // scrub inland
    if(Math.hypot(x-HILL.x,z-HILL.z)<HILL.flat+1.5)to(EARTH,trailTint,.85);                   // the beaten summit
    else if(h>.25){const d=trailDistance(x,z);if(d<2.6)to(EARTH,trailTint,.8*smooth(2.6,1.1,d));}   // the trails, worn to earth
    if(h>.4){relief(x,z);const inland=smooth(.8,.66,t);
      to(GRASS,jungleTint,inland*smooth(30,12,Math.hypot(x-KNOLL.x,z-KNOLL.z))*(.55+.35*patch));      // the jungle floor round the ruin
      {const k=inland*smooth(-6,14,z+x*.35)*(.25+.45*(1-patch))*(1-smooth(0,1.2,dip));if(k>0)tint.lerp(dryGrassTint,Math.min(1,k)*weights[1]);}   // dry grass to the south and east
      to(EARTH,mudTint,smooth(.25,1.1,dip)*.8);                                                      // mud down in the hollows and gullies
      to(ROCK,stoneTint,smooth(.25,.75,crag)*(.35+.5*patch));                                        // stone showing on the rocky hills
    }
    to(ROCK,stoneTint,smooth(.62,.9,slope));                                                        // bare rock on the steep parts (v215: only the steepest; the hills' flanks stay grassy)
    return weights;
  }
  const chunks=Math.ceil(EXTENT*2/(SPACING*CHUNK));
  for(let cz=0;cz<chunks;cz++)for(let cx=0;cx<chunks;cx++){
    const x0=-EXTENT+cx*CHUNK*SPACING,z0=-EXTENT+cz*CHUNK*SPACING,n=CHUNK+1;
    const pos=new Float32Array(n*n*3),nor=new Float32Array(n*n*3),col=new Float32Array(n*n*3),uv=new Float32Array(n*n*2),spl=new Float32Array(n*n*4);let dry=false;
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const x=x0+i*SPACING,z=z0+j*SPACING,h=campMeshHeight(x,z),k=j*n+i;
      const gx=(groundHeight(x+.5,z)-groundHeight(x-.5,z)),gz=(groundHeight(x,z+.5)-groundHeight(x,z-.5)),len=Math.hypot(gx,1,gz);
      pos.set([x,h,z],k*3);nor.set([-gx/len,1/len,-gz/len],k*3);uv.set([x/8,z/8],k*2);
      spl.set(groundKind(x,z,h,Math.hypot(gx,gz)),k*4);c.copy(tint);c.toArray(col,k*3);if(h>-.25)dry=true;
    }
    if(!dry)continue;
    const index=[];for(let j=0;j<CHUNK;j++)for(let i=0;i<CHUNK;i++){const a=j*n+i,b=a+1,d=a+n,e=d+1;index.push(a,d,b,b,d,e);}
    const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(nor,3));geo.setAttribute('color',new T.BufferAttribute(col,3));geo.setAttribute('uv',new T.BufferAttribute(uv,2));geo.setAttribute('splat',new T.BufferAttribute(spl,4));geo.setIndex(index);geo.computeBoundingSphere();geo.computeBoundingBox();
    const mesh=new T.Mesh(geo,groundMat);mesh.name='Island ground';mesh.receiveShadow=true;world.add(mesh);solidMeshes.push(mesh);
  }

  // ---- The sea --------------------------------------------------------------------------
  // One flat sheet at y=0. Its shader reads the water's depth from a map of the ground,
  // so the shallows glow lighter and the surf rolls in exactly where the beach dips under.
  const MAP=256,MAP_SIZE=256,depthData=new Uint8Array(MAP*MAP);
  for(let j=0;j<MAP;j++)for(let i=0;i<MAP;i++){const x=(i+.5)/MAP*MAP_SIZE-MAP_SIZE/2,z=(j+.5)/MAP*MAP_SIZE-MAP_SIZE/2;depthData[j*MAP+i]=Math.round(Math.min(1,Math.max(0,-groundHeight(x,z)/DEEP))*255);}
  const depthMap=new T.DataTexture(depthData,MAP,MAP,T.RedFormat,T.UnsignedByteType);depthMap.magFilter=depthMap.minFilter=T.LinearFilter;depthMap.wrapS=depthMap.wrapT=T.ClampToEdgeWrapping;depthMap.needsUpdate=true;
  const moonDir=new T.Vector3(.6,.55,-.58).normalize();
  // v215 (the art pass): turquoise over the sand in the shallows, the seabed showing through, bent
  // by the ripples and lit by moving caustics, darkening to deep water; the moon's glint on the
  // ripples fades with distance, so far water shimmers instead of breaking into squares.
  const seaMat=new T.ShaderMaterial({fog:true,
    uniforms:T.UniformsUtils.merge([T.UniformsLib.fog,{time:{value:0},depthMap:{value:null},sandMap:{value:null},moonDir:{value:new T.Vector3()},deep:{value:new T.Color(0x031820)},shallow:{value:new T.Color(0x14706c)},bedTint:{value:new T.Color(0x9fe0d6)},foam:{value:new T.Color(0xa8d4cc)},mapSize:{value:MAP_SIZE},seabed:{value:DEEP}}]),
    vertexShader:`varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;vec4 mvPosition=viewMatrix*world;gl_Position=projectionMatrix*mvPosition;
#include <fog_vertex>
}`,
    fragmentShader:`uniform float time;uniform sampler2D depthMap;uniform sampler2D sandMap;uniform vec3 moonDir;uniform vec3 deep;uniform vec3 shallow;uniform vec3 bedTint;uniform vec3 foam;uniform float mapSize;uniform float seabed;varying vec3 vWorld;
#include <fog_pars_fragment>
void main(){
  vec2 p=vWorld.xz;float depth=texture2D(depthMap,p/mapSize+.5).r*seabed;float far=length(cameraPosition-vWorld),near=1.-smoothstep(25.,140.,far);
  // Ripples tilt a fake normal (calmer with distance); the moon glints along them.
  vec2 rip=vec2(cos(p.x*.35+time*.9)*.028+cos((p.x+p.y)*.9+time*1.6)*.02,cos(p.y*.41-time*.7)*.033+sin(p.x*.7-p.y*.5+time*1.1)*.015);
  vec3 n=normalize(vec3(rip.x*near,1.,rip.y*near));
  vec3 view=normalize(cameraPosition-vWorld);
  // The seabed through the water: sand, bent by the ripples, under moving caustics.
  vec3 bed=texture2D(sandMap,(p+rip*18.)/5.).rgb;
  float caustic=abs(sin(p.x*1.6+time*.7+sin(p.y*1.2+time*.5)*1.6)*sin(p.y*1.8-time*.6+sin(p.x*1.05-time*.4)*1.6));caustic=pow(caustic,2.5);
  // The deeper it lies, the less of the bed shows and the bluer and dimmer it is.
  float under=smoothstep(.0,1.7,depth),clear=(1.-under)*mix(.35,.9,view.y);
  vec3 water=mix(deep,shallow,(1.-smoothstep(.2,2.2,depth))*.85);
  vec3 col=mix(water,bed*bedTint*(.45+.6*caustic*near)*mix(1.,.4,under),clear*.72);
  float glint=pow(max(dot(n,normalize(view+moonDir)),0.),mix(140.,260.,near))*mix(.06,1.1,near);
  col+=vec3(.7,.95,.9)*glint+deep*.35*(1.-view.y);
  // Surf: bands rolling in over the shallows, and a ribbon of foam on the sand's edge.
  float surf=1.-smoothstep(.05,.55,depth),band=.5+.5*sin(depth*20.-time*2.3+sin(p.x*.13+p.y*.11)*2.);
  float froth=surf*smoothstep(.6,1.,band)*.7+(1.-smoothstep(.0,.09,depth))*.85;
  col=mix(col,foam,clamp(froth,0.,1.)*.55);
  gl_FragColor=vec4(col,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
#include <fog_fragment>
}`});
  seaMat.uniforms.depthMap.value=depthMap;seaMat.uniforms.sandMap.value=TEX.sand;seaMat.uniforms.moonDir.value.copy(moonDir);
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
  // v216: and every solid thing's top: anything that blocks you holds you up if you come down on it, so
  // nothing can be landed inside (a jump onto a rock, or over a low wall, ends on top of it). A rock's top
  // is its own rounded crown (its collider's dome), never lower than the lip that stops you walking onto it.
  function topOf(c,x,z){
    if(c.dome){const d=Math.hypot(x-c.x,z-c.z);if(d>=c.r)return -Infinity;const D=c.dome;return Math.max(c.top,D.base+(D.peak-D.base)*(1-(d/D.rv)**2));}
    if(c.r!==undefined)return (x-c.x)**2+(z-c.z)**2<c.r*c.r?c.top:-Infinity;
    const dx=x-c.x,dz=z-c.z,lx=dx*c.cos-dz*c.sin,lz=dx*c.sin+dz*c.cos;return Math.abs(lx)<=c.w/2&&Math.abs(lz)<=c.d/2?c.top:-Infinity;
  }
  function supportBelow(x,z,y=Infinity,step=0){let h=groundHeight(x,z);const near=nearPlatforms(x,z);for(let i=0;i<near.length;i++){const p=near[i];if(p.top>h&&p.top<=y+step+1e-6&&inPlatform(p,x,z))h=p.top;}
    const solid=nearColliders(x,z);for(let i=0;i<solid.length;i++){const t=topOf(solid[i],x,z);if(t>h&&t<=y+step+1e-6)h=t;}return h;}
  // v210: under the radio tent's canopy (its eaves are the ceiling; a brute stands under them).
  const tentInside=(x,z)=>Math.abs(x-TENT.x)<TENT.w/2&&Math.abs(z-TENT.z)<TENT.d/2;
  // v212: inside the boathouse (its own frame: x across from the dock, z out to sea).
  const boathouseInside=(x,z)=>{const D=SITE.dock,dx=x-D.x,dz=z-D.z,c=Math.cos(D.angle),s=Math.sin(D.angle),lx=dx*c-dz*s-BOATHOUSE.x,lz=dx*s+dz*c;return Math.abs(lx)<BOATHOUSE.w/2&&lz>BOATHOUSE.back&&lz<BOATHOUSE.front;};
  function ceilingAt(x,z,y){if(tentInside(x,z)&&y<summit+TENT.eave)return summit+TENT.eave-.05;if(boathouseInside(x,z)&&y<BOATHOUSE_FLOOR+BOATHOUSE.wall-.1)return BOATHOUSE_FLOOR+BOATHOUSE.wall-.16;return Infinity;}
  function isBlocked(x,z,r,_colliders,_bounds,y=0,height=1.8){
    const B=ISLAND.bounds;if(Math.abs(x)+r>B||Math.abs(z)+r>B)return true;
    const near=r<=REACH?nearColliders(x,z):colliders;for(let i=0;i<near.length;i++)if(touches(near[i],x,z,r,y,height))return true;return false;
  }
  // Walking: short sub-steps, sliding along whatever blocks. On the ground the feet
  // follow it up and down; the sea is wadeable to ISLAND.wade and slows you as it deepens.
  function move(pos,dx,dz,r=.32,{grounded=true,height=1.8,canOccupy=null}={}){
    const depth=Math.max(0,-groundHeight(pos.x,pos.z)),drag=1-.45*Math.min(1,depth/ISLAND.wade);dx*=drag;dz*=drag;
    // v216: a body that is somehow inside something solid (dropped into it, say) may always step away from
    // it, never further in, so nothing can hold anyone fast.
    const stuck=isBlocked(pos.x,pos.z,r,colliders,null,pos.y,height);
    const freeing=(x,z,y)=>{const near=nearColliders(x,z);for(let i=0;i<near.length;i++){const c=near[i];if(!touches(c,x,z,r,y,height))continue;
      if(!touches(c,pos.x,pos.z,r,pos.y,height)||(x-c.x)**2+(z-c.z)**2<=(pos.x-c.x)**2+(pos.z-c.z)**2)return false;}return true;};
    function step(x,z){
      if(groundHeight(x,z)<-ISLAND.wade)return;
      const surface=supportBelow(x,z,pos.y,ISLAND.step),near=Math.abs(surface-pos.y)<=ISLAND.step;
      if(grounded&&surface>pos.y+ISLAND.step)return;
      const y=grounded&&near?surface:pos.y;
      if(isBlocked(x,z,r,colliders,null,y,height)&&!(stuck&&freeing(x,z,y)))return;
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
  // v215 (the art pass): every surface wears a texture (island-art.mjs), laid on in world space.
  const timber=textured(TEX,'wood',{color:0xc4b6a2}),plank=textured(TEX,'wood',{color:0x9a8a76}),roofMat=textured(TEX,'rust',{color:0x8c8480,roughness:.75,metalness:.3}),glow=new T.MeshStandardMaterial({color:0x1a1108,emissive:0xe8913c,emissiveIntensity:.85,roughness:.6}),steel=textured(TEX,'rust',{color:0x8a9698,roughness:.6,metalness:.45,scale:.6});
  const canvas=textured(TEX,'cloth',{color:0xd0ccb0,roughness:1}),concrete=textured(TEX,'concrete',{roughness:.95}),stone=textured(TEX,'stone',{roughness:1,scale:1.25}),rustMat=textured(TEX,'rust',{roughness:.85,metalness:.2}),crate=textured(TEX,'wood',{color:0xc0a27e,scale:.55}),padMat=textured(TEX,'paving',{color:0xd8d2c4,roughness:.85});
  // v215: camouflaged concrete, painted railings, deep shadow for openings; lettering, vines and scrub
  // as alpha cards (still: merged, they do not sway).
  const camo=textured(TEX,'camo',{color:0xb4aca2,roughness:.95}),railPaint=textured(TEX,'rust',{color:0x8aa6b4,roughness:.6,metalness:.4,scale:.5}),paving=textured(TEX,'paving',{color:0xa09c90,roughness:.95}),dark=new T.MeshStandardMaterial({color:0x040506,roughness:1});
  const stencilMat=foliage(TEX,'stencil',{sway:0}),vineMat=foliage(TEX,'vines',{sway:0,color:0xd0dcc4}),leafMat=foliage(TEX,'leaves',{sway:0,color:0xc8d8bc});
  const PLANE=new T.PlaneGeometry(1,1),VINE=vineGeometry(1,1),SHRUB=shrubGeometry(9);
  // The ruin's column capital (a flared echinus) and a fallen drum (centred on its middle); a carved panel's darker stone.
  const CAPITAL=new T.CylinderGeometry(.6,.4,.3,32),DRUM=columnGeometry({radius:.42,height:1.5}).translate(0,-.75,0),carved=textured(TEX,'stone',{color:0x8c8a80,scale:.35});CAPITAL.translate(0,.15,0);
  const thatch=textured(TEX,'thatch',{color:0xc0ae90,roughness:1}),forgeRock=textured(TEX,'rock',{color:0x9c9a92,scale:.4}),cliffRock=textured(TEX,'rock',{color:0x8e8c84,scale:.9,side:T.DoubleSide});
  const flame=new T.MeshStandardMaterial({color:0x3a1404,emissive:0xff8a2a,emissiveIntensity:2.2,roughness:.6}),warn=new T.MeshStandardMaterial({color:0x2a0705,emissive:0xff1a10,emissiveIntensity:1.2,roughness:.5}),rune=new T.MeshStandardMaterial({color:0x140a26,emissive:0x8a4dff,emissiveIntensity:1.05,roughness:.5});
  // No prop can be jumped onto: what blocks reaches at least 1.05 m above the highest ground
  // round it (on a slope that is above the prop's own top on its uphill side).
  const lifted=(wx,wz,reach,top)=>{let g=-Infinity;for(let a=0;a<6.3;a+=.2)for(const f of [.4,.7,1]){const h=groundHeight(wx+Math.cos(a)*(reach+.4)*f,wz+Math.sin(a)*(reach+.4)*f);if(h>g)g=h;}return Math.max(top,g+1.05);};
  function site(x,z,angle=0,base=null,kind='prop'){
    const at=(lx,lz)=>turned(x,z,angle,lx,lz),ground=(wx,wz)=>base??groundHeight(wx,wz);
    const add=(geo,mat,wx,y,wz,sx,sy,sz,rx,ry,rz,grounded=false)=>{const m=new T.Mesh(geo,mat);m.userData.grounded=grounded;m.userData.kind=kind;m.position.set(wx,y,wz);m.scale.set(sx,sy,sz);m.rotation.set(rx,angle+ry,rz,'YXZ');m.castShadow=m.receiveShadow=true;props.add(m);return m;};
    // v216: the lowest ground under a footprint (half-sizes hx, hz, turned by a): a part standing on
    // sloping ground reaches down to it, so no edge of it hangs in the air.
    const lowest=(wx,wz,hx,hz,a)=>{let g=groundHeight(wx,wz);const c=Math.cos(a),s=Math.sin(a);for(const fx of [-1,-.5,0,.5,1])for(const fz of [-1,-.5,0,.5,1]){const h=groundHeight(wx+fx*hx*c+fz*hz*s,wz-fx*hx*s+fz*hz*c);if(h<g)g=h;}return g;};
    // (On a site of fixed height, a part reaches down from its own foot only where the real ground lies lower.)
    const downTo=(g,ly,low)=>base===null?Math.min(g,low)+ly:Math.min(g+ly,low);
    return {x,z,angle,at,
      // A box sx wide, sy high and sz deep, its foot ly above the ground. (v216: standing on the ground,
      // it reaches down to the lowest ground under it; its top stays where it was.)
      box(mat,lx,ly,lz,sx,sy,sz,{rx=0,ry=0,rz=0,collide=false,platform=false,tall=0,visible=true}={}){
        const [wx,wz]=at(lx,lz),g=ground(wx,wz);
        if(visible){const tilt=Math.abs(rx)+Math.abs(rz),stand=ly<=.05&&tilt<.15,foot=stand?downTo(g,ly,lowest(wx,wz,sx/2,sz/2,angle+ry))-Math.sin(tilt)*Math.max(sx,sz)/2:g+ly,top=g+ly+sy;add(BOX,mat,wx,(foot+top)/2,wz,sx,top-foot,sz,rx,ry,rz,ly<=.05);}
        if(collide)boxCollider(wx,wz,sx,sz,g-2,lifted(wx,wz,Math.hypot(sx,sz)/2,g+ly+sy+tall),angle+ry,kind);
        if(platform)platforms.push({x:wx,z:wz,w:sx,d:sz,top:g+ly+sy,cos:Math.cos(angle+ry),sin:Math.sin(angle+ry)});
        return [wx,g,wz];},
      // A post of radius r and height h.
      post(mat,lx,ly,lz,r,h,{rx=0,rz=0,collide=false,reach=0,visible=true}={}){
        // v216: its height is its foot's (ly above the ground) plus its real half-height as it lies: h/2
        // standing, r laid on its side (a log rests on the ground, its middle not h/2 up in the air).
        const [wx,wz]=at(lx,lz),g=ground(wx,wz),up=Math.abs(Math.cos(rx)*Math.cos(rz)),half=up*h/2+Math.sqrt(Math.max(0,1-up*up))*r;
        if(visible){if(ly<=.05&&up>.99){const foot=downTo(g,ly,lowest(wx,wz,r,r,0)),top=g+ly+h;add(CYL,mat,wx,(foot+top)/2,wz,r,top-foot,r,rx,0,rz,true);}else add(CYL,mat,wx,g+ly+half,wz,r,h,r,rx,0,rz,ly<=.05);}
        if(collide)circleCollider(wx,wz,Math.max(.12,r+reach),g-2,lifted(wx,wz,Math.max(.12,r+reach),g+ly+h),kind);return [wx,g,wz];},
      // v216: a log lying on the ground from one point to another, following its slope (sunk a little into it).
      log(lx0,lz0,lx1,lz1,r,mat=timber){const [ax,az]=at(lx0,lz0),[bx,bz]=at(lx1,lz1),a=new T.Vector3(ax,ground(ax,az)+r*.7,az),b=new T.Vector3(bx,ground(bx,bz)+r*.7,bz),dir=b.clone().sub(a),len=dir.length();
        const m=new T.Mesh(CYL,mat);m.userData.grounded=true;m.userData.kind=kind;m.position.copy(a).add(b).multiplyScalar(.5);m.scale.set(r,len,r);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());m.castShadow=m.receiveShadow=true;props.add(m);return m;},
      // A crate, or a barrel, standing on the ground: both block.
      crate(lx,lz,size=1.25,ry=0){return this.box(crate,lx,0,lz,size,size,size,{ry,collide:true});},
      barrel(lx,lz){return this.post(rustMat,lx,0,lz,.33,1.15,{collide:true,reach:.04});},
      // Something that only blocks (no shape of its own), `height` tall.
      block(lx,lz,sx,sz,height,ry=0){const [wx,wz]=at(lx,lz),g=ground(wx,wz);boxCollider(wx,wz,sx,sz,g-2,lifted(wx,wz,Math.hypot(sx,sz)/2,g+height),angle+ry,kind);},
      sub(lx,lz,ry=0){const [wx,wz]=at(lx,lz);return site(wx,wz,angle+ry,base,kind);},
      // v215: any shape, its origin ly above the ground (or the base) at (lx, lz).
      shape(geo,mat,lx,ly,lz,{sx=1,sy=1,sz=1,rx=0,ry=0,rz=0}={}){const [wx,wz]=at(lx,lz),g=ground(wx,wz);return add(geo,mat,wx,g+ly,wz,sx,sy,sz,rx,ry,rz);}
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
    // (v211's ammunition crate stood in the north-east corner; v212: the standard ammunition station stands there, built by tide.mjs.)
  }
  // v215: the camp's fire throws a flickering light (placed with the camp, below).
  const fireLight=new T.PointLight(0xff8a3c,3,11,1.7);scene.add(fireLight);lights.push(fireLight);
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
  const towerMat=textured(TEX,'rust',{color:0xa8b0ae,roughness:.6,metalness:.5,scale:.4}),redPaint=textured(TEX,'rust',{color:0xe0705c,roughness:.6,metalness:.35,scale:.4});
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

  // The wreck: a freighter run aground and rolled onto her side, half sunk in the sand. (v212: twice
  // the size, lying along the shore in the shallows, her bow turned a little up the beach.)
  const R=ISLAND.wreck,wx=SITE.wreck.x,wz=SITE.wreck.z,K=R.scale;
  const heading=SITE.wreck.heading,wreck=new T.Group();wreck.name='Wreck';world.add(wreck);
  wreck.position.set(wx,groundHeight(wx,wz)-R.sink*K,wz);wreck.rotation.set(R.roll,-heading,0,'YXZ');wreck.scale.setScalar(K);
  // v215 (the art pass, after the user's reference): a steel coastal freighter, rust-streaked, plated
  // hull lofted from bow to transom (island-art.mjs), her deck rusted through in places; the bridge and
  // its funnel aft, in old white paint; cargo hatches amidships; an ochre derrick mast forward with its
  // booms, cross-trees and stays. The same size and lie as v212's, and the same collider.
  const L=R.length,B=R.beam,hull=hullGeometry({length:L*.95,beam:B*.95,depth:2.3,holes:[[.34,.41],[.52,.56]]}),deckAt=t=>hull.userData.deck(t);
  const hullMat=textured(TEX,'rust',{roughness:.82,metalness:.2,vertexColors:true,side:T.DoubleSide,scale:1.6}),rust=rustMat,cabin=textured(TEX,'concrete',{color:0xe6e0d2,roughness:.85});
  const ochre=textured(TEX,'rust',{color:0xf2c27a,roughness:.7,metalness:.3,scale:.5}),glass=new T.MeshStandardMaterial({color:0x091013,roughness:.25,metalness:.5});
  {const m=new T.Mesh(hull,hullMat);m.castShadow=m.receiveShadow=true;wreck.add(m);}
  const at=t=>-L*.95/2+t*L*.95,dk=t=>deckAt(t),wd=t=>hull.userData.width(t);
  // The bridge: two decks of superstructure aft, a wheelhouse window band facing forward, portholes, a rail.
  {const x=at(.17),y=dk(.17);
    part(wreck,BOX,cabin,x,y+.75,0,{sx:2.6,sy:1.5,sz:3.1});part(wreck,BOX,cabin,x-.15,y+2.05,0,{sx:1.9,sy:1.1,sz:2.5});
    part(wreck,BOX,cabin,x-.15,y+2.66,0,{sx:2.2,sy:.1,sz:3.3});                                             // the bridge deck's roof, overhanging
    part(wreck,BOX,glass,x+.81,y+2.15,0,{sx:.03,sy:.38,sz:2.1});part(wreck,BOX,glass,x+1.31,y+1.05,0,{sx:.03,sy:.3,sz:2.4});
    for(const side of [-1,1])for(let k=0;k<3;k++)part(wreck,CYL,glass,x-.8+k*.75,y+.95,side*1.56,{sx:.13,sy:.04,sz:.13,rx:Math.PI/2});
    part(wreck,BOX,glow,x-.05,y+.95,1.57,{sx:.18,sy:.18,sz:.02});                                         // a dead glow in one porthole
    for(const side of [-1,1])part(wreck,BOX,steel,x,y+1.85,side*1.6,{sx:2.6,sy:.05,sz:.05});part(wreck,BOX,steel,x+1.3,y+1.85,0,{sx:.05,sy:.05,sz:3.2});
    for(let k=0;k<5;k++)for(const side of [-1,1])part(wreck,BOX,steel,x-1.25+k*.62,y+1.67,side*1.6,{sx:.05,sy:.35,sz:.05});
    // The funnel, raked aft, with a faded band.
    part(wreck,CYL,cabin,x-.95,y+3.3,0,{sx:.42,sy:1.6,sz:.42,rz:.1});part(wreck,CYL,rust,x-1.0,y+3.82,0,{sx:.44,sy:.32,sz:.44,rz:.1});}
  // Amidships: two cargo hatches, their covers half gone.
  for(const [t,missing] of [[.47,1],[.62,0]]){const x=at(t),y=dk(t);part(wreck,BOX,rust,x,y+.22,0,{sx:1.9,sy:.45,sz:2.3});
    for(let k=0;k<4;k++)if(!(missing&&k%2))part(wreck,BOX,plank,x-.7+k*.47,y+.47,0,{sx:.42,sy:.06,sz:2.2,rz:(k%3)*.04});}
  // Forward: the derrick mast, its cross-trees and lookout, two booms resting aft, and its stays.
  {const t=.76,x=at(t),y=dk(t),top=y+6.2;
    part(wreck,CYL,ochre,x,y+3.1,0,{sx:.13,sy:6.2,sz:.13});part(wreck,BOX,ochre,x,top-1.4,0,{sx:.14,sy:.14,sz:2.3});
    part(wreck,BOX,ochre,x,top-.75,0,{sx:.9,sy:.07,sz:.9});for(const side of [-1,1]){part(wreck,BOX,steel,x,top-.5,side*.44,{sx:.9,sy:.04,sz:.04});part(wreck,BOX,steel,x+side*.44,top-.5,0,{sx:.04,sy:.04,sz:.9});}
    // (v216: the booms lowered onto the after hatch, their tops held by the topping lifts; the shrouds made fast
    // to the bulwarks; nothing hangs in the air.)
    for(const side of [-1,1]){const foot=new T.Vector3(x-.15,y+.8,side*.32),tip=new T.Vector3(at(.62)+.75,dk(.62)+.52,side*.75);strut(wreck,ochre,foot,tip,.13);
      strut(wreck,steel,new T.Vector3(x,top-1.4,side*1.1),tip,.025);}
    strut(wreck,steel,new T.Vector3(x,top,0),new T.Vector3(at(.985),dk(.985)+.7,0),.03);                 // the forestay
    {const t2=t+.6/(L*.95);for(const side of [-1,1])strut(wreck,steel,new T.Vector3(x,top-1.4,side*1.1),new T.Vector3(at(t2),dk(t2)+.74,side*wd(t2)*.96),.025);}}   // the shrouds
  // Bollards along her deck, inside her rails.
  for(const t of [.3,.56,.88])for(const side of [-1,1])part(wreck,CYL,steel,at(t),dk(t)+.18,side*wd(t)*.68,{sx:.13,sy:.36,sz:.13});
  // v216: her stem, and a cap rail along each gunwale, so her edges read as steel, not paper.
  strut(wreck,rust,new T.Vector3(at(1)-.02,hull.userData.keel(1),0),new T.Vector3(at(1)-.02,dk(1)+.78,0),.16);
  for(const side of [-1,1])for(let k=0;k<16;k++){const t0=.02+k*.98/16,t1=t0+.98/16;strut(wreck,rust,new T.Vector3(at(t0),dk(t0)+.77,side*wd(t0)),new T.Vector3(at(t1),dk(t1)+.77,side*wd(t1)),.09);}
  merge(wreck);
  boxCollider(wx,wz,L*.95*K,B*1.05*K,groundHeight(wx,wz)-2,groundHeight(wx,wz)+3.6*K,-heading,'wreck');

  // ---- The landmarks (v210): grey-box shapes for the design spec's section 3 -------------------
  // Bunker B-01: a concrete portal coming out of the ridge's north-east face (v211: turned to
  // face the reef, its back in the hill), its steel door sealed. The portal runs 6 m into the
  // ridge, so its roof sinks into the slope behind; it blocks only as far back as it shows.
  // Reserved for later: nothing opens, nothing spawns in or near it, the ground round it is open.
  {const B=SITE.bunker,front=turned(B.x,B.z,B.angle,0,1.6),A=site(B.x,B.z,B.angle,groundHeight(front[0],front[1])-.05,'bunker');
    // v215 (the art pass, after the user's reference): olive and faded-peach camouflage over the
    // concrete; a headwall of pilasters and a lintel standing proud, B-01's number and year stencilled
    // on it; a recess to the sealed door, welded shut; its timber gates, one folded back against the
    // face, one shut across the mouth with a chained bar beside it (B-01 stays shut: the collider is
    // v212's, across the mouth); the wing walls stepping down, one with a dark bay; a steel railing
    // along the roof's edge; scrub and vines over it all. Colliders as before.
    const ow=1.45,oh=2.75;                                                                   // the opening's half-width and height
    A.box(camo,-(2.7+ow)/2,0,-1.6,2.7-ow,3.6,6);A.box(camo,(2.7+ow)/2,0,-1.6,2.7-ow,3.6,6);A.box(camo,0,oh,-1.6,2*ow,3.6-oh,6);   // the portal: its cheeks and the mass over the opening
    A.block(0,-.9,5.4,4.6,3.6);                                                              // all it blocks, as before
    A.box(concrete,0,3.6,-1.4,6,.35,6.4);                                                    // its roof slab
    for(const side of [-1,1]){A.box(camo,side*(ow+.42),0,1.47,.84,oh+.1,.16);A.box(warn,side*(ow+.42),2.25,1.57,.2,.2,.08);}   // pilasters, and their warning lamps
    A.box(camo,0,oh,1.47,2*ow+1.7,.6,.17);A.shape(PLANE,stencilMat,0,oh+.31,1.565,{sx:2.5,sy:.62});                         // the lintel and its lettering
    A.box(steel,0,0,.55,2*ow,oh,.12);A.box(concrete,0,-.03,1.0,2*ow,.05,.9);                                                    // the sealed door, the recess's floor
    for(const side of [-1,1])A.box(rustMat,0,1.35+side*.45,.63,2*ow-.15,.13,.03,{rz:side*.52});                               // welded straps across it
    A.post(rustMat,.75,1.3,.66,.24,.05,{rx:Math.PI/2});A.box(warn,0,oh-.25,.62,2*ow,.08,.02);                                   // its wheel, and a red band
    // The gates: planks, rails and a brace. Left: folded back flat against the face; right: shut.
    const gate=G=>{for(let k=0;k<4;k++)G.box(timber,-.52+k*.35,.05,0,.32,2.35,.05);for(const y of [.35,1.95])G.box(plank,0,y,.05,1.42,.14,.04);G.box(plank,0,1.15,.05,1.6,.12,.04,{rz:-1});};
    gate(A.sub(-ow-.78,1.6));gate(A.sub(ow/2,1.43));
    A.box(steel,-ow/2,1,1.45,ow,.07,.07);for(let k=0;k<6;k++)A.box(rustMat,-ow+.12+k*.24,.82,1.47,.12,.05,.03,{rz:(k%2?.4:-.4)});   // the bar, and its chain
    for(const side of [-1,1]){
      const W=A.sub(side*3.9,1.1,side*-.55);W.block(0,0,3.4,.45,2.6);                                   // the wing walls: v212's colliders
      W.box(camo,-side*.85,0,0,1.7,2.6,.45);W.box(camo,side*.85,0,0,1.7,1.7,.45);                         // stepping down from the portal
      W.box(concrete,-side*.85,2.6,0,1.76,.12,.55);W.box(concrete,side*.85,1.7,0,1.76,.12,.55);         // their copings
      if(side<0){W.box(dark,side*.9,.18,.235,.9,.95,.02);W.box(concrete,side*.9,1.13,.26,1.1,.13,.07);}   // a dark bay in the left one
    }
    // The railing along the roof's edge, painted steel; vents where the roof meets the hill.
    for(let k=0;k<6;k++)A.post(railPaint,-2.9+k*1.16,3.95,1.68,.035,1.05);for(const y of [4.45,4.98])A.box(railPaint,0,y,1.68,5.9,.05,.05);
    A.post(steel,1.7,3.95,-2.4,.16,1.1);A.post(steel,-1.5,3.95,-2.9,.12,.7);
    // Scrub and vines on and over it.
    for(const [x,z,k] of [[-2.4,-.3,1.3],[2.5,-1.6,1.1],[.4,-3.4,1.4],[-1.2,-4.2,1.2]])A.shape(SHRUB,leafMat,x,3.92,z,{sx:k*1.2,sy:k,sz:k*1.2});
    for(const [x,w,d] of [[-1.85,1.1,1.7],[2.2,.9,1.3]])A.shape(VINE,vineMat,x,3.75,1.83,{sx:w,sy:d});
    const G=site(B.x,B.z,B.angle,null,'bunker');G.crate(-4.6,5.4,1.3,.3);G.crate(-5.9,4.9,1.15,-.4);G.barrel(-3.3,6.9);   // (v212: the barrel moved over by the crates, off the trail round the armour)
  }
  // The Jungle Ruin, on its knoll: lengths of broken wall (RUIN: v212 adds a west wall, a fallen
  // length on the north side and a corner tower), an arch you can walk through, columns and a floor
  // slab. Open on every side; the Raven SMG stands against the north wall, Quickhands inside the east one.
  {const A=site(SITE.ruin.x,SITE.ruin.z,SITE.ruin.angle,null,'ruin'),rr=seeded(3215);
    // v215 (the art pass, after the user's two references, at the spec's modest size): mossy ashlar
    // walls on plinth courses with broken copings; a round arch of voussoirs on piers with capitals;
    // fluted columns, one whole with its capital, the others broken; a pedestal by the arch; a broken
    // paved path through it; vines hanging from the arch and the walls. Colliders as before, but
    // for the pedestal's (new).
    A.box(paving,0,0,0,3.6,.14,2.8,{platform:true});                                     // the floor slab (a step up)
    RUIN.forEach(([x,z,length,height,thick,ry],k)=>{A.box(stone,x,0,z,length,height,thick,{ry,collide:true});
      const W=A.sub(x,z,ry);W.box(stone,0,-.12,0,length+.18,.44,thick+.16);                // its plinth course
      for(let j=0;j<Math.max(1,Math.round(length/1.6));j++){const w=.45+rr()*.5;if(rr()<.3)continue;W.box(stone,(rr()-.5)*(length-w),height,(rr()-.5)*.06,w,.16+rr()*.22,thick+.04,{rz:(rr()-.5)*.08});}   // broken coping stones
      if(k===0)for(const along of [-1.7,-.4])W.shape(VINE,vineMat,along,height+.05,thick/2+.02,{sx:1.1,sy:1.4+rr()*.6});
      if(k===1)W.shape(VINE,vineMat,-1,height+.05,thick/2+.02,{sx:1,sy:1.3});
      if(k===2)W.shape(VINE,vineMat,.6,height+.05,-thick/2-.02,{sx:1.2,sy:1.5,ry:Math.PI});});
    A.box(stone,-6.1,2.5,-5.55,2.4,.9,.7,{ry:.12});A.box(stone,6.1,1.9,-.3,1.6,.7,.7,{ry:1.42});   // the north and east walls' higher ends
    A.box(stone,-8.75,2.2,.6,1.5,.6,.65,{ry:1.62});A.box(stone,8.2,3.4,-6.6,1.2,.5,1.2,{ry:.3});    // the west wall's, and the tower's broken top
    // The arch: piers (v212's colliders) on plinths under capitals, and nine voussoirs turning a round
    // arch over them, the keystone proud; vines over its face.
    const SPRING=3.62,RI=1.85,RT=.62,RM=RI+RT/2,NV=9;
    for(const x of [-2.3,2.3]){A.box(stone,x,0,5.6,.9,3.3,.9,{collide:true});A.box(stone,x,-.08,5.6,1.18,.48,1.18);A.box(stone,x,3.3,5.6,1.16,.32,1.16);}
    for(let k=0;k<NV;k++){const a=Math.PI-(k+.5)*Math.PI/NV,key=k===(NV-1)/2,h=key?.8:RT,w=RM*Math.PI/NV*.965;
      A.box(stone,RM*Math.cos(a),SPRING+RM*Math.sin(a)-h/2+(key?.06:0),5.6,w,h,key?.92:.86,{rz:a-Math.PI/2});}
    for(const [x,z,d] of [[-1.1,6.06,1.9],[.9,6.06,1.5],[.3,5.14,1.6]])A.shape(VINE,vineMat,x,SPRING+Math.sqrt(Math.max(0,(RI+RT)**2-x*x))-.15,z,{sx:.95,sy:d,ry:z<5.6?Math.PI:0});
    // Fluted columns: one standing whole with its base and capital, one broken, one a stump on its plinth;
    // and a drum fallen from them (v212's low platform, now its shape).
    {const tall=columnGeometry({radius:.42,height:3,seed:1});A.post(stone,2.2,0,-3.9,.42,2.6,{collide:true,visible:false});
      A.box(stone,2.2,-.06,-3.9,1.08,.36,1.08);A.shape(tall,stone,2.2,.3,-3.9);A.shape(CAPITAL,stone,2.2,3.3,-3.9);A.box(stone,2.2,3.6,-3.9,1.22,.2,1.22);}
    A.post(stone,4.6,0,-3.5,.42,1.7,{collide:true,visible:false});A.box(stone,4.6,-.06,-3.5,1.08,.36,1.08);A.shape(columnGeometry({radius:.42,height:1.45,broken:.45,seed:5}),stone,4.6,.3,-3.5);
    A.post(stone,-6.2,0,2.6,.5,1.4,{collide:true,visible:false});A.box(stone,-6.2,-.06,2.6,1.25,.32,1.25);A.shape(columnGeometry({radius:.5,height:1.15,broken:.5,seed:2}),stone,-6.2,.26,2.6);
    A.box(stone,-5,0,3.6,1.5,.2,.8,{ry:.7,platform:true,visible:false});A.shape(DRUM,stone,-5,-.22,3.6,{rz:Math.PI/2,ry:.7});
    for(const [x,z,ry] of [[1.2,-7.1,.4],[5.6,-8.6,-.3],[-9.6,-3.4,.9]])A.box(stone,x,-.25,z,.9,.5,.7,{ry,rz:.1});              // fallen blocks, half buried
    // A pedestal beside the path, a carved panel on its face (new: it blocks).
    A.box(stone,3.3,-.06,8,1.02,.32,1.02);A.box(stone,3.3,.26,8,.74,.86,.74);A.box(carved,3.3,.4,8.37,.48,.54,.02);A.box(stone,3.3,1.12,8,.98,.17,.98);A.block(3.3,8,1.02,1.02,1.3);
    // The paved path, from the floor slab through the arch and out, its flags broken and missing.
    for(let z=1.7;z<12.2;z+=.62)for(const x of [-.62,0,.62]){if(rr()<.24)continue;const w=.5+rr()*.3,d=.48+rr()*.22;A.box(paving,x+(rr()-.5)*.25+Math.sin(z*.35)*.4,-.04,z,w,.08,d,{ry:(rr()-.5)*.35});}
  }
  // Shipwreck Cove: what washed out of her, stacked up the beach (v212: three stacks of crates, the
  // shotgun against the middle one), with a barrel and planks.
  {const A=site(wx,wz,SITE.wreck.angle,null,'cove'),c=WRECK_SPILL.crate,[sx,sz]=WRECK_SPILL.stack;
    // A stack: crates side by side on the sand, more on top; it blocks as high as it stands.
    const stack=(x,z,ry,row,top)=>{const S2=A.sub(x,z,ry);row.forEach((k,i)=>S2.box(crate,k,0,0,c,c,c,{collide:true,tall:top.length?c:0}));top.forEach(k=>S2.box(crate,k,c,0,c*.92,c*.92,c*.92,{ry:.12}));};
    stack(sx,sz,0,[-c,0,c],[-c/2,c/2]);                                                   // the middle stack: three, and two on top
    stack(sx-6.4,sz-1.6,.35,[0,c],[c/2]);stack(sx+6,sz-2.2,-.4,[0,c*1.02],[0]);                       // and one either side
    A.barrel(sx-2.4,sz+2.2);A.barrel(sx+3.1,sz+.3);
    A.box(plank,sx-2.5,0,sz+2.8,3.4,.1,.5,{ry:.5});A.box(plank,sx+4,0,sz+2.4,2.6,.1,.4,{ry:-.8});}
  // The Coastal Camp, on its bluff (v212: rebuilt, about a quarter larger): the fire in the middle,
  // five ridge tents in a half circle behind it (their ends toward the fire), two torches at the
  // opening, which faces Radio Hill; seats round the fire, supplies, a woodpile and a table; and a
  // little way out the back, the outhouse, with the M4 and Ironheart against its sides.
  {const A=site(SITE.camp.x,SITE.camp.z,SITE.camp.angle,null,'camp'),R=CAMP.ring;
    for(let k=0;k<10;k++){const a=k/10*TAU;A.box(forgeRock,Math.cos(a)*.9,0,Math.sin(a)*.9,.34,.22,.28,{ry:-a});}       // the fire ring (v216: dark, sooty stones)
    A.box(plank,0,.08,0,1.1,.13,.15,{ry:.6});A.box(plank,0,.14,0,1.1,.13,.15,{ry:-.5});A.box(glow,0,.02,0,.75,.07,.75);A.block(0,0,2.1,2.1,.4);   // its logs and embers
    {const [fx,fz]=A.at(0,0);fireLight.position.set(fx,groundHeight(fx,fz)+.7,fz);}                             // v215: and its light
    // v216: the cliff behind the camp, as a face of rough rock over the ground's own steep step (which the
    // ground's 1.5 m mesh can only draw as a saw edge): from below the sand at its foot up to a lip at the
    // plateau's edge, following the edge round as far as the cliff stands 0.6 m or more. Seen, not felt:
    // the ground itself says where anyone stands, and the face never reaches out past the cliff's foot.
    {const P=CAMP_PLATEAU,pos=[],index=[],ROWS=7,columns=[],lump=(u,v)=>.2*Math.sin(u*2.3+v*1.7)+.14*Math.sin(u*5.1-v*2.9+1.3)+.08*Math.sin(u*11.7+v*4.1);
      for(let phi=Math.PI-1.2;phi<=TAU+.5+1e-6;phi+=.045){const lx=Math.cos(phi),lz=Math.sin(phi),E=campEdge(lz),top=supportBelow(...A.at(lx*(E-.05),lz*(E-.05)),Infinity),[fx,fz]=A.at(lx*(E+P.face+.15),lz*(E+P.face+.15)),foot=groundHeight(fx,fz);
        if(top-foot<.6){columns.push(null);continue;}const col=[];
        for(let j=0;j<=ROWS;j++){const v=j/ROWS,y=foot-.7+(top+.1-(foot-.7))*v,r=E+.1+(P.face+.05)*Math.pow(1-v,.8)-Math.max(0,lump(phi*14,v*3))*(1-v*.5)*(v<.95?1:0)*.6;
          const [x,z]=A.at(lx*r,lz*r);col.push(pos.length/3);pos.push(x,y,z);}
        // ...and on over the plateau's edge, a low rim of rock 1.7 m deep (over where the mesh slopes down to the face).
        for(const [inward,lift] of [[.5,.14],[1.1,.1],[CAMP_RIM,-.06]]){const r=E+.1-inward,[x,z]=A.at(lx*r,lz*r);col.push(pos.length/3);pos.push(x,top+lift+.05*Math.abs(lump(phi*17,inward)),z);}
        columns.push(col);}
      for(let i=0;i<columns.length-1;i++){const a=columns[i],b=columns[i+1];if(!a||!b)continue;for(let j=0;j<a.length-1;j++)index.push(a[j],b[j],a[j+1],a[j+1],b[j],b[j+1]);}
      const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(index);g.computeVertexNormals();g.computeBoundingSphere();
      const face=new T.Mesh(g,cliffRock);face.name='Camp cliff';face.castShadow=face.receiveShadow=true;props.add(face);}
    for(const a of [1.15,TAU/2,TAU-1.15]){const L=A.sub(Math.sin(a)*2.3,Math.cos(a)*2.3,a+Math.PI/2);L.post(timber,0,-.04,0,.2,1.4,{rz:Math.PI/2});L.block(0,0,1.4,.45,.4);}   // log seats
    for(let k=0;k<CAMP.tents;k++){const ph=Math.PI/2+k*Math.PI/(CAMP.tents-1);ridgeTent(A.sub(Math.sin(ph)*R,Math.cos(ph)*R,ph-Math.PI/2),3,2.3,1.75);}
    for(const side of [-1,1]){const [x,z]=[side*CAMP.torch[0],CAMP.torch[1]];                                        // the torches at the opening
      A.post(timber,x,0,z,.06,1.95,{collide:true});A.box(timber,x,1.9,z,.24,.12,.24);A.box(flame,x,2.02,z,.17,.32,.17);}
    A.crate(-9.1,-3.4,1.25,.3);A.crate(-9.6,-2,1.1,-.2);A.box(crate,-9.1,1.25,-3.4,1.05,1.05,1.05,{ry:.5});A.barrel(-8.4,-5);   // supplies, a crate on top
    {const P=A.sub(7.3,3.6,-.4);for(let k=0;k<3;k++)for(let j=0;j<3-k;j++)P.post(timber,0,-.02+k*.26,(j-(2-k)/2)*.3,.15,1.7,{rz:Math.PI/2});P.block(0,0,1.8,1.1,.9);}   // the woodpile
    {const D=A.sub(8.4,-1.6,.6);D.box(timber,0,.74,0,1.6,.06,.8);for(const [x,z] of [[-.7,-.32],[.7,-.32],[-.7,.32],[.7,.32]])D.box(timber,x,0,z,.06,.74,.06);D.box(glow,.4,.8,0,.16,.22,.16);D.block(0,0,1.6,.8,1.1);}   // a table and its lantern
    {const O=CAMP.outhouse,H=A.sub(O.x,O.z,O.ry);                                                                       // the outhouse, its door toward the camp
      H.box(plank,0,0,0,O.w,O.h-.15,O.d,{collide:true});H.box(timber,0,.04,O.d/2+.01,.72,1.95,.03);H.box(steel,.25,1.6,O.d/2+.03,.12,.12,.02);
      H.box(roofMat,0,O.h-.12,0,O.w+.25,.08,O.d+.3,{rx:.14});}
  }
  // The South Dock: what is left of it. The first span has gone, so the stumps stand on the
  // sand and the deck beyond them stands in the surf, out of reach. Its supplies are ashore.
  {const D=SITE.dock,A=site(D.x,D.z,D.angle,0,'dock'),S2=site(D.x,D.z,D.angle,null,'dock'),start=2.2,len=DOCK.length;
    for(let d=-5;d<=len;d+=2.6)for(const side of [-1,1]){const out=d>=start;(out?A:S2).post(timber,side*1.05,out?-2.6:-.4,d,.13,out?3.9:1.5+(Math.abs(Math.round(d*7))%3)*.2,{collide:!out});}
    A.box(plank,0,1.05,start+(len-start)/2,2.5,.14,len-start);A.box(timber,-1.2,1.19,start+(len-start)/2,.1,.1,len-start);                  // the deck and a kerb
    A.box(plank,.4,.25,start-1.1,2.2,.12,2.4,{rx:.5});                                                                                     // the fallen span
    A.block(0,start+(len-start)/2,2.7,len-start,2.4);                                                                                      // the deck: a wall in the surf
    S2.crate(11.4,-5.6,1.3,.3);S2.crate(12.4,-6.9,1.15,-.4);S2.barrel(11.2,-4);S2.barrel(-1.8,-11);
    S2.post(timber,0,0,-5.4,.07,2.6,{collide:true});S2.box(glow,0,2.35,-5.4,.2,.24,.2);                                                 // a lamp post
    // v212: the boathouse, beside the dock with its seaward end over the surf: plank walls on piles, a
    // pitched roof, a plank floor ashore and a slip with a rowboat over the water. Its only way in is the
    // door ashore, locked until the threat reaches BOATHOUSE.opens; the Warden LMG stands inside.
    const BH=BOATHOUSE,X=BH.x,hw=BH.w/2,mid=(BH.back+BH.front)/2,span=BH.front-BH.back,H=site(D.x,D.z,D.angle,BOATHOUSE_FLOOR-.06,'boathouse'),sink=1.6;
    for(const side of [-1,1])H.box(plank,X+side*(hw-.07),-sink,mid,.14,BH.wall+sink,span,{collide:true});                     // the side walls
    H.box(plank,X,-sink,BH.front-.07,BH.w,BH.wall+sink,.14,{collide:true});H.box(timber,X,.2,BH.front+.01,.08,2.2,.02);      // the boat doors, shut
    const jamb=(BH.w-BH.door)/2;for(const side of [-1,1])H.box(plank,X+side*(BH.door/2+jamb/2),-sink,BH.back+.07,jamb,BH.wall+sink,.14,{collide:true});
    H.box(plank,X,BH.doorHeight,BH.back+.07,BH.door,BH.wall-BH.doorHeight,.14);H.box(timber,X,BH.doorHeight-.05,BH.back-.01,BH.door+.2,.1,.06);   // over the door (tall enough for a brute), and its lintel
    const rise=1,slope=Math.hypot(hw+.3,rise),tilt=Math.atan2(rise,hw+.3);
    for(const side of [-1,1])H.box(roofMat,X+side*(hw+.3)/2,BH.wall+rise/2-.03,mid,slope,.08,span+.5,{rz:-side*tilt});   // the roof
    for(const z of [BH.back+.2,mid,BH.front-.2])H.box(timber,X,BH.wall-.12,z,BH.w-.2,.1,.1);                                 // tie beams
    H.box(plank,X,-.2,BH.back+1.65,BH.w-.3,.26,3,{platform:true});                                                           // the plank floor, ashore
    for(const side of [-1,1])H.post(timber,X+side*(hw+.1),-sink-.6,BH.front+.12,.13,BH.wall+sink+.6);                         // piles at the seaward corners
    H.box(glow,X+hw-.2,2.2,BH.back+.6,.06,.2,.14);                                                                             // a dim lamp by the door
    const boat=site(...turned(D.x,D.z,D.angle,X-1.25,BH.front-1.9),D.angle,null,'boathouse');                                    // the rowboat in the slip
    boat.box(rustMat,0,-.1,0,1.2,.45,2.8,{collide:true});for(const side of [-1,1])boat.box(plank,side*.6,.1,0,.08,.4,2.8);boat.box(plank,0,.3,.3,1.1,.06,.35);
  }
  // East Cove: an equipment shelter open to the water (a back wall, four posts and a high roof),
  // and the stores beside it.
  {const A=site(SITE.cove.x,SITE.cove.z,SITE.cove.angle,null,'cove');
    A.box(timber,0,0,-1.9,5,2.9,.14,{collide:true});for(const x of [-2.4,2.4]){A.post(timber,x,0,1.7,.08,3.5,{collide:true});A.post(timber,x,0,-1.8,.08,3);}
    // v215: a deep thatched roof (after the user's aerial reference), overhanging, its eave fringed.
    A.box(thatch,0,3.12,-.05,6.1,.32,4.9,{rx:-.13});A.box(thatch,0,3.42,-.05,6.3,.14,.5,{rx:-.13});
    for(let k=0;k<9;k++)A.box(thatch,-2.8+k*.7,2.98+((k*7)%3)*.03,2.32,.72,.32,.08,{rx:-.13});
    // (v212: its bench is gone: the Glock 21's rack and Deadeye stand side by side against the back wall, facing the water.)
    A.crate(3.9,-.6,1.3,.2);A.crate(4.4,.9,1.1,-.6);A.barrel(-3.6,-1);A.barrel(-4.2,-.2);
  }
  // The Soul Forge's clearing: a stone dais in a ring of four standing stones, their marks alight.
  {const A=site(SITE.forge.x,SITE.forge.z,SITE.forge.angle,null,'forge');
    A.box(stone,0,0,0,3,.12,3,{platform:true});
    for(let k=0;k<4;k++){const a=k*Math.PI/2+1.25,x=Math.cos(a)*6.3,z=Math.sin(a)*6.3;A.box(forgeRock,x,0,z,.95,2.7+(k%2)*.4,.7,{ry:-a+Math.PI/2,rz:(k%2?-.06:.05),collide:true});
      A.box(rune,x-Math.cos(a)*.37,1.1,z-Math.sin(a)*.37,.12,.9,.04,{ry:-a+Math.PI/2});}
  }
  // North Beach: driftwood above the tide line (too low to block). (v216: lying on the sand along its slope,
  // each turned its own way: the old ones floated, their middles half their length up.)
  {const A=site(SITE.north.x,SITE.north.z,0,null,'north');for(const [x,z,l,ry] of [[-9,3,3.6,.3],[7,4.5,2.8,-.5],[14,1.5,3.2,1.1],[-17,5,2.4,-.2]]){const dx=Math.cos(ry)*l/2,dz=Math.sin(ry)*l/2;A.log(x-dx,z-dz,x+dx,z+dz,.14,plank);}}
  // The station pads (step 5 builds the stations on them): a pale slab apiece, flush with the ground.
  // (v212: wide enough for a weapon's cabinet, and thick enough to meet the ground on a slight slope.)
  for(const p of stations){if(!p.slab)continue;const y=supportBelow(p.x,p.z,Infinity)-.06,m=new T.Mesh(BOX,padMat);m.position.set(p.x,y,p.z);m.scale.set(2.2,.16,1.4);m.rotation.set(0,p.angle,0);m.receiveShadow=true;props.add(m);}
  // v216: what stands on the ground but does not meet it. Each part placed with its foot on the ground
  // (or a log on it) is checked before the props are merged: its lowest points against the ground
  // under each of them. buildIsland({audit:true}) lists any that float, for the tests.
  const floating=[];
  if(audit){props.updateMatrixWorld(true);const v=new T.Vector3();
    for(const m of props.children){if(!m.isMesh||!m.userData.grounded)continue;const p=m.geometry.attributes.position,step=Math.max(1,Math.floor(p.count/240)),pts=[];let low=Infinity;
      for(let i=0;i<p.count;i+=step){v.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);pts.push(v.clone());if(v.y<low)low=v.y;}
      let gap=-Infinity,at=null;for(const q of pts){if(q.y>low+.06)continue;const g=supportBelow(q.x,q.z,q.y+.02),d=q.y-g;if(d>gap){gap=d;at=q;}}
      if(gap>.08)floating.push({kind:m.userData.kind,material:m.material.name,x:+at.x.toFixed(2),z:+at.z.toFixed(2),gap:+gap.toFixed(2)});}}
  merge(props);
  // v212: the boathouse door: two leaves on their hinges, apart from the merged props since they swing
  // open, and a collider of its own across the doorway while it is shut.
  const boathouseDoor=(()=>{
    const BH=BOATHOUSE,D=SITE.dock,[x,z]=turned(D.x,D.z,D.angle,BH.x,BH.back),y=BOATHOUSE_FLOOR-.06,group=new T.Group();
    group.name='Boathouse door';group.position.set(x,y,z);group.rotation.y=D.angle;world.add(group);
    const leaves=[-1,1].map(side=>{const hinge=new T.Group();hinge.position.set(side*BH.door/2,0,.07);group.add(hinge);
      const leaf=new T.Mesh(BOX,plank);leaf.scale.set(BH.door/2-.04,BH.doorHeight-.08,.07);leaf.position.set(-side*BH.door/4,(BH.doorHeight-.08)/2+.04,0);leaf.castShadow=leaf.receiveShadow=true;hinge.add(leaf);
      const bar=new T.Mesh(BOX,timber);bar.scale.set(BH.door/2-.1,.1,.03);bar.position.set(-side*BH.door/4,1.3,-.05);hinge.add(bar);return hinge;});
    const collider={x,z,w:BH.door,d:.3,bottom:y-2,top:y+BH.doorHeight+.2,cos:Math.cos(D.angle),sin:Math.sin(D.angle),kind:'boathouse door'};colliders.push(collider);
    let open=false,since=0,now=0;
    return {x,z,opens:BH.opens,get open(){return open;},
      // Opening swings the leaves out over a second and frees the doorway at once; shutting is instant (a new run).
      setOpen(value){if(value===open)return;open=value;since=now;const i=colliders.indexOf(collider);if(open&&i>=0)colliders.splice(i,1);if(!open&&i<0)colliders.push(collider);if(!open)leaves.forEach(h=>h.rotation.y=0);},
      update(elapsed){now=elapsed;if(!open)return;const t=Math.min(1,(elapsed-since)/1.1),e=1-(1-t)**3;leaves.forEach((h,i)=>{h.rotation.y=(i?-1:1)*1.9*e;});},
      group,collider};
  })();

  // Where nothing may grow or lie: the landmarks, the pads, the trails, the landing spot, the
  // summit, where the dead rise inland and (v210) the beach itself, the island's perimeter loop.
  const KEEP=[[TENT.x,TENT.z,6],[W.x,W.z,4],...LANDMARKS.filter(l=>l.name!=='NORTH BEACH'&&l.name!=='SHIPWRECK COVE').map(l=>[l.x,l.z,l.r-1.5]),[wx,wz,16],...stations.map(p=>[p.x,p.z,4.5]),...shoreSpawns().interior.flatMap(z=>z.points.map(([x,z])=>[x,z,0]))];
  const free=(x,z,gap,beach=.8)=>KEEP.every(([kx,kz,r])=>Math.hypot(x-kx,z-kz)>r+gap)&&Math.hypot(x-HILL.x,z-HILL.z)>HILL.flat+3&&Math.hypot(x-ISLAND.spawn.x,z-ISLAND.spawn.z)>gap+6&&trailDistance(x,z)>gap+2.4&&shoreFraction(x,z)<beach;
  // Palms: leaning trunks and drooping crowns, instanced (two draw calls for all of them).
  const rand=seeded(210),palmSpots=[];
  // (None on Radio Hill's upper slopes: the climb stays open from every side.)
  // (v212: a palm keeps 2.2 m clear of what must stay open, whatever its spacing from the next palm;
  // with all the station pads, the wider spacing left too few places.)
  const clear=(x,z,gap)=>free(x,z,2.2)&&groundHeight(x,z)>.5&&Math.hypot(x-HILL.x,z-HILL.z)>HILL.foot-9&&palmSpots.every(p=>Math.hypot(p.x-x,p.z-z)>gap);
  // Thick round the ruin (the jungle), a grove behind Shipwreck Cove, then singles inland of every beach.
  for(let tries=0;tries<900&&palmSpots.length<22;tries++){const a=rand()*Math.PI*2,r=9+rand()*13,x=SITE.ruin.x+Math.cos(a)*r,z=SITE.ruin.z+Math.sin(a)*r*.9;if(clear(x,z,3.4))palmSpots.push({x,z});}
  for(let tries=0;tries<500&&palmSpots.length<34;tries++){const a=Math.PI*(.86+rand()*.4),r=coastRadius(a)*(.5+rand()*.26),x=Math.cos(a)*r,z=Math.sin(a)*r;if(clear(x,z,3.4))palmSpots.push({x,z});}
  for(let tries=0;tries<3000&&palmSpots.length<46;tries++){const a=rand()*Math.PI*2,r=coastRadius(a)*(.56+rand()*.23),x=Math.cos(a)*r,z=Math.sin(a)*r;if(clear(x,z,5.5))palmSpots.push({x,z});}
  const trunkGeo=new T.CylinderGeometry(.15,.27,1,7,4);trunkGeo.translate(0,.5,0);
  /* v215: the crowns are island-art.mjs's palmCrownGeometry now.
  const crownGeo=(()=>{const pos=[],nor=[],uv=[];
    for(let f=0;f<8;f++){const a=f/8*Math.PI*2+(f%2)*.2,dir=new T.Vector3(Math.cos(a),0,Math.sin(a)),side=new T.Vector3(-dir.z,0,dir.x);
      for(let s=0;s<5;s++){const t0=s/5,t1=(s+1)/5,p=t=>new T.Vector3().addScaledVector(dir,t*2.6).setY(.35*Math.sin(t*2.2)-t*t*1.5),w=t=>.42*Math.sin(Math.PI*Math.min(1,t*1.15+.05));
        const a0=p(t0),a1=p(t1),q=[a0.clone().addScaledVector(side,-w(t0)),a0.clone().addScaledVector(side,w(t0)),a1.clone().addScaledVector(side,-w(t1)),a1.clone().addScaledVector(side,w(t1))];
        for(const k of [0,2,1,1,2,3]){pos.push(...q[k].toArray());nor.push(0,1,0);uv.push(k&1,k>>1);}}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(nor,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.computeBoundingSphere();return g;})(); */
  // v215: ringed bark up the trunks (its texture wrapped round them, a metre a ring band), and crowns of
  // drooping fronds with young ones rising (island-art.mjs), swaying a little.
  const barkMap=TEX.bark.clone();barkMap.repeat.set(1,7.5);barkMap.needsUpdate=true;
  const m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler(),v4=new T.Vector3(),s4=new T.Vector3(),trunkAt=[],crownAt=[];
  // (v216: each palm's trunk and crown, kept to be drawn once v216's palms have joined them, below.)
  const placePalm=(p,r)=>{
    const h=6+r()*3.2,out=Math.atan2(p.z,p.x),lean=.12+r()*.2,y=groundHeight(p.x,p.z)-.12;
    e4.set(Math.sin(out)*lean,0,-Math.cos(out)*lean);q4.setFromEuler(e4);m4.compose(v4.set(p.x,y,p.z),q4,s4.set(1,h,1));trunkAt.push(m4.clone());
    const top=new T.Vector3(0,h,0).applyQuaternion(q4).add(v4.set(p.x,y,p.z));e4.set(0,r()*Math.PI*2,0);q4.setFromEuler(e4);m4.compose(top,q4,s4.setScalar(.85+r()*.35));crownAt.push(m4.clone());
    circleCollider(p.x,p.z,.28,y-1,y+h,'palm');p.top=top;
  };
  palmSpots.forEach(p=>placePalm(p,rand));

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
  // v215: weathered boulders (island-art.mjs), in the rock texture, a little damp-dark.
  const boulder=boulderGeometry(5),boulderPoints=boulder.attributes.position,bv=new T.Vector3();
  const rocks=new T.InstancedMesh(boulder,textured(TEX,'rock',{color:0xb8b8b0,roughness:.92,scale:.5}),rockSpots.length);rocks.name='Rocks';
  rockSpots.forEach((s,i)=>{const y=s.reef?-.35*s.size:groundHeight(s.x,s.z)-s.size*.35;e4.set(rand()*.6,rand()*Math.PI*2,rand()*.6);q4.setFromEuler(e4);m4.compose(v4.set(s.x,y,s.z),q4,s4.set(s.size*(1+rand()*.3),s.size*(s.reef?1:.75),s.size));rocks.setMatrixAt(i,m4);
    // v216: its collider from the rock as you see it: as wide as it shows above the ground (less your
    // body's own reach, so you stop at its face), and its top its crown, a dome you can land and stand on.
    let peak=-Infinity,rv=.3;const g=groundHeight(s.x,s.z);for(let k=0;k<boulderPoints.count;k++){bv.fromBufferAttribute(boulderPoints,k).applyMatrix4(m4);if(bv.y>peak)peak=bv.y;if(bv.y>groundHeight(bv.x,bv.z)+.03)rv=Math.max(rv,Math.hypot(bv.x-s.x,bv.z-s.z));}
    s.top=peak;if(s.reef)return;const rc=Math.max(.3,rv-.22),dome={peak,base:g,rv},lip=Math.min(peak,Math.max(g+.45,g+(peak-g)*(1-(rc/rv)**2)));
    colliders.push({x:s.x,z:s.z,r:rc,bottom:y-1,top:lip,dome,kind:'rock'});s.radius=rc;});
  rocks.castShadow=rocks.receiveShadow=true;rocks.computeBoundingSphere();world.add(rocks);solidMeshes.push(rocks);

  // Brush (v210): low scrub where the dead will rise inland, in the wash and round the ruin. It
  // hides and blocks nothing: you and they push straight through it.
  const brushSpots=[],bush=(x,z,size)=>{if(groundHeight(x,z)>.6&&Math.hypot(x-HILL.x,z-HILL.z)>HILL.flat+2&&stations.every(p=>Math.hypot(p.x-x,p.z-z)>3)&&trailDistance(x,z)>1.6)brushSpots.push({x,z,size});};
  for(const zone of shoreSpawns().interior)for(const [px,pz] of zone.points)for(let k=0;k<4;k++){const a=rand()*Math.PI*2,r=.8+rand()*2.6;bush(px+Math.cos(a)*r,pz+Math.sin(a)*r,.7+rand()*.7);}
  for(let k=0;k<26;k++){const a=rand()*Math.PI*2,r=coastRadius(a)*(.5+rand()*.26);bush(Math.cos(a)*r,Math.sin(a)*r,.6+rand()*.6);}
  // v216 (the user: the island felt barren): about forty more palms and ninety more shrubs, along the backs
  // of the beaches, in groves round the landmarks and scattered inland, from their own draws (so nothing
  // placed before them moves), clear of the rocks, the paths, the stations and each other.
  const extra=seeded(216),firstPalms=palmSpots.length,clearOfRocks=(x,z,gap)=>rockSpots.every(s=>Math.hypot(s.x-x,s.z-z)>(s.radius??s.size)+gap);
  const morePalm=(x,z,gap)=>{if(clear(x,z,gap)&&clearOfRocks(x,z,1.6)&&!campCliff(x,z)&&shoreFraction(x,z)<.86){palmSpots.push({x,z});return true;}return false;};
  for(let tries=0;tries<3000&&palmSpots.length<firstPalms+22;tries++){const a=extra()*TAU,r=coastRadius(a)*(.66+extra()*.16);morePalm(Math.cos(a)*r,Math.sin(a)*r,4.2);}   // the backs of the beaches
  for(const [site,reach,count] of [[SITE.camp,19,4],[SITE.cove,13,4],[SITE.dock,14,3],[SITE.north,15,4],[SITE.forge,14,3]]){let made=0;
    for(let tries=0;tries<300&&made<count;tries++){const a=extra()*TAU,r=reach*(.6+extra()*.4);if(morePalm(site.x+Math.cos(a)*r,site.z+Math.sin(a)*r,3.6))made++;}}
  for(let tries=0;tries<1500&&palmSpots.length<firstPalms+44;tries++){const a=extra()*TAU,r=coastRadius(a)*(.3+extra()*.4);morePalm(Math.cos(a)*r,Math.sin(a)*r,5);}   // inland
  for(let i=firstPalms;i<palmSpots.length;i++)placePalm(palmSpots[i],extra);
  const firstBrush=brushSpots.length;
  for(const p of palmSpots.slice(firstPalms))for(let k=0;k<2;k++){const a=extra()*TAU,r=1.4+extra()*2;bush(p.x+Math.cos(a)*r,p.z+Math.sin(a)*r,.6+extra()*.6);}
  for(let tries=0;tries<400&&brushSpots.length<firstBrush+92;tries++){const a=extra()*TAU,r=coastRadius(a)*(.3+extra()*.52),x=Math.cos(a)*r,z=Math.sin(a)*r;if(!campCliff(x,z)&&clearOfRocks(x,z,.8)&&free(x,z,.4,.84))bush(x,z,.6+extra()*.8);}
  const trunks=new T.InstancedMesh(trunkGeo,new T.MeshStandardMaterial({map:barkMap,color:0xcfc3b2,roughness:.95}),palmSpots.length),crowns=new T.InstancedMesh(palmCrownGeometry(7),foliage(TEX,'frond',{color:0xd8e8cc,sway:.06}),palmSpots.length);
  trunks.name='Palm trunks';crowns.name='Palm crowns';trunkAt.forEach((m,i)=>trunks.setMatrixAt(i,m));crownAt.forEach((m,i)=>crowns.setMatrixAt(i,m));
  trunks.castShadow=crowns.castShadow=true;trunks.receiveShadow=crowns.receiveShadow=true;trunks.computeBoundingSphere();crowns.computeBoundingSphere();world.add(trunks,crowns);solidMeshes.push(trunks,crowns);

  // v215: leafy shrubs (island-art.mjs), where the grey-box had green stones. (The same places, and the
  // same draws from `rand`, so everything placed after them stands where it did.)
  const slopeAt=(x,z)=>Math.hypot(groundHeight(x+.5,z)-groundHeight(x-.5,z),groundHeight(x,z+.5)-groundHeight(x,z-.5));
  const brush=new T.InstancedMesh(shrubGeometry(3),foliage(TEX,'leaves',{color:0xc8d8bc,sway:.035}),brushSpots.length);brush.name='Brush';
  brushSpots.forEach((b,i)=>{e4.set(rand()*.5,rand()*Math.PI*2,rand()*.5);q4.setFromEuler(e4);e4.set(0,e4.y,0);q4.setFromEuler(e4);m4.compose(v4.set(b.x,groundHeight(b.x,b.z)-.05-slopeAt(b.x,b.z)*b.size*.7,b.z),q4,s4.set(b.size*(1.25+rand()*.5),b.size*1.05,b.size*(1.25+rand()*.4)));brush.setMatrixAt(i,m4);});   // (v216: sunk by the slope, so no edge floats)
  brush.castShadow=brush.receiveShadow=true;brush.computeBoundingSphere();world.add(brush);

  // v215: ferns and grass (art only: nothing here blocks or hides anyone). Ferns deep round the ruin and
  // under the palms; grass tufts wherever the ground is grassy, dune grass behind the beaches. Their own
  // seeded draws, after everything above, so nothing that was placed before moves.
  const plantRand=seeded(215),onTrail=(x,z,r)=>trailDistance(x,z)<r||stations.some(p=>Math.hypot(p.x-x,p.z-z)<2.4)||Math.hypot(x-ISLAND.spawn.x,z-ISLAND.spawn.z)<3||Math.hypot(x-HILL.x,z-HILL.z)<HILL.flat+1.2;
  const fernSpots=[],tuftSpots=[];
  for(let tries=0;tries<7000&&fernSpots.length<420;tries++){
    let x,z;if(tries%3===0&&palmSpots.length){const p=palmSpots[Math.floor(plantRand()*palmSpots.length)],a=plantRand()*6.3,r=.9+plantRand()*2.4;x=p.x+Math.cos(a)*r;z=p.z+Math.sin(a)*r;}
    else if(tries%3===1){const a=plantRand()*6.3,r=4+plantRand()*24;x=SITE.ruin.x+Math.cos(a)*r;z=SITE.ruin.z+Math.sin(a)*r*.9;}
    else{const a=plantRand()*6.3,r=coastRadius(a)*(.25+plantRand()*.5);x=Math.cos(a)*r;z=Math.sin(a)*r;}   // (v216: and inland everywhere)
    const h=groundHeight(x,z);if(h<.6||onTrail(x,z,1.3))continue;const w=groundKind(x,z,h,slopeAt(x,z));if(w[1]<.45)continue;
    fernSpots.push({x,z,y:h,size:.7+plantRand()*.6,turn:plantRand()*6.3});}
  for(let tries=0;tries<30000&&tuftSpots.length<4200;tries++){
    const a=plantRand()*6.3,r=coastRadius(a)*Math.sqrt(plantRand())*.97,x=Math.cos(a)*r,z=Math.sin(a)*r,h=groundHeight(x,z);if(h<.35||onTrail(x,z,.9))continue;
    const w=groundKind(x,z,h,slopeAt(x,z)),dune=shoreFraction(x,z)>.74;if(w[1]<(dune?.3:.5)||plantRand()>w[1]*1.1)continue;
    tuftSpots.push({x,z,y:h,w:.5+plantRand()*.5,h:(dune?.55:.35)+plantRand()*(dune?.5:.4),turn:plantRand()*6.3,dune});}
  const ferns=new T.InstancedMesh(fernGeometry(),foliage(TEX,'fern',{color:0xd2e2c4,sway:.05}),fernSpots.length);ferns.name='Ferns';
  fernSpots.forEach((f,i)=>{e4.set(0,f.turn,0);q4.setFromEuler(e4);m4.compose(v4.set(f.x,f.y-.04-slopeAt(f.x,f.z)*f.size*.5,f.z),q4,s4.setScalar(f.size));ferns.setMatrixAt(i,m4);});
  const tufts=new T.InstancedMesh(tuftGeometry(),foliage(TEX,'tuft',{color:0xbccab2,sway:.09}),tuftSpots.length);tufts.name='Grass';
  const duneTuft=new T.Color(1.18,1.1,.8),plainTuft=new T.Color(.92,1,.9);
  tuftSpots.forEach((t,i)=>{e4.set(0,t.turn,0);q4.setFromEuler(e4);m4.compose(v4.set(t.x,t.y-.03-slopeAt(t.x,t.z)*t.w*.5,t.z),q4,s4.set(t.w,t.h,t.w));tufts.setMatrixAt(i,m4);tufts.setColorAt(i,t.dune?duneTuft:plainTuft);});
  // (They take the moon's shadow but cast none: thousands of small cards would double their draws for little.)
  for(const m of [ferns,tufts]){m.castShadow=false;m.receiveShadow=true;m.computeBoundingSphere();world.add(m);}

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
  function update(elapsed){boathouseDoor.update(elapsed);seaMat.uniforms.time.value=elapsed;ART_UNIFORMS.time.value=elapsed;fireLight.intensity=3+.7*Math.sin(elapsed*13.1)+.45*Math.sin(elapsed*7.3+1.2)+.3*Math.sin(elapsed*23.7);const on=(elapsed%ISLAND.beacon.period)<ISLAND.beacon.on;beaconMat.emissiveIntensity=on?3.2:.25;beaconLight.intensity=on?26:0;}

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
    // v212: whether each cell round (x, z) is open, worked out again (a door opened or shut), and the
    // field rebuilt on the next call.
    function refresh(x,z,reach){
      for(let iz=Math.max(0,Math.floor((z-reach+E)/C));iz<=Math.min(w-1,Math.ceil((z+reach+E)/C));iz++)for(let ix=Math.max(0,Math.floor((x-reach+E)/C));ix<=Math.min(w-1,Math.ceil((x+reach+E)/C));ix++){
        const i=iz*w+ix,[cx,cz]=at(i);
        if(groundHeight(cx,cz)<-(ISLAND.wade-.05)||Math.abs(cx)+radius>ISLAND.bounds||Math.abs(cz)+radius>ISLAND.bounds){blocked[i]=1;continue;}
        const y=supportBelow(cx,cz,groundHeight(cx,cz),ISLAND.step);blocked[i]=isBlocked(cx,cz,radius,colliders,null,y,height)||y+height>ceilingAt(cx,cz,y)?1:0;}
      target=-2;distance.fill(99999);
    }
    return {cell:C,w,blocked,distance,index,refresh,
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

  return {floating,boathouse:boathouseDoor,colliders,platforms,solidMeshes,lights,sea,seaMat,depthMap,beacon,beaconLight,lamp,palms:palmSpots,rocks:rockSpots,landRocks,brush:brushSpots,props,tower,wreck,summit,moonDir,buildRoutes,
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
// either side of her; v212: beyond her bow and stern, now that she lies along the shore), and the interior zones are where the spec puts them. These are
// candidates only: the director still checks each one before using it.
const EVEN=Object.freeze([-2,-1,0,1,2]);
export const SHORE=Object.freeze({depth:.35,zoneSpread:.09,
  // [name, bearing, the five points' places along the zone (in half-spreads)]
  major:Object.freeze([['NORTH BEACH',-Math.PI/2,EVEN],['NORTH-EAST REEF',-Math.PI/4,EVEN],['EAST SHORE',-.02,EVEN],['SOUTH-EAST COVE',COVE.bearing,EVEN],
    ['SOUTH DOCK SHORE',DOCK.bearing-.12,EVEN],['SOUTH-WEST BEACH',Math.PI*3/4,EVEN],['SHIPWRECK COVE',ISLAND.wreck.bearing,Object.freeze([-6.5,-6,-5.5,5,5.5])],['NORTH-WEST REEF',-Math.PI*3/4,EVEN]]),
  minor:Object.freeze([['NORTH TIDE POOL',-1.25],['NORTH ROCKS',-1.05],['REEF SHALLOWS',-.47],['EAST ROCKS',-.3],['EAST FLATS',.3],['COVE HEAD',.9],['DOCK DEBRIS',1.08],
    ['SOUTH DRIFTWOOD',1.64],['SOUTH BEACH',1.9],['SOUTH-WEST ROCKS',2.1],['WRECK DEBRIS SOUTH',2.72],['WRECK DEBRIS NORTH',-2.72],['WEST TIDE POOL',-2.05],['NORTH-WEST DRIFTWOOD',-1.85]]),
  // [name, x, z] with two more points beside each (spec 5.2's six, in its order).
  interior:Object.freeze([['JUNGLE RUIN BRUSH',-26,-40],['NORTH BRUSH',-12,-42],['BUNKER FOLIAGE',16,-40],['EAST THICKET',43,-7],['SOUTH BRUSH',-8,27],['SOUTH-WEST FOLIAGE',-20,16]])
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

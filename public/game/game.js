import {BRUTE} from './brute.mjs?v=30';
import {FERAL} from './feral.mjs?v=206';
import {CURSE_RULES,MAX_CURSE_RANK,createCurse,createCurseLadder,curseTitle,curseWaveConfig,curseReward,chooseCurseEnemyKind} from './curse.mjs?v=206';
import {createCurseUI,curseSummary} from './curse-ui.mjs?v=206';
import {BOSS,WARDEN,bossPhase,dueSummons,lanceVolley,cooldownScale,segmentDistance,wakeStep,dressKnight,dressWarden,createBossEffects} from './blackthorn-boss.mjs?v=190';
import {createCrowd,enemyBody,PLAYER_RADIUS} from './crowd.mjs?v=123';
import {createLeaderboard} from './leaderboard.mjs?v=214';
import {createChangelog} from './changelog.mjs?v=214';
import {configureMinimap} from './minimap-settings.mjs?v=79';
import {createWeaponRecoil,staggerLimits,createCombatHud} from './combat-feedback.mjs?v=205';
import {createGrassMaterial,alignGrassPatch,ESTATE_PATHS,ESTATE_PAVING,bakeLawnMap} from './grounds.mjs?v=205';
import {MAUSOLEUM,SARCOPHAGUS,GRAVE_PLOTS,inMausoleum,inGraveyard} from './graveyard-layout.mjs?v=28';
import {buildGraveyard} from './graveyard.mjs?v=205';
import {CELLAR,isCellarOpen,setCellarOpen,cellarStairHeight} from './cellar-layout.mjs?v=28';
import {buildCellar,drawCellarMap} from './cellar.mjs?v=205';
import {SHED,SHED_FRONT,inShed} from './shed-layout.mjs?v=76';
import {buildShed} from './shed.mjs?v=205';
import * as T from './three.module.js';
import {createDisplay} from './display.mjs?v=205';
import {createTouchControls} from './touch-controls.mjs?v=148';
import {createControlScheme} from './input-scheme.mjs?v=142';
import {createAudio} from './audio.mjs?v=201';
import {createGamepadControls} from './gamepad-controls.mjs?v=128';
import {columnSurfaceGeometry} from './column-surfaces.mjs?v=93';
import {createStationBuilder} from './station-models.mjs?v=205';
import {createStations,PERKS,rackStation,shrineStation,ARMOR_STATION,forgeStation} from './stations.mjs?v=205';
import {createFirstPerson} from './first-person.mjs?v=205';
import {SHOT_RUMBLE} from './weapon-stats.mjs?v=205';
import {batchStatic,batchArticulated} from './batching.mjs?v=204';
import {drawMinimap} from './minimap.mjs?v=179';
import {fadeMaterials} from './drop-fade.mjs?v=169';
import {nextRank,rankKillHeal} from './weapon-ranks.mjs?v=191';
import {weaponSurfaces} from './weapon-surfaces.mjs?v=153';
import {KATANA_STATION,katanaSurfaces} from './katana.mjs?v=205';
import {createGrenadeAssets,createGrenadeThrow} from './grenade-throw.mjs?v=186';
import {POWERUPS,createPowerupAssets} from './powerups.mjs?v=205';
import {createEnemyAssets} from './enemy-assets.mjs?v=207';
import {createCombatLights} from './combat-lights.mjs?v=205';
import {createLighting,prepareLightingMaterials,patchLightingMaterial} from './lighting.mjs?v=120';
import {createEnvironmentLights} from './environment-lights.mjs?v=135';
import {createEffectPool} from './effect-pool.mjs?v=47';
import {UPPER_Y,UPPER_CEILING,UPPER_SPAWNS,hasUpperFloor,STAIR,EXTERIOR_STAIRS,supportBelow,stairHeight,stairAt,moveActor,updateActorHeight,buildVerticalNavigation,upperLocation,OLIVIA_ATTIC,setAtticOpen,isAtticOpen,inAttic} from './vertical.mjs?v=205';
import {EASTER_EGG,buildOliviaAttic,boneChipModel} from './olivia.mjs?v=205';
import {buildSecondFloor,drawUpperMap} from './second-floor.mjs?v=205';
import {BELLA,BELLA_PAW,createBellaCompanion,nextBellaRank} from './bella.mjs?v=205';
import {createExplosionFx} from './explosion-fx.mjs?v=191';
import {tagZombie} from './zombies.mjs?v=183';
import {addEstateDetail} from './estate-detail.mjs?v=205';
import {buildFacade,mansionRoofGeometry,PORTICO} from './facade.mjs?v=205';
import {createReticleHud} from './reticles.mjs?v=205';
import {createFurnishings} from './furnishings.mjs?v=187';
import {createRugBuilder} from './rugs.mjs?v=59';
import {createSignage} from './signage.mjs?v=94';
import {FORGE} from './soul-forge.mjs?v=205';
import {loadEstateTextures,tiledBox,ambientEnvironment,freezeStaticTransforms,finishMapFrom,OAK_FINISH,FLAGSTONE_FINISH,WET_STONE_FINISH} from './graphics.mjs?v=205';
import {ESTATE_SPAWNS,roomAt,estateLocation} from './estate-layout.mjs?v=28';
import {buildMansionExpansion,drawEstateMap} from './mansion-expansion.mjs?v=205';
import {buildRotundaBell,ROTUNDA_BELL} from './rotunda-bell.mjs?v=189';
import {UPPER_SLAB_BOTTOM} from './upper-shell.mjs?v=205';
import {EVENT_RULES,WORLD_EVENTS,createWorldEvents} from './world-events.mjs?v=170';
import {createBlackout} from './blackout.mjs?v=135';
import {CAMP_RULES,campKindAllowed,campCandidates,createCampWatch} from './camp-spawns.mjs?v=205';
import {createEnemyAI} from './enemy-ai.mjs?v=206';
import {createEnemySpawner} from './enemy-spawn.mjs?v=206';
import {createCombat} from './enemy-combat.mjs?v=206';
import {createWeaponRuntime} from './weapon-runtime.mjs?v=206';
import {createRunState,createPlayer} from './player.mjs?v=198';
import {createHud} from './hud.mjs?v=205';
import {createSession,createControls,WEAPON_CYCLE} from './controls.mjs?v=205';
import {resetBuild} from './zombie-build.mjs?v=177';
import {LURKER} from './lurker.mjs?v=179';
import {clearFace} from './zombie-faces.mjs?v=183';
import {createWorldEventVisuals} from './world-event-visuals.mjs?v=170';
const domCache=new Map();const $=id=>{if(!domCache.has(id))domCache.set(id,document.getElementById(id));return domCache.get(id);}, hudMarkup=new Map(),hudOpacity=new Map(),setMarkup=(id,markup)=>{if(hudMarkup.get(id)!==markup){hudMarkup.set(id,markup);$(id).innerHTML=markup;}},setOpacity=(id,value)=>{if(hudOpacity.get(id)!==value){hudOpacity.set(id,value);$(id).style.opacity=value;}}, rand=(a,b)=>a+rng()*(b-a), clamp=T.MathUtils.clamp;
const reticleHud=createReticleHud($('crosshair'));
// v201 (Dead Tide step 1): the renderer, both cameras, the film pass, the quality
// setting, dynamic resolution, resizing and the shader warm-up live in display.mjs.
// The mansion keeps its sky, fog, lights and world.
const canvas=$('game');const display=createDisplay({canvas,onFailure(message){$('loading').classList.add('hidden');$('error').classList.remove('hidden');$('error').textContent=message;}});
const {renderer,scene,camera,viewCamera}=display;scene.background=new T.Color(0x09131e);scene.fog=new T.FogExp2(0x101c26,.014);
const world=new T.Group();scene.add(world);const colliders=[],solidMeshes=[],interactables=[],lamps=[],zombies=[],effects=[],pickups=[],portraits=[];
// Keep room entrances explicit so layout checks cover the full approach to
// each opening, including the library entrance beside the stair flight.
const groundDoors=[
  {x:0,z:12,axis:'x',width:6.4,height:4},
  {x:0,z:-12,axis:'x',width:6,height:4.2},
  ...[-14,14].map(x=>({x,z:0,axis:'z',width:6,height:4.2})),
  {x:-5.6,z:1.1,axis:'z',width:5,height:3.08},
  {x:5.6,z:0,axis:'z',width:7.2,height:3.08}
];
let seed=7123;function rng(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function texture(kind,size=512){const c=document.createElement('canvas');c.width=c.height=size;const x=c.getContext('2d');
const palettes={lime:['#b9b3a5','#c4beb0'],wood:['#31281f','#433227'],floor:['#40362b','#59452f'],stone:['#485050','#354043'],plaster:['#4c5149','#636358'],brick:['#333b3d','#545951'],cloth:['#292d27','#45423a'],skin:['#65715d','#808067'],metal:['#313c3c','#4c5752'],roof:['#273035','#3c4647']};const p=palettes[kind]||palettes.stone;x.fillStyle=p[0];x.fillRect(0,0,size,size);
for(let i=0;i<16000;i++){const b=rng()*80;x.fillStyle=`rgba(${b+80},${b+80},${b+60},${rng()*.075})`;x.fillRect(rng()*size,rng()*size,rand(1,5),rand(1,4));}
if(kind==='wood'||kind==='floor'){let boards=kind==='floor'?8:4;for(let j=0;j<boards;j++){const y=j*size/boards;x.fillStyle=j%2?p[1]:p[0];x.globalAlpha=.5;x.fillRect(0,y,size,size/boards);x.globalAlpha=1;x.fillStyle='#101714';x.fillRect(0,y,size,2);for(let k=0;k<80;k++){x.strokeStyle=`rgba(0,0,0,${rng()*.12})`;x.beginPath();let yy=y+rng()*size/boards;x.moveTo(0,yy);for(let q=0;q<=size;q+=20)x.lineTo(q,yy+Math.sin(q*.018+k)*rand(.2,2));x.stroke();}if(kind==='floor'){x.fillStyle='#151a17';x.fillRect((j%2)*size/2+size/4,y,2,size/boards);}}}
if(kind==='brick'||kind==='stone'||kind==='roof'){let rows=kind==='roof'?14:8;for(let j=0;j<rows;j++)for(let k=-1;k<5;k++){let xx=k*size/4+(j%2)*size/8,yy=j*size/rows;x.fillStyle=`rgba(100,111,108,${rng()*.25})`;x.fillRect(xx+3,yy+3,size/4-6,size/rows-6);x.strokeStyle='#192729';x.lineWidth=2;x.strokeRect(xx,yy,size/4,size/rows);}}
if(kind==='lime'){for(let i=0;i<70;i++){const cx=rng()*size,cy=rng()*size,r=rand(20,90),tone=rng()<.5?'255,250,238':'70,66,58',a=rand(.03,.08);for(const ox of [-size,0,size])for(const oy of [-size,0,size]){const g=x.createRadialGradient(cx+ox,cy+oy,0,cx+ox,cy+oy,r);g.addColorStop(0,`rgba(${tone},${a})`);g.addColorStop(1,`rgba(${tone},0)`);x.fillStyle=g;x.fillRect(cx+ox-r,cy+oy-r,r*2,r*2);}}}
if(kind==='plaster'){for(let i=0;i<35;i++){x.strokeStyle='rgba(14,25,20,.2)';x.beginPath();let xx=rng()*size,yy=rng()*size;x.moveTo(xx,yy);for(let j=0;j<4;j++){xx+=rand(-15,15);yy+=rand(5,22);x.lineTo(xx,yy);}x.stroke();}}
const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
const maps={};for(const k of ['wood','floor','stone','plaster','brick','cloth','skin','metal','roof','lime','ashlar','flagstone'])maps[k]=texture(k);for(const k of ['wood','floor','stone','plaster','brick','roof'])maps[k].repeat.set(k==='floor'?7:k==='wood'?2:4,k==='floor'?7:k==='wood'?2:4);
await loadEstateTextures(maps);
function mat(color,map=null,roughness=.85,metalness=0){return new T.MeshStandardMaterial({color,map:map?maps[map]:null,roughness,metalness,bumpMap:['brick','stone','wood','floor','plaster'].includes(map)?maps[map]:null,bumpScale:map==='brick'?.009:map==='plaster'?.003:.004});}
const M={wall:mat(0x969d87,'plaster'),wood:mat(0x807569,'wood'),floor:mat(0xaaa08c,'floor'),stone:mat(0x9ca5a0,'stone'),brick:mat(0x8d9994,'brick'),roof:mat(0x616f72,'roof'),dark:mat(0x151c1d,'metal',.5,.65),gold:mat(0x93724c,null,.35,.7),leather:mat(0x29342b,'cloth'),red:mat(0x62352e,'cloth'),skin:mat(0xa2ab88,'skin'),shirt:mat(0x7a7663,'cloth'),pants:mat(0x4c554e,'cloth'),white:mat(0xc4c2a6),glass:new T.MeshStandardMaterial({color:0x4e7f96,metalness:.05,roughness:.38,emissive:0x163949,emissiveIntensity:.08}),blood:mat(0x402018,null,.6),trim:mat(0x6f7462,'stone')};
M.wood.color.set(0xccb49b);M.wood.roughness=.78;M.stone.color.set(0xc0c7c4);M.stone.roughness=.8;M.stone.bumpScale=.009;M.brick.color.set(0xc4c1b5);M.brick.bumpScale=.009;M.dark.color.set(0x353f44);M.dark.roughness=.64;M.gold.roughness=.48;
// Natural floors (v125). Interior oak is a satin finish with no lacquer coat:
// grain and board gaps break highlights up instead of smearing lamps into
// streaks, and the flat ambient sheen is subdued. Outdoor stone stays wet,
// with water gathering in joints and pits rather than one plastic coat.
M.wetStone=new T.MeshPhysicalMaterial({color:0xb0b9b5,map:maps.stone,bumpMap:maps.stone,bumpScale:.007,roughness:.74,clearcoat:.22,clearcoatRoughness:.42});
M.floor=new T.MeshStandardMaterial({color:0xf4ead7,map:maps.floor,bumpMap:maps.floor,bumpScale:.0018,roughness:.8,envMapIntensity:.55});
{const oak=finishMapFrom(maps.floor,OAK_FINISH);if(oak){M.floor.roughnessMap=oak;M.floor.roughness=1;}
 const wet=finishMapFrom(maps.stone,WET_STONE_FINISH);if(wet){M.wetStone.clearcoatMap=wet;M.wetStone.clearcoatRoughnessMap=wet;M.wetStone.clearcoat=.55;M.wetStone.clearcoatRoughness=.52;}}
// Stone interior (v187): limestone ashlar walls to match the facade, honed
// flagstone floors, pale lime-plastered ceilings between carved stone ribs,
// carved stone trim and wrought iron. Oak stays for furniture and doors.
M.wall=new T.MeshStandardMaterial({color:0xb4ad9f,map:maps.ashlar,bumpMap:maps.ashlar,bumpScale:.012,roughness:.93});M.wall.name='ashlar';
M.flagstone=new T.MeshStandardMaterial({color:0xe6e0d3,map:maps.flagstone,bumpMap:maps.flagstone,bumpScale:.0035,roughness:.72,envMapIntensity:.5});M.flagstone.name='flagstone';
{const honed=finishMapFrom(maps.flagstone,FLAGSTONE_FINISH);if(honed){M.flagstone.roughnessMap=honed;M.flagstone.roughness=1;}}
M.vault=new T.MeshStandardMaterial({color:0xd3cdbf,map:maps.lime,bumpMap:maps.lime,bumpScale:.0015,roughness:.97});M.vault.name='lime-plaster';
M.carved=new T.MeshStandardMaterial({color:0xa8a193,map:maps.stone,bumpMap:maps.stone,bumpScale:.006,roughness:.86});M.carved.name='carved-stone';
M.iron=new T.MeshStandardMaterial({color:0x2a2d2e,roughness:.56,metalness:.74});M.iron.name='wrought-iron';
M.flame=new T.MeshBasicMaterial({color:0xffcb84});M.flame.name='candle-flame';
const furnishings=createFurnishings({world,M,colliders}),rugs=createRugBuilder({world});
scene.environment=ambientEnvironment();scene.environmentIntensity=.48;
M.wetStone.name='wet-stone';

const boxGeo=new T.BoxGeometry(1,1,1),sphereGeo=new T.SphereGeometry(1,32,24),cylGeo=new T.CylinderGeometry(1,1,1,24);
function mesh(geo,material,pos,scale,parent=world,shadow=true){const m=new T.Mesh(geo,material);m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=shadow&&!material.transparent&&!material.isMeshBasicMaterial;m.receiveShadow=shadow;parent.add(m);return m;}
function box(x,y,z,w,h,d,m=M.stone,parent=world,collision=false){const obj=mesh(tiledBox(boxGeo,m,w,h,d),m,[x,y,z],[w,h,d],parent);if(collision){colliders.push({x,z,w,d,minY:y-h/2,maxY:y+h/2});solidMeshes.push(obj);}return obj;}
function cylinder(x,y,z,r,h,m=M.dark,parent=world){const scale=[r,h,r];return mesh(m===M.stone?columnSurfaceGeometry(cylGeo,m,scale):cylGeo,m,[x,y,z],scale,parent);}
function sphere(x,y,z,sx,sy,sz,m=M.skin,parent=world){return mesh(sphereGeo,m,[x,y,z],[sx,sy,sz],parent);}
const signage=createSignage({anisotropy:Math.min(16,renderer.capabilities?.getMaxAnisotropy?.()??16)});
const label=signage.label;
function painting(x,y,z,w,h,rotation=0){const c=document.createElement('canvas');c.width=256;c.height=384;const p=c.getContext('2d');const g=p.createRadialGradient(120,120,5,128,180,240);g.addColorStop(0,'#665543');g.addColorStop(1,'#12171a');p.fillStyle=g;p.fillRect(0,0,256,384);p.fillStyle='#171d1d';p.beginPath();p.ellipse(128,345,100,155,0,0,7);p.fill();p.fillStyle='#6f6a52';p.beginPath();p.ellipse(128,130,43,65,-.08,0,7);p.fill();p.fillStyle='#28291f';p.beginPath();p.ellipse(128,94,47,30,0,Math.PI,Math.PI*2);p.fill();p.fillRect(100,122,22,6);p.fillRect(139,122,20,6);p.fillStyle='#b8b493';p.fillRect(106,123,4,3);p.fillRect(144,123,4,3);p.strokeStyle='#302f23';p.beginPath();p.moveTo(130,137);p.lineTo(124,162);p.lineTo(137,163);p.stroke();p.fillRect(115,180,27,3);for(let i=0;i<2000;i++){p.fillStyle='rgba(0,0,0,.04)';p.fillRect(rng()*256,rng()*384,rand(1,6),rand(1,10));}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;const grp=new T.Group();grp.position.set(x,y,z);grp.rotation.y=rotation;world.add(grp);box(0,0,0,w+.18,h+.18,.10,M.wood,grp);for(const side of [-1,1]){box(side*(w/2+.045),0,.056,.09,h+.18,.05,M.gold,grp);box(0,side*(h/2+.045),.056,w,.09,.05,M.gold,grp);}const art=new T.PlaneGeometry(w,h),uv=art.attributes.uv,aspect=w/h,sourceAspect=c.width/c.height;if(aspect>sourceAspect){const span=sourceAspect/aspect,center=Math.min(1-span/2,.58);for(let i=0;i<uv.count;i++)uv.setY(i,center+(uv.getY(i)-.5)*span);}else{const span=aspect/sourceAspect;for(let i=0;i<uv.count;i++)uv.setX(i,.5+(uv.getX(i)-.5)*span);}const artwork=mesh(art,new T.MeshStandardMaterial({map:tex,roughness:1}),[0,0,.083],null,grp);grp.name='Blackthorn portrait';portraits.push({group:grp,artwork,w,h});return grp;}
const hemisphere=new T.HemisphereLight(0x8ba8bf,0x222019,1.1);scene.add(hemisphere);const moonlight=new T.DirectionalLight(0x93b9de,2.8);moonlight.position.set(-64,112,12);moonlight.target.position.set(0,0,-36);scene.add(moonlight.target);moonlight.castShadow=true;moonlight.shadow.mapSize.set(2048,2048);Object.assign(moonlight.shadow.camera,{left:-85,right:85,top:85,bottom:-85,near:1,far:240});moonlight.shadow.bias=-.00003;moonlight.shadow.normalBias=.008;scene.add(moonlight);
const moon=sphere(-35,44,-55,3,3,3,new T.MeshBasicMaterial({color:0xc6d9db}));moon.castShadow=false;
function point(x,y,z,color,intensity=2,dist=9){const l=new T.PointLight(color,intensity,dist,1.5);l.position.set(x,y,z);scene.add(l);lamps.push({light:l,base:intensity,phase:rand(0,7)});return l;}
function candle(x,y,z,parent=world){cylinder(x,y+.14,z,.045,.28,M.white,parent);const f=sphere(x,y+.31,z,.028,.07,.028,new T.MeshBasicMaterial({color:0xffc77c}),parent);return f;}
function sconce(x,y,z,rot=0){const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rot;world.add(g);box(0,0,0,.16,.5,.06,M.iron,g);box(0,-.12,.17,.05,.05,.36,M.iron,g);cylinder(0,-.11,.32,.07,.03,M.iron,g);candle(0,-.08,.32,g);point(x+Math.sin(rot)*.34,y+.26,z+Math.cos(rot)*.34,0xffb564,4.5,7);}
// GROUNDS: grass lawns, clear stone paths, trees and bounded iron fencing.
const earth=createGrassMaterial();
alignGrassPatch(box(0,-.22,-26.5,112,.3,117,earth));
// Cut only the new stair footprint; the former doorway obstruction is turf.
const turfNorth=-110,turfSouth=-85,leftStair=CELLAR.x-CELLAR.stairWidth/2,rightStair=CELLAR.x+CELLAR.stairWidth/2;
for(const [a,b] of [[turfNorth,CELLAR.topZ],[CELLAR.bottomZ,turfSouth]])alignGrassPatch(box(0,-.22,(a+b)/2,112,.3,b-a,earth));
for(const [a,b] of [[-56,leftStair],[rightStair,56]])alignGrassPatch(box((a+b)/2,-.22,(CELLAR.topZ+CELLAR.bottomZ)/2,b-a,.3,CELLAR.bottomZ-CELLAR.topZ,earth));
for(const {x,z,w,d,y} of ESTATE_PAVING)box(x,y,z,w,.1,d,M.wetStone);
for(let side of [-1,1]){if(side<0)box(side*54,1,-39,.45,2.1,138,M.brick,world,true);else for(const [z,d] of [[-52.75,110.5],[19.75,20.5]])box(54,1,z,.45,2.1,d,M.brick,world,true);for(let z=-107;z<30;z+=1.6){if(side>0&&z>2.5&&z<9.5)continue;cylinder(side*54,2.4,z,.035,1.3);mesh(new T.ConeGeometry(.11,.24,4),M.dark,[side*54,3.14,z]);}}
for(let z of [-108,30]){box(0,.4,z,108,.8,.45,M.brick,world,true);for(let x=-53;x<=53;x+=1.6){cylinder(x,1.45,z,.035,2.1);mesh(new T.ConeGeometry(.1,.24,4),M.dark,[x,2.6,z]);}box(0,1.15,z,108,.05,.05,M.dark);box(0,2.1,z,108,.05,.05,M.dark);}
function branch(a,b,r){const dir=new T.Vector3().subVectors(b,a),m=mesh(new T.CylinderGeometry(r*.35,r,dir.length(),7),M.wood,a.clone().add(b).multiplyScalar(.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());}
const estateTrees=[];for(let i=0;i<54;i++){const x=(i%2?1:-1)*rand(49,52),rawZ=rand(-91,26),z=x>0&&rawZ>1&&rawZ<11?rawZ+12:rawZ,h=rand(5,10);cylinder(x,h/2,z,.23,h,M.wood);colliders.push({x,z,w:.7,d:.7});estateTrees.push({x,z});for(let j=0;j<6;j++){let a=new T.Vector3(x,h*.55,z),b=new T.Vector3(x+rand(-3,3),h+rand(-2,2),z+rand(-3,3));branch(a,b,.13);branch(b,b.clone().add(new T.Vector3(rand(-1.5,1.5),rand(1,2),rand(-1.5,1.5))),.06);}}
function lampPost(x,z){cylinder(x,1.8,z,.07,3.6);cylinder(x,.15,z,.25,.3);for(const y of [3.31,3.89])box(x,y,z,.55,.055,.55,M.dark);for(const dx of [-.255,.255])for(const dz of [-.255,.255])box(x+dx,3.6,z+dz,.035,.55,.035,M.dark);const bulb=box(x,3.6,z,.42,.43,.42,new T.MeshStandardMaterial({color:0xffc884,emissive:0xffbb66,emissiveIntensity:2}));bulb.castShadow=false;mesh(new T.ConeGeometry(.45,.3,4),M.dark,[x,4.03,z]);point(x,3.5,z,0xffbb77,9,11);}
lampPost(-7,21);lampPost(7,21);lampPost(-47,-36);lampPost(47,18);
// MANSION: accessible ground floor with open central circulation.
box(0,.02,0,28,.15,24,M.flagstone);box(0,6.9,0,28,.25,24,M.vault);rugs.add(0,0,6,22);
function wall(x,z,w,d,h=6.8){return box(x,h/2,z,w,h,d,M.wall,world,true);}
wall(-8.6,12,10.8,.55);wall(8.6,12,10.8,.55);box(0,5.4,12,6.4,2.8,.55,M.wall);for(const x of [-8.5,8.5])wall(x,-12,11,.55);box(0,5.5,-12,6,2.6,.55,M.wall);for(const x of [-14,14]){for(const z of [-7.5,7.5])wall(x,z,.55,9);}
for(let x of [-5.6,5.6]){const start=x<0?-1.4:-3.6;wall(x,(-12+start)/2,.38,12+start,UPPER_SLAB_BOTTOM);wall(x,7.8,.38,8.4,UPPER_SLAB_BOTTOM);for(let z of [start,3.6]){box(x,2.2,z,.65,4.4,.28,M.carved);box(x,4.25,z,.68,.16,.7,M.carved);box(x,.16,z,.74,.3,.28,M.carved);}}
for(let z of [-12,12]){for(const side of [-1,1])box(side*(z===12?8.6:8.5),.2,z,z===12?10.8:11,.3,.65,M.carved);box(0,6.65,z,28,.24,.72,M.trim);}for(let x of [-14,14]){for(const z of [-7.5,7.5])box(x,.2,z,.65,.3,9,M.carved);box(x,6.65,0,.72,.24,24,M.trim);}
// Exterior ornament and gothic windows.
// Crossbars meet the vertical mullion at their ends, with no competing faces.
for(let x of [-10,-7,7,10]){box(x,3.4,12.32,1.5,3.1,.08,M.dark);box(x,3.4,12.38,1.28,2.9,.04,M.glass);box(x,3.4,12.41,.05,3,.05,M.gold);for(const side of [-1,1])box(x+side*.3375,3.4,12.41,.625,.05,.05,M.gold);box(x,1.9,12.36,1.9,.15,.35,M.stone);}

// Sloping roof and attic facade.
const roofMat=M.roof.clone();roofMat.side=T.DoubleSide;const roofGeo=mansionRoofGeometry(roofMat);const mainRoof=mesh(roofGeo,roofMat,[0,0,0]);mainRoof.name='Blackthorn slate roof';
// v192: the chimney stacks start above the upstairs ceiling (7.4 m) instead of
// hanging 0.5 m below it into the reading room and private salon.
box(-10,9.725,-5,1.3,4.55,1.5,M.brick);box(9,9.725,-8,1.3,4.55,1.5,M.brick);
const crest=mesh(new T.CircleGeometry(.68,32),label('B\n1893','#d4b77a',512,{width:1.36,height:1.36,kind:'crest',maxLines:2}),[0,8.45,12.84],[1,1,1]);
box(0,.08,13,8,.15,3,M.stone);
for(const side of [-1,1]){const hinge=new T.Group();hinge.name='Fully open main entrance door';hinge.position.set(side*3.2,0,12.1);hinge.rotation.y=side*1.75;world.add(hinge);box(-side*.5,2,0,1,4,.18,M.wood,hinge);box(-side*.5,3,.116,.6,.8,.05,M.gold,hinge);}
// Hall columns, balcony, staircase alcove and chandelier.
for(let x of [-4.5,4.5])for(let z of [-8,7]){if(x<0&&z<0)continue;cylinder(x,6.55,z,.43,.3,M.stone);}
// Hang the hall portrait on a solid side wall below the upstairs slab.
painting(5.31,2.55,5.25,2.5,1.8,-Math.PI/2);for(let x of [-3,3])sconce(x,3.6,-11.7);
{const before=world.children.length;cylinder(0,(5.9+UPPER_CEILING)/2,1,.03,UPPER_CEILING-5.9,M.iron);const ring=mesh(new T.TorusGeometry(1.25,.05,8,32),M.iron,[0,5.85,1]);ring.rotation.x=Math.PI/2;{const inner=mesh(new T.TorusGeometry(.62,.035,8,24),M.iron,[0,6.35,1]);inner.rotation.x=Math.PI/2;for(let i=0;i<6;i++){const a=i/6*Math.PI*2,arm=mesh(new T.CylinderGeometry(.018,.018,1.05,6),M.iron,[Math.cos(a)*.9,6.12,1+Math.sin(a)*.9]);arm.rotation.set(Math.sin(a)*.62,0,-Math.cos(a)*.62);}}for(let i=0;i<10;i++){let a=i/10*Math.PI*2;cylinder(Math.cos(a)*1.25,5.84,1+Math.sin(a)*1.25,.06,.025,M.iron);candle(Math.cos(a)*1.25,5.85,1+Math.sin(a)*1.25);sphere(Math.cos(a)*1.25,5.66,1+Math.sin(a)*1.25,.03,.1,.03,M.iron);}for(const o of world.children.slice(before))o.castShadow=false;}point(0,5.5,1,0xffc17b,22,19);
for(let x of [-5.35,5.35])for(let z of [-7,7])sconce(x,3,z,x<0?Math.PI/2:-Math.PI/2);
// Library: bookcases, furniture, scattered books.
function bookcase(x,z,rot=0){return furnishings.bookcase(x,z,{rotation:rot});}
for(let z of [-8.5,-4.8,4.8,8.5])bookcase(-13.25,z,Math.PI/2);bookcase(-9,-11.35);bookcase(-9,11.35,Math.PI);
furnishings.table(-9.2,-4.65,{w:1.75,d:.82,desk:true});furnishings.chair(-9.2,-3.59);point(-9.4,1.5,-4.65,0xffb265,4,7);
function sofa(x,z,rot=0){return furnishings.sofa(x,z,{rotation:rot});}
furnishings.settle(-10,5.3,{rotation:Math.PI});furnishings.table(-10,3.55,{w:1.5,d:.72,h:.42});candle(-10,.515,3.55);
// Dining room and fireplace.
furnishings.table(9.7,5,{w:4.45,d:1.20,h:.78});for(const x of [8.2,9.7,11.2])for(const side of [-1,1]){furnishings.chair(x,5+side*.98,{rotation:side<0?Math.PI:0});mesh(new T.CylinderGeometry(.14,.14,.015,20),M.white,[x,.883,5+side*.36]);}for(const x of [8.2,9.7,11.2])candle(x,.875,5);point(9.7,1.7,5,0xffb564,9,10);
furnishings.fireplace(13.435,-7,{rotation:-Math.PI/2});const fire=sphere(13.3,.45,-7,.1,.3,.5,new T.MeshBasicMaterial({color:0xff8f35}));point(12.1,1,-7,0xff8b38,13,10);
// The mantel has less than a meter of headroom; use the clear north wall.
painting(9.5,2.45,-11.65,2,2.5);furnishings.cabinet(9.5,-11.42,{w:2.2,h:.98});for(const x of [7.4,11.6])furnishings.candelabrum(x,-11.2);
// Keep this frame above the chair rail and between the window curtains.
painting(13.64,2.65,6.9,2.2*2/3,2.2,-Math.PI/2);
// v187: a stone house inside as well as out. The library gets a hearth and a
// pair of carved chairs; banners hang from the gallery edges over the hall,
// and a suit of armour stands guard inside the front door.
furnishings.fireplace(-12,-11.435);
furnishings.armchair(-12.2,-8.6,{rotation:Math.PI-.35});furnishings.armchair(-10.6,-8.9,{rotation:Math.PI+.35});
for(const z of [-6,-2,2,6])furnishings.banner(3.27,3.18,z,{rotation:-Math.PI/2,h:1.7,w:.8});
for(const z of [1.5,5.5])furnishings.banner(-3.17,3.18,z,{rotation:Math.PI/2,h:1.7,w:.8});
for(const x of [-2.2,2.2])furnishings.banner(x,3.18,9.05,{rotation:Math.PI,h:1.7,w:.8});
furnishings.armour(4.85,10.95,{rotation:-Math.PI/2});
furnishings.trophy(-13.55,3.25,-7,{rotation:Math.PI/2});furnishings.trophy(-13.55,3.25,7,{rotation:Math.PI/2});
// Environmental storytelling: boards, debris, cloth rugs, broken plaster.
for(let i=0;i<24;i++){let x=rand(-13,13),z=rand(-11,11);if(Math.abs(x)<3||groundDoors.some(d=>Math.abs(x-d.x)<(d.axis==='x'?d.width/2:3)+.4&&Math.abs(z-d.z)<(d.axis==='z'?d.width/2:3)+.4))continue;let debris=box(x,.16,z,rand(.08,.35),rand(.08,.3),rand(.1,.4),i%2?M.stone:M.wood);debris.rotation.set(rand(0,1),rand(0,3),rand(0,1));}
for(let x of [-10,10])for(let k=0;k<2;k++){const board=box(x,3+k*.8,12.44,1.8,.14,.05,M.wood);board.rotation.z=k?.14:-.25;}
// Interactive machines.
// v188: the ground-floor perks are spread through the wings, each backed onto a wall
// (0.62 m out from the wall face, like the music-salon spot Quickhands now takes):
// Ironheart on the infirmary's west wall, Quickhands in the music salon, Nightstride
// on the ballroom's north wall and Deadeye on the observatory's west wall.
// v202 (Dead Tide step 1): what the shared stations sell and how they look come
// from stations.mjs; the mansion places them.
const PERK_SPOTS={iron:{x:14.86,z:-42,rotation:Math.PI/2},quick:{x:20,z:-12.86,rotation:Math.PI},eye:{x:-13.14,z:-77,rotation:Math.PI/2},stride:{x:-16.4,z:-11.14,rotation:0}};
const perkDefs=PERKS.map(p=>({...p,...PERK_SPOTS[p.id]}));
const stationBuilder=createStationBuilder({world,colliders,solidMeshes,interactables,label});
function perkStation(def,x=def.x,z=def.z,y=0){return stationBuilder.add({...def,x,z,y,type:'perk',modelCaption:def.desc});}
for(const def of perkDefs)perkStation(def);
function station(x,z,name,type,price,y=0,rotation=0){return stationBuilder.add({x,z,y,rotation,...rackStation(type,name,price)});}
function powerStation(x,z,power,y=0,rotation=0){return stationBuilder.add({x,z,y,rotation,...shrineStation(power)});}
station(-7,13.2,'AMMUNITION','ammo',350);
// The pistol bench mirrors the courtyard ammunition crate across the front door (v152).
station(7,13.2,'GLOCK 21 PISTOL','glock',250);
station(-6.315,-8,'M12 SHOTGUN','shotgun',1200,0,-Math.PI/2);
station(6.31,-5.3,'RAVEN SMG','smg',1500,0,Math.PI/2);
// v188: the ground-floor forge stands on its charred oak block in the middle of
// the Great Rotunda, under the bell, facing the grand hall.
stationBuilder.add({x:ROTUNDA_BELL.x,z:ROTUNDA_BELL.z,...forgeStation('THE SOUL FORGE')});point(ROTUNDA_BELL.x,2.6,ROTUNDA_BELL.z,0xa474ff,8,8);
// The ballroom shrine sits in the clear outer-wall bay between its windows.
powerStation(-41.21,0,'double',0,Math.PI/2);powerStation(41.24,0,'grenades',0,-Math.PI/2);
// Rain and low courtyard mist.
const rainGeo=new T.BufferGeometry();const rainPos=new Float32Array(1600*3);for(let i=0;i<rainPos.length;i+=3){rainPos[i]=rand(-22,22);rainPos[i+1]=rand(0,18);rainPos[i+2]=rand(-2,42);}rainGeo.setAttribute('position',new T.BufferAttribute(rainPos,3));const rain=new T.Points(rainGeo,new T.PointsMaterial({color:0x90aebd,size:.033,transparent:true,opacity:.35}));scene.add(rain);
const mistCanvas=document.createElement('canvas');mistCanvas.width=mistCanvas.height=128;const mx=mistCanvas.getContext('2d');const mg=mx.createRadialGradient(64,64,2,64,64,62);mg.addColorStop(0,'rgba(160,190,190,.24)');mg.addColorStop(1,'rgba(160,190,190,0)');mx.fillStyle=mg;mx.fillRect(0,0,128,128);const mistTex=new T.CanvasTexture(mistCanvas);const mist=[];for(let i=0;i<26;i++){const s=new T.Sprite(new T.SpriteMaterial({map:mistTex,transparent:true,depthWrite:false,opacity:.1}));s.position.set(rand(-40,40),rand(.1,.6),rand(17,27));s.scale.set(rand(8,15),rand(1,2),1);scene.add(s);mist.push(s);}
// Floating view model: a detailed receiver, rail, sight, stock and barrel.
// v203 (Dead Tide step 2): the guns in hand, the muzzle flash, the view's lights,
// the flashlight and how the view moves live in first-person.mjs.
const firstPerson=createFirstPerson({camera,batchArticulated}),{gunRoot,gunGroups,bushDot,smgDual,dualGuns,dualMuzzle,scopedGuns}=firstPerson;
const explosionFx=createExplosionFx(world),BLAST_LIGHT={release(){}};
// v185: scorch marks sit on the visible floor (paving, porch boards, rugs),
// which can be a few centimetres above the walkable support height. Static
// floor-level meshes are indexed once; a blast raycasts only those under it.
let floorIndex=null;const floorRay=new T.Raycaster(),floorBox=new T.Box3(),DOWN=new T.Vector3(0,-1,0);
function indexFloors(){
  floorIndex=[];world.updateMatrixWorld(true);
  world.traverse(o=>{
    if(!o.isMesh||o.isInstancedMesh||o.isSkinnedMesh||o.isPoints||o.isSprite)return;
    for(let p=o;p;p=p.parent)if(p.userData.dynamic||p.userData.lightingTransient||p.userData.companion||p.userData.enemy||p.userData.collectible)return;
    const m=Array.isArray(o.material)?o.material[0]:o.material;if(!m||m.transparent||m.alphaTest>0)return;
    floorBox.setFromObject(o);if(floorBox.isEmpty())return;floorIndex.push({mesh:o,box:floorBox.clone()});
  });
}
function visibleFloor(x,z,support){
  if(!floorIndex)indexFloors();const near=[];
  for(const f of floorIndex){const b=f.box;if(x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z&&b.min.y<=support+.3&&b.max.y>=support-.05)near.push(f.mesh);}
  if(!near.length)return support;floorRay.set(floorRay.ray.origin.set(x,support+.3,z),DOWN);floorRay.near=0;floorRay.far=.36;
  const hit=floorRay.intersectObjects(near,false)[0];return hit?hit.point.y:support;
}
const grenadeAssets=createGrenadeAssets(batchArticulated),grenadeThrow=createGrenadeThrow(grenadeAssets,batchArticulated);camera.add(grenadeThrow.root);
const {flash,muzzleLight,viewFill,viewKey,flashlight}=firstPerson.addLights(scene),{toggleFlashlight}=firstPerson;
// Clear each frame and resolve with spatial antialiasing; preserve the 15% brightness boost.
display.addFilm();
// The night sky uses layered clouds instead of a flat backdrop.
const skyMat=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{time:{value:0},skyLight:{value:1}},vertexShader:'varying vec3 localP;void main(){localP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 localP;uniform float time;uniform float skyLight;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}void main(){vec3 d=normalize(localP);vec2 uv=d.xz/(abs(d.y)+.4)*3.;uv+=vec2(time*.007,time*.002);float cloud=0.;float a=.5;for(int i=0;i<5;i++){cloud+=noise(uv)*a;uv*=2.03;a*=.5;}vec3 base=mix(vec3(.027,.042,.061),vec3(.008,.019,.039),max(0.,d.y));base+=vec3(.024,.032,.035)*smoothstep(.32,.8,cloud);float halo=pow(max(0.,dot(d,normalize(vec3(-35.,44.,-55.)))),18.);base+=vec3(.04,.065,.08)*halo;gl_FragColor=vec4(base*skyLight,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});const sky=new T.Mesh(new T.SphereGeometry(220,32,16),skyMat);sky.renderOrder=-5;scene.add(sky);
const starGeo=new T.BufferGeometry(),starPos=[];for(let i=0;i<300;i++){const p=new T.Vector3(rand(-1,1),rand(.1,1),rand(-1,1)).normalize().multiplyScalar(90);starPos.push(p.x,p.y,p.z);}starGeo.setAttribute('position',new T.Float32BufferAttribute(starPos,3));scene.add(new T.Points(starGeo,new T.PointsMaterial({color:0xb4cedc,size:.09,transparent:true,opacity:.45,depthWrite:false})));
// Carved wall panels, interior windows, cobwebs, and architectural trim.
for(const side of [-1,1])for(let z=-10;z<=10;z+=2){if(Math.abs(z)<4)continue;box(side*13.63,.72,z,.09,1.3,1.8,M.carved);box(side*13.55,1.4,z,.12,.08,2,M.carved);for(const dz of [-.7,.7])box(side*13.56,.75,z+dz,.04,1.03,.06,M.carved);for(const y of [.24,1.22])box(side*13.56,y,z,.04,.06,1.45,M.carved);}
for(const side of [-1,1])for(const z of [-4,4,10]){const g=new T.Group();g.position.set(side*13.66,3.5,z);g.rotation.y=side<0?Math.PI/2:-Math.PI/2;world.add(g);box(0,0,0,1.85,3.2,.1,M.carved,g);box(0,.0,.061,1.55,2.93,.025,M.glass,g);box(0,0,.09,.04,3,.04,M.iron,g);for(const yy of [-.75,0,.75])box(0,yy,.09,1.6,.03,.04,M.iron,g);for(const dx of [-1.05,1.05]){box(dx,.05,0,.28,3.5,.15,M.red,g);}sphere(0,1.65,0,.93,.42,.06,M.carved,g);}
box(0,10.075,-9.7,3.8,5.25,3.8,M.brick);const towerTop=mesh(new T.ConeGeometry(3.2,5,4),M.roof,[0,15,-9.7]);towerTop.rotation.y=Math.PI/4;box(0,11.8,-7.78,1.8,2.1,.06,M.glass);box(0,11.8,-7.73,.06,2.1,.06,M.gold);
const webMat=new T.LineBasicMaterial({color:0xaeb7a4,transparent:true,opacity:.14});for(const corner of [[-5.3,6.6,11.6],[5.3,6.6,11.6],[-13.6,6.6,-11.6],[13.6,6.6,-11.6]]){const pp=[],sign=corner[0]<0?1:-1;for(let i=0;i<8;i++){const a=i/7*Math.PI/2;pp.push(0,0,0,Math.cos(a)*sign*1.5,-Math.sin(a)*1.5,0);}for(let r=.35;r<1.6;r+=.25)for(let i=0;i<7;i++){const a=i/7*Math.PI/2,b=(i+1)/7*Math.PI/2;pp.push(Math.cos(a)*sign*r,-Math.sin(a)*r,0,Math.cos(b)*sign*r,-Math.sin(b)*r,0);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pp,3));const w=new T.LineSegments(geo,webMat);w.position.set(...corner);world.add(w);}
const shed=buildShed({world,M,box,mesh,cylinder,label,colliders,solidMeshes,interactables,batchArticulated});
const shedEntrance={type:'shedDoor',x:SHED.x,z:SHED_FRONT+.6,y:0,price:0,name:'GROUNDSKEEPER’S SHED',hex:'#c4c9a9',get open(){return shed.open;}};interactables.push(shedEntrance);
earth.userData.lawnMap=bakeLawnMap(estateTrees)||earth.userData.lawnMap;
const estateDetail=addEstateDetail({scene,world,M,box,mesh,mistTex,fire,colliders,interactables,trees:estateTrees});
const expansion=buildMansionExpansion({scene,world,M,box,mesh,cylinder,sphere,painting,sofa,bookcase,label,station,colliders,furnishings,rugs});
const rotundaBell=buildRotundaBell({world,solidMeshes,interactables,batchArticulated});
const secondFloor=buildSecondFloor({scene,world,M,box,mesh,cylinder,sphere,label,colliders,solidMeshes,interactables,station,furnishings,rugs});
// Olivia's attic (v131 Easter egg): built with the house, sealed until 25 bone chips.
const attic=buildOliviaAttic({world,M,box,colliders,solidMeshes,interactables,upperFixtures:secondFloor.fixtures});
for(const hearth of furnishings.hearths)estateDetail.addFlame(hearth);
let boneChips=0,boneChipsFound=0,atticState={opening:false,time:0,open:false},oliviaCheer=0;
const facade=buildFacade({world,M,secondFloor,colliders,solidMeshes});
// The family crest now sits in the pediment's roundel.
crest.position.set(0,PORTICO.entablature[1]+15*PORTICO.slope*.42,12.24+.925);crest.scale.set(1.45,1.45,1);if(!crest.parent)world.add(crest);
// Upper exhibits use solid wall bays, with their fronts facing the room.
// Keep the exterior windows, bedroom furniture and wing doorways clear.
for(const [id,x,z,rotation] of [
  ['iron',-41.24,-4,Math.PI/2],['quick',-14.5825,-5.2,-Math.PI/2],
  ['eye',14.5825,-4.7,Math.PI/2],['stride',41.24,-4,-Math.PI/2]
])perkStation({...perkDefs.find(p=>p.id===id),rotation},x,z,UPPER_Y);
station(-41.21,4.2,'M12 SHOTGUN','shotgun',1200,UPPER_Y,Math.PI/2);
station(41.21,4.2,'RAVEN SMG','smg',1500,UPPER_Y,-Math.PI/2);
station(27.3675,-5.2,'AR-15 / .450 BUSHMASTER','bushmaster',2500,UPPER_Y,-Math.PI/2);
powerStation(-18,2.5825,'double',UPPER_Y);powerStation(18,2.5825,'grenades',UPPER_Y);
stationBuilder.add({x:16.8,z:-11.2775,y:UPPER_Y,...ARMOR_STATION});
const cellar=buildCellar({world,M,box,mesh,cylinder,label,colliders,solidMeshes,interactables,batchArticulated});
stationBuilder.add({x:CELLAR.x,z:CELLAR.z+CELLAR.d/2-.95,y:CELLAR.y,rotation:Math.PI,...forgeStation('THE CELLAR SOUL FORGE')});
const cellarEntrance={type:'cellarDoor',x:CELLAR.x,z:CELLAR.topZ-.5,y:0,price:0,name:'STORM CELLAR',hex:'#8ee0df'};interactables.push(cellarEntrance);
const graveyard=buildGraveyard({world,M,earth,box,mesh,cylinder,label,colliders,solidMeshes,interactables,batchArticulated});
const bella=createBellaCompanion({world,colliders,solidMeshes,interactables,batchArticulated});
// v205: the katana rests on its stand against the servants' quarters' north wall, between
// the two rows of beds, facing the doorway from the infirmary.
station(28,-83.22,KATANA_STATION.name,'katana',KATANA_STATION.price);
const eventVisuals=createWorldEventVisuals(world),baseFogDensity=scene.fog.density;
// Survival systems.
const armorStations=interactables.filter(s=>s.type==='armor'),forgeStations=interactables.filter(s=>s.type==='upgrade');
for(const station of forgeStations)for(const material of station.forgeMaterials)patchLightingMaterial(material);
for(const s of armorStations)for(const model of s.nanoModels){batchArticulated(model);model.traverse(o=>{o.userData.dynamic=true;o.userData.collectible=true;});}
for(const portrait of portraits){portrait.group.updateWorldMatrix(true,true);portrait.matrix=portrait.group.matrixWorld.clone();portrait.bounds=new T.Box3().setFromObject(portrait.group);portrait.normal=new T.Vector3(0,0,1).transformDirection(portrait.matrix);}
for(const {hinge} of [...cellar.doors,...graveyard.doors,...shed.doors])hinge.userData.lightingBlocker=true;
prepareLightingMaterials(world);signage.capture(world);batchStaticWorld();
const bloodPool=createEffectPool(world,M.blood,'particle',256),markPool=createEffectPool(world,M.dark,'mark',96);
const lighting=createLighting({renderer,scene,world,camera,moonlight,flashlight});
const cellarFixtures=[-6,2,8].flatMap(z=>[-1,1].map(side=>({x:CELLAR.x+side*(CELLAR.w/2-.7),y:-1.6,z:CELLAR.z+z,color:0x80cbd2,intensity:6,distance:11,cellar:true})));
const tombFixtures=[-1,1].map(side=>({x:MAUSOLEUM.x+side*3.2,y:1.8,z:MAUSOLEUM.z-1,color:0xffc777,intensity:5,distance:8}));
const environmentLights=createEnvironmentLights(scene,[...expansion.fixtures,...cellarFixtures,...tombFixtures,...shed.fixtures],secondFloor.fixtures,lighting);
// Blackout event: every estate light fades; the flashlight, enemy eyes, pickups and event essence never do.
const blackout=createBlackout({scene,world,hemisphere,moonlight,viewLights:[viewFill,viewKey],environmentLights,sky:skyMat.uniforms,skip:o=>{for(let p=o;p;p=p.parent)if(p===eventVisuals.root||p.userData.enemy||p.userData.companion||p.userData.lightingTransient||p.userData.powerup)return true;return false;}});
const frozenTransforms=freezeStaticTransforms(scene,world);
for(const m of solidMeshes){m.geometry.computeBoundingBox();m.geometry.computeBoundingSphere();}
const enemyAssets=createEnemyAssets(batchArticulated),combatLights=createCombatLights(scene,lighting);
// Sir Blackthorn and the curse ladder (v130).
const bossFx=createBossEffects(world),curseLadder=createCurseLadder();
let boss={stage:'dormant',enemy:null,clock:0,summons:0,lance:0,cry:0,cast:null,victories:0};
prepareLightingMaterials(enemyAssets.injuries.group);prepareLightingMaterials(enemyAssets.faces.group);for(const rig of enemyAssets.templates){prepareLightingMaterials(rig.group);const rage=rig.group.clone(true);enemyAssets.enrage({group:rage});prepareLightingMaterials(rage);}
const powerupAssets=createPowerupAssets();
const {weapons,weaponAimFov,waveConfig,isBlocked,indexColliders}=await import('./core.mjs?v=205');indexColliders(colliders);let nav=makeNavigation();
function makeNavigation(){
  const navigation=buildVerticalNavigation(colliders),brutes=buildVerticalNavigation(colliders,{radius:BRUTE.radius,groundHeight:BRUTE.height,upperHeight:BRUTE.crouchHeight}),rebuild=navigation.rebuild;
  bella.setNavigation(bella.unlocked?buildVerticalNavigation(colliders,{radius:BELLA.bodyRadius,groundHeight:BELLA.height,upperHeight:BELLA.height}):null);
  // One shared field per body size; never rebuild a route for each enemy/frame.
  navigation.brutes=brutes;navigation.rebuild=(x,z,y=0)=>{rebuild(x,z,y);brutes.rebuild(x,z,y);};
  return navigation;
}
// v200 (Dead Tide step 1): the session's own values (mode, mouse capture, look,
// trigger and aim) live in one object from controls.mjs.
const session=createSession();
let frenzyWave=0,waveFiveFinale=null;
let elapsed=0,lastTime=performance.now(),waveDelay=7,spawnTimer=0,toSpawn=0,spawned=0,navTimer=0,wave=0;const keys=new Set(),player=new T.Vector3(0,0,20);
// v198 (Dead Tide step 1): the run's own values live in one object from player.mjs,
// shared with the weapon runtime. Walking, jumping, getting hurt and recovering are
// player.mjs's too; the mansion hands over its floors, stairs and collision.
const runState=createRunState();
// v201 (Dead Tide step 1): sound lives in audio.mjs; the page's switch turns it on and off.
const soundOn=()=>$('sound').checked;const gameAudio=createAudio({isOn:soundOn}),{init:initAudio,tone,noise,suppressedReport}=gameAudio;
const {walk,recover,hurtPlayer}=createPlayer({
  level:{colliders,supportBelow,move:moveWithCollision,updateHeight:updateActorHeight},
  run:{player,tone,noise,rumble:padRumble,gameOver,onHurt(source,shielded){flashDamage(shielded);combatHud.hurt(player,source,session.lookYaw+weaponRecoil.yaw,shielded);}},
  state:runState
});
// v199 (Dead Tide step 1): the HUD's shared readouts, the reload bar, toasts, banners
// and flashes live in hud.mjs. The mansion's own readouts stay in updateHud below.
const hud=createHud({dom:{$,setMarkup,setOpacity},session,state:runState,perks:perkDefs,
  rules:{badges:()=>bella.unlocked?`<div class="powerupBadge companionBadge" style="color:#f0dbc1">${BELLA_PAW}<span>IMMORTAL COMPANION · RANK ${['I','II','III','IV'][bella.rank-1]}<b>BELLA · ${bella.activity}</b></span></div>`:''}});
const {notify,announce,updateReloadHud,updateVitals,markHit,flashDamage,clearFlashes,clearToast,clearBanner,fadeHud}=hud;
const curse=createCurse();
const curseUI=createCurseUI({document,curse});
const weaponRecoil=createWeaponRecoil(),combatHud=createCombatHud({hit:$('hit'),headshot:$('headshotIndicator'),directions:$('damageDirections'),toggle:$('headshotToggle')});

const worldEvents=createWorldEvents({
  graves:graveyard.graves,
  onWarning(id,graves){
    const def=WORLD_EVENTS[id];announce(def.name,def.warning);
    if(id==='awakening')eventVisuals.mark(graves);
    if(id==='shroud'){tone(320,.9,.055,'sine',95);tone(155,1.4,.035,'triangle',45);}
    else if(id==='surge')tone(65,1.2,.065,'sawtooth',220);
    else if(id==='blackout'){tone(120,1.2,.035,'square',117);noise(.35,.05,1800);}
    else {noise(.7,.07,240);tone(55,1,.045,'triangle',30);}
    updateHud();
  },
  onStart(id){const def=WORLD_EVENTS[id];announce(def.name,def.description);if(id==='surge')tone(220,.8,.065,'triangle',55);if(id==='blackout'){tone(170,1.4,.08,'sawtooth',24);noise(.18,.07,900);}updateHud();},
  onEnd(id,reason){if(id==='blackout'&&reason==='expired')tone(32,1.1,.05,'sawtooth',150);eventVisuals.clearMarkers();scene.fog.density=baseFogDensity;setOpacity('eventPulse',0);$('eventStatus').innerHTML='';},
  spawn:spawnGraveEnemy,
});
function spawnGraveEnemy({grave,slot}){
  if(session.mode!=='playing'||zombies.filter(e=>!e.dead).length>=EVENT_RULES.aliveLimit)return false;
  const body=enemyBody(),offsets=slot?[[.58,.38],[-.58,.38],[0,.9],[.8,0]]:[[0,.22],[.58,.38],[-.58,.38],[0,.9]];
  for(const [dx,dz] of offsets){
    const x=grave.x+dx,z=grave.z+dz;
    if(isBlocked(x,z,body.radius,colliders,undefined,0,body.height)||supportBelow(x,z,0)!==0||!nav.direction(x,z,0)?.reachable)continue;
    if(Math.hypot(x-player.x,z-player.z)<body.radius+PLAYER_RADIUS+.12||!crowd.canOccupy(x,z,0,body.radius+.06,body.height))continue;
    const e=injure(makeZombie(x,z));e.graveBorn=true;e.bonusEssence=EVENT_RULES.graveBonus;e.emergeLeft=1.05;e.group.position.y-=1.65;return true;
  }
  return false;
}

let bestWave=0,bestKills=0;try{const b=JSON.parse(localStorage.getItem('blackthorn-best')||'{}');bestWave=b.wave||0;bestKills=b.kills||0;}catch{}
$('best').textContent=bestWave?`PERSONAL BEST / WAVE ${bestWave} · ${bestKills} KILLS`:'';
function addPoints(n){const earned=curseReward(n,curse.rank);runState.points+=earned;runState.totalScore+=earned;return earned;}
// v197 (Dead Tide step 1): firing, reloading, ammunition, weapon ranks, the gun on
// screen, grenades and power-ups live in weapon-runtime.mjs. The run's values stay
// here for now and are handed over as `state`.
const {swing,updateMelee,ammoCapacity,freshInventory,restockTarget,restockWeapon,ammoFull,refillAmmo,shoot,reload,finishReload,holdToFire,buyWeaponRank,grenade,grenadeCue,releaseGrenade,grantPowerup,
  dualOn,fireDualSide,selectWeapon,applyWeaponRanks,syncDualSmg,syncBushmasterSight,viewGun,bushDotOn,zoomOf,aimFovOf,aimHeight}=createWeaponRuntime({
  level:{colliders,isBlocked,solidMeshes},
  view:{camera,gunGroups,bushDot,smgDual,dualGuns,dualMuzzle,flash,reticleHud,weaponRecoil,grenadeThrow,grenadeAssets},
  run:{scene:world,zombies,effects,markPool,rand,tone,noise,notify,rumble:padRumble,suppressedReport,updateHud,updateReloadHud,player,get shotRumble(){return SHOT_RUMBLE;},get raycaster(){return raycaster;}},
  state:{get inventory(){return runState.inventory;},get weapon(){return runState.weapon;},set weapon(v){runState.weapon=v;},get mode(){return session.mode;},get aiming(){return session.aiming;},get lookYaw(){return session.lookYaw;},get lookPitch(){return session.lookPitch;},get perkOwned(){return runState.perkOwned;},
    get points(){return runState.points;},set points(v){runState.points=v;},get reloadLeft(){return runState.reloadLeft;},set reloadLeft(v){runState.reloadLeft=v;},get reloadDuration(){return runState.reloadDuration;},set reloadDuration(v){runState.reloadDuration=v;},
    get shotTimer(){return runState.shotTimer;},set shotTimer(v){runState.shotTimer=v;},get grenades(){return runState.grenades;},set grenades(v){runState.grenades=v;},get grenadeTime(){return runState.grenadeTime;},set grenadeTime(v){runState.grenadeTime=v;},
    get grenadeCooldown(){return runState.grenadeCooldown;},set grenadeCooldown(v){runState.grenadeCooldown=v;},get doubleTime(){return runState.doubleTime;},set doubleTime(v){runState.doubleTime=v;},
    get flashTime(){return firstPerson.flashTime;},set flashTime(v){firstPerson.flashTime=v;},get recoil(){return firstPerson.recoil;},set recoil(v){firstPerson.recoil=v;},get dualSide(){return firstPerson.dualSide;},set dualSide(v){firstPerson.dualSide=v;},
    get weaponViewFov(){return firstPerson.viewFov;},set weaponViewFov(v){firstPerson.viewFov=v;},get shotId(){return runState.shotId;},set shotId(v){runState.shotId=v;}},
  combat:{get damageEnemy(){return damageEnemy;},get bloodBurst(){return bloodBurst;},get detonateRound(){return detonateRound;}}
});
firstPerson.bind({player,state:runState,session,weaponRecoil,grenadeThrow,arms:{aimFovOf,zoomOf,dualOn,aimHeight,viewGun,swing}});
// The mansion's stations: shared ones from stations.mjs, plus its own kinds (Bella's
// kennel, Olivia, Sir Blackthorn's grave, the shed, cellar and tomb doors, the shed's
// M4 and the Warden LMG), which go through the rules below.
const stationKit=createStations({stations:interactables,player,state:runState,isPlaying:()=>session.mode==='playing',
  arms:{selectWeapon,buyWeaponRank,ammoFull,restockWeapon,refillAmmo,grantPowerup},hud:{notify,updateHud},sound:{tone},
  rules:{
    // Bella's kennel keeps selling her ranks; the Warden's exhibit keeps selling the LMG's.
    stillOpen:s=>(s.type==='kennel'&&bella.unlocked&&bella.rank<BELLA.maxRank)||(s.type==='lmg'&&runState.inventory.lmg.owned&&nextRank('lmg',runState.inventory.lmg.weaponRank)),
    // The M4 only from inside the shed, the grave only inside the tomb, the cellar only once open.
    hidden:s=>(s.shedWeapon&&!inShed(player.x,player.z))||(s.type==='sarcophagus'&&!inMausoleum(player.x,player.z))||(s.y<0&&!isCellarOpen()),
    label:s=>s.type==='olivia'?(bella.dragon?'RAT DRAGON':bella.unlocked?`BELLA RANK ${['I','II','III','IV'][bella.rank-1]}`:'BELLA IS LOCKED UP'):s.type==='kennel'&&bella.unlocked?`RANK ${nextBellaRank(bella.rank).numeral} · ${nextBellaRank(bella.rank).chips} BONE CHIPS`:s.type==='bell'?'DORMANT':s.type==='mausoleumDoor'?(graveyard.open?'OPEN':'CLEAR WAVE 20'):s.type==='cellarDoor'?(isCellarOpen()?'OPEN':'WAVE 10'):s.type==='shedDoor'?(shed.open?'OPEN':'WAVE 7'):s.shedWeapon&&s.purchased&&!stationKit.ranksAtRack(s)?'OWNED':undefined,
    describe(s){if(s.type==='sarcophagus')return 'Speak to the grave to wake Sir Blackthorn · Once per run';if(s.type==='olivia')return bella.dragon?'Bella is a rat dragon now · Olivia is very proud':bella.unlocked?'Olivia adores Bella · Spend bone chips from Bella’s kills at her kennel to rank her up':'Free Bella from her kennel first';if(s.type==='kennel'){const next=bella.unlocked&&nextBellaRank(bella.rank);return next?`RANK ${next.numeral} · ${next.name.toUpperCase()} · ${next.effect} · ${next.chips} bone chips from Bella’s kills`:'BELLA · White Maltipoo · Immortal companion · Follows you and bites undead within 15 yards of you · Bitten undead turn and fight her · Rank her up here with bone chips';}if(s.shedWeapon)return s.purchased?'M4 PURCHASED · PRESS 6 TO EQUIP':'30-ROUND FULL-AUTO · Includes full magazine and reserve · Keeps Soul Forge ranks';if(s.type==='shedDoor')return shed.open?'OPEN · Explore the groundskeeper’s workshop':'SEALED · Opens automatically at wave 7';if(s.type==='nuke')return s.used?'DEVICE SPENT':'ONE USE · Destroys all active undead across the estate · Wakes Sir Blackthorn';if(s.type==='mausoleumDoor')return graveyard.open?'OPEN · Enter the Blackthorn family tomb':'SEALED · Clear wave 20 to unlock';if(s.type==='cellarDoor')return isCellarOpen()?'OPEN · Descend to the underground armory':'LOCKED · Opens automatically at wave 10';if(s.type==='lmg')return '100-round belt · 3× combat scope · Taking it triggers frenzy for the rest of this wave';},
    use(s){
      if(s.type==='lmg'&&!runState.inventory.lmg.owned&&waveDelay>0){notify('THE WARDEN AWAKENS DURING A WAVE · WAIT FOR THE COUNTDOWN');return true;}
      if(s.type==='sarcophagus'){speakToGrave();return true;}
      if(s.type==='olivia'){talkToOlivia();return true;}
      if(s.type==='kennel'&&bella.unlocked){buyBellaRank();return true;}
      if(s.type==='cellarDoor'||s.type==='mausoleumDoor'||s.type==='shedDoor'){notify(stationKit.describe(s));return true;}
    },
    equip(s){
      if(s.shedWeapon&&s.purchased){selectWeapon('rifle');return true;}
    },
    buy(s){
      if(s.type==='kennel'){bella.unlock();nav=makeNavigation();nav.rebuild(player.x,player.z,player.y);notify('BELLA IS FREE · RANK I · 15-YARD GUARD RADIUS · HER KILLS DROP BONE CHIPS FOR RANKS II–IV',5);tone(740,.12,.045,'triangle',1000);tone(940,.18,.035,'triangle',680);updateHud();return true;}
      if(s.shedWeapon){const capacity=ammoCapacity('rifle');runState.inventory.rifle.owned=true;runState.inventory.rifle.ammo=capacity.mag;runState.inventory.rifle.reserve=capacity.reserve;runState.reloadLeft=0;s.purchased=true;selectWeapon('rifle');notify('M4 ASSAULT RIFLE ACQUIRED');tone(440,.3,.09,'triangle',880);updateHud();return true;}
      if(s.type==='lmg'){s.used=true;s.model.visible=false;runState.inventory.lmg.owned=true;runState.reloadLeft=0;selectWeapon('lmg');triggerFrenzy();updateHud();return true;}
    }
  }});
const {interact}=stationKit;
runState.inventory=freshInventory();
selectWeapon('glock');
// v200 (Dead Tide step 1): capturing the mouse, pausing, the settings page, the
// are-you-sure prompts and the play controls live in controls.mjs. The mansion keeps
// its own menus and overlays and its pause wording.
const {hasMouseLock,clearPlayInput,releaseMouse,captureAcquired,captureFailed,requestPointer,startDirectPlay,resumeLabel,resumeHint,pauseGame,showPauseMenu,showPausePage,settingsOpen,openSettings,closeSettings,confirmOpen,askConfirm,cancelConfirm,acceptConfirm,resumeGame,
  directControls,padPlay,cycleWeapon,touchLook,touchActions,padActions,onPointerLockChange,onPointerLockError,onVisibilityChange,onMouseMove,onMouseDown,onMouseUp,playKey,onKeyUp,onBlur}=createControls({
  page:{$,canvas,keys},session,state:runState,
  act:{shoot,reload,grenade,selectWeapon,zoomOf,interact,toggleFlashlight,openEstateMap,initAudio,fitTouchStick},
  ui:{get touchControls(){return touchControls;},get controlScheme(){return controlScheme;}},
  hooks:{
    onPause(){curseUI.update();},onPauseMenu(){curseUI.updatePauseStats();},
    pauseSummary:()=>`Wave ${Math.max(wave,1)} · ${runState.kills} kills · ${runState.points.toLocaleString()} essence.`,
    settingsEyebrow:from=>from==='menu'?'BLACKTHORN ESTATE':'BLACKTHORN ESTATE / PAUSED',settingsFromMenu(){$('pauseCurse').classList.add('hidden');},
    confirm:{
      restart:['Start a new run?','Your current run ends here and won’t be scored. A fresh run starts at wave 1.','YES, START A NEW RUN',()=>resetRun()],
      menu:['Return to the main menu?','Your current run ends here and won’t be scored.','YES, GO TO MAIN MENU',()=>returnToMenu()]
    },
    lookBlocked:()=>!$('guide').classList.contains('hidden')
  }
});
const crowd=createCrowd(zombies,player);
const playerCanOccupy=(x,z,y)=>crowd.canOccupy(x,z,y,PLAYER_RADIUS,1.8,null,player);
function bruteCrouchAt(x,z,y){
  return y>UPPER_Y-2||(y>-.3&&Math.abs(x-MAUSOLEUM.x)<MAUSOLEUM.w/2+1&&z>MAUSOLEUM.z-MAUSOLEUM.d/2-1&&z<MAUSOLEUM.frontZ+2);
}
// v195 (Dead Tide step 1): the mansion as the shared enemy modules see it. The
// spawner (enemy-spawn.mjs) and the AI (enemy-ai.mjs) both take this map.
const mansionLevel={colliders,isBlocked,supportBelow,floorHeight:enemyFloorHeight,rampHeight:(x,z)=>cellarStairHeight(x,z)??stairHeight(x,z),move:moveWithCollision,crouchAt:bruteCrouchAt,
  canStand:(x,z,y,r)=>y!==UPPER_Y||hasUpperFloor(x,z,r),get nav(){return nav;},crowd,solidMeshes,visibleFloor};
// Making and placing enemies lives in enemy-spawn.mjs; when and what to spawn
// (waves, finales, curse ranks, camping, the upper floor) stays here.
const {makeZombie,makeLurker,injure,spawnKind,placement,choosePoint,disposeEnemy}=createEnemySpawner({
  level:mansionLevel,
  run:{player,zombies,scene:world,enemyAssets,rng,rand,sharedResources:()=>({geometries:new Set([boxGeo,sphereGeo,cylGeo]),materials:new Set(Object.values(M))})},
  rules:{enemyStats:()=>curseWaveConfig(wave,curse.rank)}
});
// v179: whether a wave spawn is a Grotesque Lurker comes from dice of its own.
function lurkerDice(w,slot){let h=(seed^Math.imul(w,0x9E3779B1)^Math.imul(slot+1,0x85EBCA77))>>>0;h=Math.imul(h^h>>>16,0x45d9f3b)>>>0;h=Math.imul(h^h>>>16,0x45d9f3b)>>>0;return ((h^h>>>16)>>>0)/4294967296;}
// v196 (Dead Tide step 1): hits, kills, blasts, drops and pickups live in
// enemy-combat.mjs. The mansion keeps its own rewards and extras: curse-rank and
// world-event essence, Bella's bone chips, Sir Blackthorn, the Gravewarden's shield
// and grave essence.
const {damageEnemy,killZombie,bloodBurst,blastLine,explode,detonateRound,lurkerBurst,lurkerBursts,dropPickup,updatePickups,updateEffects}=createCombat({
  level:mansionLevel,
  run:{player,zombies,scene:world,rand,rng,tone,noise,notify,rumble:padRumble,sphere,effects,bloodPool,explosionFx,blastLight:BLAST_LIGHT,powerupAssets,pickups,enemyAssets,
    get elapsed(){return elapsed;},get playing(){return session.mode==='playing';},
    addPoints,addKill:()=>{runState.kills++;},hurtPlayer,kick:()=>{firstPerson.recoil=.1;},
    // v191: the LMG capstone mends on every kill it makes.
    killHeal(impact){const heal=runState.inventory[impact.source]?rankKillHeal(impact.source,runState.inventory[impact.source].weaponRank):0;if(heal&&session.mode==='playing'&&runState.health>0)runState.health=Math.min(runState.maxHealth,runState.health+heal);},
    hitFeedback(headshot,impact){markHit(headshot);if(combatHud.hit(headshot,impact.shotId)){tone(1250,.055,.035,'triangle',1850);tone(1850,.07,.022,'sine',1200);}},
    collect(p){if(p.type==='essence'){const reward=addPoints(p.value);notify(`GRAVE ESSENCE +${reward}`);}else if(p.type==='bone')collectBoneChip();else grantPowerup(p.type);},
    releasePickup:p=>eventVisuals.release(p)},
  rules:{
    killReward:base=>worldEvents.killReward(base),
    onKill(e,impact){if(impact.source==='Bella'&&bella.rank<BELLA.maxRank)dropBoneChip(e);endWarCry(e);if(e.boss)defeatBlackthorn(e);else if(e.warden)addPoints(WARDEN.reward);},
    bonusDrop:e=>eventVisuals.dropEssence(e.walkPos.x,e.walkPos.z,e.floorY,pickups),
    hitAmount(e,amount,impact){if(e.warden&&impact.part==='shield'){amount*=WARDEN.shieldFactor;tone(900,.05,.02,'square',600);}return amount;}
  }
});
const spawns=ESTATE_SPAWNS;let upperSpawnSlot=0;const campWatch=createCampWatch();
function spawnEnemy(){
  if(toSpawn<=0)return false;
  const finale=waveFiveFinale?.wave===wave;
  const rolled=finale?waveFiveFinale.kinds[waveFiveFinale.enemies.length]:chooseCurseEnemyKind(wave,spawned,rng(),curse.rank);
  // v179: from wave 11, one spawn in twenty is a Grotesque Lurker (its own dice).
  const kind=!finale&&wave>=LURKER.fromWave&&lurkerDice(wave,spawned)<LURKER.spawnChance?'lurker':rolled,place=placement(kind),{valid}=place;
  // v174: camping in the storm cellar or Olivia's room makes the floor give way.
  const camp=campWatch.area;
  if(camp&&campKindAllowed(camp,kind)&&campWatch.take()&&zombies.filter(e=>!e.dead&&e.campBorn===camp.id).length<camp.cap){
    const far=[];for(const c of campCandidates(camp,player)){if(valid(c,CAMP_RULES.minDistance))far.push(c);if(far.length>=6)break;}
    if(far.length){
      const [x,z,y]=far[Math.floor(rng()*far.length)];
      const enemy=spawnKind(kind,x,z,y);
      enemy.campBorn=camp.id;enemy.emergeLeft=enemy.emergeTime=CAMP_RULES.emergeTime;enemy.emergeDepth=CAMP_RULES.emergeDepth;enemy.group.position.y-=CAMP_RULES.emergeDepth;
      noise(.35,.09,320);tone(46,.7,.06,'sawtooth',28);
      if(campWatch.warn())notify(`${camp.name} · THE DEAD CLAW UP THROUGH THE FLOOR`,3);
      if(finale)waveFiveFinale.enemies.push(enemy);
      spawned++;toSpawn--;if(wave>10&&spawned%4===0)upperSpawnSlot=Math.floor(rng()*4);return true;
    }
  }
  const ground=spawns.filter(p=>valid(p));
  // One in four spawn slots moves upstairs from wave 11. Crowded/blocked
  // upper rooms fall back to clear ground positions rather than losing enemies.
  const upper=wave>10?UPPER_SPAWNS.filter(p=>valid(p)):[];
  const reachable=wave>10&&spawned%4===upperSpawnSlot&&upper.length?upper:ground.length?ground:upper;
  const at=choosePoint(reachable,place);if(!at)return false;
  const enemy=spawnKind(kind,...at);
  if(finale)waveFiveFinale.enemies.push(enemy);
  spawned++;toSpawn--;if(wave>10&&spawned%4===0)upperSpawnSlot=Math.floor(rng()*4);return true;
}
// v179: wave 10 ends in a second frenzied finale, heralded by a foul stench,
// with two or three Grotesque Lurkers among the dead.
function beginStenchFinale(){
  const F=LURKER.finale,lurkers=F.lurkers[lurkerDice(wave,9999)<.5?0:1],slots=F.slots.slice(0,lurkers);
  waveFiveFinale={wave,kinds:Array.from({length:F.count},(_,slot)=>slots.includes(slot)?'lurker':F.brutes.includes(slot)?'brute':'walker'),enemies:[]};
  frenzyWave=wave;toSpawn=waveFiveFinale.kinds.length;
  announce('FRENZIED FINALE',`A DISGUSTING STENCH FILLS THE AIR · WAVE ${String(wave).padStart(2,'0')} · ${F.count} UNDEAD, INCLUDING ${lurkers} GROTESQUE LURKERS`);
  notify('YOU SMELL SOMETHING ROTTEN ON THE AIR…',5);tone(44,1.6,.12,'sawtooth',120);noise(.8,.05,300);
  spawnEnemy();spawnTimer=waveConfig(wave).interval*.4;
}
function beginWaveFiveFinale(){
  // Four brutes arrive among thirteen walkers. Advance this fixed roster only
  // after a safe spawn succeeds, so blocked routes cannot change the count.
  waveFiveFinale={wave:5,kinds:Array.from({length:17},(_,slot)=>[0,4,8,12].includes(slot)?'brute':'walker'),enemies:[]};
  frenzyWave=wave;toSpawn=waveFiveFinale.kinds.length;
  announce('FRENZIED FINALE','WAVE 05 · 17 UNDEAD, INCLUDING 4 BRUTES');tone(50,1.3,.12,'sawtooth',180);
  spawnEnemy();spawnTimer=waveConfig(wave).interval*.4;
}
function unlockShed(){if(!shed.unlock())return false;nav=makeNavigation();nav.rebuild(player.x,player.z,player.y);notify('A DOOR HAS BLOWN OPEN SOMEWHERE…',5);noise(.45,.16,350);tone(65,.65,.09,'sawtooth',28);return true;}
function startWave(){wave++;frenzyWave=0;waveFiveFinale=null;upperSpawnSlot=wave>10?Math.floor(rng()*4):0;if(wave>=SHED.unlockWave)unlockShed();if(wave>MAUSOLEUM.unlockAfterWave)unlockMausoleum();if(wave===CELLAR.unlockWave){setCellarOpen(true);cellar.gate.disabled=true;nav=makeNavigation();nav.rebuild(player.x,player.z,player.y);notify('NORTH GROUNDS · THE STORM CELLAR IS OPEN');}const cfg=curseWaveConfig(wave,curse.rank);toSpawn=cfg.count;spawned=0;spawnTimer=.7;waveDelay=0;announce(`WAVE ${String(wave).padStart(2,'0')}`,wave===10?'STORM CELLAR UNSEALED · NORTH GROUNDS':wave===11?'THE DEAD NOW RISE ON THE SECOND FLOOR':wave===1?'THE ESTATE HAS AWAKENED':wave===6?'ASHFANG HOUNDS JOIN THE HUNT':wave===7?'FERAL STALKERS JOIN THE HUNT':wave%5===0?'THE BRUTES HAVE RISEN':'THE DEAD GROW RESTLESS');tone(130,1,.1,'sawtooth',45);worldEvents.beginWave(wave);}
const raycaster=new T.Raycaster();

// ---- Weapon upgrade ranks (v159) ----------------------------------------
function unlockMausoleum(){if(!graveyard.unlock())return false;nav=makeNavigation();nav.rebuild(player.x,player.z,player.y);notify('EAST CEMETERY · THE MAUSOLEUM IS UNSEALED');tone(160,1,.09,'sine',70);return true;}
// v190: speak to the grave in the sarcophagus to wake Sir Blackthorn. It costs
// nothing and works once per run, after the tomb opens upon clearing wave 20.
function speakToGrave(){
  const s=graveyard.grave;
  if(session.mode!=='playing'||!graveyard.open||s.locked||s.used||!inMausoleum(player.x,player.z)||Math.abs(player.y-s.y)>=1.2||Math.hypot(player.x-s.x,player.z-s.z)>=2.3)return false;
  if(!wakeBlackthorn())return false;
  s.used=true;notify('YOU SPEAK HIS NAME · THE GRAVE ANSWERS');updateHud();return true;
}

// ---- Sir Blackthorn -----------------------------------------------------------------
// Speaking to his grave wakes him (v190). The lid slides off, he rises out of the tomb and
// steps down; regular spawns hold until he falls, then the run carries on.
function blackthornHoldsSpawns(){return boss.stage==='waking'||boss.stage==='active';}
function resetBlackthorn(){boss={stage:'dormant',enemy:null,clock:0,summons:0,lance:0,cry:0,cast:null,victories:0};bossFx.clear();graveyard.openLid(0);$('bossHud').classList.add('hidden');}
function wakeBlackthorn(){
  if(boss.stage!=='dormant')return false;
  boss.stage='waking';boss.clock=0;boss.enemy=null;
  announce('THE SARCOPHAGUS STIRS','SIR BLACKTHORN AWAKENS · GET CLEAR OF THE TOMB');
  noise(1.2,.12,120);tone(38,2.4,.14,'sawtooth',30);return true;
}
function makeElite(kind,x,z,y=0){
  const knight=kind==='knight',cfg=curseWaveConfig(wave,curse.rank);
  const e=makeZombie(x,z,!knight,false,false,y,false,{scale:knight?BOSS.scale:BRUTE.scale*WARDEN.scale});
  // Both use brute-sized collision and brute routes, whatever rig they wear.
  // Sir Blackthorn cuts like a swordsman; the Gravewarden hammers down.
  e.gait={...e.gait,attack:knight?'swiper':'slammer'};
  e.brute=true;e.elite=true;e.noEnrage=true;resetBuild(e);clearFace(e);const body=enemyBody(e);e.radius=body.radius;e.bodyHeight=body.height;e.crouch=0;
  e.staggerProfile=staggerLimits(e);
  if(knight){e.boss=true;e.maxHp=e.hp=cfg.health*BOSS.healthMultiplier;e.speed=cfg.speed*BOSS.speed;const dress=dressKnight(e);e.orb=dress.orb;}
  else{e.warden=true;e.maxHp=e.hp=cfg.health*BRUTE.healthMultiplier*WARDEN.healthMultiplier;e.speed=cfg.speed*WARDEN.speed;const dress=dressWarden(e);e.shield=dress.shield;}
  tagZombie(e,e);if(e.shield)for(const m of e.shield)m.userData.part='shield';
  return e;
}
function updateWaking(dt){
  boss.clock+=dt;const step=wakeStep(boss.clock);
  graveyard.openLid(step.lid);
  if(step.stage==='lid'&&step.lid<.1&&!boss.lidSound){boss.lidSound=true;noise(1.1,.16,260);tone(52,1.2,.1,'sawtooth',40);}
  if((step.stage==='rise'||step.stage==='step'||step.stage==='done')&&!boss.enemy){
    const e=makeElite('knight',BOSS.front.x,BOSS.front.z);e.waking=true;boss.enemy=e;
    boss.lance=2.5;boss.cry=BOSS.cry.firstDelay;boss.summons=0;boss.cast=null;
  }
  const e=boss.enemy;if(!e)return;
  const g=e.group,face=Math.atan2(player.x-g.position.x,player.z-g.position.z);g.rotation.y=face;
  if(step.stage==='rise'){const r=step.rise;g.position.set(BOSS.rest.x,-2.6+(r*r*(3-2*r))*3.05,BOSS.rest.z);}
  else if(step.stage==='step'){const t=step.step;g.position.set(BOSS.rest.x,(.45+Math.sin(t*Math.PI)*.35)*(1-t)+enemyFloorHeight(BOSS.front.x,BOSS.front.z)*t,T.MathUtils.lerp(BOSS.rest.z,BOSS.front.z,t));if(t>.85&&!boss.landed){boss.landed=true;noise(.4,.2,180);tone(45,.6,.12,'sine',30);padRumble(.8,.5,300);}}
  else if(step.stage==='done'){
    e.waking=false;boss.stage='active';g.position.set(BOSS.front.x,enemyFloorHeight(BOSS.front.x,BOSS.front.z)-.02,BOSS.front.z);
    announce(BOSS.name,`${BOSS.title} · CURSE RANK ${curse.rank}`);tone(70,1.8,.16,'sawtooth',35);
    $('bossHud').classList.remove('hidden');
  }
}
// Called from the enemy loop for the boss: casts lances and war cries, and
// summons Gravewardens at health thresholds. Returns true while casting.
function updateBlackthorn(e,dt,dist,sameFloor){
  const fraction=Math.max(0,e.hp/e.maxHp),phase=bossPhase(fraction),pace=1/cooldownScale(fraction);
  if(phase==='enraged'&&!e.furious){e.furious=true;e.speed*=BOSS.enragedSpeed;enemyAssets.enrage(e);notify('SIR BLACKTHORN IS ENRAGED',3);tone(55,1.2,.14,'sawtooth',38);}
  for(let n=dueSummons(fraction,boss.summons);n>0;n--){boss.summons++;summonWarden(e);boss.cry=Math.min(boss.cry,1.4);}
  if(boss.cast){
    const c=boss.cast;c.left-=dt;e.orb.scale.setScalar(c.kind==='lance'?.04+.12*(1-c.left/c.time):.001);
    if(c.left<=0){boss.cast=null;e.orb.scale.setScalar(.001);if(c.kind==='lance')throwLances(e,fraction);else warCry(e);}
    return true;
  }
  boss.lance-=dt*pace;boss.cry-=dt*pace;
  const allies=zombies.some(o=>o!==e&&!o.dead&&o.walkPos.distanceTo(e.walkPos)<BOSS.cry.radius);
  if(boss.cry<=0&&allies){boss.cast={kind:'cry',left:BOSS.cry.windup,time:BOSS.cry.windup};boss.cry=BOSS.cry.cooldown;tone(90,.9,.08,'sawtooth',260);return true;}
  if(boss.lance<=0&&sameFloor&&dist>=BOSS.lance.minRange&&dist<=BOSS.lance.maxRange&&bossCanSee(e)){
    boss.cast={kind:'lance',left:BOSS.lance.windup,time:BOSS.lance.windup};boss.lance=rand(...BOSS.lance.cooldown);tone(330,.7,.05,'sine',880);return true;
  }
  return false;
}
const bossEye=new T.Vector3(),bossTarget=new T.Vector3(),lanceDir=new T.Vector3(),lanceUp=new T.Vector3(0,1,0);
function bossCanSee(e){
  bossEye.set(e.walkPos.x,e.walkPos.y+2.1,e.walkPos.z);bossTarget.set(player.x,player.y+1.2,player.z);
  lanceDir.subVectors(bossTarget,bossEye);const d=lanceDir.length();lanceDir.divideScalar(d);
  raycaster.set(bossEye,lanceDir);raycaster.far=d;const hit=raycaster.intersectObjects(solidMeshes,false)[0];raycaster.far=Infinity;
  return !hit;
}
// Applied after the walk animation: the lance arm rises, the cry flings both wide.
function poseBlackthorn(e){
  const c=boss.cast;if(!c)return;const f=Math.min(1,(c.time-c.left)/.25);
  if(c.kind==='lance'){const a=e.arms[0];a.pivot.rotation.x=T.MathUtils.lerp(a.pivot.rotation.x,-2.4,f);a.pivot.rotation.z=T.MathUtils.lerp(a.pivot.rotation.z,-.2,f);a.forearm.rotation.x=T.MathUtils.lerp(a.forearm.rotation.x,-.3,f);}
  else{for(const [i,a] of e.arms.entries()){a.pivot.rotation.x=T.MathUtils.lerp(a.pivot.rotation.x,-1.5,f);a.pivot.rotation.z=T.MathUtils.lerp(a.pivot.rotation.z,i?.95:-.95,f);}if(e.jaw)e.jaw.rotation.x=.55*f;e.spine.rotation.x=T.MathUtils.lerp(e.spine.rotation.x,-.25,f);}
}
function throwLances(e,fraction){
  const from=new T.Vector3();e.orb.getWorldPosition(from);
  bossTarget.set(player.x,player.y+1.15,player.z);const base=bossTarget.sub(from).normalize();
  const count=lanceVolley(fraction);
  for(let i=0;i<count;i++){const angle=(i-(count-1)/2)*BOSS.lance.spread;bossFx.launch(from,base.clone().applyAxisAngle(lanceUp,angle));}
  noise(.25,.1,1400);tone(520,.4,.05,'triangle',140);
}
const lanceChest=new T.Vector3();
function lanceHit(prev,next){
  lanceChest.set(player.x,player.y+1.1,player.z);
  if(segmentDistance(prev,next,lanceChest)>BOSS.lance.hitRadius)return false;
  hurtPlayer(waveConfig(wave).damage*BOSS.lance.damage,next);tone(160,.25,.08,'sawtooth',60);
  if(runState.health<=0)gameOver();return true;
}
function lanceBlocked(p){return p.y<supportBelow(p.x,p.z,p.y+.1)||isBlocked(p.x,p.z,.08,colliders,undefined,p.y-.08,.16);}
// War cry: every undead within reach is driven into a red fury for a while.
function warCry(e){
  bossFx.cry(e.walkPos);noise(.9,.18,220);tone(62,1.3,.18,'sawtooth',150);padRumble(.6,.6,400);
  let roused=0;
  for(const o of zombies){
    if(o===e||o.dead||o.walkPos.distanceTo(e.walkPos)>BOSS.cry.radius)continue;
    if(!o.warCry&&!o.enraged){o.cryMaterials=new Map();o.group.traverse(m=>{if(m.isMesh)o.cryMaterials.set(m,m.material);});enemyAssets.enrage(o);}
    o.warCry=BOSS.cry.duration;roused++;
  }
  notify(roused?`SIR BLACKTHORN'S WAR CRY · ${roused} UNDEAD IN A FURY`:'SIR BLACKTHORN SCREAMS',3);
}
function endWarCry(o){
  o.warCry=0;
  if(o.cryMaterials){if(!o.enraged)for(const [m,material] of o.cryMaterials)m.material=material;o.cryMaterials=null;}
}
function summonWarden(e){
  const body=enemyBody({brute:true});
  for(let i=0;i<16;i++){
    const a=i*2.4,r=3+(i%4)*.8,x=e.walkPos.x+Math.sin(a)*r,z=e.walkPos.z+Math.cos(a)*r,y=e.walkPos.y;
    if(isBlocked(x,z,body.radius+.1,colliders,undefined,y,body.height)||Math.abs(supportBelow(x,z,y)-y)>.01||!nav.brutes.direction(x,z,y)?.reachable)continue;
    if(!crowd.canOccupy(x,z,y,body.radius+.1,body.height)||Math.hypot(x-player.x,z-player.z)<2)continue;
    const w=makeElite('warden',x,z,y);w.emergeLeft=w.emergeTime=WARDEN.emergeTime;w.emergeDepth=WARDEN.emergeDepth;w.group.position.y-=WARDEN.emergeDepth;
    bossFx.summon(w.walkPos);announce('A GRAVEWARDEN RISES','SHOTS INTO ITS SHIELD DO A QUARTER DAMAGE');noise(.8,.14,160);tone(48,1.4,.12,'sawtooth',36);
    return w;
  }
  return null;
}
function defeatBlackthorn(e){
  if(boss.stage!=='active')return;
  boss.stage='defeated';boss.cast=null;boss.victories++;bossFx.clear();$('bossHud').classList.add('hidden');
  const reward=addPoints(BOSS.reward);
  dropPickup(e.walkPos.x,e.walkPos.z,'ammo',e.floorY);
  const unlocked=curseLadder.victory(curse.rank);renderCurseMenu();
  announce('SIR BLACKTHORN FALLS',unlocked!==null?`CURSE RANK ${unlocked} UNLOCKED · CHOOSE IT ON THE TITLE SCREEN`:`+${reward.toLocaleString()} ESSENCE · THE HOUSE REMEMBERS`);
  notify(`+${reward.toLocaleString()} ESSENCE · THE ROTUNDA BELL TOLLS`,5);
  // The great bell tolls across the estate.
  tone(110,3.2,.12,'triangle',55);tone(220,3.6,.07,'sine',110);tone(330,2.4,.04,'sine',165);
}
function updateBossHud(){
  const e=boss.enemy;if(boss.stage!=='active'||!e)return;
  const fraction=Math.max(0,e.hp/e.maxHp),wardens=zombies.filter(o=>o.warden&&!o.dead).length;
  $('bossBar').style.width=`${(fraction*100).toFixed(1)}%`;
  const state=`${e.furious?'ENRAGED · ':''}${Math.ceil(fraction*100)}%${wardens?` · ${wardens} GRAVEWARDEN${wardens>1?'S':''}`:''}`;
  if($('bossState').textContent!==state)$('bossState').textContent=state;$('bossHud').classList.toggle('enraged',!!e.furious);
}
// Title-screen curse selector: every unlocked rank, plus the next one locked.
// Curse choice (v147). The title screen no longer carries the curse picker:
// until rank 1 is unlocked, Enter the Estate starts an uncursed run at once;
// after that, Enter asks which unlocked rank this run should carry.
function renderCurseMenu(){
  const list=$('curseStartList');list.replaceChildren();
  for(let rank=0;rank<=curseLadder.unlocked;rank++){
    const b=document.createElement('button');b.type='button';b.className='curseOption';b.dataset.rank=String(rank);b.setAttribute('role','listitem');
    const title=document.createElement('strong');title.textContent=`RANK ${rank} · ${curseTitle(rank).toUpperCase()}`;
    const info=document.createElement('span');info.textContent=curseSummary(rank)+(rank===curseLadder.unlocked&&rank<MAX_CURSE_RANK?` · Defeat Sir Blackthorn on this rank to unlock rank ${rank+1}.`:'');
    b.append(title,info);
    if(rank===curseLadder.selected){b.dataset.padDefault='';b.setAttribute('aria-current','true');}
    b.onclick=()=>chooseCurse(rank);list.appendChild(b);
  }
  if(curseLadder.unlocked<MAX_CURSE_RANK){const locked=document.createElement('div');locked.className='curseOption locked';locked.setAttribute('role','listitem');locked.setAttribute('aria-disabled','true');locked.innerHTML=`<strong>RANK ${curseLadder.unlocked+1} · LOCKED</strong>`;list.appendChild(locked);}
}
function curseStartOpen(){return !$('curseStart').classList.contains('hidden');}
function openCurseChoice(){
  renderCurseMenu();$('curseStart').classList.remove('hidden');
  ($('curseStartList').querySelector('[aria-current]')||$('curseStartList').querySelector('button'))?.focus({preventScroll:true});
}
function closeCurseChoice(){
  $('curseStart').classList.add('hidden');
  const start=$('start');start.disabled=false;start.focus({preventScroll:true});
}
// The rank button is the click that enters the estate, so mouse capture keeps
// its user activation.
function chooseCurse(rank){curseLadder.select(rank);$('curseStart').classList.add('hidden');resetRun();}
function startFromMenu(){if(curseLadder.unlocked>=1)openCurseChoice();else resetRun();}
renderCurseMenu();

// ---- Olivia's attic (v131 Easter egg) -----------------------------------------------
// Bella's kills drop bone chips; the 25th collected opens a hatch above her
// kennel. v184: chips are spent at her kennel on ranks 2-4 (the rat dragon comes
// with rank 4); Olivia, up in the garret, cheers her on.
function dropBoneChip(e){
  const m=boneChipModel(),y=e.floorY||0;m.position.set(e.walkPos.x,y+.85,e.walkPos.z);world.add(m);
  pickups.push({mesh:m,type:'bone',y,life:EASTER_EGG.chipLife,phase:rand(0,6)});
}
function collectBoneChip(){
  boneChips++;boneChipsFound++;tone(880,.12,.05,'triangle',1320);
  const next=nextBellaRank(bella.rank);
  if(boneChipsFound>=EASTER_EGG.chips&&!atticState.opening&&!atticState.open)openAttic();
  else notify(next?`BONE CHIP · ${boneChips}/${next.chips}${boneChips>=next.chips?' · UPGRADE BELLA AT HER KENNEL':''}`:`BONE CHIPS · ${boneChips}`);
  updateHud();
}
// v184: ranks 2-4, bought at Bella's kennel with bone chips.
function buyBellaRank(){
  const next=nextBellaRank(bella.rank);if(!next){notify('BELLA HAS EVERY RANK');return false;}
  if(boneChips<next.chips){notify(`NEED ${next.chips-boneChips} MORE BONE CHIPS · BELLA’S KILLS DROP THEM`);tone(110,.2,.03,'square');return false;}
  boneChips-=next.chips;bella.upgrade();
  announce(`BELLA · RANK ${next.numeral}`,next.rank===BELLA.maxRank?'A GRENADE CART IN TOW · WINGS, A DRAGON TAIL AND FIRE BREATH':next.effect.toUpperCase());
  tone(523,.25,.06,'triangle',659);tone(659,.3,.05,'triangle',784);if(next.rank===BELLA.maxRank)tone(784,.5,.05,'triangle',1046);updateHud();return true;
}
// v184: shots from her back gun. They hurt like her bite does (flat damage),
// earn hit essence and count as her kills, but do not draw the zombie to her.
function bellaShot(enemy,damage,direction,kind){damageEnemy(enemy,damage,false,{direction,part:'torso',force:kind==='laser'?.35:.25,source:'Bella'});if(kind==='laser')tone(1400,.05,.012,'sine',2400);else tone(620,.035,.016,'square',300);}
function bellaBlast(pos){explode(pos,{source:'Bella',safe:true});}
function openAttic(){
  if(atticState.opening||atticState.open)return false;
  atticState.opening=true;atticState.time=0;
  announce('SOMETHING CREAKS ABOVE',`${EASTER_EGG.chips} BONE CHIPS · A HATCH OPENS ABOVE BELLA’S KENNEL`);
  noise(1.2,.08,420);tone(150,1.4,.06,'triangle',90);return true;
}
function updateAtticOpening(dt){
  atticState.time+=dt;attic.setProgress(atticState.time/EASTER_EGG.openTime);
  if(atticState.time>=EASTER_EGG.openTime){atticState.opening=false;atticState.open=true;setAtticOpen(true);clearAtticUnderside();nav=makeNavigation();nav.rebuild(player.x,player.z,player.y);tone(523,.2,.05,'triangle',784);updateHud();}
}
function talkToOlivia(){
  if(!bella.unlocked){notify('OLIVIA: “WHERE’S BELLA? LET HER OUT OF HER KENNEL!”',3);return false;}
  oliviaCheer=2.5;
  if(bella.dragon){notify('OLIVIA: “BELLA LOOKS SO COOL!”',3);return false;}
  const next=nextBellaRank(bella.rank);
  notify(`OLIVIA: “TAKE BELLA’S BONE CHIPS TO HER KENNEL! ${['SHE CAN GET A GUN!','SHE CAN GET A LASER!','AT RANK IV SHE BECOMES A DRAGON!'][next.rank-2]}” · ${boneChips}/${next.chips}`,3);return false;
}
// v173: once the flight is down its underside is solid. Anyone standing there
// as it lands steps out to the nearer side of the stairs.
function clearAtticUnderside(){
  const S=OLIVIA_ATTIC.stair,out=(p,r)=>{if(Math.abs(p.y-UPPER_Y)>.5||p.z>S.bottomZ||p.z<S.topZ||Math.abs(p.x-S.x)>=S.w/2+.05+r)return;const side=p.x>=S.x?1:-1;p.x=S.x+side*(S.w/2+.05+r+.05);};
  out(player,PLAYER_RADIUS);for(const e of zombies)if(!e.dead)out(e.walkPos,e.radius||.38);if(bella.unlocked)out(bella.pos,.3);
}
function playerInAttic(){return player.y>OLIVIA_ATTIC.y-.3&&inAttic(player.x,player.z);}
// Steering for the narrow attic stairs, which the navigation grid does not
// cover: from the bedchamber to the stair foot, up the flight, and back down.
const BEDCHAMBER={x0:-41.76,x1:-28,z0:-11.76,z1:-2};
function atticRoute(x,z,y,goalInAttic){
  if(!isAtticOpen())return null;
  // On the treads, not walking underneath the flight's high end.
  const S=OLIVIA_ATTIC.stair,ramp=stairAt(x,z)===S?stairHeight(x,z):null,onStair=ramp!==null&&y>ramp-.45,inRoom=y>OLIVIA_ATTIC.y-.3&&inAttic(x,z);
  if(goalInAttic){
    if(inRoom)return null;
    if(onStair)return {x:S.x,z:S.topZ-.7};
    if(Math.abs(y-UPPER_Y)<.35&&x>BEDCHAMBER.x0&&x<BEDCHAMBER.x1&&z>BEDCHAMBER.z0&&z<BEDCHAMBER.z1){
      // Never walk under the flight: go round its side to the foot, line up, climb.
      const side=x>=S.x?1:-1,lane=S.w/2+.6;
      if(ramp!==null)return {x:S.x+side*lane,z};
      if(z<S.bottomZ)return Math.abs(x-S.x)<lane-.1?{x:S.x+side*lane,z}:{x:S.x+side*lane,z:S.bottomZ+.75};
      if(Math.abs(x-S.x)<.45&&z<S.bottomZ+1)return {x:S.x,z:S.topZ-.7};
      return {x:S.x,z:S.bottomZ+.6};
    }
    return null;
  }
  if(onStair)return {x:S.x,z:S.bottomZ+.6};
  if(inRoom)return {x:S.x,z:S.topZ+.3};
  return null;
}
// Rat-dragon fire: every pulse burns each enemy inside the cone, through no walls.
function bellaBreath(origin,dir,range,angle){
  const F=BELLA.fire,damage=(F.base+F.perWave*Math.max(1,wave))*F.scale*F.pulse;
  for(const e of zombies){
    if(e.dead||e.waking||e.emergeLeft>0)continue;const p=e.walkPos;if(Math.abs(p.y-(origin.y-.45))>1.1)continue;
    const dx=p.x-origin.x,dz=p.z-origin.z,d=Math.hypot(dx,dz);if(d>range+(e.radius||.3))continue;
    if(d>.5&&(dx*dir.x+dz*dir.z)/d<Math.cos(angle))continue;
    if(d>.5&&!hasClearPath(origin.x,origin.z,p.x,p.z,p.y,p.y,.08,1.2))continue;
    damageEnemy(e,damage,false,{direction:new T.Vector3(dx,0,dz).normalize(),part:'torso',force:.25,source:'Bella'});
  }
}
function completeWave(){
  worldEvents.endWave();frenzyWave=0;
  const bonus=addPoints(300+wave*50);
  runState.health=Math.min(runState.maxHealth,runState.health+30);runState.grenades=Math.min(4,runState.grenades+1);
  const tombUnlocked=wave>=MAUSOLEUM.unlockAfterWave&&unlockMausoleum();
  waveDelay=12;
  announce(waveFiveFinale?.wave===wave?'FINALE CLEARED':'WAVE CLEARED',`+${bonus} ESSENCE · ${tombUnlocked?'EAST MAUSOLEUM UNSEALED · SOMETHING STIRS IN THE TOMB':'RESTOCK AND PREPARE'}`);
  tone(390,.6,.07,'triangle',780);
  // Show the notice, minute clock and HUD state in this clearing frame.
  updateHud();
}
function triggerFrenzy(){if(waveDelay>0||waveFiveFinale?.wave===wave)return;frenzyWave=wave;waveDelay=0;toSpawn+=Math.max(12,Math.ceil(curseWaveConfig(wave,curse.rank).count*.5));spawnTimer=.1;announce('THE WARDEN HAS AWAKENED','FRENZY · FASTER UNDEAD + REINFORCEMENTS UNTIL THIS WAVE ENDS');tone(65,1.5,.16,'sawtooth',160);}
function updateHud(){
  updateReloadHud();
  stationKit.updateForges();curseUI.update(session.mode);
  const finale=waveFiveFinale?.wave===wave&&waveDelay===0;
  {const next=nextBellaRank(bella.rank),chips=boneChips>0&&!!next&&bella.unlocked,text=chips?`BONE CHIPS · ${boneChips}/${next.chips}${atticState.open?' · THE ATTIC IS OPEN':''}`:'';$('boneHud').classList.toggle('hidden',!chips);if($('boneHud').textContent!==text)$('boneHud').textContent=text;}
  const remaining=toSpawn+worldEvents.pendingSpawns+zombies.filter(e=>!e.dead).length;
  const eventMarkup=worldEvents.badge();setMarkup('eventStatus',eventMarkup);
  const bruteRemaining=finale?waveFiveFinale.enemies.filter(e=>e.brute&&!e.dead).length+waveFiveFinale.kinds.slice(waveFiveFinale.enemies.length).filter(kind=>kind==='brute').length:0;
  const lurkerRemaining=finale?waveFiveFinale.enemies.filter(e=>e.lurker&&!e.dead).length+waveFiveFinale.kinds.slice(waveFiveFinale.enemies.length).filter(kind=>kind==='lurker').length:0;
  $('frenzyHud').textContent=finale?`WAVE ${waveFiveFinale.wave} FRENZY · ${remaining} UNDEAD · ${bruteRemaining} BRUTES${waveFiveFinale.wave===LURKER.finale.wave?` · ${lurkerRemaining} LURKERS`:''}`:'FRENZY · SURVIVE THE CURRENT WAVE';
  $('frenzyHud').classList.toggle('hidden',frenzyWave!==wave||!frenzyWave);$('wave').textContent=String(Math.max(wave,1)).padStart(2,'0');$('waveState').textContent=boss.stage==='active'?'SIR BLACKTHORN · THE DEAD WAIT ON HIM':waveDelay>0?`NEXT WAVE IN ${Math.ceil(waveDelay)}s`:finale?`FRENZIED FINALE · ${remaining} UNDEAD REMAIN`:`${frenzyWave===wave&&wave?'FRENZY · ':''}${remaining} UNDEAD REMAIN`;updateVitals();}
const changelog=createChangelog({document,onOpen:pauseGame});
const leaderboard=createLeaderboard({document,onOpen:()=>{if(session.mode==='playing')pauseGame();},onNewRun:()=>resetRun()});
function resetRun({capture=true}={}){applyFormFactor();boneChips=boneChipsFound=0;atticState={opening:false,time:0,open:false};oliviaCheer=0;setAtticOpen(false);attic.setProgress(0);lighting.setBlockerState('closed:closed',cellar.progress>0||graveyard.progress>0||shed.progress>0);releaseMouse();grenadeThrow.cancel();worldEvents.reset();eventVisuals.reset();curse.setRank(curseLadder.selected);resetBlackthorn();leaderboard.startRun();runState.armor=runState.armorMax=runState.armorTier=frenzyWave=0;waveFiveFinale=null;setCellarOpen(false);cellar.reset();campWatch.reset();bella.reset();stationBuilder.reset();graveyard.reset();shed.reset();nav=makeNavigation();$('estateMap').classList.add('hidden');mapWasPlaying=false;for(const e of zombies){world.remove(e.group);disposeEnemy(e);}zombies.length=0;for(const e of effects){world.remove(e.mesh);if(e.type==='blast')e.mesh.material?.dispose();}effects.length=0;explosionFx.clear();bloodPool.reset();markPool.reset();for(const p of pickups){p.fade?.dispose();p.fade=null;world.remove(p.mesh);}pickups.length=0;combatLights.reset();player.set(0,0,20);session.lookYaw=0;session.lookPitch=0;camera.fov=firstPerson.viewFov=75;camera.updateProjectionMatrix();runState.health=runState.maxHealth=100;runState.points=500;runState.totalScore=0;runState.kills=0;wave=0;waveDelay=7;toSpawn=0;runState.runTime=0;runState.lastHurt=-20;runState.perkOwned.clear();runState.grenades=3;runState.doubleTime=0;runState.grenadeTime=0;runState.grenadeCooldown=0;runState.inventory=freshInventory();applyWeaponRanks();runState.reloadLeft=0;runState.shotTimer=0;runState.feetY=0;runState.jumpV=0;runState.grounded=true;clearFlashes();runState.shotId=0;weaponRecoil.reset();combatHud.reset();clearToast();clearPlayInput();firstPerson.resetSlide(runState.inventory.glock.ammo);selectWeapon('glock');session.mode='paused';$('menu').classList.add('hidden');$('pause').classList.add('hidden');$('hud').classList.remove('hidden');if(capture)requestPointer();else{$('pauseTitle').textContent='The estate is ready.';$('pauseText').textContent=padPlay()?'Press A to begin. Menu pauses the game.':touchControls?.enabled?'Tap Play to begin. The II button pauses the game.':'Click Play to lock your mouse and begin. Esc releases it and pauses the game.';$('captureHelp').classList.add('hidden');$('resume').classList.remove('hidden');$('resume').textContent=padPlay()?'PRESS A TO PLAY →':touchControls?.enabled?'TAP TO PLAY →':'CLICK TO PLAY →';showPauseMenu();}announce('BLACKTHORN ESTATE','BUY PERKS. WATCH YOUR AMMO. SURVIVE.');nav.rebuild(player.x,player.z,player.y);updateHud();}
let touchControls=null;
// Main Menu (v143): abandon the run, clear the estate as a new run would, and
// return to the title screen with Enter the Estate ready again.
function returnToMenu(){
  if(session.mode!=='paused'&&session.mode!=='dead')return;
  resetRun({capture:false});
  session.mode='menu';clearPlayInput();releaseMouse();touchControls?.setActive(false);
  $('pause').classList.add('hidden');$('hud').classList.add('hidden');$('menu').classList.remove('hidden');
  clearBanner();renderCurseMenu();
  const start=$('start');start.disabled=false;start.innerHTML='ENTER THE ESTATE <span>→</span>';start.focus({preventScroll:true});
}
function gameOver(){if(session.mode==='dead')return;curseUI.update();worldEvents.endWave();eventVisuals.reset();grenadeThrow.cancel();runState.grenadeCooldown=0;session.mode='dead';clearPlayInput();releaseMouse();$('captureHelp').classList.add('hidden');if(wave>bestWave||wave===bestWave&&runState.kills>bestKills){bestWave=wave;bestKills=runState.kills;try{localStorage.setItem('blackthorn-best',JSON.stringify({wave,kills:runState.kills}));}catch{}}$('pauseTitle').textContent='The house claims another.';$('pauseText').textContent=`Survived to wave ${wave} · ${runState.kills} kills · ${runState.totalScore.toLocaleString()} essence earned · Curse ${curse.rank} / ${curse.title}. Personal best: wave ${bestWave}.`;$('resume').classList.add('hidden');showPauseMenu();tone(90,2,.12,'sawtooth',25);leaderboard.endRun({score:runState.totalScore,wave,kills:runState.kills,duration:runState.runTime,curseRank:curse.rank});}
let guideReturnFocus=null;
// One window, three views (v143): 'controls' and 'guide' from the pause menu,
// and 'all' (controls first, then the guide) from the title screen.
const GUIDE_VIEWS={controls:['BLACKTHORN / CONTROLS','Controls','Close controls'],guide:['BLACKTHORN / FIELD GUIDE','Stay alive. Spend wisely.','Close field guide'],all:['BLACKTHORN / FIELD GUIDE','Stay alive. Spend wisely.','Close field guide']};
function openFieldGuide(trigger,view='guide'){
  const [eyebrow,title,close]=GUIDE_VIEWS[view]||GUIDE_VIEWS.guide;
  $('guide').dataset.view=view;$('guideEyebrow').textContent=eyebrow;$('guideTitle').textContent=title;$('closeGuide').setAttribute('aria-label',close);
  pauseGame();guideReturnFocus=trigger;$('guide').classList.remove('hidden');
  $('guideBody').scrollTop=0;$('guideBody').focus({preventScroll:true});
}
function closeFieldGuide(){
  $('guide').classList.add('hidden');guideReturnFocus?.focus({preventScroll:true});guideReturnFocus=null;
}
function fieldGuideKeydown(e){
  if(e.code==='Escape'){e.preventDefault?.();closeFieldGuide();return;}
  if(e.code==='Tab'){
    // Skip links the current view hides (Controls hides the section index).
    const items=[...$('guide').querySelectorAll('button,a[href],[tabindex="0"]')].filter(el=>{const r=el.getClientRects?.();return r?r.length>0:true;});
    const current=items.indexOf(document.activeElement);
    const next=e.shiftKey?(current<=0?items.length-1:current-1):(current+1)%items.length;
    e.preventDefault();items[next]?.focus();
  }
  // Leave native scrolling and link/button activation to the browser.
}
if(!window.Blackthorn)$('start').onclick=startFromMenu;$('resume').onclick=resumeGame;$('restart').onclick=()=>askConfirm('restart',$('restart'));
$('howBtn').onclick=()=>openFieldGuide($('howBtn'),'guide');$('controlsMenu').onclick=()=>openFieldGuide($('controlsMenu'),'controls');$('curseStartBack').onclick=closeCurseChoice;$('guidePause').onclick=()=>openFieldGuide($('guidePause'),'guide');$('controlsPause').onclick=()=>openFieldGuide($('controlsPause'),'controls');
$('settingsPause').onclick=()=>openSettings('pause');$('settingsMenu').onclick=()=>openSettings('menu');$('settingsBack').onclick=closeSettings;$('mainMenuPause').onclick=()=>askConfirm('menu',$('mainMenuPause'));
$('confirmYes').onclick=acceptConfirm;$('confirmNo').onclick=cancelConfirm;
$('closeGuide').onclick=closeFieldGuide;$('guideDone').onclick=closeFieldGuide;
// Sensitivity and sound are remembered like the other settings (v144);
// explicit launch-link values still win.
const SENSITIVITY_KEY='blackthorn-sensitivity',SOUND_KEY='blackthorn-sound';
function showSensitivity(){$('sensitivityValue').textContent=`${Number($('sensitivity').value).toFixed(1)}×`;}
function showSound(){const label=document.querySelector('[data-sound-setting]');if(label)label.textContent=soundOn()?'ON':'OFF';}
try{
  const launch=new URLSearchParams(location.search),sens=Number(localStorage.getItem(SENSITIVITY_KEY)),sound=localStorage.getItem(SOUND_KEY);
  if(!launch.has('sensitivity')&&sens>=.5&&sens<=2)$('sensitivity').value=String(sens);
  if(!launch.has('sound')&&(sound==='0'||sound==='1'))$('sound').checked=sound==='1';
}catch{}
$('sensitivity').oninput=$('sensitivity').onchange=()=>{showSensitivity();try{localStorage.setItem(SENSITIVITY_KEY,$('sensitivity').value);}catch{}};
$('sound').onchange=()=>{gameAudio.syncAmbience();showSound();try{localStorage.setItem(SOUND_KEY,soundOn()?'1':'0');}catch{}};
showSensitivity();showSound();
configureMinimap({radar:$('radar'),navigation:$('hudNavigation'),vitals:$('hudVitals'),toggle:$('minimapToggle')});
// Phones start on touch controls and computers on mouse and keyboard; a pause-
// menu change is remembered per kind of device. Controllers are detected, but
// take over only once gamepad play exists (controllerSupported).
const controlScheme=createControlScheme({win:window,controllerSupported:true,onChange:schemeChanged});
// Phone layout (v142): a compact HUD for phone screens, checked at load, on
// every resize or rotation, and again on entering the mansion.
function applyFormFactor(){controlScheme.refresh('device');document.body.classList.toggle('phone-ui',controlScheme.phone);}
// Touch layout (v146): the movement stick rests just above the health panel
// (and the shield row when one is owned, and the minimap when it is set to the
// bottom left), so its bottom edge always clears them. The column is measured
// whenever it changes size or the screen does.
let stickClearance=-1,vitalsWatch=null;
function fitTouchStick(){
  const vitals=$('hudVitals');if(!vitals||!touchControls?.root)return;
  if(!vitalsWatch&&typeof ResizeObserver==='function'){vitalsWatch=new ResizeObserver(()=>fitTouchStick());vitalsWatch.observe(vitals);}
  const top=vitals.getBoundingClientRect?.().top;if(!(top>0))return;
  const clear=Math.round(innerHeight-top);if(clear===stickClearance)return;
  stickClearance=clear;touchControls.root.style.setProperty('--vitals-clear',`${clear}px`);
}
// The last device used takes over: a controller button, or a real key, click
// or tap. Mouse movement alone never switches, so a nudged desk can't steal play.
for(const type of ['keydown','mousedown','pointerdown'])window.addEventListener(type,e=>{
  if(e.isTrusted===false)return;
  if(type==='pointerdown'&&e.pointerType==='mouse')return;
  controlScheme.noteInput(type==='pointerdown'?'touch':'keyboard');
},true);
touchControls=createTouchControls({document,toggle:$('touchToggle'),fireToggle:$('tapFireToggle'),fireSetting:$('tapFireSetting'),enabled:controlScheme.scheme==='touch',onToggle:on=>controlScheme.choose(on?'touch':'standard'),actions:touchActions});
function schemeChanged(scheme){
  touchControls?.setEnabled(scheme==='touch');
  document.body.classList.toggle('pad-controls',scheme==='controller');
  if(scheme!=='controller')gamepad?.reset();
  updateControllerStatus();
  // Switching schemes while paused swaps the mouse-capture wording.
  if(session.mode!=='paused')return;
  if(!$('captureHelp').classList.contains('hidden')){$('captureHelp').classList.add('hidden');$('pauseTitle').textContent='Catch your breath.';}
  $('pauseText').textContent=scheme==='controller'?'Controller connected. Press Menu, or A on Resume, to keep fighting.':scheme==='touch'?'Touch controls are on. Tap Resume to keep fighting.':'Click Resume to lock the mouse again.';
  $('resume').textContent=resumeLabel();
}
// ---- Controller ------------------------------------------------------------
const RUMBLE_KEY='blackthorn-controller-rumble';
let rumbleOn=true;try{rumbleOn=localStorage.getItem(RUMBLE_KEY)!=='off';}catch{}
function applyRumbleSetting(){$('rumbleToggle').setAttribute('aria-checked',String(rumbleOn));$('rumbleToggle').querySelector('[data-rumble-setting]').textContent=rumbleOn?'VIBRATION ON':'VIBRATION OFF';}
$('rumbleToggle').onclick=()=>{rumbleOn=!rumbleOn;try{localStorage.setItem(RUMBLE_KEY,rumbleOn?'on':'off');}catch{}applyRumbleSetting();if(rumbleOn)padRumble(.5,.3,140);};
applyRumbleSetting();
function padRumble(strong,weak,ms){if(rumbleOn&&padPlay())gamepad.rumble(strong,weak,ms);}
let shownController='';
function updateControllerStatus(){
  const status=$('controllerStatus'),pad=gamepad?.connected?gamepad.name.replace(/\s*\((?:STANDARD GAMEPAD|Vendor:)[^)]*\)/gi,'').replace(/\s*\(.*\)\s*$/,'').trim()||'Controller':'';
  const text=!pad?'No controller detected. Connect one and press any button to play with it.':padPlay()?`${pad} · in use. A key, click or tap switches back.`:`${pad} connected. Press any button on it to play with it.`;
  if(text!==shownController){shownController=text;status.textContent=text;status.classList.toggle('inUse',padPlay());}
}
// Which menu the controller is driving, topmost first.
function padLayer(){
  for(const id of ['curseStart','leaderboard','changelog','guide','estateMap','pause'])if(!$(id).classList.contains('hidden'))return $(id);
  if(session.mode==='menu'&&!$('menu').classList.contains('hidden'))return $('menu');
  return null;
}
function padBack(){
  if(curseStartOpen()){closeCurseChoice();return;}
  if(leaderboard.visible){leaderboard.close();return;}
  if(changelog.visible){changelog.keydown({code:'Escape',preventDefault(){}});return;}
  if(!$('guide').classList.contains('hidden')){closeFieldGuide();return;}
  if(!$('estateMap').classList.contains('hidden')){closeEstateMap();return;}
  if(confirmOpen()){cancelConfirm();return;}
  if(settingsOpen()){closeSettings();return;}
  if(session.mode==='paused')resumeGame();
}
function padStart(){
  if(session.mode==='playing'){pauseGame();return;}
  if(leaderboard.visible||changelog.visible||!$('guide').classList.contains('hidden')){padBack();return;}
  if(!$('estateMap').classList.contains('hidden')){closeEstateMap();return;}
  if(session.mode==='paused'){resumeGame();return;}
  if(curseStartOpen()){closeCurseChoice();return;}
  if(confirmOpen()){cancelConfirm();return;}
  if(settingsOpen()){closeSettings();return;}
  if(session.mode==='menu'&&!$('start').disabled)$('start').click();
}
// Light aim assist: look speed eases while the sights sit over an enemy body.
const padForward=new T.Vector3(),padTo=new T.Vector3();
function padOnTarget(){
  if(!padPlay())return false;
  camera.getWorldDirection(padForward);
  for(const e of zombies){
    if(e.dead)continue;const p=e.group.position,height=(e.bodyHeight||1.7)*.62;
    padTo.set(p.x-camera.position.x,p.y+height-camera.position.y,p.z-camera.position.z);
    const d=padTo.length();if(d<1||d>35)continue;
    const along=padTo.dot(padForward);if(along<=0)continue;
    if(Math.sqrt(Math.max(0,d*d-along*along))<(e.brute?.7:e.dog?.4:.45))return true;
  }
  return false;
}
const gamepad=createGamepadControls({win:window,document,actions:{...padActions,start:padStart,back:padBack}});
schemeChanged(controlScheme.scheme);
// The mansion's quality: its lamp shadows, and drifting dust only above Performance.
display.useScreen({select:$('quality'),fps:$('fps'),layout(){applyFormFactor();fitTouchStick();},quality:q=>lighting.setQuality(q),detail:q=>{estateDetail.dust.visible=q!=='low';}});
document.addEventListener('pointerlockchange',onPointerLockChange);
document.addEventListener('pointerlockerror',onPointerLockError);
document.addEventListener('visibilitychange',onVisibilityChange);
document.addEventListener('mousemove',onMouseMove);
canvas.addEventListener('mousedown',onMouseDown);document.addEventListener('mouseup',onMouseUp);canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('keydown',e=>{if(changelog.visible){changelog.keydown(e);return;}if(leaderboard.visible){if(e.code==='Escape'){e.preventDefault();leaderboard.close();}return;}if(!$('guide').classList.contains('hidden')){fieldGuideKeydown(e);return;}if(curseStartOpen()){if(e.code==='Escape'){e.preventDefault?.();closeCurseChoice();}return;}if(e.code==='Escape'&&confirmOpen()){e.preventDefault?.();cancelConfirm();return;}if(e.code==='Escape'&&settingsOpen()){e.preventDefault?.();closeSettings();return;}if(['INPUT','TEXTAREA'].includes(e.target?.tagName))return;if(e.code==='KeyM'){e.preventDefault();if(e.repeat)return;if($('estateMap').classList.contains('hidden'))openEstateMap();else closeEstateMap();return;}if(e.code==='Escape'&&!$('estateMap').classList.contains('hidden')){closeEstateMap(false);return;}playKey(e);});document.addEventListener('keyup',onKeyUp);window.addEventListener('blur',onBlur);
let mapWasPlaying=false;
function closeEstateMap(restorePlay=true){if($('estateMap').classList.contains('hidden'))return;const resume=mapWasPlaying&&restorePlay;mapWasPlaying=false;$('estateMap').classList.add('hidden');if(resume)resumeGame();}
function openEstateMap(){if(!['playing','paused'].includes(session.mode))return;mapWasPlaying=session.mode==='playing';if(mapWasPlaying)pauseGame();(player.y<-.3?drawCellarMap:player.y>2.15?drawUpperMap:drawEstateMap)($('estateMapCanvas'),player,interactables,session.lookYaw);$('estateMap').classList.remove('hidden');$('closeEstateMap').focus();}
$('closeEstateMap').onclick=()=>closeEstateMap();$('mapPause').onclick=openEstateMap;
function moveWithCollision(pos,dx,dz,r,enemy=null){return moveActor(pos,dx,dz,colliders,{radius:r,height:enemy?.bodyHeight||1.8,grounded:pos===player?runState.grounded:true,allowFall:pos===player,canOccupy:enemy?enemy.canOccupy:pos===player?playerCanOccupy:null});}
function enemyFloorHeight(x,z){
  if(Math.abs(x)<4&&z>=12&&z<=14.5)return .155;
  if(Math.abs(x)<3&&Math.abs(z)<11)return .135;
  if(Math.abs(x)<=42&&z>=-84&&z<=12)return .095;
  for(const {apron} of EXTERIOR_STAIRS)if(Math.abs(x-apron.x)<=apron.w/2&&Math.abs(z-apron.z)<=apron.d/2)return apron.topY;
  for(const path of ESTATE_PATHS)if(Math.abs(x-path.x)<=path.w/2&&Math.abs(z-path.z)<=path.d/2)return path.y+.05;
  return -.07;
}
// v194 (Dead Tide step 1): enemy AI lives in enemy-ai.mjs. The mansion hands it its
// floors, stairs and routes, and its own rules: Bella, the attic ladder, frenzy
// waves, world events and Sir Blackthorn.
const {updateEnemies,hasClearPath}=createEnemyAI({
  level:mansionLevel,
  run:{player,camera,zombies,scene:world,rand,tone,noise,get elapsed(){return elapsed;},get health(){return runState.health;},hurtPlayer,gameOver,killZombie,disposeEnemy,lurkerBursts,lurkerBurst},
  rules:{
    // Bella cannot be hurt: blows aimed at her only land with a dull thud.
    decoy(e){if(e.lurker)e.bellaAggro=false;return e.bellaAggro&&bella.unlocked?bella.pos:null;},
    decoyStruck(e){e.bellaSwings=(e.bellaSwings||0)+1;tone(150,.06,.02,'triangle',110);},
    detour:(e,p)=>!e.brute&&isAtticOpen()?atticRoute(p.x,p.z,p.y,playerInAttic()):null,
    baseDamage:()=>waveConfig(wave).damage,
    surge:e=>frenzyWave===wave&&wave&&!e.lurker?1.4:1,
    speedScale:e=>worldEvents.speedMultiplier(e),attackRate:e=>worldEvents.attackRate(e),
    boss:{rules:BOSS,warden:WARDEN,update:updateBlackthorn,pose:poseBlackthorn,endWarCry}
  }
});
// v158: a zombie Bella bites turns on her and fights her until it dies.
// Bosses and elite guardians ignore her and keep hunting the player.
function bellaBite(enemy,damage,direction){if(!enemy.boss&&!enemy.elite)enemy.bellaAggro=true;damageEnemy(enemy,damage,false,{direction:direction.clone(),part:enemy.dog?'head':'leg',force:.45,source:'Bella'});tone(460,.08,.018,'triangle',620);}
const radar=$('radar'),rx=radar.getContext('2d');// v162: north-up minimap; see minimap.mjs.
// v163: the canvas backing store follows the map's on-screen size (it grows
// with the screen on PC), so the bigger map stays sharp.
function fitRadar(){const s=Math.round(Math.min(560,Math.max(120,radar.clientWidth*Math.min(devicePixelRatio||1,3))));if(radar.clientWidth&&radar.width!==s){radar.width=radar.height=s;}}
let radarScoped=false;
function drawRadar(){fitRadar();return drawMinimap(rx,{width:radar.width,height:radar.height,player,yaw:session.lookYaw,colliders,zombies,stations:interactables,bella,scoped:radarScoped});}
let hudTick=0;
function tick(now){requestAnimationFrame(tick);gamepad.poll(Math.min(Math.max(0,(now-lastTime)/1000),.05),{enabled:padPlay(),playing:session.mode==='playing'&&$('guide').classList.contains('hidden'),layer:padLayer(),sensitivity:Number($('sensitivity').value),aiming:session.aiming&&!grenadeThrow.active,zoom:(zoomOf(runState.weapon)||1),onTarget:session.mode==='playing'&&padOnTarget()});updateControllerStatus();document.body.classList.toggle('pad-playing',padPlay()&&session.mode==='playing');if(session.mode==='playing'&&!directControls()&&!hasMouseLock())pauseGame();touchControls?.setActive(session.mode==='playing'&&$('guide').classList.contains('hidden'));const frameSeconds=Math.max(0,(now-lastTime)/1000),dt=Math.min(frameSeconds,.05);lastTime=now;elapsed+=dt;display.frame(frameSeconds,session.mode==='playing'&&!document.hidden);
if(session.mode==='curse')runState.runTime+=dt;
if(session.mode==='playing'){weaponRecoil.update(dt);cellar.update(dt);graveyard.update(dt);shed.update(dt);runState.runTime+=dt;runState.shotTimer=Math.max(0,runState.shotTimer-dt);runState.grenadeCooldown=Math.max(0,runState.grenadeCooldown-dt);if(session.mouseDown&&holdToFire())shoot();updateMelee(dt);if(runState.reloadLeft>0){runState.reloadLeft-=dt;if(runState.reloadLeft<=0){runState.reloadLeft=0;finishReload();}}
const stick=touchControls?.active?touchControls.move:padPlay()&&gamepad.connected?gamepad.move:null,moving=keys.has('KeyW')||keys.has('KeyS')||keys.has('KeyA')||keys.has('KeyD')||!!(stick&&(stick.x||stick.z));const aimingWeapon=session.aiming&&!grenadeThrow.active&&runState.reloadLeft===0;const sprint=(keys.has('ShiftLeft')||keys.has('ShiftRight')||!!touchControls?.sprint||(padPlay()&&gamepad.sprint))&&!aimingWeapon&&!session.mouseDown;let x=(keys.has('KeyD')?1:0)-(keys.has('KeyA')?1:0),z=(keys.has('KeyS')?1:0)-(keys.has('KeyW')?1:0);if(stick&&!x&&!z){x=stick.x;z=stick.z;}walk(dt,x,z,{sprint,aiming:aimingWeapon,yaw:session.lookYaw});
firstPerson.pose(dt,{moving,sprint,aiming:aimingWeapon});navTimer-=dt;if(navTimer<=0){nav.rebuild(player.x,player.z,player.y);navTimer=.6;}worldEvents.update(dt);eventVisuals.update(worldEvents);if(atticState.opening)updateAtticOpening(dt);oliviaCheer=Math.max(0,oliviaCheer-dt);attic.update(dt,{player,celebrate:oliviaCheer>0});if(boss.stage==='waking')updateWaking(dt);updateEnemies(dt);bossFx.update(dt,{hit:lanceHit,blocked:lanceBlocked});updateBossHud();if(session.mode==='playing'){bella.update(dt,{player,yaw:session.lookYaw,enemies:zombies,onBite:bellaBite,onBreath:bellaBreath,onShot:bellaShot,onBlast:bellaBlast,canSee:blastLine,climb:(pos,goal)=>atticRoute(pos.x,pos.z,pos.y,goal.y>OLIVIA_ATTIC.y-.3&&inAttic(goal.x,goal.z)),visualFloor:enemyFloorHeight});grenadeThrow.update(dt,releaseGrenade,grenadeCue);}updateEffects(dt);explosionFx.update(dt);updatePickups(dt);
recover(dt,session.mode==='playing');
runState.doubleTime=Math.max(0,runState.doubleTime-dt);runState.grenadeTime=Math.max(0,runState.grenadeTime-dt);
if(session.mode==='playing'){campWatch.update(dt,player);if(waveDelay>0){waveDelay-=dt;if(waveDelay<=1e-9)startWave();}else{spawnTimer-=dt;if(toSpawn>0&&spawnTimer<=0&&!blackthornHoldsSpawns()&&zombies.filter(e=>!e.dead).length<CURSE_RULES.aliveLimit){spawnEnemy();spawnTimer=waveConfig(wave).interval*(frenzyWave===wave?.4:1);}if(toSpawn===0&&worldEvents.pendingSpawns===0&&boss.stage!=='waking'&&!zombies.some(e=>!e.dead)){if(wave===5&&!waveFiveFinale){beginWaveFiveFinale();}else if(wave===LURKER.finale.wave&&!waveFiveFinale){beginStenchFinale();}else{completeWave();}}}}
const s=stationKit.closest(),interaction=s?stationKit.prompt(s,padPlay()?'B':touchControls?.enabled?'USE':'E'):'';setMarkup('interaction',interaction);touchControls?.update({playing:true,aiming:session.aiming,canInteract:!!s,flashlight:firstPerson.flashlightOn,canSwap:WEAPON_CYCLE.filter(k=>runState.inventory[k]?.owned).length>1});
const indoors=player.y<-.3||inMausoleum(player.x,player.z)||inShed(player.x,player.z)||!!roomAt(player.x,player.z);const flight=stairAt(player.x,player.z);const location=inShed(player.x,player.z)&&player.y>-.3?'GROUNDSKEEPER’S SHED':player.y<-.3?'STORM CELLAR / UNDERGROUND ARMORY':flight?.side?upperLocation(player.x,player.z):player.y>2.15?'2ND FLOOR / '+upperLocation(player.x,player.z):flight?'GRAND STAIRCASE':estateLocation(player.x,player.z);const locationMarkup=`BLACKTHORN ESTATE <span> / ${location}</span>`;setMarkup('location',locationMarkup);rain.visible=!indoors;gunRoot.visible=true;
scene.fog.density=baseFogDensity+(indoors?0:worldEvents.fogStrength()*(inGraveyard(player.x,player.z)?.049:.038));setOpacity('eventPulse',worldEvents.active('surge')?Math.max(0,1-worldEvents.age/1.4)*.24:0);
const ads=firstPerson.updateGun(dt,{moving,sprint});
// v168: the black scope surround swallows the dark minimap disc, so the map
// switches to a lit, higher-contrast style while a scope is up.
{const scoped=scopedGuns.some(({sight})=>sight.mask.visible);if(scoped!==radarScoped){radarScoped=scoped;radar.classList.toggle('scoped',scoped);drawRadar();}}setOpacity('crosshair',ads?0:1);
hudTick-=dt;if(hudTick<=0){updateHud();drawRadar();hudTick=.1;}}
else if(session.mode==='menu'){camera.position.set(11.8,2.1,24);camera.lookAt(-1,3.3,0);camera.position.x+=Math.sin(elapsed*.12)*.3;gunRoot.visible=false;rain.visible=true;}
updateReloadHud();combatHud.update(dt,player,session.lookYaw+weaponRecoil.yaw);firstPerson.updateFlash(dt);fadeHud(dt,session.mode==='playing');
for(const l of lamps)l.light.intensity=l.base*(.95+Math.sin(elapsed*4+l.phase)*.04+Math.sin(elapsed*7.1+l.phase)*.015);fire.scale.y=.55+Math.sin(elapsed*8)*.08;stationBuilder.update(elapsed);for(const m of mist){m.position.x+=dt*.025;if(m.position.x>43)m.position.x=-43;}
for(let i=0;i<rainPos.length;i+=3){rainPos[i+1]-=dt*9;if(rainPos[i+1]<0)rainPos[i+1]=18;if(rainPos[i]<player.x-22)rainPos[i]+=44;if(rainPos[i]>player.x+22)rainPos[i]-=44;if(rainPos[i+2]<player.z-22)rainPos[i+2]+=44;if(rainPos[i+2]>player.z+22)rainPos[i+2]-=44;}rainGeo.attributes.position.needsUpdate=true;
lighting.setBlockerState((cellar.progress===1?'open':'closed')+':'+(graveyard.progress===1?'open':'closed')+(shed.progress===1?':shed-open':''));bloodPool.sync();markPool.sync();combatLights.update(effects,pickups,player);estateDetail.update(elapsed,dt);blackout.apply(worldEvents.darkness());environmentLights.update(camera.position,elapsed,player.y);sky.position.copy(camera.position);skyMat.uniforms.time.value=elapsed;lighting.prepare(elapsed);display.render(gunRoot.visible||grenadeThrow.root.visible,world,firstPerson.viewFov);}
window.addEventListener('resize',display.resize);display.resize();
// What the mansion warms before play: every gun and the grenade in hand, scope masks,
// event visuals, power-ups and drops (and their fading copies), the enemy builds and
// their enraged look, Nano Shield models and Bella, with its lamps lit as in play.
async function prepareRendering(){
  return display.prepare(()=>{
    const finishEventWarmup=eventVisuals.warm();
    const viewModels=[...Object.values(gunGroups),bushDot],savedVisibility=viewModels.map(g=>g.visible),savedGun=gunRoot.visible;
    const scopeMasks=scopedGuns.map(({sight})=>sight.mask),savedMasks=scopeMasks.map(mask=>mask.visible);scopeMasks.forEach(mask=>mask.visible=true);
    const warmPickups=Object.keys(POWERUPS).map(type=>powerupAssets.create(type));
    for(const group of warmPickups)prepareLightingMaterials(group);
    prepareLightingMaterials(bloodPool.instances);
    camera.position.set(0,1.68,20);camera.rotation.set(0,0,0);gunRoot.visible=true;
    viewModels.forEach(g=>g.visible=true);grenadeThrow.warm();
    environmentLights.update(camera.position,0,0);lighting.prepare(0,{warm:true});
    const warmRage=enemyAssets.templates.map(r=>{const group=r.group.clone(true);enemyAssets.enrage({group});return group;});
    const warmNano=armorStations.flatMap(s=>s.nanoModels.map(source=>{const model=source.clone(true);model.visible=true;return model;}));
    const warmBella=bella.rig.group.clone(true);warmBella.traverse(o=>{o.visible=true;});
    // v169: compile the see-through variants used while drops fade out.
    const coin=eventVisuals.coins[0].mesh,warmFading=[...Object.keys(POWERUPS).map(type=>powerupAssets.create(type)),boneChipModel(),coin.clone(true)];
    for(const g of warmFading){g.visible=true;prepareLightingMaterials(g);fadeMaterials(g).set(.5);}
    indexFloors();
    return {world,
      warm:[warmBella,...warmNano,...enemyAssets.templates.map(r=>r.group),enemyAssets.injuries.group,enemyAssets.faces.group,...warmRage,...warmPickups,...warmFading,grenadeAssets.create(),explosionFx.warmGroup()],
      textures:()=>[...forgeStations.flatMap(s=>s.forgeMaterials.map(m=>m.map)),...weaponSurfaces().textures,...katanaSurfaces().textures,enemyAssets.surfaces.map,enemyAssets.surfaces.bumpMap,enemyAssets.surfaces.detail],
      done(){finishEventWarmup();viewModels.forEach((g,i)=>g.visible=savedVisibility[i]);scopeMasks.forEach((mask,i)=>mask.visible=savedMasks[i]);gunRoot.visible=savedGun;grenadeThrow.cancel();}};
  });
}
display.restoreQuality();
await prepareRendering();lastTime=performance.now();$('loading').classList.add('hidden');window.Blackthorn?.ready(startFromMenu);requestAnimationFrame(tick);
// Batch static geometry and each articulated body section to limit draw calls.
// v204: batching lives in batching.mjs; the hearth fire flickers, so it stays apart.
function batchStaticWorld(){batchStatic(scene,world,m=>m===fire);}

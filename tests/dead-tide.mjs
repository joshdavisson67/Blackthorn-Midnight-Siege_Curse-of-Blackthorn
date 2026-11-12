import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v204 (Dead Tide step 2): Dead Tide's own page and the grey-box island. Run on its own
// (its page is a different document from the mansion's): node tests/dead-tide.mjs.
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
const {CURRENT_VERSION:V}=await import('../public/game/version.mjs');

// ---- 1. Runtime isolation: neither mode loads the other ---------------------------------
const imports=f=>[...read(f).matchAll(/(?:^\s*(?:import|export)[^'"]*?from\s*|^\s*import\s*|import\(\s*)['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
function closure(...entries){const seen=new Set(),walk=f=>{if(seen.has(f))return;seen.add(f);if(/\.(m?js)$/.test(f))for(const g of imports(f))walk(g);};entries.forEach(walk);return seen;}
const pageLoads=html=>[...read(html).matchAll(/(?:src|href)="([\w.-]+?)(?:\?v=(\d+))?"/g)].map(m=>[m[1],m[2]]);
const tidePage=pageLoads('tide.html'),mansionPage=pageLoads('index.html');
assert.deepEqual(tidePage.map(([f])=>f),['style.css','tide.css','tide-boot.js'],'Dead Tide’s page loads the shared styles, its own and its own boot script, nothing else');
assert(tidePage.every(([,v])=>v===String(V)),'with this version’s cache keys');
assert(!mansionPage.some(([f])=>/tide/.test(f))&&!/tide/i.test(read('boot.js')),'The mansion’s page and boot script never mention Dead Tide');
const tide=closure('tide-boot.js'),mansion=closure('boot.js');
// Everything that builds, lays out, lights or runs the mansion, by name. (v212: not signage.mjs,
// the plaques' lettering, which Dead Tide's stations use too.)
const MANSION_ONLY=['boot.js','game.js','core.mjs','estate-layout.mjs','graveyard-layout.mjs','cellar-layout.mjs','shed-layout.mjs','vertical.mjs','cellar.mjs','graveyard.mjs','shed.mjs','mansion-expansion.mjs','second-floor.mjs','upper-shell.mjs','exterior-stairs.mjs','facade.mjs','furnishings.mjs','rugs.mjs','grounds.mjs','estate-detail.mjs','rotunda-bell.mjs','olivia.mjs','bella.mjs','blackthorn-boss.mjs','curse.mjs','curse-ui.mjs','world-events.mjs','world-event-visuals.mjs','blackout.mjs','camp-spawns.mjs','lighting.mjs','environment-lights.mjs','combat-lights.mjs','minimap-settings.mjs','leaderboard.mjs','changelog.mjs','changelog-data.mjs','column-surfaces.mjs'];
for(const f of MANSION_ONLY){assert(existsSync(resolve(game,f)),`${f} exists`);assert(mansion.has(f),`the mansion loads ${f}`);}
assert.deepEqual([...tide].filter(f=>MANSION_ONLY.includes(f)),[],'Dead Tide loads nothing that builds, lays out, lights or runs the mansion');
const TIDE_ONLY=['tide-boot.js','tide.mjs','island.mjs','tide-palette.mjs'];
assert.deepEqual([...mansion].filter(f=>TIDE_ONLY.includes(f)),[],'and the mansion loads nothing of Dead Tide');
const shared=[...tide].filter(f=>mansion.has(f));
for(const f of ['display.mjs','audio.mjs','first-person.mjs','player.mjs','hud.mjs','controls.mjs','weapon-runtime.mjs','enemy-combat.mjs','weapon-stats.mjs','batching.mjs','stations.mjs','grenade-throw.mjs','touch-controls.mjs','gamepad-controls.mjs','input-scheme.mjs'])
  assert(shared.includes(f),`Dead Tide plays with the shared ${f}`);
assert(!/three\.module|game\.js|boot\.js|tide/.test(read('modes.html').replace(/Dead Tide|data-active="tide"|tideEl|tideNote|\.tide|drawTide|--tide[\w-]*|id="tide"|'tide'|tide\b/g,'')),'The mode picker still loads no game code');
console.log(`PASS: Dead Tide loads only its page, tide.css, tide-boot.js and ${tide.size-1} modules (${shared.length} of them shared with the mansion), none of the ${MANSION_ONLY.length} that build, lay out, light or run the mansion; the mansion loads nothing of Dead Tide.`);

// ---- 2. Its boot script: enter in the click, report failures -----------------------------
{
  const boot=read('tide-boot.js'),load=`import('./tide.mjs?v=${V}')`;assert(boot.includes(load),'The boot script loads this version of tide.mjs');
  const source=boot.replace(load,'loadGame()');
  function fixture(){
    const elements=new Map(),events={},state={starts:0,inClick:false,gestures:[],reloaded:0,href:null};
    function get(id){if(!elements.has(id)){const classes=new Set(id==='error'?['hidden']:[]);elements.set(id,{disabled:false,textContent:'',innerHTML:'',classList:{add(c){classes.add(c)},remove(c){classes.delete(c)},contains(c){return classes.has(c)}},addEventListener(name,fn){this[name]=fn;}});}return elements.get(id);}
    let resolveLoad,rejectLoad;const loaded=new Promise((yes,no)=>{resolveLoad=yes;rejectLoad=no;});
    const window={addEventListener(name,fn){events[name]=fn;}};const location={reload(){state.reloaded++;},set href(v){state.href=v;},get href(){return state.href;}};
    vm.runInNewContext(source,{document:{getElementById:get},window,location,setTimeout(){return 1;},clearTimeout(){},loadGame:()=>loaded});
    return {get,state,window,resolveLoad,rejectLoad,ready(start=()=>{}){window.Blackthorn.ready(()=>{state.starts++;state.gestures.push(state.inClick);start();});},click(){state.inClick=true;try{get('start').click();}finally{state.inClick=false;}}};
  }
  const f=fixture();assert(f.get('start').disabled&&f.get('start').textContent==='PREPARING THE ISLAND…');f.click();assert.equal(f.state.starts,0,'No start before the island is ready');
  f.ready();assert(!f.get('start').disabled);assert.equal(f.get('start').innerHTML,'WADE ASHORE <span>→</span>');assert(f.get('loading').classList.contains('hidden'));
  f.click();assert.deepEqual([f.state.starts,f.state.gestures[0]],[1,true],'Wade Ashore starts the run inside the click, so mouse capture keeps its gesture');f.click();assert.equal(f.state.starts,1,'A second click does nothing');
  f.get('modesLink').click();assert.equal(f.state.href,'modes.html','◂ ALL MODES returns to the mode picker');
  const broken=fixture();broken.rejectLoad(new Error('A module failed'));await Promise.resolve();await Promise.resolve();assert(!broken.get('error').classList.contains('hidden')&&broken.get('errorDetails').textContent==='A module failed');broken.get('retry').click();assert.equal(broken.state.reloaded,1);
  const thrown=fixture();thrown.ready(()=>{throw new Error('Launch failed');});thrown.click();assert.equal(thrown.get('errorDetails').textContent,'Launch failed');
  console.log('PASS: Dead Tide’s boot script waits for the island, starts the run inside the Wade Ashore click (once), returns to the mode picker, and reports load and launch failures with a reload button.');
}

// ---- 3. The island ----------------------------------------------------------------------
const {ISLAND,coastRadius,shoreFraction,groundHeight,buildIsland}=await import('../public/game/island.mjs');
const T=await import('../public/game/three.module.js');
{
  let low=Infinity,high=-Infinity,steepest=0;for(let a=0;a<Math.PI*2;a+=.005){const r=coastRadius(a);low=Math.min(low,r);high=Math.max(high,r);}
  assert(low>48&&high<78,`The coast runs between ${low.toFixed(1)} and ${high.toFixed(1)} m from the centre`);
  const H=ISLAND.hill,summit=groundHeight(H.x,H.z);let top=-Infinity;
  for(let x=-90;x<=90;x+=1.5)for(let z=-90;z<=90;z+=1.5)top=Math.max(top,groundHeight(x,z));
  assert(Math.abs(top-summit)<1e-9&&summit>13,'Radio Hill is the highest ground');
  for(let a=0;a<6.28;a+=.3)for(const d of [1,4,7.9])assert(Math.abs(groundHeight(H.x+Math.cos(a)*d,H.z+Math.sin(a)*d)-summit)<1e-6,'and its top is flat');
  // Every bearing has a beach: the ground crosses the waterline on a slope, never flat
  // (where the sea would flicker against the sand).
  for(let a=0;a<Math.PI*2;a+=.05){
    let r=30;while(groundHeight(Math.cos(a)*r,Math.sin(a)*r)>0)r+=.05;
    const slope=(groundHeight(Math.cos(a)*(r-.5),Math.sin(a)*(r-.5))-groundHeight(Math.cos(a)*(r+.5),Math.sin(a)*(r+.5)));
    assert(slope>.05&&slope<.25,`The beach meets the sea on a gentle slope at bearing ${a.toFixed(2)}`);
  }
  for(let x=-90;x<=90;x+=.5)for(let z=-90;z<=90;z+=.5){if(groundHeight(x,z)<-ISLAND.wade)continue;
    const g=Math.hypot(groundHeight(x+.25,z)-groundHeight(x-.25,z),groundHeight(x,z+.25)-groundHeight(x,z-.25))/.5;steepest=Math.max(steepest,g);}
  assert(steepest<.85,`Everywhere you can stand is walkable (steepest ${(Math.atan(steepest)*180/Math.PI).toFixed(0)}°)`);
}
const scene=new T.Scene(),world=new T.Group();scene.add(world);const I=buildIsland({scene,world});
{
  const S=ISLAND.tent,W=ISLAND.tower,H=ISLAND.hill,flat=(x,z)=>Math.hypot(x-H.x,z-H.z)<H.flat;
  for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1]]){assert(flat(S.x+dx*(S.w/2+.15),S.z+dz*(S.d/2+.15)),'The radio tent stands on the flat summit');assert(flat(W.x+dx*W.base/2,W.z+dz*W.base/2),'and so does the tower');}
  // (v212: twice the size, aground in the shallows along her cove's shore, her landward side at the waterline.)
  const t=shoreFraction(I.wreckAt.x,I.wreckAt.z),h=groundHeight(I.wreckAt.x,I.wreckAt.z);assert(t>.98&&t<1.12&&h>-.8&&h<0,'The wreck lies aground in the shallows, at the water’s edge');
  {const along=I.wreckAt.heading-(ISLAND.wreck.bearing+Math.PI/2),off=Math.abs(Math.atan2(Math.sin(along),Math.cos(along)));assert(Math.min(off,Math.PI-off)<.35,'along the shore, not out from it');
   const hull=I.colliders.find(c=>c.kind==='wreck');assert(hull.w>24&&hull.d>8,'twice her old size');}
  const sp=ISLAND.spawn,spawnY=groundHeight(sp.x,sp.z);assert(spawnY>.3&&!I.isBlocked(sp.x,sp.z,.32,I.colliders,null,spawnY,1.8)&&I.zoneAt(sp.x,sp.z)==='SOUTH BEACH','Runs start on dry sand on the south beach, in the open');
  for(const p of I.palms){assert(groundHeight(p.x,p.z)>.3,'Palms grow on land');assert(Math.hypot(p.x-sp.x,p.z-sp.z)>3,'clear of the landing spot');}
  for(const r of I.rocks)assert(r.reef?groundHeight(r.x,r.z)<-ISLAND.wade-.4:groundHeight(r.x,r.z)>.5,'Rocks sit on land, or as reefs in water too deep to reach');
  assert(I.palms.length>=40&&I.rocks.length>=20,'The island has its palms and rocks');
  const names=new Set(world.children.map(o=>o.name));
  for(const n of ['Island ground','The sea','Landmarks','Radio tower','Tower beacon','Wreck','Palm trunks','Palm crowns','Rocks','Brush'])assert(names.has(n),`The island has ${n.toLowerCase()}`);
  let meshes=0,triangles=0;world.traverse(o=>{if(o.isMesh){meshes++;const g=o.geometry;triangles+=(g.index?g.index.count:g.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}});
  // v215 (the art pass, spec 10.4): textured, with ferns and grass, on a desktop-first budget.
  assert(meshes<90&&triangles<160000,`The island stays within its art budget: ${meshes} meshes, ${Math.round(triangles/1000)}k triangles`);
  // The beacon blinks: on for 0.55 s of every 1.6 s.
  I.update(.1);assert(I.beaconLight.intensity>0);I.update(.9);assert.equal(I.beaconLight.intensity,0);I.update(1.7);assert(I.beaconLight.intensity>0,'The tower’s red beacon blinks');
  console.log(`PASS: the island: a coast 50–75 m out, Radio Hill highest and flat-topped with the radio tent and tower on it, a sloping beach on every bearing, walkable everywhere you can stand, the wreck at the water’s edge, ${I.palms.length} palms and ${I.rocks.length} rocks on land, the south-beach landing spot clear, ${meshes} meshes and ${Math.round(triangles/1000)}k triangles, and a blinking beacon.`);
}

// ---- 3b. The finished map (v210): landmarks, pads, trails, routes and the spawn network -------
{
  const {islandSites,shoreSpawns,SHORE,trailDistance,moundAt}=await import('../public/game/island.mjs'),{SPAWN_RULES}=await import('../public/game/tide-threat.mjs'),{enemyBody}=await import('../public/game/crowd.mjs');
  const {sites,landmarks,stations,trails}=islandSites(),H=ISLAND.hill,brute=enemyBody({brute:true}),BR=Math.max(.44,brute.radius);
  const bearingOf=(x,z)=>Math.atan2(z,x),near=(a,b,tol)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)))<tol;
  const open=(x,z,r=.44,h=1.8)=>groundHeight(x,z)>=-ISLAND.wade&&!I.isBlocked(x,z,r,I.colliders,null,I.supportBelow(x,z,groundHeight(x,z),ISLAND.step),h);
  // a. The spec's landmarks, each in its part of the island (north is -z; a bearing of 0 is east).
  const where={'BUNKER B-01':-Math.PI/4,'JUNGLE RUIN':-Math.PI*3/4,'SHIPWRECK COVE':Math.PI,'COASTAL CAMP':Math.PI*3/4,'SOUTH DOCK':Math.PI/2,'EAST COVE':Math.PI/4,'NORTH BEACH':-Math.PI/2};
  for(const [name,bearing] of Object.entries(where)){const l=landmarks.find(l=>l.name===name);assert(l,`${name} is on the map`);assert(near(bearingOf(l.x,l.z),bearing,.5),`${name} is in its part of the island`);assert.equal(I.zoneAt(l.x,l.z),groundHeight(l.x,l.z)<0?'THE SHALLOWS':name,`and the HUD names it`);}
  {const f=landmarks.find(l=>l.name==='SOUL FORGE');assert(f&&f.x>H.x+20&&Math.abs(f.z-H.z)<12&&Math.hypot(f.x-H.x,f.z-H.z)<H.foot+2,'The Soul Forge’s clearing is east of Radio Hill, by its foot');}
  for(const name of ['SHIPWRECK COVE','SOUTH DOCK','NORTH BEACH'])assert(shoreFraction(...(l=>[l.x,l.z])(landmarks.find(l=>l.name===name)))>.8,`${name} is on the shore`);
  for(const name of ['BUNKER B-01','JUNGLE RUIN','SOUL FORGE'])assert(shoreFraction(...(l=>[l.x,l.z])(landmarks.find(l=>l.name===name)))<.78,`${name} is inland`);
  assert(near(bearingOf(I.wreckAt.x,I.wreckAt.z),Math.PI,.15),'The wreck lies on the west shore, in her cove');
  // The coves are real: the coast is drawn in at each.
  for(const [b,depth] of ISLAND.coast.coves)assert(coastRadius(b)<Math.min(coastRadius(b-.45),coastRadius(b+.45))-depth*.4,'A cove bites into the coast');
  // The high ground: Radio Hill highest, then the ridge, the knoll, the bluff and the headland, each a real rise.
  const rises=Object.fromEntries(['BUNKER RIDGE','RUIN KNOLL','CAMP BLUFF','COVE HEAD'].map(n=>{const m=moundAt(n);return [n,groundHeight(m.x,m.z)];}));
  for(const [n,h] of Object.entries(rises))assert(h>4&&h<I.summit-4,`${n} is a hill of its own (${h.toFixed(1)} m), under Radio Hill`);
  // The wash is a ravine: across it, the ground falls to a floor and climbs again on both sides
  // (v211: at least 1.7 m, between the camp's bluff and the wash's bank).
  const washDepth=(()=>{const w=moundAt('THE WASH'),px=-Math.sin(w.angle),pz=Math.cos(w.angle),at=k=>groundHeight(w.x+px*k,w.z+pz*k);let floor=Infinity,fk=0;for(let k=-8;k<=8;k+=.5)if(at(k)<floor){floor=at(k);fk=k;}
    let left=-Infinity,right=-Infinity;for(let k=fk;k>=fk-14;k-=.5)left=Math.max(left,at(k));for(let k=fk;k<=fk+14;k+=.5)right=Math.max(right,at(k));return Math.min(left,right)-floor;})();
  assert(washDepth>1.7,`The wash is a ravine, ${washDepth.toFixed(1)} m deep`);
  // v211: bolder ground. The ridge, knoll, bluff and headland stand 5 m or more above the sea,
  // and the wash is at least 1.7 m below its banks; nothing anyone walks on is steeper than 42°.
  for(const n of ['BUNKER RIDGE','RUIN KNOLL','CAMP BLUFF','COVE HEAD'])assert(rises[n]>5,`${n} stands over 5 m (${rises[n].toFixed(1)})`);
  for(const n of ['NORTH CRAG','EAST DOWNS'])assert(groundHeight(moundAt(n).x,moundAt(n).z)>3.8,`${n} is a hill of its own`);
  {let steep=0;for(let x=-90;x<=90;x+=.5)for(let z=-90;z<=90;z+=.5){if(groundHeight(x,z)<-ISLAND.wade)continue;steep=Math.max(steep,Math.hypot(groundHeight(x+.25,z)-groundHeight(x-.25,z),groundHeight(x,z+.25)-groundHeight(x,z-.25))/.5);}
   assert(steep<Math.tan(42*Math.PI/180),`No walkable ground steeper than 42° (${(Math.atan(steep)*180/Math.PI).toFixed(1)}°)`);}
  // v211: B-01 comes out of its ridge: its door faces the north-east reef, away from Radio Hill,
  // with the ridge rising behind it over its roof.
  {const b=sites.bunker,fx=Math.sin(b.angle),fz=Math.cos(b.angle),out=Math.atan2(fz,fx);
   assert(near(out,-Math.PI/4,.3),'B-01’s door looks out to the north-east');
   assert(fx*(H.x-b.x)+fz*(H.z-b.z)<0,'away from Radio Hill');
   const ground=groundHeight(b.x+fx*1.6,b.z+fz*1.6);assert(groundHeight(b.x-fx*6,b.z-fz*6)>ground+4,'and the ridge behind it stands over its roof (it comes out of the hill)');}
  // b. The pads: one for every weapon and the Forge, each on open, near-level ground at its landmark.
  // v212: thirteen pads: every weapon, the Forge, the armour and the four perks.
  // (v212, revised: no ammunition pads; the island's one ammunition station stands in the radio tent.)
  assert.deepEqual(stations.map(p=>p.id).sort(),['armor','bushmaster','eye','forge','glock','iron','katana','lmg','quick','rifle','shotgun','smg','stride'],'Thirteen pads');
  {const kinds={};for(const p of stations)kinds[p.kind]=(kinds[p.kind]||0)+1;assert.deepEqual(kinds,{weapon:7,forge:1,armor:1,perk:4});
   const perkPlaces=stations.filter(p=>p.kind==='perk').map(p=>p.landmark),armour=stations.find(p=>p.kind==='armor');
   assert.equal(new Set(perkPlaces).size,4,'Each perk at a landmark of its own');
   const quarter=p=>Math.floor((Math.atan2(p.z-H.z,p.x-H.x)+Math.PI)/(Math.PI/2))%4;assert.equal(new Set(stations.filter(p=>p.kind==='perk').map(quarter)).size,4,'one in each quarter of the island round Radio Hill');
   assert(!perkPlaces.includes(armour.landmark),'The armour stands apart from the perks');
   {const A=sites.ammo,T=ISLAND.tent;assert(Math.abs(A.x-T.x)<T.w/2-.3&&Math.abs(A.z-T.z)<T.d/2-.3,'The ammunition station stands in the radio tent');}
   // A pad of its own: facing Radio Hill's summit. (v212, revised: the rest stand with their backs to a
   // wall, crates or the outhouse: open in front, blocked right behind.)
   for(const p of stations){const fx=Math.sin(p.angle),fz=Math.cos(p.angle),depth=p.kind==='weapon'?.9:.8;
     if(p.slab)assert(Math.abs(Math.atan2(Math.sin(p.angle-Math.atan2(H.x-p.x,H.z-p.z)),Math.cos(p.angle-Math.atan2(H.x-p.x,H.z-p.z))))<1e-3,`The ${p.id} pad faces Radio Hill’s summit`);
     else{const y=p.y??groundHeight(p.x,p.z);assert(I.isBlocked(p.x-fx*(depth/2+.12),p.z-fz*(depth/2+.12),.06,I.colliders,null,y,1.8),`The ${p.id} station has its back to something`);
       assert(open(p.x+fx*(depth/2+.9),p.z+fz*(depth/2+.9),.44,1.8),`and open ground in front of it`);}}}
  const spec={bushmaster:'LOOKOUT COMPOUND',katana:'LOOKOUT COMPOUND',smg:'JUNGLE RUIN',shotgun:'SHIPWRECK COVE',rifle:'COASTAL CAMP',lmg:'SOUTH DOCK',glock:'EAST COVE',forge:'SOUL FORGE'};
  for(const p of stations){
    if(spec[p.id])assert.equal(p.landmark,spec[p.id],`The ${p.id} pad is at ${spec[p.id]} (spec 4.1)`);
    const zone=I.zoneAt(p.x,p.z);assert(p.landmark==='LOOKOUT COMPOUND'?zone.includes('SUMMIT'):zone===p.landmark,`and stands inside it (${zone})`);
    const g=Math.hypot(groundHeight(p.x+1,p.z)-groundHeight(p.x-1,p.z),groundHeight(p.x,p.z+1)-groundHeight(p.x,p.z-1))/2;assert(p.y!==null||g<.22,`on near-level ground (${g.toFixed(2)})`);
    // In the open, reachable from several sides: a brute can walk 5 m straight out in at least five of
    // eight directions (from a station against something, a walker in two, from in front of it; the
    // boathouse's Warden only once its door is open).
    const fx=Math.sin(p.angle),fz=Math.cos(p.angle),[x,z]=p.slab?[p.x,p.z]:[p.x+fx*1.4,p.z+fz*1.4],[r,h,need]=p.slab?[BR,brute.height,5]:[.44,1.8,2];
    if(p.id==='lmg')I.boathouse.setOpen(true);
    assert(open(x,z,r,h),`The ${p.id} pad is in the open`);
    let ways=0;for(let k=0;k<8;k++){const a=k*Math.PI/4;let ok=true;for(let d=.5;d<=(p.id==='lmg'?1.5:5)&&ok;d+=.5)ok=open(x+Math.cos(a)*d,z+Math.sin(a)*d,r,h);if(ok)ways++;}
    I.boathouse.setOpen(false);
    assert(ways>=need,`The ${p.id} pad can be reached and left on at least ${need} sides (${ways})`);
  }
  // No two pads crowd each other, but for the pairs that stand side by side (the Glock and Deadeye in
  // East Cove's shelter, the M4 and Ironheart either side of the camp's outhouse).
  {const pair=new Set(['glock|eye','eye|glock','rifle|iron','iron|rifle']);for(const a of stations)for(const b of stations)if(a!==b)assert(pair.has(a.id+'|'+b.id)?Math.hypot(a.x-b.x,a.z-b.z)<4:Math.hypot(a.x-b.x,a.z-b.z)>5,`The ${a.id} and ${b.id} pads`);}
  // c. Nothing that blocks can be climbed onto, and nothing you can stand on is above a step:
  // a perch the dead could not reach would be a safe spot (spec 9.2).
  let props=0;
  for(const c of I.colliders){if(c.kind==='palm'||c.kind==='rock')continue;props++;
    let ground=-Infinity;const ring=(c.r??Math.hypot(c.w,c.d)/2)+.4;for(let a=0;a<6.3;a+=.2)for(const f of [.4,.7,1]){const x=c.x+Math.cos(a)*ring*f,z=c.z+Math.sin(a)*ring*f;if(groundHeight(x,z)>=-ISLAND.wade)ground=Math.max(ground,groundHeight(x,z));}
    if(ground>-Infinity)assert(c.top>=ground+1,`A ${c.kind} collider at ${c.x.toFixed(1)}, ${c.z.toFixed(1)} is too tall to jump onto (${(c.top-ground).toFixed(2)} m above the ground round it)`);}
  for(const pf of I.platforms){if(pf.r!==undefined)continue;let low=Infinity;for(const [dx,dz] of [[-1,-1],[1,-1],[-1,1],[1,1],[0,0]]){const lx=dx*pf.w/2,lz=dz*pf.d/2;low=Math.min(low,groundHeight(pf.x+lx*pf.cos+lz*pf.sin,pf.z-lx*pf.sin+lz*pf.cos));}
    assert(pf.top-low<=.45,`A slab you can stand on is a step, not a perch (${(pf.top-low).toFixed(2)} m)`);}
  assert(I.colliders.every(c=>c.kind!=='tent'||c.r!==undefined||c.w<3),'The radio tent has no walls: poles and a desk');
  // The grid that finds nearby colliders and platforms answers exactly as checking every one does.
  {const touches=(c,x,z,r,y,h)=>{if(y+.06>=c.top||y+h<=c.bottom)return false;if(c.r!==undefined)return (x-c.x)**2+(z-c.z)**2<(r+c.r)**2;const dx=x-c.x,dz=z-c.z,lx=dx*c.cos-dz*c.sin,lz=dx*c.sin+dz*c.cos,nx=Math.max(-c.w/2,Math.min(lx,c.w/2)),nz=Math.max(-c.d/2,Math.min(lz,c.d/2));return (nx-lx)**2+(nz-lz)**2<r*r;};
   const inP=(p,x,z)=>{if(p.r!==undefined)return (x-p.x)**2+(z-p.z)**2<p.r*p.r;const dx=x-p.x,dz=z-p.z,lx=dx*p.cos-dz*p.sin,lz=dx*p.sin+dz*p.cos;return Math.abs(lx)<=p.w/2&&Math.abs(lz)<=p.d/2;};
   let seed=7,blocked=0,raised=0;const rnd=()=>(seed=(seed*1664525+1013904223)>>>0)/4294967296;
   for(let i=0;i<60000;i++){const near=i%3?I.colliders[Math.floor(rnd()*I.colliders.length)]:null,x=near?near.x+(rnd()-.5)*6:(rnd()-.5)*200,z=near?near.z+(rnd()-.5)*6:(rnd()-.5)*200,r=[.1,.32,.44,BR,1.5,2.5][i%6],y=groundHeight(x,z)+(i%5?0:rnd()*3);
     const every=I.colliders.some(c=>touches(c,x,z,r,y,1.8));assert.equal(I.isBlocked(x,z,r,I.colliders,null,y,1.8),every,'Blocked, by the grid as by every collider');if(every)blocked++;
     let h=groundHeight(x,z);for(const p of I.platforms)if(p.top>h&&p.top<=y+.31+1e-6&&inP(p,x,z))h=p.top;assert.equal(I.supportBelow(x,z,y,.31),h,'Held up, by the grid as by every platform');if(h>groundHeight(x,z))raised++;}
   assert(blocked>5000&&raised>50,`(${blocked} blocked and ${raised} raised points among them)`);}
  // d. Routes: every place anyone can stand has a way to everywhere else, for walkers and for
  // brutes (no pockets, no cut-off corners), and a brute fits under the tent.
  const nets={};
  // (v212: with the boathouse open, as it is from threat level 10; shut, its inside is closed off.)
  I.boathouse.setOpen(true);
  for(const [who,radius,height] of [['walker',.44,1.8],['brute',BR,brute.height]]){
    const R=I.buildRoutes({radius,height});R.rebuild(H.x,H.z+1);let openCells=0,cut=0;
    // (Not counted: a stray cell at the very edge of the wading depth, against the dock, and the
    // tops of small rocks, which you climb onto and the dead walk round.)
    const onRock=(x,z)=>I.platforms.some(p=>p.r!==undefined&&(x-p.x)**2+(z-p.z)**2<p.r*p.r);
    for(let i=0;i<R.blocked.length;i++){if(R.blocked[i])continue;openCells++;const x=(i%R.w)*R.cell-84,z=Math.floor(i/R.w)*R.cell-84;if(R.distance[i]>=99999&&groundHeight(x,z)>-.6&&!onRock(x,z))cut++;}
    assert.equal(cut,0,`Every open cell has a route to the summit for a ${who} (${cut} of ${openCells} cut off)`);nets[who]=R;
  }
  assert(nets.brute.direction(ISLAND.tent.x+1.7,ISLAND.tent.z,0)?.reachable&&!nets.brute.blocked[nets.brute.index(ISLAND.tent.x+1.7,ISLAND.tent.z)],'A brute walks under the radio tent');
  // The boathouse: the Warden's pad is reachable with the door open; shut, it is not, and opening it
  // again opens the way (the routes work its doorway out again).
  {const lmg=stations.find(p=>p.id==='lmg'),[x,z]=[lmg.x+Math.sin(lmg.angle)*1.2,lmg.z+Math.cos(lmg.angle)*1.2],R=nets.walker;R.rebuild(H.x,H.z+1);
   assert(R.direction(x,z,0)?.reachable,'With its door open, the dead can walk into the boathouse');
   I.boathouse.setOpen(false);R.refresh(I.boathouse.x,I.boathouse.z,3);R.rebuild(H.x,H.z+1);assert(!R.direction(x,z,0)?.reachable,'shut, no one can');
   assert(I.isBlocked(I.boathouse.x,I.boathouse.z,.3,I.colliders,null,I.supportBelow(I.boathouse.x,I.boathouse.z,groundHeight(I.boathouse.x,I.boathouse.z),ISLAND.step),1.8),'and its doorway blocks');
   I.boathouse.setOpen(true);R.refresh(I.boathouse.x,I.boathouse.z,3);R.rebuild(H.x,H.z+1);assert(R.direction(x,z,0)?.reachable,'opened again, the way in is open again');I.boathouse.setOpen(false);}
  // e. The perimeter loop: all the way round, a brute has a band of open beach at least 6 m wide.
  let narrowest=Infinity,narrowAt=0;
  for(let a=-Math.PI;a<Math.PI;a+=.02){const R=coastRadius(a);let run=0,best=0;for(let r=R*.66;r<=R*1.05;r+=.5){if(open(Math.cos(a)*r,Math.sin(a)*r,BR,brute.height)){run+=.5;best=Math.max(best,run);}else run=0;}
    if(best<narrowest){narrowest=best;narrowAt=a;}}
  assert(narrowest>=6,`The beach is open all the way round (narrowest ${narrowest.toFixed(1)} m at bearing ${narrowAt.toFixed(2)})`);
  // f. Radio Hill: open from every side (spec 2.2 C asks for six broad approaches).
  let approaches=0;for(let k=0;k<12;k++){const a=k*Math.PI/6;let lanes=0;for(const off of [-3,0,3]){let ok=true;for(let d=H.flat+.5;d<=28&&ok;d+=.5){const x=H.x+Math.cos(a)*d-Math.sin(a)*off,z=H.z+Math.sin(a)*d+Math.cos(a)*off;ok=open(x,z,BR,brute.height);}if(ok)lanes++;}if(lanes>=2)approaches++;}
  assert(approaches>=8,`At least eight of twelve bearings give a broad, straight, clear climb to the summit (${approaches}); the spec asks for six`);
  // g. The trails: nine of them, each clear to walk for a brute along its whole length, and joined up.
  assert.equal(trails.length,9);let trailLength=0;
  for(const t of trails)for(let k=1;k<t.points.length;k++){const [ax,az]=t.points[k-1],[bx,bz]=t.points[k],n=Math.ceil(Math.hypot(bx-ax,bz-az)/.5);trailLength+=Math.hypot(bx-ax,bz-az);
    for(let j=0;j<=n;j++){const x=ax+(bx-ax)*j/n,z=az+(bz-az)*j/n;assert(groundHeight(x,z)>.3&&open(x,z,BR,brute.height),`${t.name} is clear at ${x.toFixed(1)}, ${z.toFixed(1)}`);}}
  for(const p of I.palms)assert(trailDistance(p.x,p.z)>2.5,'No palm stands on a trail');
  // h. The spawn network on this map (spec 5.2): 8 + 14 + 6 = 28 locations.
  const net=shoreSpawns(),bunker=I.colliders.filter(c=>c.kind==='bunker');
  assert.deepEqual(net.major.map(z=>z.name),['NORTH BEACH','NORTH-EAST REEF','EAST SHORE','SOUTH-EAST COVE','SOUTH DOCK SHORE','SOUTH-WEST BEACH','SHIPWRECK COVE','NORTH-WEST REEF'],'The eight major zones, by the spec’s names');
  assert(net.minor.length===14&&net.interior.length===6&&net.major.every(z=>z.points.length===5)&&net.interior.every(z=>z.points.length===3),'14 minor points and 6 interior zones of three');
  assert.equal(new Set([...net.major,...net.minor,...net.interior].map(z=>z.name)).size,28,'28 locations, each with its own name');
  const walkers=nets.walker;let points=0;
  for(const z of [...net.major,...net.minor,...net.interior])for(const [x,zz] of z.points){points++;const g=groundHeight(x,zz);
    if(z.kind==='interior')assert(g>.6&&shoreFraction(x,zz)<.8,`${z.name} is on dry land, inland`);else assert(g<-.2&&g>=-ISLAND.wade,`${z.name} is in the shallows (${g.toFixed(2)} m)`);
    assert(open(x,zz,.48),`${z.name} (${x}, ${zz}) is clear of everything`);assert(walkers.direction(x,zz,0)?.reachable,'with a route inland');
    for(const p of stations)assert(Math.hypot(p.x-x,p.z-zz)>=SPAWN_RULES.stationClear,`${z.name} is ${SPAWN_RULES.stationClear} m or more from the ${p.id} pad`);
    for(const c of bunker)assert(Math.hypot(c.x-x,c.z-zz)>6,'and nowhere near the bunker');}
  // (v212: the wreck's, on both sides of her, spans her length too.)
  for(const z of net.major){const xs=z.points.map(p=>p[0]),zs=z.points.map(p=>p[1]),span=Math.hypot(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs));assert(span>6&&span<(z.name==='SHIPWRECK COVE'?48:32),`${z.name} is a stretch of shore, not one spot (${span.toFixed(0)} m)`);}
  {const d=sites.dock,w=sites.wreck,dockZone=net.major[4],wreckZone=net.major[6];assert(near(dockZone.bearing,d.bearing,.2)&&near(wreckZone.bearing,ISLAND.wreck.bearing,.01),'The dock’s and the wreck’s zones are theirs');
   assert(wreckZone.points.some(p=>p[1]<w.z-3)&&wreckZone.points.some(p=>p[1]>w.z+3),'The dead rise on both sides of the wreck');}
  // The spec's six interior places, in its order: NW ruin, north below the hill, NE by the bunker,
  // east beyond the Forge, south by the hill's foot, SW between the camp and the hill.
  {const [ruin,north,ne,east,south,sw]=net.interior.map(z=>z.points[0]),forge=landmarks.find(l=>l.name==='SOUL FORGE'),camp=sites.camp;
   assert(Math.hypot(ruin[0]-sites.ruin.x,ruin[1]-sites.ruin.z)<18&&north[1]<H.z-28&&Math.abs(north[0]-H.x)<12&&Math.hypot(ne[0]-sites.bunker.x,ne[1]-sites.bunker.z)<18
     &&east[0]>forge.x+8&&Math.abs(east[1]-forge.z)<10&&south[1]>H.z+28&&Math.abs(south[0]-H.x)<12&&sw[0]<H.x&&sw[0]>camp.x&&sw[1]>H.z&&sw[1]<camp.z,'The six interior zones are where the spec puts them');}
  console.log(`PASS: the finished map (v210): the spec's landmarks each in their part of the island (the bunker north-east, the ruin north-west, the wreck in her cove on the west, the camp south-west, the dock south, East Cove south-east, the Forge east of the hill, North Beach), two coves bitten out of the coast, four hills of their own under Radio Hill (${Object.entries(rises).map(([n,h])=>`${n.toLowerCase()} ${h.toFixed(1)} m`).join(', ')}) and a gully; eight pads on open near-level ground, each reachable on five sides or more; ${props} prop colliders none of which can be climbed, every slab a step; every open cell routed to the summit for walkers and brutes; the beach at least ${narrowest.toFixed(1)} m wide all the way round for a brute; ${approaches} of 12 bearings a broad clear climb; nine trails (${Math.round(trailLength)} m) clear along their length; and ${points} spawn points in 28 named locations, all clear, routed, ${SPAWN_RULES.stationClear} m or more from every pad.`);
}

// ---- 4. Playing Dead Tide ---------------------------------------------------------------
// The harness (tests/tide-harness.mjs, v206) loads tide.mjs on the three.js stand-in.
const {qa,frames,$,listeners,windowEvents,canvas,document,random,entry,storage}=await import('./tide-harness.mjs'),enter=entry();
const G=()=>qa.get(),key=e=>listeners.keydown({preventDefault(){},...e});
try{
  // Loading: the island is built, its shaders compiled, and the title screen waits.
  assert(typeof enter==='function'&&$('loading').classList.contains('hidden')&&!$('menu').classList.contains('hidden')&&G().mode==='menu','The island loads to its title screen');
  assert(G().renderer.compileCalls?.length===2,'Every shader is compiled under the loading screen (world and weapon)');
  // (v212: and the stations, in a group of their own: one group each, named for what it sells.)
  const stationNames=new Set(G().stations.filter(s=>s.padId!=='ammo-tent').map(s=>s.name)),top=new Set(G().world.children.map(o=>o.name));
  {const root=G().world.getObjectByName('Stations');assert.equal(root.children.filter(o=>o.isGroup&&stationNames.has(o.name)).length,G().island.stations.length,'one group for each station on a pad');}
  assert.deepEqual([...top].sort(),['Blood particles','Boathouse door','Brush','Ferns','Grass','Bullet impact marks','Explosion effects','Island ground','Landmarks','Palm crowns','Palm trunks','Radio tower','Rocks','Stations','The sea','Tower beacon','Wreck'].sort(),'The world holds the island and the shared effects, nothing else');
  // v207: the dead are not built while loading. Behind the title screen they build a body a
  // frame, then their shaders compile in a scene of their own, lit by the island's, never drawn.
  assert(G().deadBuilt===false&&G().deadReady===false,'The dead are not built while loading');
  frames(3);assert(G().deadBuilt===false,'They build a body a frame behind the title screen');
  frames(20);assert(G().deadBuilt===true,'and are built within 23 title frames, Play untouched');
  frames(2);assert(G().bruteRoutesReady===true,'v209: then the brutes’ wider routes, still behind the title (so the first brute to come ashore stalls nothing)');for(let i=0;i<6;i++)await Promise.resolve();
  {const [warm,target]=G().renderer.compileScenes.at(-1);
   assert(G().deadReady===true&&G().renderer.compileCalls.length===3&&target===G().scene&&warm!==G().scene&&warm.children.length===0,'then their shaders compile once, in a scene of their own lit by the island’s, emptied after');
   assert.deepEqual([...new Set(G().world.children.map(o=>o.name))].sort(),[...top].sort(),'and nothing of them ever enters the world');}
  // The shore sends no one until the dead are ready.
  {const {createThreatDirector}=await import('../public/game/tide-dead.mjs');let made=0,ready=false;
   const d=createThreatDirector({spawner:{placement:()=>({valid:()=>true}),choosePoint:o=>o[0],spawnKind:()=>(made++,{group:{position:{y:0}}})},zombies:[],player:{x:0,z:0},look:()=>Math.PI,noise(){},ready:()=>ready});
   for(let i=0;i<600;i++)d.update(1/60);assert.equal(made,0,'The shore waits while the dead are not ready');ready=true;for(let i=0;i<60;i++)d.update(1/60);assert(made>0,'and sends them once they are');}
  frames(30);const orbit=G().camera.position.clone();frames(30);assert(orbit.distanceTo(G().camera.position)>.05&&!G().gunRoot.visible,'The title screen circles the island with no gun in view');
  // Enter: capture in the click, then play from the south beach.
  // v206: the island's own checks run with the shore held (no dead); the dead are tested below.
  const holdShore=()=>{G().shore.target=0;};
  enter();await Promise.resolve();holdShore();assert.equal(G().mode,'playing');assert(G().pointer&&$('menu').classList.contains('hidden')&&!$('hud').classList.contains('hidden'));
  const sp=ISLAND.spawn;assert(Math.abs(G().player.x-sp.x)<1e-9&&Math.abs(G().player.z-sp.z)<1e-9&&Math.abs(G().player.y-groundHeight(sp.x,sp.z))<1e-9,'The run starts on the south beach');
  frames(2);assert($('location').textContent.includes('SOUTH BEACH')&&$('ammo').textContent==='13'&&$('reserve').textContent==='78'&&$('points').textContent==='500'&&$('health').textContent==='100','The HUD shows the beach, a full pistol, 500 essence and full health');
  // Walking north up the beach, the feet follow the ground.
  qa.setAim(0,0);qa.setKeys(['KeyW']);frames(60);qa.setKeys([]);frames(1);
  let p=G().player;assert(sp.z-p.z>3.3&&sp.z-p.z<3.8,`Walking covers about 3.6 m a second (${(sp.z-p.z).toFixed(2)} m)`);assert(Math.abs(p.y-groundHeight(p.x,p.z))<.02,'with the feet on the ground');
  const camY=G().camera.position.y;assert(Math.abs(camY-(p.y+1.68))<.03,'and the eye 1.68 m above them');
  qa.setKeys(['KeyW','ShiftLeft']);const z0=G().player.z;frames(60);qa.setKeys([]);assert(z0-G().player.z>5,'Sprinting is faster');
  // Jumping: up, and back down onto the sand.
  key({code:'Space'});frames(1);assert(!G().run.grounded&&G().player.y>groundHeight(G().player.x,G().player.z),'Space jumps');
  let peak=0;for(let i=0;i<60;i++){frames(1);peak=Math.max(peak,G().player.y-groundHeight(G().player.x,G().player.z));}listeners.keyup({code:'Space'});
  assert(G().run.grounded&&peak>.6&&peak<.9,`and lands again (${peak.toFixed(2)} m up)`);
  // Climbing Radio Hill from the beach on foot.
  // (Boulders lie on its flanks; take a line between them, as a player would.)
  const H=ISLAND.hill,clearLine=b=>{for(let d=8;d<=34;d+=.25){const x=H.x+Math.cos(b)*d,z=H.z+Math.sin(b)*d;if(I.isBlocked(x,z,.45,I.colliders,null,groundHeight(x,z),1.8))return false;}return true;};
  let bearing=Math.PI/2;while(!clearLine(bearing))bearing+=.05;
  qa.setPlayer(H.x+Math.cos(bearing)*34,H.z+Math.sin(bearing)*34);qa.setAim(Math.atan2(Math.cos(bearing),Math.sin(bearing)),0);qa.setKeys(['KeyW','ShiftLeft']);let reached=false;for(let i=0;i<60*10&&!reached;i++){frames(1);if(G().zone.includes('SUMMIT'))reached=true;}qa.setKeys([]);
  assert(reached&&G().player.y>14,`Sprinting straight up Radio Hill reaches the summit (stopped at ${G().player.x.toFixed(1)},${G().player.z.toFixed(1)} ${G().player.y.toFixed(1)} m, ${G().zone})`);
  // The radio tent (v210): open on every side. You walk in under the canopy from the south, a
  // jump clears its eaves, the desk stops you, and you walk straight out the far side.
  const S=ISLAND.tent,summitY=I.summit;
  qa.setPlayer(S.x+1.2,S.z+S.d/2+2.5);qa.setAim(0,0);qa.setKeys(['KeyW']);frames(60);qa.setKeys([]);
  assert(G().zone.includes('RADIO TENT')&&Math.abs(G().player.y-summitY)<.02,'You walk in under the canopy, on the summit’s own ground');
  key({code:'Space'});peak=0;for(let i=0;i<60;i++){frames(1);peak=Math.max(peak,G().player.y);}listeners.keyup({code:'Space'});
  assert(peak>summitY+.6&&peak+1.8<=summitY+S.eave,'A jump inside clears the eaves');
  qa.setKeys(['KeyW']);frames(200);qa.setKeys([]);assert(G().player.z<S.z-S.d/2-1&&!G().zone.includes('TENT'),'and you walk straight out the far side: it has no walls');
  qa.setPlayer(S.x-.9,S.z+1.5);qa.setAim(0,0);qa.setKeys(['KeyW']);frames(120);qa.setKeys([]);assert(G().player.z>S.z-1.2+.4,'The radio desk stops you');
  // v211: the ammo crate under the canopy (v212: the standard ammunition station, the island's only
  // one, 350 essence): its prompt, and E restocks every gun you carry and adds a grenade; out of reach, nothing.
  {const A=I.sites.ammo,R=G().run;assert(Math.abs(A.x-S.x)<S.w/2-.3&&Math.abs(A.z-S.z)<S.d/2-.3,'The ammunition station is inside the radio tent');
   assert.equal(G().stations.filter(s=>s.type==='ammo').length,1,'and is the island’s only one');assert(G().world.getObjectByName('Stations').getObjectByName('AMMUNITION'),'the standard model');
   qa.setPlayer(A.x-1.4,A.z);frames(2);assert($('interaction').textContent.includes('AMMUNITION')&&$('interaction').textContent.includes('350 ESSENCE'),'Beside it, its prompt shows, at 350 essence');
   R.inventory.glock.reserve=0;R.inventory.glock.ammo=2;R.grenades=1;const before=R.points=1000;
   key({code:'KeyE'});listeners.keyup({code:'KeyE'});frames(2);
   assert(R.inventory.glock.reserve>=78+11&&R.grenades===2&&R.points===before-350,`E restocks the pistol in full (reserve ${R.inventory.glock.reserve}: 78 and what the magazine lacks), adds a grenade and costs 350`);
   R.points=100;R.inventory.glock.reserve=0;key({code:'KeyE'});listeners.keyup({code:'KeyE'});frames(2);assert(R.inventory.glock.reserve===0&&R.points===100,'Short of 350, nothing is sold');R.points=500;
   assert(G().mode==='playing','with no pause');
   qa.setPlayer(A.x-4,A.z+4);frames(2);R.inventory.glock.reserve=0;key({code:'KeyE'});listeners.keyup({code:'KeyE'});frames(2);
   assert(R.inventory.glock.reserve===0&&!$('interaction').textContent,'Out of reach, no prompt and nothing happens');
   R.inventory.glock.reserve=78;R.inventory.glock.ammo=13;R.grenades=3;}
  // The sea: wade into the shallows, slower as it deepens, and no further.
  const a=Math.PI/2+.4,far=coastRadius(a)*1.4;qa.setPlayer(Math.cos(a)*coastRadius(a)*.9,Math.sin(a)*coastRadius(a)*.9);qa.setAim(Math.atan2(-Math.cos(a),-Math.sin(a)),0);
  qa.setKeys(['KeyW']);frames(60*12);qa.setKeys([]);p=G().player;
  assert(G().zone==='THE SHALLOWS'&&groundHeight(p.x,p.z)<-.5&&groundHeight(p.x,p.z)>=-ISLAND.wade,`You wade out to ${(-groundHeight(p.x,p.z)).toFixed(2)} m of water and no deeper`);
  assert(Math.hypot(p.x,p.z)<far,'The open sea is out of reach');
  // Shooting: the pistol fires, marks the sand and reloads.
  qa.setPlayer(sp.x,sp.z);qa.setAim(0,-.6);frames(2);const marks=G().effects.length;
  {const seeded=Math.random;Math.random=()=>.25;try{qa.shoot();}finally{Math.random=seeded;}}   // a shot marks the ground half the time (v207: chosen, not left to the stream)
  assert.equal(G().run.inventory.glock.ammo,12,'Firing spends a round');assert(G().effects.length>marks,'and leaves a mark on the ground');assert(G().firstPerson.flashTime>0,'with a muzzle flash');
  frames(20);qa.reload();assert(G().run.reloadLeft>0,'R reloads');frames(130);assert.equal(G().run.inventory.glock.ammo,13,'back to a full magazine');assert.equal(G().run.inventory.glock.reserve,77);
  canvas.events.mousedown({button:0,preventDefault(){}});assert.equal(G().run.inventory.glock.ammo,12,'A click fires');listeners.mouseup({button:0});
  canvas.events.mousedown({button:2,preventDefault(){}});frames(40);assert(G().session.aiming&&G().camera.fov<70,'Right mouse aims down the sights');listeners.mouseup({button:2});frames(40);
  // v205: the katana is shared. Owned, key 7 draws it; clicks play its three slashes in turn; it never aims.
  G().run.inventory.katana.owned=true;key({code:'Digit7',repeat:false});assert.equal(G().run.weapon,'katana','Key 7 draws the katana on the island too');
  assert(G().firstPerson.gunGroups.katana.visible&&!G().firstPerson.gunGroups.glock.visible&&$('ammo').textContent==='MELEE','in hand, with the HUD reading MELEE');
  const cuts=[];for(let i=0;i<3;i++){qa.shoot();cuts.push(G().swing.kind);frames(12);assert(G().swing.active&&G().swing.hit,'Each slash lands');frames(30);}
  assert.deepEqual(cuts,[0,1,2],'Its three slashes play in turn');
  canvas.events.mousedown({button:2,preventDefault(){}});frames(20);assert(!G().session.aiming,'A blade does not aim');listeners.mouseup({button:2});
  key({code:'Digit1',repeat:false});assert.equal(G().run.weapon,'glock');frames(5);
  // A grenade: thrown, it lands, bursts and scorches.
  const bursts=G().explosionFx.bursts;key({code:'KeyG'});listeners.keyup({code:'KeyG'});assert.equal(G().run.grenades,2,'G throws a grenade');
  frames(60*4);assert.equal(G().explosionFx.bursts,bursts+1,'It bursts on the island');assert(G().run.health===100,'far enough away to be safe');
  // Too close: a blast hurts, and the tide takes you.
  qa.explode(G().player.clone().add(new T.Vector3(1,.3,0)));assert.equal(G().run.health,75,'A blast within 3 m hurts');frames(10);
  {const R=G().run;R.kills=263;R.totalScore=41250;R.runTime=1234.6;R.perkOwned.add('quick');R.armorTier=2;R.inventory.smg.owned=true;}
  qa.hurtPlayer(500);assert.equal(G().mode,'dead');assert.equal($('pauseTitle').textContent,'The tide takes you.');assert(!$('pause').classList.contains('hidden')&&$('resume').classList.contains('hidden'));
  // v214: the run summary (spec 8.5): kills, time, final threat level and rank, essence earned,
  // headshots and the other combat statistics the game keeps; then the existing New Run and title options.
  {const summary=Object.fromEntries([...$('tideSummary').querySelectorAll('div')].map(d=>[d.querySelector('dt').textContent,d.querySelector('dd').textContent]));
   assert(!$('tideSummary').classList.contains('hidden'),'The death card shows the run’s summary');
   assert.deepEqual(summary,{'Enemies killed':'263','Time survived':'20:34','Threat level':'14','Threat rank':'THE SWARM','Essence earned':'41,250','Headshots':summary.Headshots,'Weapons bought':summary['Weapons bought'],'Perks':'1 of 4','Armour':'Nano Shield rank 1'});
   assert(/^\d+( \(\d+% of hits\))?$/.test(summary.Headshots),`with headshots (${summary.Headshots})`);
   assert(Number(summary['Weapons bought'])>=1,'and the weapons bought (the SMG among them)');
   assert(!$('restart').classList.contains('hidden')&&!$('mainMenuPause').classList.contains('hidden'),'and the existing New Run and title options');
   // The run is kept for Dead Tide's own leaderboard (not the mansion's), saved only if you name it there.
   const queued=JSON.parse(storage.get('blackthorn-dead-tide-queue-v1'));assert.equal(queued.runs.length,1);
   assert.deepEqual({...queued.runs[0].stats,id:undefined,version:undefined},{id:undefined,mode:'dead-tide',kills:263,threatLevel:14,duration:1234,score:41250,headshots:queued.runs[0].stats.headshots,version:undefined});
   assert(!storage.has('blackthorn-leaderboard-queue-v1'),'apart from the mansion’s');
   assert(!$('leaderboardDead').classList.contains('hidden'),'Save Score opens the leaderboard from the summary');
   $('leaderboardDead').dispatchEvent(new document.defaultView.Event('click'));
   assert(!$('leaderboard').classList.contains('hidden')&&$('runSummary').textContent.includes('263 KILLS · THREAT 14 / THE SWARM'),'with the run ready to name');
   key({code:'Escape'});assert($('leaderboard').classList.contains('hidden')&&G().mode==='dead','Esc closes it, back on the summary');}
  $('restart').onclick();await Promise.resolve();holdShore();assert.equal(G().mode,'playing','New Run starts at once after a death');assert.equal(G().run.health,100);assert.equal(G().run.grenades,3);
  // Pausing, settings, the controls card, and back to the title.
  key({code:'Escape'});assert.equal(G().mode,'paused');assert(!$('pause').classList.contains('hidden'));assert($('pauseText').textContent.startsWith('South beach · 0 kills'));
  assert($('tideSummary').classList.contains('hidden')&&$('leaderboardDead').classList.contains('hidden'),'A pause shows no run summary');
  $('settingsPause').onclick();assert(!$('pauseSettings').classList.contains('hidden'));assert.equal($('settingsEyebrow').textContent,'DEAD TIDE / PAUSED');
  key({code:'Escape'});assert($('pauseSettings').classList.contains('hidden'),'Esc closes Settings');
  $('controlsPause').onclick();assert(!$('controlsCard').classList.contains('hidden'));key({code:'Escape'});assert($('controlsCard').classList.contains('hidden'),'Esc closes the controls card');
  $('resume').onclick();assert.equal(G().mode,'playing','Resume locks the mouse and plays on');
  key({code:'Escape'});$('mainMenuPause').onclick();assert(!$('pauseConfirm').classList.contains('hidden'));$('confirmYes').onclick();
  assert.equal(G().mode,'menu');assert(!$('menu').classList.contains('hidden')&&$('hud').classList.contains('hidden')&&!$('start').disabled,'Title Screen asks first, then returns to the title');
  console.log('PASS: playing Dead Tide (v207: the dead built behind its title screen, a body a frame, their shaders compiled off to the side; v205: with the shared katana drawn by key 7 and its three slashes): it loads to a circling title screen with only the island and shared effects in its world and every shader compiled; Wade Ashore captures the mouse and lands you on the south beach with the HUD up; you walk and sprint with your feet on the ground, jump and land, sprint up Radio Hill to the summit, walk in under the radio tent and out the far side (only its desk stops you); its ammo crate sells ammunition, wade into the shallows but not the open sea; the pistol fires, marks the sand, reloads and aims; a grenade bursts, a close blast hurts, and death, New Run, pause, Settings, the controls card, Resume and the title screen all work.');
  // ---- 5. The dead come ashore (v206) ------------------------------------------------------
  const {SHORE_RULES:R}=await import('../public/game/tide-dead.mjs'),TT=await import('../public/game/tide-threat.mjs'),LIVING=TT.targetPopulation(1),STATS=TT.threatStats(1);
  const alive=()=>G().zombies.filter(e=>!e.dead),dist=e=>Math.hypot(e.walkPos.x-G().player.x,e.walkPos.z-G().player.z);
  const aimAt=(point)=>{const eye=G().camera.position,dx=point.x-eye.x,dy=point.y-eye.y,dz=point.z-eye.z;qa.setAim(Math.atan2(-dx,-dz),Math.atan2(dy,Math.hypot(dx,dz)));};
  const still=e=>{e.emergeLeft=0;e.speed=0;e.attack=1e9;return e;};
  enter();await Promise.resolve();assert.equal(G().mode,'playing');qa.setAim(ISLAND.spawn.yaw,0);
  assert(G().shore.target===LIVING&&alive().length===0,'A run starts with no dead and a target of eight');
  frames(Math.floor(R.firstDelay*60)-5);assert.equal(G().zombies.length,0,`None arrive in the first ${R.firstDelay} s`);
  let first=null;for(let i=0;i<120&&!first;i++){frames(1);first=G().zombies[0];}
  assert(first&&first.emergeLeft>0&&first.shoreBorn,'Then the first rises out of the surf');
  {const g=groundHeight(first.walkPos.x,first.walkPos.z);assert(g<0&&g>=-ISLAND.wade,'in the shallows');assert(first.group.position.y<g-.5,'from below the water');assert(dist(first)>R.near,`more than ${R.near} m away`);
   const yaw=G().session.lookYaw,dx=first.walkPos.x-G().player.x,dz=first.walkPos.z-G().player.z,d=Math.hypot(dx,dz),ang=Math.acos((dx*-Math.sin(yaw)+dz*-Math.cos(yaw))/d);
   assert(d>R.sight.range||ang>=R.sight.halfAngle,'and out of sight');}
  frames(Math.ceil(R.emerge.time*60)+2);assert(!(first.emergeLeft>0)&&Math.abs(first.group.position.y-(groundHeight(first.walkPos.x,first.walkPos.z)+first.walkPos.y-.02))<1e-6,'It stands on the ground once risen');
  // A steady eight, never more, all on legal ground and routed to you.
  let most=0;for(let i=0;i<40;i++){frames(30);most=Math.max(most,alive().length);G().run.health=100;}
  assert.equal(most,LIVING,`At threat level 1 the shore keeps ${LIVING} walkers, never more`);
  for(const e of alive()){assert(!e.brute&&!e.dog&&!e.feral&&!e.lurker,'all walkers');assert(groundHeight(e.walkPos.x,e.walkPos.z)>=-ISLAND.wade-1e-6,'on land or in the shallows');
    assert(G().routes.direction(e.walkPos.x,e.walkPos.z,0)?.reachable,'with a route to you');assert(e.hp<=STATS.health&&e.maxHp===STATS.health,'at the mansion’s wave-1 strength');}
  // The cap: however many are asked for, never more than 45 at once.
  G().shore.target=500;assert.equal(G().shore.target,R.cap,'The target can never pass the cap of 45');
  let crowdPeak=0;G().run.health=1e9;for(let i=0;i<260&&crowdPeak<R.cap;i++){frames(30);G().run.health=1e9;crowdPeak=Math.max(crowdPeak,alive().length);}
  frames(600);assert(G().mode==="playing"&&alive().length<=R.cap&&crowdPeak===R.cap,`Pressed, the shore fills to 45 and stops there (${crowdPeak})`);
  for(const e of alive())assert(Number.isFinite(e.walkPos.x+e.walkPos.y+e.walkPos.z+e.group.position.y),'every one in a real place');
  // New Run clears the dead.
  qa.resetRun();await Promise.resolve();assert(G().zombies.length===0&&G().pickups.length===0&&G().shore.target===LIVING,'New Run clears the dead and their drops');
  G().shore.target=0;
  // Shooting downhill: a walker on Radio Hill's flank is hit where it stands, and its kill pays.
  {const b=Math.PI/2+.3,fx=H=>[ISLAND.hill.x+Math.cos(b)*H,ISLAND.hill.z+Math.sin(b)*H];const [px,pz]=fx(16),[ex,ez]=fx(23);qa.setPlayer(px,pz);frames(1);
   const e=still(G().spawnKind('walker',ex,ez,0));frames(2);assert(groundHeight(px,pz)-groundHeight(ex,ez)>2,'(standing well above it)');
   const points=G().run.points,kills=G().run.kills;let shots=0;while(!e.dead&&shots<40){aimAt(e.group.position.clone().add(new T.Vector3(0,1.15,0)));frames(1);if(G().run.inventory.glock.ammo===0){qa.reload();frames(130);}qa.shoot();shots++;frames(12);}
   assert(e.dead&&G().run.kills===kills+1&&G().run.points-points>=50,`Shots downhill land and kill (${shots} shots); the kill counts and pays`);}
  // The katana on a slope: a walker below you on the hillside, inside the arc, is cut.
  {frames(120);const open=(x,z)=>!G().island.isBlocked(x,z,.7,G().island.colliders,null,groundHeight(x,z),1.8);let b=Math.PI*1.2;const at=d=>[ISLAND.hill.x+Math.cos(b)*d,ISLAND.hill.z+Math.sin(b)*d];
   while(!(groundHeight(...at(17))-groundHeight(...at(19.6))>.9&&open(...at(17))&&open(...at(19.6))))b+=.1;   // a clear line down the flank (v210: the spur and rocks moved)
   const [px,pz]=at(17),[ex,ez]=at(19.6);qa.setPlayer(px,pz);
   G().run.inventory.katana.owned=true;key({code:'Digit7',repeat:false});frames(30);const e=still(G().spawnKind('walker',ex,ez,0));
   assert(groundHeight(px,pz)-groundHeight(ex,ez)>.8,'(it stands lower)');aimAt(e.group.position.clone().add(new T.Vector3(0,1,0)));const hp=e.hp;qa.shoot();frames(30);
   assert(e.hp<hp,'The katana cuts a walker below you on the slope');key({code:'Digit1',repeat:false});frames(30);if(!e.dead)G().combat.damageEnemy(e,1e4,false,{part:'torso',direction:new T.Vector3(0,0,1),source:'glock'});}
  // Bodies never overlap: you cannot walk through a walker, nor it through you.
  {frames(200);const [px,pz]=[0,30];qa.setPlayer(px,pz);const e=still(G().spawnKind('walker',px,pz-1.5,0));qa.setAim(0,0);qa.setKeys(['KeyW']);frames(90);qa.setKeys([]);
   assert(Math.hypot(G().player.x-e.walkPos.x,G().player.z-e.walkPos.z)>=.32+e.radius-.02,'You cannot walk through one of the dead');G().combat.damageEnemy(e,1e4,false,{part:'torso',direction:new T.Vector3(0,0,1),source:'glock'});frames(200);}
  // Power-ups drop on the ground where the dead fall, even on the hill, and you pick them up.
  {const b=-.4,[x,z]=[ISLAND.hill.x+Math.cos(b)*20,ISLAND.hill.z+Math.sin(b)*20];qa.setPlayer(x+3,z);const e=still(G().spawnKind('walker',x,z,0));
   const seeded=Math.random;Math.random=()=>.05;try{G().combat.damageEnemy(e,1e4,false,{part:'torso',direction:new T.Vector3(1,0,0),source:'glock'});}finally{Math.random=seeded;}
   const p=G().pickups.at(-1);assert(p&&Math.abs(p.y-groundHeight(x,z))<.05,`A power-up drops on the hillside where it fell (${p?.y.toFixed(2)} m, ground ${groundHeight(x,z).toFixed(2)} m)`);
   const count=G().pickups.length;qa.setPlayer(p.mesh.position.x,p.mesh.position.z);frames(3);assert.equal(G().pickups.length,count-1,'and walking onto it collects it');}
  console.log(`PASS: the dead come ashore: none in the first ${R.firstDelay} s, then each rises out of the shallows from below the water, more than ${R.near} m away and out of sight, and stands on the ground; at threat level 1 the shore keeps ${LIVING} walkers at the mansion's wave-1 strength, never more, all routed to you; pressed for 500 it fills to ${crowdPeak} and never passes ${R.cap}; New Run clears them; shots and the katana land downhill on Radio Hill's slopes and kills pay; bodies never overlap; power-ups drop on the hillside and are picked up.`);
  // ---- 6. The threat director (v208, Dead Tide step 3a) --------------------------------------
  // The formulas themselves are tested in tests/tide-threat.mjs; here, the director in play.
  {
    const {createThreatDirector}=await import('../public/game/tide-dead.mjs'),{BRUTE}=await import('../public/game/brute.mjs'),{BUILD}=await import('../public/game/zombie-build.mjs');
    const {DOG_SPEED_MULTIPLIER:DOG,RARE_DOG_SPEED_MULTIPLIER:RARE}=await import('../public/game/zombie-dog.mjs'),{FERAL}=await import('../public/game/feral.mjs'),{LURKER}=await import('../public/game/lurker.mjs');
    const kindOf=e=>e.lurker?'lurker':e.feral?'feral':e.rareDog?'ashfang':e.dog?'dog':e.brute?'brute':'walker';
    // a. The director alone, on a stand-in spawner.
    {let kills=0,draws=0,roll=0,brutesOk=false;const zs=[],made=[];
     const spawner={placement:kind=>({valid:(p,near=0)=>(kind!=='brute'||brutesOk)&&Math.hypot(p[0],p[1])>near}),choosePoint:o=>o[0],spawnKind:kind=>{const e={kind,dead:false,walkPos:{x:0,z:0},group:{position:{y:0}}};zs.push(e);made.push(kind);return e;}};
     const d=createThreatDirector({spawner,zombies:zs,player:{x:0,z:0},look:()=>0,noise(){},kills:()=>kills,rng:()=>{draws++;return roll;}});
     const run=s=>{for(let i=0;i<s*60;i++)d.update(1/60);};
     d.target=0;run(30);assert(made.length===0&&draws===0,'A held shore sends no one and draws nothing from the game’s generator (the island’s own scenarios play as before)');
     d.reset();run(30);assert(made.length===8&&made.every(k=>k==='walker'),'Level 1: eight walkers');
     kills=39;run(10);assert(d.level===2&&made.length===10&&made.every(k=>k==='walker'),'Level 2: ten, still walkers alone');
     kills=40;run(10);assert(d.level===3&&made.length===12,'Level 3: twelve');
     kills=460;roll=.99;run(1.5);assert.equal(made.at(-1),'lurker','The Apocalypse, a high roll: a lurker');
     // A brute with no safe point keeps its turn; a walker comes ashore in its place.
     roll=.8;const n=made.length;run(1.5);assert(made.length>n&&!made.slice(n).includes('brute')&&made.at(-1)==='walker'&&d.pending==='brute','A brute with nowhere safe to rise waits its turn, and walkers come instead');
     run(3);assert(!made.slice(n).includes('brute')&&d.pending==='brute','still waiting');
     brutesOk=true;run(1.5);assert(made.slice(n).includes('brute'),'and comes ashore when it can');
     d.target=500;assert.equal(d.target,45,'A target set by hand never passes 45');d.reset();assert(d.target===45&&d.pending===null,'New Run forgets it (45: the run’s kills here are 460)');
     zs.length=0;made.length=0;kills=1000;run(200);assert(zs.length===45,'However long it runs, never more than 45');}
    // b. Escalation mid-run, with no pause: kills raise the level, the rank and the target.
    enter();await Promise.resolve();G().run.health=1e9;qa.setPlayer(0,40);
    G().run.kills=99;frames(2);assert(G().shore.level===5&&G().shore.rank==='THE UNEASE'&&G().shore.target===16,'99 kills: level 5, The Unease, sixteen on the island');
    {const e=still(G().spawnKind('walker',0,30,0));G().combat.damageEnemy(e,1e4,false,{part:'torso',direction:new T.Vector3(0,0,1),source:'glock'});frames(1);
     assert(G().run.kills===100&&G().shore.level===6&&G().shore.rank==='THE HUNT'&&G().shore.target===18&&G().mode==='playing','The 100th kill: level 6, The Hunt, eighteen, and play goes on');}
    // c. Each arrival rises at the level's strength; the dead already ashore keep theirs.
    {qa.resetRun();await Promise.resolve();G().run.health=1e9;qa.setPlayer(0,40);
     let early=null;for(let i=0;i<60*20&&!early;i++){frames(1);early=G().zombies.find(e=>!e.dead);}assert(early&&early.maxHp===93,'At level 1 the first rises with 93 health');
     G().run.kills=260;const L=G().shore.level,stats=TT.threatStats(L),known=new Set(G().zombies);assert(L===14&&G().shore.rank==='THE SWARM');
     const HEALTH={walker:1,feral:1,dog:.85,ashfang:.85*2,brute:BRUTE.healthMultiplier,lurker:LURKER.health},fresh=[];
     for(let i=0;i<60*40;i++){frames(1);G().run.health=1e9;for(const e of G().zombies)if(!known.has(e)){known.add(e);fresh.push(e);}}
     assert(fresh.length>=20,`New arrivals keep coming (${fresh.length})`);
     for(const e of fresh){const k=kindOf(e);assert(Math.abs(e.maxHp/(stats.health*HEALTH[k])-1)<1e-12,`A ${k} rises with level ${L}'s health (${e.maxHp.toFixed(1)})`);
       const pace=e.speed/stats.speed;
       if(k==='walker')assert(pace>=BUILD.speed[0]-1e-9&&pace<=BUILD.speed[1]+1e-9,'a walker at its own pace of level 14’s speed');
       else if(k==='dog'||k==='ashfang'||k==='feral'||k==='lurker'){const want={dog:DOG,ashfang:RARE,feral:FERAL.speedMultiplier,lurker:LURKER.speed}[k];if(!e.enraged)assert(Math.abs(pace-want)<1e-9,`a ${k} at ${want}× level 14’s speed`);}}
     assert(early.maxHp===93,'The first, risen at level 1, keeps its 93');
     console.log(`PASS (threat): ${fresh.length} arrivals at level 14 each rise at its strength (${stats.health.toFixed(2)} health, ${stats.speed.toFixed(3)} speed, times each kind’s own multiple); one risen at level 1 keeps its 93.`);}
    // d. The Apocalypse: all six kinds come ashore, filling to 45 and never more.
    {qa.resetRun();await Promise.resolve();G().run.health=1e9;G().run.kills=1000;qa.setPlayer(0,40);
     const kinds={},known=new Set();let peak=0;
     for(let i=0;i<60*150;i++){frames(1);G().run.health=1e9;let n=0;for(const e of G().zombies){if(!e.dead)n++;if(!known.has(e)){known.add(e);kinds[kindOf(e)]=(kinds[kindOf(e)]||0)+1;}}peak=Math.max(peak,n);assert(n<=45,'Never more than 45 living');}
     assert.deepEqual(Object.keys(kinds).sort(),['ashfang','brute','dog','feral','lurker','walker'],`The Apocalypse sends every kind (${JSON.stringify(kinds)})`);
     assert.equal(peak,45,'and fills the island to 45');assert.equal(G().mode,'playing');
     for(const e of G().zombies.filter(e=>!e.dead))assert(Number.isFinite(e.walkPos.x+e.walkPos.y+e.walkPos.z+e.group.position.y)&&groundHeight(e.walkPos.x,e.walkPos.z)>=-ISLAND.wade-1e-6,'each on land or in the shallows, in a real place');
     console.log(`PASS (threat): at level ${G().shore.level} the shore sends every kind (${Object.entries(kinds).map(([k,n])=>`${n} ${k}`).join(', ')}), fills to ${peak} and never passes 45.`);}
    // e. Every kind climbs Radio Hill after you, from its southern foot to the summit;
    // brutes on their own wider routes.
    {const H=ISLAND.hill,times={};
     for(const kind of ['walker','dog','ashfang','feral','lurker','brute']){
       qa.resetRun();await Promise.resolve();G().shore.target=0;G().run.health=1e9;qa.setPlayer(-2,-2);frames(2);
       const x=H.x+Math.cos(1.6)*32,z=H.z+Math.sin(1.6)*32,e=G().spawnKind(kind,x,z,0);e.attack=1e9;
       let t=0,reached=false;for(;t<60*90&&!reached;t++){frames(1);G().run.health=1e9;const d=Math.hypot(e.walkPos.x-G().player.x,e.walkPos.z-G().player.z);reached=d<2.4||!!e.lurkerFuse||!!e.lurkerBurst;}
       assert(reached,`A ${kind} climbs Radio Hill to you (stopped ${Math.hypot(e.walkPos.x+2,e.walkPos.z+2).toFixed(1)} m short)`);times[kind]=Math.round(t/60);
       if(kind==='brute'){const wide=G().routes.brutes;assert(wide&&wide!==G().routes&&wide.direction(e.walkPos.x,e.walkPos.z,0)?.reachable,'the brute on its own, wider routes');}
       if(!e.dead)G().combat.damageEnemy(e,1e9,false,{part:'torso',direction:new T.Vector3(0,0,1),source:'glock'});frames(5);}
     console.log(`PASS (threat): every kind climbs Radio Hill from its southern foot to you on the summit (${Object.entries(times).map(([k,s])=>`${k} ${s} s`).join(', ')}).`);}
    // f. New Run starts the threat again.
    qa.resetRun();await Promise.resolve();assert(G().run.kills===0&&G().shore.level===1&&G().shore.target===8&&G().shore.pending===null,'New Run starts again at threat level 1');
    console.log('PASS: the threat director: kills raise the threat level, rank and target with no pause; walkers alone (and no draw from the generator) at levels 1–2; a brute with nowhere safe to rise waits its turn while a walker comes; never more than 45; New Run starts again at level 1.');
  }
  // ---- 7. The spawn network (v209, Dead Tide step 3b) ----------------------------------------
  {
    const {createThreatDirector,SHORE_RULES:SR}=await import('../public/game/tide-dead.mjs'),N=TT.SPAWN_RULES;
    // A stand-in spawner (every point valid beyond `near`) and a seeded generator; the island
    // is emptied after each step so the director keeps sending (the steady state of a fight).
    function rig({kills=0,seed=7}={}){
      let s=seed>>>0;const rng=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
      const zs=[],player={x:0,z:0},view={yaw:0},k={kills};
      const spawner={placement:()=>({valid:(p,near=0)=>Math.hypot(p[0]-player.x,p[1]-player.z)>near,routes:{direction:()=>({distance:30,reachable:true})}}),choosePoint:o=>o[0],
        spawnKind:(kind,x,z)=>{const e={kind,dead:false,walkPos:{x,z},group:{position:{y:0}}};zs.push(e);return e;}};
      const d=createThreatDirector({spawner,zombies:zs,player,look:()=>view.yaw,noise(){},kills:()=>k.kills,rng});
      return {d,zs,player,view,k};
    }
    const steps=(r,seconds,each=()=>{})=>{for(let i=0;i<seconds*60;i++){each(i);r.d.update(1/60);}};
    const clear=r=>{for(const e of r.zs)e.dead=true;};
    const inCone=(l,half)=>{const dx=l.x-l.px,dz=l.z-l.pz,d=Math.hypot(dx,dz);return Math.acos(Math.max(-1,Math.min(1,(dx*-Math.sin(l.yaw)+dz*-Math.cos(l.yaw))/d)))<half;};
    // a. Open zones follow the rank: majors per majorZoneCount, the interior only from The Swarm.
    for(const kills of [0,40,100,180,260,360,460,540,800]){
      const r=rig({kills}),L=TT.threatLevel(kills);steps(r,10,()=>clear(r));
      assert.equal(r.d.openZones.length,TT.majorZoneCount(L),`Level ${L}: ${TT.majorZoneCount(L)} major zones open`);
      assert.equal(r.d.openInterior.length,TT.interiorOpen(L),`Level ${L}: ${TT.interiorOpen(L)} interior zones open`);
      if(L<14)assert.equal(r.d.counts.interior,0,`No one rises inland before The Swarm (level ${L})`);
    }
    // b. Rotation: one open zone swapped for a closed one every 40 s, the count kept.
    {const r=rig({kills:0});steps(r,5,()=>clear(r));const before=r.d.openZones;steps(r,N.rotate+2,()=>clear(r));const after=r.d.openZones;
     assert(r.d.counts.rotations===1&&after.length===before.length&&after.filter(z=>!before.includes(z)).length===1,`After ${N.rotate} s one zone has closed and another opened (${before} → ${after})`);
     steps(r,N.rotate*5,()=>clear(r));assert(r.d.counts.rotations===6,'and so on, every 40 s while the dead keep coming');}
    // c. Shares: the minor points more often as the ranks rise; the interior only late.
    const shares={};
    for(const kills of [0,100,260,460]){const r=rig({kills,seed:kills+3});let i=0;
      steps(r,400,f=>{clear(r);if(f%60===0){i++;r.player.x=Math.cos(i*.7)*20;r.player.z=Math.sin(i*1.3)*20;r.view.yaw=i*2.1;}});
      const c=r.d.counts,total=c.major+c.minor+c.interior;shares[kills]={minor:c.minor/total,interior:c.interior/total,total,c};}
    assert(shares[0].minor>.05&&shares[0].minor<.22,`The Unease: the minor points now and then (${(shares[0].minor*100).toFixed(0)}%)`);
    assert(shares[0].minor<shares[100].minor&&shares[100].minor<shares[460].minor,`more often each rank (${[0,100,260,460].map(k=>(shares[k].minor*100).toFixed(0)+'%').join(', ')})`);
    assert(shares[0].interior===0&&shares[100].interior===0&&shares[260].interior>0&&shares[460].interior>shares[260].interior,`The interior from The Swarm, more in The Apocalypse (${(shares[260].interior*100).toFixed(0)}%, ${(shares[460].interior*100).toFixed(0)}%)`);
    // d. Every arrival keeps the safety rules: the shore's 18 m and 40 m view cone; inland, 28 m
    // and a 160° cone at any distance. (Here the player moves and turns every second.)
    {const r=rig({kills:540,seed:11});let i=0,inland=0,shore=0;
     steps(r,300,f=>{clear(r);if(f%60===0){i++;r.player.x=Math.cos(i*.9)*25;r.player.z=Math.sin(i*1.7)*25;r.view.yaw=i*1.9;}
       for(const l of r.d.log.splice(0)){const d=Math.hypot(l.x-l.px,l.z-l.pz);
         if(l.kind==='interior'){inland++;assert(d>=N.interior.near&&!inCone(l,N.interior.halfAngle),`Inland only ${N.interior.near} m or more away and out of view (${d.toFixed(1)} m)`);}
         else{shore++;assert(d>SR.near&&(d>SR.sight.range||!inCone(l,SR.sight.halfAngle)),`On the shore never within ${SR.near} m nor in view within ${SR.sight.range} m`);}}});
     assert(inland>20&&shore>100,`(${shore} shore and ${inland} inland arrivals checked)`);}
    // e. Batches: one at a time in The Unease; up to 2, then 3, from one zone at its other
    // points as the ranks rise, never more than the shore is short.
    for(const [kills,most] of [[0,1],[100,2],[260,2],[460,3]]){
      const r=rig({kills,seed:5});let biggest=0;
      for(let f=0;f<120*60;f++){const n=r.zs.length,short=r.d.target-r.d.alive();r.d.update(1/60);clear(r);
        const got=r.zs.slice(n);if(!got.length)continue;biggest=Math.max(biggest,got.length);
        assert(got.length<=Math.min(most,Math.max(1,short)),`At most ${most} at once, and no more than the shore is short`);
        if(got.length>1){const zone=r.d.log.at(-1).zone;assert(r.d.log.slice(-got.length).every(l=>l.zone===zone),'a batch rises from one zone');
          assert(new Set(got.map(e=>e.walkPos.x+','+e.walkPos.z)).size===got.length,'at different points');}}
      assert.equal(biggest,most,`Level ${TT.threatLevel(kills)}: batches of up to ${most}`);
    }
    // f. A moving player: arrivals favour your flanks and back over the way ahead.
    {const r=rig({kills:0,seed:9});let ahead=0,behind=0,t=0;
     steps(r,600,f=>{clear(r);t+=1/60;const a=t*4/20;r.player.x=Math.cos(a)*20;r.player.z=Math.sin(a)*20;r.view.yaw=Math.atan2(Math.sin(a),-Math.cos(a))+Math.PI;
       for(const l of r.d.log.splice(0)){if(l.kind==='interior')continue;const v=r.d.velocity,sp=Math.hypot(v.x,v.z);if(sp<1)continue;
         const dx=l.x-l.px,dz=l.z-l.pz,d=Math.hypot(dx,dz),cos=(dx*v.x+dz*v.z)/(d*sp);if(cos>.5&&d<=N.weights.travel.far)ahead++;else if(cos<-.3)behind++;}});
     assert(behind>ahead*2.5,`Circling at 4 m/s: ${behind} arrivals behind you, ${ahead} close ahead`);}
    // g. A minor point sometimes sends a second from the same point once the first is clear.
    {const r=rig({kills:460,seed:13});steps(r,300,()=>clear(r));assert(r.d.counts.follows>0,`Minor points send two now and then (${r.d.counts.follows} seconds)`);}
    console.log(`PASS: the spawn network: major zones open by rank (3 at the start, all 8 from level 28), one swapped every ${N.rotate} s; the minor points more often each rank (${[0,100,260,460].map(k=>(shares[k].minor*100).toFixed(0)+'%').join(', ')}), sometimes twice; the interior only from The Swarm (${(shares[260].interior*100).toFixed(0)}%, then ${(shares[460].interior*100).toFixed(0)}%), always ${N.interior.near} m or more away and out of a 160° view; the shore's 18 m and 40 m view rules kept; batches of 1, 2 and 3 from one zone by rank, never more than the shore is short; arrivals favour a moving player's flanks and back.`);
  }
  // ---- 8. The threat tracker and its cue (v209) ----------------------------------------------
  {
    qa.resetRun();await Promise.resolve();G().shore.target=0;frames(2);const TR=G().threat,el=$('threatHud'),cues=TR.cues,ranks=TR.rankCues;
    const read=()=>[$('threatLevel').textContent,$('threatRank').textContent,$('threatKills').textContent,$('threatNext').textContent,$('threatFill').style.width,el.getAttribute('data-rank')];
    assert.deepEqual(read(),['1','THE UNEASE','0','0 / 20','0.0%','0'],'A run starts at threat level 1, The Unease, no kills, 0 of 20');
    assert(!$('hud').classList.contains('hidden')&&el.classList.contains('topHud'),'The tracker is up, top left (the wave counter’s place)');
    const kill=()=>{const e=G().spawnKind('walker',0,30,0);G().combat.damageEnemy(e,1e9,false,{part:'torso',direction:new T.Vector3(0,0,1),source:'glock'});frames(1);};
    G().run.kills=18;frames(1);kill();assert.deepEqual(read().slice(0,4),['1','THE UNEASE','19','19 / 20']);assert.equal(read()[4],'95.0%','The bar shows 19 of 20');
    const banner=$('banner').innerHTML;kill();
    assert.deepEqual(read().slice(0,5),['2','THE UNEASE','20','0 / 20','0.0%'],'The 20th kill: level 2, and the bar starts again');
    assert(el.classList.contains('pulse')&&!el.classList.contains('rankUp')&&TR.cues===cues+1&&TR.rankCues===ranks,'The number pulses and a quiet cue plays');
    assert($('banner').innerHTML===banner&&G().mode==='playing','with no banner and no pause');
    frames(60);assert(!el.classList.contains('pulse'),'The pulse fades within a second');
    G().run.kills=99;frames(1);assert(read()[0]==='5'&&TR.cues===cues+2&&TR.rankCues===ranks,'A jump of several levels at once (2 to 5) plays one cue');
    kill();assert(read()[0]==='6'&&read()[1]==='THE HUNT'&&read()[5]==='1'&&el.classList.contains('rankUp')&&TR.rankCues===ranks+1&&TR.cues===cues+3,'The 100th kill: The Hunt, its name glowing, with the deeper cue');
    frames(120);assert(!el.classList.contains('rankUp'),'The glow fades');
    G().run.kills=459;frames(1);kill();assert(read()[1]==='THE APOCALYPSE'&&read()[5]==='3'&&TR.rankCues===ranks+3&&TR.cues===cues+5,'The Swarm, then The Apocalypse, each with its cue');
    qa.resetRun();await Promise.resolve();frames(2);assert.deepEqual(read(),['1','THE UNEASE','0','0 / 20','0.0%','0'],'New Run starts the tracker again');assert.equal(TR.cues,cues+5,'quietly');
    // Every interior point is open ground on land, with a route to the summit.
    {qa.resetRun();await Promise.resolve();G().shore.target=0;const H=ISLAND.hill;qa.setPlayer(H.x,H.z);frames(2);G().routes.rebuild(H.x,H.z);let n=0;
     for(const z of G().shore.zones.filter(z=>z.kind==='interior'))for(const p of z.points){n++;assert(groundHeight(p[0],p[1])>.3&&!G().island.isBlocked(p[0],p[1],.5,G().island.colliders,null,groundHeight(p[0],p[1]),1.8)&&G().routes.direction(p[0],p[1],0)?.reachable,`${z.name} (${p[0]}, ${p[1]}) is open ground on land with a route to the summit`);}
     assert.equal(n,18,'all 18 interior points (6 zones of 3)');}
    // In play, the interior at The Apocalypse: from the south beach facing the sea, the dead rise
    // inland too, never close and never in view.
    qa.resetRun();await Promise.resolve();G().run.kills=460;G().run.health=1e9;qa.setPlayer(0,52);qa.setAim(Math.PI,0);
    for(let i=0;i<60*60;i++){frames(1);G().run.health=1e9;qa.setAim(Math.PI,0);}
    const inland=G().shore.log.filter(l=>l.kind==='interior');
    assert(inland.length>0,`Inland arrivals at The Apocalypse (${inland.length})`);
    for(const l of inland){const d=Math.hypot(l.x-l.px,l.z-l.pz);assert(d>=TT.SPAWN_RULES.interior.near,'never close');}
    for(const e of G().zombies.filter(e=>!e.dead&&e.spawnZone&&G().shore.zones.find(z=>z.name===e.spawnZone)?.kind==='interior'))assert(groundHeight(e.walkPos.x,e.walkPos.z)>0&&G().routes.direction(e.walkPos.x,e.walkPos.z,0)?.reachable,'and on land, with a route to you');
    console.log(`PASS: the threat tracker shows level, rank, kills and 0–20 progress top left; each new level pulses the number with a quiet cue, each rank glows its name with a deeper one, a multi-level jump cues once, with no banner and no pause; New Run starts it again; in play ${inland.length} of the dead rose inland at The Apocalypse, never within ${TT.SPAWN_RULES.interior.near} m.`);
  }
  // ---- 9. The stations (v212, Dead Tide step 5) --------------------------------------------------
  {
    const {PERKS}=await import('../public/game/stations.mjs'),{ARMOR,armorRank}=await import('../public/game/armor.mjs'),{FORGE}=await import('../public/game/soul-forge.mjs');
    let narrowest=Infinity;const pads=G().island.stations,stations=G().stations,kit=G().stationKit,R=G().run;
    qa.resetRun();await Promise.resolve();G().shore.target=0;G().run.health=1e9;frames(2);
    // a. A station on every pad, and the tent's crate; no shrines anywhere.
    assert.equal(stations.length,pads.length+1,'One station on every pad, and the tent’s ammunition crate');
    for(const p of pads){const s=stations.find(s=>s.padId===p.id);assert(s&&Math.hypot(s.x-p.x,s.z-p.z)<1e-9,`The ${p.id} station stands on its pad`);}
    assert(!stations.some(s=>s.type==='powerup'),'No shrines: no timed double damage, no endless grenades');
    assert(!G().world.getObjectByName('THE TWOFOLD RELIC')&&!G().world.getObjectByName('THE ENDLESS ARSENAL'));
    // Their still parts are merged by material: few draw calls for all of them.
    {let meshes=0;G().world.getObjectByName('Stations').traverseVisible(o=>{if(o.isMesh||o.isLine)meshes++;});assert(meshes<=70,`The stations draw as ${meshes} meshes (merged by material)`);
     // The painted parts' shared material reads its colour, finish and glow from the vertices:
     // each of the shader's three patches found its place in this three.js.
     let palette=null;G().world.getObjectByName('Stations').traverse(o=>{if(o.material?.userData?.stationPalette)palette??=o.material;});
     const T3=await import('../public/game/three.module.js'),shader={vertexShader:T3.ShaderLib.physical.vertexShader,fragmentShader:T3.ShaderLib.physical.fragmentShader};palette.onBeforeCompile(shader);
     assert(/vSurfaceFinish=surfaceFinish/.test(shader.vertexShader)&&/roughnessFactor = vSurfaceFinish\.x/.test(shader.fragmentShader)&&/metalnessFactor = vSurfaceFinish\.y/.test(shader.fragmentShader)&&/totalEmissiveRadiance = vSurfaceGlow/.test(shader.fragmentShader),'the palette shader is patched');
     // Bullets stop at the stations' boxes, not at their merged triangles.
     assert(!G().island.solidMeshes.some(m=>m.parent?.name==='Stations'||m.material?.userData?.stationPalette)&&G().island.solidMeshes.filter(m=>m.name==='Station hit box').length===G().stations.length,'the stations’ hit boxes stand in for their parts');}
    // b. Walking up to each one shows its prompt; E buys it at the mansion's price.
    const buy=(s,points)=>{R.points=points;qa.setPlayer(s.x+Math.sin(s.rotation||0)*1.6,s.z+Math.cos(s.rotation||0)*1.6);frames(2);
      const shown=$('interaction').textContent;key({code:'KeyE'});listeners.keyup({code:'KeyE'});frames(2);return shown;};
    const at=id=>stations.find(s=>s.padId===id);
    // The boathouse: locked, its door shows why and the Warden inside sells nothing; at threat level 10
    // it opens (with a notice) for the rest of the run.
    {const B=G().island.boathouse,lmg=at('lmg');assert(!B.open&&lmg.locked,'The boathouse starts locked');
     qa.setPlayer(B.x-Math.sin(G().island.sites.dock.angle)*1.2,B.z-Math.cos(G().island.sites.dock.angle)*1.2);frames(2);assert($('interaction').textContent.includes('LOCKED')&&$('interaction').textContent.includes('THREAT LEVEL 10'),'At its door: locked until threat level 10');
     R.kills=179;frames(2);assert(!B.open,'Still shut at level 9, a kill short');
     R.kills=180;frames(3);assert(B.open&&!lmg.locked,'Open at level 10');
     assert(!G().island.colliders.includes(B.collider),'its doorway open to walk through');}
    for(const s of stations){qa.setPlayer(s.x+Math.sin(s.rotation||0)*1.6,s.z+Math.cos(s.rotation||0)*1.6);frames(2);assert($('interaction').textContent.includes(s.name),`In front of ${s.name}, its prompt shows`);}
    // Weapons: each sold at its price, and in hand.
    for(const [id,key,price] of [['smg','smg',1500],['shotgun','shotgun',1200],['bushmaster','bushmaster',2500],['rifle','rifle',4500],['lmg','lmg',5000],['katana','katana',at('katana').price]]){
      assert(!R.inventory[key].owned);buy(at(id),price+10);assert(R.inventory[key].owned&&R.weapon===key&&R.points===10,`The ${id} station sells its weapon for ${price} and puts it in your hands`);}
    // The M4's and the Warden's racks sell their ranks once owned, and hand the gun back after.
    {const {nextRank}=await import('../public/game/weapon-ranks.mjs');for(const key of ['rifle','lmg']){qa.selectWeapon('glock');const next=nextRank(key,R.inventory[key].weaponRank);buy(at(key),next.price);assert(R.inventory[key].weaponRank===1&&R.points===0,`The ${key} rack sells rank I for ${next.price}`);}}
    // Perks: each sold once, at its price, with its effect.
    for(const p of PERKS){R.points=p.price;buy(at(p.id),p.price);assert(R.perkOwned.has(p.id)&&R.points===0,`${p.name} sold for ${p.price}`);
      buy(at(p.id),5000);assert(R.points===5000,'and only once');}
    assert(R.maxHealth===200,'Ironheart doubles maximum health');
    // Armour, then the Nano Shield's ranks, at the bunker.
    buy(at('armor'),ARMOR.bodyPrice);assert(R.armorTier===1&&R.armorMax===200&&R.points===0,'Aegis body armour at the bunker');
    for(const rank of ARMOR.nanoRanks){buy(at('armor'),rank.price);assert(armorRank(R.armorTier)?.rank===rank.rank&&R.points===0,`then the Nano Shield's rank ${rank.rank}`);}
    // The Soul Forge forges the weapon in hand.
    {const held=R.weapon;buy(at('forge'),FORGE.prices[0]);assert(R.inventory[held].forgeRank===1&&R.points===0,'The Soul Forge forges the weapon in hand');}
    // Ammunition: the tent's station restocks for 350.
    {R.inventory.smg.reserve=0;buy(at('ammo-tent'),350);assert(R.inventory.smg.reserve>0&&R.points===0,'The tent’s ammunition restocks for 350');}
    // Short of the price, nothing is sold.
    R.inventory.smg.reserve=0;buy(at('ammo-tent'),349);assert(R.inventory.smg.reserve===0&&R.points===349,'Short of the price, nothing is sold');
    // c. New Run: everything bought is gone, the armour and Forge stations are back at their first rank.
    qa.resetRun();await Promise.resolve();G().shore.target=0;frames(2);
    assert(!R.inventory.smg.owned&&!R.perkOwned.size&&R.armorTier===0&&at('armor').armorTier===0&&at('forge').forgeRank===0,'New Run starts the stations afresh');
    assert(!G().island.boathouse.open&&at('lmg').locked&&G().island.colliders.includes(G().island.boathouse.collider),'and locks the boathouse again');
    // d. With the stations standing, the island still has no pockets, its beach loop and trails
    // are open, and no one rises within 6 m of a station.
    {const I=G().island,{trails}=await import('../public/game/island.mjs').then(m=>m.islandSites()),{enemyBody}=await import('../public/game/crowd.mjs'),b=enemyBody({brute:true}),BR=Math.max(.44,b.radius);
     const open=(x,z,r,h)=>groundHeight(x,z)>=-ISLAND.wade&&!I.isBlocked(x,z,r,I.colliders,null,I.supportBelow(x,z,groundHeight(x,z),ISLAND.step),h);
     I.boathouse.setOpen(true);   // (as from threat level 10; shut, its inside is closed off)
     for(const [who,radius,height] of [['walker',.44,1.8],['brute',BR,b.height]]){const routes=I.buildRoutes({radius,height});routes.rebuild(ISLAND.hill.x,ISLAND.hill.z+1);let cut=0;
       const onRock=(x,z)=>I.platforms.some(p=>p.r!==undefined&&(x-p.x)**2+(z-p.z)**2<p.r*p.r);
       for(let i=0;i<routes.blocked.length;i++){if(routes.blocked[i])continue;const x=(i%routes.w)*routes.cell-84,z=Math.floor(i/routes.w)*routes.cell-84;if(routes.distance[i]>=99999&&groundHeight(x,z)>-.6&&!onRock(x,z))cut++;}
       assert.equal(cut,0,`With the stations, every open cell still has a route to the summit for a ${who}`);}
     I.boathouse.setOpen(false);
     for(let a=-Math.PI;a<Math.PI;a+=.02){const Rc=coastRadius(a);let run=0,best=0;for(let r=Rc*.66;r<=Rc*1.05;r+=.5){if(open(Math.cos(a)*r,Math.sin(a)*r,BR,b.height)){run+=.5;best=Math.max(best,run);}else run=0;}narrowest=Math.min(narrowest,best);}
     assert(narrowest>=6,`The beach is still open all the way round (${narrowest.toFixed(1)} m)`);
     for(const t of trails)for(let k=1;k<t.points.length;k++){const [ax,az]=t.points[k-1],[bx,bz]=t.points[k],n=Math.ceil(Math.hypot(bx-ax,bz-az)/.5);for(let j=0;j<=n;j++){const x=ax+(bx-ax)*j/n,z=az+(bz-az)*j/n;assert(open(x,z,BR,b.height),`${t.name} is still clear`);}}
     const net=G().shore.zones;for(const z of net)for(const p of z.points)for(const s of stations)if(s.padId!=='ammo-tent')assert(Math.hypot(s.x-p[0],s.z-p[1])>=6,`${z.name} is 6 m or more from ${s.name}`);}
    console.log(`PASS: the stations (v212): ${stations.length} in all, on every pad and in the tent, no shrines; each shows its prompt and sells at the mansion's price (the six weapons, the M4's and the Warden's ranks, the four perks once each with Ironheart's double health, the armour and every Nano Shield rank, the Forge, the tent's ammunition for 350), nothing short of the price; the boathouse locked until threat level 10, then open; New Run starts them afresh and locks it again; with them standing, no pockets for walkers or brutes, the beach loop at least ${narrowest.toFixed(1)} m and every trail open, and no spawn point within 6 m.`);
  }
}finally{Math.random=random;}
process.exit(0);

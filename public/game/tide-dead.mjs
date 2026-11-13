import * as T from './three.module.js';
import {PLAYER_RADIUS} from './crowd.mjs?v=123';
import {shoreSpawns,islandSites} from './island.mjs?v=220';
import {THREAT_RULES,SPAWN_RULES,threatLevel,threatRank,targetPopulation,walkersOnly,chooseTideKind,majorZoneCount,minorShare,minorFollow,interiorOpen,interiorShare,batchSize} from './tide-threat.mjs?v=220';

// The dead come ashore (v206, Dead Tide step 2, slice 3): the island as the shared enemy
// modules see it, and (v208, step 3a) the threat director that sends them.
//
// The island as one floor: the shared enemy AI, spawner and crowd were written for the
// mansion's flat floors, where an enemy on your floor is within half a metre of your
// height. On the island the ground rises 14 m, so the enemies keep their height relative to
// the ground under them (0 on the ground, a slab's height on a low slab), and so does
// the player as they see it (`hunter`). This view turns those heights back into the world's
// for collision, footing and drawing (`standAt`), so the AI's routing, crowding, flanking and
// strikes work unchanged on slopes.
export function createIslandLevel({island,crowd,routes,hunter}){
  const ground=island.groundHeight,colliders=island.colliders,at=new T.Vector3();
  return {colliders,crowd,solidMeshes:island.solidMeshes,visibleFloor:island.visibleFloor,
    get nav(){return routes;},
    isBlocked:(x,z,r,_c,_b,y=0,height=1.8)=>island.isBlocked(x,z,r,colliders,null,ground(x,z)+y,height),
    supportBelow:(x,z,y=Infinity,step=0)=>{const g=ground(x,z);return island.supportBelow(x,z,g+y,step)-g;},
    floorHeight:(x,z)=>ground(x,z),
    standAt:(x,z,y)=>ground(x,z)+y,
    rampHeight:()=>null,crouchAt:()=>false,canStand:()=>true,
    // Walking: the island's own movement, wading included, never into another body.
    move(pos,dx,dz,r,actor=null){
      at.set(pos.x,ground(pos.x,pos.z)+pos.y,pos.z);
      const occupy=actor?.canOccupy?(x,z,y)=>actor.canOccupy(x,z,y-ground(x,z)):null;
      island.move(at,dx,dz,r,{grounded:true,height:actor?.bodyHeight||1.8,canOccupy:occupy});
      pos.x=at.x;pos.z=at.z;pos.y=at.y-ground(at.x,at.z);if(Math.abs(pos.y)<1e-9)pos.y=0;return pos;
    },
    // Bodies fall in the world's heights.
    corpseBlocked:(x,z,r,y)=>island.isBlocked(x,z,r,colliders,null,y-r,2*r),
    corpseFloor:(x,z,y)=>island.supportBelow(x,z,y+.2)+.008,
    // The player's height on the enemies' scale (the katana measures with it).
    floorOf:p=>p.y-ground(p.x,p.z)
  };
}
// Where the player stands for the enemies: x and z, and the height above the ground.
export function followPlayer(hunter,player,island){hunter.set(player.x,player.y-island.groundHeight(player.x,player.z),player.z);return hunter;}
// The player never walks into the dead.
export function playerOccupancy({crowd,island,player}){
  const origin={get x(){return player.x;},get z(){return player.z;},get y(){return player.y-island.groundHeight(player.x,player.z);}};
  return (x,z,y)=>crowd.canOccupy(x,z,y-island.groundHeight(x,z),PLAYER_RADIUS,1.8,null,origin);
}

// ---- The threat director (v208, Dead Tide step 3a) ---------------------------------------------
// Replaces v206's stand-in (a steady eight walkers). Kills raise the threat level
// (tide-threat.mjs): the level sets how many dead the shore keeps on the island, how strong
// the next ones rise and which kinds they are. Arrivals keep the stand-in's rules: they rise
// out of the surf at the shoreline points one at a time, 1.4 s apart, never closer than 18 m
// and never where you are looking within 40 m; with no safe point the shore waits and tries
// again rather than bending a rule. The hard cap of 45 living enemies holds whatever the
// target. No waves: nothing waits for the island to be cleared, and nothing pauses.
// v209 (step 3b): rotating zones, the minor points, the interior and weighted choice (below).
export const SHORE_RULES=Object.freeze({
  cap:THREAT_RULES.population.cap,firstDelay:4,interval:1.4,retry:.5,near:18,
  sight:Object.freeze({range:40,halfAngle:Math.PI*55/180}),
  emerge:Object.freeze({time:1.6,depth:1.75})
});
// v207: `ready` holds the shore back until the dead's bodies are built and their shaders
// compiled (Dead Tide builds them behind its title screen). v208: `kills` is the run's kill
// count; `rng` is the game's generator. v209 (step 3b): the spawn network. Only part of it is
// live at once (SPAWN_RULES in tide-threat.mjs): a few major shoreline zones, more as the ranks
// rise, one swapped for another every 40 s; the minor points for a share of arrivals, more often
// as the ranks rise, sometimes twice in a row; the interior from The Swarm, never close to you
// or anywhere in a wide cone of view. Each arrival weighs the points it may use: a moving
// player's flanks and back over the way ahead (distant points ahead stay possible), sides of
// you with fewer dead, points and zones not just used, and shorter routes. Higher ranks bring
// a few up together from one zone, never more than the shore is short. Everything random is
// drawn only when someone comes ashore, so a held shore draws nothing from the generator.
export function createThreatDirector({spawner,zombies,player,look,noise,kills=()=>0,rng=Math.random,ready=()=>true,rules=SHORE_RULES,net=SPAWN_RULES}){
  const network=shoreSpawns(),W=net.weights;
  // Every location as a zone of points ([x, z, 0], each knowing its zone and its number).
  const zones=[...network.major,...network.minor,...network.interior].map(z=>({...z,points:z.points.map(([x,zz])=>[x,zz,0])}));
  // v210: no one rises within `stationClear` m of a station's pad (spec 5.3).
  const pads=islandSites().stations;
  const all=[];for(const z of zones)for(const p of z.points){p.zone=z;p.id=all.length;p.clear=pads.every(s=>Math.hypot(s.x-p[0],s.z-p[1])>=net.stationClear);all.push(p);}
  const majors=zones.filter(z=>z.kind==='major'),minors=zones.filter(z=>z.kind==='minor'),interiors=zones.filter(z=>z.kind==='interior');
  const points=all.filter(p=>p.zone.kind!=='interior');   // the shoreline's points (v206's list)
  const lastPoint=new Float64Array(all.length),lastZone=new Map(),sectors=new Float64Array(W.sector.count),log=[];
  // `held` is a target set by hand (tests and the golden trace hold the shore at 0); `pending`
  // is the kind rolled for the next arrival, kept until it comes ashore.
  let timer,held,pending,clock,openMajor,openInterior,majorAt,interiorAt,follow,last,vx,vz,counts,lastSource;
  function reset(){
    timer=rules.firstDelay;held=null;pending=null;clock=0;openMajor=null;openInterior=[];majorAt=interiorAt=0;follow=null;last=null;vx=vz=0;
    counts={major:0,minor:0,interior:0,arrivals:0,batches:0,follows:0,rotations:0};lastSource=null;lastPoint.fill(-1e9);lastZone.clear();log.length=0;
  }
  reset();
  const level=()=>threatLevel(kills()),target=()=>Math.min(rules.cap,held??targetPopulation(level()));
  const alive=()=>{let n=0;for(const e of zombies)if(!e.dead)n++;return n;};
  function inSight([x,z],range,halfAngle){
    const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz);if(d>range||d<1e-6)return false;
    const yaw=look(),fx=-Math.sin(yaw),fz=-Math.cos(yaw);return Math.acos(Math.max(-1,Math.min(1,(dx*fx+dz*fz)/d)))<halfAngle;
  }
  // The safety rules: the shore's (18 m, the 40 m view cone) and, inland, the interior's own.
  function safe(p,place){
    if(!p.clear)return false;
    if(p.zone.kind==='interior'){if(Math.hypot(p[0]-player.x,p[1]-player.z)<net.interior.near||inSight(p,Infinity,net.interior.halfAngle))return false;}
    else if(inSight(p,rules.sight.range,rules.sight.halfAngle))return false;
    return place.valid(p,rules.near);
  }
  // ---- Which zones are open --------------------------------------------------------------
  const centre=z=>z.points[Math.floor(z.points.length/2)];
  function travel(x,z){   // how welcome a point is, given where you are heading
    const speed=Math.hypot(vx,vz);if(speed<W.moving)return 1;
    const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz)||1e-6,cos=(dx*vx+dz*vz)/(d*speed),T=W.travel;
    return cos>.5?(d>T.far?T.aheadFar:T.ahead):cos<-.3?T.behind:T.side;
  }
  function pickZone(from){
    if(!from.length)return null;let total=0;const w=from.map(z=>{const [x,zz]=centre(z);const v=travel(x,zz);total+=v;return v;});
    let r=rng()*total;for(let i=0;i<from.length;i++){r-=w[i];if(r<0)return from[i];}return from.at(-1);
  }
  function openZones(L){
    const majorsWanted=majorZoneCount(L);
    if(!openMajor){openMajor=[];majorAt=clock+net.rotate;}
    while(openMajor.length<majorsWanted)openMajor.push(pickZone(majors.filter(z=>!openMajor.includes(z))));
    // On a fixed 40 s schedule (applied at the next arrival after it is due).
    if(clock>=majorAt){majorAt+=net.rotate;if(majorAt<=clock)majorAt=clock+net.rotate;const closed=majors.filter(z=>!openMajor.includes(z));
      if(closed.length){const out=Math.floor(rng()*openMajor.length);openMajor.splice(out,1,pickZone(closed));counts.rotations++;}}
    const inner=interiorOpen(L);
    if(inner>0){
      if(!openInterior.length)interiorAt=clock+net.interior.rotate;
      while(openInterior.length<inner)openInterior.push(pickZone(interiors.filter(z=>!openInterior.includes(z))));
      if(clock>=interiorAt){interiorAt+=net.interior.rotate;if(interiorAt<=clock)interiorAt=clock+net.interior.rotate;const closed=interiors.filter(z=>!openInterior.includes(z));
        if(closed.length){const out=Math.floor(rng()*openInterior.length);openInterior.splice(out,1,pickZone(closed));}}
    }
  }
  // ---- Weighing the points ------------------------------------------------------------------
  function countSectors(){
    sectors.fill(0);const n=W.sector.count,range=W.sector.range;
    for(const e of zombies){if(e.dead)continue;const dx=e.walkPos.x-player.x,dz=e.walkPos.z-player.z;if(dx*dx+dz*dz>range*range)continue;sectors[sectorOf(dx,dz)]++;}
  }
  const sectorOf=(dx,dz)=>{const n=W.sector.count;return ((Math.floor((Math.atan2(dz,dx)+Math.PI)/(Math.PI*2)*n)%n)+n)%n;};
  function weight(p,place){
    const R=W.recent,Rt=W.route;let w=travel(p[0],p[1]);
    if(clock-lastPoint[p.id]<R.point)w*=R.pointFactor;
    if(clock-(lastZone.get(p.zone)??-1e9)<R.zone)w*=R.zoneFactor;
    w/=1+W.sector.per*sectors[sectorOf(p[0]-player.x,p[1]-player.z)];
    const d=place.routes?.direction(p[0],p[1],0)?.distance??0;
    return w*(d<Rt.near?1:d<Rt.far?Rt.mid:Rt.beyond);
  }
  function pick(cands,place){
    if(!cands.length)return null;let total=0;const w=cands.map(p=>{const v=weight(p,place);total+=v;return v;});
    let r=rng()*total;for(let i=0;i<cands.length;i++){r-=w[i];if(r<0)return cands[i];}return cands.at(-1);
  }
  const classPoints=cls=>cls==='major'?openMajor.flatMap(z=>z.points):cls==='minor'?minors.flatMap(z=>z.points):openInterior.flatMap(z=>z.points);
  // ---- Coming ashore --------------------------------------------------------------------------
  function spawnOne(kind='walker',p=null,place=null){
    if(!p){   // v206's form: any safe shoreline point, weighed as above (tests use it)
      place=spawner.placement(kind);countSectors();p=pick(points.filter(q=>safe(q,place)),place);if(!p)return false;
    }
    const at=spawner.choosePoint([p],place)||p,e=spawner.spawnKind(kind,at[0],at[1],0);
    e.shoreBorn=true;e.emergeLeft=e.emergeTime=rules.emerge.time;e.emergeDepth=rules.emerge.depth;e.group.position.y-=rules.emerge.depth;
    const z=p.zone;e.spawnZone=z.name;lastPoint[p.id]=clock;lastZone.set(z,clock);counts[z.kind]++;counts.arrivals++;lastSource=z.name;
    log.push({kind:z.kind,zone:z.name,x:at[0],z:at[1],px:player.x,pz:player.z,yaw:look(),t:clock});if(log.length>64)log.shift();
    noise(.4,.05,700);return e;
  }
  function nextKind(){if(!pending){const L=level();pending=walkersOnly(L)?'walker':chooseTideKind(L,rng());}return pending;}
  // Where one of `kind` may rise: a fixed point (a minor point's second arrival, if still safe),
  // one of a zone's points (a batch), or a class's open points, the others as fallbacks.
  function find(kind,{fixed=null,zone=null,cls=null}){
    const place=spawner.placement(kind);
    if(fixed)return safe(fixed,place)?{p:fixed,place}:null;
    if(zone){const p=pick(zone.points.filter(q=>lastPoint[q.id]<clock&&safe(q,place)),place);return p?{p,place}:null;}
    for(const c of [cls,...['major','minor','interior'].filter(c=>c!==cls&&(c!=='interior'||openInterior.length))]){
      const p=pick(classPoints(c).filter(q=>safe(q,place)),place);if(p)return {p,place};}
    return null;
  }
  // One arrival: the kind waiting its turn, or a walker in its place when that kind has nowhere
  // safe to rise (its turn is kept, so the mix is kept). Returns the point used, or null.
  function arriveOne(where){
    const kind=nextKind();let c=find(kind,where);
    if(c){pending=null;spawnOne(kind,c.p,c.place);return c.p;}
    if(kind!=='walker'&&(c=find('walker',where))){spawnOne('walker',c.p,c.place);return c.p;}
    return null;
  }
  function arrive(){
    const L=level();openZones(L);countSectors();
    // A minor point's second arrival, once the first has cleared it (kept for up to
    // `followFor` s; other arrivals carry on meanwhile).
    if(follow){if(clock-follow.at>net.followFor)follow=null;else if(arriveOne({fixed:follow.p})){follow=null;counts.follows++;return true;}}
    const roll=rng(),inner=openInterior.length?interiorShare(L):0;
    const cls=roll<inner?'interior':roll<inner+minorShare(L)?'minor':'major';
    const first=arriveOne({cls});if(!first)return false;
    const z=first.zone;
    if(z.kind==='minor'){if(rng()<minorFollow(L))follow={p:first,at:clock};return true;}
    // At the higher ranks a few more rise from the same zone, at its other points, never more
    // than the shore is short.
    const room=Math.min(batchSize(L)-1,target()-alive());let extra=0;
    for(let i=0;i<room;i++){if(!arriveOne({zone:z}))break;extra++;}
    if(extra)counts.batches++;
    return true;
  }
  return {points,network,zones,
    get level(){return level();},get rank(){return threatRank(level()).name;},get pending(){return pending;},
    get target(){return target();},set target(n){held=Math.max(0,Math.min(rules.cap,n));},
    get openZones(){return (openMajor||[]).map(z=>z.name);},get openInterior(){return openInterior.map(z=>z.name);},
    get counts(){return {...counts};},get lastSource(){return lastSource;},get follow(){return follow?follow.p.zone.name:null;},get log(){return log;},
    get velocity(){return {x:vx,z:vz};},
    alive,spawnOne,
    // Whether the shore will try to send one soon (its routes must be current for that).
    wanting(){return timer<=.7&&ready()&&alive()<target();},
    reset,
    update(dt){
      // Your heading, smoothed, for weighing the points (no draws: nothing random here).
      if(dt>0){if(last){const k=1-Math.exp(-dt*3);vx+=((player.x-last.x)/dt-vx)*k;vz+=((player.z-last.z)/dt-vz)*k;}else last={x:0,z:0};last.x=player.x;last.z=player.z;clock+=dt;}
      timer-=dt;if(timer>0)return;
      if(!ready()){timer=rules.retry;return;}
      if(alive()>=target()){timer=rules.retry;return;}
      timer=arrive()?rules.interval:rules.retry;
    }};
}

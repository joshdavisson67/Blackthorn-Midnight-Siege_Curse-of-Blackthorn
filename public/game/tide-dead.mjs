import * as T from './three.module.js';
import {PLAYER_RADIUS} from './crowd.mjs?v=123';
import {shoreSpawns} from './island.mjs?v=206';
import {THREAT_RULES,threatLevel,threatRank,targetPopulation,walkersOnly,chooseTideKind} from './tide-threat.mjs?v=208';

// The dead come ashore (v206, Dead Tide step 2, slice 3): the island as the shared enemy
// modules see it, and (v208, step 3a) the threat director that sends them.
//
// The island as one floor: the shared enemy AI, spawner and crowd were written for the
// mansion's flat floors, where an enemy on your floor is within half a metre of your
// height. On the island the ground rises 14 m, so the enemies keep their height relative to
// the ground under them (0 on the ground, the deck's height on the shack's deck), and so does
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
// (Rotating zones, minor points and the interior come in step 3b.)
export const SHORE_RULES=Object.freeze({
  cap:THREAT_RULES.population.cap,firstDelay:4,interval:1.4,retry:.5,near:18,
  sight:Object.freeze({range:40,halfAngle:Math.PI*55/180}),
  emerge:Object.freeze({time:1.6,depth:1.75})
});
// v207: `ready` holds the shore back until the dead's bodies are built and their shaders
// compiled (Dead Tide builds them behind its title screen). v208: `kills` is the run's kill
// count; `rng` is the game's generator, drawn from only when the level's mix has more than
// walkers (so the walkers-only opening plays exactly as v207's stand-in did).
export function createThreatDirector({spawner,zombies,player,look,noise,kills=()=>0,rng=Math.random,ready=()=>true,rules=SHORE_RULES}){
  const network=shoreSpawns(),points=[...network.major,...network.minor].flatMap(z=>z.points.map(([x,zz])=>[x,zz,0]));
  // `held` is a target set by hand (tests and the golden trace hold the shore at 0); `pending`
  // is the kind rolled for the next arrival, kept until it comes ashore.
  let timer=rules.firstDelay,held=null,pending=null;
  const level=()=>threatLevel(kills()),target=()=>Math.min(rules.cap,held??targetPopulation(level()));
  const alive=()=>{let n=0;for(const e of zombies)if(!e.dead)n++;return n;};
  function inSight([x,z]){
    const dx=x-player.x,dz=z-player.z,d=Math.hypot(dx,dz);if(d>rules.sight.range||d<1e-6)return false;
    const yaw=look(),fx=-Math.sin(yaw),fz=-Math.cos(yaw);return Math.acos(Math.max(-1,Math.min(1,(dx*fx+dz*fz)/d)))<rules.sight.halfAngle;
  }
  // One of the dead out of the surf, or false if no point is safe for its kind right now.
  function spawnOne(kind='walker'){
    const place=spawner.placement(kind),options=points.filter(p=>!inSight(p)&&place.valid(p,rules.near));
    const at=spawner.choosePoint(options,place);if(!at)return false;
    const e=spawner.spawnKind(kind,at[0],at[1],0);
    e.shoreBorn=true;e.emergeLeft=e.emergeTime=rules.emerge.time;e.emergeDepth=rules.emerge.depth;e.group.position.y-=rules.emerge.depth;
    noise(.4,.05,700);return e;
  }
  function nextKind(){if(!pending){const L=level();pending=walkersOnly(L)?'walker':chooseTideKind(L,rng());}return pending;}
  // The next arrival. A kind with no safe point right now (a brute's wider routes may not
  // reach you) keeps its turn for the next arrival, and a walker comes ashore in its place,
  // so the shore never stalls on one kind and the mix is kept.
  function arrive(){
    const kind=nextKind();let e=spawnOne(kind);if(e){pending=null;return e;}
    if(kind!=='walker'&&(e=spawnOne('walker')))return e;
    return false;
  }
  return {points,network,
    get level(){return level();},get rank(){return threatRank(level()).name;},get pending(){return pending;},
    get target(){return target();},set target(n){held=Math.max(0,Math.min(rules.cap,n));},
    alive,spawnOne,
    // Whether the shore will try to send one soon (its routes must be current for that).
    wanting(){return timer<=.7&&ready()&&alive()<target();},
    reset(){timer=rules.firstDelay;held=null;pending=null;},
    update(dt){
      timer-=dt;if(timer>0)return;
      if(!ready()){timer=rules.retry;return;}
      if(alive()>=target()){timer=rules.retry;return;}
      timer=arrive()?rules.interval:rules.retry;
    }};
}

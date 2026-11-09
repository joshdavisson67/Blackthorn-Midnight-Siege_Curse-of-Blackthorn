import * as T from './three.module.js';
import {BRUTE} from './brute.mjs?v=30';
import {FERAL} from './feral.mjs?v=204';
import {enemyBody} from './crowd.mjs?v=123';
import {staggerLimits} from './combat-feedback.mjs?v=184';
import {DOG_SPEED_MULTIPLIER,RARE_DOG_SPEED_MULTIPLIER} from './zombie-dog.mjs?v=183';
import {tagZombie,CRAWL} from './zombies.mjs?v=183';
import {createLife} from './zombie-life.mjs?v=176';
import {BUILD,rollBuild,applyBuild} from './zombie-build.mjs?v=177';
import {rollInjury,applyInjury} from './zombie-injuries.mjs?v=178';
import {LURKER,setupLurkerGlow,disposeLurkerGlow} from './lurker.mjs?v=179';
import {rollFace,applyFace,resetFaceGeometry,disposeFace} from './zombie-faces.mjs?v=183';

// Enemy spawner (v195, Dead Tide step 1): makes every kind of enemy, decides where
// one may appear and picks the spot, for any map. Moved from game.js unchanged;
// scripts/golden-trace.mjs checks the mansion plays identically. A mode passes the
// same map (level) it gives the enemy AI, plus its session (run) and the enemy
// stats for the current difficulty (rules); the README's version 195 section lists
// every field. When and what to spawn stays with each mode's own director.
export function createEnemySpawner({level,run,rules}){
  const {colliders,isBlocked,supportBelow,floorHeight,crouchAt,canStand,crowd}=level;
  const {player,zombies,scene,enemyAssets,rng,rand}=run;
  function makeZombie(x,z,brute=false,dog=false,rareDog=false,y=0,feral=false,asset={}){
    if(feral){dog=rareDog=brute=false;}else if(rareDog){dog=true;brute=false;}
    const rig=enemyAssets.instantiate({rng,brute,dog,rareDog,feral,...asset}),cfg=rules.enemyStats(),hp=cfg.health*(dog?.85:brute?BRUTE.healthMultiplier:1)*(rareDog?2:1);
    const e={...rig,walkPos:new T.Vector3(x,y,z),floorY:y,hp,maxHp:hp,speed:cfg.speed*(feral?FERAL.speedMultiplier:rareDog?RARE_DOG_SPEED_MULTIPLIER:dog?DOG_SPEED_MULTIPLIER:brute?.77:rand(...BUILD.speed)),attack:rand(.2,1),enraged:false,dead:false,death:0,groan:rand(4,12),pathTimer:0,clearPath:false};
    const body=enemyBody(e);e.radius=body.radius;
    e.staggerProfile=staggerLimits(e);e.staggerMeter=e.staggerLeft=e.staggerCooldown=0;e.staggerShotId=-1;e.staggerShotStrength=0;
    e.crouch=e.brute&&crouchAt(x,z,y)?1:0;e.bodyHeight=e.crouch?BRUTE.crouchHeight:body.height;
    e.routeSide=rng()<.5?-1:1;e.flank=rand(.25,1)*e.routeSide;e.stuck=0;e.waypoint=null;
    e.navigation={seed:Math.floor(rng()*2147483647),crowding:(x,z,y)=>crowd.density(x,z,y,e)};
    e.canOccupy=(x,z,y)=>crowd.canOccupy(x,z,y,e.radius,e.bodyHeight,e,e.walkPos);
    // v175: a temperament of its own (lurch, surges, weave, stumbles, lunges).
    if(!dog){e.life=createLife(e.navigation.seed,{feral,brute});e.vigor=e.life.vigor;}
    // v177: and a build of its own: how it stands, holds its arms and carries its head.
    if(!dog)applyBuild(e,rollBuild(e.navigation.seed,{feral,brute}));
    // v183: and a face of its own: one of its body's heads, proportions, jaw hang and eye glow.
    if(!dog)applyFace(e,rollFace(e.navigation.seed,enemyAssets.faces.count(e.templateIndex)),enemyAssets.faces);
    scene.add(e.group);e.group.position.set(x,Math.abs(y)>.1?y-.02:floorHeight(x,z)-.02,z);tagZombie(e,e);zombies.push(e);return e;
  }
  // v178: natural spawns may arrive battle-worn (missing arm or jaw, crushed
  // skull, legless and crawling, something driven through them).
  function injure(e){
    if(e.dog||e.elite)return e;
    const injury=rollInjury(e.navigation.seed,{brute:e.brute,feral:e.feral});
    if(!injury.major&&!injury.legless&&!injury.props.length)return e;
    // A crushed skull is made from the body's own head shape.
    if(injury.major==='skull')resetFaceGeometry(e);
    applyInjury(e,injury,enemyAssets.injuries);
    if(injury.legless){e.crawling=true;e.crawl=1;e.crawlDrop=0;e.bodyHeight=CRAWL.height;}
    return e;
  }
  // v179: the Grotesque Lurker. Hunched, boil-covered, belly stitched over a
  // blinking glow; lurches at 125% speed, charges at double that from 12 yards
  // and bursts on reaching you or when killed.
  function makeLurker(x,z,y=0){
    const e=makeZombie(x,z,false,false,false,y,false,{lurker:true}),cfg=rules.enemyStats();
    e.lurker=true;e.style='grotesque lurker';e.speed=cfg.speed*LURKER.speed;e.hp=e.maxHp=e.maxHp*LURKER.health;
    // Bent double, arms hanging, every step a heavy lurch.
    e.gait={...e.gait,hunch:.34,arms:'dangle',bob:1.35,sway:1.4,attack:'grabber'};e.limp=.3;
    if(e.build)e.build={...e.build,kneeBend:.3,headJut:-.32,spineBend:e.build.spineBend*.5};
    if(e.life){Object.assign(e.life,{type:'lurker',rhythm:.36,lungeChance:0,stumbleIn:1e9,stumbleEvery:[1e9,1e9],weave:e.life.weave*.4});e.life.norm=1+.26*(e.life.rhythm**2+e.life.surge**2);e.vigor=e.life.vigor=1.5;}
    e.attack=1e9;e.lurkerCharging=false;e.lurkerFuse=0;setupLurkerGlow(e);
    return e;
  }
  // Make an enemy of a spawn kind: walker, brute, dog, ashfang, feral or lurker.
  function spawnKind(kind,x,z,y){return kind==='lurker'?makeLurker(x,z,y):injure(makeZombie(x,z,kind==='brute',kind==='dog'||kind==='ashfang',kind==='ashfang',y,kind==='feral'));}
  // Where an enemy of this kind may appear: open, supported floor it can stand on,
  // more than `near` metres from the player, on routes that reach them, and clear of
  // the crowd. routes are the kind's own (brutes use the wide-body routes).
  function placement(kind){
    const body=enemyBody({brute:kind==='brute',dog:kind==='dog'||kind==='ashfang',rareDog:kind==='ashfang'}),nav=level.nav,routes=kind==='brute'?nav.brutes:nav;
    function valid([x,z,y=0],near=10){
      const radius=Math.max(.48,body.radius),height=kind==='brute'&&crouchAt(x,z,y)?BRUTE.crouchHeight:body.height;
      if(isBlocked(x,z,radius,colliders,undefined,y,height)||Math.abs(supportBelow(x,z,y)-y)>.01)return false;
      if(!canStand(x,z,y,radius))return false;
      if(Math.hypot(x-player.x,z-player.z)<=near||!nav.direction(x,z,y)?.reachable||!routes.direction(x,z,y)?.reachable)return false;
      if(!crowd.canOccupy(x,z,y,body.radius+.18,height))return false;
      return true;
    }
    return {valid,routes};
  }
  // Choose one of the valid spawn points, preferring ones whose route to the player is
  // under 42 m, then under 80 m; nudge it by up to 20 cm when that spot is still valid.
  function choosePoint(reachable,{valid,routes}){
    let options=reachable.filter(([x,z,y=0])=>routes.direction(x,z,y).distance<42);
    if(!options.length)options=reachable.filter(([x,z,y=0])=>routes.direction(x,z,y).distance<80);
    if(!options.length)options=reachable;
    if(!options.length)return null;
    const point=options[Math.floor(rng()*options.length)],y=point[2]||0;
    let candidate=[point[0]+rand(-.2,.2),point[1]+rand(-.2,.2),y];
    if(!valid(candidate))candidate=point;
    return [candidate[0],candidate[1],y];
  }
  function disposeEnemy(e){disposeLurkerGlow(e);disposeFace(e);if(e.sharedAssets)return;const {geometries:sharedGeo,materials:sharedMat}=run.sharedResources(),geometries=new Set(),materials=new Set();e.group.traverse(o=>{if(o.isMesh){if(!sharedGeo.has(o.geometry))geometries.add(o.geometry);if(!sharedMat.has(o.material))materials.add(o.material);}});for(const g of e.resources?.geometries||[])geometries.add(g);for(const m of e.resources?.materials||[])materials.add(m);for(const g of geometries)g.dispose();for(const m of materials)m.dispose();}
  return {makeZombie,makeLurker,injure,spawnKind,placement,choosePoint,disposeEnemy};
}

import * as T from './three.module.js';
import {BRUTE} from './brute.mjs?v=30';
import {FERAL} from './feral.mjs?v=206';
import {ENRAGE} from './enrage.mjs?v=130';
import {SPREAD} from './crowd.mjs?v=123';
import {advanceStagger} from './combat-feedback.mjs?v=205';
import {animateZombieDog} from './zombie-dog.mjs?v=183';
import {animateZombie,updateZombieDeath,CRAWL,LIMP} from './zombies.mjs?v=183';
import {updateLife,settleLife} from './zombie-life.mjs?v=176';
import {INJURY} from './zombie-injuries.mjs?v=178';
import {LURKER,updateLurkerGlow} from './lurker.mjs?v=179';

// Enemy AI (v194, Dead Tide step 1): how enemies hunt, route, crowd, walk, turn and
// strike on any map. Moved from game.js unchanged; scripts/golden-trace.mjs checks
// the mansion plays identically. A mode passes its map (level), its session (run)
// and its own rules; the README's version 194 section lists every field.
export function createEnemyAI({level,run,rules}){
  const {colliders,isBlocked,supportBelow,floorHeight,rampHeight,move,crouchAt,crowd}=level;
  const {player,camera,zombies,scene,rand,tone,noise,hurtPlayer,gameOver,killZombie,disposeEnemy,lurkerBursts,lurkerBurst}=run;
  const boss=rules.boss,clamp=T.MathUtils.clamp,decoyLook=new T.Vector3();
  // v206: where an enemy at floor height y stands. A map whose ground rises and falls (Dead
  // Tide's island) keeps each enemy's y relative to the ground under it and passes
  // level.standAt; the mansion's floors are flat and keep this, its own rule.
  const standAt=level.standAt||((x,z,y)=>Math.abs(y)>.1?y:floorHeight(x,z));
  function hasClearPath(x,z,tx,tz,y=0,ty=y,radius=.35,height=1.8){if(Math.abs(ty-y)>.55)return false;const dist=Math.hypot(tx-x,tz-z);for(let t=.25;t<dist;t+=.25){const f=t/dist,xx=x+(tx-x)*f,zz=z+(tz-z)*f;const ramp=rampHeight(xx,zz);if((ramp!==null&&ramp>y+.30&&y+height>ramp-.20)||isBlocked(xx,zz,radius,colliders,undefined,y,height)||Math.abs(supportBelow(xx,zz,y,.3)-y)>.31)return false;}return true;}
  // Bodies fall in world heights; a map with relative floors passes its own (v206).
  const corpseBlocked=level.corpseBlocked||function(x,z,r,y){return isBlocked(x,z,r,colliders,undefined,y-r,2*r);};
  const corpseFloor=level.corpseFloor||function(x,z,y){const h=supportBelow(x,z,y+.2);return Math.abs(h)>.1?h+.008:floorHeight(x,z)+.008;};
  // A blocked enemy shoulders the neighbour in its way a little to the side.
  // Only on flat floors, never mid-attack, and only into genuinely free space.
  function shoulderNeighbour(e,dx,dz,dt){
    const p=e.walkPos;if(rampHeight(p.x,p.z)!==null)return;
    let blocker=null,best=Infinity;
    for(const o of zombies){
      if(o===e||o.dead||o.emergeLeft>0||Math.abs(o.walkPos.y-p.y)>.5)continue;
      const ox=o.walkPos.x-p.x,oz=o.walkPos.z-p.z,d=Math.hypot(ox,oz);
      if(d>e.radius+o.radius+.14||(ox*dx+oz*dz)/Math.max(d,1e-6)<.5||d>=best)continue;best=d;blocker=o;
    }
    if(!blocker||blocker.attackTime>=0)return;
    const q=blocker.walkPos;if(rampHeight(q.x,q.z)!==null)return;
    const side=Math.sign((q.x-p.x)*(-dz)+(q.z-p.z)*dx)||e.routeSide||1,force=SPREAD.shove*dt*(e.brute?1.4:1)/(blocker.brute?3:1);
    move(q,-dz*side*force,dx*side*force,blocker.radius,blocker);
  }
  function updateEnemies(dt){crowd.plan(player.y);while(lurkerBursts.length)lurkerBurst(lurkerBursts.shift());for(let i=zombies.length-1;i>=0;i--){const e=zombies[i];
  if(e.dead){if(updateZombieDeath(e,dt,corpseBlocked,corpseFloor)){scene.remove(e.group);disposeEnemy(e);zombies.splice(i,1);}continue;}
  if(e.waking){animateZombie(e,dt,99,0);continue;}
  if(e.warCry>0){e.warCry-=dt;if(e.warCry<=0)boss.endWarCry(e);}
  if(e.emergeLeft>0){
    e.emergeLeft=Math.max(0,e.emergeLeft-dt);
    const floor=standAt(e.walkPos.x,e.walkPos.z,e.floorY)-.02;e.group.position.y=floor-(e.emergeDepth||1.65)*(e.emergeLeft/(e.emergeTime||1.05))**2;
    animateZombie(e,dt,99,0);continue;
  }
  const decoy=rules.decoy(e);
  advanceStagger(e,dt);
  const onDecoy=!!decoy,hunt=onDecoy?decoy:player;
  const nav=level.nav,routes=e.brute?nav.brutes:nav,p=e.walkPos,dist=Math.hypot(hunt.x-p.x,hunt.z-p.z),oldX=p.x,oldZ=p.z,sameFloor=Math.abs(hunt.y-p.y)<.55;
  if(e.brute){
    // Duck ahead of the upper landing and mausoleum, before their lower headers.
    const crouch=crouchAt(p.x,p.z,p.y)?1:0;e.crouch=T.MathUtils.damp(e.crouch||0,crouch,12,dt);if(e.boss)e.crouch=Math.min(e.crouch,.3);/* Sir Blackthorn only stoops; his walker rig clears the tomb door. */
    e.bodyHeight=crouch||e.crouch>.02?BRUTE.crouchHeight:BRUTE.height;
  }
  e.pathTimer-=dt;
  if(e.pathTimer<=0){
    e.clearPath=sameFloor&&dist<12&&hasClearPath(p.x,p.z,hunt.x,hunt.z,p.y,hunt.y,e.brute?e.radius:.35,e.brute?e.bodyHeight:1.8);
    e.flankClear=false;
    if(!onDecoy&&e.clearPath&&dist>2.5){const flank=e.flank*Math.min(1,(dist-2.5)/4);e.flankClear=hasClearPath(p.x,p.z,player.x-(player.z-p.z)/dist*flank,player.z+(player.x-p.x)/dist*flank,p.y,player.y,e.brute?e.radius:.35,e.brute?e.bodyHeight:1.8);}
    e.waypoint=routes.direction(p.x,p.z,p.y,e.navigation);
    // Keep a shared-out slot only if it is open floor with a clear walk to it.
    e.slotScale=0;
    if(!onDecoy&&e.clearPath&&e.engaged)for(const scale of [1,.5]){
      const t=crowd.slotTarget(e,scale),r=e.brute?e.radius:.35;
      if(!isBlocked(t.x,t.z,r,colliders,undefined,p.y,e.bodyHeight)&&hasClearPath(p.x,p.z,t.x,t.z,p.y,p.y,r,e.brute?e.bodyHeight:1.8)){e.slotScale=scale;break;}
    }
    e.pathTimer=.22+(e.phase%1)*.10;
  }
  const casting=e.boss&&boss.update(e,dt,dist,sameFloor);
  if(e.lurker){
    // v179: never swings; charges from 12 yards and bursts on reaching you.
    e.attack=1e9;updateLurkerGlow(e,dt);
    if(!e.lurkerCharging&&sameFloor&&dist<=LURKER.chargeRange&&(e.clearPath||dist<4)){e.lurkerCharging=true;tone(66,.55,.09,'sawtooth',150);noise(.3,.08,900);}
    if(e.lurkerFuse>0){
      e.lurkerFuse-=dt;e.group.scale.setScalar(e.lurkerScale*(1+.18*Math.min(1,1-e.lurkerFuse/LURKER.fuse)));
      if(e.lurkerFuse<=0){killZombie(e,false,{source:'lurkerSelf',part:'torso',direction:new T.Vector3(0,1,0),force:.4});continue;}
    }else if(sameFloor&&dist<LURKER.trigger&&Math.abs(player.y-p.y)<.7&&hasClearPath(p.x,p.z,player.x,player.z,p.y,player.y)){e.lurkerFuse=LURKER.fuse;e.lurkerScale=e.group.scale.x;tone(150,.32,.07,'sine',520);}
  }
  // Away from a decoy, follow the usual route toward the player.
  let tx=hunt.x,tz=hunt.z;const climbTo=!onDecoy?rules.detour(e,p):null;
  if((dist>1.3||!sameFloor)&&(!sameFloor||!e.clearPath)){
    if(!e.waypoint||Math.hypot(e.waypoint.x-p.x,e.waypoint.z-p.z)<.18)e.waypoint=routes.direction(p.x,p.z,p.y,e.navigation);
    if(e.waypoint){tx=e.waypoint.x;tz=e.waypoint.z;}
  }else if(!onDecoy&&e.engaged&&e.slotScale>0){
    const t=crowd.slotTarget(e,e.slotScale);tx=t.x;tz=t.z;
  }else if(!onDecoy&&dist>2.5&&e.flankClear){
    const flank=e.flank*Math.min(1,(dist-2.5)/4);
    const fx=tx-(player.z-p.z)/dist*flank,fz=tz+(player.x-p.x)/dist*flank;
    tx=fx;tz=fz;
  }
  if(climbTo){tx=climbTo.x;tz=climbTo.z;}
  let dx=tx-p.x,dz=tz-p.z,len=Math.hypot(dx,dz),heading=Math.atan2(hunt.x-p.x,hunt.z-p.z);
  if(len>.1&&(dist>1.03||!sameFloor)&&!casting){
    dx/=len;dz/=len;crowd.steer(e,dx,dz,run.elapsed);dx=e.steerX;dz=e.steerZ;
    // v175: each walker's own rhythm, surges, weave, stumbles and lunges.
    const life=e.life&&!e.elite&&!e.crawling&&!casting?updateLife(e,dt,{dist,sameFloor,clear:e.clearPath,stairs:rampHeight(p.x,p.z)!==null||!!climbTo,attackReady:e.attack<=.3&&e.attackTime<0,moved:e.lastMoved||0,hobble:e.hobble||0}):(settleLife(e,dt),null);
    if(e.lurker){e.lurkerLean=(e.lurkerLean||0)+((e.lurkerCharging?.85:0)-(e.lurkerLean||0))*(1-Math.exp(-dt*6));e.lungeW=Math.max(e.lungeW||0,e.lurkerLean);}
    if(life?.weave){const c=Math.cos(life.weave),sn=Math.sin(life.weave),wx=dx*c+dz*sn,wz=dz*c-dx*sn;dx=wx;dz=wz;}
    // v139: ease the walking direction (~0.14s) so grid-cell routes curve
    // instead of zig-zagging the body from cell to cell. Sharp turns (over ~70°)
    // are taken at once so nobody grinds into a wall turning round.
    {const k=(e.walkDirX??dx)*dx+(e.walkDirZ??dz)*dz<.3?1:1-Math.exp(-dt*7);let sx=(e.walkDirX??dx)+(dx-(e.walkDirX??dx))*k,sz=(e.walkDirZ??dz)+(dz-(e.walkDirZ??dz))*k;const n=Math.hypot(sx,sz);if(n>.2){sx/=n;sz/=n;}else{sx=dx;sz=dz;}e.walkDirX=sx;e.walkDirZ=sz;dx=sx;dz=sz;}
    const pace=(e.staggerLeft>0?0:1)*(e.crawling?(e.crawlDrop>0?0:CRAWL.speed):1)*rules.surge(e)*(e.lurkerCharging?LURKER.charge:1)*(e.attackTime>=0?(e.dog?.65:.4):1)*(e.legHit>0?.55:1)*(e.crawling||e.elite?1:1-LIMP.slow*(e.hobble||0)*(e.brute?LIMP.bruteSlow:1))*(e.warCry>0?boss.rules.cry.speed:1)*(life?life.pace:1),step=e.speed*rules.speedScale(e)*dt*pace;
    move(p,dx*step,dz*step,e.radius,e);
    const moved=Math.hypot(p.x-oldX,p.z-oldZ);e.lastMoved=moved;
    e.stuck=moved<step*.15?e.stuck+dt:0;
    if(e.stuck>.35&&dist>1.8){
      // Slide around a neighbour when there is room; solid walls and bodies still
      // decide whether that step is possible. Never push or teleport the crowd.
      const side=e.routeSide*(Math.floor(e.stuck/1.2)%2?-1:1),remaining=Math.max(0,step-moved);
      move(p,-dz*side*remaining,dx*side*remaining,e.radius,e);
    }
    if(e.stuck>.12)shoulderNeighbour(e,dx,dz,dt);
    // v139: face a smoothed walking direction (~0.35s), not each frame's raw
    // step, so crowd steering and wall slides do not swing the body side to side.
    {const k=1-Math.exp(-dt*2.4),vx=(p.x-oldX)/Math.max(dt,1e-4),vz=(p.z-oldZ)/Math.max(dt,1e-4);e.faceX=(e.faceX??vx)+(vx-(e.faceX??vx))*k;e.faceZ=(e.faceZ??vz)+(vz-(e.faceZ??vz))*k;
     if(Math.hypot(e.faceX,e.faceZ)>.25)heading=Math.atan2(e.faceX,e.faceZ);}
  }else{settleLife(e,dt);e.lastMoved=0;}

  // Turn at a limited, eased rate (v136): bodies swing round with weight rather
  // than snapping to every steering wobble; the head leads, tracking the player.
  const turn=Math.atan2(Math.sin(heading-e.group.rotation.y),Math.cos(heading-e.group.rotation.y)),maxTurn=(e.dog?6:e.feral?5:e.brute?2.4:3.2)*dt,yawStep=clamp(turn*(1-Math.exp(-dt*6)),-maxTurn,maxTurn);e.group.rotation.y+=yawStep;e.turnRate=T.MathUtils.lerp(e.turnRate||0,yawStep/Math.max(dt,1e-4),1-Math.exp(-dt*10));
  e.floorY=p.y;e.group.position.set(p.x,standAt(p.x,p.z,p.y)-.02,p.z);e.attack-=dt*rules.attackRate(e);const contact=(e.dog?animateZombieDog:animateZombie)(e,dt,sameFloor?dist:99,Math.hypot(p.x-oldX,p.z-oldZ),onDecoy?decoyLook.set(hunt.x,hunt.y+.45,hunt.z):camera.position);if(casting)boss.pose(e);
  // A decoy cannot be hurt; the mode decides what a blow at it does.
  if(onDecoy){if(contact&&!(e.staggerLeft>0)&&dist<1.7&&sameFloor)rules.decoyStruck(e);}
  else if(contact&&!casting&&!(e.staggerLeft>0)&&dist<1.7&&Math.abs(player.y-p.y)<.7&&hasClearPath(p.x,p.z,player.x,player.z,p.y,player.y)){
  hurtPlayer(rules.baseDamage()*(e.boss?boss.rules.meleeMultiplier:e.warden?1.4*boss.warden.damageMultiplier:e.feral?FERAL.damageMultiplier:e.dog?.85:e.brute?1.4:1)*(e.enraged&&!e.elite?ENRAGE.damageMultiplier:1)*(e.warCry>0?boss.rules.cry.damage:1)*(e.armless?INJURY.oneArmDamage:1),p);noise(.15,.08,600);tone(70,.14,.06,'sine');if(run.health<=0)gameOver();}
  e.groan-=dt;if(e.groan<=0){if(dist<12)tone(e.lurker?38:e.feral?210:e.rareDog?155:e.dog?105:e.brute?45:rand(60,100),e.dog?.22:.6,.035*(1-dist/14),'sawtooth',35);e.groan=rand(6,15);}}}
  return {updateEnemies,hasClearPath};
}

import {PLAYER_RADIUS} from './crowd.mjs?v=123';
import {armorRank} from './armor.mjs?v=94';

// The player's run (v198, Dead Tide step 1), for any map: the run's own values, and
// walking, jumping, landing, getting hurt and recovering. Moved from game.js
// unchanged; scripts/golden-trace.mjs checks the mansion plays identically. A mode
// passes its map (level) and session (run); the README's version 198 section lists
// every field.
//
// The values one run of the game keeps. Every mode starts a run from these; the
// mansion's resetRun then sets each for a fresh run.
export function createRunState(){
  return {
    health:100,maxHealth:100,armor:0,armorMax:0,armorTier:0,lastHurt:-20,runTime:0,  // the player
    points:500,totalScore:0,kills:0,perkOwned:new Set(),                            // essence, kills and perks
    inventory:{},weapon:'glock',reloadLeft:0,reloadDuration:0,shotTimer:0,shotId:0,  // weapons
    grenades:3,grenadeTime:0,grenadeCooldown:0,doubleTime:0,                        // grenades and power-ups
    walkPhase:0,jumpV:0,feetY:0,grounded:true                                       // footing
  };
}
export function createPlayer({level,run,state:S}){
  const {colliders,supportBelow,move,updateHeight}=level;
  const {player,tone,noise,rumble,onHurt,gameOver}=run;
  let footstepTime=0;
  // Walking (sprinting, aiming and Nightstride set the pace), footsteps, and the
  // vertical move: jumping, falling, stairs and landing.
  function walk(dt,x,z,{sprint,aiming:aimingWeapon,yaw:lookYaw}){
    const len=Math.hypot(x,z);if(len){const norm=sprint?len:Math.max(1,len);x/=norm;z/=norm;const speed=(sprint?5.6:aimingWeapon?2.1:3.6)*(S.perkOwned.has('stride')?1.3:1);move(player,(x*Math.cos(lookYaw)+z*Math.sin(lookYaw))*speed*dt,(-x*Math.sin(lookYaw)+z*Math.cos(lookYaw))*speed*dt,.32);S.walkPhase+=dt*(sprint?13:9);footstepTime+=dt;if(footstepTime>(sprint?.27:.43)&&S.feetY===0){tone(70,.065,.032,'sine',45);noise(.035,.015,350);footstepTime=0;}}
    const vertical=updateHeight(player,S.jumpV,dt,S.grounded,1.8,PLAYER_RADIUS,colliders);S.jumpV=vertical.velocity;S.grounded=vertical.grounded;S.feetY=S.grounded?0:Math.max(0,player.y-supportBelow(player.x,player.z,player.y));
  }
  // From the second armor tier (Nano Shield rank 1) up, armor regrows after that
  // rank's delay. Health returns 6 s after the last hit, at 11 a second.
  function recover(dt,playing){
    if(playing&&S.armorTier>=2&&S.armor<S.armorMax){const rank=armorRank(S.armorTier),regenSeconds=rank.regenDelay===0?dt:Math.min(dt,Math.max(0,S.runTime-S.lastHurt-rank.regenDelay));S.armor=Math.min(S.armorMax,S.armor+regenSeconds*rank.regenRate);}
    if(S.runTime-S.lastHurt>6&&S.health<S.maxHealth)S.health=Math.min(S.maxHealth,S.health+dt*11);
  }
  // Armor soaks up a hit first; whatever is left comes off health.
  function hurtPlayer(amount,source){rumble(Math.min(1,.35+amount/60),.5,amount>=30?260:170);const absorbed=Math.min(S.armor,amount);S.armor-=absorbed;S.health-=amount-absorbed;S.lastHurt=S.runTime;onHurt(source,absorbed===amount);if(S.health<=0)gameOver();}
  return {walk,recover,hurtPlayer};
}

import {CELLAR,inCellar,isCellarOpen} from './cellar-layout.mjs?v=28';
import {OLIVIA_ATTIC as A,isAtticOpen} from './vertical.mjs?v=204';

// v174: no safe corners. Hold the storm cellar or Olivia's room for a few
// seconds and the dead start clawing up through the floor in there with you,
// at the far side of the room, on one in every three spawns.
export const CAMP_RULES=Object.freeze({
  grace:4,          // seconds inside before the floor starts giving way
  every:3,          // one spawn in this many rises inside the room
  minDistance:3,    // never under the player's feet
  emergeTime:1.05,emergeDepth:1.65,
});

export const CAMP_AREAS=Object.freeze([
  Object.freeze({
    id:'cellar',name:'STORM CELLAR',y:CELLAR.y,cap:6,brutes:true,
    open:()=>isCellarOpen(),
    contains:p=>p.y<CELLAR.y+1.5&&inCellar(p.x,p.z),
    box:[CELLAR.x-CELLAR.w/2+.6,CELLAR.x+CELLAR.w/2-.6,CELLAR.entryZ+.6,CELLAR.z+CELLAR.d/2-.6],
  }),
  Object.freeze({
    // Brutes can't stand up under the garret ceiling.
    id:'attic',name:'OLIVIA’S ROOM',y:A.y,cap:3,brutes:false,
    open:()=>isAtticOpen(),
    contains:p=>p.y>A.y-.4&&Math.abs(p.x-A.x)<=A.w/2&&Math.abs(p.z-A.z)<=A.d/2,
    box:[A.x-A.w/2+.45,A.x+A.w/2-.45,A.z-A.d/2+.45,A.z+A.d/2-.45],
  }),
]);

export function campAreaAt(p){return CAMP_AREAS.find(a=>a.open()&&a.contains(p))||null;}
export function campKindAllowed(area,kind){return !!area&&(area.brutes||kind!=='brute');}

// Floor points in the room, farthest from the player first.
export function campCandidates(area,player,step=.6){
  const [x0,x1,z0,z1]=area.box,out=[];
  for(let x=x0;x<=x1+1e-6;x+=step)for(let z=z0;z<=z1+1e-6;z+=step){
    const d=Math.hypot(x-player.x,z-player.z);if(d>=CAMP_RULES.minDistance)out.push([x,z,area.y,d]);
  }
  return out.sort((a,b)=>b[3]-a[3]);
}

// Tracks how long the player has held a room and whose turn it is to rise there.
export function createCampWatch(){
  let area=null,time=0,count=0,warned=false;
  return {
    update(dt,player){const a=campAreaAt(player);if(a!==area){area=a;time=0;count=0;warned=false;}else if(a)time+=dt;},
    // The room the player is camping in, once the grace period is over.
    get area(){return area&&time>=CAMP_RULES.grace?area:null;},
    get time(){return time;},
    // Called once per wave spawn while camping: true on the first, then every third.
    take(){const due=count%CAMP_RULES.every===0;count++;return due;},
    warn(){if(warned)return false;warned=true;return true;},
    reset(){area=null;time=0;count=0;warned=false;},
  };
}

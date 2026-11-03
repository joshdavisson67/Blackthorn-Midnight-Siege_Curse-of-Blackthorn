// v177: every walker its own build. No new models: the same four bodies are
// re-posed per zombie through their existing joints, so one stands with a
// collapsed shoulder and a crooked neck, another bow-legged and crouched, a
// third ramrod straight with its arms flung wide. Everything here is a small
// constant offset the animator adds to its usual pose.
export const BUILD=Object.freeze({
  // Base walking speed stays within 7% across the whole crowd (fastest/slowest).
  speed:Object.freeze([.967,1.033]),
  shoulderDrop:Object.freeze([0,.05]),   // metres one shoulder sags
  spineBend:.08,spineTwist:.09,pelvisTilt:.045,          // ± radians
  headJut:Object.freeze([-.1,.16]),headTurn:.14,headTilt:.1,
  kneeBend:Object.freeze([0,.5]),stanceWidth:Object.freeze([-.015,.075]),toeOut:Object.freeze([-.05,.2]),
  arm:Object.freeze({swingFwd:.2,splay:Object.freeze([-.02,.2]),elbow:Object.freeze([-.28,.18]),twist:.35,wrist:Object.freeze([-.25,.4])}),
});

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}

// Rolled from the zombie's own seed, so no other dice in the run change.
export function rollBuild(seed,{brute=false,feral=false}={}){
  const r=seeded(seed^0x2c1b3c6d),between=([a,b])=>a+(b-a)*r(),pm=v=>(r()*2-1)*v;
  // Brutes are heavy and stiff; ferals are wiry and low. Both vary less.
  const k=brute?.45:feral?.6:1,B=BUILD,A=B.arm;
  const arm=()=>({swingFwd:pm(A.swingFwd)*k,splay:between(A.splay)*k,elbow:between(A.elbow)*k,twist:pm(A.twist)*k,wrist:between(A.wrist)*k});
  return {
    dropSide:r()<.5?0:1,shoulderDrop:between(B.shoulderDrop)*(r()<.55?1:.25)*k,
    spineBend:pm(B.spineBend)*k,spineTwist:pm(B.spineTwist)*k,pelvisTilt:pm(B.pelvisTilt)*k,
    headJut:between(B.headJut)*k,headTurn:pm(B.headTurn)*k,headTilt:pm(B.headTilt)*k,
    kneeBend:between(B.kneeBend)*(brute?.4:1),stanceWidth:between(B.stanceWidth)*k,toeOut:[between(B.toeOut)*k,between(B.toeOut)*k],
    arms:[arm(),arm()],
  };
}

// The collapsed shoulder is the one offset that moves a joint rather than
// turning it; it is set once when the zombie is made.
export function applyBuild(e,build){
  e.build=build;if(!build)return;
  const arm=e.arms?.[build.dropSide];if(arm?.pivot){arm.pivot.position.y-=build.shoulderDrop;arm.pivot.userData.shoulderDrop=build.shoulderDrop;}
}

// Elite bosses keep their scripted, upright poses.
export function resetBuild(e){
  const b=e.build;if(b){const arm=e.arms?.[b.dropSide];if(arm?.pivot){arm.pivot.position.y+=arm.pivot.userData.shoulderDrop||0;arm.pivot.userData.shoulderDrop=0;}}
  e.build=null;
}

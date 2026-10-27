// Reload pose (v151). The gun drops, rolls and tips its muzzle up, holds low
// while the magazine is swapped, then rises and settles. It's a pure function
// of reload progress, so it looks the same at any frame rate. Each move uses
// smootherstep, which starts and stops with zero speed and acceleration, so the
// gun eases into the hold and settles back into the hip pose without snapping.
export const RELOAD_POSE={lower:.22,raise:.70,drop:.34,roll:-.6,pitch:.12};

const smootherstep=x=>{x=Math.min(1,Math.max(0,x));return x*x*x*(x*(x*6-15)+10);};

export function reloadWeight(progress){
  const {lower,raise}=RELOAD_POSE;
  if(!(progress>0&&progress<1))return 0;
  if(progress<lower)return smootherstep(progress/lower);
  if(progress<raise)return 1;
  return 1-smootherstep((progress-raise)/(1-raise));
}

export function reloadPose(progress){
  const w=reloadWeight(progress),P=RELOAD_POSE;
  return {weight:w,drop:P.drop*w,roll:P.roll*w,pitch:P.pitch*w};
}

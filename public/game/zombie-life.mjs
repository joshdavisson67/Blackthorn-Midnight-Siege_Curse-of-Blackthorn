// v175: lively walkers. Each zombie gets a temperament that shapes how it moves
// across the floor, not just how its limbs swing:
//   - a lurching rhythm: it surges on each push-off and drags between steps;
//   - slow surges and lulls, as if it keeps losing and finding the scent;
//   - a drunken weave across open floor (straightening out near the player);
//   - the odd stumble, pitching forward and catching itself;
//   - a short lunge when the player is a few strides away.
// Average speed over time stays the same as before; only its shape changes.
export const LIFE=Object.freeze({
  types:Object.freeze({
    // rhythm: speed swing per step; surge: slow swing; weave: radians of drift;
    // stumble: seconds between trips; lunge: chance per opportunity; vigor: body sway.
    shambler:Object.freeze({rhythm:[.18,.28],surge:[.06,.12],weave:[.1,.2],stumble:[9,18],lunge:.35,vigor:[1,1.35]}),
    lurcher:Object.freeze({rhythm:[.28,.38],surge:[.04,.08],weave:[.03,.09],stumble:[12,24],lunge:.55,vigor:[1.2,1.55]}),
    stalker:Object.freeze({rhythm:[.06,.12],surge:[.03,.06],weave:[0,.04],stumble:[40,70],lunge:.9,vigor:[.65,.9]}),
    staggerer:Object.freeze({rhythm:[.14,.22],surge:[.08,.14],weave:[.16,.26],stumble:[5,10],lunge:.2,vigor:[1.15,1.5]}),
    // Brutes plod: a heavy rhythm, no weave, no trips and no lunges.
    plodder:Object.freeze({rhythm:[.14,.22],surge:[.03,.06],weave:[0,0],stumble:[1e9,1e9],lunge:0,vigor:[.6,.8]}),
  }),
  mix:Object.freeze([['shambler',.35],['lurcher',.25],['stalker',.2],['staggerer',.2]]),
  lunge:Object.freeze({min:2,max:4.6,time:.42,speed:1.5,cooldown:[3.5,7]}),
  stumble:Object.freeze({time:.62,low:.3,recover:.5,boost:1.22,clear:2.8}),
  weaveFade:Object.freeze([2.5,5]),
});

function seeded(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),between=(r,[a,b])=>a+(b-a)*r();

// A temperament from the zombie's own seed, so nothing else's dice change.
export function createLife(seed,{feral=false,brute=false}={}){
  const r=seeded(seed^0x5bd1e995);
  let type='plodder';
  if(feral)type='stalker';
  else if(!brute){const pick=r();let acc=0;type='shambler';for(const [k,w] of LIFE.mix){acc+=w;if(pick<acc){type=k;break;}}}
  const T=LIFE.types[type],rhythm=between(r,T.rhythm),surge=between(r,T.surge);
  return {
    type,rhythm,surge,weave:between(r,T.weave)*(r()<.5?-1:1),vigor:between(r,T.vigor),lungeChance:T.lunge,stumbleEvery:T.stumble,
    o1:r()*6.28,o2:r()*6.28,o3:r()*6.28,o4:r()*6.28,f1:.6+r()*.9,f2:1.7+r()*1.4,weaveFreq:.35+r()*.35,weavePhase:r()*6.28,
    // Undo the slowdown a varying speed brings (time is spent in the slow parts).
    norm:1+.26*(rhythm*rhythm+surge*surge),
    t:0,stumble:0,recover:0,stumbleIn:between(r,T.stumble)*(.4+r()*.6),lunge:0,lungeCd:1+r()*3,weaveK:0,rand:r,
  };
}

// ctx: {dist, sameFloor, clear (straight walk to the player), stairs, attackReady, moved}
// Returns {pace (speed multiplier), weave (radians to turn the walking direction)}.
export function updateLife(e,dt,ctx){
  const L=e.life;if(!L)return {pace:1,weave:0};
  L.t+=dt;
  const ph=e.phase||0,pulse=.6*Math.sin(2*ph+L.o1)+.4*Math.sin(ph+L.o2);
  const drift=.6*Math.sin(L.t*L.f1+L.o3)+.4*Math.sin(L.t*L.f2*.5+L.o4);
  let pace=(1+L.rhythm*pulse+L.surge*drift)*L.norm;
  const S=LIFE.stumble,G=LIFE.lunge;
  // Stumbles: only on open, level floor, and never right at the player.
  if(L.stumble>0){L.stumble=Math.max(0,L.stumble-dt);const k=1-L.stumble/S.time;pace*=S.low+(1-S.low)*k*k;if(L.stumble===0)L.recover=S.recover;}
  else{
    if(L.recover>0){L.recover=Math.max(0,L.recover-dt);pace*=S.boost;}
    if(ctx.moved>0&&!ctx.stairs&&ctx.dist>S.clear&&L.lunge<=0){L.stumbleIn-=dt;if(L.stumbleIn<=0){L.stumble=S.time;L.recover=0;L.stumbleIn=between(L.rand,L.stumbleEvery);}}
  }
  // Lunges: a short burst when the player is a few strides away, in the open.
  L.lungeCd-=dt;
  if(L.lunge>0){L.lunge=Math.max(0,L.lunge-dt);pace*=G.speed;}
  else if(L.lungeChance>0&&L.lungeCd<=0&&L.stumble<=0&&ctx.sameFloor&&ctx.clear&&!ctx.stairs&&ctx.attackReady&&ctx.dist>G.min&&ctx.dist<G.max){
    if(L.rand()<L.lungeChance)L.lunge=G.time;L.lungeCd=between(L.rand,G.cooldown);
  }
  // Pose weights for the animator: a bell over the trip, an eased lunge.
  e.stumbleW=L.stumble>0?Math.sin(Math.PI*(1-L.stumble/S.time)):0;
  e.lungeW=(e.lungeW||0)+((L.lunge>0?1:0)-(e.lungeW||0))*(1-Math.exp(-dt*12));
  e.lurchPulse=L.rhythm*pulse;e.vigor=L.vigor;
  // Weave: drifts side to side with distance walked, fading out near the player,
  // on stairs and through a stumble.
  L.weavePhase+=ctx.moved*L.weaveFreq;
  const [f0,f1]=LIFE.weaveFade,target=ctx.stairs||L.stumble>0?0:clamp((ctx.dist-f0)/(f1-f0),0,1);
  L.weaveK+=(target-L.weaveK)*(1-Math.exp(-dt*4));
  return {pace,weave:L.weave*Math.sin(L.weavePhase)*L.weaveK};
}

// Crawling, attacking-in-place or scripted enemies drop back to plain motion.
export function settleLife(e,dt){
  e.stumbleW=0;e.lungeW=(e.lungeW||0)*Math.exp(-dt*12);e.lurchPulse=(e.lurchPulse||0)*Math.exp(-dt*8);
  if(e.life){e.life.stumble=0;e.life.lunge=0;}
}

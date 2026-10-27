// Suppressed MP5 report. A suppressor doesn't make a gun silent: what you still
// hear is a muffled gas "phut", a soft low thump, and the bolt cycling. Each
// part is kept short because the MP5 fires every 75 ms and longer tails would
// blur a burst into a hiss.
export const SUPPRESSED={
  puff:{dur:.065,gain:.17,freq:720,q:.8},
  thump:{dur:.07,gain:.08,from:150,to:58},
  clack:{delay:.016,dur:.028,gain:.06,freq:3200,q:.7},
  pitch:.12
};

export function suppressedShot(ctx,out,noiseBuffer,random=Math.random){
  const S=SUPPRESSED,t=ctx.currentTime,pitch=1-S.pitch/2+random()*S.pitch;
  const burst=({dur,gain,freq,q},type,start)=>{
    const n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    n.buffer=noiseBuffer;f.type=type;f.frequency.value=freq*pitch;f.Q.value=q;
    g.gain.setValueAtTime(gain,start);g.gain.exponentialRampToValueAtTime(.0001,start+dur);
    n.connect(f);f.connect(g);g.connect(out);
    // Start at a random point in the noise so consecutive shots don't sound identical.
    n.start(start,random()*Math.max(0,(noiseBuffer?.duration||1)-dur));n.stop(start+dur);
  };
  burst(S.puff,'bandpass',t);
  const o=ctx.createOscillator(),g=ctx.createGain();
  o.type='sine';o.frequency.setValueAtTime(S.thump.from*pitch,t);o.frequency.exponentialRampToValueAtTime(S.thump.to*pitch,t+S.thump.dur);
  g.gain.setValueAtTime(S.thump.gain,t);g.gain.exponentialRampToValueAtTime(.0001,t+S.thump.dur);
  o.connect(g);g.connect(out);o.start(t);o.stop(t+S.thump.dur);
  burst(S.clack,'highpass',t+S.clack.delay);
}

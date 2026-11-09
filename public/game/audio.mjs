import {suppressedShot} from './gun-audio.mjs?v=150';

// Game sound (v201, Dead Tide step 1), for any mode: the Web Audio context, started
// on the first Resume and woken again after the browser suspends it; a two-second
// noise buffer; the low wind that plays under everything; and the three ways the
// game makes a sound (a pitched tone, a filtered noise burst and the MP5's
// suppressed report). Moved from game.js unchanged; scripts/golden-trace.mjs records
// every node, link, value and ramp and checks the mansion sounds identical. Every
// sound is silent until the context starts, after it closes, and while the page's
// sound switch (isOn) is off.
export const AMBIENCE_LEVEL=.018;

export function createAudio({isOn}){
  let context=null,noiseBuffer=null,ambience=null;
  const silent=()=>!context||context.state==='closed'||!isOn();
  // Browsers only allow sound after a click or key press, so a mode calls this from
  // its Resume path; a second call wakes a suspended context.
  function init(){if(context){if(context.state==='suspended')context.resume();return;}try{context=new (window.AudioContext||window.webkitAudioContext)();noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;const n=context.createBufferSource();n.buffer=noiseBuffer;n.loop=true;const filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=200;ambience=context.createGain();ambience.gain.value=isOn()?AMBIENCE_LEVEL:0;n.connect(filter);filter.connect(ambience);ambience.connect(context.destination);n.start();}catch{}}
  function tone(freq,dur=.1,volume=.06,type='sine',end=0){if(silent())return;const o=context.createOscillator(),g=context.createGain();o.type=type;o.frequency.setValueAtTime(freq,context.currentTime);o.frequency.exponentialRampToValueAtTime(end||freq*.65,context.currentTime+dur);g.gain.setValueAtTime(volume,context.currentTime);g.gain.exponentialRampToValueAtTime(.0001,context.currentTime+dur);o.connect(g);g.connect(context.destination);o.start();o.stop(context.currentTime+dur);}
  function suppressedReport(){if(silent())return;suppressedShot(context,context.destination,noiseBuffer);}
  function noise(dur,volume=.15,frequency=1600){if(silent())return;const n=context.createBufferSource();n.buffer=noiseBuffer;const g=context.createGain(),f=context.createBiquadFilter();f.type='lowpass';f.frequency.value=frequency;g.gain.setValueAtTime(volume,context.currentTime);g.gain.exponentialRampToValueAtTime(.001,context.currentTime+dur);n.connect(f);f.connect(g);g.connect(context.destination);n.start();n.stop(context.currentTime+dur);}
  // The sound switch: the wind follows it at once; every other sound checks it as it plays.
  function syncAmbience(){if(ambience)ambience.gain.value=isOn()?AMBIENCE_LEVEL:0;}
  return {init,tone,noise,suppressedReport,syncAmbience,get context(){return context;}};
}

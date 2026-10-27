import assert from 'node:assert/strict';
import {suppressedShot} from '../public/game/gun-audio.mjs';

const MP5_CYCLE=.075;

// A minimal Web Audio stand-in that records the graph each sound builds.
class FakeAudio{
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=8000;this.destination={kind:'destination'};this.nodes=[];}
  node(kind,extra={}){
    const n={kind,links:[],starts:[],stops:[],connect:t=>{n.links.push(t);return t;},start:(at=this.currentTime,offset=0)=>n.starts.push({at,offset}),stop:at=>n.stops.push(at),...extra};
    this.nodes.push(n);return n;
  }
  param(value=0){const p={value,events:[],setValueAtTime:(v,t)=>p.events.push(['set',v,t]),exponentialRampToValueAtTime:(v,t)=>p.events.push(['ramp',v,t])};return p;}
  createBuffer(channels,length,rate){const data=new Float32Array(length);return {duration:length/rate,getChannelData:()=>data};}
  createBufferSource(){return this.node('source',{buffer:null,loop:false,playbackRate:this.param(1)});}
  createBiquadFilter(){return this.node('filter',{type:'lowpass',frequency:this.param(350),Q:this.param(1)});}
  createGain(){return this.node('gain',{gain:this.param(1)});}
  createOscillator(){return this.node('osc',{type:'sine',frequency:this.param(440)});}
  resume(){this.state='running';}
}

function shotGraph(ctx,from){
  const nodes=ctx.nodes.slice(from);
  return {nodes,filters:nodes.filter(n=>n.kind==='filter').map(n=>n.type).sort(),oscs:nodes.filter(n=>n.kind==='osc').map(n=>n.type),
    peak:Math.max(...nodes.filter(n=>n.kind==='gain').map(n=>n.gain.events.find(e=>e[0]==='set')?.[1]??0)),
    end:Math.max(...nodes.flatMap(n=>n.stops)),start:Math.min(...nodes.flatMap(n=>n.starts.map(s=>s.at)))};
}

export function verifyGunAudio(qa,frames,elements,document){
  // The report on its own: muffled puff, low thump and bolt clack, all over within one MP5 cycle.
  const ctx=new FakeAudio(),buffer=ctx.createBuffer(1,16000,8000),out={kind:'out'};
  for(const r of [0,.5,.999]){
    ctx.currentTime=3;const from=ctx.nodes.length;suppressedShot(ctx,out,buffer,()=>r);const g=shotGraph(ctx,from);
    assert.deepEqual(g.filters,['bandpass','highpass'],'Suppressed report should be a band-limited puff plus a bright bolt clack');
    assert.deepEqual(g.oscs,['sine'],'Suppressed report should carry one soft sine thump');
    assert(g.start>=3&&g.end<=3+MP5_CYCLE,`Suppressed report must end inside one MP5 cycle (ended ${(g.end-3).toFixed(3)}s after the shot)`);
    assert(g.nodes.filter(n=>n.kind==='gain').every(n=>n.links.includes(out)),'Every part of the report should reach the output');
    for(const n of g.nodes.filter(n=>n.kind==='source'))assert(n.starts[0].offset+(n.stops[0]-n.starts[0].at)<=buffer.duration+1e-9,'Noise offset should stay inside the buffer');
  }
  const pitches=[0,1].map(r=>{const from=ctx.nodes.length;suppressedShot(ctx,out,buffer,()=>r);return ctx.nodes.slice(from).find(n=>n.kind==='osc').frequency.events[0][1];});
  assert(pitches[1]>pitches[0],'Consecutive suppressed shots should vary slightly in pitch');

  // In the game: the MP5 uses the suppressed report and the other guns keep theirs.
  const previous=globalThis.window.AudioContext;globalThis.window.AudioContext=FakeAudio;
  try{
    if(qa.get().mode!=='playing'){qa.start();frames(2);}
    document.exitPointerLock();frames(1);elements.get('resume').onclick();frames(2);
    const game=qa.get();assert.equal(game.mode,'playing','Game should resume after audio starts');
    const audio=game.audio;assert(audio instanceof FakeAudio,'Resuming should start the game audio');
    const fire=weapon=>{game.inventory[weapon].owned=true;qa.selectWeapon(weapon);frames(80);game.inventory[weapon].ammo=10;const from=audio.nodes.length;qa.shoot();return shotGraph(audio,from);};
    const smg=fire('smg');
    assert(smg.filters.includes('bandpass')&&smg.filters.includes('highpass')&&!smg.filters.includes('lowpass'),`MP5 should fire the suppressed report, got filters ${smg.filters}`);
    assert(!smg.oscs.includes('triangle'),'MP5 should not play the unsuppressed crack');
    const rifle=fire('rifle');
    assert(rifle.filters.includes('lowpass')&&rifle.oscs.includes('triangle'),'Unsuppressed guns keep their original report');
    assert(smg.peak<rifle.peak,'The suppressed report should be quieter than an unsuppressed shot');
    elements.get('sound').checked=false;const before=audio.nodes.length;fire('smg');
    assert.equal(audio.nodes.length,before,'The suppressed report respects the sound setting');
    elements.get('sound').checked=true;
  }finally{globalThis.window.AudioContext=previous;}
  console.log('PASS: the MP5 fires a short suppressed report (puff, thump, bolt clack) inside one 75 ms cycle; other guns keep their sound; the sound setting still mutes it.');
}

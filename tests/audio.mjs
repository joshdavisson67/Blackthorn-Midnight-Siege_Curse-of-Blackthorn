import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

// v201 (Dead Tide step 1): game sound is a shared module. The mansion still sounds
// identical (scripts/golden-trace.mjs records every node, link, value and ramp it
// makes); this test runs the sound on its own, with a switch of its own.
class FakeAudio{
  constructor(){this.state='running';this.currentTime=2;this.sampleRate=50;this.destination={kind:'out'};this.nodes=[];this.resumed=0;}
  node(kind,extra={}){const n={kind,links:[],starts:[],stops:[],connect:t=>{n.links.push(t);return t;},start:(at=this.currentTime)=>n.starts.push(at),stop:at=>n.stops.push(at),...extra};this.nodes.push(n);return n;}
  param(value){const p={value,events:[],setValueAtTime:(v,t)=>p.events.push(['set',v,t]),exponentialRampToValueAtTime:(v,t)=>p.events.push(['ramp',v,t])};return p;}
  createBuffer(channels,length,rate){const data=new Float32Array(length);return {channels,length,duration:length/rate,getChannelData:()=>data};}
  createBufferSource(){return this.node('source',{buffer:null,loop:false,playbackRate:this.param(1)});}
  createBiquadFilter(){return this.node('filter',{type:'lowpass',frequency:this.param(350),Q:this.param(1)});}
  createGain(){return this.node('gain',{gain:this.param(1)});}
  createOscillator(){return this.node('oscillator',{type:'sine',frequency:this.param(440)});}
  resume(){this.state='running';this.resumed++;}
}

export async function verifyAudio(){
  const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game'),read=f=>readFileSync(resolve(game,f),'utf8');
  // ---- Isolation ------------------------------------------------------------------------
  const imports=f=>[...read(f).matchAll(/^import[^'"]*['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  assert.deepEqual(imports('audio.mjs'),['gun-audio.mjs'],'Sound imports only the gun reports');
  assert.deepEqual(imports('gun-audio.mjs'),[],'which import nothing');
  const src=read('game.js');
  for(const name of ['initAudio','tone','noise','suppressedReport'])assert(!new RegExp(`function ${name}\\(`).test(src),`game.js no longer keeps its own ${name}`);
  for(const name of ['noiseBuffer','ambience','AudioContext'])assert(!new RegExp(`\\b${name}\\b`).test(src),`nor ${name}`);
  assert(/const gameAudio=createAudio\(\{isOn:soundOn\}\)/.test(src)&&/gameAudio\.syncAmbience\(\)/.test(src),'The mansion makes its sound from the module and its switch drives the wind');

  // ---- Sound of its own ------------------------------------------------------------------
  const {createAudio,AMBIENCE_LEVEL}=await import('../.qa/audio.mjs');
  const page=globalThis.window,saved=page.AudioContext;
  try{
    let on=true;const A=createAudio({isOn:()=>on});
    // Silent until the first Resume.
    delete page.AudioContext;A.tone(440);A.noise(.2);A.suppressedReport();A.syncAmbience();
    assert.equal(A.context,null,'Nothing plays before the first Resume');
    A.init();assert.equal(A.context,null,'and a browser without Web Audio stays silent without an error');
    page.AudioContext=FakeAudio;A.init();const ctx=A.context;
    assert(ctx instanceof FakeAudio,'Resume starts the sound');
    // The wind: two seconds of looping noise, low-passed at 200 Hz, quietly under everything.
    const [wind,windFilter,windGain]=ctx.nodes,buffer=wind.buffer,data=buffer.getChannelData(0);
    assert(buffer.length===ctx.sampleRate*2&&data.every(v=>v>=-1&&v<1)&&new Set(data).size>data.length/2,'The noise buffer holds two seconds of noise');
    assert(wind.loop&&wind.starts.length===1&&wind.links[0]===windFilter&&windFilter.type==='lowpass'&&windFilter.frequency.value===200&&windFilter.links[0]===windGain&&windGain.links[0]===ctx.destination,'The wind loops through a 200 Hz low-pass');
    assert.equal(windGain.gain.value,AMBIENCE_LEVEL,'at a low level');assert.equal(AMBIENCE_LEVEL,.018);
    // A tone: pitched, falling to its end note (or two-thirds) as it fades.
    let from=ctx.nodes.length;A.tone(400,.5,.07,'square');let [osc,gain]=ctx.nodes.slice(from);
    assert(osc.kind==='oscillator'&&osc.type==='square'&&osc.links[0]===gain&&gain.links[0]===ctx.destination,'A tone is an oscillator through a gain');
    assert.deepEqual(osc.frequency.events,[['set',400,2],['ramp',260,2.5]],'falling to 65% of its pitch');
    assert.deepEqual(gain.gain.events,[['set',.07,2],['ramp',.0001,2.5]],'as it fades out');
    assert.deepEqual([osc.starts,osc.stops],[[2],[2.5]],'and stops when it is done');
    from=ctx.nodes.length;A.tone(300);[osc,gain]=ctx.nodes.slice(from);
    assert.deepEqual([osc.type,osc.frequency.events[1],gain.gain.events[0],osc.stops[0]],['sine',['ramp',195,2.1],['set',.06,2],2.1],'Defaults: a 0.1 s sine at 0.06');
    from=ctx.nodes.length;A.tone(300,.2,.05,'triangle',90);assert.deepEqual(ctx.nodes[from].frequency.events[1],['ramp',90,2.2],'or to the end note given');
    // A noise burst: the noise buffer through a low-pass, fading.
    from=ctx.nodes.length;A.noise(.3,.2,900);const [src2,g2,f2]=ctx.nodes.slice(from);
    assert(src2.buffer===buffer&&src2.links[0]===f2&&f2.type==='lowpass'&&f2.frequency.value===900&&f2.links[0]===g2&&g2.links[0]===ctx.destination,'A noise burst filters the noise buffer');
    assert.deepEqual([g2.gain.events,src2.starts,src2.stops],[[['set',.2,2],['ramp',.001,2.3]],[2],[2.3]],'and fades over its length');
    from=ctx.nodes.length;A.noise(.1);assert.equal(ctx.nodes[from+2].frequency.value,1600,'Default noise is cut at 1.6 kHz');
    // The MP5's suppressed report, built from the same noise.
    from=ctx.nodes.length;A.suppressedReport();const report=ctx.nodes.slice(from);
    assert(report.some(n=>n.kind==='filter'&&n.type==='bandpass')&&report.some(n=>n.kind==='source'&&n.buffer===buffer)&&report.filter(n=>n.kind==='gain').every(n=>n.links.includes(ctx.destination)),'The suppressed report plays from the noise buffer');
    // The switch: every sound goes quiet and the wind drops at once.
    on=false;from=ctx.nodes.length;A.tone(400);A.noise(.2);A.suppressedReport();
    assert.equal(ctx.nodes.length,from,'With sound off nothing plays');
    A.syncAmbience();assert.equal(windGain.gain.value,0,'and the wind is silenced');
    on=true;A.syncAmbience();assert.equal(windGain.gain.value,AMBIENCE_LEVEL,'Back on, the wind returns');
    // Resume again: a sleeping context wakes; no second context is made.
    ctx.state='suspended';A.init();assert(A.context===ctx&&ctx.resumed===1&&ctx.state==='running','A second Resume wakes a suspended context');
    A.init();assert.equal(ctx.resumed,1,'and leaves a running one alone');
    ctx.state='closed';from=ctx.nodes.length;A.tone(400);A.noise(.1);A.suppressedReport();assert.equal(ctx.nodes.length,from,'A closed context plays nothing');
    // Starting with the switch off starts the wind silent.
    on=false;const B=createAudio({isOn:()=>on});B.init();assert.equal(B.context.nodes[2].gain.value,0,'Started muted, the wind is silent');
  }finally{if(saved===undefined)delete page.AudioContext;else page.AudioContext=saved;}
  console.log('PASS: shared sound — imports only the gun reports, game.js keeps no copy; on its own it stays silent until Resume (and without Web Audio), loops two seconds of noise as a 200 Hz wind at 0.018, plays tones that fall and fade on time, filtered noise bursts and the suppressed report from the same noise, goes quiet with the switch (the wind at once), wakes a suspended context without making another, and plays nothing once closed.');
}

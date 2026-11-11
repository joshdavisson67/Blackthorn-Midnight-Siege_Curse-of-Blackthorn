#!/usr/bin/env node
// Dead Tide's golden trace (v206 tooling): the island's counterpart to
// scripts/golden-trace.mjs. It plays fixed, seeded scenarios through tests/tide-harness.mjs
// and records, frame by frame, the player, every enemy and pickup, the run, the session,
// the weapons, the screen (every renderer call), the view in hand, the page and the sound.
// Two builds that play alike produce byte-identical traces; scripts/golden-compare.mjs
// compares two traces channel by channel when a change adds something.
//
//   node scripts/tide-golden-trace.mjs > after.json
//   BLACKTHORN_GAME_DIR=<other checkout>/public/game node scripts/tide-golden-trace.mjs > before.json
//   node scripts/golden-compare.mjs before.json after.json
//
// BLACKTHORN_GAME_DIR plays another build's game with this checkout's harness, so a build
// from before this script (v205) can be traced too. The clock is fixed and randomness
// seeded before the game loads; every scenario starts from a fresh run with the game's own
// generator reseeded. Before the dead come ashore (v206) the island has no enemies, and the
// scenarios cover everything it already does: walking, the hill and its tent, wading,
// every gun, the katana, grenades, death and the play session. The enemies' channel and a
// fight join them with the dead. A coverage line on stderr confirms each scenario reached
// what it tests; GOLDEN_LOGS=1 writes the screen and sound logs out in full.
let seed=0x71de5;
const seeded=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
let clock=1000;performance.now=()=>clock;Date.now=()=>1.7e12+clock;
const n6=v=>typeof v==='number'?(Number.isFinite(v)?+v.toFixed(6):String(v)):v===null||v===undefined?String(v):typeof v==='object'?(v.constructor?.name||'object'):String(v);
const fnv=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
const seen={};const note=(k,v=true)=>{if(v)seen[k]=(seen[k]||0)+1;};
// The screen: every call the renderer stand-in makes (tests/qa-stub.mjs reports them here).
const renderLog=[];
globalThis.__qaRenderLog=(name,args,renderer)=>{let d=name;
  if(name==='render'||name==='compileAsync'){const [scene,c]=args;d+=` ${scene.children.length} ${c.type} ${c.layers.mask} ${n6(c.fov)} ${n6(c.aspect)} ${n6(c.near)} ${n6(c.far)} ${scene.background?.isColor?scene.background.getHexString():n6(scene.background)} ${renderer.autoClear}`;}
  else if(name==='setRenderTarget'){const t=args[0];d+=t?` ${t.width}x${t.height}/${t.samples}`:' screen';}
  else if(name==='initTexture'){const t=args[0];d+=t?` ${t.constructor.name} ${t.image?.width}x${t.image?.height} ${t.name}`:' none';}
  else d+=' '+args.map(n6).join(' ');
  renderLog.push(d);};
// The sound: a recording Web Audio context logs every node, its wiring and every value.
const audioLog=[];
class RecordingAudio{
  constructor(){this.state='running';this.sampleRate=8;this.destination={id:'out'};this.count=0;audioLog.push('context');}
  get currentTime(){return +(clock/1000).toFixed(4);}
  param(id,value){const p={setValueAtTime:(v,t)=>audioLog.push(`${id} set ${n6(v)} ${n6(t)}`),exponentialRampToValueAtTime:(v,t)=>audioLog.push(`${id} ramp ${n6(v)} ${n6(t)}`),linearRampToValueAtTime:(v,t)=>audioLog.push(`${id} line ${n6(v)} ${n6(t)}`)};
    Object.defineProperty(p,'value',{get:()=>value,set:v=>{value=v;audioLog.push(`${id} = ${n6(v)}`);}});return p;}
  node(kind,params){const id='n'+this.count++,n={id,kind};note('sound: '+kind);
    const describe=()=>[kind,n.type,n.loop,n.buffer?n.buffer.id:'-'].join(' ');
    for(const [k,v] of Object.entries(params))n[k]=this.param(id+'.'+k,v);
    n.connect=t=>{audioLog.push(`${id} > ${t.id} (${describe()})`);return t;};
    n.start=(...a)=>audioLog.push(`${id} start ${a.map(n6).join(' ')} (${describe()})`);n.stop=(...a)=>audioLog.push(`${id} stop ${a.map(n6).join(' ')}`);
    audioLog.push(`${id} new ${kind}`);return n;}
  createBuffer(channels,length,rate){const data=new Float32Array(length),id='b'+this.count++;audioLog.push(`${id} buffer ${channels} ${length} ${rate}`);
    return {id,duration:length/rate,length,sampleRate:rate,getChannelData:()=>data};}
  createBufferSource(){return this.node('source',{playbackRate:1});}
  createBiquadFilter(){return this.node('filter',{frequency:350,Q:1});}
  createGain(){return this.node('gain',{gain:1});}
  createOscillator(){return this.node('oscillator',{frequency:440});}
  resume(){this.state='running';audioLog.push('resume');}
}

const harness=await import('../tests/tide-harness.mjs');
const {qa,$,listeners,canvas,document,entry}=harness,enter=entry();
const {groundHeight,coastRadius,ISLAND}=await import('../.qa-tide/island.mjs');
const T=await import('../public/game/three.module.js');
globalThis.window.AudioContext=RecordingAudio;Math.random=seeded;
const fullLogs=process.env.GOLDEN_LOGS==='1',bootLog=renderLog.splice(0);
const drain=log=>{const t=log.splice(0).join('\n');return fullLogs?t:fnv(t);};
const G=()=>qa.get(),r=v=>Number.isFinite(v)?v:String(v);
const key=(code,extra={})=>listeners.keydown({code,key:code,repeat:false,preventDefault(){},target:{},...extra});
const keyUp=code=>listeners.keyup({code,key:code});
const step=()=>{clock+=1000/60;qa.tick(clock);};
const settle=async()=>{for(let i=0;i<4;i++)await Promise.resolve();};

// ---- What every sample records ------------------------------------------------------------
const domState=()=>{let t='';for(const el of document.querySelectorAll('[id]'))t+=el.id+'|'+(el.getAttribute('class')||'')+'|'+(el.getAttribute('style')||'')+'|'+(el.hasAttribute('hidden')?1:0)+'|'+(el.querySelector('[id]')?'':el.innerHTML)+'\n';return process.env.GOLDEN_DOM?t:fnv(t);};
const viewState=s=>{let t='';s.gunRoot.traverse(o=>{t+=o.name+'|'+o.visible+'|'+o.position.toArray().join(',')+'|'+o.rotation.toArray().slice(0,3).join(',')+'|'+o.scale.toArray().join(',')+'\n';});
  const f=s.firstPerson;
  return [fnv(t),s.gunRoot.visible?1:0,...s.camera.position.toArray(),...s.camera.rotation.toArray().slice(0,3),s.camera.fov,f.viewFov,f.flashTime,f.recoil,s.flash?.visible?1:0,f.flashlightOn?1:0,s.grenadeThrow?.root.visible?1:0,$('crosshair').style.opacity].map(r);};
const screenState=s=>{const R=s.renderer;return [R.pr,R.autoClear,R.shadowMap.enabled,R.toneMapping,R.toneMappingExposure,s.camera.aspect,s.camera.near,s.camera.far,s.camera.fov,s.scene.fog.density,R.compileCalls?.length??0,R.initializedTextures?.size??0];};
const enemy=e=>[e.dead?1:0,e.brute?1:0,e.dog?1:0,e.rareDog?1:0,e.feral?1:0,e.lurker?1:0,e.walkPos.x,e.walkPos.y,e.walkPos.z,e.hp,e.group.rotation.y,e.group.position.y,e.attackTime,e.stuck,e.crawling?1:0,e.enraged?1:0,e.staggerLeft??0,e.death??0,e.emergeLeft??0,e.group.visible?1:0].map(r);
const birth=e=>[e.walkPos.x,e.walkPos.y,e.walkPos.z,e.group.position.y,e.hp,e.maxHp,e.speed,e.radius,e.bodyHeight,e.brute?1:0,e.dog?1:0,e.rareDog?1:0,e.feral?1:0,e.lurker?1:0,e.crawling?1:0,
  e.templateIndex,e.routeSide,e.flank,e.attack,e.navigation?.seed,e.life?.type,e.injury?.major,e.injury?.legless?1:0,e.injury?.props?.length,e.emergeLeft,e.face?.variant,e.style].map(r);
// v208: the threat director's state (escalation scenarios only, so the others keep their shape).
// v209: and the spawn network: the open major and interior zones and where arrivals came from.
const threatState=s=>[s.shore.level,s.shore.rank,s.shore.target,s.shore.pending,s.shore.alive(),(s.shore.openZones||[]).join('+'),(s.shore.openInterior||[]).join('+'),s.shore.counts?JSON.stringify(s.shore.counts):'',s.threat?s.threat.cues:''].map(r);
function snapshot(sc={}){const s=G(),R=s.run,inv=R.inventory,held=inv[R.weapon];return {...(sc.threat?{threat:threatState(s)}:{}),
  player:[s.player.x,s.player.y,s.player.z,R.health,R.armor,R.points,R.totalScore,R.kills,R.weapon,held?.ammo??null,held?.reserve??null,R.grenades,R.doubleTime,R.grenadeTime,s.effects.length,s.zone].map(r),
  zombies:(s.zombies||[]).map(enemy),
  pickups:(s.pickups||[]).map(p=>[p.type,p.mesh.position.x,p.mesh.position.y,p.mesh.position.z,p.life].map(r)),
  run:[R.health,R.maxHealth,R.armor,R.runTime,R.lastHurt,R.jumpV,R.feetY,R.grounded?1:0,s.camera.position.x,s.camera.position.y,s.camera.position.z,s.camera.rotation.x,s.camera.rotation.y,[...R.perkOwned].join('+')].map(r),
  session:[s.mode,s.pointer?1:0,s.session.mouseDown?1:0,s.session.aiming?1:0,s.session.lookYaw,s.session.lookPitch,document.pointerLockElement?1:0,s.keys?.size??0].map(r),
  arms:[R.shotTimer,R.reloadLeft,R.reloadDuration,R.grenadeCooldown,s.weaponRecoil?.pitch,s.weaponRecoil?.yaw,s.camera.fov,s.swing?.active?1:0,s.swing?.kind??-1,
    ...Object.values(inv).flatMap(v=>[v.owned?1:0,v.ammo,v.reserve,v.weaponRank,v.forgeRank]),...Object.values(s.firstPerson.gunGroups).map(g=>g.visible?1:0)].map(r),
  screen:[drain(renderLog),...screenState(s)].map(r),
  view:viewState(s),
  dom:domState(),
  audio:drain(audioLog)
};}

// ---- The scenarios ----------------------------------------------------------------------
// Each starts a fresh run on the south beach (New Run), reseeded, and plays its own script:
// `script(f)` acts before frame f; `watch()` notes what the scenario reached.
// v210: the radio tent (the shack in builds before it).
const H=ISLAND.hill,S=ISLAND.tent||ISLAND.shack,tentLane=ISLAND.tent?1.2:0,sp=ISLAND.spawn,yawTo=(x,z)=>{const p=G().player;return Math.atan2(-(x-p.x),-(z-p.z));};
const yawToFrom=(x,z,tx,tz)=>Math.atan2(-(tx-x),-(tz-z));
function hillBearing(){const I=G().island;const clear=b=>{for(let d=8;d<=34;d+=.25){const x=H.x+Math.cos(b)*d,z=H.z+Math.sin(b)*d;if(I.isBlocked(x,z,.45,I.colliders,null,groundHeight(x,z),1.8))return false;}return true;};let b=Math.PI/2;while(!clear(b))b+=.05;return b;}
// v208: a run far into the kill count, with an M4 and plenty of rounds, and you unkillable.
function escalate(kills){const R=G().run;R.kills=kills;R.health=R.maxHealth=1e9;const m4=R.inventory.rifle;m4.owned=true;m4.reserve=1e5;qa.selectWeapon('rifle');qa.setAim(0,0);}
// Turn to the nearest risen enemy every 10 frames and fire every 20 when it is within 30 m.
function holdBeach(f){if(f%10)return null;return ()=>{const s=G(),alive=s.zombies.filter(e=>!e.dead&&!(e.emergeLeft>0));if(!alive.length)return;
  let near=alive[0],best=Infinity;for(const e of alive){const d=Math.hypot(e.walkPos.x-s.player.x,e.walkPos.z-s.player.z);if(d<best){best=d;near=e;}}
  const tip=near.group.position.clone().add(new T.Vector3(0,1.3,0)),eye=s.camera.position,dx=tip.x-eye.x,dy=tip.y-eye.y,dz=tip.z-eye.z;
  qa.setAim(Math.atan2(-dx,-dz),Math.atan2(dy,Math.hypot(dx,dz)));
  if(f%20===0&&best<30){if(s.run.inventory[s.run.weapon].ammo>0)qa.shoot();else if(!(s.run.reloadLeft>0))qa.reload();}};}
const scenarios={
  // Walking, strafing, sprinting, jumping and looking about on the beach.
  walk:{frames:720,script:f=>f===1?()=>{qa.setAim(0,0);qa.setKeys(['KeyW']);}:f===120?()=>qa.setKeys(['KeyW','ShiftLeft']):f===240?()=>qa.setKeys(['KeyA']):f===330?()=>qa.setKeys(['KeyD','KeyS']):f===420?()=>{qa.setKeys([]);key('Space');}:f===470?()=>{keyUp('Space');listeners.mousemove?.({movementX:180,movementY:-40});}:f===520?()=>{qa.setKeys(['KeyW']);key('Space');}:f===560?()=>keyUp('Space'):f===640?()=>qa.setKeys([]):null,
    watch:()=>{note('walk: airborne',!G().run.grounded);note('walk: sprinting',G().keys?.has('ShiftLeft'));}},
  // Up Radio Hill on foot, in under the radio tent, a jump under its canopy, and on out the far
  // side (v210; before it, into the shack by its door and against its back wall).
  hill:{frames:1080,script:f=>{
    if(f===1)return ()=>{const b=hillBearing();qa.setPlayer(H.x+Math.cos(b)*34,H.z+Math.sin(b)*34);qa.setAim(Math.atan2(Math.cos(b),Math.sin(b)),0);qa.setKeys(['KeyW','ShiftLeft']);};
    if(f===420)return ()=>{qa.setKeys([]);qa.setPlayer(S.x+tentLane,S.z+S.d/2+2);qa.setAim(0,0);qa.setKeys(['KeyW']);};
    if(f===540)return ()=>{qa.setKeys([]);key('Space');};if(f===600)return ()=>{keyUp('Space');qa.setKeys(['KeyW']);};
    if(f===840)return ()=>{qa.setKeys(['KeyS']);};if(f===960)return ()=>qa.setKeys([]);return null;},
    watch:()=>{note('hill: summit',G().zone.includes('SUMMIT'));note('hill: tent',G().zone.includes('RADIO TENT')||G().zone==='RADIO SHACK');}},
  // Out into the shallows, slower as they deepen, to the wading limit.
  wade:{frames:780,script:f=>f===1?()=>{const a=Math.PI/2+.4,c=coastRadius(a)*.9;qa.setPlayer(Math.cos(a)*c,Math.sin(a)*c);qa.setAim(Math.atan2(-Math.cos(a),-Math.sin(a)),0);qa.setKeys(['KeyW']);}:f===720?()=>qa.setKeys([]):null,
    watch:()=>note('wade: shallows',G().zone==='THE SHALLOWS')},
  // Every gun in hand: drawn, aimed, fired twice, reloaded from one round, sprinted with.
  // Then a grenade thrown and burst, and the flashlight on and off.
  arms:{frames:1000,setup:()=>{for(const v of Object.values(G().run.inventory))v.owned=true;},script:f=>{
    const guns=['glock','shotgun','smg','bushmaster','rifle','lmg'],b=Math.floor(f/120),k=f%120;
    if(b<guns.length){const g=guns[b];
      if(k===1)return ()=>{qa.setAim(.3,-.25);qa.selectWeapon(g);};if(k===20)return ()=>canvas.events.mousedown({button:2,preventDefault(){}});if(k===40||k===50)return ()=>qa.shoot();
      if(k===60)return ()=>listeners.mouseup({button:2});if(k===64)return ()=>{G().run.inventory[g].ammo=1;qa.reload();};if(k===100)return ()=>qa.setKeys(['KeyW','ShiftLeft']);if(k===115)return ()=>qa.setKeys([]);return null;}
    if(f===740)return ()=>{qa.selectWeapon('glock');key('KeyG');};if(f===741)return ()=>keyUp('KeyG');if(f===900)return ()=>key('KeyF');if(f===960)return ()=>key('KeyF');return null;},
    watch:()=>{note('arms: reloading',G().run.reloadLeft>0);note('arms: aiming',G().session.aiming);note('arms: grenade in flight',G().effects.some(e=>e.type==='grenade'));note('arms: flashlight',G().firstPerson.flashlightOn);}},
  // The katana: drawn with 7, three slashes in turn, a pause, held to keep slashing, and back to a gun.
  katana:{frames:420,setup:()=>{G().run.inventory.katana.owned=true;},script:f=>f===1?()=>key('Digit7'):[20,60,100].includes(f)?()=>qa.shoot():f===220?()=>canvas.events.mousedown({button:0,preventDefault(){}}):f===330?()=>listeners.mouseup({button:0}):f===380?()=>key('Digit1'):null,
    watch:()=>{note('katana: slashing',G().swing?.active);note('katana: third slash',G().swing?.kind===2);}},
  // Grenades and death: a safe throw, a blast at your feet, the tide taking you, and New Run.
  death:{frames:540,script:f=>f===1?()=>{qa.setAim(0,-.2);key('KeyG');}:f===2?()=>keyUp('KeyG'):f===300?()=>qa.explode(G().player.clone().add(new T.Vector3(1,.3,0))):f===340?()=>qa.hurtPlayer(500):f===420?()=>$('restart').onclick():null,
    watch:()=>note('death: dead',G().mode==='dead')},
  // v206, the dead come ashore: the shore at its usual eight. You hold the south beach, turning
  // to the nearest walker and firing (reloading when empty, a grenade once), then hold the
  // summit of Radio Hill as they climb after you; they strike, you fall or survive.
  fight:{frames:4200,dead:true,script:f=>{
    if(f===1)return ()=>{qa.setAim(0,0);};
    if(f===3000)return ()=>{qa.setPlayer(H.x,H.z+3);};
    if(f===700)return ()=>{key('KeyG');};if(f===701)return ()=>keyUp('KeyG');
    if(f%10===0)return ()=>{const s=G(),alive=s.zombies.filter(e=>!e.dead&&!(e.emergeLeft>0));if(!alive.length)return;
      let near=alive[0],best=Infinity;for(const e of alive){const d=Math.hypot(e.walkPos.x-s.player.x,e.walkPos.z-s.player.z);if(d<best){best=d;near=e;}}
      const tip=near.group.position.clone().add(new T.Vector3(0,1.3,0)),eye=s.camera.position,dx=tip.x-eye.x,dy=tip.y-eye.y,dz=tip.z-eye.z;
      qa.setAim(Math.atan2(-dx,-dz),Math.atan2(dy,Math.hypot(dx,dz)));
      if(f%20===0&&best<(f>1800&&f<3000?0:30)){if(s.run.inventory[s.run.weapon].ammo>0)qa.shoot();else if(!(s.run.reloadLeft>0))qa.reload();}};
    return null;},
    watch:()=>{const s=G();note('fight: kills',s.run.kills>0);note('fight: hurt',s.run.health<100);note('fight: emerging',s.zombies.some(e=>e.emergeLeft>0));note('fight: dead',s.mode==='dead');note('fight: pickups',s.pickups.length>0);note('fight: summit',s.zone.includes('SUMMIT'));}},
  // v206: on the summit of Radio Hill with the gun lowered; the dead climb its slopes to you
  // and strike. Then under the radio tent: they follow you in from every side.
  summit:{frames:4200,dead:true,script:f=>f===1?()=>{qa.setPlayer(H.x,H.z+3);qa.setAim(0,-.3);}:f===2400?()=>{qa.setPlayer(S.x+tentLane,S.z);}:null,
    watch:()=>{const s=G();note('summit: hurt',s.run.health<100);note('summit: climbing',s.zombies.some(e=>!e.dead&&groundHeight(e.walkPos.x,e.walkPos.z)>9));note('summit: in the tent',s.zombies.some(e=>!e.dead&&(s.island.tentInside||s.island.shackInside)(e.walkPos.x,e.walkPos.z)));}},
  // v208, the threat director: three escalation scenarios, each a run begun far into the kill
  // count (so the dead come ashore at that threat), held on the south beach with an M4 against
  // the nearest. You cannot die here (the director is what is traced), and a `threat` channel
  // records the level, rank, target, the kind waiting to come ashore and the living count.
  // threshold: from 95 kills, across into The Hunt (level 6) mid-fight; swarm: level 14;
  // apocalypse: level 24, every kind, filling towards 45.
  threshold:{frames:2400,dead:true,threat:true,setup:()=>escalate(95),script:holdBeach,watch:()=>{note('threshold: the hunt',G().shore.level>=6);note('threshold: specials',G().zombies.some(e=>e.dog||e.feral||e.brute||e.lurker));}},
  swarm:{frames:2400,dead:true,threat:true,setup:()=>escalate(260),script:holdBeach,watch:()=>{note('swarm: inland',G().shore.counts?.interior>0);note('swarm: dogs',G().zombies.some(e=>e.dog&&!e.rareDog));note('swarm: ferals',G().zombies.some(e=>e.feral));note('swarm: ashfangs',G().zombies.some(e=>e.rareDog));}},
  apocalypse:{frames:3000,dead:true,threat:true,setup:()=>escalate(460),script:holdBeach,watch:()=>{const s=G();note('apocalypse: inland',s.shore.counts?.interior>0);note('apocalypse: minor',s.shore.counts?.minor>0);note('apocalypse: batches',s.shore.counts?.batches>0);note('apocalypse: ashfangs',s.zombies.some(e=>e.rareDog));note('apocalypse: ferals',s.zombies.some(e=>e.feral));note('apocalypse: brutes',s.zombies.some(e=>e.brute));note('apocalypse: lurkers',s.zombies.some(e=>e.lurker));note('apocalypse: 25+',s.zombies.filter(e=>!e.dead).length>=25);}},
  // The session: pause, Settings and the controls card, Resume, a pause to the title, and back in.
  session:{frames:480,script:f=>f===30?()=>key('Escape'):f===60?()=>$('settingsPause').onclick():f===90?()=>key('Escape'):f===120?()=>$('controlsPause').onclick():f===150?()=>key('Escape'):f===180?()=>$('resume').onclick():
    f===260?()=>key('Escape'):f===290?()=>$('mainMenuPause').onclick():f===320?()=>$('confirmYes').onclick():f===400?()=>enter():null,
    watch:()=>{note('session: paused',G().mode==='paused');note('session: title',G().mode==='menu');}},
  // v210, the map: stand on each station pad in turn, looking at Radio Hill's tower, then walk
  // toward it for a second (the HUD's place names, the view and the ground under each landmark).
  landmarks:{frames:720,script:f=>{const pads=G().island.stations;if(!pads)return null;const k=Math.floor((f-1)/90),p=pads[k];if(!p)return null;
    if((f-1)%90===0)return ()=>{qa.setKeys([]);qa.setPlayer(p.x,p.z);qa.setAim(yawToFrom(p.x,p.z,ISLAND.tower.x,ISLAND.tower.z),.08);};
    if((f-1)%90===30)return ()=>qa.setKeys(['KeyW']);if((f-1)%90===89)return ()=>qa.setKeys([]);return null;},
    watch:()=>{const z=G().zone;for(const n of ['RUIN','SHIPWRECK','CAMP','DOCK','EAST COVE','FORGE','SUMMIT'])note('landmarks: '+n.toLowerCase(),z.includes(n));}}
};

const out={tide:true,boot:fullLogs?bootLog.join('\n'):fnv(bootLog.join('\n'))};
enter();await settle();
let index=0;
// The island's own scenarios first, then the fights (v206), so nothing a fight leaves behind
// reaches a scenario that builds before the dead also play.
const order=Object.keys(scenarios).sort((a,b)=>(scenarios[a].dead?1:0)-(scenarios[b].dead?1:0));
for(const name of order){const sc=scenarios[name];
  seed=0x71de5+(++index)*977;Math.random=seeded;qa.setSeed?.(206+index);
  qa.resetRun();await settle();
  // v206: the island's own scenarios hold the shore (no dead), so they match builds before it.
  if(!sc.dead&&G().shore)G().shore.target=0;
  sc.setup?.();step();renderLog.length=0;audioLog.length=0;
  const known=new WeakSet(),births=[],frames=[snapshot(sc)];
  for(let f=1;f<=sc.frames;f++){
    const act=sc.script(f);if(act)act();step();await settle();
    for(const e of G().zombies||[])if(!known.has(e)){known.add(e);births.push(birth(e));note('births');}
    sc.watch?.();if(f%30===0)frames.push(snapshot(sc));
  }
  qa.setKeys([]);listeners.mouseup?.({button:0});listeners.mouseup?.({button:2});
  out[name]={frames,births};
}
// Written synchronously: a pipe (as release-tier.mjs reads it) would lose the end of a large
// asynchronous write when the process exits.
(await import('node:fs')).writeSync(1,JSON.stringify(out)+'\n');
console.error('coverage: '+Object.entries(seen).filter(([k])=>!k.startsWith('sound:')).map(([k,v])=>`${k} ${v}`).join(', '));
process.exit(0);

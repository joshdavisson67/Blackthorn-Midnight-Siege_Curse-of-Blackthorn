#!/usr/bin/env node
// Golden trace (v194): plays fixed, seeded scenarios through the test harness and
// records where every enemy is, how hurt it is, and how the player fares, frame by
// frame. Two builds that behave identically produce byte-identical traces, so a
// refactor that only moves code (Dead Tide step 1) must not change a single digit.
//
//   node scripts/golden-trace.mjs > after.json
//   (in an older checkout) node scripts/golden-trace.mjs > before.json
//   cmp before.json after.json
//
// Randomness (Math.random and the game's own generator) is seeded and the clock is
// fixed before the game loads; every scenario starts from a fresh run. Every enemy's
// birth is recorded too: where it appeared and everything it was rolled with. A
// coverage line on stderr confirms each scenario reached the behaviour it tests.
//
// v201: sound and the screen are traced too. A recording Web Audio context logs every
// node the game makes, how it is wired, and every value and ramp it is given; the
// renderer stand-in logs every call (targets, sizes, both camera passes, shader
// compiles and texture uploads). Both are hashed per sample; GOLDEN_LOGS=1 writes
// them out in full.
//
// v203: the first-person view. Every sample hashes the pose of every part of the
// guns in hand (slide, twin SMG kicks, scope masks, bodies), with the camera's pose
// and both fields of view, the muzzle flash and light, and the flashlight; a new
// scenario aims, fires, reloads and sprints with every gun, the twin Ravens, the
// Blood Moon dot sight, a grenade and the flashlight.
// v202: a station tour. Every station on the estate is visited in turn, early in a run
// and again after wave 21 (shed, cellar, tomb and attic open): the prompt the player sees,
// then E with no essence, with plenty, and once more, recording the message shown,
// the run (essence, health, armor, perks, every weapon's ranks, Forge and ammo) and
// the station itself after each.
let seed=0x5eed1;
Math.random=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
let clock=1000;performance.now=()=>clock;Date.now=()=>1.7e12+clock;
const n6=v=>typeof v==='number'?(Number.isFinite(v)?+v.toFixed(6):String(v)):v===null||v===undefined?String(v):typeof v==='object'?(v.constructor?.name||'object'):String(v);
const renderLog=[];
globalThis.__qaRenderLog=(name,args,renderer)=>{let d=name;
  if(name==='render'||name==='compileAsync'){const [scene,c]=args;d+=` ${scene.children.length} ${c.type} ${c.layers.mask} ${n6(c.fov)} ${n6(c.aspect)} ${n6(c.near)} ${n6(c.far)} ${scene.background?.isColor?scene.background.getHexString():n6(scene.background)} ${renderer.autoClear}`;}
  else if(name==='setRenderTarget'){const t=args[0];d+=t?` ${t.width}x${t.height}/${t.samples}`:' screen';}
  else if(name==='initTexture'){const t=args[0];d+=t?` ${t.constructor.name} ${t.image?.width}x${t.image?.height} ${t.name}`:' none';}
  else d+=' '+args.map(n6).join(' ');
  renderLog.push(d);};
const audioLog=[];
class RecordingAudio{
  constructor(){this.state='running';this.sampleRate=8;this.destination={id:'out'};this.count=0;RecordingAudio.current=this;audioLog.push('context');}
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
    return {id,duration:length/rate,length,sampleRate:rate,getChannelData:()=>data,sum:()=>data.reduce((a,b)=>a+b,0)};}
  createBufferSource(){return this.node('source',{playbackRate:1});}
  createBiquadFilter(){return this.node('filter',{frequency:350,Q:1});}
  createGain(){return this.node('gain',{gain:1});}
  createOscillator(){return this.node('oscillator',{frequency:440});}
  resume(){this.state='running';audioLog.push('resume');note('sound: resumed');}
}
const {qa,frames,gameCanvas,listeners,elements,windowEvents,document:page,acquireMouse}=await import('../tests/harness.mjs');
const {UPPER_Y,OLIVIA_ATTIC,STAIR}=await import('../.qa/vertical.mjs');
const {EASTER_EGG}=await import('../.qa/olivia.mjs');
const {BOSS}=await import('../.qa/blackthorn-boss.mjs');
const T=await import('../.qa/three.module.js');
const {CELLAR}=await import('../.qa/cellar-layout.mjs');
const {CAMP_RULES}=await import('../.qa/camp-spawns.mjs');
const st=()=>qa.get();
globalThis.window.AudioContext=RecordingAudio;
const fullLogs=process.env.GOLDEN_LOGS==='1',bootLog=renderLog.splice(0);
const drain=log=>{const t=log.splice(0).join('\n');return fullLogs?t:fnv(t);};
const r=v=>Number.isFinite(v)?v:String(v);
// The page itself: every element's classes, inline style, hidden flag and (for those
// with no named children) its markup, hashed per sample; run ids (random UUIDs in the
// leaderboard's saved-run picker) are masked. GOLDEN_DOM=1 writes it out in full.
const fnv=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16);};
const domState=()=>{let t='';for(const [id,el] of elements)t+=id+'|'+(el.getAttribute('class')||'')+'|'+(el.getAttribute('style')||'')+'|'+(el.hasAttribute('hidden')?1:0)+'|'+(el.querySelector('[id]')?'':el.innerHTML)+'\n';t=t.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g,'run-id');return process.env.GOLDEN_DOM?t:fnv(t);};
const seen={};const note=(k,v=true)=>{if(v===true)seen[k]=(seen[k]||0)+1;};
function snapshot(){const s=st();return {
  player:[s.player.x,s.player.y,s.player.z,s.health,s.armor,s.points,s.totalScore,s.kills,s.wave,s.weapon,s.inventory[s.weapon]?.ammo??null,s.inventory[s.weapon]?.reserve??null,s.grenades,s.doubleTime,s.grenadeTime,s.boneChips,s.effects.length].map(r),
  zombies:s.zombies.map(e=>[e.dead?1:0,e.brute?1:0,e.dog?1:0,e.feral?1:0,e.lurker?1:0,e.boss?1:0,e.warden?1:0,e.walkPos.x,e.walkPos.y,e.walkPos.z,e.hp,e.group.rotation.y,e.group.position.y,e.attackTime,e.stuck,e.crawling?1:0,e.crouch??0,e.warCry??0,e.bellaSwings??0,e.enraged?1:0,e.staggerLeft??0,e.death??0,e.group.visible?1:0].map(r)),
  dom:domState(),
  pickups:s.pickups.map(p=>[p.type,p.mesh.position.x,p.mesh.position.y,p.mesh.position.z,p.life,p.value??0].map(r)),
  run:[s.health,s.maxHealth,s.armor,s.armorMax,s.armorTier,s.runTime,s.lastHurt,s.jumpV,s.feetY,s.grounded?1:0,s.camera.position.x,s.camera.position.y,s.camera.position.z,s.camera.rotation.x,s.camera.rotation.y,[...s.perkOwned].join('+')].map(r),
  session:[s.mode,s.pointer?1:0,s.mouseDown?1:0,s.aiming?1:0,s.lookYaw,s.lookPitch,page.pointerLockElement?1:0,s.keys?.size??0].map(r),
  arms:[s.shotTimer,s.reloadLeft,s.reloadDuration,s.grenadeCooldown,s.aiming?1:0,s.mouseDown?1:0,s.weaponRecoil.pitch,s.weaponRecoil.yaw,s.weaponRecoil.back,s.weaponRecoil.lift,s.camera.fov,s.smgDual.visible?1:0,
    ...Object.values(s.inventory).flatMap(v=>[v.owned?1:0,v.ammo,v.reserve,v.weaponRank,v.forgeRank]),...Object.values(s.gunGroups).map(g=>g.visible?1:0)].map(r),
  screen:[drain(renderLog),...screenState(s)].map(r),
  view:viewState(s),
  audio:drain(audioLog)
};}
// The view in hand: every node under the gun root, hashed; then the camera and lights.
const viewState=s=>{let t='';s.gunRoot.traverse(o=>{t+=o.name+'|'+o.visible+'|'+o.position.toArray().join(',')+'|'+o.rotation.toArray().slice(0,3).join(',')+'|'+o.scale.toArray().join(',')+'\n';});
  if(process.env.GOLDEN_VIEW==='1')return t;
  return [fnv(t),s.gunRoot.visible?1:0,...s.camera.position.toArray(),...s.camera.rotation.toArray().slice(0,3),s.camera.fov,s.viewFov,s.viewKick,s.flashTime,s.reloadDrop,s.flash.visible?1:0,s.muzzleLight.intensity,...s.muzzleLight.position.toArray(),
    s.flashlight.intensity,s.flashlight.visible?1:0,s.flashlightOn?1:0,s.grenadeThrow.root.visible?1:0,elements.get('crosshair').style.opacity].map(r);};
// The renderer's settings, the scene target and both cameras.
const screenState=s=>{const R=s.renderer;return [R.pr,R.autoClear,R.shadowMap.enabled,R.shadowMap.type,R.toneMapping,R.toneMappingExposure,R.outputColorSpace,s.rt.width,s.rt.height,s.rt.samples,
  s.camera.aspect,s.camera.near,s.camera.far,s.camera.fov,s.viewCamera.fov,s.viewCamera.layers.mask,s.scene.fog.density,R.compileCalls?.length??0,R.initializedTextures?.size??0,s.postMat.uniforms.brightness.value];};
// Everything an enemy is rolled with when it is made and placed.
const birth=e=>[e.walkPos.x,e.walkPos.y,e.walkPos.z,e.group.position.y,e.hp,e.maxHp,e.speed,e.radius,e.bodyHeight,e.crouch,e.brute?1:0,e.dog?1:0,e.rareDog?1:0,e.feral?1:0,e.lurker?1:0,e.elite?1:0,e.crawling?1:0,
  e.templateIndex,e.routeSide,e.flank,e.attack,e.groan,e.navigation?.seed,e.life?.type,e.life?.vigor,e.vigor,e.injury?.major,e.injury?.legless?1:0,e.injury?.props?.length,e.campBorn,e.graveBorn?1:0,e.emergeLeft,e.group.scale.x,e.face?.variant,e.build?.k,e.style].map(r);
function run(name,setup,steps,every=30){
  seed=0x5eed1+name.length*977;clock=1000;qa.setSeed(7123);qa.setEventRandom(()=>1);
  const known=new WeakSet(),births=[];let last=0;
  const born=()=>{const z=st().zombies;if(z.length<last)note('corpses removed');last=z.length;for(const e of z)if(!known.has(e)){known.add(e);births.push(birth(e));track(e);}};
  qa.start();setup();born();const out=[snapshot()];
  for(let f=1;f<=steps;f++){
    const act=actions[name]?.(f);if(act)act();
    frames(1);clock+=16.6667;born();if(f%every===0)out.push(snapshot());
    watch[name]?.();
  }
  qa.setKeys([]);return {frames:out,births};
}
function track(e){note('births');note('upper births',e.walkPos.y>4);note('lurker births',!!e.lurker);note('ashfang births',!!e.rareDog);note('feral births',!!e.feral);note('brute births',!!e.brute&&!e.elite);
  note('injured births',!!e.injury?.major||!!e.injury?.props?.length);note('crawler births',!!e.crawling);note('camp births',!!e.campBorn);note('grave births',!!e.graveBorn);note('elite births',!!e.elite);}
const actions={
  brawl:f=>f%18===0?()=>qa.shoot():f===240?()=>qa.setKeys(['KeyA']):f===420?()=>qa.setKeys(['KeyD']):f===600?()=>qa.setKeys([]):null,
  waves:f=>f%25===0?()=>qa.shoot():null,
  mixed:f=>f%20===0?()=>qa.shoot():f===300?()=>qa.setKeys(['KeyS']):f===480?()=>qa.setKeys([]):null,
  boss:f=>f===700?()=>{for(const w of st().zombies)if(w.warden&&!w.dead){note('warden shield hit');qa.damageEnemy(w,40,false,{part:'shield',direction:new T.Vector3(0,0,1),source:'glock'});}}:f%40===0?()=>qa.shoot():null,
  late:f=>f%15===0?()=>qa.shoot():null,
  // The play session: mouse look, keys for every action, Escape to pause, Resume (mouse
  // capture), settings, both confirm prompts, a hidden tab, a lost focus, the main menu
  // and back in; then touch play and the controller's actions.
  // v203: aim, fire, reload and sprint with every gun; the twin Ravens, the dot sight,
  // a grenade and the flashlight.
  sights:f=>{const guns=['glock','shotgun','smg','bushmaster','rifle','lmg'],b=Math.floor(f/100),k=f%100,key=code=>()=>listeners.keydown({code,key:code,preventDefault(){},repeat:false,target:{}});
    if(b<guns.length){const g=guns[b];
      if(k===1)return ()=>{for(let i=0;i<400&&st().reloadLeft>0;i++)frames(1);qa.selectWeapon(g);};if(k===20)return ()=>gameCanvas.events.mousedown({button:2});if(k===40||k===46)return ()=>qa.shoot();
      if(k===60)return ()=>listeners.mouseup({button:2});if(k===64)return ()=>{st().inventory[g].ammo=1;qa.reload();};if(k===80)return ()=>qa.setKeys(['KeyW','ShiftLeft']);if(k===95)return ()=>qa.setKeys([]);return null;}
    if(b===6){if(k===1)return ()=>{for(let i=0;i<400&&st().reloadLeft>0;i++)frames(1);st().inventory.smg.weaponRank=4;qa.selectWeapon('glock');qa.selectWeapon('smg');};if(k===20)return ()=>gameCanvas.events.mousedown({button:2});if(k>=30&&k<=60&&k%6===0)return ()=>qa.shoot();if(k===70)return ()=>listeners.mouseup({button:2});return null;}
    if(b===7){if(k===1)return ()=>{for(let i=0;i<400&&st().reloadLeft>0;i++)frames(1);st().inventory.bushmaster.weaponRank=1;qa.selectWeapon('glock');qa.selectWeapon('bushmaster');};if(k===20)return ()=>gameCanvas.events.mousedown({button:2});if(k===40)return ()=>qa.shoot();if(k===70)return ()=>listeners.mouseup({button:2});return null;}
    if(b===8){if(k===1)return ()=>qa.grenade();if(k===50)return key('KeyF');if(k===70)return key('KeyF');if(k===80)return ()=>qa.setKeys(['KeyA']);if(k===95)return ()=>qa.setKeys([]);}
    return null;},
  // v201: the screen and the sound. Each quality (pixel ratio, antialiasing, shadows,
  // dust), a portrait window and back, slow frames that lower the resolution and
  // quick ones that raise it again, the sound off and on mid-fight, and a sleeping
  // audio context woken by Resume.
  screen:f=>{const quality=v=>()=>{elements.get('quality').value=v;elements.get('quality').onchange();},size=(w,h)=>()=>{globalThis.innerWidth=w;globalThis.innerHeight=h;windowEvents.resize?.();},
      sound=on=>()=>{elements.get('sound').checked=on;elements.get('sound').onchange?.();},key=code=>()=>listeners.keydown({code,key:code,preventDefault(){},repeat:false,target:{}});
    const plan={30:quality('low'),90:quality('ultra'),150:size(820,1180),210:size(1280,720),240:()=>frames(30,40),241:()=>frames(60,30),242:()=>frames(60,26),
      330:sound(false),360:sound(true),400:quality('high'),450:()=>{RecordingAudio.current.state='suspended';key('Escape')();},460:()=>elements.get('resume').onclick?.(),465:acquireMouse,520:quality('low'),580:()=>{globalThis.devicePixelRatio=1;quality('high')();}};
    return plan[f]||(f%20===0?()=>qa.shoot():null);},
  shell:f=>{const key=(code,more={})=>()=>listeners.keydown({code,key:code,preventDefault(){},repeat:false,target:{},...more}),up=code=>()=>listeners.keyup({code}),click=id=>()=>elements.get(id).onclick?.();
    const plan={1:()=>{for(let i=0;i<20;i++)listeners.mousemove({movementX:7,movementY:-3});},20:()=>{for(let i=0;i<20;i++)listeners.mousemove({movementX:-4,movementY:5});},
      30:key('KeyW'),60:up('KeyW'),61:key('Digit2'),62:key('Digit3'),63:key('Digit1'),64:()=>{st().inventory.glock.ammo=3;},65:key('KeyR'),66:key('KeyR',{repeat:true}),120:key('KeyF'),121:key('KeyF'),122:key('KeyG'),
      200:key('Escape'),210:click('settingsPause'),215:key('Escape'),220:click('restart'),225:click('confirmNo'),230:click('resume'),235:acquireMouse,
      300:()=>{page.hidden=true;listeners.visibilitychange?.();page.hidden=false;},310:click('resume'),315:acquireMouse,
      400:()=>windowEvents.blur?.(),410:click('resume'),415:acquireMouse,
      450:key('Escape'),460:click('mainMenuPause'),465:click('confirmYes'),480:()=>qa.start(),490:acquireMouse,
      500:key('Escape'),510:click('restart'),515:click('confirmYes'),520:acquireMouse,
      560:()=>{gameCanvas.events.mousedown({button:0,preventDefault(){}});gameCanvas.events.mousedown({button:2,preventDefault(){}});},600:()=>{listeners.mouseup({button:0});listeners.mouseup({button:2});},
      620:()=>{page.exitPointerLock();},630:()=>{gameCanvas.events.mousedown({button:0,preventDefault(){}});},635:acquireMouse,
      700:()=>{const s=st();s.controlScheme.choose?.('touch');},710:click('resume'),720:()=>{const t=st().touchControls;},800:()=>{st().controlScheme.choose?.('standard');}};
    return plan[f]||null;},
  // Walking, sprinting, aimed strafing and jumping; the hall stairs up and down; health
  // coming back after a hit; Nightstride; and body armor that soaks up and regrows.
  moves:f=>{const key=code=>()=>listeners.keydown({code,key:code,preventDefault(){},repeat:false,target:{}});
    const plan={1:()=>qa.setKeys(['KeyW']),60:()=>qa.setKeys(['KeyW','ShiftLeft']),120:()=>{qa.setKeys(['KeyD']);gameCanvas.events.mousedown({button:2});},180:()=>listeners.mouseup({button:2}),
      190:()=>{qa.setKeys(['KeyW']);key('Space')();},230:key('Space'),260:()=>{qa.setKeys([]);qa.setPlayer(STAIR.x,STAIR.bottomZ+1.2);qa.setAim(0,0);qa.setKeys(['KeyW']);},
      420:()=>{qa.setKeys([]);qa.setAim(Math.PI,0);qa.setKeys(['KeyW']);},560:()=>{qa.setKeys([]);qa.hurtPlayer(30,st().player.clone());},
      700:()=>{qa.setPoints(1e6);const p=st().interactables.find(s=>s.type==='perk'&&s.name==='NIGHTSTRIDE'&&!(s.y>1));qa.setPlayer(p.x+Math.sin(p.rotation||0)*1.6,p.z+Math.cos(p.rotation||0)*1.6);frames(1);qa.interact();qa.setAim(0,0);qa.setKeys(['KeyA']);},
      780:()=>{qa.setKeys([]);const a=st().interactables.find(s=>s.type==='armor'&&s.y>1);qa.setPlayer(a.x+Math.sin(a.rotation||0)*1.6,a.z+Math.cos(a.rotation||0)*1.6,a.y);frames(1);qa.interact();qa.interact();qa.interact();},
      800:()=>qa.hurtPlayer(25,st().player.clone()),900:()=>qa.hurtPlayer(10,st().player.clone()),1100:()=>qa.setHealth(20)};
    return plan[f]||null;},
  // Every gun in turn: clicks for the semi-autos, held triggers for the automatics,
  // aiming down sights, empty magazines, reloads and a switch attempted mid-reload.
  arsenal:f=>{const down=b=>()=>gameCanvas.events.mousedown({button:b}),up=b=>()=>listeners.mouseup({button:b});
    const plan={1:()=>qa.selectWeapon('glock'),130:()=>{qa.selectWeapon('smg');down(0)();},250:up(0),260:()=>qa.selectWeapon('shotgun'),300:down(2),400:up(2),
      420:()=>{qa.selectWeapon('bushmaster');down(2)();},540:up(2),560:()=>{qa.selectWeapon('rifle');down(2)();down(0)();},680:()=>{up(0)();up(2)();},700:()=>{qa.selectWeapon('lmg');down(0)();},830:up(0),
      840:()=>qa.reload(),850:()=>qa.selectWeapon('glock'),900:()=>qa.selectWeapon('smg'),905:()=>qa.reload()};
    if(plan[f])return plan[f];
    if((f<120||(f>260&&f<410)||(f>420&&f<550))&&f%20===0)return down(0);
    if((f<120||(f>260&&f<410)||(f>420&&f<550))&&f%20===4)return up(0);
    return null;},
  // Weapon ranks bought at the bench and racks, then fired: the pistol's dot, the twin
  // Ravens, the shotgun and the Bushmaster's red dot; and a restock at the ammo crate.
  upgrades:f=>{if(f===1)return ()=>{qa.setPoints(1e6);for(let i=0;i<5;i++){at('glock');qa.interact();}};
    if(f===40)return ()=>{st().inventory.smg.owned=true;for(let i=0;i<5;i++){at('smg');qa.interact();}};
    if(f===80)return ()=>{st().inventory.shotgun.owned=true;for(let i=0;i<4;i++){at('shotgun');qa.interact();}};
    if(f===120)return ()=>{st().inventory.bushmaster.owned=true;for(let i=0;i<6;i++){at('bushmaster');qa.interact();}};
    if(f===160)return ()=>{qa.setPlayer(0,24);qa.setAim(0,-.06);qa.selectWeapon('smg');gameCanvas.events.mousedown({button:0});};
    if(f===300)return ()=>{listeners.mouseup({button:0});qa.selectWeapon('glock');};
    if(f>300&&f<420&&f%15===0)return ()=>{gameCanvas.events.mousedown({button:0});listeners.mouseup({button:0});};
    if(f===430)return ()=>{qa.selectWeapon('shotgun');};
    if(f>430&&f<560&&f%30===0)return ()=>{gameCanvas.events.mousedown({button:0});listeners.mouseup({button:0});};
    if(f===570)return ()=>{qa.selectWeapon('bushmaster');gameCanvas.events.mousedown({button:2});};
    if(f>570&&f<700&&f%10===0)return ()=>{gameCanvas.events.mousedown({button:0});listeners.mouseup({button:0});};
    if(f===710)return ()=>{listeners.mouseup({button:2});const crate=st().interactables.find(s=>s.type==='ammo'&&s.name==='AMMUNITION');qa.setPlayer(crate.x,crate.z+1.6);frames(1);qa.interact();qa.interact();};
    if(f===740)return ()=>{const forge=st().interactables.find(s=>s.type==='upgrade'&&!(s.y<-1));qa.setPlayer(forge.x+Math.sin(forge.rotation||0)*1.6,forge.z+Math.cos(forge.rotation||0)*1.6);frames(1);qa.interact();};
    return null;},
  // Grenades: counted throws, infinite ones with their cooldown, and a throw into a wall.
  throws:f=>f===1||f===40||f===80?()=>qa.grenade():f===200?()=>{qa.dropPickup(st().player.x,st().player.z,'grenades');}:f>200&&f<420&&f%12===0?()=>qa.grenade():f===500?()=>{qa.setGrenades(2);qa.setPlayer(6,12.6);qa.setAim(0,0);qa.grenade();}:null,
  // Thrown grenades into a ring of 20, a direct blast, and one close enough to hurt.
  grenades:f=>f===1||f===150||f===300?()=>qa.grenade():f===450?()=>qa.explode(new T.Vector3(3,.3,13)):f===520?()=>qa.explode(st().player.clone().add(new T.Vector3(1.5,.3,0))):f===600?()=>{qa.setAim(0,-.2);}:f>600&&f%10===0?()=>qa.shoot():null,
  // The M4 capstone's detonating rounds, then the LMG capstone's healing kills.
  ranks:f=>f===200?()=>{let n=0;for(const e of st().zombies)if(!e.dead&&!e.dog&&!e.brute&&n++<3)for(let i=0;i<30&&!e.crawling&&!e.dead;i++)qa.damageEnemy(e,e.maxHp*.05,false,{part:'leg',side:1,direction:new T.Vector3(0,0,-1),force:1,source:'glock'});}:f===420?()=>{const inv=st().inventory.lmg;inv.owned=true;inv.weaponRank=4;inv.ammo=200;inv.reserve=500;qa.selectWeapon('lmg');qa.setHealth(40);ring(14,0,13,4);}:f%6===0?()=>qa.shoot():null,
  // Power-ups, grave essence and a bone chip: walk over some, let one expire.
  pickups:f=>f===60?()=>qa.setPlayer(2,20):f===120?()=>qa.setPlayer(-2,20):f===180?()=>qa.setPlayer(0,24):f===240?()=>qa.setPlayer(4,24):f===300?()=>qa.setPlayer(-4,24):f===360?()=>{qa.setPoints(0);qa.grenade();}:f===420?()=>qa.setPlayer(6,16):null,
  // Bella freed among weak walkers: her kills drop bone chips, which the player gathers.
  bellakills:f=>f>200&&f%90===0?()=>{const c=st().pickups.find(p=>p.type==='bone');if(c)qa.setPlayer(c.mesh.position.x,c.mesh.position.z);}:null,
  // Clear wave 5 to start its finale, then jump to wave 10 and clear it for the stench finale.
  finales:f=>f===1||f===901?()=>{if(f===901)while(st().wave<10)qa.startWave();qa.clearQueuedSpawns();for(const e of st().zombies)if(!e.dead)qa.damageEnemy(e,1e9);}:f%30===0?()=>qa.shoot():null,
};
const watch={
  stairs:()=>note('on stairs',st().zombies.some(e=>!e.dead&&e.walkPos.y>.3&&e.walkPos.y<UPPER_Y-.3)),
  bella:()=>note('bella swings',st().zombies.some(e=>e.bellaSwings>0)),
  attic:()=>note('climbing to attic',st().zombies.some(e=>!e.dead&&e.walkPos.y>UPPER_Y+.3)),
  frenzy:()=>note('frenzy',st().frenzyWave===st().wave),
  surge:()=>note('surge event',st().worldEvents.active('surge')),
  finales:()=>{note('wave 5 finale',st().waveFiveFinale?.wave===5);note('stench finale',st().waveFiveFinale?.wave===10);},
  sights:()=>{const s=st();note('view: aimed',s.gunRoot.position.x<.05&&s.aiming);note('view: scoped',s.viewFov<30);note('view: flash',s.flash.visible);note('view: reload drop',s.reloadDrop>0);note('view: sprint roll',Math.abs(s.gunRoot.rotation.z+.25)<1e-9);note('view: twin ravens',s.smgDual.visible);note('view: dot sight',s.weapon==='bushmaster'&&s.gunGroups.bushmaster.visible===false&&s.gunRoot.visible);note('view: flashlight off',!s.flashlightOn);note('view: grenade in hand',s.grenadeThrow.root.visible);},
  screen:()=>{const s=st();note('screen: reduced resolution',s.rt.width<Math.round(innerWidth*s.renderer.pr));note('screen: portrait',innerHeight>innerWidth);note('screen: low quality',s.rt.samples===2);note('screen: ultra pixel ratio',s.renderer.pr===2);note('screen: high pixel ratio',s.renderer.pr===1.5);note('sound: muted',!elements.get('sound').checked);},
  shell:()=>{const s=st();note('session '+s.mode,true);note('mouse locked',!!page.pointerLockElement);note('aiming (shell)',s.aiming);},
  moves:()=>{const s=st();note('airborne',!s.grounded);note('upstairs',s.player.y>4);note('on the hall stairs',s.player.y>.5&&s.player.y<4);note('health regrowing',s.health>40&&s.health<100);note('nightstride',s.perkOwned.has('stride'));note('armor tier 2+',s.armorTier>=2);note('armor regrowing',s.armorTier>=2&&s.armor>0&&s.armor<s.armorMax);},
  arsenal:()=>{const s=st();note('aimed',s.aiming);note('reloading',s.reloadLeft>0);note('held trigger',s.mouseDown&&s.weapon!=='glock');note(s.weapon+' out',true);},
  upgrades:()=>{const s=st();note('forged',Object.values(s.inventory).some(v=>v.forgeRank>0));note('twin ravens',s.smgDual.visible);note('pistol rank 4',s.inventory.glock.weaponRank>=4);note('shotgun ranks',s.inventory.shotgun.weaponRank>0);note('bushmaster ranks',s.inventory.bushmaster.weaponRank>0);},
  throws:()=>{note('infinite grenades',st().grenadeTime>0);note('grenade cooldown',st().grenadeCooldown>0);},
  grenades:()=>{note('lurker burst',st().zombies.some(e=>e.lurkerBurst));note('corpse cap',st().zombies.filter(e=>e.dead).length>=14);note('enraged',st().zombies.some(e=>e.enraged));note('drops on the ground',st().pickups.length>0);note('blast hurt the player',st().health<1e6);},
  ranks:()=>{note('lurker burst (ranks)',st().zombies.some(e=>e.lurkerBurst));note('healed by a kill',st().health>40&&st().weapon==='lmg');note('crawlers',st().zombies.some(e=>e.crawling&&!e.dead));},
  pickups:()=>{note('double damage',st().doubleTime>0);note('infinite grenades',st().grenadeTime>0);note('bone chip collected',st().boneChips>0);note('essence collected',st().points>0&&st().points<1e6);},
  bellakills:()=>{note('bone chips dropped',st().pickups.some(p=>p.type==='bone'));note('bella kills',st().kills>0);note('chips gathered',st().boneChips>0);},
  boss:()=>{note('boss active',st().boss.stage==='active');note('war cry',st().zombies.some(e=>e.warCry>0));note('player hurt',st().health<1e6);},
};
const at=type=>{const list=st().interactables.filter(s=>s.type===type),s=list.find(s=>!(s.y>1))||list[0];qa.setPlayer(s.x+Math.sin(s.rotation||0)*1.6,s.z+Math.cos(s.rotation||0)*1.6,s.y||0);frames(1);};
const ring=(n,cx,cz,rad,y=0)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;qa.makeZombie(cx+Math.sin(a)*rad,cz+Math.cos(a)*rad,i%5===3,i%7===5,false,y,i%6===4);}};
const tour=[];
const stationState=s=>[s.used??'-',s.purchased??'-',s.locked??'-',s.forgeRank??'-',s.forgeMaximum??'-',s.armorTier??'-',s.price??'-'].map(r);
const runDigest=()=>{const s=st();return [s.points,s.health,s.maxHealth,s.armor,s.armorMax,s.armorTier,s.weapon,[...s.perkOwned].join('+'),s.grenades,s.doubleTime,s.grenadeTime,s.reloadLeft,s.bella.unlocked?1:0,s.bella.rank,s.frenzyWave,s.wave,s.waveDelay,
  ...Object.entries(s.inventory).flatMap(([k,v])=>[k,v.owned?1:0,v.ammo,v.reserve,v.weaponRank,v.forgeRank])].map(r);};
function visitStations(label){
  for(const [i,s] of st().interactables.entries()){
    const turn=s.rotation||0;qa.setPlayer(s.x+Math.sin(turn)*1.6,s.z+Math.cos(turn)*1.6,s.y||0);frames(1);
    const seen=()=>{const prompt=elements.get('interaction').innerHTML;if(prompt.includes(s.name))note('tour: '+(s.shedWeapon?'shed weapon':s.type));return [prompt,elements.get('toast').textContent,...runDigest(),...stationState(s)];};
    const row=[label,i,s.type,s.name,...seen()];
    qa.setPoints(0);qa.interact();frames(1);row.push('broke',...seen());
    const before=st().points;qa.setPoints(1e6);qa.interact();frames(1);row.push('paid',...seen());note('tour: spent essence',st().points<1e6);
    qa.interact();frames(1);row.push('again',...seen());
    tour.push(row);
  }
}
const trace={
  brawl:run('brawl',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setPlayer(0,20);qa.setAim(0,-.08);
    for(const [x,z,b,d,a,f] of [[-4,12,0,0,0,0],[3,11,0,0,0,0],[6,14,0,0,0,0],[-7,15,0,0,0,0],[0,9,1,0,0,0],[-9,10,1,0,0,0],[8,9,0,0,0,1],[-2,7,0,0,0,1],[5,6,0,1,0,0],[-5,5,0,1,1,0]])qa.makeZombie(x,z,!!b,!!d,!!a,0,!!f);
    qa.makeLurker(10,8);},900),
  stairs:run('stairs',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setPlayer(-2,-10.5,UPPER_Y);qa.setAim(Math.PI,0);
    for(const [x,z,b] of [[0,8,0],[3,6,0],[-3,5,0],[2,2,1],[-1,10,0],[4,9,0]])qa.makeZombie(x,z,!!b);},900),
  waves:run('waves',()=>{qa.setHealth(1e6);qa.setPlayer(0,22);qa.setAim(0,-.05);qa.startWave();},1800,60),
  mixed:run('mixed',()=>{qa.setHealth(1e6);qa.setPlayer(0,20);qa.setAim(0,-.05);for(let i=0;i<6;i++)qa.startWave();},1200,60),
  // Bella freed and brought down; bitten zombies turn on her.
  bella:run('bella',()=>{qa.startWave();qa.holdSpawns();const b=st().bella;qa.setPlayer(b.station.x,b.station.z+1.5,UPPER_Y);qa.setPoints(1e6);qa.interact();
    frames(240);qa.setPlayer(0,20);b.pos.set(3.5,0,21);frames(2);qa.setHealth(1e6);
    for(const [x,z] of [[0,18.7],[2,17],[-2,16.5],[4,15]]){const e=qa.makeZombie(x,z);e.hp=e.maxHp=1e6;}
    for(const e of st().zombies.slice(0,2))qa.bellaBite(e,1,new T.Vector3(-1,0,0));},600),
  // The attic ladder: walkers detour up to Olivia's room; brutes never do.
  attic:run('attic',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.openAttic();frames(Math.ceil(EASTER_EGG.openTime*60)+4);
    const A=OLIVIA_ATTIC;qa.setPlayer(A.x+1.6,A.z+3.0,A.y);
    for(const [x,z,b] of [[-24,-5,0],[-20,-8,0],[-27,-3,1],[-16,-6,0]])qa.makeZombie(x,z,!!b,false,false,UPPER_Y);
    for(const [x,z] of [[-30,4],[-26,6]])qa.makeZombie(x,z);},1200,40),
  // A frenzy wave: everyone but lurkers runs 40% faster.
  frenzy:run('frenzy',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.startWave();qa.holdSpawns();qa.setPlayer(0,23);ring(8,0,15,4);qa.triggerFrenzy();},600),
  // A world-event wave (the event roll is fixed by setEventRandom).
  surge:run('surge',()=>{qa.setHealth(1e6);qa.setPlayer(0,23);for(let i=0;i<2;i++)qa.startWave();
    let k=0;const roll=[0,.3,0,0,.4,.8];qa.setEventRandom(()=>roll[k++%roll.length]);qa.startWave();qa.holdSpawns();ring(8,0,15,4);},1500,50),
  // Sir Blackthorn: woken at wave 21, summons his Gravewarden and cries war on the crowd.
  boss:run('boss',()=>{for(let i=0;i<21;i++)qa.startWave();qa.clearQueuedSpawns();frames(110);
    const s=st().graveyard.grave;qa.setPlayer(s.x-1.6,s.z);qa.interact();
    frames(Math.ceil((BOSS.wakeDelay+BOSS.lidTime+BOSS.riseTime+BOSS.stepTime+.1)*60)+6);qa.holdSpawns();
    const boss=st().boss.enemy;qa.setHealth(1e6);qa.setPlayer(boss.walkPos.x+3,boss.walkPos.z+5);qa.setAim(Math.PI,-.05);
    qa.makeZombie(boss.walkPos.x+3,boss.walkPos.z+2);qa.makeZombie(boss.walkPos.x-2,boss.walkPos.z+3);},1500,50),
  // Waves 12 and up: upstairs spawns, Grotesque Lurkers, Ashfangs and ferals.
  late:run('late',()=>{qa.setHealth(1e6);qa.setPlayer(0,22);qa.setAim(0,-.05);for(let i=0;i<12;i++)qa.startWave();},1800,60),
  finales:run('finales',()=>{qa.setHealth(1e6);qa.setPlayer(0,22);qa.setAim(0,-.05);for(let i=0;i<5;i++)qa.startWave();},1800,60),
  // Camping in the storm cellar: one wave spawn in three claws up through its floor.
  camp:run('camp',()=>{while(st().wave<CELLAR.unlockWave)qa.startWave();qa.holdSpawns();st().cellar.update(2);qa.setHealth(1e9);
    for(const e of st().zombies)if(!e.dead)qa.damageEnemy(e,1e7);frames(2);
    const x=CELLAR.x,z=CELLAR.entryZ+2.5;qa.setPlayer(x,z,CELLAR.y);st().nav.rebuild(x,z,CELLAR.y);frames(Math.ceil(CAMP_RULES.grace*60)+70);
    for(let i=0;i<6;i++){st().toSpawn=Math.max(st().toSpawn,5);qa.spawnEnemy();}},600),
  // The Awakening event: the dead rise from marked graves.
  awakening:run('awakening',()=>{qa.setHealth(1e6);qa.setPlayer(0,23);for(let i=0;i<2;i++)qa.startWave();
    let k=0;const roll=[0,.6,0,0,.4,.8];qa.setEventRandom(()=>roll[Math.min(k++,roll.length-1)]);qa.startWave();qa.holdSpawns();},1800,60),
  grenades:run('grenades',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setGrenades(4);qa.setPlayer(0,24);qa.setAim(0,-.35);ring(20,0,14,3.2);qa.makeLurker(1.5,14.5);},900),
  ranks:run('ranks',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setPlayer(0,24);qa.setAim(0,-.06);const inv=st().inventory.rifle;inv.owned=true;inv.weaponRank=4;inv.ammo=50;inv.reserve=300;qa.selectWeapon('rifle');ring(14,0,13,4);qa.makeLurker(-6,19);},900),
  pickups:run('pickups',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setPlayer(0,30);qa.setPoints(0);
    qa.dropPickup(2,20,'ammo');qa.dropPickup(-2,20,'double');qa.dropPickup(0,24,'grenades');qa.dropPickup(10,10,'ammo');
    st().eventVisuals.dropEssence(4,24,0,st().pickups);qa.dropBoneChip({walkPos:new T.Vector3(-4,0,24),floorY:0});
    const e=qa.makeZombie(6,12);e.speed=0;qa.damageEnemy(e,1e9,false,{source:'glock'});},1500,50),
  bellakills:run('bellakills',()=>{qa.startWave();qa.holdSpawns();const b=st().bella;qa.setPlayer(b.station.x,b.station.z+1.5,UPPER_Y);qa.setPoints(1e6);qa.interact();
    frames(240);qa.setPlayer(0,24);b.pos.set(0,0,20);frames(2);qa.setHealth(1e6);
    for(const [x,z] of [[2,17],[-2,17],[4,15],[-4,15],[0,14],[3,12],[-3,12],[1,10]]){const e=qa.makeZombie(x,z);e.hp=e.maxHp=30;}},1500,50),
  arsenal:run('arsenal',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setPlayer(0,24);qa.setAim(0,-.06);for(const k in st().inventory)st().inventory[k].owned=true;
    for(let i=0;i<10;i++){const a=(i/10-.5)*1.2,e=qa.makeZombie(Math.sin(a)*9,24-Math.cos(a)*9,i%3===0);e.hp=e.maxHp=5e3;e.speed=.3;}},1000,25),
  upgrades:run('upgrades',()=>{qa.holdSpawns();qa.setHealth(1e6);for(let i=0;i<8;i++){const e=qa.makeZombie(-4+i,15);e.hp=e.maxHp=4e3;e.speed=.2;}},760,20),
  throws:run('throws',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setGrenades(3);qa.setPlayer(0,24);qa.setAim(0,-.25);ring(12,0,14,3);},700,25),
  moves:run('moves',()=>{qa.holdSpawns();qa.setHealth(70);qa.setPlayer(0,9);qa.setAim(0,0);},1200,10),
  sights:run('sights',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setGrenades(3);qa.setPlayer(0,24);qa.setAim(0,-.05);for(const k in st().inventory){st().inventory[k].owned=true;st().inventory[k].weaponRank=0;}},900,10),
  // The station tour, early and late in a run (see visitStations).
  stations:run('stations',()=>{qa.holdSpawns();qa.setHealth(1e9);visitStations('early');
    for(let i=0;i<21;i++){qa.startWave();for(const e of st().zombies)if(!e.dead)qa.damageEnemy(e,1e9);}qa.holdSpawns();frames(900);
    qa.openAttic();frames(Math.ceil(EASTER_EGG.openTime*60)+10);
    for(const e of st().zombies)if(!e.dead)qa.damageEnemy(e,1e9);qa.setHealth(1e9);visitStations('late');},60,30),
  screen:run('screen',()=>{globalThis.devicePixelRatio=2;qa.holdSpawns();qa.setHealth(1e6);qa.setPlayer(0,22);qa.setAim(0,-.05);for(let i=0;i<6;i++){const e=qa.makeZombie(-5+i*2,12);e.hp=e.maxHp=4e3;e.speed=.25;}},600,15),
  shell:run('shell',()=>{qa.holdSpawns();qa.setHealth(1e6);qa.setPlayer(0,20);qa.setAim(0,0);for(const k of ['shotgun','smg'])st().inventory[k].owned=true;st().inventory.glock.weaponRank=0;},900,10),
};
trace.stationTour=tour;
trace.boot={render:fullLogs?bootLog.join('\n'):fnv(bootLog.join('\n')),calls:bootLog.length,compiles:bootLog.filter(l=>l.startsWith('compileAsync')).length,uploads:bootLog.filter(l=>l.startsWith('initTexture')).length};
process.stderr.write('golden-trace coverage: '+JSON.stringify(seen)+'\n');
process.stdout.write(JSON.stringify(trace)+'\n');
process.exit(0);

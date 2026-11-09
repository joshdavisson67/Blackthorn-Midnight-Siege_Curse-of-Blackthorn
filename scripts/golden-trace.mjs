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
let seed=0x5eed1;
Math.random=()=>{seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
let clock=1000;performance.now=()=>clock;Date.now=()=>1.7e12+clock;
const {qa,frames}=await import('../tests/harness.mjs');
const {UPPER_Y,OLIVIA_ATTIC}=await import('../.qa/vertical.mjs');
const {EASTER_EGG}=await import('../.qa/olivia.mjs');
const {BOSS}=await import('../.qa/blackthorn-boss.mjs');
const T=await import('../.qa/three.module.js');
const {CELLAR}=await import('../.qa/cellar-layout.mjs');
const {CAMP_RULES}=await import('../.qa/camp-spawns.mjs');
const st=()=>qa.get();
const r=v=>Number.isFinite(v)?v:String(v);
const seen={};const note=(k,v=true)=>{if(v===true)seen[k]=(seen[k]||0)+1;};
function snapshot(){const s=st();return {
  player:[s.player.x,s.player.y,s.player.z,s.health,s.armor,s.points,s.kills,s.wave,s.inventory[s.weapon]?.ammo??null].map(r),
  zombies:s.zombies.map(e=>[e.dead?1:0,e.brute?1:0,e.dog?1:0,e.feral?1:0,e.lurker?1:0,e.boss?1:0,e.warden?1:0,e.walkPos.x,e.walkPos.y,e.walkPos.z,e.hp,e.group.rotation.y,e.group.position.y,e.attackTime,e.stuck,e.crawling?1:0,e.crouch??0,e.warCry??0,e.bellaSwings??0].map(r))
};}
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
  boss:f=>f%40===0?()=>qa.shoot():null,
  late:f=>f%15===0?()=>qa.shoot():null,
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
  boss:()=>{note('boss active',st().boss.stage==='active');note('war cry',st().zombies.some(e=>e.warCry>0));note('player hurt',st().health<1e6);},
};
const ring=(n,cx,cz,rad,y=0)=>{for(let i=0;i<n;i++){const a=i/n*Math.PI*2;qa.makeZombie(cx+Math.sin(a)*rad,cz+Math.cos(a)*rad,i%5===3,i%7===5,false,y,i%6===4);}};
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
};
process.stderr.write('golden-trace coverage: '+JSON.stringify(seen)+'\n');
process.stdout.write(JSON.stringify(trace)+'\n');
process.exit(0);

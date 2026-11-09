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
const {qa,frames,gameCanvas,listeners}=await import('../tests/harness.mjs');
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
  player:[s.player.x,s.player.y,s.player.z,s.health,s.armor,s.points,s.totalScore,s.kills,s.wave,s.weapon,s.inventory[s.weapon]?.ammo??null,s.inventory[s.weapon]?.reserve??null,s.grenades,s.doubleTime,s.grenadeTime,s.boneChips,s.effects.length].map(r),
  zombies:s.zombies.map(e=>[e.dead?1:0,e.brute?1:0,e.dog?1:0,e.feral?1:0,e.lurker?1:0,e.boss?1:0,e.warden?1:0,e.walkPos.x,e.walkPos.y,e.walkPos.z,e.hp,e.group.rotation.y,e.group.position.y,e.attackTime,e.stuck,e.crawling?1:0,e.crouch??0,e.warCry??0,e.bellaSwings??0,e.enraged?1:0,e.staggerLeft??0,e.death??0,e.group.visible?1:0].map(r)),
  pickups:s.pickups.map(p=>[p.type,p.mesh.position.x,p.mesh.position.y,p.mesh.position.z,p.life,p.value??0].map(r)),
  arms:[s.shotTimer,s.reloadLeft,s.reloadDuration,s.grenadeCooldown,s.aiming?1:0,s.mouseDown?1:0,s.weaponRecoil.pitch,s.weaponRecoil.yaw,s.weaponRecoil.back,s.weaponRecoil.lift,s.camera.fov,s.smgDual.visible?1:0,
    ...Object.values(s.inventory).flatMap(v=>[v.owned?1:0,v.ammo,v.reserve,v.weaponRank,v.forgeRank]),...Object.values(s.gunGroups).map(g=>g.visible?1:0)].map(r)
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
  boss:f=>f===700?()=>{for(const w of st().zombies)if(w.warden&&!w.dead){note('warden shield hit');qa.damageEnemy(w,40,false,{part:'shield',direction:new T.Vector3(0,0,1),source:'glock'});}}:f%40===0?()=>qa.shoot():null,
  late:f=>f%15===0?()=>qa.shoot():null,
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
  arsenal:()=>{const s=st();note('aimed',s.aiming);note('reloading',s.reloadLeft>0);note('held trigger',s.mouseDown&&s.weapon!=='glock');note(s.weapon+' out',true);},
  upgrades:()=>{const s=st();note('twin ravens',s.smgDual.visible);note('pistol rank 4',s.inventory.glock.weaponRank>=4);note('shotgun ranks',s.inventory.shotgun.weaponRank>0);note('bushmaster ranks',s.inventory.bushmaster.weaponRank>0);},
  throws:()=>{note('infinite grenades',st().grenadeTime>0);note('grenade cooldown',st().grenadeCooldown>0);},
  grenades:()=>{note('lurker burst',st().zombies.some(e=>e.lurkerBurst));note('corpse cap',st().zombies.filter(e=>e.dead).length>=14);note('enraged',st().zombies.some(e=>e.enraged));note('drops on the ground',st().pickups.length>0);note('blast hurt the player',st().health<1e6);},
  ranks:()=>{note('lurker burst (ranks)',st().zombies.some(e=>e.lurkerBurst));note('healed by a kill',st().health>40&&st().weapon==='lmg');note('crawlers',st().zombies.some(e=>e.crawling&&!e.dead));},
  pickups:()=>{note('double damage',st().doubleTime>0);note('infinite grenades',st().grenadeTime>0);note('bone chip collected',st().boneChips>0);note('essence collected',st().points>0&&st().points<1e6);},
  bellakills:()=>{note('bone chips dropped',st().pickups.some(p=>p.type==='bone'));note('bella kills',st().kills>0);note('chips gathered',st().boneChips>0);},
  boss:()=>{note('boss active',st().boss.stage==='active');note('war cry',st().zombies.some(e=>e.warCry>0));note('player hurt',st().health<1e6);},
};
const at=type=>{const list=st().interactables.filter(s=>s.type===type),s=list.find(s=>!(s.y>1))||list[0];qa.setPlayer(s.x+Math.sin(s.rotation||0)*1.6,s.z+Math.cos(s.rotation||0)*1.6,s.y||0);frames(1);};
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
};
process.stderr.write('golden-trace coverage: '+JSON.stringify(seen)+'\n');
process.stdout.write(JSON.stringify(trace)+'\n');
process.exit(0);

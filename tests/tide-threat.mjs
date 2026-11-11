import assert from 'node:assert/strict';

// v208 (Dead Tide step 3a): the threat director's numbers, every formula and threshold, from
// the design spec's section 6 as agreed (health added, not compounded; the mix table).
// Run on its own: node tests/tide-threat.mjs. The director in play is tested in
// tests/dead-tide.mjs.
const M=await import('../public/game/tide-threat.mjs');
const {THREAT_RULES:R,TIDE_KINDS,threatLevel,threatProgress,threatRank,targetPopulation,healthScale,speedScale,threatStats,tideMix,walkersOnly,chooseTideKind}=M;
const near=(a,b,msg,eps=1e-9)=>assert(Math.abs(a-b)<=eps,`${msg}: ${a} ≠ ${b}`);

// ---- The threat level: floor(kills / 20) + 1, with no maximum ------------------------------
for(const [kills,level] of [[0,1],[1,1],[19,1],[20,2],[21,2],[39,2],[40,3],[99,5],[100,6],[259,13],[260,14],[459,23],[460,24],[600,31],[1000,51],[100000,5001]])
  assert.equal(threatLevel(kills),level,`${kills} kills is threat level ${level}`);
assert.equal(threatLevel(-5),1,'Never below level 1');
for(let k=0;k<2000;k++)assert(threatLevel(k+1)-threatLevel(k)===(((k+1)%20===0)?1:0),'It rises by one on every 20th kill and at no other');
assert.deepEqual(threatProgress(268),{level:14,into:8,of:20},'Progress to the next level: 268 kills is level 14, 8 of 20 (the spec’s example)');
assert.deepEqual(threatProgress(20),{level:2,into:0,of:20},'and the count starts again at each level');
console.log('PASS: the threat level is floor(kills / 20) + 1 with no maximum (0 → 1, 20 → 2, 100 → 6, 260 → 14, 460 → 24, 1,000 → 51), and progress counts kills into the level, out of 20.');

// ---- Ranks: The Unease (1–5), The Hunt (6–13), The Swarm (14–23), The Apocalypse (24+) --------
const rankAt=l=>threatRank(l).name;
for(const [level,name] of [[1,'THE UNEASE'],[5,'THE UNEASE'],[6,'THE HUNT'],[13,'THE HUNT'],[14,'THE SWARM'],[23,'THE SWARM'],[24,'THE APOCALYPSE'],[51,'THE APOCALYPSE'],[5001,'THE APOCALYPSE']])
  assert.equal(rankAt(level),name,`Level ${level} is ${name}`);
for(const [kills,name] of [[99,'THE UNEASE'],[100,'THE HUNT'],[259,'THE HUNT'],[260,'THE SWARM'],[459,'THE SWARM'],[460,'THE APOCALYPSE']])
  assert.equal(rankAt(threatLevel(kills)),name,`${kills} kills is ${name}`);
assert.deepEqual([1,6,14,24].map(l=>threatRank(l).index),[0,1,2,3]);
console.log('PASS: the ranks change at levels 6, 14 and 24 (kills 100, 260 and 460), and The Apocalypse never ends.');

// ---- Population: min(45, 8 + 2 × (level − 1)) -------------------------------------------------
for(const [kills,target] of [[0,8],[100,18],[200,28],[260,34],[360,44],[380,45],[460,45],[600,45]])
  assert.equal(targetPopulation(threatLevel(kills)),target,`${kills} kills keeps ${target} on the island (the spec’s table)`);
for(let l=1;l<=19;l++)assert.equal(targetPopulation(l),8+2*(l-1));
for(let l=20;l<=500;l++)assert.equal(targetPopulation(l),45,'45 from level 20, never more');
console.log('PASS: the population starts at 8, adds 2 a level and holds at 45 from level 20 (the spec’s table).');

// ---- Health: +4% of base a level for 25 levels, then +1.5%, capped at 4× (added) ---------------
near(healthScale(1),1,'Level 1 is the base');near(healthScale(2),1.04,'+4% at level 2');near(healthScale(6),1.2,'1.2× at level 6');
near(healthScale(26),2,'2× after 25 increases (level 26)');near(healthScale(27),2.015,'then +1.5% a level');near(healthScale(36),2.15,'(2.15× at level 36)');
for(let l=2;l<=26;l++)near(healthScale(l)-healthScale(l-1),.04,`+4% of base from level ${l-1} to ${l}`);
for(let l=27;l<=159;l++)near(healthScale(l)-healthScale(l-1),.015,`+1.5% of base from level ${l-1} to ${l}`,1e-9);
near(healthScale(159),3.995,'3.995× at level 159',1e-9);assert.equal(healthScale(160),4,'4× from level 160');
for(const l of [160,161,500,5001,1e6])assert.equal(healthScale(l),4,`never above 4× (level ${l})`);
console.log('PASS: health adds 4% of base a level for 25 levels (2× at level 26), then 1.5% a level, reaching the 4× cap at level 160 and never passing it.');

// ---- Speed: +2% of base a level, at most +50% -------------------------------------------------
near(speedScale(1),1,'Level 1 is the base');near(speedScale(2),1.02,'+2% at level 2');near(speedScale(25),1.48,'1.48× at level 25');
assert.equal(speedScale(26),1.5,'+50% at level 26');for(const l of [27,51,5001])assert.equal(speedScale(l),1.5,`and never more (level ${l})`);
for(let l=2;l<=26;l++)near(speedScale(l)-speedScale(l-1),.02,`+2% of base from level ${l-1} to ${l}`);
console.log('PASS: speed adds 2% of base a level, reaching +50% at level 26 and holding there.');

// ---- Stats: the mansion's wave 1 at level 1, scaled; damage unchanged -------------------------
assert.deepEqual({...threatStats(1)},{health:93,speed:1.145,damage:19.5},'Level 1 is the mansion’s wave 1, exactly as v206’s stand-in');
near(threatStats(14).health,93*1.52,'Level 14 health');near(threatStats(14).speed,1.145*1.26,'and speed');
for(const l of [2,24,160,5001])assert.equal(threatStats(l).damage,19.5,`Damage never scales (level ${l}, spec 6.6)`);
assert.equal(threatStats(500).health,93*4);assert.equal(threatStats(500).speed,1.145*1.5);
assert.equal(threatStats(7),threatStats(7),'A level’s stats are made once');assert(Object.isFrozen(threatStats(7)));
console.log('PASS: level 1 rises at the mansion’s wave-1 strength (93 health, 1.145 speed, 19.5 damage), each level scales health and speed and never damage.');

// ---- The mix by level ---------------------------------------------------------------------
assert.deepEqual(TIDE_KINDS,['walker','dog','feral','brute','ashfang','lurker']);
const share=(l,kind)=>tideMix(l)[TIDE_KINDS.indexOf(kind)];
for(let l=1;l<=200;l++){const m=tideMix(l);near(m.reduce((a,b)=>a+b,0),1,`The shares at level ${l} add to 1`,1e-12);assert(m.every(v=>v>=0),'none below 0');}
// The agreed anchor levels, exactly.
for(const [level,shares] of R.mix)assert.deepEqual([...tideMix(level)],[...shares],`Level ${level} is its row of the table`);
assert(walkersOnly(1)&&walkersOnly(2)&&!walkersOnly(3),'Walkers alone at levels 1 and 2; dogs from level 3');
near(share(3,'dog'),.1/3,'Level 3: a third of the way to level 5’s 10% dogs');near(share(4,'dog'),.2/3,'level 4: two thirds');
near(share(9,'feral'),.06,'Level 9: halfway from level 5 to 13, so half of level 13’s 12% ferals');
near(share(18,'lurker'),.03,'Level 18: halfway from level 13 to 23, so half of level 23’s 6% lurkers');
for(const kind of ['feral','brute','ashfang'])assert.equal(share(5,kind),0,`No ${kind}s in The Unease`);
assert.equal(share(13,'lurker'),0,'No lurkers in The Hunt');assert(share(14,'lurker')>0,'They join with The Swarm');
for(const l of [24,25,51,5001])assert.deepEqual([...tideMix(l)],[.42,.15,.16,.13,.07,.07],`The Apocalypse’s mix holds (level ${l})`);
// Walkers only thin out; ferals, brutes, Ashfangs and lurkers only grow.
for(let l=2;l<=30;l++){assert(share(l,'walker')<=share(l-1,'walker')+1e-12,'Walkers never become more common');
  for(const kind of ['feral','brute','ashfang','lurker'])assert(share(l,kind)>=share(l-1,kind)-1e-12,`${kind}s never become rarer`);}
console.log(`PASS: the mix is the agreed table, stepped evenly between its levels: walkers alone at levels 1–2, dogs from level 3 (10% at level 5), ferals, dogs, brutes and Ashfangs through The Hunt, lurkers from The Swarm, The Apocalypse’s mix held from level 24; shares always add to 1.`);

// ---- Choosing a kind from a roll ------------------------------------------------------------
for(const roll of [0,.5,.999999])assert.equal(chooseTideKind(1,roll),'walker','At level 1 every roll is a walker');
// Each roll lands in its kind’s slice: at level 24, walker [0, .42), dog [.42, .57), feral [.57, .73), brute [.73, .86), Ashfang [.86, .93), lurker [.93, 1).
for(const [roll,kind] of [[0,'walker'],[.4199,'walker'],[.4201,'dog'],[.5699,'dog'],[.5701,'feral'],[.7299,'feral'],[.7301,'brute'],[.8599,'brute'],[.8601,'ashfang'],[.9299,'ashfang'],[.9301,'lurker'],[.999999,'lurker']])
  assert.equal(chooseTideKind(24,roll),kind,`Level 24, roll ${roll}: ${kind}`);
assert.equal(chooseTideKind(5,.95),'dog','Level 5, a high roll: a dog');assert.equal(chooseTideKind(5,1),'dog','a roll of exactly 1 still lands on a real kind');
// Over many even rolls the kinds come out in their shares.
for(const level of [4,10,18,30]){
  const counts=Object.fromEntries(TIDE_KINDS.map(k=>[k,0])),N=100000;
  for(let i=0;i<N;i++)counts[chooseTideKind(level,(i+.5)/N)]++;
  TIDE_KINDS.forEach((kind,k)=>near(counts[kind]/N,tideMix(level)[k],`Level ${level}: ${kind}s`,2e-5));
}
console.log('PASS: a roll picks each kind in proportion to its share (walkers at level 1 whatever the roll; level 24’s slices exactly).');

// ---- v209: the spawn network by rank (spec 5.4) ----------------------------------------------
const {SPAWN_RULES:S,majorZoneCount,minorShare,minorFollow,interiorOpen,interiorShare,batchSize}=M;
for(const [level,open] of [[1,3],[3,4],[5,4],[6,4],[13,6],[14,6],[23,7],[24,7],[27,8],[28,8],[500,8]])assert.equal(majorZoneCount(level),open,`Level ${level}: ${open} major zones open`);
for(let l=2;l<=200;l++)assert(majorZoneCount(l)>=majorZoneCount(l-1),'Never fewer zones open than the level before');
for(const [lo,hi,a,b] of [[1,5,3,4],[6,13,4,6],[14,23,5,7],[24,60,1,8]])for(let l=lo;l<=hi;l++)assert(majorZoneCount(l)>=a&&majorZoneCount(l)<=b,`Level ${l} within its rank’s range (spec: 3–4, 4–6, 5–7, up to 8)`);
for(const [level,minor,follow,inner,share,batch] of [[1,.12,.25,0,0,1],[5,.12,.25,0,0,1],[6,.22,.35,0,0,2],[13,.22,.35,0,0,2],[14,.32,.45,2,.1,2],[23,.32,.45,2,.1,2],[24,.4,.5,4,.18,3],[300,.4,.5,4,.18,3]])
  assert.deepEqual([minorShare(level),minorFollow(level),interiorOpen(level),interiorShare(level),batchSize(level)],[minor,follow,inner,share,batch],`Level ${level}’s spawn network`);
assert(S.interior.near>=28&&S.interior.halfAngle>=Math.PI*80/180&&S.rotate===40,'Inland never within 28 m nor in a 160° view; zones turn over every 40 s');
console.log('PASS: the spawn network: 3–4 major zones open in The Unease, 4–6 in The Hunt, 6–7 in The Swarm, 7 to all 8 in The Apocalypse (never fewer than before); the minor points 12%, 22%, 32%, 40% of arrivals; the interior shut until The Swarm (2 zones, 10%), then 4 zones, 18%; batches of 1, 2, 2, 3.');

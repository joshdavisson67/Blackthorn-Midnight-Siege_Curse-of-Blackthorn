// Dead Tide's threat (v208, Dead Tide step 3a): how the island escalates, from the design
// spec's section 6. Pure numbers and small functions, loaded only by Dead Tide (it needs
// neither three.js nor the mansion's core.mjs), so every formula is tested on its own
// (tests/tide-threat.mjs). There are no waves anywhere: kills raise the threat level, and
// the level sets how many dead the shore keeps on the island, how strong the next ones
// rise, and which kinds they are.
//
//   level        floor(kills / 20) + 1, with no maximum
//   rank         The Unease (1–5), The Hunt (6–13), The Swarm (14–23), The Apocalypse (24+)
//   population   min(45, 8 + 2 × (level − 1))
//   health       +4% of base a level for the first 25 levels (2× at level 26), then +1.5%
//                of base a level, never above 4× (reached at level 160). Added, not compounded.
//   speed        +2% of base a level, never more than +50% (reached at level 26)
//   damage       unchanged (spec 6.6): each kind's own multiple of the walker's 19.5
//   mix          shares of each kind at anchor levels, stepped linearly between them
//
// The base is the mansion's wave 1 (core.mjs waveConfig(1)), the stand-in's numbers in v206.
// Each kind keeps its own multiples of the base (dogs, brutes, Ashfangs, ferals and lurkers
// in the shared spawner), so the scales lift every kind alike and keep them apart.
export const TIDE_KINDS=Object.freeze(['walker','dog','feral','brute','ashfang','lurker']);
export const THREAT_RULES=Object.freeze({
  killsPerLevel:20,
  ranks:Object.freeze([
    Object.freeze({name:'THE UNEASE',from:1}),Object.freeze({name:'THE HUNT',from:6}),
    Object.freeze({name:'THE SWARM',from:14}),Object.freeze({name:'THE APOCALYPSE',from:24})]),
  population:Object.freeze({start:8,perLevel:2,cap:45}),
  health:Object.freeze({early:.04,earlyLevels:25,late:.015,cap:4}),
  speed:Object.freeze({perLevel:.02,cap:.5}),
  base:Object.freeze({health:93,speed:1.145,damage:19.5}),
  // The mix (agreed for v208; tune later): each row is a level and the share of each kind in
  // TIDE_KINDS order. Walkers alone for the opening, dogs from level 3, ferals and dogs
  // building through The Hunt, brutes, Ashfangs and lurkers through The Swarm, then held.
  mix:Object.freeze([
    Object.freeze([1, Object.freeze([1,0,0,0,0,0])]),
    Object.freeze([2, Object.freeze([1,0,0,0,0,0])]),
    Object.freeze([5, Object.freeze([.9,.1,0,0,0,0])]),
    Object.freeze([13,Object.freeze([.62,.18,.12,.06,.02,0])]),
    Object.freeze([23,Object.freeze([.45,.16,.15,.12,.06,.06])]),
    Object.freeze([24,Object.freeze([.42,.15,.16,.13,.07,.07])])
  ])
});
const R=THREAT_RULES;

export function threatLevel(kills){return Math.floor(Math.max(0,kills|0)/R.killsPerLevel)+1;}
// Kills into the current level, out of 20 (the tracker's progress, step 3b).
export function threatProgress(kills){const k=Math.max(0,kills|0);return {level:threatLevel(k),into:k%R.killsPerLevel,of:R.killsPerLevel};}
export function threatRank(level){let index=0;for(let i=0;i<R.ranks.length;i++)if(level>=R.ranks[i].from)index=i;return {index,name:R.ranks[index].name};}
export function targetPopulation(level){const P=R.population;return Math.min(P.cap,P.start+P.perLevel*(Math.max(1,level)-1));}
export function healthScale(level){const H=R.health,n=Math.max(0,level-1);return Math.min(H.cap,1+H.early*Math.min(n,H.earlyLevels)+H.late*Math.max(0,n-H.earlyLevels));}
export function speedScale(level){const S=R.speed;return 1+Math.min(S.cap,S.perLevel*Math.max(0,level-1));}
// A level's enemy stats, in the shape the shared spawner reads (rules.enemyStats).
const statsCache=new Map();
export function threatStats(level){
  let s=statsCache.get(level);
  if(!s){s=Object.freeze({health:R.base.health*healthScale(level),speed:R.base.speed*speedScale(level),damage:R.base.damage});if(statsCache.size<512)statsCache.set(level,s);}
  return s;
}
// The share of each kind at a level (TIDE_KINDS order, summing to 1).
const mixCache=new Map();
export function tideMix(level){
  const L=Math.max(1,level|0);let shares=mixCache.get(L);if(shares)return shares;
  const rows=R.mix;let i=0;while(i<rows.length-1&&rows[i+1][0]<=L)i++;
  const [a,from]=rows[i],next=rows[i+1];
  if(!next||L<=a)shares=from;
  else{const [b,to]=next,t=(L-a)/(b-a);shares=Object.freeze(from.map((v,k)=>v+(to[k]-v)*t));}
  if(mixCache.size<512)mixCache.set(L,shares);return shares;
}
// Only walkers at this level: no roll is needed (nor drawn from the game's generator).
export function walkersOnly(level){return tideMix(level)[0]>=1;}
// The kind for one arrival, from a roll in [0, 1).
export function chooseTideKind(level,roll){
  const shares=tideMix(level);if(shares[0]>=1)return 'walker';
  let target=roll;for(let k=0;k<shares.length;k++){target-=shares[k];if(target<0)return TIDE_KINDS[k];}
  for(let k=shares.length-1;k>=0;k--)if(shares[k]>0)return TIDE_KINDS[k];
  return 'walker';
}

// ---- The spawn network by rank (v209, Dead Tide step 3b) --------------------------------------
// Spec 5.2–5.5 and 9.3: only part of the island's 28 spawn locations is live at once, and which
// part keeps changing. Indexed by rank (The Unease, The Hunt, The Swarm, The Apocalypse).
//   major      major shoreline zones open at once: [at the rank's first level, at its last];
//              never fewer than the level before (The Swarm opens at 6 of the spec's 5–7);
//              The Apocalypse climbs from 7 to all 8 by level 28. One open zone is swapped for
//              a closed one every `rotate` seconds.
//   minor      the share of arrivals that come from the 14 minor shoreline points; after one,
//              `follow` is the chance that a second follows from the same point once the first
//              has cleared it (within `followFor` s): one or two from each.
//   interior   concealed interior zones: none until The Swarm, then a few open at once,
//              swapped every `rotate` s, and only ever `near` m or more away and outside a wide
//              view cone at any distance (never beside you, never where you can see).
//   batch      the most that rise together from one zone in a single arrival (never more than
//              the population is short, so a deficit is made up over several arrivals).
//   weights    how points are weighed: a moving player's flanks and back over the way ahead,
//              sides of you with fewer dead, points and zones not just used, short routes.
export const SPAWN_RULES=Object.freeze({
  major:Object.freeze([Object.freeze([3,4]),Object.freeze([4,6]),Object.freeze([6,7]),Object.freeze([7,8])]),apocalypseFull:28,rotate:40,
  minor:Object.freeze([.12,.22,.32,.4]),follow:Object.freeze([.25,.35,.45,.5]),followFor:6,
  interior:Object.freeze({open:Object.freeze([0,0,2,4]),share:Object.freeze([0,0,.1,.18]),rotate:30,near:28,halfAngle:Math.PI*80/180}),
  batch:Object.freeze([1,2,2,3]),
  stationClear:6,                                // v210: no one rises this close to a station's pad (m)
  weights:Object.freeze({
    moving:.8,                                   // m/s: slower than this, you are standing
    travel:Object.freeze({ahead:.2,aheadFar:.55,far:40,side:.9,behind:1}),
    recent:Object.freeze({point:6,pointFactor:.2,zone:3,zoneFactor:.5}),
    sector:Object.freeze({count:8,range:40,per:.35}),
    route:Object.freeze({near:42,far:80,mid:.5,beyond:.2})
  })
});
const S=SPAWN_RULES,rankSpan=[[1,5],[6,13],[14,23],[24,S.apocalypseFull]];
export function majorZoneCount(level){
  const {index}=threatRank(level),[a,b]=S.major[index],[from,to]=rankSpan[index],t=Math.min(1,Math.max(0,(level-from)/(to-from)));
  return Math.round(a+(b-a)*t);
}
export const minorShare=level=>S.minor[threatRank(level).index];
export const minorFollow=level=>S.follow[threatRank(level).index];
export const interiorOpen=level=>S.interior.open[threatRank(level).index];
export const interiorShare=level=>S.interior.share[threatRank(level).index];
export const batchSize=level=>S.batch[threatRank(level).index];

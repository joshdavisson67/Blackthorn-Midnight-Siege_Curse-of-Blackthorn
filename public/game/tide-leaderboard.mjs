// Dead Tide's own leaderboard (v214, spec 12): separate from the mansion's, on the same
// shared board (scoreboard.mjs). Runs rank by kills, then threat level, then the longer
// survival; each records its kills, time, threat level and rank, essence earned, headshots
// and the game version. Served by /api/dead-tide-leaderboard (server/dead-tide-leaderboard.mjs)
// or, on GitHub Pages, by Supabase (supabase/dead-tide-leaderboard.sql).
import {CURRENT_VERSION} from './version.mjs?v=220';
import {createScoreboard,formatTime,usesSupabase,supabaseFetcher,SUPABASE_LEADERBOARD} from './scoreboard.mjs?v=214';
import {threatLevel,threatRank} from './tide-threat.mjs?v=220';
export const TIDE_GAME_VERSION=String(CURRENT_VERSION);
export const TIDE_RPC=Object.freeze({list:'get_dead_tide_leaderboard',submit:'submit_dead_tide_score'});
const rankName=level=>threatRank(level).name;
// The mode's runs, rows and wording.
export const DEAD_TIDE_BOARD=Object.freeze({
  endpoint:'/api/dead-tide-leaderboard',keys:Object.freeze({pending:'blackthorn-dead-tide-pending-v1',queue:'blackthorn-dead-tide-queue-v1',name:'blackthorn-leaderboard-name'}),refreshInterval:15000,
  // The level is the kills' own (threat level = floor(kills / 20) + 1), so it can never disagree with them.
  makeStats:({kills,duration,score,headshots=0})=>({mode:'dead-tide',kills,threatLevel:threatLevel(kills),duration:Math.max(0,Math.floor(duration)),score:Math.max(0,Math.floor(score)),headshots,version:TIDE_GAME_VERSION}),
  sameRun:(entry,submission)=>entry.kills===submission.kills&&entry.threat_level===submission.threatLevel&&entry.duration===submission.duration&&entry.score===submission.score&&entry.headshots===submission.headshots&&entry.version===submission.version,
  summary:stats=>`${stats.kills} KILLS · THREAT ${stats.threatLevel} / ${rankName(stats.threatLevel)} · ${formatTime(stats.duration)} · ${stats.score.toLocaleString()} ESSENCE · ${stats.headshots} HEADSHOTS`,
  option:stats=>`${stats.kills} kills · Threat ${stats.threatLevel}`,
  cells:entry=>[entry.rank,entry.name,entry.kills,`${entry.threat_level} · ${entry.threat_rank??rankName(entry.threat_level)}`,formatTime(entry.duration),Number(entry.score).toLocaleString()],
  listed:'Top 50 runs · Most kills first · Updates every 15s',empty:'No runs yet. Be the first to survive the island.',
  // Dead Tide shows its own run summary first; the board opens from it.
  openOnEnd:false
});
export function createTideLeaderboard({fetcher=usesSupabase()?supabaseFetcher(SUPABASE_LEADERBOARD,undefined,TIDE_RPC):(...args)=>fetch(...args),...options}){
  return createScoreboard({...options,fetcher,mode:DEAD_TIDE_BOARD});
}

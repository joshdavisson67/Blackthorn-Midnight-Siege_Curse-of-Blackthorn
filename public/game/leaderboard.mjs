const PENDING_KEY='blackthorn-leaderboard-pending-v1',QUEUE_KEY='blackthorn-leaderboard-queue-v1',NAME_KEY='blackthorn-leaderboard-name';
import {CURRENT_VERSION} from './version.mjs?v=215';
import {curseTitle} from './curse.mjs?v=206';
import {createScoreboard,formatTime,usesSupabase,supabaseFetcher} from './scoreboard.mjs?v=214';
export const GAME_VERSION=String(CURRENT_VERSION);
export const REFRESH_INTERVAL=15000;
// v214: the board itself is shared with Dead Tide (scoreboard.mjs); the mansion's runs,
// rows and wording are here, unchanged.
const MANSION=Object.freeze({
  endpoint:'/api/leaderboard',keys:Object.freeze({pending:PENDING_KEY,queue:QUEUE_KEY,name:NAME_KEY}),refreshInterval:REFRESH_INTERVAL,
  makeStats:({score,wave,kills,duration,curseRank=0})=>({score:Math.max(0,Math.floor(score)),wave,kills,duration:Math.max(0,Math.floor(duration)),version:GAME_VERSION,curseRank}),
  sameRun:(entry,submission)=>['score','wave','kills','duration','version'].every(key=>entry[key]===submission[key])&&(entry.curse_rank??entry.curseRank??0)===(submission.curseRank??0),
  summary:stats=>`${stats.score.toLocaleString()} SCORE · WAVE ${stats.wave} · ${stats.kills} KILLS · ${formatTime(stats.duration)} · CURSE ${stats.curseRank??0} / ${curseTitle(stats.curseRank??0)}`,
  option:stats=>`${stats.score.toLocaleString()} score · Wave ${stats.wave}`,
  cells:entry=>[entry.rank,entry.name,Number(entry.score).toLocaleString(),entry.wave,entry.kills,`C${entry.curse_rank??0} · ${entry.curse_title??curseTitle(entry.curse_rank??0)}`,formatTime(entry.duration)],
  listed:'Top 50 runs · Highest score first · Updates every 15s',empty:'No scores yet. Be the first to survive the estate.'
});
// GitHub Pages has no /api/leaderboard, so scores go to Supabase there.
export function createLeaderboard({fetcher=usesSupabase()?supabaseFetcher():(...args)=>fetch(...args),...options}){
  return createScoreboard({...options,fetcher,mode:MANSION});
}

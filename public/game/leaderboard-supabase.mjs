// v214: the Supabase helper moved into scoreboard.mjs (the board both modes share), so the
// mansion loads no extra file. Kept for any older page or tool that still imports it here.
export {SUPABASE_LEADERBOARD,usesSupabase,supabaseFetcher} from './scoreboard.mjs?v=214';

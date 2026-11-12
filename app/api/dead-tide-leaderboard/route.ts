import { env } from 'cloudflare:workers';
import { getTideLeaderboard, submitTideScore } from '../../../server/dead-tide-leaderboard.mjs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return getTideLeaderboard(request,env.DB);}
export async function POST(request:Request){return submitTideScore(request,env.DB);}

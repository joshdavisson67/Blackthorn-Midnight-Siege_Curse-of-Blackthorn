// Dead Tide's leaderboard (v214, spec 12), apart from the mansion's (server/leaderboard.mjs,
// whose table and records it never touches). The same safeguards: one finished run is saved
// once (a retry of the same run id never counts twice), every field is checked, and names are
// cleaned the same way. Runs rank by kills, then threat level, then the longer survival.
import {threatLevel,threatRank} from '../public/game/tide-threat.mjs';
const columns='id,mode,name,kills,threat_level,threat_rank,duration,score,headshots,version,created_at';
const ordering='kills DESC,threat_level DESC,duration DESC,created_at ASC,id ASC';
const INVALID='Use a name of 1–24 characters and a valid completed run.';
function json(value,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
function logFailure(request,operation,stage,error){
  console.error('Blackthorn Dead Tide leaderboard database failure',{
    operation,stage,requestId:request.headers.get('cf-ray')||null,
    detail:error instanceof Error?error.message.slice(0,300):'Unknown database error'
  });
}
// The threat rank's name as the board shows it: 'The Unease' and so on.
export const rankTitle=level=>threatRank(level).name.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
export function validTideRun(value){
  if(!value||typeof value!=='object'||Array.isArray(value))return null;
  const {id,mode,kills,threatLevel:level,duration,score,headshots,version}=value;
  if(mode!=='dead-tide')return null;
  if(typeof id!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id))return null;
  if(typeof value.name!=='string')return null;
  const name=value.name.normalize('NFKC').trim().replace(/\s+/gu,' ');
  if(!name||[...name].length>24||/[<>\u0000-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯]/u.test(name))return null;
  for(const [number,max] of [[kills,10000000],[level,500001],[duration,604800],[score,1000000000],[headshots,100000000]])if(!Number.isSafeInteger(number)||number<0||number>max)return null;
  // The level is the kills' own: threat level = floor(kills / 20) + 1 (spec 6.1).
  if(level!==threatLevel(kills))return null;
  if(typeof version!=='string'||!/^\d{1,5}$/.test(version))return null;
  return {id:id.toLowerCase(),mode,name,kills,threatLevel:level,threatRank:rankTitle(level),duration,score,headshots,version};
}
export async function getTideLeaderboard(request,db){
  if(!db)return json({error:'The leaderboard is temporarily unavailable. Please try again.'},503);
  try{const result=await db.prepare(`SELECT ${columns},ROW_NUMBER() OVER (ORDER BY ${ordering}) AS rank FROM dead_tide_scores ORDER BY ${ordering} LIMIT 50`).all();return json({entries:result.results??[]});}
  catch(error){logFailure(request,'load','select',error);return json({error:'The leaderboard could not load. Please try again.'},503);}
}
export async function submitTideScore(request,db){
  const origin=request.headers.get('Origin');
  if((origin&&origin!==new URL(request.url).origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Submit scores from the game page.'},403);
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json'))return json({error:'Expected a score submission.'},415);
  if(Number(request.headers.get('Content-Length')||0)>2048)return json({error:'Score submission is too large.'},413);
  let value;
  try{const body=await request.text();if(new TextEncoder().encode(body).length>2048)return json({error:'Score submission is too large.'},413);value=JSON.parse(body);}catch{return json({error:'The score submission is invalid.'},400);}
  const run=validTideRun(value);if(!run)return json({error:INVALID},400);
  if(!db)return json({error:'Score saving is temporarily unavailable. Your run can be retried.'},503);
  let stage='insert';
  try{
    await db.prepare('INSERT INTO dead_tide_scores (id,mode,name,kills,threat_level,threat_rank,duration,score,headshots,version,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO NOTHING')
      .bind(run.id,run.mode,run.name,run.kills,run.threatLevel,run.threatRank,run.duration,run.score,run.headshots,run.version,Date.now()).run();
    stage='confirm';
    const saved=await db.prepare(`SELECT ${columns} FROM dead_tide_scores WHERE id=?`).bind(run.id).first();
    if(!saved)throw new Error('Missing score after insert');
    if(saved.name!==run.name||saved.kills!==run.kills||saved.threat_level!==run.threatLevel||saved.duration!==run.duration||saved.score!==run.score||saved.headshots!==run.headshots||saved.version!==run.version)
      return json({error:'This run was already submitted with different details.'},409);
    stage='rank';const placement=await db.prepare(`SELECT rank FROM (SELECT id,ROW_NUMBER() OVER (ORDER BY ${ordering}) AS rank FROM dead_tide_scores) WHERE id=?`).bind(run.id).first();
    return json({entry:{...saved,rank:placement.rank},saved:true});
  }catch(error){logFailure(request,'save',stage,error);return json({error:'The score could not be saved. Please retry; this run will only be counted once.'},503);}
}

// v214: Dead Tide's own leaderboard (spec 12): its server (the Cloudflare D1 route), its board on
// Dead Tide's page, its Supabase functions' names, and that the mansion's records are untouched.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
import {createTideLeaderboard,DEAD_TIDE_BOARD,TIDE_GAME_VERSION,TIDE_RPC} from '../public/game/tide-leaderboard.mjs';
import {supabaseFetcher} from '../public/game/leaderboard-supabase.mjs';
import {getTideLeaderboard,submitTideScore,validTideRun,rankTitle} from '../server/dead-tide-leaderboard.mjs';
import {getLeaderboard,submitScore} from '../server/leaderboard.mjs';
import {open,migrate} from './leaderboard-db.mjs';
const html=readFileSync(new URL('../public/game/tide.html',import.meta.url),'utf8');
const storage=()=>{const m=new Map();return {map:m,getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const url='https://blackthorn.example/api/dead-tide-leaderboard';
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const run=(n,over={})=>({id:uuid(n),mode:'dead-tide',name:`Survivor ${n}`,kills:100,threatLevel:6,duration:600,score:9000,headshots:40,version:TIDE_GAME_VERSION,...over});
const post=(db,body)=>submitTideScore(new Request(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://blackthorn.example','Sec-Fetch-Site':'same-origin'},body:JSON.stringify(body)}),db);
function bridge(db){return async(path,options)=>{
  assert.equal(path,'/api/dead-tide-leaderboard');assert.equal(options.cache,'no-store');
  const headers=new Headers(options.headers);if(options.method==='POST'){headers.set('Origin','https://blackthorn.example');headers.set('Sec-Fetch-Site','same-origin');}
  const request=new Request(url,{...options,headers});return options.method==='POST'?submitTideScore(request,db):getTideLeaderboard(request,db);};}
function fixture(fetcher,store=storage()){const {document}=parseHTML(html);let newRuns=0;const board=createTideLeaderboard({document,storage:store,fetcher,onNewRun:()=>newRuns++,setTimer:()=>0,clearTimer:()=>{}});return {board,document,store,get newRuns(){return newRuns;}};}

test('the server checks every Dead Tide run: its mode, its fields, and a threat level that matches its kills',()=>{
  assert(validTideRun(run(1)));assert.equal(validTideRun(run(1)).threatRank,'The Hunt');
  for(const bad of [{mode:'mansion'},{mode:undefined},{kills:-1},{kills:1.5},{threatLevel:7},{threatLevel:5},{duration:604801},{score:-5},{headshots:'4'},{version:'v214'},{name:''},{name:'<b>'},{name:'x'.repeat(25)},{id:'not-a-uuid'}])
    assert.equal(validTideRun(run(1,bad)),null,`Rejected: ${JSON.stringify(bad)}`);
  assert.deepEqual([0,19,20,99,100,259,260,459,460,1000].map(k=>validTideRun(run(1,{kills:k,threatLevel:Math.floor(k/20)+1}))?.threatRank),
    ['The Unease','The Unease','The Unease','The Unease','The Hunt','The Hunt','The Swarm','The Swarm','The Apocalypse','The Apocalypse'],'The rank is the server’s own, from the level');
  assert.equal(rankTitle(24),'The Apocalypse');
});
test('runs rank by kills, then threat level, then the longer survival; a retry never counts twice; the mansion’s board is untouched',async()=>{
  const db=open();migrate(db);
  try{
    // The mansion's board before.
    const mansion=new Request('https://blackthorn.example/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://blackthorn.example','Sec-Fetch-Site':'same-origin'},body:JSON.stringify({id:uuid(99),name:'Estate',score:5000,wave:5,kills:40,duration:300,version:'213'})});
    assert.equal((await submitScore(mansion,db)).status,200);
    assert.equal((await post(db,run(1,{kills:120,threatLevel:7,duration:500}))).status,200);
    assert.equal((await post(db,run(2,{kills:140,threatLevel:8,duration:300}))).status,200);
    assert.equal((await post(db,run(3,{kills:120,threatLevel:7,duration:900}))).status,200);
    const again=await post(db,run(1,{kills:120,threatLevel:7,duration:500}));assert.equal(again.status,200,'The same run again is confirmed, not added');
    assert.equal((await post(db,run(1,{kills:121,threatLevel:7,duration:500}))).status,409,'The same run id with other details is refused');
    assert.equal((await post(db,run(4,{threatLevel:2}))).status,400,'A level that does not match the kills is refused');
    const entries=(await (await getTideLeaderboard(new Request(url),db)).json()).entries;
    assert.deepEqual(entries.map(e=>[e.name,e.rank]),[['Survivor 2',1],['Survivor 3',2],['Survivor 1',3]],'Most kills first; at equal kills, the longer survival');
    assert(entries.every(e=>e.mode==='dead-tide'&&e.version===TIDE_GAME_VERSION&&typeof e.threat_rank==='string'));
    const estate=(await (await getLeaderboard(new Request('https://blackthorn.example/api/leaderboard'),db)).json()).entries;
    assert.deepEqual(estate.map(e=>[e.name,e.score]),[['Estate',5000]],'The mansion’s board holds only its own run, as before');
    // Cross-site posts are refused, as the mansion's are.
    const cross=await submitTideScore(new Request(url,{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.example'},body:JSON.stringify(run(5))}),db);assert.equal(cross.status,403);
  }finally{db.sqlite.close();}
});
test('Dead Tide’s board: a run ends on its summary (not the board), is kept on this device, and saves once',async()=>{
  const db=open();migrate(db);const a=fixture(bridge(db));
  try{
    a.board.startRun();const stats=a.board.endRun({kills:263,duration:1234.7,score:41250.4,headshots:88});
    assert(!a.board.visible,'The board does not open by itself: the summary comes first');
    assert.deepEqual({...stats,id:undefined},{id:undefined,mode:'dead-tide',kills:263,threatLevel:14,duration:1234,score:41250,headshots:88,version:TIDE_GAME_VERSION});
    assert(JSON.parse(a.store.map.get(DEAD_TIDE_BOARD.keys.queue)).runs.length===1,'The run is kept on this device until it is saved');
    assert(!a.store.map.has('blackthorn-leaderboard-queue-v1'),'apart from the mansion’s unsaved runs');
    a.board.open();await settle();
    assert(a.document.getElementById('runSummary').textContent.includes('263 KILLS · THREAT 14 / THE SWARM'),'The form shows the run');
    a.document.getElementById('leaderboardName').value='Tide Walker';await a.board.save();await settle();
    assert(a.document.getElementById('scoreSaveStatus').textContent.startsWith('Saved! Tide Walker is ranked #1'));
    const rows=a.document.getElementById('leaderboardRows');assert.equal(rows.children.length,1);
    assert.deepEqual([...rows.firstElementChild.children].map(c=>c.textContent),['1','Tide Walker','263','14 · The Swarm','20:34','41,250']);
    assert(!a.store.map.get(DEAD_TIDE_BOARD.keys.queue),'Saved, it leaves the device’s queue');
    const b=fixture(bridge(db));b.board.open();await settle();assert.equal(b.document.getElementById('leaderboardRows').children.length,1,'Another visitor sees it');b.board.close();
  }finally{a.board.close();db.sqlite.close();}
});
test('on GitHub Pages the board calls Dead Tide’s own Supabase functions, never the mansion’s',async()=>{
  const calls=[];const fetcher=supabaseFetcher({url:'https://p.supabase.co',key:'k'},async(u,options)=>{calls.push(u);return u.endsWith(TIDE_RPC.list)?Response.json([]):Response.json({saved:true,entry:{...JSON.parse(options.body).run,threat_level:JSON.parse(options.body).run.threatLevel,rank:1}});},TIDE_RPC);
  const a=fixture(fetcher);a.board.startRun();a.board.endRun({kills:20,duration:60,score:900,headshots:2});a.board.open();await settle();
  a.document.getElementById('leaderboardName').value='Pages';await a.board.save();await settle();a.board.close();
  assert(calls.length>=2&&calls.every(u=>u.endsWith('/rpc/get_dead_tide_leaderboard')||u.endsWith('/rpc/submit_dead_tide_score')),calls.join(' '));
  assert(a.document.getElementById('scoreSaveStatus').textContent.startsWith('Saved!'));
});

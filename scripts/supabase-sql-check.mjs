#!/usr/bin/env node
// Checks the Supabase leaderboard scripts (v214 tooling) in an embedded Postgres (PGlite), since
// the live database can only be changed by hand in the Supabase SQL Editor. It runs
// supabase/leaderboard.sql, then supabase/dead-tide-leaderboard.sql twice (it must be safe to
// re-run), and exercises Dead Tide's functions: saving, ranking, retries, conflicts and refusals,
// and that the mansion's board is untouched.
//
//   npm i --no-save @electric-sql/pglite && node scripts/supabase-sql-check.mjs
//   PGLITE_MODULE=/path/to/node_modules/@electric-sql/pglite/dist/index.js node scripts/supabase-sql-check.mjs
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
const spec=process.env.PGLITE_MODULE;
let PGlite;try{({PGlite}=await import(spec?pathToFileURL(spec).href:'@electric-sql/pglite'));}catch{console.error('PGlite is not installed: npm i --no-save @electric-sql/pglite');process.exit(2);}
const sql=f=>readFileSync(new URL(`../supabase/${f}`,import.meta.url),'utf8');
const db=new PGlite();
await db.exec('create role anon; create role authenticated;');
await db.exec(sql('leaderboard.sql'));await db.exec(sql('dead-tide-leaderboard.sql'));await db.exec(sql('dead-tide-leaderboard.sql'));
const uuid=n=>`00000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const run=(n,o={})=>({id:uuid(n),mode:'dead-tide',name:` Survivor  ${n} `,kills:100,threatLevel:6,duration:600,score:9000,headshots:40,version:'214',...o});
const submit=async r=>{try{return (await db.query('select submit_dead_tide_score($1::jsonb) as r',[JSON.stringify(r)])).rows[0].r;}catch(e){return {code:e.code};}};
await db.query('select submit_score($1::jsonb)',[JSON.stringify({id:uuid(99),name:'Estate',score:5000,wave:5,kills:40,duration:300,version:'213'})]);
const first=await submit(run(1,{kills:120,threatLevel:7,duration:500}));
assert(first.saved&&first.entry.name==='Survivor 1'&&first.entry.threat_rank==='The Hunt'&&first.entry.rank===1,'A run is saved, its name cleaned and its rank the server’s own');
await submit(run(2,{kills:140,threatLevel:8,duration:300}));await submit(run(3,{kills:120,threatLevel:7,duration:900}));
assert((await submit(run(1,{kills:120,threatLevel:7,duration:500}))).saved,'A retry of the same run is confirmed');
assert.equal((await submit(run(1,{kills:121,threatLevel:7}))).code,'PT409','The same run with other details is refused');
for(const bad of [{threatLevel:2},{mode:'mansion'},{kills:1.5},{name:'<b>'},{version:'v1'},{headshots:-1}])assert.equal((await submit(run(4,bad))).code,'PT400',`Refused: ${JSON.stringify(bad)}`);
const board=(await db.query('select rank,name,kills,threat_level,duration from get_dead_tide_leaderboard()')).rows;
assert.deepEqual(board.map(r=>[Number(r.rank),r.name]),[[1,'Survivor 2'],[2,'Survivor 3'],[3,'Survivor 1']],'Most kills first, then the longer survival');
assert.deepEqual((await db.query('select name from get_leaderboard()')).rows.map(r=>r.name),['Estate'],'The mansion’s board is untouched');
console.log('PASS: supabase/dead-tide-leaderboard.sql in an embedded Postgres: re-runnable; saves, ranks, confirms retries, refuses conflicts and bad runs; the mansion’s board untouched.');

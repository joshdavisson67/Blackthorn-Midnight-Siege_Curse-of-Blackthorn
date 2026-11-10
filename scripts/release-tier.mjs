#!/usr/bin/env node
// Release tier (v206): how much measuring a change needs, worked out for each mode on
// its own, so the mansion and Dead Tide are held to the same rule.
//
//   node scripts/release-tier.mjs                  # the plan: each mode's tier and why
//   node scripts/release-tier.mjs --measure        # and run it: standard checks, then full where needed
//   node scripts/release-tier.mjs --measure --no-escalate   # standard checks only
//   node scripts/release-tier.mjs --measure --full          # the full protocol for every mode that changed
//   node scripts/release-tier.mjs --base <ref> --json tier.json --out-dir <dir>
//
// 1. What changed: every file that differs from the base (origin/main by default),
//    committed or not. A file whose only change is the version number (its `?v=` cache
//    keys, or CURRENT_VERSION in version.mjs) is set aside.
// 2. Who loads it: each mode's pages are followed through everything they load (scripts,
//    imports, styles, fonts, images), in this build and in the base. The mansion is
//    index.html (and siege.html, the picker's address for it), Dead Tide is tide.html,
//    and the mode picker is modes.html. A shared module counts for every mode that loads it.
// 3. A tier for each mode:
//    quick     nothing it loads changed. Its files are the base's, so nothing to measure.
//    standard  something it loads changed. One measured load of each build, side by side:
//              files and bytes, shader programs, geometries, textures, draw calls and
//              triangles in every fixed view (and the mansion's 32-zombie fight), memory,
//              the load phases, a short frame-logic series, and each mode's golden trace.
//    full      the standard comparison found a difference (THRESHOLDS below). The whole
//              protocol for that mode: two full measured pairs, 40 balanced load-phase runs
//              and 24 frame-logic pairs (perf/README.md, "Re-running").
//
// The step from standard to full is decided by measuring, not by guessing what a change
// touches, so a "small" logic change that adds a draw call is still caught. Results go
// to --out-dir (default .tier/<time>/): every run's JSON and a summary.json. The exit
// code is 1 when a full protocol reports a difference to look at, and 2 on errors.
import {execFileSync,spawnSync} from 'node:child_process';
import {existsSync,readFileSync,writeFileSync,mkdirSync,mkdtempSync,symlinkSync,rmSync,appendFileSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {posix} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
export const GAME='public/game';

// ---- The modes -----------------------------------------------------------------------
export const MODES={
  mansion:{label:'Mansion',pages:['index.html','siege.html'],perfPage:'index.html',frameLogic:'mansion',loadPhases:'index.html',goldenTrace:true},
  tide:{label:'Dead Tide',pages:['tide.html'],perfPage:'tide.html',frameLogic:'tide',loadPhases:'tide.html',goldenTrace:true},
  picker:{label:'Mode picker',pages:['modes.html'],perfPage:'modes.html',frameLogic:null,loadPhases:null,goldenTrace:false}
};
// What counts as "a difference" in the standard comparison. Counts must match exactly;
// these allow for each measure's run-to-run noise (perf/README.md has the repeats).
export const THRESHOLDS={
  kb:10,               // bytes before playable: any edit moves a few hundred bytes
  heapMB:2,            // JS heap after load and after play: repeats differ by up to ~1.1 MB
  jsLoadPct:10,        // modules + world phases (the JavaScript part of loading), one pair
  jsLoadMs:300,        //   ...and by at least this much
  frameLogicPct:2,     // frame logic: the paired difference must also exceed 2 standard errors
};
export const PROTOCOL={
  // One pair at perf-measure's own frame counts: fewer frames let a view's first, warming
  // frame decide its average, and its draw calls stop repeating exactly.
  standard:{perfPairs:1,viewFrames:null,fightFrames:null,frameLogicPairs:{mansion:6,tide:6}},
  full:{perfPairs:2,loadPhasePairs:20,frameLogicPairs:24}
};

// ---- What a page loads -----------------------------------------------------------------
const TEXT=/\.(?:html?|m?js|css)$/i;
const ASSET_EXT='png|jpe?g|webp|svg|gif|woff2?|ttf|otf|json|css|mp3|ogg|wav|glb|gltf|bin|ktx2|hdr';
// The files a page, stylesheet or script refers to, as written (relative to it).
export function refsOf(file,text){
  const out=[],ext=posix.extname(file).toLowerCase();
  const add=p=>{if(!p||/^(?:[a-z][\w+.-]*:|\/\/|#)/i.test(p)||p.includes('${'))return;p=p.split(/[?#]/)[0];if(p)out.push(p);};
  if(ext==='.html'||ext==='.htm'||ext==='.css'){
    for(const m of text.matchAll(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/g))add(m[1]);
    for(const m of text.matchAll(/@import\s+(?:url\()?\s*['"]([^'"]+)['"]/g))add(m[1]);
  }
  if(ext==='.html'||ext==='.htm'){
    // Links to other pages are places to go, not things this page loads.
    for(const m of text.matchAll(/\s(?:src|href)\s*=\s*["']([^"']+)["']/g))if(!/\.html?(?:[?#]|$)/i.test(m[1]))add(m[1]);
  }
  if(ext==='.html'||ext==='.htm'||ext==='.js'||ext==='.mjs'){
    for(const m of text.matchAll(/(?:^|[;\s}>])(?:import|export)\s[^'"`;]*?\sfrom\s*['"]([^'"]+)['"]/gm))add(m[1]);
    for(const m of text.matchAll(/(?:^|[;\s}>])import\s*['"]([^'"]+)['"]/gm))add(m[1]);
    for(const m of text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g))add(m[1]);
    for(const m of text.matchAll(/new\s+URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g))add(m[1]);
    // Assets named in code (textures, fonts, data). A name in a comment counts too: that
    // only ever adds a file, so a mode is measured more often, never less.
    for(const m of text.matchAll(new RegExp(`['"\`]([\\w./-]+\\.(?:${ASSET_EXT}))(?:\\?[^'"\`]*)?['"\`]`,'gi')))add(m[1]);
  }
  return [...new Set(out)];
}
// Every file reachable from a page. `has(path)` and `read(path)` see one build's game folder.
export function pageGraph(page,{has,read}){
  const seen=new Set(),queue=[page];
  while(queue.length){
    const file=queue.shift();if(seen.has(file)||!has(file))continue;seen.add(file);
    if(!TEXT.test(file))continue;
    for(const ref of refsOf(file,read(file))){
      const near=posix.normalize(posix.join(posix.dirname(file),ref)),top=posix.normalize(ref.replace(/^\.\//,''));
      const target=has(near)?near:has(top)?top:null;
      if(target&&!target.startsWith('..')&&!seen.has(target))queue.push(target);
    }
  }
  return seen;
}
export function modeGraphs(build){
  return Object.fromEntries(Object.entries(MODES).map(([k,m])=>{const all=new Set();for(const p of m.pages)for(const f of pageGraph(p,build))all.add(f);return [k,all];}));
}

// ---- What changed ----------------------------------------------------------------------
// Text with its version number taken out: two files that differ only there are the same.
export function withoutVersion(text){return text.replace(/\?v=\d+/g,'?v=#').replace(/(CURRENT_VERSION\s*=\s*)\d+/g,'$1#');}
export function sameApartFromVersion(a,b){return a===b||(a!=null&&b!=null&&withoutVersion(a)===withoutVersion(b));}

// Sort changed paths (relative to the repository) into what each mode loads.
// changes: [{path, versionOnly}]; graphs: {mode: Set of game-relative paths}, this build and base merged.
export function classify(changes,graphs){
  const modes=Object.fromEntries(Object.keys(MODES).map(k=>[k,{changed:[],versionOnly:0}]));
  const other={unloaded:[],server:[],tooling:[]};
  for(const c of changes){
    if(c.path.startsWith(GAME+'/')){
      const f=c.path.slice(GAME.length+1);let loaded=false;
      for(const [k,g] of Object.entries(graphs))if(g.has(f)){loaded=true;if(c.versionOnly)modes[k].versionOnly++;else modes[k].changed.push(f);}
      if(!loaded&&!c.versionOnly)other.unloaded.push(f);
    }else if(/^(?:app|server|db|drizzle)\//.test(c.path)||c.path==='.openai/hosting.json')other.server.push(c.path);
    else other.tooling.push(c.path);
  }
  for(const m of Object.values(modes)){m.tier=m.changed.length?'standard':'quick';m.changed.sort();}
  return {modes,other};
}

// ---- Comparing two measured loads ------------------------------------------------------
// The standard comparison: what differs between base and head perf-measure results.
export function compareLoads(base,head){
  const diffs=[],note=(what,a,b)=>diffs.push(`${what}: ${a} → ${b}`);
  const lb=base.load||{},lh=head.load||{};
  const req=x=>x.untilPlayable?.requests??x.total?.requests,kb=x=>x.untilPlayable?.kb??x.total?.kb;
  if(req(lb)!==req(lh))note('files before playable',req(lb),req(lh));
  if(Math.abs((kb(lh)??0)-(kb(lb)??0))>=THRESHOLDS.kb)note('KB before playable',kb(lb),kb(lh));
  for(const k of new Set([...Object.keys(base.gpu||{}),...Object.keys(head.gpu||{})]))if(base.gpu?.[k]!==head.gpu?.[k])note(k,base.gpu?.[k],head.gpu?.[k]);
  for(const v of new Set([...Object.keys(base.views||{}),...Object.keys(head.views||{})])){
    const a=base.views?.[v],b=head.views?.[v];
    if(!a||!b){note(`view ${v}`,a?'present':'missing',b?'present':'missing');continue;}
    if(a.drawCalls!==b.drawCalls)note(`${v} draw calls`,a.drawCalls,b.drawCalls);
    if(a.trianglesK!==b.trianglesK)note(`${v} triangles (K)`,a.trianglesK,b.trianglesK);
  }
  if(base.fight||head.fight){
    const a=base.fight||{},b=head.fight||{};
    for(const k of ['drawCalls','trianglesK','stillAlive'])if(a[k]!==b[k])note(`fight ${k}`,a[k],b[k]);
  }
  // Memory after a collection where both records have it (perf-measure since v206), else as read.
  const gc=(a,b,x,y)=>a!=null&&b!=null?[a,b]:[x,y];
  const heaps=[['heap after load',...gc(lb.heapAfterGcMB,lh.heapAfterGcMB,lb.heapMB,lh.heapMB)],['heap after the fight',...gc(base.fight?.heapAfterGcMB,head.fight?.heapAfterGcMB,base.fight?.heapMB,head.fight?.heapMB)],
    ['heap after play',...gc(base.heapAfterPlayAfterGcMB,head.heapAfterPlayAfterGcMB,base.heapAfterPlayMB,head.heapAfterPlayMB)]];
  for(const [what,a,b] of heaps)if(a!=null&&b!=null&&b-a>THRESHOLDS.heapMB)note(what+' (MB)',a,b);
  const js=x=>x.phases?x.phases.modulesMs+x.phases.worldMs:null,ja=js(lb),jb=js(lh);
  if(ja!=null&&jb!=null&&jb-ja>Math.max(THRESHOLDS.jsLoadMs,ja*THRESHOLDS.jsLoadPct/100))note('JavaScript loading, modules + world (ms)',ja,jb);
  if(head.errors?.length)note('page errors',base.errors?.length??0,head.errors.length);
  return diffs;
}
// Mean and standard error of paired differences (head minus base).
export function paired(pairs){
  const d=pairs.map(([a,b])=>b-a),n=d.length,mean=d.reduce((s,x)=>s+x,0)/n;
  const sd=n>1?Math.sqrt(d.reduce((s,x)=>s+(x-mean)**2,0)/(n-1)):0;
  return {n,mean,se:sd/Math.sqrt(n),base:pairs.reduce((s,[a])=>s+a,0)/n,head:pairs.reduce((s,[,b])=>s+b,0)/n};
}
// A slowdown that clears both the noise (2 standard errors) and a floor (pct of base).
export function slower(stats,pct){return stats.mean>2*stats.se&&stats.mean>stats.base*pct/100;}

// ---- Git -------------------------------------------------------------------------------
const git=(args,opts={})=>execFileSync('git',args,{cwd:root,encoding:opts.encoding===null?undefined:'utf8',maxBuffer:1<<28,stdio:['ignore','pipe','pipe'],...opts});
function resolveBase(ref){for(const r of [ref,'origin/main','main'].filter(Boolean)){try{git(['rev-parse','--verify','--quiet',r+'^{commit}']);return r;}catch{}}throw new Error('No base to compare with: pass --base <ref>');}
function baseBuild(base){
  const files=new Set(git(['ls-tree','-r','--name-only',base,GAME]).split('\n').filter(Boolean).map(p=>p.slice(GAME.length+1)));
  const cache=new Map();
  return {has:f=>files.has(f),read:f=>{if(!cache.has(f))cache.set(f,git(['show',`${base}:${GAME}/${f}`]));return cache.get(f);}};
}
function headBuild(){const dir=resolve(root,GAME);return {has:f=>existsSync(join(dir,f))&&!f.endsWith('/'),read:f=>readFileSync(join(dir,f),'utf8')};}
function changedFiles(base){
  const paths=new Set([...git(['diff','--name-only','-z',base,'--']).split('\0'),...git(['ls-files','--others','--exclude-standard','-z']).split('\0')].filter(Boolean));
  const out=[];
  for(const path of [...paths].sort()){
    let versionOnly=false;
    if(path.startsWith(GAME+'/')&&TEXT.test(path)){
      let before=null,after=null;
      try{before=git(['show',`${base}:${path}`]);}catch{}
      if(existsSync(resolve(root,path)))after=readFileSync(resolve(root,path),'utf8');
      versionOnly=before!=null&&after!=null&&sameApartFromVersion(before,after);
    }
    out.push({path,versionOnly});
  }
  return out;
}

// ---- Running the measurements ----------------------------------------------------------
const log=m=>process.stderr.write(`[tier] ${m}\n`);
function run(script,args,{cwd=root,timeout=45*60000,env=process.env}={}){
  const r=spawnSync(process.execPath,[script,...args],{cwd,env,encoding:'utf8',maxBuffer:1<<28,timeout});
  if(r.status!==0&&!(script.endsWith('perf-measure.mjs')&&r.status===1&&r.stdout.trim().startsWith('{')))throw new Error(`${script} ${args.join(' ')} failed (${r.status??r.signal}): ${(r.stderr||'').trim().split('\n').slice(-4).join(' | ')}`);
  return r.stdout;
}
const lastJson=text=>{const t=text.trim();if(t.startsWith('{')&&t.endsWith('}')){try{return JSON.parse(t);}catch{}}for(const line of t.split('\n').reverse())if(line.trim().startsWith('{'))return JSON.parse(line);throw new Error('no JSON in output');};
function stageBase(base,dir){
  mkdirSync(dir,{recursive:true});
  const tar=git(['archive','--format=tar',base],{encoding:null});
  const r=spawnSync('tar',['-x','-C',dir],{input:tar});if(r.status!==0)throw new Error('Could not unpack the base build');
  if(existsSync(resolve(root,'node_modules'))&&!existsSync(join(dir,'node_modules')))symlinkSync(resolve(root,'node_modules'),join(dir,'node_modules'));
  return dir;
}
function perfPair(mode,builds,{viewFrames,fightFrames,order},out){
  const m=MODES[mode],res={};
  for(const which of order){
    const args=['--page',m.perfPage,'--game',join(builds[which],GAME),'--label',`${mode} ${which}`];
    if(viewFrames)args.push('--view-frames',String(viewFrames));if(fightFrames)args.push('--fight-frames',String(fightFrames));
    log(`${m.label}: measuring the ${which} build (${m.perfPage})`);
    const j=lastJson(run(join(root,'scripts/perf-measure.mjs'),args));(res[which]??=[]).push(j);
    appendFileSync(join(out,`${mode}-perf.jsonl`),JSON.stringify({which,...j})+'\n');
  }
  return res;
}
function frameLogic(mode,builds,pairs,out){
  const m=MODES[mode],list=[];
  for(let i=0;i<pairs;i++){
    const one={};for(const which of i%2?['head','base']:['base','head']){
      const j=lastJson(run(join(root,'scripts/frame-logic.mjs'),['--mode',m.frameLogic,builds[which]]));one[which]=j.medianMs;
      appendFileSync(join(out,`${mode}-frame-logic.jsonl`),JSON.stringify({pair:i,which,...j})+'\n');
    }
    list.push([one.base,one.head]);
  }
  log(`${m.label}: frame logic, ${pairs} pairs done`);return paired(list);
}
function loadPhases(mode,builds,pairs,out){
  const m=MODES[mode],list={modules:[],world:[],shaders:[],total:[]};
  for(let i=0;i<pairs;i++){
    const one={};for(const which of i%2?['head','base']:['base','head']){
      const j=lastJson(run(join(root,'scripts/load-phases.mjs'),['--page',m.loadPhases,'--game',join(builds[which],GAME),'--label',which]));one[which]=j;
      appendFileSync(join(out,`${mode}-load-phases.jsonl`),JSON.stringify({pair:i,which,...j})+'\n');
    }
    for(const k of ['modules','world','shaders','total'])list[k].push([one.base[k+'Ms'],one.head[k+'Ms']]);
    if((i+1)%5===0)log(`${m.label}: load phases, ${i+1} of ${pairs} pairs`);
  }
  return Object.fromEntries(Object.entries(list).map(([k,v])=>[k,paired(v)]));
}
// The mansion's trace runs from each build's own checkout. Dead Tide's (v206 tooling) is this
// checkout's script playing each build's game, as its frame logic does, since builds from
// before it have none of their own.
function goldenTrace(mode,builds,out){
  const files={};
  for(const which of ['base','head']){
    log(`${MODES[mode].label}: golden trace of the ${which} build`);
    const text=mode==='tide'?run(join(root,'scripts/tide-golden-trace.mjs'),[],{cwd:root,env:{...process.env,BLACKTHORN_GAME_DIR:join(builds[which],'public/game')}})
      :run(join(builds[which],'scripts/golden-trace.mjs'),[],{cwd:builds[which]});
    files[which]=join(out,`${mode==='tide'?'tide-':''}golden-${which}.json`);writeFileSync(files[which],text);
  }
  const r=spawnSync(process.execPath,[join(root,'scripts/golden-compare.mjs'),files.base,files.head],{cwd:root,encoding:'utf8'});
  return {identical:readFileSync(files.base,'utf8')===readFileSync(files.head,'utf8'),compare:r.stdout.trim().split('\n').slice(-1)[0]||r.stderr.trim()};
}
const fmt=(s,unit='ms',digits=2)=>`${s.base.toFixed(digits)} → ${s.head.toFixed(digits)} ${unit} (${s.mean>=0?'+':''}${s.mean.toFixed(digits)}, SE ${s.se.toFixed(digits)})`;

async function measure(plan,{base,outDir,escalate,force}){
  const work=mkdtempSync(join(tmpdir(),'blackthorn-tier-')),builds={head:root,base:stageBase(base,join(work,'base'))};
  log(`base ${base} unpacked in ${builds.base}`);
  const results={};let flagged=false;
  try{
    for(const [mode,info] of Object.entries(plan.modes)){
      if(info.tier==='quick')continue;
      const m=MODES[mode],r=results[mode]={standard:{},full:null};
      // Standard: one measured pair, a short frame-logic series, the golden trace.
      const S=PROTOCOL.standard,pair=perfPair(mode,builds,{viewFrames:S.viewFrames,fightFrames:S.fightFrames,order:['base','head']},outDir);
      r.standard.differences=compareLoads(pair.base[0],pair.head[0]);
      // The browser's own list checks the map: a file it fetched that the map missed means
      // the map is wrong, so this mode gets the full protocol and the map needs fixing.
      const unmapped=(pair.head[0].load?.files||[]).map(f=>f.replace(/^\//,'')).filter(f=>!plan.graphs[mode].includes(f));
      if(unmapped.length)r.standard.differences.push(`fetched but missing from the tier map (fix refsOf): ${unmapped.join(', ')}`);
      if(m.frameLogic){const fl=r.standard.frameLogic=frameLogic(mode,builds,S.frameLogicPairs[mode],outDir);if(slower(fl,THRESHOLDS.frameLogicPct))r.standard.differences.push(`frame logic: ${fmt(fl,'ms',3)}`);}
      if(m.goldenTrace)r.standard.golden=goldenTrace(mode,builds,outDir);
      info.tier=r.standard.differences.length||force?'full':'standard';
      log(`${m.label}: ${r.standard.differences.length?'differences found: '+r.standard.differences.join('; '):'no differences'}${force?' (full protocol asked for)':''}`);
      if(info.tier!=='full'||!escalate)continue;
      // Full: the whole protocol for this mode.
      const F=PROTOCOL.full,full=r.full={};
      const pairs=perfPair(mode,builds,{order:['base','head','head','base']},outDir);
      full.perf=pairs.base.map((b,i)=>compareLoads(b,pairs.head[i]));
      full.measured={base:pairs.base,head:pairs.head};
      if(m.loadPhases)full.loadPhases=loadPhases(mode,builds,F.loadPhasePairs,outDir);
      if(m.frameLogic)full.frameLogic=frameLogic(mode,builds,F.frameLogicPairs,outDir);
      full.differences=[...new Set(full.perf.flat())];
      if(full.loadPhases&&slower(full.loadPhases.total,0))full.differences.push(`loading total: ${fmt(full.loadPhases.total)}`);
      if(full.frameLogic&&slower(full.frameLogic,0))full.differences.push(`frame logic: ${fmt(full.frameLogic,'ms',3)}`);
      if(full.differences.length)flagged=true;
    }
  }finally{rmSync(work,{recursive:true,force:true});}
  return {results,flagged};
}

// ---- Report ----------------------------------------------------------------------------
function report(plan,measured){
  const lines=[];
  for(const [mode,info] of Object.entries(plan.modes)){
    const m=MODES[mode],r=measured?.results[mode];
    let why=info.changed.length?`${info.changed.length} file${info.changed.length>1?'s':''} it loads changed: ${info.changed.slice(0,6).join(', ')}${info.changed.length>6?', …':''}`:`nothing it loads changed${info.versionOnly?` (${info.versionOnly} with only a new version number)`:''}`;
    if(r){
      why+=`\n             standard: ${r.standard.differences.length?r.standard.differences.join('; '):'no differences from the base'}`;
      if(r.standard.frameLogic)why+=`\n             frame logic: ${fmt(r.standard.frameLogic,'ms',3)}`;
      if(r.standard.golden)why+=`\n             golden trace: ${r.standard.golden.identical?'identical':r.standard.golden.compare}`;
      if(r.full){
        why+=`\n             full: ${r.full.differences.length?r.full.differences.join('; '):'no differences'}`;
        if(r.full.loadPhases)why+=`\n             load phases: ${['modules','world','shaders','total'].map(k=>`${k} ${fmt(r.full.loadPhases[k])}`).join('; ')}`;
        if(r.full.frameLogic)why+=`\n             frame logic: ${fmt(r.full.frameLogic,'ms',3)}`;
      }
    }
    lines.push(`${(m.label+':').padEnd(13)}${info.tier.padEnd(10)}${why}`);
  }
  const o=plan.other;
  if(o.unloaded.length)lines.push(`Not loaded by any page: ${o.unloaded.join(', ')}`);
  if(o.server.length)lines.push(`Site and leaderboard server: ${o.server.join(', ')} (npm test covers the leaderboard; build with the Sites helper)`);
  if(o.tooling.length)lines.push(`Tests, scripts and docs: ${o.tooling.length} file${o.tooling.length>1?'s':''} (npm test)`);
  if(!measured&&Object.values(plan.modes).some(m=>m.tier!=='quick'))lines.push('Run with --measure to make the standard comparison (and the full protocol where it finds a difference).');
  return lines.join('\n');
}

export function plan(base){
  const graphsHead=modeGraphs(headBuild()),graphsBase=modeGraphs(baseBuild(base));
  const graphs=Object.fromEntries(Object.keys(MODES).map(k=>[k,new Set([...graphsHead[k],...graphsBase[k]])]));
  return {base,commit:git(['rev-parse','HEAD']).trim(),...classify(changedFiles(base),graphs),graphs:Object.fromEntries(Object.entries(graphsHead).map(([k,g])=>[k,[...g].sort()]))};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const argv=process.argv.slice(2),arg=(n,f)=>{const i=argv.indexOf('--'+n);return i>=0?argv[i+1]:f;};
  try{
    const base=resolveBase(arg('base','origin/main')),p=plan(base);
    let measured=null,outDir=null;
    if(argv.includes('--measure')&&Object.values(p.modes).some(m=>m.tier!=='quick')){
      outDir=resolve(arg('out-dir',join(root,'.tier',new Date().toISOString().replace(/[:.]/g,'-'))));mkdirSync(outDir,{recursive:true});
      measured=await measure(p,{base,outDir,escalate:!argv.includes('--no-escalate'),force:argv.includes('--full')});
    }
    const text=report(p,measured);
    console.log(`Release tier against ${base}\n${text}${outDir?`\nResults: ${outDir}`:''}`);
    const summary={base,commit:p.commit,modes:p.modes,other:p.other,measured:measured?.results??null};
    if(outDir)writeFileSync(join(outDir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
    if(arg('json'))writeFileSync(resolve(arg('json')),JSON.stringify(summary,null,2)+'\n');
    process.exitCode=measured?.flagged?1:0;
  }catch(e){console.error(`release-tier: ${e.message}`);process.exitCode=2;}
}

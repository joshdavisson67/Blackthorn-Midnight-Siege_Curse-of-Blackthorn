// v206: scripts/release-tier.mjs, the per-mode release tier. Checks the map of what each
// page loads against the real game folder and the browser's own records, and the rules
// that turn a diff and a measured comparison into quick, standard or full.
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync,statSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {refsOf,pageGraph,modeGraphs,withoutVersion,sameApartFromVersion,classify,compareLoads,paired,slower,THRESHOLDS,MODES} from '../scripts/release-tier.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..'),game=resolve(root,'public/game');
const build={has:f=>existsSync(resolve(game,f))&&statSync(resolve(game,f)).isFile(),read:f=>readFileSync(resolve(game,f),'utf8')};

// ---- 1. Reading references --------------------------------------------------------------
{
  const js=`import {a} from './a.mjs?v=9';import './side.mjs';
import {
  b,c
} from "./multi.mjs";
export {d} from './re-export.mjs';
const lazy=await import('./lazy.mjs?v=3');const u=new URL('./data.json',import.meta.url);
const tex='assets/stone-v1.png?v=2',font="body.woff2";const dyn=\`assets/\${name}.png\`;fetch('https://example.com/x.png');`;
  assert.deepEqual(refsOf('x.mjs',js).sort(),['./a.mjs','./data.json','./lazy.mjs','./multi.mjs','./re-export.mjs','./side.mjs','assets/stone-v1.png','body.woff2'].sort(),'Imports of every kind and named assets, without queries; built and remote URLs are left out');
  const css=`@import url("base.css");@font-face{src:url('body.woff2') format('woff2')}.x{background:url(assets/mask.svg?v=50)}.y{background:url(data:image/png;base64,AA)}`;
  assert.deepEqual(refsOf('s.css',css).sort(),['assets/mask.svg','base.css','body.woff2'],'Stylesheets: url() and @import, not data URLs');
  const html=`<link rel="stylesheet" href="style.css?v=5"><script src="boot.js?v=5"></script><a href="tide.html">Dead Tide</a><a href="siege.html#x">go</a><img src="assets/seal.svg"><a href="https://github.com">src</a><style>@font-face{src:url('title.woff2')}</style><script type="module">import {x} from './inline.mjs';</script>`;
  assert.deepEqual(refsOf('p.html',html).sort(),['./inline.mjs','assets/seal.svg','boot.js','style.css','title.woff2'],'Pages: what they load, not the pages they link to');
  console.log('PASS: the tier map reads static, multi-line, side-effect, re-exported and dynamic imports, new URL(), assets named in code, stylesheet url() and @import, and page tags, and leaves out page links, remote and data URLs.');
}

// ---- 2. The map of each mode, against the real game folder ---------------------------
{
  const g=modeGraphs(build);
  for(const [k,m] of Object.entries(MODES))for(const p of m.pages)assert(g[k].has(p),`${m.label} starts at ${p}`);
  // The browser's own record of what each page fetched (perf-measure --page ...).
  const fetched=file=>JSON.parse(readFileSync(resolve(root,'perf',file),'utf8')).load.files.map(f=>f.replace(/^\//,'')).filter(f=>build.has(f));
  const latest=(pattern)=>readdirSync(resolve(root,'perf')).filter(f=>pattern.test(f)).filter(f=>JSON.parse(readFileSync(resolve(root,'perf',f),'utf8')).load?.files).sort((a,b)=>parseInt(a.slice(1))-parseInt(b.slice(1))).at(-1);
  for(const [mode,pattern] of [['mansion',/^v\d+-siege.*\.json$/],['tide',/^v\d+-tide.*\.json$/],['picker',/^v\d+-modes.*\.json$/]]){
    const file=latest(pattern);assert(file,`a perf record of what the ${MODES[mode].label} fetched`);
    const missing=fetched(file).filter(f=>!g[mode].has(f));
    assert.deepEqual(missing,[],`Every file the ${MODES[mode].label} fetched (perf/${file}) is in its map`);
  }
  // The same scripts as a plain import walk from each boot script (tests/dead-tide.mjs's closure).
  const imports=f=>[...build.read(f).matchAll(/(?:^\s*(?:import|export)[^'"]*?from\s*|^\s*import\s*|import\(\s*)['"]\.\/([\w.-]+?)(?:\?v=\d+)?['"]/gm)].map(m=>m[1]);
  const closure=entry=>{const seen=new Set(),walk=f=>{if(seen.has(f))return;seen.add(f);for(const x of imports(f))walk(x);};walk(entry);return seen;};
  const scripts=s=>new Set([...s].filter(f=>/\.m?js$/.test(f)));
  assert.deepEqual([...scripts(g.mansion)].sort(),[...closure('boot.js')].sort(),'The mansion map holds exactly the scripts boot.js loads');
  assert.deepEqual([...scripts(g.tide)].sort(),[...closure('tide-boot.js')].sort(),'Dead Tide’s map holds exactly the scripts tide-boot.js loads');
  assert(!['game.js','boot.js','core.mjs','estate-layout.mjs'].some(f=>g.tide.has(f))&&!['tide.mjs','tide-boot.js','island.mjs'].some(f=>g.mansion.has(f)),'Neither mode’s map reaches into the other');
  assert(!scripts(g.picker).size,'The mode picker loads no scripts');
  const shared=[...g.tide].filter(f=>g.mansion.has(f)&&/\.m?js$/.test(f));
  assert(shared.includes('katana.mjs')&&shared.includes('weapon-runtime.mjs')&&shared.includes('three.module.js'),'Shared modules are in both maps');
  console.log(`PASS: the tier map of each mode matches the real game: the mansion ${g.mansion.size} files, Dead Tide ${g.tide.size} (${shared.length} shared scripts), the mode picker ${g.picker.size}. Every file each page fetched in its latest perf record is mapped, the scripts match an import walk from each boot script, and neither mode reaches into the other.`);
}

// ---- 3. Version-only changes, and sorting a diff into tiers ---------------------------
{
  assert(sameApartFromVersion(`import {a} from './a.mjs?v=205';`,`import {a} from './a.mjs?v=206';`),'A new cache key alone is not a change');
  assert(sameApartFromVersion('export const CURRENT_VERSION=205;','export const CURRENT_VERSION=206;'),'nor is the version number');
  assert(!sameApartFromVersion(`import {a} from './a.mjs?v=205';const x=1;`,`import {a} from './a.mjs?v=206';const x=2;`),'Anything else is');
  assert.equal(withoutVersion('a.mjs?v=12 b.css?v=3'),'a.mjs?v=# b.css?v=#');
  const graphs={mansion:new Set(['index.html','game.js','shared.mjs','style.css']),tide:new Set(['tide.html','tide.mjs','shared.mjs','style.css']),picker:new Set(['modes.html'])};
  const tiers=(changes)=>{const r=classify(changes.map(c=>typeof c==='string'?{path:c,versionOnly:false}:c),graphs);return [r.modes.mansion.tier,r.modes.tide.tier,r.modes.picker.tier,r.other];};
  assert.deepEqual(tiers(['tests/x.mjs','README.md','scripts/y.mjs']).slice(0,3),['quick','quick','quick'],'Tests, scripts and docs leave every mode quick');
  assert.deepEqual(tiers(['public/game/tide.mjs']).slice(0,3),['quick','standard','quick'],'A Dead Tide file: Dead Tide only');
  assert.deepEqual(tiers(['public/game/game.js']).slice(0,3),['standard','quick','quick'],'A mansion file: the mansion only');
  assert.deepEqual(tiers(['public/game/shared.mjs']).slice(0,3),['standard','standard','quick'],'A shared module: both modes');
  assert.deepEqual(tiers([{path:'public/game/shared.mjs',versionOnly:true},{path:'public/game/game.js',versionOnly:true}]).slice(0,3),['quick','quick','quick'],'Version-only changes leave a mode quick');
  const o=tiers(['public/game/unused.mjs','server/leaderboard.mjs','.openai/hosting.json','.openai/release-state.json','tests/a.mjs'])[3];
  assert.deepEqual(o,{unloaded:['unused.mjs'],server:['server/leaderboard.mjs','.openai/hosting.json'],tooling:['.openai/release-state.json','tests/a.mjs']},'Other changes are reported by kind');
  console.log('PASS: a new version number alone is not a change; tests, scripts and docs leave every mode quick; a file one mode loads makes that mode standard, a shared one both; files no page loads, server files and tooling are reported apart.');
}

// ---- 4. The standard comparison and when it escalates ---------------------------------
{
  const load=(o={})=>({load:{untilPlayable:{requests:105,kb:9003},heapMB:239,phases:{modulesMs:400,worldMs:12000,shadersMs:38000},...o.load},gpu:{shaderPrograms:89,geometries:1470,textures:135,shaderProgramsAfterFight:89,...o.gpu},
    views:{hall:{drawCalls:2061,trianglesK:1823},chapel:{drawCalls:1483,trianglesK:1094},...o.views},fight:{drawCalls:2955,trianglesK:2733,stillAlive:32,heapMB:246,...o.fight},errors:[]});
  const base=load();
  assert.deepEqual(compareLoads(base,load()),[],'Identical builds: no differences');
  assert.deepEqual(compareLoads(base,load({load:{untilPlayable:{requests:105,kb:9003+THRESHOLDS.kb-1},heapMB:239+THRESHOLDS.heapMB-.1}})),[],'A few bytes and heap noise are not differences');
  assert.deepEqual(compareLoads(base,load({load:{phases:{modulesMs:420,worldMs:12200,shadersMs:41000}}})),[],'nor is the shader phase’s noise, or a small JavaScript wobble');
  const d=compareLoads(base,load({views:{hall:{drawCalls:2062,trianglesK:1823}},gpu:{textures:136},fight:{heapMB:249},load:{untilPlayable:{requests:106,kb:9030},heapMB:239,phases:{modulesMs:400,worldMs:14000,shadersMs:38000}}}));
  for(const what of ['files before playable','KB before playable','textures','hall draw calls','heap after the fight','JavaScript loading'])assert(d.some(x=>x.startsWith(what)),`${what} is a difference`);
  assert(compareLoads(base,{...load(),errors:['boom']}).some(x=>x.startsWith('page errors')),'and so is a page error');
  const gcBase=load({load:{heapMB:239,heapAfterGcMB:237.9}}),gcNoise=load({load:{heapMB:245,heapAfterGcMB:238.2}}),gcGrowth=load({load:{heapMB:239,heapAfterGcMB:241}});
  assert(!compareLoads(gcBase,gcNoise).length&&compareLoads(gcBase,gcGrowth).some(x=>x.startsWith('heap after load')),'Memory after a collection is compared where both records have it');
  const picker={load:{timeToInteractiveMs:900,total:{requests:6,kb:180},heapMB:3,files:[]},errors:[]};
  assert.deepEqual(compareLoads(picker,picker),[],'The mode picker’s simpler record compares too');
  const flat=paired([[2.4,2.41],[2.5,2.49],[2.45,2.47],[2.48,2.47]]),up=paired([[2.4,2.6],[2.5,2.7],[2.45,2.66],[2.48,2.69]]);
  assert(!slower(flat,THRESHOLDS.frameLogicPct)&&slower(up,THRESHOLDS.frameLogicPct),'Frame logic escalates on a slowdown beyond its noise and 2%, not on noise');
  assert(Math.abs(up.mean-.205)<1e-9&&up.n===4,'Paired differences are head minus base');
  console.log('PASS: the standard comparison flags new files, bytes beyond 10 KB, any change in shader programs, geometries, textures, draw calls or triangles, heap growth beyond 2 MB, slower JavaScript loading and page errors, and frame logic slower beyond its noise; identical builds and run-to-run noise pass.');
}

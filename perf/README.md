# Performance records

These records come from `scripts/perf-measure.mjs`, which loads one page of `public/game` in headless Chromium.

Dead Tide is being built as a separate mode. Its rule is that Midnight Siege (the mansion) must load and run exactly as before, and every step is checked against the v192 baseline here.

- **Comparable anywhere:** bytes, requests, shader programs, geometries, textures, draw calls and triangles don't depend on the machine.
- **Comparable only on the same machine:** time to playable and frame times. These runs use software rendering (seconds per frame), so the frame times only show whether something got slower relative to the baseline. They are not real-world FPS.

| File | Build | What it is |
|---|---|---|
| `baseline-v192-siege.json` | v192 (main before Dead Tide) | The mansion baseline |
| `v193-siege.json` | v193 (step 0) | The mansion after adding the mode picker |
| `v193-modes.json` | v193 (step 0) | The mode picker page itself |
| `v193-siege-rerun.json` | v193 (main) | The mansion re-measured beside v194, on the same machine and in the same session |
| `v194-siege.json` | v194 (step 1: shared enemy AI) | The mansion after moving enemy AI into `enemy-ai.mjs` |
| `v194-siege-rerun.json` | v194 (main) | The mansion re-measured beside v195 |
| `v195-siege.json` | v195 (step 1: shared enemy spawner) | The mansion after moving enemy creation and placement into `enemy-spawn.mjs` |
| `v195-siege-rerun.json` | v195 (main) | The mansion re-measured beside v196 |
| `v196-siege.json` | v196 (step 1: shared combat) | The mansion after moving hits, kills, blasts and drops into `enemy-combat.mjs` |
| `v196-siege-rerun.json` | v196 (main) | The mansion re-measured beside v197 |
| `v197-siege.json` | v197 (step 1: shared weapon runtime) | The mansion after moving the weapon runtime into `weapon-runtime.mjs` |
| `v197-load-phases.jsonl` | v196 (main) and v197 | Twelve balanced runs of `scripts/load-phases.mjs` |

## Step 1 (v194) against main

Main (v193) was measured again straight after v194, so the timings below come from the same machine and session.

| Mansion | v193 (main) | v194 |
|---|---:|---:|
| Files loaded before playable | 91 | 92 (`enemy-ai.mjs`) |
| Bytes loaded before playable | 8,934 KB | 8,936 KB |
| Time to playable, mean of 3 alternating runs | 47.3 s | 47.5 s |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load, mean of 3 runs | 237.1 MB | 237.0 MB |
| JS heap after the fight | 243.8 MB | 243.8 MB |
| Draw calls and triangles in the six views | as in step 0 | identical |
| 32-zombie fight: draw calls / triangles | 2,942 / 2.73 M | identical |
| 32-zombie fight: mean frame time (software rendering) | 3,130 ms | 3,146 ms |
| 32-zombie fight: renderer CPU time per frame | 32.2 ms | 27.0 ms |

**Verdict:** no regression in rendering, shaders or memory. Every rendering count is identical, and the timing differences fall within run-to-run noise. Single runs of time to playable ranged from 46.3 to 48.7 s for both builds.

**The one measurable change** is one more file and 2 KB more source, about 0.02% of the load. That 2 KB is the module's import lines and the mansion's wiring, net of the code that left `game.js`. The new file loads alongside `game.js`'s other imports, and everything it imports is already loaded by `game.js`, so it adds no step to the loading chain.

The full v194 run in `v194-siege.json` was taken before a 1.3 KB comment was trimmed from the module, so it reads 8,937 KB. The released build reads 8,936 KB, as in the three load-only runs above.

**Gameplay:** `scripts/golden-trace.mjs` produces byte-identical traces on main and v194.

## Step 0 (v193) against the baseline

| Mansion | v192 | v193 |
|---|---:|---:|
| Files loaded before playable | 91 | 91 |
| Bytes loaded before playable | 8,933 KB | 8,934 KB (the hidden ALL MODES link) |
| Time to playable, mean of 3 alternating runs | 48.3 s | 46.9 s |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load | 237 MB | 238 MB |
| Draw calls: hall, ballroom, rotunda, chapel, upstairs, courtyard | 2,046 · 1,835 · 1,867 · 1,479 · 1,788 · 2,376 | identical |
| Triangles (thousands) in the same views | 1,815 · 1,594 · 1,588 · 1,093 · 1,645 · 1,996 | identical |
| 32-zombie fight: draw calls / triangles | 2,942 / 2.73 M | identical |
| 32-zombie fight: renderer CPU time per frame | 30.6 ms | 24.0 ms (run-to-run noise) |

**Verdict:** no regression. Every deterministic count is identical, and the timing differences fall within run-to-run noise. Single runs of time to playable ranged from 45.5 to 50.4 s on this machine.

**The picker (`modes.html`):**
- **What it loads:** 6 files and 97 KB, with no 3D engine, no game code and no WebGL context.
- **Speed:** interactive in under 0.1 s, using a 1.5 MB JS heap.

## Step 1, slice 2 (v195) against main

Both builds were measured twice in full, back to back, and timed over seven alternating load pairs (three with v195 first, four with main first).

| Mansion | v194 (main) | v195 |
|---|---:|---:|
| Files loaded before playable | 92 | 93 (`enemy-spawn.mjs`) |
| Bytes loaded before playable | 8,936 KB | 8,939 KB |
| Time to playable, mean of 7 alternating runs | 46.2 s (±1.9) | 47.0 s (±2.9) |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load / after the fight | 237.0 / 243.8 MB | 237.2 / 243.8 MB |
| Draw calls and triangles in the six views | as in step 0 | identical |
| 32-zombie fight: draw calls / triangles | 2,942 / 2.73 M | identical |
| 32-zombie fight: mean frame time (software rendering) | 2,979 ms | 2,906 ms |

**Verdict:** no regression. Every rendering, shader and memory count is identical, and the timing differences fall within run-to-run noise.

- **Time to playable:** in the seven pairs, v195 was slower in five and faster in two. The paired differences ran from 4.2 s faster to 3.1 s slower, a mean of 0.8 s with a standard error of about 1 s. Single runs ranged from 43.2 to 51.0 s.
- **The one measurable change** is one more file and 3 KB more source. That's the module's import lines and the wiring, net of the code that left `game.js`. As with v194, everything it imports is already loaded by `game.js`.
- **The hall view (one-off):** the first full v195 run read 1,939 draw calls there instead of 2,046, with faster frames. The repeat run, in `v195-siege.json`, and both main runs read 2,046.

  The likely cause is timing, not the build. The game draws each room lamp's shadow once, the first time that lamp is needed, at one lamp per frame. With software rendering taking seconds per frame, whether one of those draws lands inside the measured frames depends on timing, so the hall count can shift by about a hundred draw calls.

**Gameplay:** `scripts/golden-trace.mjs` (13 scenarios, now including every enemy's birth) produces byte-identical traces on main and v195.

## Step 1, slice 3 (v196) against main

Both builds were measured in full, back to back, and timed over six alternating load pairs (three with v196 first, three with main first).

| Mansion | v195 (main) | v196 |
|---|---:|---:|
| Files loaded before playable | 93 | 94 (`enemy-combat.mjs`) |
| Bytes loaded before playable | 8,939 KB | 8,941 KB |
| Time to playable, mean of 6 alternating runs | 48.8 s (±0.7) | 48.3 s (±1.2) |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load (mean of 6) / after the fight | 236.9 / 243.9 MB | 237.2 / 243.8 MB |
| Draw calls and triangles in the six views | as in step 0 | identical |
| 32-zombie fight: draw calls / triangles | 2,942 / 2.73 M | identical |
| 32-zombie fight: mean frame time (software rendering) | 3,011 ms | 2,922 ms |

**Verdict:** no regression. Every rendering, shader and memory count is identical, and the timing differences fall within run-to-run noise.

- **Time to playable:** across the six pairs, v196 averaged 0.5 s faster, with a standard error of 0.4 s. It was faster in four pairs and slower in two.
- **The only measurable change** is one more file and 2 KB more source.

**Gameplay:** `scripts/golden-trace.mjs` (17 scenarios) produces byte-identical traces on main and v196.

## Step 1, slice 4 (v197) against main

Main was measured in full once and v197 twice. Loading was timed over 14 balanced pairs, and then phase by phase over 12 more balanced runs.

| Mansion | v196 (main) | v197 |
|---|---:|---:|
| Files loaded before playable | 94 | 95 (`weapon-runtime.mjs`) |
| Bytes loaded before playable | 8,941 KB | 8,945 KB |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load / after the fight | 237.1 / 243.8 MB | 236.9 / 243.8 MB |
| Draw calls and triangles in the six views | as in step 0 | identical (see the hall note) |
| 32-zombie fight: draw calls / triangles | 2,942 / 2.73 M | identical |
| Load: modules fetched and run (12 balanced runs) | 0.40 s | 0.37 s |
| Load: building the world | 12.77 s | 12.67 s |
| Load: compiling shaders and drawing the first frame | 41.98 s | 41.68 s |

**Verdict:** no regression. Every rendering, shader and memory count is identical, and the JavaScript load phases match within noise.

- **Time to playable in the 14 load pairs:** v197 averaged 0.84 s slower (standard error 0.46 s) and was slower in 12 of the pairs, so I timed the phases to see where the gap came from.
  - **What the phases showed:** the two phases this change could affect, fetching and running the modules and building the world, take the same time in both builds. All the variation is in shader compiling and the first frame. That work is identical in both builds (the same 89 shader programs) and swings by 2 to 3 s between runs.
  - **Across the 12 phase runs,** v197 loaded 0.4 s faster (standard error 1.0 s).
- **The hall view (one-off):** the first full v197 run read 1,939 draw calls there, as one v195 run did. The repeat, in `v197-siege.json`, read 2,046, like main. This is the lamp-shadow timing artefact described under step 1, slice 2.
- **The one measurable change** is one more file and 4 KB more source.

**Gameplay:** `scripts/golden-trace.mjs` (20 scenarios) produces byte-identical traces on main and v197.

## Re-running

```
node scripts/perf-measure.mjs --label vNNN --out perf/vNNN-siege.json
node scripts/perf-measure.mjs --page modes.html --out perf/vNNN-modes.json
node scripts/perf-measure.mjs --game <other checkout>/public/game --load-only
node scripts/golden-trace.mjs > after.json   # then cmp it against a trace taken on main
node scripts/load-phases.mjs --game <checkout>/public/game   # where loading time goes
```

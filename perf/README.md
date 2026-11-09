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
| `v197-siege-rerun.json` | v197 (main) | The mansion re-measured beside v198 |
| `v198-siege.json` | v198 (step 1: the player's run) | The mansion after moving the run's values, movement, hurt and recovery into `player.mjs` |
| `v198-load-phases.jsonl` | v197 (main) and v198 | Twenty balanced runs of `scripts/load-phases.mjs` |
| `v198-frame-logic.jsonl` | v197 (main) and v198 | Twelve alternating pairs of `scripts/frame-logic.mjs` |
| `v198-fights.jsonl` | v197 (main) and v198 | Four more 32-zombie fight samples, alternating |
| `v198-siege-rerun.json` | v198 (main) | The mansion re-measured beside v199 |
| `v199-siege.json` | v199 (step 1: shared HUD) | The mansion after moving the HUD's shared readouts into `hud.mjs` |
| `v199-load-phases.jsonl` | v198 (main) and v199 | Twenty balanced runs of `scripts/load-phases.mjs` |
| `v199-frame-logic.jsonl` | v198 (main) and v199 | Twelve balanced pairs of `scripts/frame-logic.mjs` |
| `v199-siege-rerun.json` | v199 (main) | The mansion re-measured beside v200 |
| `v200-siege.json` | v200 (step 1: the play session) | The mansion after moving the session, mouse capture, pause flow and controls into `controls.mjs` |
| `v200-load-phases.jsonl` | v199 (main) and v200 | Twenty balanced runs of `scripts/load-phases.mjs` |
| `v200-frame-logic.jsonl` | v199 (main) and v200 | Twelve balanced pairs of `scripts/frame-logic.mjs` |
| `v200-siege-rerun.json` | v200 (main) | The mansion re-measured beside v201 |
| `v201-siege.json` | v201 (step 1: the screen and the sound) | The mansion after moving the renderer, cameras, quality, resizing, frame drawing, shader warm-up and sound into `display.mjs` and `audio.mjs` |
| `v200-siege-repeat.json`, `v201-siege-repeat.json` | v200 (main) and v201 | A second full pair, main first, to recheck the fight heap |
| `v201-load-phases.jsonl` | v200 (main) and v201 | Twenty balanced runs of `scripts/load-phases.mjs` |
| `v201-frame-logic.jsonl` | v200 (main) and v201 | Twelve balanced pairs of `scripts/frame-logic.mjs` |
| `v201-siege-rerun.json`, `v201-siege-repeat.json` | v201 (main) | The mansion re-measured twice beside v202 |
| `v202-siege.json`, `v202-siege-repeat.json` | v202 (step 1: stations) | The mansion after moving the stations and their interaction into `stations.mjs`, measured twice |
| `v202-load-phases.jsonl` | v201 (main) and v202 | Forty balanced runs of `scripts/load-phases.mjs`, in two rounds |
| `v202-frame-logic.jsonl` | v201 (main) and v202 | Twenty-four balanced pairs of `scripts/frame-logic.mjs`, in two rounds |

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

## Step 1, slice 5 (v198) against main

Both builds were measured in full, back to back. Loading was then timed phase by phase over 20 balanced runs. The fight was sampled twice more on each build, and the game's own per-frame work was timed without rendering over 24 alternating pairs.

| Mansion | v197 (main) | v198 |
|---|---:|---:|
| Files loaded before playable | 95 | 96 (`player.mjs`) |
| Bytes loaded before playable | 8,945 KB | 8,950 KB |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load / after the fight | 237.2 / 243.8 MB | 237.3 / 243.8 MB |
| Draw calls and triangles in the six views and the fight | as in step 0 | identical |
| Load: modules fetched and run (20 balanced runs) | 0.33 s | 0.35 s |
| Load: building the world | 11.47 s | 11.01 s |
| Load: compiling shaders and drawing the first frame | 37.10 s | 36.88 s |
| Load: total | 48.89 s | 48.24 s |
| 32-zombie fight: mean frame time, three runs each (software rendering) | 3,089 · 3,333 · 2,982 ms | 3,432 · 2,967 · 2,960 ms |
| The game's own work per frame in that fight, no rendering (24 pairs) | 2.12 ms fastest · 2.37 ms median | 2.15 ms fastest · 2.42 ms median |

**Verdict:** no regression. Every rendering, shader and memory count is identical. Loading is no slower: modules take 27 ms longer (standard error 18 ms), and world building is 0.46 s faster (standard error 0.17 s).

- **The fight:** the first v198 run read 11% slower than main. Its two repeats read 2,967 and 2,960 ms, and across the three runs each the builds average 3,135 ms (main) and 3,120 ms (v198).
- **The game's own work per frame:** `scripts/frame-logic.mjs` times the per-frame JavaScript without rendering.
  - **The first 12 pairs** hinted at about 0.06 ms a frame, so I ran 12 more.
  - **Over all 24,** the difference is +0.03 ms at the fastest (standard error 0.03 ms; v198 slower in 12 of 24) and +0.06 ms at the median (standard error 0.07 ms). That's within noise.
- **The one measurable change** is one more file and 5 KB more source.

**Gameplay:** `scripts/golden-trace.mjs` (21 scenarios) produces byte-identical traces on main and v198.

## Step 1, slice 6 (v199) against main

Both builds were measured in full, back to back. Loading was timed phase by phase over 20 balanced runs, and the game's own per-frame work over 12 balanced pairs.

| Mansion | v198 (main) | v199 |
|---|---:|---:|
| Files loaded before playable | 96 | 97 (`hud.mjs`) |
| Bytes loaded before playable | 8,950 KB | 8,952 KB |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load / after the fight | 237.0 / 243.8 MB | 237.2 / 244.1 MB |
| Draw calls and triangles in the six views and the fight | as in step 0 | identical |
| Load: modules / world / shaders (20 balanced runs) | 0.35 / 11.85 / 38.93 s | 0.36 / 11.96 / 39.07 s |
| Load: total | 51.14 s | 51.39 s (+0.26 s, standard error 0.60 s) |
| 32-zombie fight: mean frame time (software rendering) | 3,328 ms | 3,278 ms |
| The game's own work per frame, no rendering (12 pairs) | 2.33 ms fastest · 2.64 ms median | 2.18 ms fastest · 2.56 ms median |

**Verdict:** no regression.

- **Counts:** every rendering, shader and memory count is identical.
- **Loading:** every load phase matches within noise.
- **Frame logic:** the game's own per-frame work is no slower (−0.15 ms at the fastest, standard error 0.10 ms).
- **Size:** the one measurable change is one more file and 2 KB more source.

**Gameplay and page:** `scripts/golden-trace.mjs` (21 scenarios, now fingerprinting every element on the page at every sample) produces byte-identical traces on main and v199.

## Step 1, slice 7 (v200) against main

Both builds were measured in full, back to back. Loading was timed phase by phase over 20 balanced runs, and the game's own per-frame work over 12 balanced pairs.

From v200 on, the probe reports the mouse as locked through the browser's own `pointerLockElement` property instead of replacing `hasMouseLock`. Both builds here were measured that way.

| Mansion | v199 (main) | v200 |
|---|---:|---:|
| Files loaded before playable | 97 | 98 (`controls.mjs`) |
| Bytes loaded before playable | 8,952 KB | 8,957 KB |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load / after the fight | 237.2 / 243.9 MB | 237.7 / 243.9 MB |
| Draw calls and triangles in the six views and the fight | as in step 0 | identical |
| Load: modules / world / shaders (20 balanced runs) | 0.39 / 12.41 / 40.79 s | 0.36 / 12.37 / 39.80 s |
| Load: total | 53.58 s | 52.53 s (−1.06 s, standard error 0.56 s) |
| 32-zombie fight: mean frame time (software rendering) | 3,275 ms | 3,167 ms |
| The game's own work per frame, no rendering (12 pairs) | 2.44 ms fastest · 2.90 ms median | 2.42 ms fastest · 2.73 ms median |

**Verdict:** no regression.

- **Counts:** every rendering, shader and memory count is identical.
- **Loading:** every load phase is the same or quicker.
- **Frame logic:** the game's own per-frame work matches.
- **Size:** the one measurable change is one more file and 5 KB more source.

**Gameplay and page:** `scripts/golden-trace.mjs` (22 scenarios, now including the pause, capture and menu flow) produces byte-identical traces on main and v200.

## Step 1, slice 8 (v201) against main

Both builds were measured in full twice, back to back: v201 first, then main first. Loading was timed phase by phase over 20 balanced runs, and the game's own per-frame work over 12 balanced pairs.

| Mansion | v200 (main) | v201 |
|---|---:|---:|
| Files loaded before playable | 98 | 100 (`display.mjs`, `audio.mjs`) |
| Bytes loaded before playable | 8,957 KB | 8,962 KB |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load (two runs) | 237.3, 236.9 MB | 236.1, 237.5 MB |
| JS heap after the fight (two runs) | 243.8, 244.6 MB | 253.3, 243.9 MB |
| Draw calls and triangles in the six views and the fight | as in step 0 | identical |
| Load: modules / world / shaders (20 balanced runs) | 0.37 / 12.37 / 40.73 s | 0.37 / 12.55 / 40.80 s |
| Load: total | 53.47 s | 53.73 s (+0.25 s, standard error 0.34 s) |
| 32-zombie fight: mean frame time (software rendering, two runs) | 3,304 / 3,338 ms | 3,285 / 3,281 ms |
| The game's own work per frame, no rendering (12 pairs) | 2.32 ms fastest · 2.84 ms median | 2.39 ms fastest · 2.75 ms median |

**Verdict:** no regression.

- **Counts:** every rendering, shader and memory count is identical. The first v201 run read the hall at 1,939 draw calls, the known lamp-shadow timing artefact; its repeat read 2,046, as main does.
- **Fight heap:** the first v201 run read 253.3 MB. The repeat read 243.9 MB, beside main's 243.8 and 244.6, and every earlier record sits at 243.8–244.1 MB, so the first reading was collection timing, not memory the change keeps.
- **Loading:** no phase changed beyond its run-to-run error. The single full runs (51.9 and 56.8 s for main, 57.2 and 54.6 s for v201) were noise.
- **Frame logic:** the game's own per-frame work matches (median −0.03 ms, standard error 0.12 ms; fastest +0.07 ms, standard error 0.11 ms).
- **Size:** the one measurable change is two more files and 5 KB more source.

**Gameplay, page, sound and screen:** `scripts/golden-trace.mjs` (23 scenarios) now also records every Web Audio node, link, value and ramp and every renderer call, from the shader warm-up to the last frame. It produces byte-identical traces on main and v201.

## Step 1, slice 9 (v202) against main

Both builds were measured in full twice: v202 first, then main first. Loading was timed phase by phase and the game's own per-frame work in balanced pairs. The first round of each (20 load runs, 12 pairs) put the shader phase 1.04 s slower (standard error 0.58 s), so both were run again in the opposite order (another 20 runs and 12 pairs), and the table gives all of them.

| Mansion | v201 (main) | v202 |
|---|---:|---:|
| Files loaded before playable | 100 | 101 (`stations.mjs`) |
| Bytes loaded before playable | 8,962 KB | 8,966 KB |
| Time to playable (two full runs) | 57.7, 57.5 s | 55.4, 56.2 s |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load (two runs) | 236.9, 237.2 MB | 238.0, 237.7 MB |
| JS heap after the fight (two runs) | 243.9, 243.9 MB | 243.9, 243.9 MB |
| Draw calls and triangles in the six views and the fight | as in step 0 | identical |
| Load: modules / world / shaders (40 balanced runs) | 0.36 / 12.57 / 40.58 s | 0.36 / 12.30 / 41.14 s |
| Load: total | 53.51 s | 53.81 s (+0.30 s, standard error 0.39 s) |
| 32-zombie fight: mean frame time (software rendering, two runs) | 3,296 / 3,470 ms | 3,486 / 3,428 ms |
| The game's own work per frame, no rendering (24 pairs) | 2.29 ms fastest · 2.67 ms median | 2.38 ms fastest · 2.71 ms median |

**Verdict:** no regression.

- **Counts:** every rendering, shader and memory count is identical. Both main runs read the hall at 1,939 draw calls, the known lamp-shadow timing artefact; both v202 runs read 2,046.
- **Loading:** the first round's slower shader phase did not repeat. The second round put it 0.09 s slower (standard error 0.65 s), and across all 40 runs no phase differs beyond its run-to-run error. Shader compiling is untouched by this change: the same 89 programs, from the same warm-up.
- **Frame logic:** the game's own per-frame work matches (median +0.05 ms, standard error 0.10 ms; fastest +0.10 ms, standard error 0.09 ms).
- **Size:** the one measurable change is one more file and 4 KB more source.

**Gameplay and page:** `scripts/golden-trace.mjs` (24 scenarios, now with a tour of all 37 stations) produces byte-identical traces on main and v202.

## Re-running

```
node scripts/perf-measure.mjs --label vNNN --out perf/vNNN-siege.json
node scripts/perf-measure.mjs --page modes.html --out perf/vNNN-modes.json
node scripts/perf-measure.mjs --game <other checkout>/public/game --load-only
node scripts/golden-trace.mjs > after.json   # then cmp it against a trace taken on main
node scripts/load-phases.mjs --game <checkout>/public/game   # where loading time goes
node scripts/frame-logic.mjs [<checkout>]                    # the game's own per-frame work, no rendering
```

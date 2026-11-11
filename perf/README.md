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
| `v202-siege-rerun.json`, `v202-siege-rerun2.json` | v202 (main) | The mansion re-measured twice beside v203 |
| `v203-siege.json`, `v203-siege-repeat.json` | v203 (step 2: the first-person view) | The mansion after moving the guns in hand, their lights, the eye and the view's motion into `first-person.mjs`, measured twice |
| `v203-load-phases.jsonl` | v202 (main) and v203 | Forty balanced runs of `scripts/load-phases.mjs`, in two rounds |
| `v203-frame-logic.jsonl` | v202 (main) and v203 | Twenty-four balanced pairs of `scripts/frame-logic.mjs`, in two rounds |
| `v203-siege-rerun.json`, `v203-siege-rerun2.json`, `v203-siege-rerun3.json` | v203 (main) | The mansion re-measured three times beside v204 |
| `v204-siege.json`, `v204-siege-repeat.json`, `v204-siege-repeat2.json` | v204 (step 2: Dead Tide's own page) | The mansion after moving the weapon table into `weapon-stats.mjs`, mesh batching into `batching.mjs` and the effects update into `enemy-combat.mjs`, measured three times |
| `v204-load-phases.jsonl` | v203 (main) and v204 | Forty balanced runs of `scripts/load-phases.mjs`, in two rounds |
| `v204-frame-logic.jsonl` | v203 (main) and v204 | Twenty-four balanced pairs of `scripts/frame-logic.mjs`, in two rounds |
| `v204-tide.json`, `v204-tide-repeat.json` | v204 | Dead Tide's grey-box island on its own page, `tide.html`, measured twice |
| `v204-siege-rerun.json`, `v204-siege-rerun2.json` | v204 (main) | The mansion re-measured twice beside v205 |
| `v204-tide-rerun.json`, `v204-tide-rerun2.json` | v204 (main) | Dead Tide re-measured twice beside v205 |
| `v205-siege.json`, `v205-siege-repeat.json` | v205 (the katana) | The mansion with the katana's stand in the servants' quarters and the katana among the weapons in hand, measured twice |
| `v205-load-phases.jsonl` | v204 (main) and v205 | Forty balanced runs of `scripts/load-phases.mjs`, in two rounds |
| `v205-frame-logic.jsonl` | v204 (main) and v205 | Twenty-four balanced pairs of `scripts/frame-logic.mjs`, in two rounds |
| `v205-tide.json`, `v205-tide-repeat.json` | v205 | Dead Tide carrying the shared katana, measured twice |
| `v205-siege-files.json` | v205 | The mansion's load with the files it fetched, which `tests/release-tier.mjs` checks the tier map against (taken with the release-tier tooling; `--load-only`) |

## Dead Tide's golden trace (tooling, before v206)

`v205-tide-golden.json` is `scripts/tide-golden-trace.mjs` run on main's v205 game: the island before the dead come ashore. It is a fixed reference that, unlike frame times, does not depend on the machine. v206 must reproduce its seven scenarios byte for byte (compare with `scripts/golden-compare.mjs perf/v205-tide-golden.json <new trace>`); `release-tier.mjs` also traces main and the branch side by side in Dead Tide's standard tier. Load, frame and memory baselines for v205 are the release's own records above (`v205-tide.json`, `v205-tide-repeat.json`, `v205-siege*.json`), and each release measures main beside the branch on the same machine.

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

## Step 2, slice 1 (v203) against main

Both builds were measured in full twice: v203 first, then main first. Loading was timed phase by phase over two rounds of 20 balanced runs, in opposite orders, and the game's own per-frame work over two rounds of 12 balanced pairs.

| Mansion | v202 (main) | v203 |
|---|---:|---:|
| Files loaded before playable | 101 | 102 (`first-person.mjs`) |
| Bytes loaded before playable | 8,966 KB | 8,969 KB |
| Time to playable (two full runs) | 59.0, 55.2 s | 58.3, 57.6 s |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load (two runs) | 250.8, 237.3 MB | 237.1, 237.3 MB |
| JS heap after the fight (two runs) | 243.8, 244.7 MB | 243.9, 243.9 MB |
| Draw calls and triangles in the six views and the fight | as in step 0 | identical |
| Load: modules / world / shaders (40 balanced runs) | 0.39 / 13.16 / 42.79 s | 0.41 / 13.24 / 43.26 s |
| Load: total | 56.33 s | 56.92 s (+0.59 s, standard error 0.50 s) |
| 32-zombie fight: mean frame time (software rendering, two runs) | 3,653 / 3,479 ms | 3,642 / 3,425 ms |
| The game's own work per frame, no rendering (24 pairs) | 2.35 ms fastest · 2.72 ms median | 2.40 ms fastest · 2.73 ms median |

**Verdict:** no regression.

- **Counts:** every rendering, shader and memory count is identical. The first main run read the hall at 1,939 draw calls, the known lamp-shadow timing artefact; its repeat and both v203 runs read 2,046.
- **Heap after load:** the first main run read 250.8 MB; the other three runs read 237.1–237.3 MB, so that reading was collection timing on main.
- **Loading:** no phase differs beyond its run-to-run error. Shaders read +0.75 s (standard error 0.76 s) in the first round and +0.20 s (standard error 0.56 s) in the second. Shader compiling is untouched by this change: the same 89 programs from the same warm-up, and the golden trace records every renderer call identically. Fetching and running the modules reads 20 ms longer (standard error 12 ms), about what one more small file costs here (v198 read +27 ms for the same reason).
- **Frame logic:** the game's own per-frame work matches (median −0.02 ms, standard error 0.08 ms).
- **Size:** the one measurable change is one more file and 3 KB more source.

**Gameplay, page and view:** `scripts/golden-trace.mjs` (25 scenarios) now also records, every sample, the pose of every part of the guns in hand, the camera, both fields of view, the muzzle flash and light and the flashlight, with a new scenario that aims, fires, reloads and sprints with every gun. It produces byte-identical traces on main and v203.

## Step 2, slice 2 (v204) against main

v204 gives Dead Tide its own page, so this section has two parts: the mansion against main, and Dead Tide's own numbers.

### The mansion

Both builds were measured in full three times: v204 first, then main first, then v204 first again. The third pair rechecked one view's frame time. Loading was timed phase by phase over two rounds of 20 balanced runs, in opposite orders, and the game's own per-frame work over two rounds of 12 balanced pairs.

| Mansion | v203 (main) | v204 |
|---|---:|---:|
| Files loaded before playable | 102 | 104 (`weapon-stats.mjs`, `batching.mjs`) |
| Bytes loaded before playable | 8,969 KB | 8,971 KB |
| Time to playable (three full runs) | 55.1, 60.5, 54.2 s | 50.7, 56.9, 56.9 s |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,457 / 125 |
| JS heap after load (three runs) | 237.5, 252.0, 236.9 MB | 237.5, 237.3, 237.2 MB |
| JS heap after the fight (three runs) | 243.8, 244.0, 243.8 MB | 243.8, 243.7, 243.8 MB |
| Draw calls and triangles in the six views and the fight | as in step 0 | identical |
| Load: modules / world / shaders (40 balanced runs) | 0.41 / 12.80 / 41.93 s | 0.40 / 12.66 / 41.81 s |
| Load: total | 55.14 s | 54.87 s (−0.27 s, standard error 0.35 s) |
| 32-zombie fight: mean frame time (software rendering, three runs) | 3,520 / 3,599 / 3,418 ms | 3,378 / 3,347 / 3,559 ms |
| The game's own work per frame, no rendering (24 pairs) | 2.34 ms fastest · 2.71 ms median | 2.38 ms fastest · 2.62 ms median |

**Verdict:** no regression.

- **Counts:** every rendering, shader and memory count is identical. Both third runs read the hall at 1,939 draw calls, the known lamp-shadow timing artefact; the other four read 2,046.
- **Heap after load:** the second main run read 252.0 MB; the other five read 236.9–237.5 MB, so that reading was collection timing on main, as in v203's records.
- **Loading:** no phase differs beyond its run-to-run error, in either round or across all 40 runs. Shader compiling is untouched by this change: the same 89 programs, from the same warm-up, and the golden trace records every renderer call identically. Fetching and running the modules reads 4 ms faster (standard error 16 ms), so the two new files add nothing measurable to it.
- **Frame logic:** the game's own per-frame work matches (median −0.02 ms, standard error 0.06 ms).
- **The fight:** v204 read faster in the first two pairs and slower in the third (3,559 against 3,418 ms). Across all three it averages 3,428 ms to main's 3,512 ms.
- **The rotunda:** the second v204 run read this view at 2,864 ms a frame, against 2,197 ms in v204's first run and 2,272–2,309 ms on main, with identical draw calls and triangles. Each view's figure is the mean of only 8 software-rendered frames, so a third pair was run, v204 first. It read 2,151 ms against main's 2,272 ms, so the slow reading did not repeat.
- **Size:** the one measurable change is two more files and 2 KB more source. `weapon-stats.mjs` imports nothing, and `batching.mjs` imports only three.js, which the mansion already loads. They are imported by modules the mansion already loads (`core.mjs`, `hud.mjs` and `weapon-runtime.mjs`; `game.js`).

**Gameplay, page and view:** `scripts/golden-trace.mjs` (25 scenarios) produces byte-identical traces on main and v204.

### Dead Tide

Dead Tide's page, `tide.html`, measured twice. The probe checks the title screen, five fixed views on the island and a grenade bursting in view.

| Dead Tide | First run | Second run |
|---|---:|---:|
| Files loaded before playable | 52 | 52 |
| Mansion files loaded | none | none |
| Bytes loaded before playable | 1,911 KB | 1,911 KB |
| Time to playable | 6.46 s | 6.69 s |
| Load: modules / world / shaders | 0.31 / 0.88 / 5.27 s | 0.26 / 1.13 / 5.30 s |
| Shader programs (after the views and the blast) | 35 (35) | 35 (35) |
| GPU geometries / textures | 203 / 13 | 203 / 13 |
| JS heap after load / after the blast | 36.3 / 33.1 MB | 36.0 / 32.9 MB |

| View | Draw calls | Triangles | Mean frame time (software rendering, two runs) |
|---|---:|---:|---:|
| Title screen | 54 | 36K | 182 / 199 ms |
| The landing beach | 52 | 35K | 187 / 195 ms |
| Radio Hill's summit | 39 | 28K | 220 / 209 ms |
| The wreck | 30 | 19K | 184 / 173 ms |
| Out to sea | 24 | 19K | 155 / 155 ms |
| Inside the shack | 42 | 29K | 266 / 248 ms |
| A grenade bursting on the beach | 97 | 35K | 223 / 216 ms |

- **Isolation:** neither run fetched any file of the mansion: not `index.html`, `boot.js`, `game.js`, `core.mjs`, the estate's layouts, lights or rooms, its curse, the leaderboard or the change log.
- **Shaders:** all 35 programs compile under the loading screen. None more compile in the views or during the grenade blast.
- **Beside the mansion on this machine:** Dead Tide loads 1,911 KB to the mansion's 8,971 KB and is playable in about 6.5 s to its 55 s. It compiles 35 shader programs to the mansion's 89, its heap after loading is 36 MB to the mansion's 237 MB, and its views take 24–97 draw calls to the mansion's 1,479–2,376.
- **The frame times** are software rendering and only comparable with other runs here; real-browser FPS was not measured.

## v205 (the katana) against main

v205 adds a feature to the mansion rather than moving code, so the question here is what the katana costs, and that it costs nothing beyond what it must. Both builds were measured in full twice (v205 first, then main first), loading over two rounds of 20 balanced runs in opposite orders, and the game's own per-frame work over two rounds of 12 balanced pairs.

| Mansion | v204 (main) | v205 |
|---|---:|---:|
| Files loaded before playable | 104 | 105 (`katana.mjs`) |
| Bytes loaded before playable | 8,971 KB | 9,003 KB |
| Time to playable (two full runs) | 48.0, 54.6 s | 46.9, 52.1 s |
| Shader programs (after a 32-zombie fight) | 89 (89) | 89 (89) |
| GPU geometries / textures | 1,457 / 125 | 1,470 / 135 |
| JS heap after load (two runs) | 237.3, 237.4 MB | 239.2, 238.7 MB |
| JS heap after the fight (two runs) | 243.9, 243.8 MB | 245.9, 246.4 MB |
| Draw calls: hall / ballroom / rotunda | 2,046 / 1,835 / 1,867 | 2,061 / 1,838 / 1,870 |
| Draw calls: chapel / upstairs west / courtyard | 1,479 / 1,788 / 2,376 | 1,483 / 1,792 / 2,391 |
| Draw calls and triangles in the 32-zombie fight | 2,942 / 2,726K | 2,955 / 2,733K |
| Load: modules / world / shaders (40 balanced runs) | 0.38 / 11.91 / 38.90 s | 0.37 / 11.83 / 38.79 s |
| Load: total | 51.19 s | 50.99 s (−0.20 s, standard error 0.51 s) |
| 32-zombie fight: mean frame time (software rendering, two runs) | 3,150 / 3,179 ms | 3,028 / 3,141 ms |
| The game's own work per frame, no rendering (24 pairs) | 2.18 ms fastest · 2.48 ms median | 2.17 ms fastest · 2.47 ms median |

**What the katana costs, and why each cost is there:**

- **Size:** one more file and 32 KB, mostly `katana.mjs` itself (the model, its painted finishes and the slashes).
- **Memory:** 1.3–2.6 MB more heap. Ten more textures, five of them the katana's finishes (about 1 MB with mipmaps); the other five are the bench's two plaques and the Soul Forge's three blade-only plaques. Thirteen more geometries.
- **Draw calls:**
  - **+3 or +4 in every view.** The bench under the katana casts into the moonlight's estate-wide shadow map, as every station does.
  - **+15 in the hall, the courtyard and the fight (+13).** Those cameras look north, and their view reaches the servants' quarters 90–110 m away, through the walls. The mansion has no occlusion culling, so the bench is drawn there as any station would be: its two plaques, three station materials and the sword's five.
  - **Triangles:** at most 8,000 more (0.4%).
- **Unchanged:**
  - **Shader programs:** 89, before and after a fight.
  - **Loading:** no phase differs beyond its run-to-run error.
  - **The game's own per-frame work:** median −0.01 ms (standard error 0.10 ms).
  - **The fight's frame time:** within its run-to-run spread.

**Found by measuring, and fixed before release.** The first v205 build cost more in three ways:

- **Shader programs:** it compiled two new ones, for the sword's textured materials. Every painted finish now pairs its colour map with the guns' metal finish as roughness, exactly as the guns do, so the sword uses the guns' programs.
- **The moonlight's shadow map:** every view drew 11–25 more calls, because the stand's seven materials were drawn into that estate-wide map. The small stand now casts no shadow and shares the bench's brass.
- **The first frame:** loading's shader phase ran 1.27 s longer (standard error 0.24 s, 20 runs), although no new program was compiled and later frames cost the same. The machine renders with Mesa's llvmpipe, which compiles a texture routine for each new combination of maps it meets. The scabbard, cord and stand used a colour map on its own at 4× anisotropy, a combination no other lit material uses, so the first frame compiled new routines. With the guns' pairing, the warm-up frame matches main: 25.9 s against 26.2 s over four alternating pairs, and the 40 balanced runs above.

**Gameplay:** `scripts/golden-compare.mjs` compares the golden traces of main and v205 channel by channel.

- **Identical in all 25 existing scenarios:** every birth, the player, every enemy, pickups, the run, the session, the weapons (the katana's own slot set aside) and every sound.
- **Different, as expected:** the screen, view and page hashes, because the bench is in the scene, the sword is in the view, and its reticle and key are on the page.
- **The station tour** matches except the Double Damage shrines' new wording.
- **A new katana scenario** runs last.

### Dead Tide

Dead Tide carries the katana through the shared modules. Measured twice beside main:

| Dead Tide | v204 (main) | v205 |
|---|---:|---:|
| Files / bytes before playable | 52 / 1,911 KB | 53 / 1,942 KB (`katana.mjs`) |
| Time to playable (two runs) | 5.40, 6.54 s | 5.42, 6.05 s |
| Shader programs (after the views and a blast) | 35 (35) | 35 (35) |
| GPU geometries / textures | 203 / 13 | 207 / 18 (the katana's five finishes) |
| JS heap after load (two runs) | 36.9, 36.3 MB | 34.1, 35.2 MB |
| Draw calls and triangles in the seven views | as in v204 | identical |

No mansion files are fetched on either build.

## v212 (Dead Tide's stations) against main (v211)

Measured by `node scripts/release-tier.mjs --measure` (full protocol for Dead Tide) on one machine, headless Chromium with software rendering. The stations are new content, so their costs are reported here; the first build's were cut down before release (below).

### Mansion: quick

Nothing it loads changed; five files differ only in their version number.

### Dead Tide: full protocol

| | main (v211) | v212 |
|---|---:|---:|
| Files / KB before playable | 63 / 2,069 | 65 / 2,096 |
| Time to playable (load phases, 20 pairs) | 7,536 ms | 10,200 ms (+2,664, SE 210) |
| ↳ modules | 334 ms | 314 ms (−20, SE 11) |
| ↳ world | 1,061 ms | 1,661 ms (+600, SE 29) |
| ↳ shaders | 6,142 ms | 8,225 ms (+2,083, SE 195) |
| Shader programs, at load and after play | 40 | 48 |
| Geometries / textures | 223 / 24 | 274 / 29 |
| Heap after load / after play, after a collection | 55.5 / 145.2 MB | 64.7 / 154.5 MB |
| Draw calls in the fixed views | 32–115 | 32–163 (title 66 → 143) |
| Triangles in the title view | 41K | 134K |
| Frame logic, walking the empty island (24 pairs) | 0.276 ms | 0.330 ms (+0.054, SE 0.015) |
| The 45-enemy fight: draw calls / triangles | 262–264 / 253K–257K | 306–310 / 318K–324K |

- **What the first build cost**, before the merging (one standard run): 1,653 draw calls in the title view, 52 textures, 50 shader programs, 505 geometries, frame logic 0.25 → 0.60 ms.
- **What was done** (`tide-palette.mjs`, Dead Tide only): untextured parts baked into one vertex-coloured material; everything still merged by material in 48 m cells, indexed; the plaques packed into one atlas; the armour models merged within themselves; the soul stone's flat-shading flag and the seams' line material dropped (two shaders fewer each); bullets test collider boxes, not merged triangles; the stations' matrices frozen once built.
- **What is left is the models themselves.** The mansion's racks hold first-person-quality guns (about 60K of the 93K new triangles), and building seventeen stations takes about 0.25 s of JavaScript (most of the world phase's +600 ms; merging adds about 0.1 s).
- **The shaders phase (+2.1 s)** does not follow the program count: it was the same with 54 programs and with 48, and still +0.7 s with the stations built but hidden. It includes the first frame drawn in software, the new buffers and textures uploaded, and collection of the build's garbage. A real GPU does this work far faster; that was not measured here.
- **Frame logic +0.054 ms:** the per-frame station checks (nearest station, prompt, Forge rank), the station colliders and bullets' box tests.
- **The golden trace** differs where the stations stand and are bought, as it must. Two runs of v212 are byte-identical.
- **Not measured:** real GPUs, integrated graphics, or frame rates in a real browser.
- **If the load time matters more than the stations being ready at once:** they could be built behind the title, as the dead are (v207), which would take most of the world and shader cost out of the time to playable.

### Mode picker: standard, no differences

Its tagline changed; nothing measurable did.

Files: `v212-tide.jsonl`, `v212-tide-load-phases.jsonl`, `v212-tide-frame-logic.jsonl`, `v212-tier-summary.json`.

## v211 (bolder ground, B-01 turned, a test ammo crate) against main (v210)

Measured by `node scripts/release-tier.mjs --measure` (full protocol for Dead Tide) on one machine, headless Chromium with software rendering.

### Mansion: quick

Nothing it loads changed; five files differ only in their version number.

### Dead Tide: full protocol

| | main (v210) | v211 |
|---|---:|---:|
| Files / KB before playable | 63 / 2,064 | 63 / 2,069 |
| Time to playable (load phases, 20 pairs) | 7,280 ms | 7,322 ms (+42, SE 62) |
| ↳ modules | 306 ms | 324 ms (+18, SE 13) |
| ↳ world | 989 ms | 1,061 ms (+73, SE 37) |
| ↳ shaders | 5,986 ms | 5,937 ms (−49, SE 49) |
| Shader programs, at load and after play | 40 | 40 |
| Geometries / textures | 222 / 24 | 223 / 24 |
| Heap after load / after play, after a collection | 55.5 / 145.3 MB | 55.5 / 145.3 MB |
| Draw calls in the fixed views | 32–112 | the same, +2 in four views (the crate) |
| Frame logic, walking the empty island (24 pairs) | 0.283 ms | 0.288 ms (+0.004, SE 0.018) |
| The 45-enemy fight: draw calls / triangles | 260–262 / 254K–257K | 262–264 / 253K–257K |

- **What it costs:** +5 KB, one geometry, and two draw calls where the crate is in view. Memory, shader programs and frame logic are unchanged.
- **Building the world:** +73 ms in the browser, which is within two standard errors. Building the island alone in Node, 25 runs of each version, gives the same median, with the fastest run 9 ms slower: the ground's height sums 17 shapes where it summed 9. The total time to playable is within noise.
- **The golden trace** differs where the ground changed (walking, the hill, the fights), as it must. Two runs of v211 are byte-identical.
- **Not measured:** real GPUs, integrated graphics, or frame rates in a real browser.

### Mode picker: quick

Nothing it loads changed.

Files: `v211-tide.jsonl`, `v211-tide-load-phases.jsonl`, `v211-tide-frame-logic.jsonl`, `v211-tier-summary.json`.

## v210 (the island's map) against main (v209)

Measured by `node scripts/release-tier.mjs --measure` (full protocol for Dead Tide) on one machine, headless Chromium with software rendering. This release changes the island itself, so its costs are new content, reported here, not regressions to chase to zero.

### Mansion: quick

Nothing it loads changed; five files differ only in their version number.

### Dead Tide: full protocol

| | main (v209) | v210 |
|---|---:|---:|
| Files / KB before playable | 63 / 2,040 | 63 / 2,064 |
| Time to playable (load phases, 20 pairs) | 7,581 ms | 7,679 ms (+98, SE 103) |
| ↳ modules | 315 ms | 320 ms (+5, SE 15) |
| ↳ world | 1,007 ms | 1,093 ms (+86, SE 34) |
| ↳ shaders | 6,259 ms | 6,266 ms (+7, SE 83) |
| Shader programs, at load and after play | 40 | 40 |
| Geometries / textures | 212 / 24 | 222 / 24 |
| Heap after load / after play, after a collection | 54.7 / 144.5 MB | 55.5 / 145.2 MB |
| Frame logic, walking the empty island (24 pairs) | 0.269 ms | 0.270 ms (+0.001, SE 0.009) |
| The 45-enemy fight: draw calls / triangles | 230–231 / 235K | 260–263 / 254K–259K |
| The 45-enemy fight: render CPU | 7.8–10.0 ms | 9.0–10.0 ms |

- **What the map costs:**
  - **+24 KB** of code, no new files.
  - **+86 ms building the world** (about 1% of the time to playable; the total is within noise). The ground's height now sums nine mounds and two coves, and there are about twice as many props to place. An earlier build of this release measured +110 ms; working the spawn network out once and a cheaper trail distance brought it down.
  - **+8 to +17 draw calls and +4K to +6K triangles a view** (for example the landing spot 52 → 68 and 35K → 41K): the landmarks, merged by material into one group, and the brush.
  - **+0.8 MB of heap.**
  - **No new shader programs** (40) and no new lights.
- **Frame logic is level**, although there are 135 colliders where there were about 80: a coarse grid now finds the few near a point. The same change made the 45-enemy fight's logic cheaper (three alternating runs: main 5.0–5.9 ms, v210 4.1–4.9 ms on this machine that day).
- **The fixed views changed with the map** (the wreck's is now on the west shore, the shack's is the tent's, and the bunker and the ruin are new), in both builds' measurements alike.
- **The golden trace** differs in every scenario, as it must: the island changed. Two runs of v210 are byte-identical.
- **Not measured:** real GPUs, integrated graphics, or frame rates in a real browser.

### Mode picker: standard, no differences

Only its in-development line changed.

Files: `v210-tide.jsonl`, `v210-tide-load-phases.jsonl`, `v210-tide-frame-logic.jsonl`, `v210-tier-summary.json`.

## v209 (the spawn network and the threat tracker) against main (v208)

Measured by `node scripts/release-tier.mjs --measure` (full protocol for Dead Tide) on one machine, headless Chromium with software rendering, and `scripts/tide-director-bench.mjs` (new), three runs of each build.

### Mansion: quick

Nothing it loads changed; five files differ only in their version number.

### Dead Tide: full protocol, no regression

| | main (v208) | v209 |
|---|---:|---:|
| Files / KB before playable | 63 / 2,025 | 63 / 2,040 |
| Time to playable (load phases, 20 pairs) | 5,366 ms | 5,356 ms (−10, SE 27) |
| ↳ modules | 264 ms | 251 ms (−13, SE 9) |
| ↳ world | 713 ms | 684 ms (−29, SE 14) |
| ↳ shaders | 4,390 ms | 4,422 ms (+32, SE 25) |
| Shader programs, at load and after play | 40 | 40 |
| Geometries / textures | 212 / 24 | 212 / 24 |
| Heap after load / after play, after a collection | 54.7 / 144.3 MB | 54.7 / 144.4 MB |
| The dead ready behind the title, Play untouched | 11.4–11.8 s | 11.5–11.7 s |
| Frame logic, walking the empty island (24 pairs) | 0.241 ms | 0.242 ms (+0.000, SE 0.006) |

- **The extra 15 KB** is the director's spawn network, the tracker's markup and styles, and the tracker's code. No new files.
- **After play, +0.1 MB:** the brutes' wider routes, now built behind the title screen (main built them when the first brute was rolled).
- Every load phase is within two standard errors.
- **The 45-enemy fight with the full mix:** all 45 alive. 229–232 draw calls and 233K–237K triangles in both builds, varying from run to run (timing). 7.3–7.9 ms of render CPU.
- **The golden trace:** the island's seven scenarios match main in every gameplay channel; only the page differs (the tracker). `fight`, `summit` and the three escalation scenarios change, as they should, since the dead now come from the open zones. Two runs of this build are byte-identical.

### Dead Tide: the director's own cost (new)

The frame-logic fight holds the shore, so `scripts/tide-director-bench.mjs` measures the director: time inside its update over 120 s at The Apocalypse, the island culled every 5 s so it keeps sending.

| | main (v208) | v209 |
|---|---:|---:|
| Arrivals in 120 s | 83 | 179 (batches refill faster after a cull) |
| Cost an arrival | 1.89–2.08 ms | 0.61 ms |
| Average a frame | 0.022 ms | 0.015 ms |
| Worst frame | 78–95 ms | 4.7–6.5 ms |
| Frames over 16 ms | 1 | 0 |

- **Main's worst frame** is the first brute: its wider route grid (about 0.1 s) was built when one was first rolled.
- **v209's worst frame** is a batch of three coming ashore together, one of them a brute.

### Mode picker: standard, no differences

Only its in-development line changed.

Files: `v209-tide.jsonl`, `v209-tide-load-phases.jsonl`, `v209-tide-frame-logic.jsonl`, `v209-tide-director.txt`, `v209-tier-summary.json`.

## v208 (the threat director's core) against main (v207)

Measured by `node scripts/release-tier.mjs --measure` (full protocol for Dead Tide: two measured pairs, 20 load-phase pairs, 24 frame-logic pairs) on one machine, headless Chromium with software rendering. This machine is slower than v207's: main itself takes about 6.5 s to playable here, against 4.6 s in v207's notes.

### Mansion: quick

Nothing it loads changed; five files differ only in their version number. The tier report is the proof.

### Dead Tide: full protocol, one small new file

| | main (v207) | v208 |
|---|---:|---:|
| Files / KB before playable | 62 / 2,018 | 63 / 2,025 |
| Time to playable (load phases, 20 pairs) | 6,511 ms | 6,518 ms (+7, SE 51) |
| ↳ modules | 273 ms | 286 ms (+13, SE 11) |
| ↳ world | 854 ms | 841 ms (−13, SE 19) |
| ↳ shaders | 5,383 ms | 5,391 ms (+8, SE 41) |
| Shader programs, at load and after play | 40 | 40 |
| Geometries / textures | 212 / 24 | 212 / 24 |
| Heap after load, after a collection | 54.7 MB | 54.7 MB |
| Frame logic, walking the empty island (24 pairs) | 0.224 ms | 0.222 ms (−0.001, SE 0.005) |

- **The one new file** is `tide-threat.mjs`, the director's numbers, about 5 KB. That and the director's own lines in `tide-dead.mjs` make the 7 KB. Every phase is within noise.
- **The golden trace:** the nine existing scenarios (the island's seven, `fight` and `summit`) are byte-identical to main's, because threat level 1 plays exactly as v207's stand-in. The three new escalation scenarios (`threshold`, `swarm`, `apocalypse`) differ from main, as they should: main's stand-in sends eight walkers at wave-1 strength whatever the kill count.

### Dead Tide: the 45-enemy fight with the full mix

The stress test now uses The Apocalypse's mix, the same ring in both builds: 19 walkers, 7 dogs, 7 ferals, 6 brutes, 3 Ashfangs and 3 lurkers, all unkillable, around an unkillable player on the south beach.

- **Browser** (`perf-measure.mjs --page tide.html`, three runs of each build):
  - all 45 alive throughout;
  - 229 or 232 draw calls and 233K–237K triangles a frame in both builds (each build showed both counts, in different runs: timing, not the build);
  - 7.0–8.2 ms of render CPU in both;
  - heap 144.3 MB after a collection in both.
  - v206–v207 measured 252 draw calls with the old ring, which had more walkers and no lurkers.
- **Game logic** (`frame-logic.mjs --mode tide-fight`, six alternating pairs; lurkers that burst are replaced in the ring): main 3.685 ms, v208 3.680 ms a frame (mean of medians).
- **In the tests** (`tests/dead-tide.mjs`), the director at level 52 sends all six kinds, fills to exactly 45 and never passes it.
- **Not measured:** real GPUs, integrated graphics, or frame rates in a real browser.

### Mode picker: standard, no differences

Only its in-development line changed.

Files: `v208-tide.jsonl` (both builds, with the fight), `v208-tide-load-phases.jsonl`, `v208-tide-frame-logic.jsonl`, `v208-tide-fight-logic.txt`, `v208-tier-summary.json`.

## v207 (the picker opens Dead Tide; the dead build behind its title) against main (v206)

Measured by `node scripts/release-tier.mjs --measure` (24 frame-logic pairs, 20 load-phase runs each) on one machine, headless Chromium with software rendering, and one `perf-measure.mjs --page tide.html` run after the fix below.

### Dead Tide: back to its pre-dead load time

| | main (v206) | v207 |
|---|---:|---:|
| Time to playable (load phases, total) | 9,215 ms | 4,617 ms (−4,598, SE 60) |
| ↳ world | 4,162 ms | 615 ms |
| ↳ shaders | 4,838 ms | 3,787 ms |
| Geometries at playable | 490 | 212 |
| Shader programs after play, and after the 45-enemy fight | 43 | 40 (none new in play or the fight) |
| Frame logic, walking the empty island | 0.207 ms | 0.209 ms (+0.002, SE 0.005) |

- **v205, before the dead existed,** was 4,651 ms to playable. The dead now cost nothing before the title screen.
- **Behind the title screen:** they are ready about 10.0 s after the page opens, roughly 5 s behind the title, with Play untouched. Pressing Play sooner finishes the build at once, and the shore waits.
- **The 45-enemy fight is unchanged:** 252 draw calls, 261K triangles, and all 45 alive.
- **A fix the measurement caught.** The first measurement showed 45 programs after play, against v206's 43: two were compiling in play. Everything warmed at load is compiled for the film pass's render target, where the program keys differ from the screen's. The dead's side compile now targets it too (`display.rt`), giving 40 programs, unchanged by play or the fight. That's fewer than v206, which also compiled the dead for the gun camera's layer, which they never use.
- **The golden trace** matches v206 in every gameplay channel, both fights included.

### Mansion: full, nothing that is not timing

- **Golden trace:** byte-identical to main's.
- **Frame logic:** 2.510 → 2.477 ms (−0.032, SE 0.044).
- **Load phases:** total 41,251 → 41,611 ms (+360, SE 247). Within noise: every phase is under two standard errors.
- **The hall's draw calls swapped again** (2061 ↔ 1953 between the standard and full passes). That's the load-timing effect documented under v206: its visible meshes are identical, and main shows either count depending on when loading ends.

### Mode picker: standard, no differences

## v206 (the dead come ashore) against main

Measured by `node scripts/release-tier.mjs --measure` against main (v205) on one machine, headless Chromium with software rendering. Frame times are relative to this machine only.

### Mansion: standard, no differences

- **Standard comparison:** no differences from main. That covers files and bytes before playable, every fixed view's draw calls and triangles, shader programs, memory and the fight.
- **Frame logic:** 2.485 → 2.470 ms (−0.015, SE 0.093), within noise.
- **Golden trace:** byte-identical to main's in all 26 scenarios.
- **The hall's draw calls depend on load timing, not on the build.** The first measurement of this branch showed the hall view at 2061 draw calls against main's 1953, consistently. Its visible meshes were identical, 801 in both builds. Main itself showed 2061 once its load was delayed by 300 ms and nothing else. The mansion refreshes shadow maps on a timer and a per-frame budget, so when loading ends decides which refreshes land in the measured frames. Treat a hall-only draw-call difference with identical meshes as timing.
- **The extra file:** that first measurement also counted 106 files before playable against 105. That was a real regression from a new `feral-stats.mjs`, fixed by moving the mansion's wave mix to `curse.mjs` instead.

### Dead Tide: full protocol, the cost of the dead

Everything below is the island gaining enemies; nothing the island already did got worse. Its seven island scenarios in the golden trace match main in every gameplay channel.

| | main (v205) | v206 |
|---|---:|---:|
| Files / KB before playable | 53 / 1,943 | 62 / 2,015 |
| Time to playable (load phases, median of 20) | 4,651 ms | 10,810 ms |
| ↳ modules | 241 ms | 251 ms |
| ↳ world (island, the dead's bodies, routes) | 613 ms | 4,862 ms |
| ↳ shaders | 3,798 ms | 5,698 ms |
| Shader programs | 35 | 43 (none new after play or in the fight) |
| Geometries / textures | 207 / 18 | 490 / 24 |
| Heap after load, after a collection | 29.3 MB | 140.1 MB |
| Frame logic, walking the empty island (24 pairs) | 0.209 ms | 0.241 ms (+0.032, SE 0.007) |

- **Load:** building the dead's bodies (`createEnemyAssets`: sculpted templates, injuries, faces, batching) is nearly all of the world's extra 4.2 s here, and about 1 s in Node. The route grid takes about 56 ms. The mansion pays the same build inside its own world phase.
- **Shaders:** the extra 1.9 s compiles the eight enemy and power-up programs, so none compile when the dead arrive.
- **Memory:** the same enemy bodies account for about 110 MB of the mansion's 240 MB.
- **Frame logic:** the scene graph is identical while walking: 669 objects in both builds. My own per-frame additions each cost under a microsecond. The +0.03 ms comes from the larger heap (more garbage-collection work), which comes with holding the dead in memory.
- **A possible improvement:** build the dead after the island is playable, behind the title screen, and warm their shaders in the background. That could take most of the 6 s off time to playable without a hitch when the first walker rises.

### Dead Tide: the 45-enemy stress test (new)

A mixed ring of 45 unkillable dead (walkers, ferals, brutes, dogs, Ashfangs) around an unkillable player on the south beach.

- **Browser** (`perf-measure.mjs --page tide.html`): all 45 alive throughout.
  - 252 draw calls and 261K triangles a frame, against 2,955 draw calls for the mansion's 32-zombie fight.
  - 8.2 ms of render CPU.
  - Heap 144 MB after a collection.
  - No new shader programs.
- **Game logic** (`frame-logic.mjs --mode tide-fight`): 3.58 ms a frame (median of 5). The plan's cap of 45 holds in the tests: pressed for 500, the shore fills to exactly 45.
- **Not measured:** real GPUs, integrated graphics, or frame rates in a real browser.

Files: `v206-tide.json` and `v206-tide-repeat.json` (with the fight), `v206-siege.json`, `v206-tide-load-phases.jsonl`, `v206-tide-frame-logic.jsonl`.

## Release tiers (tooling after v205)

`scripts/release-tier.mjs` decides how much of this measuring a change needs, for each mode on its own (`AGENTS.md` has the rules):

- **Quick:** nothing the mode loads changed. No measuring.
- **Standard:** something it loads changed. One measured pair at perf-measure's usual frame counts, six frame-logic pairs, and for the mansion the golden trace. Any difference in the counts, memory beyond 2 MB, JavaScript loading beyond 10%, or frame logic beyond its noise sends the mode to full.
- **Full:** two full measured pairs, 20 balanced load-phase pairs (40 runs) and 24 frame-logic pairs, as the versions above were measured.

**Tried on a simulated change** (on a scratch copy, not committed): a comment added to `game.js` and a crate added to the island in `island.mjs`.

| Mode | Tier | What it found | Time |
|---|---|---|---|
| Mansion | standard | No differences in any count or memory; frame logic 2.374 → 2.389 ms (+0.015, SE 0.146); golden trace identical | 18 min |
| Dead Tide | full | The crate: 207 → 208 geometries, one more draw call in the three views that see it (and heap noise, below). The full protocol found the same, with loading and frame logic unchanged (total −90 ms, SE 71 ms; frame logic −0.003 ms, SE 0.011 ms) | 9 min |
| Mode picker | quick | Nothing it loads changed | — |

The whole run took 27 minutes, against well over an hour for the full protocol on the mansion alone.

**Two lessons built in:**
- **Fewer frames per view aren't safe.** A first try with two frames per view let the hall's warming first frame decide its average: 2,748 against 2,315 draw calls on identical builds. The standard pair uses perf-measure's own frame counts, whose draw calls repeat exactly (`v205-siege.json` and its repeat).
- **Memory is compared after a collection.** In the simulation, Dead Tide's heap right after loading ranged from 34.7 to 44.7 MB across six runs of builds one crate apart, and it was flagged as a difference too. perf-measure now also reads memory after a forced collection (`heapAfterGcMB`, `--js-flags=--expose-gc`): 31.0 MB in four runs out of four of today's Dead Tide. The comparison uses it wherever both records have it.

**Dead Tide's tools:** `scripts/frame-logic.mjs --mode tide` (walking a circle on the beach and firing four times a second, about 0.24 ms a frame) and `scripts/load-phases.mjs --page tide.html` (Dead Tide's own performance marks). It has no golden trace yet; that comes with its enemies.

## Re-running

```
node scripts/release-tier.mjs [--measure] [--full]   # v206: each mode's tier, and the measurements it calls for
node scripts/perf-measure.mjs --label vNNN --out perf/vNNN-siege.json
node scripts/perf-measure.mjs --page modes.html --out perf/vNNN-modes.json
node scripts/perf-measure.mjs --page tide.html --out perf/vNNN-tide.json   # Dead Tide on its own page
node scripts/perf-measure.mjs --game <other checkout>/public/game --load-only
node scripts/golden-trace.mjs > after.json   # then cmp it against a trace taken on main
node scripts/golden-compare.mjs before.json after.json   # v205: channel by channel, for a change that adds something
node scripts/load-phases.mjs --game <checkout>/public/game   # where loading time goes
node scripts/load-phases.mjs --page tide.html [--game <dir>]  # v206: Dead Tide's
node scripts/frame-logic.mjs [<checkout>]                    # the game's own per-frame work, no rendering
node scripts/frame-logic.mjs --mode tide [<checkout>]        # v206: Dead Tide's
```

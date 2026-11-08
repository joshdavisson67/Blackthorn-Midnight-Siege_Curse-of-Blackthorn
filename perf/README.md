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

## Re-running

```
node scripts/perf-measure.mjs --label vNNN --out perf/vNNN-siege.json
node scripts/perf-measure.mjs --page modes.html --out perf/vNNN-modes.json
node scripts/perf-measure.mjs --game <other checkout>/public/game --load-only
node scripts/golden-trace.mjs > after.json   # then cmp it against a trace taken on main
```

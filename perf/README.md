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

## Re-running

```
node scripts/perf-measure.mjs --label vNNN --out perf/vNNN-siege.json
node scripts/perf-measure.mjs --page modes.html --out perf/vNNN-modes.json
node scripts/perf-measure.mjs --game <other checkout>/public/game --load-only
```

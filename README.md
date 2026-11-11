# Blackthorn: Midnight Siege

An original, single-player, first-person zombie survival game for desktop browsers. All game assets are served locally; anyone with the public game link can play and submit a score without an account.

## Play

**Play in your browser:** https://joshdavisson67.github.io/Blackthorn-Midnight-Siege-v119-source/ (published automatically from `main` by `.github/workflows/pages.yml`). This copy's shared leaderboard is stored in Supabase; see below.

**Dead Tide (preview):** open it from the mode picker (`modes.html`, *Play the preview*) or add `tide.html` to that address: the island mapped out in grey-box shapes (its hills, coves, landmarks and trails), with the dead coming ashore, the threat rising every 20 kills and its tracker top left (version 212, with its stations: every weapon, the Soul Forge, armour, perks and ammunition, spread round the island), before its leaderboard. `modes.html` is the mode picker.


Enter the estate to capture the mouse. WASD moves, mouse looks, left click fires, right click aims, Shift sprints, Space jumps, R reloads, G throws a grenade, F toggles the flashlight, E buys or interacts, 1–6 switch owned guns and 7 draws the katana (version 205), M opens the estate map and pauses survival, and Escape releases the mouse and pauses. Click Resume to recapture the mouse. Play begins only after the browser confirms mouse lock; permission denial leaves the run safely paused with a retry control and browser permission guidance. Escape never attempts to recapture the cursor. Closing the map with Escape returns to pause; clicking Close or pressing M attempts capture before resuming.

Survive increasingly difficult waves. Hits and kills earn essence; headshots and completed waves give bonuses. Kill awards are 50 for walkers and either dog variant, 110 for brutes, or 75 for any headshot kill. The separate 10-point hit award and wave-clear bonuses are unchanged. Four permanent perks improve health, reload speed, damage, and movement. Buy the shotgun in the library and the SMG in the dining room, refill ammunition in the courtyard, and upgrade weapons at the violet forge under the rotunda bell. Zombie dogs join the mixed waves from wave one, typically one in five spawns. They trot on four articulated legs, wind up before biting, and move at 125% of the current wave’s base zombie speed. Their lower silhouette, pointed ears, snarling muzzle, collar and tail distinguish them from walkers. Dogs follow the same stair routes, support headshots and leg reactions, and collapse into dynamic ragdolls. Wave five introduces tougher brutes. From wave six, rare Ashfang hounds replace roughly one in twenty spawn slots (brutes retain priority). They move at 150% of the wave’s base zombie speed, compared with ordinary dogs at 125%. Charcoal hides, pale skull masks, swept horns, exposed ribs, dorsal spines, barbed tails and ice-blue eyes distinguish them. Both dog variants scale their movement speed with the same wave curve and late-wave cap as zombies, retaining their 1.25× and 1.5× speed multipliers. Ashfangs have twice the health of a standard dog at the same wave. Their paired-leg bounding gait, higher growl and cyan radar markers also set them apart. Occasional pickups use distinctive, camera-facing icons: a green ammo box refills ammunition, a gold ×2 doubles damage for 20 seconds, and a violet grenade grants infinite grenades for 12 seconds. Press G to throw during the grenade bonus, even with an empty reserve; throws do not consume your stored grenades. Active bonuses have matching HUD icons and countdowns. Collecting the same timed bonus refreshes its duration, and pausing freezes its timer. Personal bests are saved in the browser.

The mansion now spans 84 × 96 meters (8,064 m²), twelve times its original 28 × 24-meter footprint. Eleven new sections connect the original hall, library, and dining room to a ballroom, conservatory, portrait gallery, rotunda, music salon, archives, north gallery, infirmary, chapel, observatory, and servants’ quarters. Multiple paths connect the sections and bounded grounds. Supply crates and additional weapon stations support the distant wings. The M map shows room names, connections, supplies, perks, and the player's position on the current floor.

The grand hall staircase now has twenty visible treads and a continuous walking slope: use WASD to climb and descend without jumping. Its landing connects an explorable second floor across the 84-meter front wings. Bedrooms, a dressing room, nursery, studies, a reading room, private salon, family gallery, reliquary, and balcony galleries include furnishings, windows, warm lighting, and upper ammunition crates. The balcony rails are lowered to 0.72 meters, with matching posts and collision height. They still stop walking off the edge, but Space plus movement lets the existing jump clear the railing and drop into the first-floor grand hall. The stair banisters retain their existing protection. Height-aware collisions, ceiling clearance, jumping and gravity keep movement on the correct floor. Zombies can climb and descend the stairs to chase you; attacks and purchases cannot cross floors. Ragdolls and grenades land on upstairs surfaces, and solid floors block grenade blasts.

The estate’s stations now advertise their effects with physical exhibits: a caged heart, quick-change magazines and gears, a cartridge target, winged boots, open ammunition cases, recognizable shotgun/SMG racks, and a spectral anvil. Timed-bonus shrines sell Double Damage for 800 essence and Infinite Grenades for 900 on both floors. Upstairs now has all four perks, both purchasable weapons, two ammunition stations, both timed shrines, and a forge. Duplicate perk stations share ownership, so bonuses cannot stack. Dropped power-ups carry rotating 3D ammo-case, ×2 and grenade models beneath their matching icons. The map marks station types on each floor.

The upstairs cleanup raises clear ceiling height from 2.32 to 2.90 meters (25%). Ground-floor ornament is trimmed below the upstairs slab, doorways and headers are aligned, furniture is grouped around room edges, and flush ceiling lights replace low fittings. Fifteen lightly glazed windows have real wall openings facing the front courtyard and side grounds. Their collision boundaries keep players inside while preserving exterior sightlines.

Detailed oak and limestone textures use consistent physical scale, mipmapping, and anisotropic filtering. Subtle surface relief and rougher reflections limit shimmer. Coplanar floor decorations and doubled columns were corrected. The image is freshly cleared every frame and uses spatial multisampling; chromatic offsets, ring-shaped bloom samples, animated film noise, and depth-based screen halos were removed. Weapons render in their own depth-cleared pass with proper self-occlusion. The 15% display brightness boost and open, clear sights remain. High, Ultra, and Performance settings are available before starting.

Zombies now have five distinct estate-themed designs with modeled faces, layered clothing, curved fingers and articulated jaws. Asymmetric strides, limps, smooth turns, hit reactions and alternating wind-up attacks give them more varied motion. Impact-driven ragdolls react to bullet direction and hit location, buckle from leg hits, tumble onto either shoulder, twist or fly from grenades. Bodies collide with floors and walls, settle, and are cleaned up with a 14-corpse limit.

Combat now uses ten prebuilt enemy templates with shared geometry/materials and independent animated skeletons. Shaders and enemy buffers are prepared during loading. Pickups and explosions use a fixed four-light pool; the flashlight switches intensity without changing the lighting shader configuration. Allocation-free collision queries and ragdoll constraint math, cached navigation adjacency, staggered line-of-sight checks, and unchanged-HUD suppression reduce CPU spikes. The FPS counter uses real elapsed time, including stalls.

The expansion uses spatial collision lookup, reusable navigation buffers, local enemy spawn selection, spatial mesh batches, and eight pooled lights for the new wings. These keep cost bounded as the estate grows; real browser frame rates remain unmeasured.

## Dead Tide's stations (version 212)

Dead Tide step 5: the island's stations, on the pads v210 reserved and a few more. They use the mansion's own station models, prices and effects (`stations.mjs`, `station-models.mjs`), so nothing is rebalanced. The mansion is unchanged; no file it loads changed.

- **Where everything is.** Each station faces Radio Hill's summit. The armour, perks and ammunition are spread out, so kitting out means crossing the island.

  | Landmark | Stations |
  |---|---|
  | Lookout Compound (summit) | Bushmaster .450 (2,500), Tsuru katana, ammunition (the tent's crate) |
  | Bunker B-01 (north-east) | Aegis body armour (2,500), then the Nano Shield's ranks |
  | Jungle Ruin (north-west) | Raven SMG (1,500), Quickhands (1,500) |
  | North Beach (north) | Nightstride (1,500), ammunition |
  | Shipwreck Cove (west) | M12 shotgun (1,200), ammunition |
  | Coastal Camp (south-west) | M4 (4,500), Ironheart (2,500) |
  | South Dock (south) | Warden LMG (5,000), ammunition |
  | East Cove (south-east) | the Glock 21's bench (its ranks, then pistol ammunition), Deadeye (2,000) |
  | Soul Forge (east) | the Soul Forge (5,000 / 10,000 / 15,000), ammunition |

- **Ammunition** costs 350 at all five places. The radio tent's crate, free for testing in v211, is now one of them.
- **No shrines.** Dead Tide sells neither the timed double damage nor endless grenades. Kill drops are unchanged, as before.
- **The M4 and the Warden LMG** stand on racks like the other guns. The mansion sells them from its own kinds of station (the shed's bench, the cellar's exhibit, the Warden's frenzy), so here each is an SMG rack with its own gun on it, built in `tide.mjs` without changing the shared model. Once owned, each rack sells its weapon's ranks, then hands the gun back.
- **The mansion's prompt and E (B, USE):** walk up to a station, and the nearest one within reach shows its prompt and sells. Nothing pauses.
- **New Run** starts every station afresh: weapons, perks, the armour's tier and the Forge's rank.
- **The stations block** like the island's other props. You cannot stand on one, and they are placed before the routes are built, so the dead walk round them.
- **The new pads** (nine more: the armour, four perks and four ammunition stations) were each found on open, near-level ground in their landmark, off the trails, clear of every spawn point and reachable from most sides. Ironheart sits clear of the camp's tents. The wreck-to-camp and hill-to-dock trails now end beside their racks rather than at them.
- **`signage.mjs`**, the plaques' lettering, is now loaded by Dead Tide too. It is generic, not part of the mansion.
- **Drawn in few calls.** The mansion's station models are many small parts in a few dozen materials; spread over open ground, the first build drew the stations in some two hundred calls from the title view and doubled the island's textures. A new Dead Tide-only module, `tide-palette.mjs`, fixes that without touching the shared models:
  - the still untextured parts have their colour, finish (roughness, metalness) and glow written into their vertices and share one material; the textured gun parts keep the held guns' materials (and so their shaders); both are merged, indexed, in 48 m cells;
  - the plaques' lettering is packed into one atlas texture (24 textures become one);
  - the armour and each Nano Shield model are merged within themselves, so they still show and hide whole;
  - the Forge's soul stone (an octahedron, already faceted) drops a flat-shading flag that needed its own shader;
  - its seams draw with the plain unlit material rather than a line material of their own (one shader fewer);
  - bullets, grenades and blasts stop at each station's collider box, not at its merged triangles;
  - the stations' matrices are frozen once built, except the Forge's hovering stone.
  The screenshots before and after the merge match.
- **Palms** keep 2.2 m clear of what must stay open, whatever their spacing. With seventeen pads, the wider rule left too few places; the island keeps about the same number of palms (46).
- **Proof:**
  - `tests/dead-tide.mjs`:
    - **the pads:** seventeen, by kind; the perks one to a landmark, one in each quarter round Radio Hill; ammunition at four landmarks, 25 m or more apart; the armour apart from both; every station facing the summit;
    - **in play:**
      - a station on every pad, and none of the shrines;
      - every prompt shows;
      - each sells at the mansion's price: the six weapons; the M4's and the Warden's ranks; each perk once (Ironheart doubles health); the armour and every Nano Shield rank; the Forge; ammunition at all five places;
      - nothing is sold short of the price;
      - New Run starts the stations afresh;
      - with the stations standing, there are no pockets for walkers or brutes, the beach loop and every trail are open, and no spawn point is within 6 m of a station.
      - the stations draw as 70 meshes or fewer, the palette shader's three patches find their places in this three.js, and the hit boxes stand in for the stations' parts.
  - **Dead Tide's golden trace:** a `stations` scenario replaces v210's `landmarks` and walks up to every station in turn, buying each. Two runs are byte-identical.
- **Looked at, in headless screenshots only:** every weapon rack, the armour, the Forge, a perk and an ammunition station. Before and after the merging, they match.
- **Release tiers:**
  - **Mansion: quick.** Nothing it loads changed.
  - **Dead Tide: full.** The stations are new content, and they cost:
    - load time: +2.7 s to playable under software rendering (world +0.6 s, shaders +2.1 s);
    - rendering: title draw calls 66 → 143 and 134K triangles (+93K, most of them the racks' guns); 8 more shader programs, 5 more textures and +9 MB of heap;
    - frame logic: +0.054 ms.
    The first build drew 1,653 calls in the title view and doubled frame logic; the merging above brought it to this. Building the stations behind the title, as the dead are, would take most of the load cost out of the time to playable. Details in `perf/README.md`.
  - **Mode picker: standard,** no differences.
- **Not verified:**
  - how the economy feels in play: whether the essence from kills buys the next thing at a good pace, and whether the spread is too far to run under pressure;
  - real-browser frame rates.
- **Next:** the run summary and Dead Tide's own leaderboard (spec 8.5 and 12).

## Bolder ground, B-01 turned into its ridge, and a test ammo crate (version 211)

Three changes to Dead Tide's island, from playing v210. The mansion is unchanged.

- **More character in the ground** (`ISLAND.mounds`):
  - **The hills stand taller:** the bunker's ridge 6.6 → 8.6 m, the ruin's knoll 5.6 → 6.7 m, the camp's bluff 5.0 → 6.3 m, the cove's headland 4.6 → 5.5 m (heights above the sea).
  - **New high ground:** a knob on the ridge's south-east end, a crag between the ridge and North Beach (4.4 m), the east downs behind the east shore (4.2 m), and dunes behind Shipwreck Cove.
  - **New low ground:** the wash is now a ravine below the hill's south-west foot, about 3 m deep between the camp's bluff and a new bank along its east side; a shallow gully runs north off Radio Hill; and the east hollow is a deeper, boggy bowl.
  - **The ground's kinds now show in its colour:** a dark jungle floor round the ruin, dry grass on the south and east lowland, mud in the hollows and gullies, and stone on the rocky hills (the ridge, its knob, the crag, the headland). This is vertex colour only, so it adds no draw calls and no shader programs.
  - Every slope stays under 40.4°, as before, so everyone can walk everywhere.
- **Bunker B-01 is turned round** to come out of its ridge. Its door now faces the north-east reef, away from Radio Hill. The portal runs 6 m into the ridge, so its roof sinks into the slope behind, and the wing walls hold back the cut. It blocks only as far back as it shows. Its trail now runs round the ridge's north-west end, and its interior spawn zone sits on that approach.
- **A test ammo crate** (olive, with a yellow band) is inside the radio tent, in its north-east corner, clear of the walk through.
  - It is free and works as often as you like, so the threat's later ranks can be reached and tried.
  - Press E, B on a controller, or the USE button on touch. It restocks every gun you carry, as the mansion's ammo stations do (reserves full, including what the magazine lacks), and adds a grenade.
  - The prompt shows within 2 m of it.
  - It is for testing; the real stations come in step 5.
- **Proof:**
  - `tests/dead-tide.mjs`:
    - the four main hills stand over 5 m, and the crag and the downs are hills of their own;
    - the wash is a ravine at least 1.7 m deep, measured across it;
    - no walkable ground is steeper than 40.4°;
    - B-01's door looks north-east, away from Radio Hill, with the ridge over its roof behind it;
    - the crate is inside the tent, its prompt shows beside it, E restocks the pistol in full and adds a grenade, and nothing happens out of reach.
  - All the v210 map checks still pass on the new ground: landmarks, pads, no climbable props, routes with no pockets for walkers or brutes, the beach loop, the hill's approaches, the trails, and all 72 spawn points.
  - **Dead Tide's golden trace** is re-baselined, since the ground changed. Two runs are byte-identical.
- **Release tiers:**
  - **Mansion: quick.** Nothing it loads changed.
  - **Dead Tide: full.** +5 KB and two draw calls where the crate is in view. Building the world takes +73 ms (within two standard errors); memory, shader programs and frame logic are unchanged.
  - **Mode picker: quick.** Nothing it loads changed.

  Numbers in `perf/README.md`.
- **Looked at, in headless screenshots only:** the bunker from its front and side, the crate, the ravine, the downs, the crag and the overviews.
- **Not verified:** how any of it looks on a real GPU, or feels to play.

## The island's map (version 210)

Before the stations go in, the island gets its layout: the design spec's landmarks (section 3), its movement network (section 2), ground with some character, and the spawn network moved onto it. Everything new is a grey-box shape; the art comes later. The mansion is unchanged.

- **The ground** (`ISLAND.mounds` and `ISLAND.coast.coves` in `island.mjs`):
  - **Two coves** are bitten out of the coast: Shipwreck Cove on the west and East Cove on the south-east.
  - **Four hills of their own** under Radio Hill (14.2 m): the bunker's ridge in the north-east (6.6 m), the ruin's knoll in the north-west (5.6 m), the camp's bluff in the south-west (5.0 m) and the headland between East Cove and the dock (4.6 m).
  - **Smaller shapes:** a spur off Radio Hill toward the ruin, a low rise for the Forge, a dune behind North Beach, a dry gully (the wash) down the hill's south-west flank, a hollow behind the south-east shore, and a slow roll under the lowland.
  - Radio Hill's flat top is 9 m in radius (8 before), to hold the compound.
  - All of it is walkable from every side by everyone. The steepest ground is under 40°.
- **The landmarks:**

  | Landmark | Where | What stands there |
  |---|---|---|
  | Lookout Compound | Radio Hill's summit | the radio tent, the tower, a dish, crates, barrels, a length of fence |
  | Bunker B-01 | north-east, dug into the ridge | a concrete portal with a sealed steel door, wing walls, warning lamps |
  | Jungle Ruin | north-west, on its knoll | two lengths of broken wall, an arch to walk through, a column stub, a floor slab |
  | Shipwreck Cove | west shore | the wreck (moved from the south-east beach) and what washed out of her |
  | Coastal Camp | south-west, on its bluff | three ridge tents, a fire ring, supplies, a lantern |
  | South Dock | south shore | a broken dock, its first span gone; stumps on the sand, supplies ashore |
  | East Cove | south-east | an open equipment shelter and its stores |
  | Soul Forge | east of the hill, by its foot | a stone dais in a ring of four standing stones |
  | North Beach | north shore | open sand, driftwood, the dune behind it |

  - **The radio tent replaces the radio shack:** an open canopy on six poles with the radio desk under it. It has no walls, so it hides no one, and a brute walks under it.
  - **The bunker is sealed** and reserved for later: nothing opens and nothing spawns in or near it.
  - **The dock cannot be walked on.** Its surviving deck stands in the surf and blocks like a wall. A deck you could stand on would be out of the dead's reach.
  - **Nothing can be climbed onto.** Every prop that blocks reaches at least 1.05 m above the ground round it, and every slab you can stand on is a step. A perch would be a safe spot.
  - **No new lights and no new shader programs:** the lamps and runes glow by their material only.
- **Station pads** (`islandSites().stations`): eight pale slabs, one for every weapon and the Forge, where the spec's section 4.1 puts them. Step 5 builds the stations on them.
  - Bushmaster .450 and the katana at the Lookout Compound;
  - Raven SMG at the Jungle Ruin;
  - shotgun at Shipwreck Cove;
  - M4 at the Coastal Camp;
  - Warden LMG at the South Dock's landward end;
  - Glock 21 at East Cove;
  - the Soul Forge in its clearing.
  - Perks, ammunition, armour and the shrines get their pads with the stations themselves.
- **Trails:** nine, worn to dirt: the spec's seven cross-routes and two that close its loops (Forge to East Cove, ruin to wreck). The beach is the perimeter loop. Palms and rocks keep off the trails, the pads, the beach and Radio Hill's upper slopes.
- **Plants and rocks:** palms thick round the ruin and behind Shipwreck Cove; boulders on the ridge and the headland; reefs of rock in the deep water off the north-east and north-west shores; and low brush (new) where the dead rise inland. Brush blocks nothing.
- **The spawn network on this map** (`SHORE` in `island.mjs`):
  - **The eight major zones** carry the spec's names: North Beach, North-East Reef, East Shore, South-East Cove, South Dock Shore, South-West Beach, Shipwreck Cove, North-West Reef.
  - The dock's zone stands clear of the dock, and the wreck's has points on both sides of her.
  - **The 14 minor points** are named for the shore's features.
  - **The six interior zones** are where the spec puts them: by the ruin, north below the hill, by the bunker's approach, beyond the Forge, south by the hill's foot, and in the wash between the camp and the hill.
  - **A new rule:** no one rises within 6 m of a station's pad (`SPAWN_RULES.stationClear`).
  - The director itself is unchanged.
- **Place names** in the HUD follow the landmarks.
- **Tools** (new):
  - `scripts/island-map.mjs` draws a plan of the island as a PNG: ground, colliders, palms, rocks, brush, trails, pads and (with `--spawns`) the spawn network.
  - `scripts/tide-shots.mjs` photographs the game itself from named viewpoints in headless Chromium.
- **Proof:**
  - `tests/dead-tide.mjs`, the finished map:
    - each landmark is in its part of the island, and the HUD names it;
    - the coves, hills and gully are real;
    - the pads are on open, near-level ground, each reachable on five sides or more;
    - no prop can be climbed, and every slab is a step;
    - every open cell is routed to the summit for walkers and for brutes (no pockets);
    - the beach is at least 9.5 m wide all the way round for a brute;
    - all 12 bearings give a broad, clear climb up Radio Hill (the spec asks for six);
    - the nine trails are clear along their length;
    - all 72 spawn points in 28 named locations are clear, routed and 6 m or more from every pad.
  - In play: you walk in under the tent and out the far side, a jump clears its eaves, and its desk stops you.
  - The tests from before still pass on the new ground: every kind climbs Radio Hill, The Apocalypse fills to 45, and inland arrivals keep their rules.
  - **Dead Tide's golden trace** is re-baselined, since the island itself changed. A new `landmarks` scenario stands on each pad in turn. Two runs of this build are byte-identical.
- **Release tiers:**
  - **Mansion: quick.** Nothing it loads changed.
  - **Dead Tide: full.** The map's cost is +24 KB, +86 ms building the world (the time to playable is within noise), +8 to +17 draw calls a view, +0.8 MB of heap, and no new shader programs. Frame logic is level.
  - **Mode picker: standard, no differences.**

  Numbers in `perf/README.md`.
- **Looked at, in headless screenshots only:** the overviews, the summit and each landmark. The shapes read as intended there.
- **Not verified:**
  - how any of it looks on a real GPU, or feels to walk and fight on;
  - whether the hills are bold enough;
  - real-browser frame rates.
- **Not done yet:** B-01's lettering, ambient sound and all art (the polish step); the spec's concealment by foliage is brush you can see over.
- **Next (step 5):** stations on the pads, the leaderboard and the run summary.

## The spawn network and the threat tracker (version 209)

Dead Tide step 3b finishes the threat director: where the dead come from now changes with the threat, and a tracker top left shows it. Still no waves, banners or pauses. The mansion is unchanged.

- **Only part of the island's 28 spawn locations is live at once** (spec 5.4; `SPAWN_RULES` in `tide-threat.mjs`):

  | Rank | Major shoreline zones open | Minor points (share of arrivals) | Interior zones | Most at once from one zone |
  |---|---|---|---|---|
  | The Unease | 3, then 4 | 12% | shut | 1 |
  | The Hunt | 4 rising to 6 | 22% | shut | 2 |
  | The Swarm | 6 rising to 7 | 32% | 2 open, 10% | 2 |
  | The Apocalypse | 7, all 8 from level 28 | 40% | 4 open, 18% | 3 |

  - The number of open zones never falls as the level rises. The Swarm opens at 6 of the spec's 5–7, so that no zone closes when The Hunt ends at 6.
  - **Rotation:** every 40 s one open major zone closes and a closed one opens; the interior's open zones turn over every 30 s.
  - **Minor points** send one, and sometimes a second from the same point once the first has cleared it (25% of the time in The Unease, rising to 50%).
  - **Interior zones** never open before The Swarm. An inland arrival is never within 28 m of you, nor anywhere in a 160° cone of your view at any distance. Every interior point is on land with a route to the summit.
  - **The shore's own rules are unchanged:** never within 18 m, never in view within 40 m, only where a route reaches you, and the cap of 45.
- **How a point is chosen:** each safe point is weighed, then one is drawn at random by weight.
  - **Your heading:** while you move (faster than 0.8 m/s), points behind and beside you are favoured. Points close ahead are rare, and points far ahead (beyond 40 m) are allowed but less likely.
  - **Spread:** sides of you that already have more dead within 40 m count for less.
  - **Variety:** a point used in the last 6 s, or a zone used in the last 3 s, counts for less.
  - **Routes:** shorter routes to you count for more.
  - A new zone is chosen the same way, by where you are heading.
- **Batches:** from The Hunt, an arrival can bring up to 2 (3 in The Apocalypse) from one zone, at its different points. A batch is never larger than the shore is short, so after a cull the dead return over several arrivals, 1.4 s apart. There is no catch-up burst.
- **The first brute no longer stalls a frame.** The brutes' wider routes take about 0.1 s to build. Since v206 they were built when the first brute was rolled (from level 6 in v208), a stall of 72–132 ms in headless measurements. They are now built behind the title screen, right after the dead's bodies (Play finishes them at once, as it does the bodies). They are kept current whenever the level's mix has brutes; a rebuild takes about 0.5 ms.
- **No change while the shore is held:** everything random is drawn only when someone comes ashore. So a held shore, as in the island's own trace scenarios, draws nothing from the game's generator.
- **The threat tracker** sits top left, in the mansion's wave counter's place and style:
  - it shows the threat level, the rank, the kills and the progress to the next level ("8 / 20"), with a 20-segment bar in a restrained red;
  - the rank's name warms from the island's teal through amber to red as the ranks rise;
  - each new level pulses the number and plays a quiet, low pulse;
  - a new rank also glows its name, and its pulse is deeper;
  - a jump of several levels at once (a big blast) plays a single cue;
  - nothing is centred, and nothing pauses;
  - on touch screens it shows the level, rank and bar only, since the kills are already top right;
  - it replaces the old "grey-box preview, no dead yet" note.
- **Proof:**
  - `tests/tide-threat.mjs`: the zone counts at every rank boundary, never falling, within the spec's ranges; the minor, interior and batch numbers by rank.
  - `tests/dead-tide.mjs`, the director on a stand-in spawner:
    - open zones by rank;
    - a zone swapped every 40 s;
    - the minor points more often each rank, and the interior only from The Swarm;
    - every arrival keeping its safety rules, with a moving, turning player;
    - batches of 1, 2 and 3 from one zone at different points, never more than the shore is short;
    - arrivals around a player circling at 4 m/s mostly behind them;
    - minor points sending two now and then;
    - a held shore drawing nothing.
  - `tests/dead-tide.mjs`, in play:
    - the tracker's readings, pulse, glow and cues, with no banner and no pause;
    - New Run starting it again quietly;
    - inland arrivals at The Apocalypse, never within 28 m, on land and routed to you.
  - **The director's own cost** (`scripts/tide-director-bench.mjs`, new): 120 s at The Apocalypse with the island culled every 5 s.
    - main: 1.9 ms an arrival, with a worst frame of 78–95 ms (the first brute's routes);
    - v209: 0.61 ms an arrival, with a worst frame of 4.7–6.5 ms (a batch of three), and none over 16 ms.
  - **Dead Tide's golden trace:**
    - The island's seven scenarios match v208 in every gameplay channel. Only the page differs, since the tracker is on it.
    - `fight` and `summit` change, as they should, since the dead now come from the open zones.
    - The escalation scenarios' `threat` channel also records the open zones, the interior and where arrivals came from.
- **Not verified:**
  - how the tracker looks and reads on real screens and phones;
  - how the cue sounds over a fight;
  - how the rotation and weighting feel in play;
  - the opening pace (only three major zones are open at the start, so first contact may come from fewer directions);
  - real-browser frame rates.
- **Release tiers:**
  - **Mansion: quick.** Nothing it loads changed.
  - **Dead Tide: full, no regression.** +15 KB of code, no new files; load, memory, shader programs and frame logic within noise. The director's worst frame drops from 78–95 ms to 6.5 ms.
  - **Mode picker: standard, no differences.**

  Numbers in `perf/README.md`.
- **Next (step 4):** stations, the leaderboard and the run summary.

## The threat director's core (version 208)

Dead Tide step 3a: the steady eight walkers of v206's stand-in give way to the design spec's threat director (section 6). There are still no waves anywhere: nothing waits for the island to be cleared, and nothing pauses when the threat rises. The mansion is unchanged.

- **The threat level** is `floor(kills / 20) + 1`, with no maximum. Every kill counts, including those a lurker's burst makes.
- **The ranks:** The Unease (levels 1–5, 0–99 kills), The Hunt (6–13, 100–259), The Swarm (14–23, 260–459) and The Apocalypse (24 on, 460 on).
- **What the level sets** (`tide-threat.mjs`, every number in `THREAT_RULES`):
  - **How many dead the shore keeps on the island:** `min(45, 8 + 2 × (level − 1))`, so 8 at the start, 18 at The Hunt, 34 at The Swarm and 45 from level 20. The hard cap of 45 holds whatever the target.
  - **Their health:** +4% of the base a level for the first 25 levels (2× at level 26), then +1.5% a level, never above 4× (reached at level 160). The increases are added, not compounded, as agreed.
  - **Their speed:** +2% of the base a level, never more than +50% (reached at level 26).
  - **Their damage:** unchanged (spec 6.6), 19.5 a strike times each kind's own multiple.
  - **The base** is the mansion's wave 1 (93 health, 1.145 speed, 19.5 damage), so level 1 plays exactly as v207. Each kind keeps its own multiples of the base (dogs, Ashfangs, brutes, ferals and lurkers as in the mansion), so the scales lift every kind alike and keep them apart.
- **The mix** (agreed for now; tune later), the share of each kind at these levels, stepped evenly between them:

  | Level | Walkers | Dogs | Ferals | Brutes | Ashfangs | Lurkers |
  |---|---|---|---|---|---|---|
  | 1–2 | 100% | – | – | – | – | – |
  | 5 | 90% | 10% | – | – | – | – |
  | 13 | 62% | 18% | 12% | 6% | 2% | – |
  | 23 | 45% | 16% | 15% | 12% | 6% | 6% |
  | 24 on | 42% | 15% | 16% | 13% | 7% | 7% |

  Enraged dead join through the shared combat's blood rage, as in v206.
- **Each arrival rises at the strength of the level when it comes ashore.** The dead already on the island keep the strength they rose with.
- **Arrivals keep the stand-in's rules:** one at a time out of the surf, 1.4 s apart, after 4 s of grace; never within 18 m of you or where you are looking within 40 m; only where a route reaches you. With no safe point the shore waits and tries again.
  - A kind with nowhere safe to rise keeps its turn, and a walker comes ashore in its place, so the shore never stalls and the mix is kept. (A brute's wider routes do not reach into the radio shack, which is to become an open tent later.)
  - The kind is rolled from the game's own generator only when the level's mix has more than walkers, so the opening draws nothing new from it.
- **Routes:** the brutes' wider routes are rebuilt only while a brute is on the island or next to come ashore.
- **Proof:**
  - `tests/tide-threat.mjs` (new): every formula at and around each threshold (kills 19/20/21, 99/100, 259/260, 459/460; levels 25/26, 159/160), the spec's own tables, the mix rows, shares that always add to 1, and rolls that pick each kind in its share.
  - `tests/dead-tide.mjs`:
    - the director on its own: walkers alone and no draw at levels 1–2, a roll per arrival from level 3, a brute that cannot rise waits while a walker comes, never more than 45;
    - in play:
      - the 100th kill raises the level, the rank and the target, and play goes on;
      - arrivals at level 14 rise at its strength, kind by kind, while one risen at level 1 keeps its 93 health;
      - The Apocalypse sends all six kinds and fills to exactly 45;
      - every kind (walker, dog, Ashfang, feral, lurker, brute) climbs Radio Hill from its southern foot to you on the summit, the brute on its own wider routes;
      - New Run starts again at level 1.
  - **Dead Tide's golden trace:** all nine existing scenarios (the island's seven and both fights) are byte-identical to v207's. Three escalation scenarios are new, run last, with a `threat` channel: `threshold` (from 95 kills across into The Hunt), `swarm` (level 14) and `apocalypse` (level 24). `scripts/golden-compare.mjs` compares that channel and lists scenarios new in the second trace.
  - **The 45-enemy fight** (`perf-measure.mjs --page tide.html` and `frame-logic.mjs --mode tide-fight`) is now The Apocalypse's full mix: 19 walkers, 7 dogs, 7 ferals, 6 brutes, 3 Ashfangs and 3 lurkers. In frame logic a lurker that bursts is replaced where it stood, so the fight stays at 45 and includes the bursts. Results are in `perf/README.md`.
- **Release tiers:** the mansion quick (nothing it loads changed); Dead Tide full, with no regression (one new 5 KB file; load, memory, shader programs and frame logic within noise; the nine existing trace scenarios byte-identical); the mode picker standard, with no differences. Numbers in `perf/README.md`.
- **The mode picker** now says the threat rises every 20 kills, with the threat tracker, stations and leaderboard still to come.
- **Not verified:**
  - how the escalation feels, including the opening pace (first contact about 35–40 s, unchanged);
  - how dogs, Ashfangs, ferals, brutes and lurkers look on the island under its moonlight;
  - real-browser frame rates with the full mix. Only headless measurements were made.
- **Next (step 3b):** rotating major shoreline zones by rank, minor points used more as ranks rise, interior zones from The Swarm, weighted spawn choice, the top-left threat tracker and the escalation sound.

## The picker opens Dead Tide, and the dead build behind its title (version 207)

A small release before the threat director (step 3).

- **The mode picker opens Dead Tide's preview** (`modes.html`). Its half of the picker is now a link to `tide.html` with a **Play the preview** button in the island's colours, and a line saying what is still to come. Click, Enter or the gamepad's A button launches whichever half is chosen; the curtain reads *The tide rises* for the island. It is still marked in development; the picker no longer turns it away.
- **The dead build behind Dead Tide's title screen, not while loading.** In v206, building the dead's bodies and compiling their shaders added about 6 s to time to playable (headless).
  - **At load:** only the island, the guns, the effects and the power-ups are built and compiled.
  - **On the title screen:** the dead build one step a frame (the surfaces, then each of the 11 bodies, the rage colours, the injuries and the faces). Their shaders then compile in a scene of their own, lit by the island's lights and never drawn, so nothing appears in front of the title camera.
  - **Pressing Play first** finishes the build at once, and the shore sends no one until the shaders are ready. In practice that is well inside the 4-second grace before the first walker.
  - **What makes it possible:** `enemy-assets.mjs` gained `buildEnemyAssets`, the same build as a series of steps. `createEnemyAssets` runs every step at once, so the mansion builds exactly what it did; its golden trace is byte-identical to main's.
- **Proof:**
  - Dead Tide's golden trace matches v206 in every gameplay channel, both fights included; only the renderer's log moves, since the dead's shaders now compile later.
  - New tests: the dead are not built while loading; they build a body a frame behind the title with Play untouched; their shaders compile once, off to the side, and nothing of them enters the world; the shore waits while they are not ready.
- **Measuring:** `perf-measure.mjs --page tide.html` now records when the dead are ready behind an untouched title screen (`deadReadyMs`). The fixed views and the fight are measured after Play has finished the build, as in play. Results are in `perf/README.md`.
- **Not verified:** how the title screen feels while the dead build in a real browser (each step is one body; the slowest steps take a few hundred milliseconds headless), and the picker's new button on real devices.

## The dead come ashore (version 206)

This is Dead Tide step 2, slice 3. The dead now rise out of the surf and hunt you across the island, using the mansion's own enemy AI, spawner, crowd and combat. The mansion plays exactly as before.

- **Play it:** `tide.html` (the mode picker still marks Dead Tide *In development*).
- **How a run goes, for now:** a stand-in until the threat director (step 3) arrives.
  - **The opening:** no dead for the first 4 seconds. Then walkers rise out of the shallows one at a time, 1.4 s apart, until **eight** are alive, the plan's threat-level-1 population. Each one killed is replaced the same way.
  - **Their strength:** the mansion's wave 1 (93 health, its walking pace, 19.5 damage a strike), with their usual faces, builds and injuries. Walkers only for now; the threat director brings in the other kinds.
  - **Where they come from:** the plan's spawn network, laid out on the island in `island.mjs` (`shoreSpawns`).
    - **8 major shoreline zones**, each five points along a stretch of waterline;
    - **14 minor shoreline points** between them;
    - **6 interior zones**, placed but switched off until the threat director opens them at The Swarm.
    - The major zones are named by compass bearing (North Beach, North-East Reef, …) until the landmarks they are named for are built.
  - **Safe arrivals:** never within 18 m of you, never where you are looking within 40 m, never inside another body, and only where a route reaches you. With no safe point the shore waits half a second and tries again.
  - **The cap:** never more than **45** living dead, whatever the target.
  - **Rising from the sea:** each walker climbs up out of the water over 1.6 s, then wades ashore (slower in the water, as you are).
  - **They hunt as in the mansion:** routes, flanking, crowding into a ring, strikes. They climb Radio Hill after you and follow you into the shack through its door. Bodies never overlap: you cannot walk through them, nor they through you.
  - **Kills** pay 50 essence (75 for a headshot), and the dead drop the mansion's power-ups (ammo, Double Damage, infinite grenades), on the ground where they fall.
  - **Dying** to them ends the run on the existing "The tide takes you." screen. The run summary and leaderboard come in step 4.
- **The island as one floor** (`tide-dead.mjs`): the shared enemy code was written for the mansion's flat floors, where an enemy on your floor is within half a metre of your height. On the island the ground rises 14 m, so the dead keep their height relative to the ground under them, and so does the player as they see it. The island's view of itself turns those heights back into the world's for collision, footing and drawing.
- **Routes** (`island.mjs`, `buildRoutes`): a grid of 0.5 m cells over the land and the wadeable shallows (fine enough for the shack's door), with a second, wider grid for brutes built only when first needed. It is rebuilt only when you reach another cell, and only while there are dead to lead. Building it takes about 0.1 s while loading; a rebuild takes about 3.5 ms.
- **Changed in the shared modules**, so the mansion plays identically:
  - `enemy-ai.mjs`, `enemy-spawn.mjs`, `enemy-combat.mjs`: where an enemy stands, its height in the world, and where bodies fall now come from the map when it provides them (`standAt`, `corpseBlocked`, `corpseFloor`). The mansion provides none, so it keeps its own rules.
  - `weapon-runtime.mjs`: the katana measures your height on the enemies' scale when the map provides it (`floorOf`). So a slash reaches walkers below you on a slope, which the v205 notes flagged.
  - `feral.mjs` now holds only the feral's numbers. The shared AI reads them there, and the file also held the mansion's wave mix, which needs the mansion's `core.mjs`, so Dead Tide would have loaded the mansion's layout tables. The wave mix (`chooseEnemyKind`, unchanged) moved to `curse.mjs`, which already loads `core.mjs`, so the mansion loads the same 105 files as before.
  - **The proof:** the mansion's golden trace is byte-identical to main's in all 26 scenarios.
- **Dead Tide's golden trace** now has two fights:
  - **fight:** holding the south beach, firing at the nearest walker, then holding fire as they arrive;
  - **summit:** on Radio Hill with the gun lowered, as they climb the slopes, then in the shack as they follow you in.
  - Its seven island scenarios hold the shore and match v205 in every gameplay channel.
- **The test harness** now seeds `Math.random` rather than holding it at 0.25. The constant gave every three.js object the same identifier, so the batcher merged unrelated enemy parts and the dead could not load in tests.
- **Tested** (`tests/dead-tide.mjs`):
  - none arrive in the first 4 s; each rises out of the shallows from below the water, more than 18 m away and out of sight, and stands on the ground once risen;
  - the shore keeps eight walkers at wave-1 strength, never more, all routed to you;
  - pressed for 500, it fills to exactly 45 and stops;
  - New Run clears the dead and their drops;
  - shots and the katana land downhill on Radio Hill's slopes, and kills count and pay;
  - you cannot walk through the dead;
  - power-ups drop on the hillside where a walker fell and are picked up.
- **Performance:** see `perf/README.md`. The 45-enemy stress test is new in `scripts/perf-measure.mjs --page tide.html` and `scripts/frame-logic.mjs --mode tide-fight`.
- **Not verified:**
  - how the dead look under the island's moonlight (the mansion's lighting hooks are not on the island, so their materials use three.js's standard lighting);
  - how the fight feels;
  - real-browser frame rates. Only headless measurements were made.
- **Next:** the threat director (step 3): threat levels every 20 kills, ranks, the growing population, rotating zones and the enemy mix.

## Dead Tide's golden trace (tooling; the game is unchanged at version 205)

Before the dead come ashore (v206), Dead Tide gets the same safety net the mansion has: a golden trace of everything the island already does, so adding enemies can be checked channel by channel against what was there before.

- **`scripts/tide-golden-trace.mjs`** plays seven fixed, seeded scenarios through `tests/tide-harness.mjs`, with the clock fixed and randomness seeded:
  - **walk:** walking, strafing, sprinting, jumping and looking about on the south beach;
  - **hill:** sprinting up Radio Hill to the summit, into the shack by its door, a jump under its roof and against its back wall;
  - **wade:** out into the shallows to the wading limit;
  - **arms:** every gun drawn, aimed, fired, reloaded and sprinted with; a grenade thrown and burst; the flashlight off and on;
  - **katana:** drawn with 7, its three slashes, then held to keep slashing;
  - **death:** a safe grenade, a blast at your feet, the tide taking you and New Run;
  - **session:** pause, Settings, the controls card, Resume, back to the title and in again.
- **What it records**, every half second: the player, every enemy and pickup (none yet), the run, the session, the weapons, the screen (every renderer call), the view in hand, the page and the sound, plus every enemy's birth and the renderer's log while loading.
- **Comparing builds:** `BLACKTHORN_GAME_DIR=<checkout>/public/game` plays another build's game with this harness, so v205 (which has no script of its own) can be traced too. `scripts/golden-compare.mjs` now compares Dead Tide traces as well.
- **In every release:** `scripts/release-tier.mjs` runs it in Dead Tide's standard tier beside the mansion's trace.
- **Checked:**
  - two runs of the same build are byte-identical, and so are main's v205 and this branch, since the game is unchanged;
  - it catches a change: making the sea 5 cm shallower to wade changes the wade scenario's player, run and view, and nothing else;
  - every scenario reaches what it tests (the coverage line on stderr).
- **The harness** (`tests/tide-harness.mjs`) now also exposes the enemies, pickups, the weapon recoil, the muzzle flash, the grenade in hand and the held keys, and can reseed the game's own generator.
- **Tiers for this change:** quick for the mansion, Dead Tide and the mode picker, since no file the game loads changed.
- **Next (v206):** the dead come ashore. Its build adds a fight scenario here and to Dead Tide's frame logic, and must keep these seven scenarios byte-identical.

## Release checks by tier (tooling; the game is unchanged at version 205)

Each release is now measured as much as its change needs, decided for the mansion, Dead Tide and the mode picker separately. The rule is the same for both modes: any measurable regression is corrected before release.

- **`scripts/release-tier.mjs`** compares the branch with main. A new version number alone is not a change. It follows each mode's page through everything it loads, so it knows which mode loads each changed file (a shared module counts for both).
  - **Quick:** nothing a mode loads changed, so it needs no measuring.
  - **Standard:** something it loads changed. One measured load of each build side by side, a short frame-logic series, and the mansion's golden trace. No difference is the proof.
  - **Full:** the standard comparison found a difference, so that mode gets the whole protocol (two full measured pairs, 40 balanced load-phase runs, 24 frame-logic pairs).
- **Dead Tide's measuring tools**, to match the mansion's:
  - `tests/tide-harness.mjs`: Dead Tide's test harness, moved out of its test so scripts can play it;
  - `scripts/frame-logic.mjs --mode tide`: its per-frame work (walking and firing for now; a fight once its dead come ashore);
  - `scripts/load-phases.mjs --page tide.html`: its load phases.
  - `scripts/perf-measure.mjs` now also records the mansion's load phases and every page's fetched files, which check the tier map.
- **The rules** are in `AGENTS.md`, so every session picks the tier the same way and reports it.
- **Tested** (`tests/release-tier.mjs`, in `npm test`): the map of what each page loads matches the files the browser fetched and an import walk from each boot script, and neither mode reaches into the other. Version-only changes are ignored, each kind of change gets the right tier, and the standard comparison flags real differences but not run-to-run noise.
- **The flaky injury check is fixed** (`tests/zombie-injuries.mjs`): the share of spawns that arrive impaled now counts only enemies that can carry injuries. Dogs, lurkers and elites always spawn whole, and counting them had pulled the share close to the test's floor. A failure now prints the mix of kinds that spawned.

## The katana (version 205)

The Tsuru katana is a melee weapon in the shared modules, so both Midnight Siege and Dead Tide can carry it. In the mansion it rests on its stand in the servants' quarters.

- **Where and how much:** a weapon bench against the north wall of the servants' quarters, between the two rows of beds and facing the doorway from the infirmary. It is marked KT on the estate map. **2,500 essence.** Press **E** to buy it (it is drawn at once), then **7** to draw it again. Touch and controller players reach it with Next weapon.
- **The sword**, modelled on the reference picture:
  - a curved, folded-steel (Damascus) blade with a groove along it, a wavy temper line and a bright edge;
  - a brass collar, a round black guard, and a grip bound in black cord over white diamonds of ray skin, with small gold ornaments;
  - on the stand: a matte black lacquered scabbard painted with white cranes and teal pine, bound with a black-and-white cord with two hanging tassels, on a red rosewood stand. The handle points left and the cranes face out.
  - Every finish is painted once from formulas (about 1 MB of maps, no image downloads).
  - **Kept light:**
    - Every painted finish pairs its colour map with the guns' metal finish as roughness, exactly as the guns do. So the sword compiles to the guns' shader programs (no new ones), and a software renderer reuses the guns' texture routines.
    - The small stand casts no shadow, so it stays out of the moonlight's estate-wide shadow pass, and it shares the bench's brass. The bench under it casts, like every station.
- **How it fights:**
  - **Slashing:** click to slash, or hold to keep slashing, one slash every 0.48 s. Each slash cuts every enemy in a **100° arc** in front of you within **4 yards (3.66 m)**, 150 damage each. The arc is deliberately narrower than a half circle, to leave room for upgrades.
  - **Three slashes in turn:** a diagonal cut down from the right, a rising cut from the left and an overhead cut. After 1.2 s without a slash the set starts again. Damage lands as the blade crosses the middle of the view.
  - **What stops it:** walls, doors and floors. A Gravewarden facing you takes the cut on its shield.
  - **Bonuses:** each enemy cut pays the usual 10 essence a hit. Deadeye adds 50% and Double Damage doubles it (the shrine and the field guide now say "bullet and blade damage").
  - **What it doesn't have:** ammunition, reloads, sights (right click does nothing while it is out) and upgrade ranks.
  - **The Soul Forge** raises its damage (2×, 4×, 6×) and nothing else. While the katana is held, the forge's plaques, prompt and message show only the damage.
- **On screen:** the HUD reads MELEE where the ammunition goes, without the reload hint, and the crosshair becomes a dot over the arc it cuts.
- **What changed in the shared modules:**
  - `katana.mjs` (new): its numbers, finishes, model, stand, the three slashes' paths, and who a slash reaches.
  - `weapon-stats.mjs`: the katana's entry.
  - `weapon-runtime.mjs`: the slash, when it lands (`updateMelee`), and the slash state the view reads (`swing`).
  - `first-person.mjs`: the sword in hand and its poses.
  - `controls.mjs`: key 7, cycling, and no aiming with a blade.
  - `hud.mjs`: the MELEE readout.
  - `stations.mjs` and `station-models.mjs`: its stand, prompt and map mark, and the forge's blade wording.
  - `soul-forge.mjs`: the blade's plaques.
  - `combat-feedback.mjs`: a hit may carry its own stagger.
  - `reticles.mjs`: the blade arc.
- **Dead Tide** carries the katana through those modules, and key 7 draws it once owned. The island has no stand for it yet; that comes with Dead Tide's stations in step 4.
- **Proof that nothing else changed:** `scripts/golden-compare.mjs` compares the golden traces of `main` and this version channel by channel.
  - **Identical in all 25 existing scenarios:** every birth, the player, every enemy, pickups, the run, the session, the weapons (with the katana's own inventory slot set aside) and every sound.
  - **Different, as expected:** the screen, view and page hashes, because the katana's bench is in the scene, its sword is in the view and its reticle and key are on the page.
  - **The station tour** matches row for row except the Double Damage shrines' new wording.
  - **A new scenario**, run last, buys the katana and slashes a ring of the dead with clicks and a held trigger through all three slashes. It also forges the katana, draws a gun and draws the katana again.
- **Tested** (`tests/katana.mjs` and Dead Tide's test):
  - the arc, reach, floors and walls, and the Gravewarden's shield;
  - the stand's place, approach and price, buying, key 7 and drawing it again;
  - the HUD and reticle; no reload and no aiming;
  - all three slashes in turn, the reset after a pause, and holding to keep slashing;
  - the blade's poses in hand;
  - Soul Forge, Deadeye and Double Damage damage, and the forge's blade-only wording;
  - a new run without it;
  - in Dead Tide: key 7 and the three slashes.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs (89), loading (no phase changed beyond its run-to-run error across 40 balanced runs), the game's own per-frame work, and the fight's frame time.
  - **What it costs:**
    - one more file and 32 KB, and 1.3–2.6 MB more memory;
    - 3–4 more draw calls in every view (the bench in the moonlight's shadow pass, as every station is);
    - 13–15 more in views whose camera reaches the servants' quarters through the walls (the bench itself, drawn as any station is, since the mansion has no occlusion culling).
  - **Fixed before release:** measuring the first build found two new shader programs, the stand in the moonlight's shadow pass and a slower first frame. Each was fixed (see above and `perf/README.md`).
- **Dead Tide:** the same 35 shader programs and the same draw calls, plus the katana's module (31 KB) and its five finishes.
- **Not verified:** how the slashes feel and real-browser frame rates. The slashes were checked frame by frame in headless screenshots only.

## Dead Tide's own page and a grey-box island (version 204)

This is Dead Tide step 2, slice 2. Dead Tide now has its own page, `tide.html`, and a grey-box island you can walk, jump and shoot on. It loads on its own: nothing of the mansion is loaded, built or lit, and the mansion loads nothing of it. There are no dead yet; they come ashore in the next build.

- **Play it:** open `tide.html` next to the game (on GitHub Pages, `tide.html` after the game's address, once this is on `main`). It is a preview link: the mode picker still marks Dead Tide *In development*.
- **The page:** `tide.html` loads `style.css`, its own `tide.css`, `tide-boot.js` and then `tide.mjs`. It never loads `boot.js`, `game.js` or any mansion module.
  - **The title screen** circles the island at night. **Wade Ashore** starts the run and captures the mouse in the same click. **◂ All Modes** goes back to the mode picker; Settings and Controls are there too.
  - **The HUD:** essence, kills, health, the held weapon, ammunition and grenades, the reload bar, hit marker, damage flash, messages, where you are on the island, and the FPS readout.
  - **Pause:** Resume, Settings, Controls, New Run and Title Screen (the last two ask first). Settings are quality, look sensitivity, sound, the headshot label, touch controls and controller vibration. They are saved, and shared with the mansion.
  - **Controls:** keyboard and mouse, touch, and controller, all through the shared play session.
- **The island** (`public/game/island.mjs`):
  - **The ground:** about 130 m across. The coast runs 50–75 m from the centre, with a lowland ring and a beach all the way round that meets the sea on a gentle slope. Radio Hill rises 14 m near the middle, with a flat top.
  - **The radio shack** stands on the hilltop. Its door faces south between two lit windows, and inside are a radio desk and a warm lamp. Its walls and roof are solid.
  - **The lattice tower** stands beside it: 24 m of red and grey steel, with a red beacon that blinks on for 0.55 s of every 1.6 s.
  - **The wreck:** a trawler rolled onto her side at the water's edge on the south-east beach.
  - **Palms and rocks:** 46 palms, mostly on the beaches with a grove to the west, and 26 rocks on the hill's flanks and the north shore. You can stand on the small rocks.
  - **The sea:** one sheet of water. The shallows are lighter, surf rolls in over them, foam lines the edge of the sand, and the moon glints on the ripples. You can wade out to 0.8 m of water, more slowly as it deepens, and no further.
  - **The night:** a teal sky with stars and the moon, moonlight, and sea fog.
  - **It is light:** 46 meshes and 31,000 triangles. The palms and rocks are instanced.
- **Playing:** walk, sprint, jump, aim and fire. Reload, throw grenades (they bounce, burst, and hurt you within 3 m) and use the flashlight. Runs start with the Glock; buying other guns comes with Dead Tide's stations in step 4. For now the only way to die is your own grenade ("The tide takes you.").
- **Shared to make this possible** (the mansion is unchanged):
  - **`weapon-stats.mjs`:** the weapon table, the aimed field of view and each weapon's controller rumble, moved out of `core.mjs` and `game.js`. The guns no longer pull in the mansion's layout tables through `core.mjs`.
  - **`batching.mjs`:** mesh batching, moved out of `game.js`.
  - **`enemy-combat.mjs`** now also moves blood, impact marks, grenades and their spoons in flight (`updateEffects`, moved out of `game.js`).
  - **The proof:** main and this version produce byte-identical golden traces (all 25 scenarios).
- **Tested** (`tests/dead-tide.mjs`, run on its own page):
  - **Isolation:** Dead Tide's page loads only its own files and 43 shared modules. It loads none of the 39 modules that build, lay out, light or run the mansion, and the mansion loads none of Dead Tide's.
  - **Its boot script:** it starts the run inside the Wade Ashore click, returns to the mode picker, and reports failures.
  - **The island:**
    - the coast, the flat hilltop and every beach's slope;
    - every walkable slope;
    - where the shack, tower, wreck, palms, rocks and landing spot stand;
    - the beacon.
  - **A full run:**
    - the title screen;
    - walking, sprinting and jumping with your feet on the ground, and climbing Radio Hill;
    - entering the shack by its door, with its walls and roof holding;
    - wading, but not into the open sea;
    - firing, reloading and aiming, and grenades;
    - death, New Run, pause, Settings, the controls card and the title screen.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Loading:** across 40 balanced runs, no load phase changed beyond its run-to-run error.
  - **Frame logic:** the game's own per-frame work matches.
  - **The only measurable change:** two more files (`weapon-stats.mjs` and `batching.mjs`) and 2 KB more source.
- **Dead Tide's own numbers** (headless Chromium with software rendering, two runs):
  - **Loading:** playable in about 6.5 s, from 52 files and 1,911 KB. The mansion takes about 55 s, from 104 files and 8,971 KB, on the same machine.
  - **Shaders:** 35 programs, and none more are compiled during play. The mansion has 89.
  - **Memory:** a 36 MB heap after loading. The mansion's is 237 MB.
  - **Drawing:** 24–54 draw calls and 19,000–36,000 triangles in each view, and 97 draw calls while a grenade bursts. The mansion's views draw 1,479–2,376.
  - **Not measured:** real-browser frame rates.
- **Next:** the dead on the island, and a 45-enemy stress test.

## The first-person view, shared (version 203)

This is Dead Tide step 2, slice 1. The guns in hand and how the view moves now live in a shared module, so Dead Tide's island can carry the same guns without a copy. Nothing looks or plays differently.

- **What moved:** `createFirstPerson({camera,batchArticulated})` in `public/game/first-person.mjs` builds and runs:
  - **The guns in hand:** all six, with masks on the magnified sights, the Blood Moon dot-sight Bushmaster and the Twin Ravens. None of them casts a shadow.
  - **Their light:** the muzzle flash and its light, the two lights that show the guns, and the flashlight (`addLights`). These are made after the mansion's grenade and blast effects, as before, so every object keeps its place in creation order.
  - **The eye (`pose`):**
    - 1.68 m up, with a walking bob only on the ground;
    - look with recoil and throwing sway, stopped at the vertical limit;
    - the field of view for aiming, sprinting and magnified sights.
  - **The guns' motion (`updateGun`):**
    - at the hip, or aimed at each gun's sight height and depth;
    - sway, recoil and the reload pose;
    - the sprint tilt, and each Raven's own kick;
    - only the lens showing through a magnified sight.
  - **After each frame (`updateFlash`):** the muzzle flash going out and the kick settling.
  - **Also:** the flashlight switch, and racking the pistol slide for a new run.

  The view's own values (its field of view, the kick, the flash time, the next Raven, the reload drop) live in the module too. The code is unchanged.
- **What stays with the mansion:**
  - when the guns show (play or the title screen);
  - the crosshair, and the minimap's scope style;
  - the menu camera;
  - its grenade and blast effects.
- **Proof that nothing changed:** the golden trace now has 25 scenarios.
  - **Every sample** records the pose of every part of the guns in hand (slide, Raven kicks, scope masks and bodies). It also records the camera, both fields of view, the muzzle flash and light, and the flashlight.
  - **New scenario:** aiming, firing, reloading and sprinting with every gun, then the Twin Ravens, the dot sight, a grenade and the flashlight.
  - **The result:** main and this version produce byte-identical traces.
- **On its own:** `tests/first-person.mjs` runs the view with a camera, a run and weapons of its own. It checks the guns and their lights, the eye and both fields of view, every gun pose, the muzzle flash and the flashlight.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Loading:** across 40 balanced runs, no load phase changed beyond its run-to-run error.
  - **Frame logic:** the game's own per-frame work matches.
  - **The only measurable change:** one more file and 3 KB more source.
- **Next:** Dead Tide's own page and a grey-box island, built on these shared pieces.

## Stations, shared (version 202)

This is Dead Tide step 1, slice 9, the last slice of step 1. What the shared stations sell, how they look, and the interaction around every station now live in a shared module. Nothing plays differently.

- **What the shared stations are:** `public/game/stations.mjs` holds their names, prices, colours and captions:
  - the four perks (`PERKS`);
  - ammunition crates, the pistol bench and the weapon racks (`rackStation`);
  - the Double Damage and Infinite Grenades shrines (`shrineStation`);
  - Aegis body armor (`ARMOR_STATION`) and the Soul Forge (`forgeStation`);
  - the racks that sell ranks, and their equip keys (`RANK_RACKS`).

  A mode only says where each one stands. The models still come from `station-models.mjs`.
- **What moved:** `createStations({stations,player,state,isPlaying,arms,hud,sound,rules})` now holds:
  - **Reach:** the nearest station within 2.3 m on the same floor, skipping locked and spent ones.
  - **The prompt:** the key, the name, the price tag and what the station does.
  - **Pressing E:** charging essence, or saying how much more is needed. It covers:
    - perks, once each, with Ironheart doubling health and armor;
    - ammunition, and the pistol bench's four ranks, then 250-essence restocks;
    - each rack's weapon, then its ranks (short of a rank, the rack still hands the weapon over);
    - Aegis and the three Nano Shield ranks, shown at both armor stations;
    - three Forge ranks on the held weapon, shown at every forge;
    - the timed shrines.

  The code is unchanged.
- **What stays with the mansion:**
  - where every station stands;
  - its own kinds of station: Bella's kennel, Olivia, Sir Blackthorn's grave, the shed, cellar and tomb doors, the shed's M4, and the Warden LMG (which wakes a frenzy);
  - when those can be reached: the M4 only from inside the shed, the grave only inside the tomb, the cellar only once open.
- **How a mode adds a kind of station:** each rule is optional, and a new kind (Dead Tide's katana, later) needs no change to the shared code:

  | Rule | When it runs | What the mode decides |
  |---|---|---|
  | `stillOpen(s)` | Finding the nearest station | A spent station that still sells (Bella's kennel, the Warden's exhibit) |
  | `hidden(s)` | Finding the nearest station | A station out of reach for now |
  | `label(s)`, `describe(s)` | The prompt | Its own kinds' price tag and description |
  | `use(s)` | E, before anything is charged | Its own kinds that cost nothing or have conditions |
  | `equip(s)` | E, once its own weapon is bought | Handing it over again |
  | `buy(s)` | E, after the price is paid | Its own purchases |
- **Proof that nothing changed:** the golden trace now has 24 scenarios.
  - **New scenario:** a station tour that visits all 37 stations early in a run, then again after wave 21 with the shed, cellar, tomb and attic open. At each it records the prompt, then presses E with no essence, with plenty, and once more, recording the message, the whole run (essence, health, armor, perks, every weapon's ranks, Forge and ammunition) and the station.
  - **The result:** main and this version produce byte-identical traces.
- **On its own:** `tests/shared-stations.mjs` runs the stations with a run, a player and stations of its own. It checks:
  - reach, including floors, locked, spent and hidden stations;
  - the prompt, and every kind of purchase above;
  - a kind of station the module has never seen (a katana), added entirely through the rules.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Loading:** across 40 balanced runs, no load phase changed beyond its run-to-run error. A slower shader phase in the first 20 did not repeat.
  - **Frame logic:** the game's own per-frame work matches.
  - **The only measurable change:** one more file and 4 KB more source.
- **Step 1 is complete:** enemy AI, spawning, combat, the weapon runtime, the player's run, the HUD, the play session, the screen and sound, and now the stations are all shared. Dead Tide step 2 (the grey-box island) can build on them.

## The screen and the sound, shared (version 201)

This is Dead Tide step 1, slice 8. The renderer, the cameras, the quality setting, resizing, drawing a frame, the shader warm-up and the game's sound now live in two shared modules. Nothing looks or sounds different.

- **The screen:** `createDisplay({canvas,far,onFailure})` in `public/game/display.mjs` makes:
  - the WebGL renderer with the mansion's settings (soft shadows, filmic tone, exposure 1.22), and the message shown when WebGL is missing;
  - the scene, the world camera (how far it sees is the mode's choice; the mansion keeps 240 m) and the camera that draws the held weapon;
  - the film pass the world renders into (`addFilm()`), made after the mansion's world as before, so every object keeps its place in creation order.

  It also holds:
  - **Quality:** the pixel ratio, antialiasing and starting resolution for Performance, Balanced and Ultra; the quality saved by either mode applies to both.
  - **Dynamic resolution:** it measures live play only, with the FPS readout once a second.
  - **Resizing**, **drawing a frame** (world, then weapon, then film) and **the shader warm-up** under the loading screen.

  The code is unchanged.
- **The sound:** `createAudio({isOn})` in `public/game/audio.mjs` holds:
  - the Web Audio context, started on the first Resume and woken again after the browser suspends it;
  - the two-second noise buffer and the low wind under everything;
  - tones, noise bursts and the MP5's suppressed report.

  Every sound is silent until the first Resume and while the sound switch is off; the wind follows the switch at once.
- **What stays with the mansion:**
  - its sky, fog, lights and world;
  - its lamp-shadow quality, and the drifting dust shown only above Performance;
  - the page layout run before each resize;
  - what it warms before play: every gun and the grenade in hand, scope masks, event visuals, power-ups and fading drops, the enemy builds and their enraged look, Nano Shield models and Bella, with its lamps lit as in play;
  - every sound it plays and when.
- **How a mode drives the screen:**

  | Call | Field | What the mode supplies |
  |---|---|---|
  | `createDisplay` | `canvas`, `far`, `onFailure` | The game canvas, how far the camera sees, and how to show the WebGL message |
  | `useScreen` | `select`, `fps` | The quality menu and the FPS readout |
  | `useScreen` | `layout`, `quality`, `detail` | Its layout before each resize, what quality changes in its shaders (applied before they recompile), and what it shows or hides |
  | `prepare(stage)` | `world`, `warm`, `textures`, `done` | Its world, the models to warm (stood five metres ahead of the camera, then removed), its textures, and how to put things back |
  | every frame | `frame(seconds,live)`, `render(showWeapon,world,fov)` | The frame time, whether play is live, and the weapon's field of view |
- **The perf scripts:** the perf probe and `scripts/load-phases.mjs` still work on every build, before and after this change.
- **Proof that nothing changed:** the golden trace now has 23 scenarios and records sound and the screen too.
  - **Sound:** a recording Web Audio context logs every node the game makes, how it is wired, and every value and ramp.
  - **Screen:** the renderer stand-in logs every call: targets, sizes, both camera passes, shader compiles and texture uploads, from the warm-up to the last frame.
  - **New scenario:** each quality, a portrait window and back, slow frames that lower the resolution and quick ones that raise it, the sound off and on mid-fight, and a sleeping audio context woken by Resume.
  - **The result:** main and this version produce byte-identical traces, every page fingerprint, sound and renderer call included.
- **On their own:**
  - `tests/display.mjs` runs the screen on a bare page with a world of its own. It checks the WebGL message, the renderer and cameras, each quality, resizing, dynamic resolution and its readout, the order a frame is drawn in, the warm-up, and the saved quality.
  - `tests/audio.mjs` runs the sound with a switch of its own. It checks silence before Resume, the wind, each kind of sound and its timing, the switch, waking a sleeping context, and a closed one.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Loading:** no load phase changed beyond its run-to-run error.
  - **Frame logic:** the game's own per-frame work matches.
  - **Rechecked:** one fight heap reading was 9.5 MB high, and its repeat matched main.
  - **The only measurable change:** two more files and 5 KB more source.

## The play session, shared (version 200)

This is Dead Tide step 1, slice 7. Capturing the mouse, pausing, the settings page, the are-you-sure prompts and the play controls now live in a shared module. Nothing plays differently.

- **The session's values:** ten values that `game.js` kept as separate variables now live in one object, `session`, made by `createSession()` in `public/game/controls.mjs`. They are:
  - the mode (menu, capturing, playing, paused, curse or dead);
  - whether the mouse is captured;
  - the trigger and aim;
  - the two look angles;
  - the four mouse-capture flags.

  The same scope-aware rename as v198 rewrote the 150 places that used them. The HUD now takes `session` directly.
- **What moved:** `createControls({page,session,state,act,ui,hooks})` now holds:
  - **Capturing the mouse:** waiting for the browser, playing once it is locked, explaining a refused lock and offering a retry, and touch and controller play that needs no lock.
  - **Pausing and resuming:** Escape, a hidden tab, lost focus and losing the lock all pause, with the mode's own summary on the pause screen.
  - **The pause menu's pages:** the settings page (from the pause menu or the title screen) and the are-you-sure prompts, which act at once after a death.
  - **The play controls:**
    - mouse look by sensitivity and sight zoom;
    - one shot per press, and aiming;
    - every play key;
    - jumping from the ground;
    - the touch and controller action sets, including cycling through owned weapons.

  The code is unchanged.
- **What stays with the mansion:**
  - its own menus and overlays: the field guide, estate map, curse choice, changelog and leaderboard;
  - which of them a key or button reaches first, before the play keys get their turn;
  - its pause summary (wave, kills, essence) and settings heading;
  - what its prompts do;
  - returning to the title screen and game over;
  - the controller's Menu and Back buttons.

  Every browser event is still registered by `game.js`, at the same places in the same order; the handlers come from the module.
- **How a mode drives it:**

  | Part | Field | What the mode supplies |
  |---|---|---|
  | `page` | `$`, `canvas`, `keys` | The page, the game canvas and the held-key set |
  | `session` / `state` | `session`, `runState` | The session's and the run's values |
  | `act` | `shoot`, `reload`, `grenade`, `selectWeapon`, `zoomOf`, `interact`, `toggleFlashlight`, `openEstateMap`, `initAudio`, `fitTouchStick` | What the controls do |
  | `ui` | `touchControls`, `controlScheme` | The touch controls and the active control scheme |
  | `hooks` | `onPause`, `onPauseMenu`, `pauseSummary`, `settingsEyebrow`, `settingsFromMenu`, `confirm`, `lookBlocked` | The mode's own pause wording, prompts, and when look is blocked |
- **The perf probe:** it now reports the mouse as locked through the browser's own property instead of replacing `hasMouseLock`, so it still works on every build.
- **Proof that nothing changed:** the golden trace now has 22 scenarios. It also records the mode, mouse capture, trigger, aim and look.
  - **New scenario:** mouse look, every play key, Escape, settings, both prompts, Resume and mouse capture, a hidden tab, lost focus, the main menu and back, a lost lock, and the touch and standard schemes.
  - **The result:** main and this version produce byte-identical traces, every page fingerprint included.
- **A bare page:** `tests/controls.mjs` runs the session on a page of its own with play actions of its own. It checks:
  - capture, and a refused lock;
  - look, fire, aim and every key;
  - jumping;
  - each way of pausing;
  - settings and the prompts;
  - touch and controller play.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Loading:** every load phase is the same or quicker.
  - **Frame logic:** the game's own per-frame work matches.
  - **The only measurable change:** one more file and 5 KB more source.

## Shared HUD (version 199)

This is Dead Tide step 1, slice 6. The HUD's shared readouts now live in a shared module. Nothing looks or plays differently.

- **What moved:** `public/game/hud.mjs` now holds:
  - **The vital readouts:**
    - health, which turns critical below 35% and shows Spectral Fury while double damage lasts;
    - armor (plain or Nano Shield, its charge and whether it is regenerating);
    - essence and kills;
    - the held weapon with its rank and Forge level, its ammunition and reserve;
    - the grenade count or the infinite-grenade timer;
    - owned perks and active power-ups.
  - **The reload bar.**
  - **Toasts and banners:** `notify` and `announce`.
  - **Flashes:** the hit marker, the damage flash and the low-health vignette, and how they fade.

  The code is unchanged.
- **What stays with the mansion:** its own readouts, in its `updateHud`:
  - the wave number and wave status;
  - the frenzy and finale counters;
  - bone chips;
  - the world-event badge;
  - the curse panel;
  - Sir Blackthorn's health bar;
  - the minimap and the FPS counter.

  Dead Tide will put its threat tracker in their place. Bella's companion badge reaches the shared power-up list through a `badges()` hook.
- **How a mode drives it:** `createHud({dom,session,state,perks,rules})`.

  | Part | Field | What the mode supplies |
  |---|---|---|
  | `dom` | `$`, `setMarkup`, `setOpacity` | The page's own element helpers (they share its caches) |
  | `session` | `mode` | Whether play is live, paused or on the menu |
  | `state` | `runState` | The run's values |
  | `perks` | the perk list | Each perk's id, name, colour and icon |
  | `rules` | `badges()` | Extra badges after the power-ups |

  It returns:
  - `notify` and `announce`;
  - `updateVitals` and `updateReloadHud`;
  - `markHit`, `flashDamage`, `clearFlashes`, `clearToast`, `clearBanner` and `fadeHud`.
- **Proof that nothing changed:** the golden trace now also records **the page itself**. At every sample it fingerprints every element on the page: its classes, inline style, hidden flag, and (for elements with no named children) its markup. Run ids, which are random, are masked.
  - **New coverage:** a Soul Forge purchase and a stretch at low health.
  - **The result:** main and this version produce byte-identical traces, so every HUD element read the same at every sample, in all 21 scenarios.
- **A bare page:** `tests/hud.mjs` runs the HUD on a page of its own with a run of its own. It checks every readout, the critical and spectral states, rank and Forge names, perks, power-ups and the mode's badge, Nano Shield regeneration (only while playing), the reload bar, and every fade time.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Within noise:** every load phase.
  - **Frame logic:** the game's own per-frame work is no slower.
  - **The only measurable change:** one more file and 2 KB more source.

## The player's run, shared (version 198)

This is Dead Tide step 1, slice 5. The run's own values, and how the player walks, jumps, gets hurt and recovers, now live in a shared module. Nothing plays differently.

- **The run's values:** 25 values that `game.js` kept as separate variables now live in one object, `runState`, made by `createRunState()` in `public/game/player.mjs`. They are:
  - health, maximum health, armor, maximum armor, armor tier, the last hit and the run clock;
  - essence, total score, kills and perks;
  - the inventory, the held weapon, the reload, shot and shot-number timers;
  - grenades, infinite-grenade and double-damage timers;
  - walking phase, jump speed and footing.

  Every mode starts a run from the same values, and the mansion's restart still resets each one for a fresh run. The weapon runtime reads and writes them through `runState`.
- **How the code was changed:** a scope-aware rename (eslint-scope), not hand edits, rewrote the 262 places `game.js` used these values. It checked that nothing local shadowed them. `tests/harness.mjs` and the perf probe now read them through `runState`; the probe still works on older builds too.
- **What moved:** `createPlayer({level,run,state})` returns `{walk,recover,hurtPlayer}`.
  - **`walk(dt,x,z,{sprint,aiming,yaw})`:**
    - walking at 3.6 m/s, sprinting at 5.6 and aiming at 2.1;
    - Nightstride's 30%;
    - diagonals and half-pushed sticks;
    - footsteps;
    - jumping, falling, stairs and landing.
  - **`recover(dt,playing)`:** Nano Shield armor regrowing after its delay, and health returning 6 s after the last hit.
  - **`hurtPlayer(amount,from)`:** armor soaks up a hit before health, and a fatal hit ends the run.

  The code is unchanged.

  | Part | Field | What the mode supplies |
  |---|---|---|
  | `level` | `colliders`, `supportBelow`, `move(pos,dx,dz,r)`, `updateHeight(pos,velocity,dt,grounded,height,radius,colliders)` | Its floors, collision, and how bodies rise and fall (the mansion's stairs, cellar and attic) |
  | `run` | `player`, `tone`, `noise`, `rumble`, `gameOver` | The player's position, sounds, rumble and the end of a run |
  | | `onHurt(from,shielded)` | The damage flash and the hit-direction marker |
  | `state` | `runState` | The run's values |
- **What stays with the mansion:**
  - reading the keys, sticks and touch controls;
  - the jump keys;
  - the camera's bob and field of view;
  - its wave director (wave, spawns, finales);
  - the HUD.
- **Proof that nothing changed:** the golden trace now has 21 scenarios. It also records health, armor and its tier, the last hit, the run clock, jump speed, footing, the camera's position and angle, and the perks owned.
  - **New scenario:** walking, sprinting, aimed strafing, jumping, the hall stairs up and down, health coming back after a hit, Nightstride, and body armor soaking up hits and regrowing.
  - **The result:** main and this version produce byte-identical traces.
- **On flat ground with no mansion:** `tests/player-run.mjs` checks that `game.js` keeps none of the 25 values as variables, and that a fresh run starts as before. Then, on flat ground with plain gravity, it checks:
  - every pace and Nightstride, diagonals and half-pushed sticks, and turning with the view;
  - footstep timing;
  - a jump landing;
  - armor before health, and the fatal hit;
  - both kinds of recovery.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Loading** is no slower, phase by phase, over 20 runs.
  - **Frame logic:** the game's own per-frame work, timed without rendering by the new `scripts/frame-logic.mjs`, matches main within noise over 24 pairs (+0.03 ms a frame at the fastest).
  - **The fight:** one 11% slower fight sample was noise; its repeats matched main.

## Shared weapon runtime (version 197)

This is Dead Tide step 1, slice 4. Everything the player's guns and grenades do now lives in a shared module. Nothing plays differently.

- **What moved:** `public/game/weapon-runtime.mjs` now holds:
  - **Firing:**
    - each shot's ammunition, fire rate, rumble, muzzle flash and sound;
    - the aimed or hip spread;
    - the damage formula: Deadeye, the Soul Forge, rank damage, headshots ×2.6, crushed skulls and double damage;
    - bullet marks;
    - the M4 capstone's detonating rounds;
    - recoil.
  - **Reloading and ammunition:** magazine and reserve sizes from ranks and the Forge, reloads and Quick Hands, restocks and the max-ammo refill.
  - **Weapon ranks:** buying a rank with essence, and its effects: magazines arriving loaded, the pistol's dot, the twin Ravens, the Bushmaster's red dot, and full-auto ranks.
  - **The gun on screen:** drawing a weapon, which guns are visible, the twin-gun muzzles, aim height, zoom and aiming field of view.
  - **Grenades and power-ups:** counted and infinite throws and their cooldown, releasing the grenade and its spoon (never through a wall), and what each power-up does once collected.

  The code is unchanged, with every roll in the same order.
- **What stays with the mansion for now:**
  - **The run's values:** the inventory, the held weapon, timers, essence and aim are handed over as `state`, with getters and setters, until the run-state slice.
  - **Other systems:** the frame loop's countdowns, the stations that sell guns and ranks (and their prices), the HUD and the input bindings, each with its own slice.
- **How a mode drives it:** `createWeaponRuntime({level,view,run,state,combat})` returns the functions above.

  | Part | Field | What the mode supplies |
  |---|---|---|
  | `level` | `colliders`, `isBlocked`, `solidMeshes` | What stops a shot or a thrown grenade |
  | `view` | `camera`, `gunGroups`, `bushDot`, `smgDual`, `dualGuns`, `dualMuzzle`, `flash`, `reticleHud`, `weaponRecoil`, `grenadeThrow`, `grenadeAssets` | The first-person guns, sights and throwing arm |
  | `run` | `scene`, `zombies`, `effects`, `markPool`, `rand` | The session's scene, enemies, effect pools and random numbers |
  | | `tone`, `noise`, `notify`, `rumble`, `suppressedReport` | Sounds, messages and rumble |
  | | `updateHud()`, `updateReloadHud()` | HUD refreshes |
  | | `shotRumble`, `raycaster` | Per-weapon rumble and the shared ray |
  | `state` | `inventory`, `weapon`, `mode`, `aiming`, `lookYaw`, `lookPitch`, `perkOwned`, `points` | The run's values |
  | | `reloadLeft`, `reloadDuration`, `shotTimer`, `shotId`, `grenades`, `grenadeTime`, `grenadeCooldown`, `doubleTime` | Weapon timers and counts |
  | | `flashTime`, `recoil`, `dualSide`, `weaponViewFov` | View effects |
  | `combat` | `damageEnemy`, `bloodBurst`, `detonateRound` | From `enemy-combat.mjs` |

  Dead Tide can pass a plain object as `state`.
- **Proof that nothing changed:** the golden trace now has 20 scenarios. It also records every gun's ownership, ammunition, reserve and ranks, plus the timers, aim, held trigger, recoil, field of view and which guns are on screen.
  - **New scenarios:**
    - every gun fired in turn, with clicks, held triggers, aiming down sights, empty magazines, reloads and a switch tried mid-reload;
    - ranks bought at the pistol bench and the SMG, shotgun and Bushmaster racks, then the dotted pistol, twin Ravens, shotgun and red-dot Bushmaster fired, and a restock at the ammunition crate;
    - grenades thrown from the count, infinite ones with their cooldown, and one thrown against a wall.
  - **The result:** main and this version produce byte-identical traces.
- **A range with no mansion:** `tests/weapon-runtime.mjs` drives the runtime with its own state, target and stubs. It checks:
  - drawing only owned guns;
  - the pistol's damage, and headshot, Deadeye and double-damage multipliers;
  - every shotgun pellet;
  - semi-auto against held fire;
  - reloading on empty, and Quick Hands;
  - ranks for essence only, and the M4's 40-round magazine;
  - detonating rounds;
  - counted and infinite grenades;
  - every power-up.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Load-time check:** 14 load pairs suggested v197 was 0.8 s slower, so I timed the phases. Fetching the modules and building the world take the same time in both builds; all the variation is in shader compiling, which is identical work.
  - **The only measurable change:** one more file and 4 KB more source.
  - **New tool:** `scripts/load-phases.mjs` times the three load phases for any build.

## Shared combat: hits, kills, blasts and drops (version 196)

This is Dead Tide step 1, slice 3. Hurting and killing enemies, explosions, and the drops they leave now live in a shared module. Nothing plays differently.

- **What moved:** `public/game/enemy-combat.mjs` now holds:
  - **Hits:** damage, the 10-essence hit award, leg hits that bring walkers down, hit reactions and stagger.
  - **Kills:**
    - the kill award (50 for walkers and dogs, 110 for brutes, 75 or 200 for headshots, with the lurker-blast bonus);
    - the kill count and Blood Rage chains;
    - power-up drops, blood, the ragdoll death and the 14-corpse limit.
  - **Blasts:**
    - grenades: 450 damage, full through 9 m, half to 12 m, 25 to the player within 3 m;
    - Bella's safe blasts;
    - the M4's detonating rounds;
    - lurker bursts and the line-of-blast check.
  - **Drops:** power-ups on the ground, their bob and fade, collecting them, and their expiry.

  The code is unchanged, with every roll in the same order.
- **What stays with the mansion:** its own rewards and extras:
  - curse-rank essence and world-event bonuses on kills;
  - Bella's bone chips;
  - Sir Blackthorn's defeat;
  - the Gravewarden's shield and kill reward;
  - grave essence;
  - what each pickup does once collected.

  The player's health and armor (`hurtPlayer`), weapon timers and power-up effects stay too; they move with later slices.
- **How a mode drives it:** `createCombat({level,run,rules})` returns `{damageEnemy,killZombie,bloodBurst,blastLine,explode,detonateRound,lurkerBurst,lurkerBursts,dropPickup,updatePickups}`.

  | Part | Field | What the mode supplies |
  |---|---|---|
  | `level` | the same map, plus `solidMeshes` and `visibleFloor(x,z,support)` | What blocks a blast, and where scorch marks land |
  | `run` | `player`, `zombies`, `scene`, `rand`, `rng`, `tone`, `noise`, `notify`, `rumble` | The session, its random numbers, sounds and gamepad rumble |
  | | `sphere`, `effects`, `bloodPool`, `explosionFx`, `blastLight` | Effect meshes, pools and the explosion effects |
  | | `powerupAssets`, `pickups`, `enemyAssets` | Drop models, the ground pickups and enemy rigs |
  | | `elapsed`, `playing` | The run clock, and whether play is live |
  | | `addPoints(n)`, `addKill()`, `hurtPlayer(n,from)`, `kick()` | Essence, the kill count, player damage and the blast's camera kick |
  | | `killHeal(impact)`, `hitFeedback(headshot,impact)` | Weapon-rank healing, and the hit marker and its sound |
  | | `collect(p)`, `releasePickup(p)` | What a pickup does, and returning a pooled one |
  | `rules` | `killReward(base)` | The kill award after the mode's bonuses |
  | | `onKill(e,impact)`, `bonusDrop(e)` | The mode's own extras on a kill |
  | | `hitAmount(e,amount,impact)` | Shields and the like |
- **One map for all three modules:** the mansion's `mansionLevel` now also carries `solidMeshes` and `visibleFloor`.
- **Proof that nothing changed:** the golden trace now has 17 scenarios. It also records the full player state (score, ammo, grenades, timers, bone chips) and each enemy's rage, stagger, death time and visibility. Every pickup on the ground is recorded too, with its position and remaining life.
  - **New scenarios:**
    - grenades into a ring of 20, with a lurker, a direct blast and one beside the player;
    - the M4 capstone's detonating rounds, leg hits and the LMG capstone's healing kills;
    - power-ups, grave essence and a bone chip collected or left to expire;
    - Bella killing weak walkers, then the player gathering her bone chips.
  - **Also new:** the Sir Blackthorn fight now includes hits on the Gravewarden's shield.
  - **Coverage:** a line on stderr confirms each scenario reached the corpse limit, Blood Rage, drops, blast damage, healing, crawlers, every power-up, essence, chips and lurker bursts.
  - **The result:** main and this version produce byte-identical traces.
- **A fight with no mansion:** `tests/enemy-combat.mjs` drives combat, the spawner and the AI on a bare yard with its own wall and none of the mansion's rewards. It checks:
  - hit and kill awards;
  - legs;
  - blast ranges and the wall's cover;
  - safe and unsafe blasts;
  - detonating rounds;
  - a lurker burst set off by the AI;
  - drops collected and expiring;
  - bonus drops;
  - the corpse limit.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Within noise:** time to playable (six alternating pairs) and frame times.
  - **The only measurable change:** one more file and 2 KB more source.

## Shared enemy spawner (version 195)

This is Dead Tide step 1, slice 2. Making enemies and choosing where they appear now live in a shared module. Nothing plays differently.

- **What moved:** `public/game/enemy-spawn.mjs` now holds:
  - making every kind of enemy (walker, brute, dog, Ashfang, feral and Grotesque Lurker), with its health, speed, temperament, build, face and battle wounds;
  - deciding whether a spot is a valid place for a given kind to appear;
  - choosing a spawn point, preferring short routes to the player;
  - cleaning an enemy up when its body is removed.

  The code is unchanged, with every random roll in the same order.
- **What stays with the mansion:** when to spawn and what to spawn. That covers wave timing, the wave 5 and wave 10 finales, curse ranks, the lurker dice, camping in the cellar or attic, upstairs spawns, grave risings and Sir Blackthorn's summons. Dead Tide will bring its own director for this: threat levels, its 28 spawn points and continuous spawns.
- **One map for both modules:** the mansion now builds a single `mansionLevel` and hands it to the spawner and the AI. The spawner adds one field to it: `canStand(x,z,y,r)`, where an enemy may stand. Upstairs, that means the mansion's real upper floor.
- **How a mode drives it:** `createEnemySpawner({level,run,rules})` returns `{makeZombie,makeLurker,injure,spawnKind,placement,choosePoint,disposeEnemy}`.

  | Part | Field | What the mode supplies |
  |---|---|---|
  | `level` | the same map the AI takes, plus `canStand(x,z,y,r)` | Where an enemy may stand |
  | `run` | `player`, `zombies`, `scene`, `enemyAssets` | The player, enemy list, scene and prepared enemy rigs |
  | | `rng`, `rand` | The game's random numbers |
  | | `sharedResources()` | Geometry and materials that must never be disposed with an enemy |
  | `rules` | `enemyStats()` | `{health,speed}` for a walker at the current difficulty: the mansion's wave and curse rank, or Dead Tide's threat level |
- **A tidy-up of unused code:** `disposeEnemy` named a list of book materials that doesn't exist. That code could never run, because every enemy is built from shared rigs. The mansion now just lists its shared materials.
- **Proof that nothing changed:** the golden trace now records every enemy's birth as well as its moves. That's 172 enemies across 13 scenarios, each with its position, health, speed, size, kind, temperament, route side, wound, face and build.
  - **New scenarios:** waves 12 and up (upstairs spawns, lurkers, Ashfangs and ferals), both frenzied finales, camping in the storm cellar, and the Awakening grave risings.
  - **The result:** main and this version produce byte-identical traces.
- **A fight with no mansion:** `tests/enemy-spawn.mjs` gives the spawner a bare yard with its own walls, ledge, no-standing area and routes.
  - It makes all six kinds from the yard's stats.
  - It checks every placement rule against the yard's own rules.
  - Then, with the shared AI, the yard's own spawns close in and attack.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Within noise:** time to playable (seven alternating pairs) and frame times.
  - **The only measurable change:** one more file and 3 KB more source.

## Shared enemy AI (version 194)

This is Dead Tide step 1, the first slice of moving the game's mode-neutral core out of `game.js` so the island can reuse it. Nothing plays differently.

- **What moved:** how enemies hunt, route, crowd, walk, turn, climb and strike now lives in `public/game/enemy-ai.mjs`. That covers the line-of-approach check, shouldering past a blocked neighbour, corpse settling and the per-frame enemy update. The code is unchanged, and every calculation runs in the same order.
- **How a mode drives it:** `createEnemyAI({level,run,rules})` returns `{updateEnemies,hasClearPath}`. Live values are passed as getters.

  | Part | Field | What the mode supplies |
  |---|---|---|
  | `level` (the map) | `colliders`, `isBlocked(x,z,r,colliders,bounds,y,height)` | Solid boxes and the blocking test. The test applies the map's own bounds. |
  | | `supportBelow(x,z,y,step)` | The highest walkable surface at or just below `y` |
  | | `floorHeight(x,z)` | Ground height for an enemy standing at y≈0 |
  | | `rampHeight(x,z)` | Height of a stair or ramp here, or `null` |
  | | `move(pos,dx,dz,r,enemy)` | Slide a body against colliders and the crowd |
  | | `crouchAt(x,z,y)` | Whether a brute must duck here |
  | | `nav` | Routes: `nav.direction(x,z,y,state)`, and `nav.brutes` for big bodies |
  | | `crowd` | The crowd planner from `crowd.mjs` |
  | `run` (the session) | `player`, `camera`, `zombies`, `scene` | The player position, camera, enemy list and the scene enemies live in |
  | | `rand`, `tone`, `noise` | The game's random numbers and sounds |
  | | `elapsed`, `health` | The run clock and the player's health |
  | | `hurtPlayer(amount,from)`, `gameOver()`, `killZombie(e,head,hit)`, `disposeEnemy(e)` | What a blow, a death or a lost run does |
  | | `lurkerBursts`, `lurkerBurst(burst)` | Queued lurker explosions, set off at the start of each update |
  | `rules` (the mode's own) | `decoy(e)`, `decoyStruck(e)` | Something other than the player that this enemy hunts (or `null`), and what a blow at it does |
  | | `detour(e,pos)` | A waypoint that overrides the route, or `null` |
  | | `baseDamage()` | A walker's blow at the current difficulty |
  | | `surge(e)` | The round's pace multiplier |
  | | `speedScale(e)`, `attackRate(e)` | World-event multipliers |
  | | `boss` (optional) | `{rules,warden,update,pose,endWarCry}`, for modes with a boss |
- **The mansion's rules:**
  - Bella is its decoy.
  - The attic ladder is its detour.
  - Frenzy waves set the pace.
  - Its world events scale speed and attack rate.
  - Sir Blackthorn and his Gravewarden are its boss.

  Dead Tide will pass its island and leave Bella, the attic and the boss out.
- **Isolation:** `enemy-ai.mjs` imports only shared enemy modules. Nothing it loads builds or holds the mansion. The one leftover is `core.mjs`, which still carries the estate's bounds as two small constant tables (about 3 KB, no setup); a later step moves those out.
- **Proof that nothing changed:** `scripts/golden-trace.mjs` plays nine seeded scenarios through the game and records every enemy's position, height, health, heading, attack timer and crouch, plus the player's state.
  - **The scenarios:** a mixed brawl with a lurker, a stair climb, natural waves, six stacked waves, Bella's bitten zombies, the attic ladder, a frenzy wave, a surge event and a Sir Blackthorn fight with his war cry.
  - **The result:** main and this version produce byte-identical traces (227 KB).
  - **How sensitive it is:** changing one turning constant by 0.002% changes the trace.
- **A test with no mansion at all:** `tests/enemy-ai.mjs` drives the module on a flat test yard with no stairs, routes, Bella, attic or boss. Walkers cross it, strike for the yard's damage, respect its walls and ramps, and follow a decoy.
- **Mansion performance** (`perf/README.md`, measured beside main):
  - **Unchanged:** shader programs, geometries, textures, memory, and every draw-call and triangle count.
  - **Within noise:** time to playable and frame times.
  - **The only measurable change:** one more file and 2 KB more source, about 0.02% of the load.

## Choose your nightmare: the mode picker (version 193)

This is the first step toward **Dead Tide**, Blackthorn's second mode: endless survival on an island. Each mode will load on its own page, so neither mode ever loads the other's world.

- **The picker:** `modes.html` is a split-screen title page.
  - **Midnight Siege** (on the left) shows the estate on a rainy night: lit windows, the dead at the fence, and a flicker of lightning.
  - **Dead Tide** (on the right) shows the island: a radio tower blinking red over the surf, and the dead wading in.
  - **The seam:** the side you point at widens along a slanted, blood-lit seam.
  - **Controls:** choose with the mouse, the arrow keys or A/D, or a gamepad's stick, d-pad and A button.
  - **On phones,** the halves stack.
  - **With reduced motion on,** the scenes are still and redraw only when something changes.
  - **Dead Tide** is marked *In development* until it's playable.
- **No 3D engine:** the picker draws its scenes on a plain 2D canvas and loads only the game's three fonts and its two logo images (about 97 KB in all). It never loads three.js, `boot.js` or any game module.
- **The mansion is unchanged:** `index.html` still opens Midnight Siege directly, so existing links and the leaderboard work as before. `siege.html` forwards to it. The only addition is a **◂ ALL MODES** link on the title screen, which appears only for players who came from the picker.
- **Measuring before and after:** `scripts/perf-measure.mjs` records:
  - transferred bytes;
  - time to playable;
  - shader programs;
  - memory;
  - draw calls and triangles at fixed camera views;
  - frame times, both in those views and in a 32-zombie fight.

  The v192 baseline is in `perf/`. Each Dead Tide step will be compared against it, and any regression in the mansion gets fixed before release.

## An open upper floor (version 192)

The upstairs walls between the grand hall's balcony and the rooms beside it (the reading room on the west, the private salon on the east) are gone. So are the blocks that hung from the ceiling on both sides: the bottoms of the two chimney stacks and the clock tower, which reached half a metre below the upstairs ceiling and now start above it. You can now see the whole upper floor from one end to the other: down the east corridor, across the open hall, and down the west corridor.

The hall's iron railings still guard the drop. Beside the stairwell, a strip of stone closes the edge of the reading-room floor below floor level, so nothing stands above the floor there. The wing corridors and their rooms are unchanged.

## M4 and Warden LMG ranks (version 191)

The M4 and the Warden LMG now have their own four-rank ladders, like the pistol, Raven, M12 and Bushmaster. Ranks cost 2,000 / 4,000 / 8,000 / 16,000 essence, are bought in order and last for the run.

**M4: sold at the tool-shed rack once you own it**

| Rank | Name | Effect | Flavor |
|---|---|---|---|
| I | Iron Psalm | APC rounds · 25% more damage | *Armor-piercing, and soul-piercing.* |
| II | Night Watch | 40-round magazine | *Forty rounds to keep the watch till dawn.* |
| III | Long Wake | 50-round magazine | *Fifty rounds. The wake runs all night.* |
| IV | Hellfire Litany | Detonating rounds: 5 m blasts at 33% of a grenade | *Every round a funeral pyre.* |

**Warden LMG: sold at its cellar exhibit once you own it**

| Rank | Name | Effect | Flavor |
|---|---|---|---|
| I | Steady Vigil | 40% more stability (less recoil) | *The Warden plants its feet and does not flinch.* |
| II | Iron Procession | 150-round belt | *A hundred and fifty mourners, marching in step.* |
| III | Endless Cortège | 200-round belt | *Two hundred rounds. The procession never ends.* |
| IV | Wrath of the Warden | 33% faster fire · +2 health per kill | *It feeds on the fallen, and grows only hungrier.* |

- **Detonating rounds** burst wherever a round strikes a zombie or a wall. Each blast does 148.5 damage (33% of a grenade's 450) to zombies within 3.75 m, and half that out to 5 m. Blasts need the same clear line as a grenade and never hurt you. They use their own small pooled flash, fireball and smoke, so rapid fire never takes over a grenade's explosion.
- **Magazine ranks** come loaded, and your reserve grows to keep six magazines (M4: 240 / 300; LMG: 750 / 1,000). The Soul Forge's +25% stacks on top.
- **The LMG's heal** applies only to kills made with the LMG, and never takes you above full health.
- **Rank buying at the cellar** works between waves too. Only the first LMG purchase still waits for a wave.

## A harder Sir Blackthorn, woken at his grave (version 190)

**Summoning:** The Last Dawn nuke is gone from the mausoleum. Instead, once the tomb opens on clearing wave 20, step up beside the sarcophagus and press E to speak to **Sir Blackthorn's grave**. It's free and works once per run. The lid slides off and he rises as before. The nuke's model is kept in `mausoleum-nuke.mjs` for later, but the game no longer builds it.

**Sir Blackthorn:**

| | Before | Now |
|---|---|---|
| Health | 110× a walker | **220× a walker** (+100%) |
| Sword | 1.6× contact damage | **2× contact damage** (+25%) |
| Grave lance | 0.85× contact damage | **1.06× contact damage** (+25%) |
| Gravewardens | At 75% and 40% health | **As soon as he steps out of the tomb, and again at 50%** |
| Gravewarden speed | 0.62× walker speed | **0.68× walker speed** (+10%) |

Gravewardens are still slower than brutes. The war cry, the enrage below 30% health, the lance volleys and his 5,000-essence bounty are unchanged.

## No bell rope (version 189)

The Great Rotunda bell's pull rope, hand loop and knot are gone. The bell now just hangs on its chain inside the dome, with nothing dangling down beside the Soul Forge. The bell still tolls when Sir Blackthorn falls.

## Stations on the move (version 188)

The ground floor's perks and Soul Forge now draw you out into the wings:

| Station | Was | Now |
|---|---|---|
| Ironheart | Grand hall, by the entrance | Infirmary, west wall by the gallery door |
| Quickhands | Library partition | Music salon, front wall (Nightstride's old spot) |
| Nightstride | Music salon, front wall | Ballroom, north wall |
| Deadeye | Dining room, front wall | Observatory, west wall |
| Soul Forge | Grand hall, back wall | Centre of the Great Rotunda, under the bell, facing the hall |

- **The forge** now stands on its charred oak block with brass rank plates, under its violet light. There's room to walk past it on either side.
- **The bell** hangs higher, inside the glass dome on a shorter chain (its lip is now 9.2 m up, above the 6.84 m ceiling ring). From the grand hall it's out of sight unless you're within about 6 m of the rotunda doorway. From the rotunda floor you look straight up at it.
- **Upstairs:** the upstairs perks, forge and other stations haven't moved.

## A stone interior (version 187)

The mansion's rooms now match its limestone exterior. Wood is kept for the furniture and the attic.

**Surfaces**
- **Walls:** coursed limestone ashlar, the same stone as the facade, in a slightly different tone for each wing.
- **Floors:** honed limestone flags, laid in random courses with worn edges, small pits and fine cracks. A new seamless 3.2 m texture, `assets/flagstone-v1.jpg`, carries a matching roughness map, so the stone has a soft sheen where it is smoothest.
- **Ceilings:** lime plaster. Rooms under the upper floor have a plaster soffit crossed by carved stone ribs.
- **Trim:** carved stone for baseboards, door jambs and lintels, window surrounds, pilasters and the hall wainscot. The grand stair has stone treads with carved stringers.
- **Metal:** wrought iron for the stair and balcony rails, window mullions, and candle-crown chandeliers and sconces, which replace the old bulb fittings.

**Furniture**
- **Removed:** lounge sofas (ballroom, library, dining room), park benches (conservatory, portrait gallery), the table that stood in for the chapel altar, and the old box hearth.
- **Fireplaces:** four working stone fireplaces with open fireboxes, andirons, logs, embers and animated flames, in the dining room, library, ballroom and music salon.
- **Hung on the walls:** woven tapestries (crest, tree and hunt designs), heraldic banners, a shield with crossed swords, and stained glass in the chapel.
- **New pieces:** oak settles and carved armchairs, suits of armour, iron candelabra, iron-bound chests, refectory tables with benches in the servants' quarters, a stone altar and an oak lectern in the chapel, and stone benches and urns.
- **Upstairs:** tapestries, banners, armour, chests, candelabra and armchairs, all clear of the walkways.

**Cost:** measured in headless renders against version 186, draw calls rose by about 10–14% per room. Triangle counts range from 17% fewer to 9% more, because candle flames use low-poly shared geometry and thin decorations cast no shadows. Real browser frame rates have not been measured.

## A real throwing arm (version 186)

**The arm** used to be a smooth tube with a mitten. It's now built like the rest of the kit:
- **Sleeve:** a field-jacket sleeve with wandering folds that bunch at the elbow, a seam, and a cuff with a buttoned tab.
- **Glove:** a tactical glove with a gauntlet and velcro wrist strap, a leather palm, a hard knuckle guard and back plate, and padded fingers.
- **Hand:** four fingers of natural lengths with three joints each, plus a three-jointed thumb. Together they wrap the grenade with the spoon held against the palm.

**The throw**, still 0.84 s long with release at 0.42 s:

| Time | What happens |
|---|---|
| 0–0.15 s | The grenade comes up into view |
| 0.09–0.32 s | The **left hand** reaches in, pinches the ring and yanks the pin out (with a click), then drops away holding it |
| 0.21–0.37 s | Overhand windup: the hand draws back beside your head, elbow high, and your view leans back slightly |
| 0.37–0.42 s | The whip: elbow leads, forearm follows, the wrist flicks. Your fingers peel open index-first at release |
| 0.42–0.84 s | Follow-through: the arm sweeps down across your body as your view dips, then the hand relaxes and drops away |

- **Aim:** the view sway is exactly level from 0.37 to 0.465 s, so the throw goes precisely where you aim.
- **In flight:** the grenade has no pin, and its **spoon flips off**, tumbling away and clattering to the floor.
- **Build:** the arms are built once and only posed per frame. The two-bone arm solver now orients each bone fully, so sleeves never spin. Hands are keyed by where the fingers point and where the back of the hand faces.

## A real grenade and a real explosion (version 185)

**The grenade** is now a WWII-style Mk 2 "pineapple", in your hand and in flight:
- **Body:** sculpted with 8 columns and 5 rows of raised segments cut by grooves.
- **Paint:** olive drab with grime and a little rust in the grooves, segment edges chipped to bare steel, and faces rubbed lighter where hands grip.
- **Fuse and pin:**
  - a threaded neck and a shouldered striker housing
  - a cupped spoon lever that follows the body's curve
  - a split pin with a pull ring
- **Markings:** a yellow high-explosive band and a threaded base plug.

**The explosion** used to be one flat orange dome. It is now layered:

| Layer | What happens |
|---|---|
| Flash | A white-hot blink |
| Fireball | Noisy fire puffs burst out and cool from white through orange to deep red |
| Soot | Black soot boils up through the fireball |
| Smoke | Grey smoke rolls upward and lingers for about three seconds |
| Sparks and debris | Thrown out on gravity, bouncing off the floor |
| Dust | A shockwave ring and a skirt along the ground |
| Scorch | A ragged mark on the floor that fades after about 16 seconds |

- **Scorch placement:** the scorch sits on the visible surface (paving, porch boards, floors), found from a small index of floor meshes built at load.
- **Mid-air bursts** leave no scorch or ring.
- **Bella:** her cart shells use the same explosion.
- **Cost:** all of it is pooled and built at load, so an explosion creates nothing new. Six can run at once; a seventh reuses the oldest.

## Bella's ranks (version 184)

Bella now costs **1,500 essence** to free (rank I) and has three more ranks. You buy them at her kennel with the **bone chips** her kills drop: walk over a chip to collect it, then go back to the kennel and press E.

| Rank | Cost | What she gets |
|---|---|---|
| I | 1,500 essence | Bella as before: she follows you and bites undead within 15 yards of you. |
| II | 25 bone chips | A gun harness with a back-mounted pistol. It fires every 0.5 s at undead in range, for the starting pistol's damage (32). She still bites. |
| III | 50 bone chips | The back gun becomes a laser: every 0.4 s, 25% more damage than the pistol (40). |
| IV | 75 bone chips | She tows a little cart with a grenade launcher. It fires every second for a hand grenade's damage and blast (450, half at the edge). She also becomes the winged, fire-breathing rat dragon. |

- **Damage is flat at every rank,** like her bite: weapon upgrades, the Soul Forge and Double Damage don't change it.
- **Her guns follow her bite's limits:**
  - They only fire at undead inside her 15-yard guard radius around you, within 14 m of her.
  - They need a clear line of sight.
- **Her shells never hurt you.**
- **Gun kills count as her kills:** they drop bone chips (until rank IV) and earn the usual rewards. Only bites make a zombie turn and fight her.
- **The rat dragon:** it used to be Olivia's bone-chip gift, and now comes with rank IV. The attic hatch still opens when you collect your 25th chip. Olivia cheers Bella on and sends you to the kennel.
- **No per-shot cost:** tracers, laser beams and shells come from small pools made at load, so shooting builds nothing new each time.
- **New runs reset everything:** Bella goes back to her kennel at rank 0 with no gear.

## More faces (version 183)

Every zombie used to wear one of only four walker faces. Now there are many more, with no new art: the existing face sculpting is run again while the game loads.

- **Extra faces, made at load:**
  - Each walker body gets 3 extra heads, so there are 16 walker faces in all.
  - Brutes and ferals each get 2 extra; Grotesque Lurkers get 1.
  - Each extra face has its own nose (broken, thin, flat or rotted away), hair (cap, slicked, lank strands, sparse or bald and stitched), ears (whole, chewed or torn off), jaw width, lips or bare gums, sometimes a torn cheek, and its own skull shape.
  - Only the head is built, not the whole body, except for Lurkers, whose boils need the arms.
- **Every spawn also gets:**
  - One of its body's faces, chosen evenly.
  - Its own head proportions, wider, narrower or longer by up to 7%.
  - How far its jaw hangs.
  - One of 12 shared eye glows, from dim embers to hot, shading from blood red toward orange.
- **Cost:** about 0.7 s more loading and 16 MB of memory. Normals and colours are packed into 8-bit values, which halves the memory. Spawning builds nothing, and no geometry or material is created per zombie.
- **Injuries:** a crushed skull uses the body's own head shape for the dent.
- **Bosses:** elite bosses keep their own faces.

## A stronger flashlight (version 182)

- **Brighter:** intensity is 25% higher, 27.5 up from 22.
- **Longer:** the beam reaches 25% further, 35 m up from 28 m. The falloff is unchanged, so the brighter beam also holds its old edge brightness about 20–25% further out.
- **Wider:** the cone is 15% wider, 0.575 rad up from 0.5. The soft edge and beam texture are unchanged.
- **Unchanged:** toggling it off and on restores the new beam, and blackouts still leave the flashlight alone.

## Crawlers off the floor (version 181)

Crawlers no longer lie flat on the floor with their arms flung ahead. They now carry the chest up on planted hands.

- **Hand-over-hand:** each hand plants ahead of its shoulder and stays down while the body drags over it, then lifts and reaches forward again. A two-bone solve (shoulder and elbow angles worked out from where the hand should land) puts the hand on the floor, so the arms bear the weight. A planted hand slides back exactly as far as the body moves over it, so hands don't skate.
- **Height by legs left:**
  - Both legs: chest up at shoulder height about 0.55 m, with the legs trailing flat along the floor.
  - One leg lost: higher and more upright.
  - No legs: propped well up, nearly upright on straighter arms, with the thigh stumps dragging behind.
- **Pace:** legless crawlers work their hands quicker, but every crawler still moves at 65% speed.
- **Smoothness:** the drop into a crawl stays continuous, and plant and lift-off are eased so nothing snaps.

## Faster crawlers (version 180)

Crawlers now haul themselves along at **65%** of a walker's speed, up from 42%. This covers zombies dropped by leg damage and the legless spawns from v178, and their crawl animation speeds up to match. Like walking speed, it is relative to each zombie's own pace, so a crawling feral is still quicker than a crawling walker.

## The Grotesque Lurker (version 179)

A new enemy, and a second frenzied finale.

- **The Lurker's body:** a hunched, bent-over zombie crusted with large cancerous boils on its back, shoulders, neck, head and limbs. Its swollen belly is slit across and pulled shut with heavy black stitches. A sickly green glow shows between the lips of the wound and through the gut, blinking about every 0.8 s, and faster when it charges.
- **Movement:** it lurches at 125% of the standard zombie speed. Once you're within 12 yards (11 m) with a clear line, it charges at double that, arms thrown forward. Frenzy does not speed it up further.
- **Health:** 1.5× a walker's. It never swings at you.
- **The burst:**
  - If it reaches you, it swells for a third of a second and bursts for 75 damage, with armor and shield taking it first.
  - It also bursts when killed, so kill it at range. Popping one at 2.75 m still costs you about 38 health.
  - The blast reaches 4 m: full damage within 1.5 m, fading to nothing at the edge. It needs a clear line, so walls and floors block it.
  - It deals 450 to other zombies (half beyond 3 m), and zombies it kills pay **35% more essence**.
  - Lurkers set each other off. A Lurker's own burst on reaching you pays nothing and isn't your kill.
- **Spawning:**
  - **Wave 10** now ends in a second frenzied finale, after the regular wave is cleared. *A disgusting stench fills the air.* It sends 20 undead including 2 brutes and 2 or 3 Grotesque Lurkers. The frenzy HUD counts the Lurkers left.
  - **From wave 11**, one spawn in twenty is a Lurker.
- **Map and guide:** Lurkers show as green dots on the radar, and the field guide has an entry for them.

## Battle-worn spawns (version 178)

Zombies that spawn naturally in waves, from graves, or in the cellar or attic can now arrive already damaged. Nothing was modelled per zombie: parts are hidden on the zombie's own joints, crushed skulls are prepared once per body while the game loads, and the stumps and props are a small set of shared meshes.

- **Major injury (1 in 4 walkers and ferals):**
  - A missing forearm (stump at the elbow) or a whole missing arm (stump at the shoulder).
  - A missing jaw, which leaves a torn throat under the upper teeth.
  - A crushed skull: a bloody crater with a rim of broken bone. Two variants are prepared per body.
- **Something through them (1 in 5, brutes included):**
  - Driven clean through and out the other side: a stake, rebar, a pipe or a crossbow bolt.
  - Driven in partway: a kitchen knife, a broken pitchfork or a shard of glass.
  - They can be in the chest, thigh, arm or head, and about 15% of impaled zombies carry two.
- **Legless crawlers (1 in 25 walkers):** these spawn already crawling, with one or both lower legs gone.
- **Light gameplay effects:**
  - Without a jaw a zombie can't bite, so it grabs instead.
  - A one-armed zombie hits for 80% damage.
  - A crushed skull takes 1.25× headshot damage.
- **Hit detection:** missing parts no longer catch bullets, and props and stumps never do.
- **Who can be injured:** dogs and bosses spawn whole. Zombies placed directly by scripts and tests stay whole; only natural spawns roll for injuries.
- **Repeatable:** injuries come from each zombie's own seed, so the same zombie is always injured the same way and no other random draws in the run change.

## Every zombie its own build (version 177)

Each walker is now posed its own way on the same four bodies. Every difference is a small per-zombie offset on joints the animator already drives, so no models, geometry or textures were added.

- **Posture:**
  - Some walkers have a collapsed shoulder, sagging up to 5 cm on either side.
  - The spine can bend to one side and twist.
  - The pelvis can tilt.
  - The head can jut, turn or tilt.
- **Stance:**
  - Some walkers stand crouched, with bent knees and lower hips. Others stand ramrod upright.
  - Stance width varies, and each foot turns out by its own amount.
  - Planted feet still meet the floor.
- **Arms:** each arm has its own hang (forward or back), splay from the body, elbow bend, forearm twist and wrist droop, on top of the existing arm carriages. Many walkers hold their two arms differently.
- **Speed:** walkers' base speeds now stay within 7% of each other, down from the old ±15% spread. The average is unchanged, and the v175 rhythm still makes each one surge and drag.
- **Brutes** get a stiffer, straighter build. Dogs and elite bosses keep their own poses.
- **Seeded:** builds come from each zombie's own seed, so they are reproducible and no other random draws in the run change.

## Damage-driven limp (version 176)

Leg shots used to show only a brief flinch until enough damage dropped a walker to a crawl. Now each leg remembers the hits it took.

- **The shot leg drags:** hits are booked to the leg they struck, using the hit tags on each leg. Within a few strides that leg takes over the drag from the walker's rolled limp. The hand-over is blended per leg, so the stride never snaps.
- **Worse wounds, worse limp:** as the wound grows toward the crawl threshold, the leg's stride shortens, the hip drops harder and the trunk lurches over it each time it takes the weight. The crawl threshold itself is unchanged.
- **A little slower:** a walker slows by up to 18% just before it would crawl. Brutes, which can't be dropped, limp visibly and slow by half as much. Elite bosses limp but keep their pace.
- **Temperament:**
  - A walker on a bad leg no longer lunges.
  - Its weave narrows.
  - It trips up to three times as often.
- Dogs keep their own gait.

## Lively walkers (version 175)

Walkers used to glide toward you at a steady speed. Each one now has a temperament that shapes how it moves across the floor, not just how its limbs swing.

- **Four temperaments:**
  - Shamblers rock and drift.
  - Lurchers surge on every push-off and drag between steps.
  - Stalkers move evenly, head down, and lunge.
  - Staggerers weave and trip.
  - Ferals stalk, and brutes plod heavily.
- **Rhythm:** speed swells and sags with each step, with slower surges and lulls on top, and the chest pitches into each push.
- **Weave:** on open floor they drift side to side. They straighten out within a few metres of you, and on every staircase.
- **Stumbles:** now and then one trips. It pitches forward and throws its arms out, then catches itself and hurries to make up the time. They never trip on stairs or right next to you.
- **Lunges:** from a few strides away, with a clear line to you, a walker may burst forward with its arms out. Each lunge has a cooldown.
- **Body:** weight shift, hip roll and head loll are larger and scale with each zombie's vigor, so lively ones rock and heavy ones barely sway.
- **Same speed:** average speed and arrival times are unchanged; only the shape of the movement is new. Dogs, crawlers and elite bosses keep their own movement.

## No safe corners (version 174)

The storm cellar and Olivia's room were safe places to camp, because every zombie had to come in through one doorway or one flight of stairs.

- **The floor gives way:** stay in either room for 4 seconds and one wave spawn in three claws up through the floor inside it, with you. The others still come in through the usual entrance.
- **Placement:** they rise at the far side of the room, never closer than 3 m, and take about a second to climb out, so there is time to react. A low scrape sounds as each one rises, and a warning shows the first time.
- **Limits:**
  - Brutes can rise in the cellar but not under the garret ceiling.
  - At most 6 floor-born dead are up at once in the cellar, and 3 in Olivia's room.
- **Passing through is free:** leaving the room resets the clock, so a quick stop at the cellar forge or with Olivia costs nothing.

## Solid stairs (version 173)

Zombies could wander under the main staircase and get stuck chasing a player on the landing.

- **Main staircase:** the space beneath it is closed in from the hall wall to the right-hand banister.
  - The hall side is wood-panelled, with battens and a base trim.
  - A back wall runs up to the landing.
  - A sloped collider follows the treads 0.25 m below their surface, so the floor underneath is solid while the flight still climbs normally from either end.
- **Olivia's attic stairs:** once the flight unfolds, three pairs of support posts with cross rails stand under it.
  - Stepped solid blocks fill the space under the treads, stopping 0.5 m below them so crawlers can still haul themselves up the steep flight.
  - The blocks stand only on the upper floor, never the hall below, and switch off again when the stairs fold away on a new run.
  - Anyone standing underneath when the flight lands is moved out to its side.
- **Crawling zombies** (legs shot out) climb and descend both flights.

## Nowhere to hide (version 172)

The whole estate was audited on a 0.2 m grid: ground floor, upper floor and cellar, with every gate open. Each spot the player can walk to was checked for a spot a zombie can stand in within its 1.6 m swing, with the clear upright line the game requires for a hit. Three player-only gaps were closed:

- **West bedchamber:** the double bed stood 0.7 m off the back wall, leaving a pocket by its nightstand that zombies couldn't enter. The bed and nightstand are now flush against the wall and each other.
- **Nursery:** the single bed and its sideboard get the same treatment.
- **Soul Forge (ground floor):** it stood 0.78 m off the hall wall, wide enough to slip behind. It now sits against the wall, with its glow moved along with it.

A re-audit finds no unhittable spot anywhere. A fast regression test guards these three places.

## Full-screen tip while loading (version 171)

The first loading screen now shows **TIP: PRESS F11 TO ENTER FULL SCREEN MODE** a short gap below "PREPARING THE ESTATE", with F11 drawn as a key. Touch devices, which have no F11 key, don't show it.

## Grave essence is a little headstone (version 170)

Grave Awakening's bonus essence drop is now a small headstone instead of a gold crystal. It's a pale, softly glowing round-topped slab on a dark plinth, with a bright gold cross on both faces. It bobs and turns like before, flickers out over its last five seconds, keeps its glow through a blackout, and pays the same 100-essence baseline.

## Expiring drops flicker, and grave essence pays 100 (version 169)

- **Expiry warning.** Drops that expire fade out and back in over their last five seconds: power-ups (20 s), grave essence crystals (30 s) and Bella's bone chips.
  - There are four slow fades, one every 0.75 s, then eight quick ones, one every 0.25 s, in the final two seconds.
  - Each fading drop gets its own see-through copy of its finish, so other drops of the same kind stay solid.
  - The shared finish is restored when it is collected, when it expires, or on a new run.
  - The see-through variants are compiled during loading, so the first fade doesn't stutter.
- **Grave essence.** Grave Awakening crystals now pay a 100-essence baseline (was 25), multiplied by your curse.

## Minimap stays readable while scoped (version 168)

When a scope's black surround fills the screen (the Bushmaster's 10× or the LMG's 3×), the minimap switches to a lit style:
- a pale rim with a soft glow
- a lighter disc
- brighter walls

Before this, the dark disc and faint rim disappeared against the black and only a few dots showed. Zombies stay red, stations keep their colours, and the map returns to its normal style when you stop aiming.

## Bushmaster 1-10x LPVO and BDC10 reticle (version 167)

The Bushmaster's base scope is rebuilt after the Sig Tango-MSR 1-10x28 LPVO, and still magnifies 10× in game.

- **Scope body:**
  - A matte 34 mm tube and a flared eyepiece with a knurled power ring, throw lever and white index marks.
  - A centre saddle with a knurled elevation turret, a large slotted side dial and a windage cap.
  - A modest objective bell with an engraved index line.
  - Flip-up caps hinged on both bells, lying open.
- **Mount:** a one-piece cantilever mount, with a rail clamp and two cross-bolt nuts, a slotted arm, and ring towers either side of the saddle.
- **BDC10 reticle**, after the reference:
  - Heavy tapered black posts from the left, right and bottom edges.
  - Three small pointers either side of centre.
  - A red illuminated horseshoe around the aiming dot.
  - A bullet-drop tree of hash lines with fanning windage dots.

  The hip-fire HUD keeps the precision crosshair.
- **Scoped view:** once fully scoped in, the black mask covers everything but the lens, so the rifle and scope body are hidden. The view through the lens stays a clean circle, without the tube interior or the mount showing.

## Ruger-style Bushmaster model (version 166)

The .450 Bushmaster is rebuilt after the Ruger AR-556 in .450 Bushmaster. It is now all black, with no olive furniture:

- **Receivers:** a flat-top upper with the rail running on into the handguard, brass deflector, forward assist and charging handle. The lower wraps a flared magazine well and steps up over an open trigger guard.
- **Handguard:** a long free-float M-LOK handguard with chamfered edges and an angled nose (the top reaches further forward than the bottom). Each side has a row of M-LOK slots, with a row of angled lightening windows above it. It also carries a QD socket and clamp screws.
- **Barrel and muzzle:** a heavy barrel shows through the slots and past the nose, ending in a radial-port muzzle brake.
- **Furniture:** a short, straight, ribbed .450 magazine, a compact stippled grip, and a slim adjustable stock with an angled sling slot over the buffer tube.
- **Sights:** the 10× scope sits on the rail as before. **Blood Moon (Rank I)** now fits the Raven's holographic sight on a low riser instead of the M4's red-dot tube.

## .450 Bushmaster upgrade ranks (version 165)

The Bushmaster's base magazine is now 8 rounds, with 48 in reserve (six magazines). Once you own it, its east-study rack sells four ranks in order. They last for the run.

| Rank | Name | Price | Effect | Flavor |
|---|---|---|---|---|
| I | Blood Moon | 2,000 | Red dot replaces the 10× scope · 50% faster fire | *The moon turns red, and so does everything beneath it.* |
| II | Bone Orchard | 4,000 | 16-round magazine (reserve 96) | *Sixteen rounds to plant a bone orchard.* |
| III | Ossuary | 8,000 | 24-round magazine (reserve 144) | *Twenty-four rounds. The ossuary is never full.* |
| IV | Executioner’s Calm | 16,000 | Almost no recoil (5% kick) · 2× damage | *The hand is still. The verdict is final.* |

- **Blood Moon** swaps the view model for the same rifle with the M4's red-dot tube on a riser. Aiming becomes a 1× sight picture (48° view) with no scope mask, and the dot sits on the line of fire. Shots cycle every 0.167 s instead of 0.25 s.
- **Stacking.** Magazine ranks take the Soul Forge's +25% capacity (24 becomes 30 at Forge rank 1) and arrive loaded, with their reserve. The capstone's 2× damage multiplies with Forge damage.
- **Racks.** If you can't afford the next rank, any rank rack (Raven, M12, Bushmaster) still hands you the weapon and tells you how much more essence you need.

## M12 shotgun upgrade ranks (version 164)

Once you own the M12, any of its three racks (dining room, upstairs, north wing) sells its ranks in order. They last for the run.

| Rank | Name | Price | Effect | Flavor |
|---|---|---|---|---|
| I | Gravedigger’s Haste | 2,000 | 30% faster reload | *Shells in before the soil settles.* |
| II | Coffin Nails | 4,000 | 16-round magazine (reserve 112) | *Sixteen nails. Sixteen coffins.* |
| III | Charnel Feast | 8,000 | 24-round magazine (reserve 168) | *Twenty-four shells, and the charnel house still hungers.* |
| IV | Requiem Storm | 16,000 | Full-auto at 2× fire rate | *Hold the trigger. Let the requiem play.* |

- **Semi-auto until the capstone.** The M12 now fires one shell per trigger pull, like the Glock: holding the trigger doesn't refire, and pulls during the 0.63 s cycle are ignored. Requiem Storm lets you hold the trigger, at about 0.31 s between shells.
- **Everything stacks.**
  - Magazine ranks take the Soul Forge's +25% capacity per rank (24 shells become 30 at Forge rank 1). Each comes loaded, with a reserve that grows to keep seven full magazines.
  - Reload ranks multiply with the Forge's 25% faster reloads and with Quickhands.
  - Forge damage applies to every shell.

## Minimap scales with the screen (version 163)

- **On PC, the minimap scales with the window height.** It is about 25% larger on a 1080p monitor (about 210px, up from 165px) and caps at 260px on 1440p and larger screens. It never drops below the old 165px.
- **Phones and the touch layout keep the compact 92px map.**
- **The canvas resolution follows the map's on-screen size,** so the larger map stays sharp.
- **The HUD around it adjusts in both positions.**
  - Top right: the essence readout stays under the map, and the wave column leaves room for it.
  - Bottom left: the map stays above health and armor, matching their width.

## Minimap overhaul (version 162)

- **North stays up.** The map no longer spins. Your marker is an arrow at the centre that turns with your view, over a soft, fading view cone. N, E, S and W sit on the rim.
- **Red means zombies.** Every zombie is a red dot: brutes are larger, dogs smaller, and enraged undead get an extra ring. Stations never use red on the map: Ironheart turns soft pink, and the pistol bench turns gold like the other weapon racks. The estate map (M) uses the same palette.
- **Zombies across the whole map.** They show anywhere in the circle, which now covers about 28 m around you. Zombies on another floor appear as hollow red rings, and zombies beyond the edge show as red pips on the rim pointing toward them.
- Walls on your floor are drawn as soft filled outlines, clipped to the circle.

## Raven SMG upgrade ranks (version 161)

Once you own the Raven SMG, either SMG rack (ground floor or upstairs) sells its four ranks, in order, for the run:

| Rank | Name | Upgrade | Cost |
|---|---|---|---|
| I | **Quickened Talons** | 30% faster reload | 2,000 |
| II | **Unkindness** | 70-round magazine | 4,000 |
| III | **Black Flock** | 100-round magazine | 8,000 |
| IV | **Twin Ravens** (capstone) | An MP5 in each hand | 16,000 |

- **Twin Ravens:** both MP5s have no optics and fire alternately at twice the rate. Each gun holds its own upgraded magazine (100 + 100), and one reload refills both from the shared reserve. Aiming tightens the spread and keeps the crosshair up instead of raising sights.
- **Reserve:** it grows with the magazine ranks (240 → 420 → 600, six magazines). The twin guns add no reserve. Magazine ranks and the twin guns arrive loaded.
- **Other details:** each rank has a flavour line in the rack prompt, the HUD names the rank, and once every rank is earned the rack simply hands you the SMG. A new run starts over.

## Pistol reserve grows with its magazine (version 160)

- **Reserve ammo scales with the magazine ranks.** The Glock always carries six full magazines in reserve: 78 rounds at 13, **108** with Long Vigil's 18, and **144** with Grave Hunger's 24. The Soul Forge's +25% applies on top (a forged Grave Hunger holds 30 + 180).
- **The extra rounds come with the upgrade.** Long Vigil adds 30 reserve rounds and Grave Hunger 36 more, on top of the full new magazine. Ammo crates, Max Ammo and the pistol bench restock to the larger reserve.

## Pistol upgrade ranks (version 159)

The first weapon upgrade ladder. The courtyard pistol bench sells the Glock's four ranks in order, and they last for the run:

| Rank | Name | Upgrade | Cost |
|---|---|---|---|
| I | **Bloodsight** | A slide-mounted red dot. Aiming lines up on the red dot, and the factory irons co-witness below it. | 2,000 |
| II | **Long Vigil** | 18-round magazine | 4,000 |
| III | **Grave Hunger** | 24-round magazine | 8,000 |
| IV | **Last Rites** (capstone) | 2× damage, stacking with the Soul Forge, and 50% faster fire | 16,000 |

- Magazine ranks arrive with a full magazine, and the Soul Forge's +25% capacity per rank applies on top (a forged Grave Hunger holds 30).
- The bench prompt shows the next rank, its effect and a line of flavour. The HUD names your pistol's rank.
- Once all four are earned, the bench goes back to restocking just the Glock for 250 essence.
- A new run starts the pistol at rank 0 with its MOS cover plate.

## Bella upgrades (version 158)

- **Wider guard and longer bite.** Bella now defends undead within 15 yards of you (was 12), and her bite reaches 25% farther.
- **Bitten zombies turn on her.** Any zombie Bella bites turns, closes in and fights her until it dies, instead of attacking you, even if it is standing right next to you. When it has no clear way to her, it follows the usual route toward you, which is where she fights. She still cannot be hurt; its blows land with a dull thud. Sir Blackthorn and the elite guardians ignore her and keep hunting you.
- **Bigger rat-dragon fire.** The fire cone reaches twice as far (9.2 m) and is twice as wide at every distance, and the flame plume is drawn twice as long and wide to match. It burns 25% hotter, (40 + 7 × wave) × 1.25 per second, and still grows every wave.

## Feral stalkers and Ashfang hounds at 1.75× speed (version 157)

- **Both specials now move 75% faster than a standard zombie in the same wave.** Ferals were 3× (now 1.75×); Ashfang hounds were 1.5× (now 1.75×).
- **Same speed progression.** Their speed is still the wave's standard zombie speed times this multiplier, so they speed up wave by wave, hit the same late-wave cap, and scale with curse rank exactly like every other zombie.
- An enraged feral now reaches 3.5× speed (Blood Rage still doubles it). Feral damage and Ashfang health are unchanged, and regular dogs stay at 1.25×. The Field Guide entries are updated.

## Larger MP5 (version 156)

- **The MP5 is 15% larger.** Same model, drawn 15% bigger in your hands and on its weapon racks. It is now slightly longer than the M4 and still shorter than the shotgun.
- Aiming is unchanged. The holographic sight's line, the muzzle flash and the support-hand point scale with the gun, and the red circle-dot reticle keeps its usual on-screen size inside the larger sight window.

## Heavier shotgun build (version 155)

- **A chunkier 12-gauge.** The combat shotgun was so slim it read as a rifle. It keeps the same length and layout, but is now built heavier:
  - a wider receiver and a deeper lower receiver
  - a taller, wider handguard
  - a fatter ribbed muzzle device
  - a broader, deeper box magazine and a bigger magazine well
  - a thicker stock and butt pad
- **Iron sights rise with the rail.** The flip-up sights still stand on the rail and the sight line moves up with them, so the glowing post dot still sits right under the point of aim.

## Faster shotgun (version 154)

- **The shotgun fires 15% faster.** The delay between shots drops from 0.72 s to 0.626 s (1.39 → 1.60 shots per second). Damage, pellets, spread, magazine, reload and recoil are unchanged, so its damage per second rises by 15%.

## New combat shotgun with iron sights (version 153)

- **Rebuilt from reference photos.** The M12 is now a magazine-fed combat shotgun:
  - a flat-top black receiver with a full-length rail and a left-side knurled charging handle
  - a slim slotted handguard and a long ribbed muzzle device
  - a ribbed 12-gauge box magazine in a flared well, with a paddle release
  - a squared trigger guard and an ambidextrous safety
  - a hunter-style stock with an angled grip, an adjustable cheek riser with side knobs, a ribbed butt pad and sling mounts
- **Iron sights instead of the red dot.** Flip-up sights stand on the rail: a ghost-ring rear aperture between two wings, and a protected front post with a small glowing dot on its tip so it stays readable in the dark. Aiming puts the post right under the point of aim. The shotgun's aiming pose brings your eye in just behind the rear ring, so the stock stays out of the sight picture.
- Hip-fire still uses the shotgun's pellet-ring crosshair, and its damage, spread and handling are unchanged.
- The old walnut wood texture is no longer built or loaded, because no gun uses wood now.

## Courtyard pistol bench (version 152)

- **New pistol bench beside the front door.** It mirrors the courtyard ammunition crate across the entrance, at the same distance from the door and the facade, under the east windows. The rack shows the Glock 21 on brass pegs above three spare magazines.
- **Restocks the Glock for 250 essence.** Ammo works like every other ammo purchase: your current magazine is unchanged, any reload in progress continues, and the reserve includes enough rounds to leave the magazine and reserve full after reloading. Buying also switches you to the pistol.
- **Free when full.** If the Glock is already topped up, the prompt shows FULL and the bench just switches you to the pistol without charging.
- The bench appears on the ground-floor map as **GL**, and the Field Guide mentions it.

## Smaller MP5 sight and a smooth reload (version 151)

- **Smaller holographic sight.** The MP5's sight is scaled to 84% so it sits in proportion with the slim MP5. It sits a little lower so its base still rests on the claw mount, and the reticle, sight alignment and front-sight co-witness are unchanged.
- **Smooth reload for every gun.** The gun now drops, rolls and tips its muzzle up, holds low through the magazine swap, then rises and settles back into the hip pose without snapping into place.
  - The old reload subtracted its dip after the smoothing step every frame, so the dip piled up. It went about 0.5 deep at 30 fps, 0.85 at 60 fps and 1.7 at 120 fps, and every change in frame time jolted the gun as it came back up.
  - The new pose depends only on how far through the reload you are. It looks the same at any frame rate and stays smooth when frame times vary, which is common on phones.

## Suppressed MP5 sound (version 150)

- **The MP5 now sounds suppressed.** Each shot is a muffled gas puff, a soft low thump and the click of the bolt cycling, instead of the open crack the other guns use. It is about 4 dB quieter than an unsuppressed shot.
- **Clean bursts.** Each report fades out in about 40 ms, inside the MP5's 75 ms fire cycle, so full-auto fire stays a distinct rattle of shots instead of blurring into a hiss. Each shot varies slightly in pitch so long bursts don't repeat one sample.
- Every other gun keeps its sound, and the sound setting mutes the MP5 like everything else.

## New MP5 model (version 149)

- **Rebuilt from reference photos.** The submachine gun is now a proper MP5: a stamped receiver with its side rib and ejection port, a cocking tube with the charging handle parked forward on the left, a slim tapered handguard and a hooded front sight ring. It has a narrow, curved extended magazine with a paddle release, an ambidextrous trigger group with an ergonomic grip and red/white selector markings, a rear diopter drum and sling loops.
- **Suppressor and folding stock.** A full-length suppressor with a knurled mounting collar, machined seams and an end cap, and a skeletal folding stock with an open-loop buttplate.
- **Holographic sight on a claw mount.** A wide-window holographic sight with a flat-topped hood, side dials, rear buttons, a battery cap and a warning label, sitting low on a claw mount. The front sight ring co-witnesses in the bottom of the window. Aiming alignment and the circle-dot reticle are unchanged.
- **Suppressed muzzle flash.** The SMG's muzzle flash and light are much smaller, to match the suppressor.
- Satin black steel and matte polymer finishes; the model stays under the M4's length and within the view-model budget (14 draw calls, about 7,800 triangles).

## Double-tap left to aim (version 148)

- **New touch control.** Double-tap the left side of the screen (the movement side) to look down your gun sights. It works like the AIM button: double-tap again to lower the gun. The second tap still grabs the movement stick, so you can keep walking while aiming.
- Only quick, still taps count (within 0.3 s and close together), so normal stick use never toggles the sights. Left and right double taps are tracked separately: right still fires, left aims.
- The Controls page lists the new gesture.

## Title screen menu (version 147)

- **Cleaner list.** The title screen now reads Enter the Estate, Settings, Controls, Field Guide and Leaderboard, top to bottom, in the same type as before. Controls and Field Guide are separate entries, matching the pause menu.
- **No curse picker until it matters.** The Blackthorn Curse selector is gone from the title screen. Until you unlock rank 1, Enter the Estate starts an uncursed run straight away. Once rank 1 is unlocked, Enter asks which rank to start with: each unlocked rank is listed with its effects, the last one you played is marked, and the next rank shows as locked. Back or Esc returns to the title.
- **Less text.** The mouse-lock instructions and the settings description were removed from the title screen.

## Touch HUD layout (version 146)

- **Stick clears the health panel.** The left movement stick now rests just above the health panel, 10 px clear of it. The game measures the panel (and the shield row when you own one, and the minimap when it is set to the bottom left), so the stick stays clear as the panel grows.
- **Health lines up with the stick.** The health panel moved left so its left edge sits directly under the stick's resting centre.
- **Ammo beside the buttons.** With Tap to Fire Only on, the ammo and weapon readout moves right, next to the 2×2 AIM / JUMP / RELOAD / NADE grid. With the FIRE button shown it stays where it was.
- Touching anywhere on the left still brings the stick to your thumb; it returns to the new resting spot when you let go.

## Tap to fire only (version 145)

- **New touch sub-setting.** Under Touch Controls in Settings, **Tap to Fire Only** explains that you can always fire by double-tapping the right side of the screen (hold the second tap to keep firing and aiming), and turning it on removes the FIRE button. It only shows while touch controls are on, and your choice is saved.
- **2×2 button grid.** With FIRE removed, AIM, JUMP, RELOAD and NADE keep their exact sizes and regroup into a 2×2 grid in the bottom-right thumb corner: RELOAD and JUMP on top, NADE and AIM below.
- Turning it on while FIRE is held releases the trigger; double-tap fire works the same either way.

## Confirm prompts and one Settings page (version 144)

- **Are you sure?** New Run and Main Menu now ask before ending a run (“Your current run ends here and won’t be scored”). Cancel is the default; Esc or B cancels too. After a death there is nothing to lose, so both act at once.
- **All settings in one place.** Graphics quality, look sensitivity (with a live 0.5×–2.0× readout) and sound moved off the title screen into Settings, beside the minimap, headshot, touch and controller switches. Sensitivity and sound are now remembered like the rest (launch-link values still win).
- **Settings on the title screen.** A new Settings entry opens the same page over the title screen; Back or Esc returns to it.
- **Title screen fits.** On 720–900 px tall screens everything, including the menu links, now fits without scrolling, and on a landscape phone the title splits into two columns so Enter the Estate, the curse choice and the menu links are all on screen (before, Enter sat below the fold).

## Pause menu redesign (version 143)

- **One clear list.** The pause menu is now Resume, Estate Map, Settings, Controls, Field Guide, New Run and Main Menu, top to bottom.
- **Settings page.** Minimap position, the headshot indicator, touch controls and controller vibration moved off the main pause card onto their own Settings page. Back (also Esc, or B on a controller) returns to the list.
- **Controls and Field Guide split.** Controls opens only the controls (keyboard and mouse, controller and the touch layout, now listed in full). Field Guide opens everything else. Each view numbers its own sections. The title screen's guide still shows both.
- **Curse panel only when cursed.** The Blackthorn Curse panel beside the pause menu appears only on a run at curse rank 1 or higher.
- **Leaderboard off the pause menu.** The shared leaderboard stays on the title screen and still opens at the end of a run to save your score.
- **Main Menu.** Abandons the current run, clears the estate and returns to the title screen, where Enter the Estate starts a fresh run. It also works from the end-of-run screen.

## Phone-sized event HUD (version 142)

- **Phone check.** The game now tells phones from tablets and computers: a touch device whose screen's short side is 540 px or less counts as a phone. It checks at load, whenever the screen rotates or resizes, and again when you enter the mansion, and switches on a compact phone layout.
- **Smaller random-event UI on phones.** The event badge (Shroud, Surge, Grave Awakening, Blackout) shrinks from 300×114 to about 200×60 px on a landscape phone, with a 12 px countdown and a two-line description. The centre announcement drops from 44 px to 24 px and wraps in a narrower column near the top, so it no longer runs across the whole screen or over the badge.
- **Touch countdown fix.** The touch layout's big wave-number size also enlarged the event countdown to 34 px; it now applies to the wave number only, which fixes tablets too.
- Tablets and computers keep the full-size HUD.

## Double-tap to fire (version 141)

- **New touch fire.** With touch controls on, a quick tap on the right side of the screen followed by a second tap within 0.3 s, near the same spot, fires the gun. Holding the second tap holds the trigger, so automatic weapons keep firing, and dragging it still aims, just like holding FIRE. Lifting it stops. The FIRE button works as before.
- **No accidental shots.** Only short, still taps count: a look drag, a press longer than a quarter second, a second tap that comes too late or lands far from the first never fires. A double tap that has fired does not chain into the next tap.

## Sculpted arms and working elbows (version 140)

- **Arms with anatomy.** Upper arms are no longer capped tubes: a deltoid wraps the shoulder and tapers to a V, biceps and triceps bellies sit front and back, the elbow has bony knobs and a pointed olecranon, and forearms are thick under the elbow and flat at the wrist. Starved and gaunt arms are bony with veins over the biceps, the bloated caretaker's sag under the arm, the brute's are heavy and scarred, and the feral's are wiry. Every arm rolls its own muscle sizes, so the left and right arms differ.
- **Shoulders that slope.** The shoulder cap tucks under the shoulder line instead of sitting on top of it. Bare shoulders run down from the neck through a trapezius, coats gain a sloped shoulder seam, and sleeves roll over into the coat with no open hole at the top. Full sleeves close over the elbow, so a bent arm shows cloth.
- **Moving elbows.** Every zombie rests its elbows at its own bend. The elbows flex as an arm swings forward and open as it swings back, a little behind the shoulder. The forearm and hand are sprung in world space, so they trail the upper arm and follow through rather than moving rigidly with it. Reaching arms grope, clutching arms are held high, dead arms flop, and idle zombies' elbows keep shifting. Elbows never bend backwards.
- **Measured against v139:** across a stride the elbow now moves 0.4–0.65 rad (it was 0.24 rad and identical for every zombie), and peak joint accelerations stay at v139's level. Walkers have about 2,000 more triangles each (roughly 22,000) and the templates build in the same time.

## Steadier walk (version 139)

- **Steady heading.** Bodies face a smoothed walking direction (about 0.4 s) instead of each frame's raw step. The walking direction itself is eased (about 0.14 s), so routes that step from grid cell to grid cell curve instead of zig-zagging. Turns sharper than about 70° are taken at once, so nobody grinds into a wall turning round. Heading jitter on routed walks fell about 3.3×.
- **Slower, longer strides.** Walkers now take about 1.8 steps a second instead of 2.3, so the shamble reads heavier and less like a metronome. Planted feet slide even less (0.08 m per metre walked).
- **Gentler rocking.** Hip twist, pelvis roll, side sway, spine tilt and head sway are smaller and pass through softer springs. Mid-stride twitches are only a flicker; standing zombies still twitch fully.
- **Measured against v138:** pelvis roll is about 10× smoother, spine tilt about 4×, head roll about 2.6× and the knees about 1.5×.

## Smooth gait (version 138)

- **No more tick-tock.** The hip sway, pelvis roll, spine tilt, head roll and limp dip used to flip instantly from one side to the other each time the weight changed legs. They now follow a smooth weight-balance signal: each planted leg's support rises and falls through its stance, and a spring smooths the result.
- **No snapping feet.** Each swing is a Hermite curve that leaves the stance pose at the same position and speed and lands exactly on the next stance pose. The knee and ankle blend between those poses.
- **No hopping pelvis.** The pelvis height is the support-weighted reach of the planted legs, spring-smoothed.
- **Gentler twitches.** Twitch impulses are roughly halved.
- **Measured over 16 walkers:** the worst per-frame acceleration fell about 50× for pelvis sway and roll, 16× for spine tilt, 8× for the ankles and 6× for the hips. Feet still plant (0.16 m slide per metre walked).
- **Fix:** a brute crouched under an upstairs doorway now grabs instead of slamming or swiping, so its fists stay under the header.

## Attack styles and arm carriages (version 137)

- **Attack styles:** each enemy rolls its own, and every style lands on the same contact frame, so damage timing is unchanged.
  - **Grabbers** seize you with both hands and yank you in.
  - **Swipers** cock one arm high and backhand down across the body, alternating arms.
  - **Biters** pin you, rear the head back and lunge in jaw-first.
  - **Flailers** windmill both arms wildly.
  - **Brutes** usually slam both fists down overhead.
  - **Ferals** usually coil, spring and rake with both claws in turn.
  - Sir Blackthorn swipes like a swordsman, and the Gravewarden slams.
- **Arm carriages:** two new ones while walking. A **broken arm** hangs dead and flops on a slack spring. **Clawing** zombies hold both hands up and grasp at the air. They join reaching, dangling, mixed and clutching arms.
- **Blending:** attacks blend the arms toward their own pose rather than stacking on the carriage, so a reaching zombie's grab doesn't end with its arms overhead.

## Organic enemy motion (version 136)

- **Planted feet:** walkers and ferals step instead of skating. During each stance the hip angle is solved so the planted ankle travels back at exactly ground speed, against the pelvis's own pitch. The pelvis height comes from the planted leg. Planted-foot slide dropped from about 0.97 to 0.20 metres per metre walked.
- **A real limp:** the dragged leg has a shorter stance and the good leg a longer one, with one foot always down. The hips dip and roll over the bad leg, and the dragged foot scuffs toe-down.
- **Weight:** the hips sway over the planted foot and drop on the swing side, and the chest counter-twists against the pelvis. Each heel strike lurches the body and nods the chest. Bodies lean into turns.
- **Follow-through:** arms, forearms, wrists, head and shoulders ride on damped springs. Dangling arms swing heavy and loose, and reaching arms tremble.
- **Gaze:** heads track the player with a lagging neck, within limits, and roll with the stride. Irregular twitches jerk the head or a shoulder.
- **Idle:** idle enemies breathe and sway.
- **Turning:** bodies turn at a limited, eased rate (2.4–6 rad/s by type) instead of snapping to every steering wobble. Turning on the spot shuffles the feet.
- **Attacks:** a two-handed lunge. The body rears back, then lunges, and the jaw snaps. Hit timing is unchanged.
- **Hounds:** head tracking, a flexing spine, spring-trailed tails, leaning into turns and ragged panting.
- **Unchanged:** joints, hit regions, ragdolls, crawling and attack timing.

## Blackout event (version 135)

- **Blackout** joins the Shroud, the Surge and Grave Awakening in the random world-event pool. Events can still start from wave 3, with a 40% chance per eligible wave, never two waves in a row, and each type is equally likely.
- **Warning:** the lamps gutter and flicker for three seconds.
- **The blackout:** the lights stutter out, and for 30 seconds every light in the estate is dark:
  - the moon, moonlight and sky glow
  - all lamp, candle and fireplace lights
  - glowing bulbs, windows and fixtures (signs dim)
  - the fog goes black
- **What stays lit:** your flashlight, muzzle flash, zombies' red eyes, pickups and event essence. At the end the lights sputter back.
- **Reward:** kills earn 20% more essence, like every other event.
- **All events last 30 seconds.** The Surge was 25 seconds. Grave Awakening's bonus now lasts the full 30 seconds while its six reinforcements rise.
- **Cost:** no lights are added or removed, so the shader light signature stays fixed. Only intensities and colours change.

## Easter egg: Olivia and the rat dragon (version 131)

*Spoilers.* Every enemy Bella kills drops a **bone chip**: a small, spinning bone that lasts 30 s. Your own kills never drop one. A small tally appears under the wave counter once you have a chip.

- **25 chips** make a hatch creak open in the ceiling of the upstairs **west bedchamber**, where Bella's kennel is. Pull-down stairs drop tread by tread through a hole cut in the wing's ceiling and roof.
- **The attic** is a small garret on the west wing roof. You can see it from outside, with a softly glowing window. Inside are floorboards, a rug, fairy lights, posters, a toy chest and a little lamp, and **Olivia**: a little girl sitting cross-legged on a beanbag, playing a game on a tablet with a controller in her lap. She looks up when you come near.
- **Turn in 25 chips** and she makes Bella a **fire-breathing rat dragon**: crimson bat wings that beat as she runs and flare when she breathes, a segmented spiked dragon tail with a spade tip in place of her curly one, and little horns.
  - **Fire breath:** when an enemy is within 4.6 m she breathes a 1.2 s cone of fire (every 2.4 s), burning every enemy in the cone four times a second for (40 + 7 × wave) damage per second. Walls stop it.
  - **Still a good dog:** she bites between breaths. The upgrade lasts the rest of the run, and her kills stop dropping chips.
- **Climbing:** Bella and ordinary undead (walkers, hounds, ferals) can follow you up and down the narrow stairs. Brutes, Gravewardens and Sir Blackthorn are too tall. The stair and attic aren't on the navigation grid, so climbers get a short steering route: around the side of the flight (never underneath it), line up at the foot, climb, and reverse the route to come down.
- **Secret:** Olivia never appears on the floor map or radar, and the field guide doesn't mention any of this.
- **Resets:** every new run seals the hatch, clears the chips and returns Bella to a plain Maltipoo.

## Sir Blackthorn and the curse ladder (version 130)

**The curse is now a ladder.** The Great Rotunda bell no longer asks you to embrace or resist every five waves. Instead you pick your curse rank on the title screen, under Enter the Estate, and it applies to the whole run from wave 1. The selector lists every rank you've unlocked plus the next one (locked), with a one-line summary of the chosen rank's effects. Rank effects are unchanged. Unlocks and your last choice are saved on this device (`blackthorn-curse-unlocked`, `blackthorn-curse-selected`). The bell stays as the rotunda's landmark and tolls when the boss falls. The leaderboard still records each run's rank; the server now accepts any rank up to the ladder's top (25) at any wave.

**Sir Blackthorn**, the estate's first lord, is the boss. After wave 20, detonating The Last Dawn in the mausoleum (even on an empty estate) wakes him: the sarcophagus lid slides back off the tomb, he rises out of it (invulnerable while he climbs), and steps down in front of it. Regular spawns hold while he fights, and the run carries on as far as you can make it once he falls.

- **Unique zombie:** a walker rig at brute size wearing a breastplate, pauldrons, an iron crown, a cloak and a long sword, with a soul-fire glow in his casting hand. Health is 110× the wave's walker health (curse health included). He uses brute routes and collision, never staggers, and ordinary rage chains don't touch him.
- **Grave lance (ranged):** at 4.5–32 m with a clear line of sight he raises his arm (0.75 s) and throws a glowing lance at 15 m/s. It hits for 85% of the wave's contact damage if it passes within 0.62 m of you, and walls stop it. Below half health he throws three in a fan.
- **Gravewarden (summoned tank):** at 75% and 40% health a Gravewarden climbs out of the ground beside him. It's an iron-helmed, stone-plated brute with a tower shield, 4× brute health, slower than a brute and hitting 25% harder. Shots into its shield do a quarter damage.
- **War cry:** every 15 s (sooner right after a summon), if allies are near, he throws his arms wide and screams. Every undead within 18 m turns red and gets 35% faster and 30% harder-hitting for 10 s.
- **Enrage:** below 30% health he turns red, moves 30% faster and casts about 50% more often.
- **Reward:** 5,000 essence × your curse multiplier and a Max Ammo, plus a health bar while he lives. Beating him at your highest unlocked rank unlocks the next one. Beating him at a lower rank pays out but unlocks nothing.

## Gentler interior lamps (version 129)

Every wing ceiling lamp had the same strength (26) whatever its height. In the ballroom and conservatory, which sit under the second floor, the lamps hang low, about 2.3 m up, so they put roughly three times as much light on the floor as the lamps in the tall rooms. They also blew the wood ceiling just above them out to a hot orange glare.

Wing lamps are now sized by their mounting height, so the floor beneath every one gets the same gentle light. The light source also moved up into the glowing globe instead of hanging below it. Low lamps drop from 26 to about 8 and high lamps from 26 to about 21. Second-floor and cellar lamps, wall sconces and fireplaces are unchanged.

Interior oak is also a little rougher (0.76–0.98 instead of 0.66–0.96). Lamps now give it a soft sheen rather than a bright glossy streak at low viewing angles.

## Controller support (version 128)

Blackthorn plays on a game controller through the browser Gamepad API (standard layout: Xbox, PlayStation and Switch Pro controllers in current browsers). `gamepad-controls.mjs` polls the controller once per frame.

| Control | Action |
|---|---|
| Left stick (click) | Move with analog speed (click to sprint while pushing forward) |
| Right stick | Look |
| RT / R2 · LT / L2 | Fire · aim |
| A / ✕ · B / ○ | Jump · use or buy |
| X / □ · Y / △ | Reload · next weapon |
| RB / R1 · LB / L1 | Grenade · flashlight |
| D-pad | ← → switch weapons, ↑ flashlight |
| View / Share · Menu / Options | Estate map · pause and resume |

- **Look feel:** radial dead zones stop stick drift, and a curved response gives fine aim near the centre. Holding the stick at the rim speeds up turning. Aiming slows the look speed (scaled by scope zoom), and it slows a little more while the sights sit over an enemy body (light aim assist, no snapping). Triggers have press/release hysteresis.
- **Menus:** the controller drives every menu. The D-pad or left stick moves a gold focus ring between buttons (spatial, with hold-to-repeat), A presses, B goes back or resumes, Menu starts or resumes, the right stick scrolls long pages like the field guide, and left/right adjust the quality and sensitivity controls on the title screen.
- **Switching:** the last device used takes over. Any controller button hands play to the controller, and that press also does its job, so A on the title screen starts a run. A real key, click or tap hands play back. Controller play needs no mouse lock. Unplugging the controller restores the device's own scheme. Switching by use is never saved.
- **Feedback:** prompts show **B** for use and buy. The controller vibrates per weapon when firing, harder when you take damage, and with distance falloff for nearby explosions. The pause menu shows the connected controller and has a vibration switch, which is saved.

Browsers only reveal a controller after one of its buttons is pressed with the page open. In embedded previews the Gamepad API may be blocked, so play from the GitHub Pages site.

## Automatic controls (version 127)

The game now picks the control scheme when it loads. Phones and tablets start with touch controls, and computers start with mouse and keyboard. The check uses the device's primary pointer, so touchscreen laptops with a trackpad stay on mouse controls, and stylus phones (which also report a fine pointer) still get touch. It falls back to platform hints in browsers without pointer media queries, and switches live if a tablet gains or loses a trackpad.

The pause-menu switch still works. A change is now remembered per kind of device (touch or desktop) instead of globally, so a choice made on one device never sticks on another. The old global touch setting from versions 121–126 is cleared once, so a phone can no longer stay stuck on mouse controls.

`input-scheme.mjs` already supports a third scheme, controller. Browsers only reveal a gamepad after a button is pressed, so a controller is picked up from the connect event, or at load if one is already known. It takes over when connected, the player can switch away from it, and unplugging it restores the device default. It stays off (`controllerSupported:false` in `game.js`) until gamepad play is added, so a connected controller changes nothing yet.

## Lawn character (version 126)

The lawns were one repeating 3.2 m green tile with 900 identical tufts, about one per 12 m², so the grounds read as flat carpet. At load the game now bakes an estate-wide character map from layered noise and the estate layout, and the turf shader tints the tile with it: broad lush and straw-dry patches, worn earth along path and grave-slab edges, darker moss at the foot of walls and the mansion, shade under each tree, and fine mottling. The tile texture itself is unchanged, so this costs one small texture lookup.

Foliage is now 8,000 tufts in one instanced draw. They grow in clumps of two to nine, densest and longest along paths, walls, tree roots and in lush patches, sparse and short in dry ones, with varied height, width and four blade shades (some with seed heads). A vertex-shader breeze bends the tips with travelling gusts, with no per-frame CPU work. Tufts still root only on real turf, clear of paving and graves.


The flashlight used to paint a flat, overexposed disc with a hard rim on every floor: at arm's length it delivered roughly six times the lamps' light, so almost the whole pool clipped to white and the beam's falloff only showed as an abrupt edge. It now projects a torch-shaped beam: a bright core, a softer corona with a faint reflector ring, and a dim spill that fades smoothly to nothing, with a slightly irregular lens rim. The cone is a little wider and the peak a little lower, so pools on wood and stone show a gradient and their grain instead of a white plate, while zombies at 7–14 meters stay about as visible as before.

Interior oak no longer has a lacquer clearcoat. It is a satin finish whose roughness follows the actual grain and board gaps, with soft worn patches, so lamp highlights break up across boards instead of sliding along them, and the flat ambient sheen on floors is subdued. Outdoor paving, curbs and graves stay rain-wet, but water now gathers in joints and pits while stone faces stay mostly matte. All three patterns are generated at load time from the existing oak and limestone images and a small beam profile, so no new image files are added. The real-shader shadow tests pass for both shadow modes.

## Gait personalities and crawlers (version 124)

The walk cycle was already procedural: legs, calves and feet swing out of phase, arms counter-swing, hips and spine sway, the body bobs and leans forward, flinches recover per body part, and deaths are physical ragdolls driven by shot direction, hit point and weapon force. Version 124 builds on that.

Every walker and feral now rolls its own gait personality at spawn: which leg drags (either one, with a shorter stride and a toe-down scuff that barely lifts the foot), how strongly it sways, how far it hunches, how it carries its arms (reaching forward, dangling, one of each, or clutched), how much it bobs, and how far its arms and hips run behind its legs, so limbs no longer move in lockstep. Twenty zombies roll twenty different gaits from the same shared models, with no new assets.

Enough damage to the legs (40% of a walker's or feral's health) now drops it to a crawl. The fall blends continuously from its current stride over about half a second, during which it cannot attack. Crawlers lie low with their legs trailing, haul themselves forward on alternating arms at 42% speed with their head raised, use a low collision body, still bite if they reach the player, and die into the same physical ragdoll. Brutes and dogs keep their feet. The field guide describes crawlers.

Tests cover gait variety across twenty spawns, either leg dragging, measured arm lag, arm carriage and hunch, the crawl threshold and its exclusions, a continuous drop with no mid-fall attacks, the crawl pose, reduced crawl speed in play, crawler bites and crawler ragdoll deaths.

## Crowd spreading (version 123)

The horde no longer files in nose-to-tail. Within twelve meters, enemies that can reach the player share out approach angles: one directly behind another fans off to its own side, and the group arrives as a ring around the player instead of a queue. Each enemy keeps its personal left/right flank. Slots that land in a wall or have no clear walk are narrowed or dropped. On longer routes, neighbors beside each other drift apart and a crowded enemy prefers its own side, so open rooms carry two or three abreast. A small personal sway, and a blocked enemy shouldering its neighbor a little sideways on flat ground, make the press look alive. Bodies still never overlap, the player still cannot push enemies, attacks are never interrupted by a shove, and stairs still genuinely jam.

In the measured door scenario (16 walkers coming through the main door at a player in the hall), the share of enemies walking directly behind another fell from 69% to about 30%, the crowd now covers all 8 directions around the player instead of 4, and all 16 reach the fight within 20 seconds instead of 11. On the open lawn the figure fell from 21% to 10%, with the group about 25% wider. CPU cost per frame is unchanged in the stubbed harness. Real-browser frame rates remain unmeasured.

## Palladian exterior (version 122)

The front now takes its cue from an English Palladian country house. Eight giant-order Ionic columns, set in pairs on stone pedestals, rise through both storeys around the main entrance and carry a full entablature with architrave, frieze, dentils and cornice. A shallow pediment above holds the family crest in a carved roundel, with statues on its apex and ends. The ground storey is channelled rustication and the upper storey smooth ashlar, both stopping short of every door, window and exit. Pilasters frame each upper bay of the wings. A balustraded parapet with urn-topped dies runs around the whole roofline, with statues on the four corners. Behind the pediment a raised attic tower with tall windows, quoins, a balustrade and five statues stands above the slate roof, visible from the courtyard. The old front dormers and two-column porch are gone.

Only the eight column pedestals add collision. They stand clear of the main door and its open leaves, the ground-floor windows and the courtyard ammo crate, and every upper window keeps its sightlines. Balusters are one shadowless instanced draw. Facade checks cover the portico placement, pediment and crest visibility, the hidden slate gable, statue and tower heights, chimney clearance, clear doorway, landing and side-exit approaches, triangle budgets and collision count. Screenshots were taken in a software-rendered browser; real-GPU frame rates remain unmeasured.

## Storm cellar (version 16)

At wave 10, the pair of storm doors on the north grounds opens automatically. A 24-tread flight descends 4.2 meters to an 18 × 20 meter underground armory beneath the observatory. The cellar has its own floor map, clear circulation, storage crates, structural ribs, pipes and cyan fixtures. Navigation connects all three floors; players, walkers and both dog types use the same stairs. Ground terrain is cut around the stair opening. Collision, shots, grenades, ragdolls and interactions respect the underground floor and ceiling.

Press E to buy the Warden belt-fed LMG for 5,000 essence; key 4 selects it afterward. It holds 100 rounds with 500 reserve, deals 62 base damage, fires every 0.09 seconds and reloads in 5.2 seconds. Existing ammo crates, Max Ammo, Quickhands, Deadeye, Double Damage and forges work with it. Taking it once triggers a frenzy for the remainder of that wave: all live and newly spawned enemies move 40% faster, spawn intervals become 40% of normal, and half a normal wave of reinforcements (at least 12) is added. The 32-live-enemy budget remains. Claiming it during intermission reopens that current wave for the ambush. Frenzy clears when the wave ends, while the LMG stays owned.

The Aegis body armor vests in the cellar and upstairs east study each cost 2,500 essence, can each be purchased once per run, and grant a separate shield equal to maximum health: 100 normally, 200 with Ironheart. It absorbs enemy and self-grenade damage first, with excess damage spilling into health. A dedicated cyan HUD bar displays current shield/capacity. Armor does not regenerate or refill from health recovery. Buying Ironheart after armor scales capacity and remaining armor proportionally, preserving any depletion. Purchases deduct spendable essence without reducing the leaderboard score. A new run restores both vests and the LMG and closes the cellar.

## Family cemetery and mausoleum (version 18)

The east grounds now open through a seven-meter iron gateway into a 26 × 42 meter family cemetery. Fourteen marked graves, stone burial slabs, iron boundary fencing, warm fixture lenses and crossing stone paths surround a small eight-by-nine-meter Blackthorn mausoleum. The ground map fits the expanded estate and marks the cemetery and tomb. Six new reachable spawn positions keep this area integrated with normal waves.

The mausoleum remains sealed while wave 20 is active. Clearing wave 20 automatically removes the padlock and warning sign, swings both iron doors open, announces the unlock and refreshes enemy navigation. The chamber contains an ornamented sarcophagus with walkable side passages, fluted columns, a triangular pediment, an arched door surround, a family crest and a rear epitaph. It can be entered and left freely afterward; zombies follow through its doorway. The roof, walls and tomb have collision, and outdoor rain is hidden inside. A new run reseals the doors. The graveyard uses static batches and existing lighting; door transforms only update while opening.

## Verification

Run `npm test` for automated scene initialization and gameplay checks. These use the real Three.js geometry, camera, collision and raycasting with a stubbed renderer and a parsed DOM from the actual game HTML. They cover navigation, movement, waves, purchases, upgrades, shooting, reloading, death, restart, actual entry-button handlers, failed module loading, and denied or unsupported mouse capture. They also verify the 1.15 brightness multiplier, the center of each weapon's aimed reticle, clear scope sightlines, frame/depth pass ordering, weapon self-occlusion settings, full-mansion navigation, physical clearance along routes, local spawns in all twelve sections, and map pause/resume behavior. Capture tests cover successful locking, delayed permission, rejected promises, legacy event-only implementations, unavailable APIs, retry recovery, Escape event ordering, cancelled late acquisition, stale promise rejection, and losing focus. Unlocked movement and firing are disabled, and the simulation remains paused until capture succeeds. Zombie checks also verify all five designs and seven fall profiles, pose continuity, fixed-step physics, floor/wall contacts, bone lengths, settling, contact timing, corpse limits, mesh budgets, and resource cleanup. Stair checks use actual W/S controls to climb and descend, confirm smooth camera elevation and ceiling clearance, trace physically walkable routes through all ten upstairs areas, and test collision layers, railings, purchases, maps, zombie stair traversal, upper-floor ragdolls and grenades, and blast shielding. Ashfang checks cover the wave-six gate, rarity, exact 1.5× speed, distinctive geometry, bounding gait, cached resources, headshots, ragdoll settling and two-way stair traversal. Dog checks cover their silhouette, four-legged gait, bite timing, spawn sequence, speed, hit regions, kill rewards, stair traversal and ragdoll settling. Upstairs geometry checks verify the 25% ceiling increase, 180 unobstructed rays through fifteen windows, window collision containment, and twelve clear doorways after static batching. Station checks trace walkable routes from all eleven upstairs purchase approaches and verify every purchase type, duplicate perks, affordability, and floor separation. Power-up checks cover the three icon types, grenade drops, free throws at zero reserve, exact expiration, refresh without stacking, pause/resume, simultaneous bonuses, refills, restart and floor separation. Performance checks verify fixed light membership through explosions, pickups, flashlight toggles and resets; independent animated rigs backed by shared assets; and 6,000 indexed-versus-linear collision comparisons. `npm run profile` runs a CPU-only stress sample after the test suite. These checks do not validate WebGL shader compilation, pointer-lock behavior in a real browser, screenshots, audio playback, or visual quality. Browser QA was blocked by the managed preview supervisor failing to mount proc in this execution environment.

## Hosting

Game source assets are in `public/game/`. The Vinext Worker redirects the existing site root to the game and serves `/api/leaderboard`. Build through the Sites build helper; deployable output is generated in `dist/`. `.openai/hosting.json` retains the existing Site identity and persistent D1 binding `DB`. Three.js is MIT licensed; its license is included in `public/game/THREE-LICENSE.txt`. Fonts are Barlow and Barlow Condensed, licensed under the SIL Open Font License.

Generated material assets and their prompts are recorded in `GRAPHICS.md`.

Mouse capture uses the standard [Pointer Lock API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API). Browser permissions and sandboxed previews can prevent capture; the game does not attempt to override those restrictions.

Cellar regression checks cover the wave-10 gate, two moving leaves, real W/S stair traversal, two-way zombie/dog pursuit, floor-aware interaction and shooting, armor absorption/overflow and Ironheart order, LMG ammo/reload/selection, one-time rewards, actual frenzy speed, natural wave completion, grenade/corpse support, ceiling blast shielding and reset. The LMG also passes the existing clear-optic center-ray tests. Browser rendering and screenshots could not be verified in this environment.

Graveyard checks verify the actual keyboard entrance, physically walkable exit, local spawn reachability, cemetery bounds, map use, a locked mausoleum throughout wave 20, natural wave completion/unlock, animated doors, immediate navigation refresh, chamber entry/exit, sarcophagus collision, ceiling clearance, two-way zombie pursuit and fresh-run reset. The existing cellar, dog, station, scoring and upstairs behavior remains covered by the gameplay suite. Browser screenshots and rendering remain unverified.

## Shared public leaderboard (version 38)

**GitHub Pages (v132).** Pages serves only static files, so on `*.github.io` the same leaderboard UI talks to Supabase instead of `/api/leaderboard` (`public/game/leaderboard-supabase.mjs`). The database setup is `supabase/leaderboard.sql`: run it once in the Supabase SQL Editor (it is safe to re-run and never deletes scores). Players have no direct table access; the publishable key can only call `get_leaderboard()` and `submit_score(run)`, which apply the same name, number, curse-rank and run-UUID retry rules as `server/leaderboard.mjs`. The Pages board and the Cloudflare Site board are separate.

The main menu and pause screen open the shared top-50 leaderboard. Dying opens the board with an optional display-name form and an immutable snapshot of total essence earned, wave, kills and survival time. Spending essence does not reduce the submitted score. Ranking uses score, then wave, then kills, with earlier submissions breaking remaining ties. Names are displayed as text. Submissions use bound SQL parameters, strict size/type limits and same-origin browser requests. Each completed run has a UUID; retries of an identical submission return its existing row, while conflicting reuse is rejected. This is a friendly leaderboard for the browser game, not server-authoritative anti-cheat.

Scores live in the Site's persistent Cloudflare D1 database under the fixed `DB` binding, in `leaderboard_scores`. Every future game version reads the same records. The release number is stored with each run but never partitions or resets the leaderboard. `db/schema.ts` and the immutable initial Drizzle migration define the table; append future schema migrations without deleting scores. There is no runtime table recreation, seed/reset script or client-only leaderboard. The Site is public: anyone with the game link can read and submit scores without signing in. Both the landing page and standalone play tab use the same server endpoint and database.

The browser remembers the chosen name and a pending death snapshot as a retry aid. Failed or timed-out submissions retain the exact payload so an acknowledged-late retry cannot duplicate the run. A successful save clears that pending snapshot and reports its current rank. These browser copies are not the shared record of scores. While the board is open, it refreshes every 15 seconds and immediately on returning to the tab. Refreshing stops when it is closed or the tab is hidden. A temporary failure keeps the last displayed scores and schedules a retry; score submissions still require the player to press Add My Score. Old local personal-best entries cannot reconstruct past run scores and are not imported.

Server tests use real SQLite with the generated migration, close and reopen a file-backed database, and submit another release's score to verify cross-version retention. They cover ranking, the top-50 limit, duplicate/conflicting retries, input validation and unavailable storage. UI tests cover optional submission, death snapshots, offline/reload retry, name remembering, text-only rendering, concurrent requests, blocked local storage, two independent anonymous visitors using the real database handlers, automatic refresh, hidden/closed panels, and stale-response isolation. All prior game checks also run from the moved source directory. Browser rendering remains unverified in this environment.

## Grounds cleanup (version 20)

Textured grass covers the front, side and north lawns and the cemetery. World-aligned turf tiles match across terrain edges, with mipmaps, anisotropic filtering and a matte surface. Nine hundred short crossed grass tufts share one instanced draw and stay clear of stone pathways, grave plots, walls and the cellar stair opening. The cemetery entry path now connects to the east walkway. Loose paving fragments and the old graves outside the cemetery have been removed; all fourteen headstones remain inside the family cemetery. The adjoining strip is labeled East Grounds.

Geometry checks verify grass and paving surfaces, continuous UVs, foliage placement, the open terrain above the cellar stairs and headstone bounds. The gameplay, database and leaderboard UI suites remain the release checks. Supported browser rendering and screenshots remain unavailable in this environment.

## Crowd pathing and upstairs spawns (version 21)

Living walkers, brutes and both hound variants have size-appropriate body collision with each other and the player. Crowds can fill a doorway or staircase without compressing into one another or being pushed aside by sprinting. Killing a blocker immediately frees that space. Collision checks use actor height so enemies on another floor do not obstruct movement. World collision and small movement substeps still protect walls, stair treads and railings.

Individual route seeds break shortest-path ties differently, while crowd density favors a clear alternative at a junction. Left/right approach tendencies, local avoidance and bounded sidesteps around blocked neighbours add variation. Route choices always reduce the navigation distance; crowded stairs can still genuinely jam. Replanning and line-of-sight queries are staggered, the existing navigation field is reused and the 32-live-enemy limit remains.

From wave 11, one randomly chosen slot in each group of four spawns uses the second floor when a safe upstairs position is available. Candidates must be supported by the full floor footprint, outside walls and furniture, more than ten meters horizontally from the player, clear of living enemies and connected to the player by navigation. A blocked upper pool falls back to the ground pool. Spawns initialize both simulation and model height on their selected floor. Existing enemy-type frequency and wave scaling apply to both floors.

Regression checks exercise a staircase blocked by three live enemies, player sprint contact, a queue of followers, removal of a central blocker, floor-separated collision, visibly different approaches, different junction routes and crowd-aware branch selection. Spawn checks cover the wave-10/11 boundary, floor support, world/body clearance, render height and actual upstairs-to-ground pursuit. Browser rendering remains unverified in this environment.

## Readable menu and HUD (version 22)

Landing-page copy, buttons, settings and supporting labels are 50% larger; both Blackthorn wordmarks retain their original size. The gameplay overlay uses doubled text, health/shield bars, perk icons, power-up badges, radar, crosshair and hit markers. The radar has a matching 300-pixel backing canvas. Corner stacks keep equipment together and put the radar beside vitals on shorter, wider desktop screens. Landing copy can scroll on shorter screens without covering the bottom settings.

This release excludes the cancelled leaderboard changes; the existing leaderboard service, score data, submission behavior and database binding are unchanged. Browser visual QA is unavailable in this environment; the existing gameplay/startup/database/UI checks and the production build verify the update.

## Standalone launch and mouse capture (version 23)

Enter the Estate opens the canonical game URL in a new tab directly from its click handler, carrying quality, sensitivity and sound settings. The new tab prepares a paused run and presents Click to Play; that fresh click requests pointer lock and initializes audio. No capture is attempted during page load, and the launched page never opens a second tab. Esc and loss of mouse capture still pause the simulation. Focus-option failures fall back to ordinary canvas focus, and permission rejection leaves an enabled retry control. Startup tests exercise both tab roles, embedded play URLs, settings transfer and launch failures; gameplay tests cover paused preparation, capture, retry, Escape and legacy focus. Visual browser QA remains unavailable.

## Blood Rage (version 24)

Every enemy death rolls an independent 15% chance for each living, non-enraged enemy within a 6-meter 3D radius. Walkers, brutes, ordinary dogs and Ashfangs all qualify, and all kill sources use the same trigger. Blood Rage permanently doubles the enemy’s existing movement speed and multiplies its melee/bite damage by 1.25. It never stacks or expires; later nearby deaths can retry enemies that did not enrage. Killing an enraged enemy can trigger its neighbors. Wave speed, type differences, injury slows, attacks and the cellar frenzy still apply (rage plus frenzy is 2.8 times ordinary movement speed).

Cached red emissive materials and bright red radar blips identify enraged enemies without extra lights or per-kill geometry/material creation. Both normal and enraged variants are warmed during loading. Checks cover threshold/radius boundaries, independent rolls, repeated deaths, all four types, real movement and melee damage, persistent state, non-stacking, new-run cleanup and material isolation. Browser visual QA remains unavailable.

## Feral stalkers (version 25)

From wave 7, approximately one in eight total spawns is a Feral. Brute and Ashfang reserved slots keep their priority; a compensated roll on the remaining slots gives about 12.5% overall rarity. Ferals have normal walker health, three times the current wave’s base movement speed and twice standard melee damage. Wave scaling, collision, stairs, headshots, ragdolls and Blood Rage apply: an enraged Feral moves at six times baseline and deals 2.5 times baseline damage, before other applicable movement modifiers.

A tenth cached rig adds a lean pale body, exposed rib ridges, bald head, long claws, green eyes and a forward-leaning sprint. Green radar markers distinguish normal Ferals; enraged ones use the existing red palette. Tests cover the actual wave-6/7 spawn boundary, global rarity, reserved slots, asset reuse, real movement/damage, rage, wave scaling, headshots, dynamic death and stair traversal. Browser visual verification remains unavailable.

## Exterior surface cleanup (version 26)

Expansion doorway trim now projects seven centimeters beyond each wall face instead of sharing its surface. Jambs end below the lintel, and molding ends are recessed to avoid overlapping wall end caps and exterior corners. North window backing panels sit clear of the interior wall finish. Fifteen obsolete ground-floor coffer panels are explicitly removed during upstairs construction; previously they were raised into the upper ceiling slab and competed with its top surface.

Regression rays inspect the actual static batches at all ten exterior doorway jambs and all fifteen former coffer positions, checking clear depth separation and the intact ceiling slab. Existing movement, stairs, window sightlines, combat, startup and leaderboard checks remain release gates. Browser screenshots and WebGL visual confirmation are unavailable in this environment, so these geometry checks cannot confirm the precise flashing spots seen during play.

## The Enraged Pair (version 27)

After all regular wave-5 enemies are defeated, two brutes arrive as a boss finale. Both spawn permanently enraged, with twice normal brute movement speed and 25% extra brute melee damage. Their normal wave-5 brute health, kill rewards, collision, attacks and dynamic deaths remain in use. The existing cached Blood Rage materials give them a red glow without extra lights or GPU asset creation. The encounter announces its arrival and shows two independent health bars and a remaining-boss count.

Safe, reachable ground-floor spawn positions follow the player's current location, including routes to an upstairs player. Blocked placements retain their queued slots and retry. Wave 5 stays active until both bosses die; only then does the normal 550-essence wave bonus, recovery, grenade restock and 12-second intermission begin. The encounter runs once per playthrough and resets completely with a new run.

Checks cover the last regular enemy trigger, exactly two forced enraged brutes, safe placement, cached rage appearance, non-stacking buffs, health-bar damage updates, pause/resume, one surviving boss holding the wave, a single clear reward, wave-6 progression, blocked placement retries, upstairs connectivity and fresh-run reset. The cellar geometry check now holds random wave spawns during its gate/stair traversal so an unrelated crowd cannot block the test; live pursuit and crowded stairs retain their separate checks. Browser rendering and screenshots remain unverified in this environment.

## Cellar relocation and mausoleum collision (version 28)

The storm cellar flight sits in the rear-left grounds, 24 meters left of its former position and seven meters farther north. Its southern edge is eight meters from the mansion boundary, and the north fence has moved back twelve meters to provide a similarly clear approach at the top. Grass fills the former opening. Revised paving, the gate interaction, sign, floor maps, terrain cutout, collision and navigation all use the new location. A roofed seven-meter passage connects the flight to the 18-by-20-meter armory beneath the west wing. A surface end rail prevents accidentally stepping into the deep end; the underground route passes beneath it. The wave-10 unlock, LMG frenzy and separate body armor mechanics remain intact.

The mausoleum trap was reproduced by jumping toward the sarcophagus: the old body collider stopped below the visible lid, so a jump could enter the coffin footprint and fall to ground level inside the blocking box. Collision now covers the complete lid, and its top is a real landing surface. Footprint-aware support prevents falling back into the collider while walking off an edge or corner. Moving the coffin forward also widens the rear passage and gives enemy navigation a clear connected row behind it.

Actual keyboard checks traverse the rear mansion doorway, the new flat cellar approach, staircase, passage and armory. They verify the end rail, updated navigation portals, two-way zombie/dog pursuit, pickups, shooting, grenades, frenzy and maps. The reproduced mausoleum jump can exit freely; falling onto the lid lands safely, and every edge and corner can be walked off and followed by an exit through the doorway. The full gameplay, boss and persistent leaderboard suites pass. Browser screenshots and WebGL visual confirmation remain unavailable.

## Compact gameplay HUD (version 29)

Gameplay HUD text, health and shield bars, perk icons, power-up badges, ammo display, crosshair, hit markers and boss indicators are half their previous size. The compass/radar is now anchored in the top-right corner, with essence and kills directly beneath it. Its 300-pixel backing canvas renders at 150 CSS pixels to keep the smaller display sharp. The location label has its own position away from the compass stack.

The bottom HUD now correctly contains both the health/perk and equipment groups; control hints and the frame counter are also inside the gameplay overlay. All existing dynamic element IDs are retained. The landing page keeps its existing typography. Browser visual QA remains unavailable in this environment; release checks use the parsed DOM, existing game/startup/leaderboard suites and the Sites production build.

## Larger and tougher brutes (version 30)

Regular brutes and both wave-five bosses have 33% larger models in all three dimensions and 33% more current/maximum health at every wave. Their health multiplier is now 3.192 times standard wave health, compared with 2.4 previously. Their existing speed, damage, spawn frequency, kill rewards and permanent boss enrage remain in use. Both cached templates and live clones use the same uniform scale; articulation, hit regions and ragdoll particles follow the larger body without adding geometry or materials.

Body collision and safe spawn clearance match the increased width and standing height. Brutes share a separate navigation field that accounts for their larger dimensions; fields update with the normal player-target and gate changes rather than being rebuilt for each enemy. They bend their knees and hunch before entering the upstairs area or mausoleum to clear the lower headers while retaining their full model scale.

Regression checks compare rendered bounds, verify actual damage survival and existing rewards across waves 5–40, retain shared GPU assets, and exercise crouched walking/flinch/attack clearance, two-way stair pursuit, routes from four upstairs rooms, and mausoleum entry/exit. The existing boss, gameplay, startup and persistent leaderboard checks remain release gates. Browser screenshots and WebGL visual verification remain unavailable in this environment.

## Soul Forge model and weapon bonuses (version 31)

Both Soul Forges now feature a beveled iron anvil with a curved waist, flared base, polished face and tapered horn on an oak block with iron bands. A faceted violet soul stone, cyan seams and two orbiting embers hover above it. Both stones rotate and bob, with a shared emissive pulse. Static components remain batched; the stone components explicitly retain their animated transforms. The model fits the existing interaction locations and upstairs ceiling, uses the existing lighting, and creates no geometry or lights during play. Forge signs, interaction descriptions and the field guide describe all bonuses.

Forging the selected weapon still costs 4000 essence and doubles its damage. It now reduces reload duration by 25%, increases magazine capacity by 25% and increases maximum reserve ammunition by 25%. Whole-round capacities round upward. Quickhands multiplies the shortened reload duration by its existing 0.5 factor, regardless of purchase order. Forging during an active reload retains the percentage complete while shortening its remaining time and filling to the new magazine capacity. Current carried ammunition is retained on purchase; subsequent reloads, ammunition purchases and Max Ammo use the expanded capacities. Duplicate purchases cannot charge or stack. Each weapon keeps its own upgrade state until a new run restores the base inventory and timings.

| Forged weapon | Magazine | Maximum reserve | Reload without Quickhands |
| --- | ---: | ---: | ---: |
| M4 rifle | 38 | 225 | 1.725 seconds |
| M12 shotgun | 10 | 70 | 2.1 seconds |
| Raven SMG | 50 | 300 | 1.5 seconds |
| Warden LMG | 125 | 625 | 3.9 seconds |

Checks exercise the actual purchase, raycast damage, reload timing/completion, reserve transfer, pause/resume, weapon switching, refills, duplicate/insufficient purchases and restart paths. Geometry checks verify the floating air gap throughout the animation, preserved dynamic components on both floors, ceiling clearance and stable light membership. The full gameplay, boss, startup and persistent leaderboard suites remain release gates. Browser screenshots and WebGL visual verification remain unavailable in this environment.

## Release notes

The landing menu’s Change Log shows every release from v1 onward. `public/game/changelog-data.mjs` is the shared release history and source of the leaderboard’s current version. Append a dated entry for every player-facing change; preserve published entries. Update the current asset version queries and startup test, then run `npm run release:seal`, `npm test` and the Sites production build before publishing. The required release check compares all game assets and application/database source to the sealed release and rejects stale notes.

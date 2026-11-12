# BLACKTHORN: DEAD TIDE
## Island Survival Mode — Game Design Specification
**Design Version:** 1.0  
**Map Reference:** Concept 1.5 — Open Island (v2)  
**Status:** Design specification — not yet implemented

---

# 1. GAME MODE OVERVIEW

## 1.1 Concept

Dead Tide is an endless survival mode for Blackthorn: Midnight Siege.

Unlike the mansion's traditional wave-based gameplay, Dead Tide features continuous enemy spawning, escalating difficulty, and uninterrupted combat.

The player is stranded on an abandoned tropical island approximately the size of the existing mansion map. Zombies continuously emerge from the shoreline and eventually begin appearing from concealed interior locations.

Every 20 enemy kills, the threat level increases. Enemies become progressively stronger, faster, more numerous, and more dangerous.

The experience begins as slower-paced survival horror and gradually becomes increasingly frantic, eventually transforming into a relentless fight against overwhelming numbers.

**Primary objective:** Survive as long as possible while eliminating as many enemies as possible.

**Core principles:**

- No traditional waves or between-round breaks.
- No interruption when threat levels increase.
- Maximum of 45 simultaneously active enemies.
- Continuous movement throughout the entire island.
- No intentional dead ends, inaccessible corners, or mandatory chokepoints.
- All existing weapons, weapon ranks, upgrades, power-ups, and applicable progression systems are retained.
- Separate Dead Tide leaderboard.

## 1.2 Gameplay Identity

The mode should evolve naturally through four phases:

1. **The Unease:** Slow, atmospheric survival with relatively few enemies.
2. **The Hunt:** Increasing pursuit pressure, more dangerous enemies, and less downtime.
3. **The Swarm:** Large groups, flanking enemies, and increasingly difficult positioning.
4. **The Apocalypse:** Sustained combat against a nearly continuous maximum-strength enemy population.

The player should feel the increasing pressure rather than experience abrupt changes between phases.

---

# 2. ISLAND MAP DESIGN

## 2.1 Overall Layout

The island combines the open movement flow of Concept 1 with the terrain identity and central elevation of Concept 4.

Its approximate playable footprint should match the current mansion map, adjusted as necessary to accommodate outdoor enemy navigation and up to 45 simultaneous enemies.

The island is generally circular or slightly oval, surrounded by dark ocean water, rocky shores, shallow beaches, and scattered tropical vegetation.

A modest hill rises at the center, supporting a small communications compound.

The player must be able to travel around the island's perimeter or across its interior without being forced through narrow passages.

## 2.2 Primary Movement Network

The island should contain three interconnected movement systems.

### A. Perimeter Loop

A continuous walking and running route follows the shoreline around the entire island.

Characteristics:

- Complete 360-degree circulation.
- Wide enough for the player to maneuver around approaching enemies.
- Sandy beaches, rocky ground, and worn trails.
- Occasional visual obstructions without creating impassable bottlenecks.
- Multiple connections to the island's interior.
- No enclosed shoreline pockets that trap players.

This is the primary long-distance survival route.

### B. Interior Cross-Routes

Multiple connecting trails allow the player to cut across the island rather than always following the shoreline.

These should include:

- Northwest jungle to central hill.
- West shipwreck area to southern coastal camp.
- Northern beach to hilltop compound.
- Northeast bunker area to hilltop compound.
- Central hill to eastern Soul Forge.
- Central hill to southern dock.
- Southwest camp toward southeast cove.

Paths should intersect naturally, creating alternate escape routes and opportunities to reverse direction.

### C. Central Hill Routes

The central hill is an open, gentle rise rather than a defensive plateau or elevated fortress.

**Critical requirement: The hill must be accessible from all sides.**

Design targets:

- At least six broad, continuously walkable approach directions.
- Gentle, mostly unobstructed slopes.
- No surrounding cliffs, fences, or retaining walls blocking entry.
- No required staircase or narrow ramp.
- Zombies can pursue the player up the same terrain.
- A circular route around the hill base.
- Shortcuts crossing over the summit.

The hilltop should offer an unobstructed or near-unobstructed view of the entire island, including all major shoreline areas.

It is intended to be a useful observation point, **not a defensible safe zone**.

---

# 3. ISLAND LANDMARKS

The island should feel abandoned, weathered, and believable. Avoid large buildings, elaborate military installations, or unnecessary structures.

| Landmark | General location | Purpose |
|---|---|---|
| Lookout Compound | Central hill | Radio shack, communications tower, Bushmaster weapon station |
| Bunker Entrance B-01 | Northeast interior | Sealed entrance reserved for future content |
| Jungle Ruin | Northwest interior | Exploration landmark and SMG station |
| Shipwreck Cove | Western shoreline | Wrecked vessel, shotgun station |
| Coastal Camp | Southwest | Abandoned campsite, assault rifle station |
| South Dock | Southern shoreline | Broken wooden dock and LMG station |
| East Cove | Southeast interior/shoreline | Pistol station and abandoned equipment |
| Soul Forge | Eastern interior, near hill base | Weapon upgrade location |
| North Beach | Northern shoreline | Open traversal space and major enemy emergence area |

## 3.1 Central Lookout Compound

The central hill contains a small, abandoned communications compound.

**Required elements:**

- One small radio shack.
- One weathered communications tower.
- A small satellite dish or antenna.
- Scattered abandoned communications equipment.
- A Bushmaster .450 weapon purchase station.
- Modest environmental props such as crates, barrels, and damaged fencing remnants.

The radio shack and tower must appear as one cohesive compound.

Keep the compound compact so it does not interfere with hilltop movement or line of sight.

The Bushmaster station should be easily identifiable and positioned on the accessible hilltop.

The shack does not need a playable interior. An exterior structure with decorative windows and a functional weapon station is sufficient for the initial implementation.

## 3.2 Bunker Entrance B-01

The bunker entrance replaces the radio shack's previous northeastern position.

It is built into a small rocky embankment, with an abandoned reinforced-concrete entrance and a sealed metal door.

Suggested atmospheric details include:

- Faded B-01 identification lettering.
- Rusted reinforcement and water stains.
- Small warning lights.
- Abandoned equipment crates.
- Subtle electrical humming or ventilation sounds.

**The bunker is reserved for future gameplay.**

During initial release:

- The bunker must remain inaccessible.
- Do not build or activate the underground interior.
- Do not create a functioning entrance or transition.
- Do not introduce bunker-specific enemies or rewards.
- The surrounding terrain must remain navigable.
- Preserve sufficient space for a future underground level and entry system.

The entrance should feel mysterious without implying that it is currently accessible.

## 3.3 Shipwreck Cove

A damaged fishing or transport vessel rests against the western shoreline.

The wreck is partly submerged, with damaged deck sections, scattered debris, and weathered equipment.

Its primary purpose is environmental storytelling and establishing a recognizable western landmark.

The shipwreck must not create a narrow dead-end area.

## 3.4 Jungle Ruin

A modest stone ruin lies in the northwest, partially reclaimed by tropical vegetation.

Avoid large temples or elaborate structures.

A few broken stone walls, arches, and foundations are sufficient.

The area should provide visual variation while remaining open enough for normal enemy pursuit.

## 3.5 Coastal Camp

The southwest coastal camp contains abandoned tents, equipment, and a small supply area.

It serves as an easily recognizable weapon purchase location.

Keep structures lightweight and accessible from several directions.

## 3.6 South Dock

A deteriorated wooden dock extends a short distance into the southern shoreline.

The LMG purchase station is placed near the dock's landward end.

The player must not be required to travel along a narrow pier to purchase the weapon.

## 3.7 East Cove

A small cove with a weathered equipment shelter and scattered supplies.

The cove contains a pistol purchase station.

Ensure the shore and surrounding rock formations do not produce an unavoidable corner.

## 3.8 Soul Forge

The Soul Forge remains visually consistent with the mansion's existing upgrade system.

Place it east of the central hill, in an exposed clearing.

The Forge must be approachable from multiple directions and should remain reachable while enemies pursue the player.

Its position should create a meaningful tactical challenge without making upgrading unnecessarily frustrating.

---

# 4. WEAPONS, UPGRADES, AND POWER-UPS

## 4.1 Weapon Spawn Locations

Every weapon currently implemented in the mansion mode must remain available in Dead Tide.

The map's conceptual weapon-class locations are:

| Weapon/class | Location | Notes |
|---|---|---|
| Glock 21 / pistol | East Cove | Starting weapon remains equipped; station can support repurchasing if applicable |
| M4 assault rifle | Coastal Camp | Southwest purchase station |
| Raven SMG | Jungle Ruin | Northwest purchase station |
| LMG | South Dock | Southern purchase station |
| Bushmaster .450 | Central Lookout Compound | Hilltop scoped rifle station |
| Shotgun class | Shipwreck Cove | Use existing shotgun weapon if implemented |
| Melee class | Lookout Compound equipment area | Only include if implemented in the existing arsenal |

The Bushmaster is the existing scoped AR-15 Bushmaster .450, not a newly invented sniper weapon.

**Weapon implementation rule:** Concept-art weapon categories are not authorization to create new weapons. Verify the current weapon registry and map every existing purchasable weapon to a station. If a class has no implemented weapon, omit or reserve its station.

Additional weapons already present in the mansion but not identified above must also receive purchase locations.

## 4.2 Weapon Ranks

Preserve the existing weapon ranking and upgrade systems.

Dead Tide should use the same:

- Weapon statistics.
- Reload behavior.
- Magazine capacities.
- Damage calculations.
- Ammunition systems.
- Weapon ranks.
- Upgrade effects.
- Purchase and upgrade costs.

Do not create a separate weapon balancing system unless playtesting demonstrates that mode-specific adjustments are necessary.

## 4.3 Soul Forge

Reuse the existing Soul Forge system, including its current rank structure, costs, visual effects, and upgrades.

The Forge remains fully operational during continuous enemy spawning.

Opening an upgrade interaction must not pause the world or suspend zombie movement.

Interactions should be fast and immediately responsive.

## 4.4 Armor and Defensive Upgrades

Retain applicable existing defensive systems, including body armor and Nano Shield progression.

Reuse the existing costs and effects initially.

Defensive upgrades may be purchased from clearly identified stations or existing upgrade interfaces, without introducing additional gameplay complexity.

## 4.5 Power-Ups

Reuse existing power-ups and their current effects.

Power-ups should enter the game through enemy defeats or other existing supported reward mechanisms.

Since Dead Tide has no completed waves:

- Remove dependencies on wave-completion rewards.
- Keep enemy-kill-based drops functioning.
- Preserve existing pickup durations and effects.
- Avoid excessively frequent drops as kill rates increase.
- Prevent unintended stacking or duplicated rewards.

The player should still experience occasional moments of overwhelming firepower and relief.

---

# 5. ENEMY SPAWN SYSTEM

## 5.1 Core Design

Dead Tide uses a continuous, adaptive spawn director.

Rather than spawning a fixed wave, the system maintains an evolving target population of enemies.

Whenever an enemy dies, the director schedules replacements according to the current threat level, available spawn locations, and spawn timing rules.

There must never be a traditional wave-completion state.

**Maximum simultaneously active enemies: 45.**

This includes all active enemy types, not just standard zombies.

## 5.2 Spawn Network

The initial island contains **28 potential spawn locations**.

| Spawn category | Count | Purpose |
|---|---:|---|
| Major shoreline zones | 8 | Primary enemy entry points |
| Minor shoreline points | 14 | Secondary emergence and variety |
| Concealed interior zones | 6 | Additional pressure at advanced threat ranks |
| **Total** | **28** | |

These are potential locations, not 28 permanently active emitters.

### Eight Major Shoreline Zones

Suggested distribution:

1. North Beach
2. Northeast Reef
3. East Shore
4. Southeast Cove
5. South Dock Shore
6. Southwest Beach
7. Shipwreck Cove
8. Northwest Reef

Each major zone should cover a small stretch of terrain rather than use one exact spawn coordinate.

Individual zombies should emerge from slightly different positions within their assigned zone.

### Fourteen Minor Shoreline Points

Scatter these between the major shoreline zones.

Use existing environmental features:

- Shallow water.
- Rock formations.
- Driftwood.
- Damaged fishing equipment.
- Tide pools.
- Coastal vegetation.
- Partially submerged debris.

Minor spawns typically produce one or two enemies rather than concentrated groups.

Their purpose is to prevent predictable enemy emergence patterns.

### Six Interior Spawn Zones

Use concealed, environmentally believable locations:

1. Northwest Jungle Ruin vegetation.
2. North-central brush below the hill.
3. Northeast foliage near the bunker approach.
4. East-central vegetation beyond the Soul Forge.
5. South-central vegetation near the hill base.
6. Southwest foliage between Coastal Camp and the hill.

**Interior spawns are primarily a late-game mechanic.**

They should remain disabled during early play and unlock as the player enters The Swarm.

They must never activate directly beside the player or in a location clearly visible to the player.

## 5.3 Spawn Director Behavior

The director continuously evaluates:

- Player position.
- Player facing direction.
- Player movement direction.
- Player velocity.
- Current number of living enemies.
- Distribution of active enemies around the player.
- Visibility of potential spawn locations.
- Spawn cooldowns.
- Current threat level.
- Enemy composition.
- Available navigation routes.

It then selects valid locations using weighted randomness.

### Spawn Selection Priorities

Prefer spawn locations that:

- Are outside the player's immediate visible area.
- Are sufficiently far from the player.
- Have valid navigation paths.
- Produce enemies that can realistically approach the player.
- Have not been used too frequently in recent seconds.
- Contribute to an interesting distribution of enemies.

Spawns behind or to the sides of a moving player should generally receive higher weighting.

Occasional spawns ahead of the player's travel direction are allowed, provided they are sufficiently distant, naturally concealed, and do not unfairly close off every escape route.

### Anti-Pop-In Rules

Never spawn enemies:

- Directly in the player's field of view at close range.
- Inside the player or another enemy.
- On top of an active weapon station or upgrade interaction.
- Inside inaccessible scenery.
- Inside the sealed bunker.
- On disconnected navigation geometry.
- In positions that create unavoidable damage.

When no valid spawn location is available, delay the spawn and retry.

Do not bypass visibility or distance safety rules merely to satisfy the enemy population target.

## 5.4 Spawn Group Distribution

At any moment, only a subset of the island's spawn network should be active.

Suggested phase behavior:

| Rank | Major shoreline zones active | Minor shoreline activity | Interior zones |
|---|---|---|---|
| The Unease | 3–4 | Occasional | Disabled |
| The Hunt | 4–6 | Increasing | Disabled |
| The Swarm | 5–7 | Frequent | Limited |
| The Apocalypse | Up to 8 | Frequent | Intermittent, widespread |

These are concurrent availability targets, not mandatory spawn counts.

The director should periodically rotate active zones to discourage predictable movement patterns.

## 5.5 Enemy Replacement

Enemy replacements should be distributed over time.

Important behaviors:

- Spawn continuously while the run is active.
- Do not wait for the player to eliminate all enemies.
- Do not immediately replace every killed enemy in one large burst.
- Allow small, natural fluctuations in the living population.
- Use modest spawn batches as threat increases.
- Respect the 45-enemy hard cap.

A temporary population below the target is acceptable when required for fair spawning, performance, or navigation.

---

# 6. THREAT LEVEL SYSTEM

## 6.1 Kill-Based Escalation

Threat level increases once for every 20 enemies killed.

**Formula:**

`Threat Level = floor(Total Kills / 20) + 1`

Examples:

| Total kills | Threat level |
|---:|---:|
| 0 | 1 |
| 20 | 2 |
| 100 | 6 |
| 260 | 14 |
| 460 | 24 |
| 600 | 31 |
| 1,000 | 51 |

There is no maximum threat level.

Difficulty modifiers may have caps or diminishing returns, but the displayed threat level must continue increasing.

## 6.2 Threat Ranks

| Rank | Threat levels | Total kills |
|---|---|---|
| The Unease | 1–5 | 0–99 |
| The Hunt | 6–13 | 100–259 |
| The Swarm | 14–23 | 260–459 |
| The Apocalypse | 24+ | 460+ |

Ranks are descriptive progression categories, not separate gameplay rounds.

Crossing a rank threshold should not interrupt the game.

## 6.3 Enemy Population Scaling

Start with a target population of eight enemies.

Increase the target population by two enemies for each threat level gained.

**Proposed formula:**

`Target Enemies = min(45, 8 + 2 × (Threat Level - 1))`

Example progression:

| Total kills | Threat level | Target living enemies |
|---:|---:|---:|
| 0 | 1 | 8 |
| 100 | 6 | 18 |
| 200 | 11 | 28 |
| 260 | 14 | 34 |
| 360 | 19 | 44 |
| 380 | 20 | 45 |
| 460 | 24 | 45 |
| 600 | 31 | 45 |

Once the population reaches 45, difficulty continues scaling through other mechanisms.

## 6.4 Enemy Health

**Proposed starting balance:**

- Increase standard enemy health by approximately 4% per threat level during early progression.
- After approximately 25 increases, use a smaller 1.5% increase per additional level.
- Cap the standard enemy health multiplier at 4× baseline.

Apply the multiplier to existing enemy-type base health rather than replacing their individual balance characteristics.

This prevents indefinite exponential health scaling from eventually making enemies effectively unkillable.

## 6.5 Enemy Movement Speed

**Proposed starting balance:**

- Increase enemy movement speed by approximately 2% of its baseline per threat level.
- Limit the additional speed to 50% above baseline.
- Preserve meaningful speed differences between enemy types.

The final speed cap must be tested against player sprint speed, attack animations, pathfinding, and the available movement routes.

Speed should not create situations where damage is unavoidable.

Once speed reaches its cap, further difficulty should primarily come from enemy composition, pressure, and durability.

## 6.6 Enemy Damage

Retain existing enemy damage values initially.

Introduce modest damage scaling only if necessary after testing the combined effects of increased health, movement speed, and enemy population.

Excessive damage scaling should not be used as a substitute for interesting combat pressure.

## 6.7 Enemy Composition

Reuse existing zombie and enemy variants:

- Standard zombies.
- Enraged zombies.
- Feral zombies.
- Hounds.
- Ashfang hounds.
- Brutes and other existing special enemies.

Suggested progression:

**The Unease:** Predominantly standard zombies. Special enemies are uncommon or absent at the very beginning.

**The Hunt:** Ferals and hounds gradually become more common. Faster enemies begin challenging predictable running routes.

**The Swarm:** A wider mixture of enemy types. Brutes and dangerous enemy combinations become more frequent.

**The Apocalypse:** Sustained mixed enemy populations, with aggressive pursuit and limited opportunities to remain stationary.

Special enemies must still respect the global enemy cap.

Do not create entirely new enemy types for the first release.

---

# 7. THREAT TRACKER — PLAYER HUD

## 7.1 Position

Place a compact, permanently visible threat tracker in the **top-left corner** of the gameplay screen.

It should use Blackthorn's established dark gothic visual style, with restrained red accents and readable typography.

## 7.2 Required Information

The tracker displays:

- Current threat level.
- Current threat rank.
- Total enemies killed.
- Progress toward the next threat level.

### Example Display

| DEAD TIDE | |
|---|---|
| **THREAT LEVEL** | **14** |
| **CURRENT RANK** | **THE SWARM** |
| **ENEMIES KILLED** | **268** |
| **NEXT LEVEL** | 8 / 20 kills |

A small segmented or horizontal progress indicator may show progress toward the next threat level.

The rank name should update automatically when the player crosses its defined threshold.

## 7.3 Visual Behavior

At every 20-kill milestone:

- Increment the displayed threat level.
- Reset the progress indicator for the next level.
- Briefly illuminate or pulse the threat number.
- Play a subtle audio cue.
- Do not interrupt gameplay.

At major rank transitions, a slightly more noticeable audio or color change may occur.

Avoid large centered banners, countdowns, or forced animations.

## 7.4 Audio Feedback

Use a brief, low-volume tonal effect to signal threat escalation.

Potential effects include:

- A low atmospheric pulse.
- A distant metallic resonance.
- A subtle ominous chime.

The sound should be recognizable without interfering with combat audio.

Rank transitions may use a slightly deeper variation of the same effect.

No dramatic musical interruption is required.

---

# 8. GAMEPLAY LOOP

## 8.1 Starting a Run

The player selects Dead Tide from the main game mode selection interface.

A new run begins on the island.

Initial state:

- Player equipped with the existing starting loadout.
- Existing player statistics and default progression state.
- Threat level 1.
- Rank: The Unease.
- Total kills: 0.
- Enemy target population: 8.
- All normal weapon and upgrade systems initialized.
- Bunker entrance inaccessible.

Enemy spawning begins shortly after the player enters the world, allowing a brief opportunity to orient without introducing a formal round countdown.

## 8.2 Continuous Combat

The player eliminates enemies, earns essence, purchases weapons, collects power-ups, and upgrades their loadout.

The enemy director replenishes the population continuously.

There is no requirement to clear a particular number of enemies before accessing upgrades or continuing progression.

## 8.3 Escalation

Every 20 kills, the threat level increases automatically.

The director adjusts target enemy population, durability, movement speed, and enemy composition according to the defined progression system.

The player remains in complete control throughout.

## 8.4 Advanced Survival

As the player progresses:

- More shoreline spawn zones become active.
- Minor shoreline emergence becomes more frequent.
- Interior spawning activates.
- Enemy types become more varied.
- The population approaches the 45-enemy cap.
- Movement and positioning become increasingly important.

Once enemy population and speed limits are reached, durability and enemy composition continue increasing the challenge.

## 8.5 Run Completion

A Dead Tide run ends when the player dies under the existing death and game-over rules.

Display a summary containing:

- Enemies killed.
- Time survived.
- Final threat level.
- Final threat rank.
- Total essence earned.
- Headshots or headshot percentage, if already tracked.
- Other relevant existing combat statistics.

Then offer the existing restart and menu options.

---

# 9. ANTI-CAMPING AND MOVEMENT DESIGN

## 9.1 Avoiding Infinite Kiting

The island must not be designed around only one optimal running circuit.

Use multiple connecting routes and dynamically distributed enemies to encourage route changes.

Enemy behavior should naturally create pressure rather than rely on artificial barriers.

## 9.2 Central Hill Balance

The central hill offers excellent visibility but limited defensive protection.

Important requirements:

- Zombies can approach from every direction.
- No single narrow approach allows the player to funnel all enemies.
- The communications shack does not provide an exploitable safe position.
- Terrain remains traversable by all applicable enemy types.
- The player can escape down any side of the hill.

Do not add forced movement restrictions or artificial kill zones to discourage hilltop camping.

## 9.3 Spawn Pressure

The director should avoid repeatedly concentrating enemies in the same location.

It should consider the player's movement path and existing enemy positions when selecting new spawn locations.

Avoid always spawning enemies directly behind the player, which can make the system predictable.

Maintain variation while ensuring threats remain readable and fair.

## 9.4 Navigational Fairness

The player should never encounter a situation where the island geometry itself makes escape impossible.

Enemy-created pressure is intentional; unavoidable terrain traps are not.

Test all major routes with large groups of enemies, including hounds and brutes.

---

# 10. ATMOSPHERE AND ENVIRONMENT

## 10.1 Visual Direction

The island should feel dark, isolated, and long abandoned.

Suggested visual elements:

- Tropical vegetation reclaiming man-made structures.
- Damaged communications equipment.
- Weathered docks and shipwrecks.
- Damp rocks and tidal debris.
- Dark ocean water.
- Distant mist.
- Faint lights from the central communications tower.
- Subtle supernatural lighting around the Soul Forge.

Avoid excessive structures, oversized ruins, or overly cluttered terrain.

Keep critical movement routes visually readable.

## 10.2 Environmental Audio

Use an ambient soundscape consisting of:

- Ocean surf.
- Wind through vegetation.
- Occasional distant thunder.
- Creaking wreckage.
- Abandoned communications equipment noises.
- Distant zombie vocalizations.

Sound should strengthen the sense of isolation without overpowering directional enemy audio.

## 10.3 Black Tide Event — Future Enhancement

A later update may introduce Black Tide environmental events.

During these events:

- Fog briefly thickens along the shoreline.
- Ocean-related sounds become more intense.
- Shoreline spawn activity increases.
- The island feels temporarily more dangerous.

These events must not interrupt the normal enemy progression or exceed the 45-enemy cap.

They should be considered a second-phase feature rather than a requirement for initial release.

## 10.4 Art Pass Direction (added with the user, November 2026)

Phase 5's visual polish, decided with the user before any art was made. The user supplied reference photos as inspiration, not as targets to copy exactly.

**Decisions:**

- **Time of day: a moonlit night.** Keep the horror night of 10.1, with a brighter moon so that the references' colours read at night: turquoise shallows, moss, rust and pale sand.
- **Surfaces: textured everywhere.** That covers sand, grass, jungle floor, mud, rock, and every structure and plant. Textures are generated by the project's own tooling, not taken from outside sources.
- **Budget: desktop first.**
  - A moderate increase in Dead Tide's load and frame cost is acceptable on a computer, measured and reported with each release.
  - Phones can use the Performance setting.
  - The mansion is untouched (Appendix).
- **Ruin size: modest, as in 3.4.** A few broken walls, an arch, broken columns and paving. It mixes the two ruin references and stays open for pursuit.

**From the references, per landmark:**

- **Jungle Ruin.** A stone arch overgrown with vines and broken columns, some fluted and carved. Mossy blocks, a broken stone-paved path and a stone pedestal, all deep in ferns and tall grass.
- **Bunker B-01.** A WWII-era reinforced-concrete portal dug into the hillside, in weathered olive and faded peach camouflage paint.
  - Stencilled lettering: B-01, and a year in the manner of the reference's "USED 1942".
  - Timber gates folded back from the sealed door, and side alcoves in the wing walls.
  - A steel railing along the top of the cut, and scrub growing over the earth.
- **The wreck.** A rust-streaked steel coastal freighter run aground and listing, plated hull, bridge and funnel aft, a cargo derrick mast forward with booms.
- **The island at large.**
  - Turquoise reef shallows fading to dark water.
  - Palms and dense green scrub; thatched and timber huts; a stone seawall edge.
- **Every other landmark** goes for the same vibe: weathered timber, thatch, canvas, rust and mossy stone.

Collision footprints, station pads and routes keep their positions, so gameplay stays as tested. Any change to them is reported.

**Follow-up (v216, from the user's first look):**

- **Nothing floats.** Every part that stands on the ground meets it under every edge, and a test checks this.
- **The Coastal Camp stands on a flat plateau**, at the height of its middle.
  - **To the sea behind it:** a cliff, about 4.6 m of rock face, too steep to climb. The user will later give the dead a way to climb it.
  - **To the Wash at its east side:** a bluff, also cliff.
  - **To the hill and the west:** ramps.
- **Solid things are solid.**
  - A rock's collider matches the rock you see, and you can stand on its crown.
  - Everything that blocks also holds you up if you come down on it, so nothing can be landed inside.
  - A body somehow inside anything can always step out.
- **The wreck:** her fittings sit on her, and her bow is in the sand.
- **The island is fuller:** about twice the palms, shrubs, ferns and grass.


---

# 11. ESSENCE ECONOMY

Dead Tide reuses the mansion's existing essence-based economy.

Essence is primarily earned through enemy kills and existing supported bonuses.

Since the mode does not include completed waves, any wave-completion essence rewards must be removed or replaced appropriately.

Initially preserve:

- Existing kill rewards.
- Existing weapon costs.
- Existing weapon upgrade costs.
- Existing armor upgrade costs.
- Existing power-up rewards.

The mode should be tested to ensure the player can realistically acquire upgrades while combat continues.

Avoid making upgrades automatically cheaper merely because the mode is endless.

If balancing changes are necessary, implement mode-specific configuration values instead of altering the mansion economy.

---

# 12. LEADERBOARD AND SCORING

## 12.1 Independent Leaderboard

Dead Tide must have its own leaderboard, separate from mansion mode records.

Use the existing leaderboard infrastructure where appropriate, but preserve existing records and behavior.

Each run should identify its game mode.

## 12.2 Primary Ranking

Rank players primarily by **total enemies killed**.

Tie-breakers:

1. Higher threat level, if applicable.
2. Longer survival time.
3. Additional combat statistics as needed.

Because threat level is determined by kills, it will normally be redundant as a tie-breaker; survival time is the meaningful secondary ranking factor.

Survival time alone must not be the primary score, to discourage passive play.

## 12.3 Run Data

Record:

- Game mode identifier.
- Unique run identifier.
- Player name.
- Total kills.
- Time survived.
- Final threat level.
- Final threat rank.
- Relevant existing combat statistics.
- Game version, if supported.

Preserve existing score-submission safeguards, including prevention of duplicate submissions for the same run.

Do not modify or invalidate legacy mansion leaderboard data.

---

# 13. PERFORMANCE AND TECHNICAL REQUIREMENTS

Dead Tide is intended for the existing browser-based Blackthorn game.

Performance is a major design consideration.

## 13.1 Enemy Budget

- Hard maximum: 45 active enemies.
- Includes all enemy variants.
- Reuse existing enemy assets and animation systems.
- Reuse enemy pooling where supported.
- Avoid unnecessary creation and destruction of enemy objects.
- Limit spawn scheduling and expensive visibility checks.

The existing enemy AI should remain the foundation of Dead Tide.

## 13.2 Terrain and Scenery

Prioritize visually attractive but inexpensive scenery:

- Repeated vegetation meshes with variation.
- Instanced rocks and props where supported.
- Limited dynamic lighting.
- Low-complexity distant foliage.
- Efficient collision geometry.
- Simplified or batched static scenery.

Avoid terrain complexity that causes navigation instability.

## 13.3 Navigation

All primary routes must support existing enemy pathfinding.

Requirements:

- Walkable hill slopes.
- Connected navigation routes.
- No isolated spawn points.
- No terrain seams that trap enemies.
- No excessive pathfinding recalculations.
- No unreachable locations that players can exploit.

## 13.4 Performance Targets

Aim for smooth gameplay at maximum population on representative desktop hardware.

Test both high-performance gaming hardware and lower-powered systems, including integrated graphics.

Maintain the 45-enemy design cap; optimize spawning, geometry, effects, and AI before considering a lower hard cap.

If spawn scheduling falls behind temporarily, avoid compensating with a large instantaneous spawn burst.

---

# 14. IMPLEMENTATION PRIORITIES

## Phase 1 — Core Map

Build the island with:

- Complete shoreline circulation.
- Interior trails and shortcuts.
- Accessible central hill.
- Central radio shack and communications tower.
- Sealed northeast bunker entrance.
- All primary environmental landmarks.
- Weapon station locations.
- Soul Forge location.

Validate player and zombie navigation before adding complex scenery.

## Phase 2 — Endless Survival System

Implement:

- Continuous spawn director.
- 28 potential spawn locations.
- 45-enemy hard cap.
- Enemy replacement scheduling.
- Kill-based threat levels.
- Threat scaling.
- Threat-rank progression.
- Dynamic enemy composition.

There must be no dependency on wave-completion logic.

## Phase 3 — Existing Game Systems

Integrate:

- Existing arsenal.
- Weapon purchase stations.
- Weapon ranks.
- Soul Forge.
- Armor and defensive upgrades.
- Essence collection.
- Power-ups.
- Existing enemy variants.

Ensure the mansion's balancing and progression remain unchanged.

## Phase 4 — UI and Leaderboard

Implement:

- Persistent top-left threat tracker.
- Threat progress indicator.
- Subtle escalation sound.
- Rank transitions.
- Dead Tide game-over summary.
- Independent leaderboard.

## Phase 5 — Visual Polish and Testing

Add:

- Island atmosphere and ambient sounds.
- Environmental detailing.
- Enemy emergence effects.
- Lighting and fog improvements.
- Performance optimization.
- Spawn fairness tuning.
- Long-session testing.

## Future Expansion

Reserve support for:

- Underground bunker gameplay.
- Black Tide environmental events.
- Additional special enemy behaviors.
- Additional island secrets or optional objectives.

These features are outside the initial release scope.

---

# 15. ACCEPTANCE CRITERIA

The initial mode is ready for release when all of the following are true:

### Map

- The island has a complete, uninterrupted shoreline route.
- The player can cross the island using several independent paths.
- The central hill can be approached from all sides without forced chokepoints.
- The central radio shack and tower are combined into one compound.
- The Bushmaster is available at the central compound.
- The northeast bunker entrance is present but inaccessible.
- All existing purchasable weapons are represented by valid stations.
- The Soul Forge is accessible and operational.
- No major terrain traps or unreachable enemy locations remain.

### Gameplay

- Enemies continuously spawn without wave transitions.
- Every 20 kills increases the threat level.
- Threat ranks change at their designated thresholds.
- The target enemy population increases gradually.
- The active enemy population never exceeds 45.
- Existing enemy variants participate in progression.
- Interior spawns activate only at their configured thresholds.
- No enemies visibly appear directly beside the player.
- Gameplay never pauses during threat-level changes.

### User Interface

- Threat tracker is visible in the top-left corner.
- Threat level, total kills, and current rank are always displayed.
- Threat progress accurately reflects kills toward the next level.
- A subtle audio cue plays at escalation milestones.
- Rank changes do not obscure gameplay.

### Systems

- Existing weapons and upgrades function correctly.
- Essence progression works without wave-clear rewards.
- Power-ups remain operational.
- Death ends the run correctly.
- Dead Tide records are separate from mansion records.
- Mansion gameplay remains unaffected.

### Performance

- Maximum enemy population has been stress-tested.
- No significant enemy navigation failures occur.
- No excessive spawn bursts or sustained frame stalls occur.
- Long survival sessions remain stable.
- The mode performs acceptably on the intended range of browser hardware.

---

# 16. FINAL DESIGN INTENT

Dead Tide should feel like a natural evolution of Blackthorn's existing combat mechanics rather than an entirely separate game.

The player begins on an eerie, seemingly abandoned island with only a handful of enemies approaching from the shoreline.

As kills accumulate, enemy pressure grows steadily. More of the shoreline becomes dangerous, faster enemies begin pursuing the player, and eventually the interior itself becomes hostile.

The central lookout hill offers excellent visibility but no true sanctuary. The shoreline provides room to move but becomes increasingly difficult to navigate. The Soul Forge offers powerful upgrades, but reaching it requires taking risks.

Eventually, the island reaches its maximum enemy population, and the player must rely on movement, weapon mastery, upgrades, and positioning to stay alive.

There is no final round and no victory condition.

**The island never runs out of enemies. The player only runs out of time.**
---

# Appendix: performance and compatibility requirement (given with the specification)

Implement Dead Tide as an independently loaded game mode.

- The existing Midnight Siege mansion must retain its current loading behavior, runtime performance, graphics quality, and gameplay functionality.
- Do not import or initialize Dead Tide terrain, assets, spawn logic, enemy instances, or rendering resources during mansion initialization.
- Do not initialize the mansion environment when launching Dead Tide.
- Use separate mode entry points and reuse existing shared gameplay modules where practical. Avoid duplicating core weapon, enemy, upgrade, and combat implementations.
- Keep the mode-selection screen lightweight and independent of the 3D engine.
- Preserve compatibility with existing direct game links, leaderboard records, and deployed gameplay.
- Establish baseline measurements before implementation and compare both modes afterward, including transferred bytes, time to playable, frame time, draw calls, memory usage, and shader compilation.
- Treat any measurable regression in the original mansion as an issue requiring correction before release.
- Prioritize complete runtime isolation over seamless in-memory switching between maps.

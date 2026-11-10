// The feral stalker's numbers. v206: this file no longer loads core.mjs (the shared enemy
// modules read FERAL here, and Dead Tide must not load the mansion's layout tables); the
// mansion's wave mix, chooseEnemyKind, moved to curse.mjs with the rest of its spawn choice.
export const FERAL=Object.freeze({unlockWave:7,chance:1/8,speedMultiplier:1.75,damageMultiplier:2});

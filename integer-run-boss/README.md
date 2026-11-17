# Integer Runner — Dr. Fin boss encounter (testing)

This is a **separate, actual-source boss test build**, derived from `keeganfinlayson/Integer-Run`'s `boss.html`, `boss-src/lab.js`, `boss-src/model.js`, and `boss-src/art.js`. The original sprites and scenery textures are included under `assets/`.

[Open the boss arena testing build](https://keeganfinlayson.github.io/Testing/integer-run-boss/)

## Encounter prototype

- Checkpoint begins with Dr. Fin at **+100** and a **+12** army (or `?army=-24`, etc.).
- **Three active ground lights**: two addition/subtraction choices and one nonzero multiplication choice. Each has two locations, with blue ground-light warning before it reappears elsewhere. At least two active options always keep the army from crossing zero.
- A warned `×(−1)` ring moves from the boss toward the player. Contact flips sign, not magnitude. Boss changes sign as the ring begins.
- A group of **four separate ±4 blob pickups** deploys after the wave, retaining its sign; matching the player's color adds, opposite colors cancel.
- Contact with the boss: opposite signs reduce both army and boss HP; matching signs transfer army into boss HP. Zero army ends the attempt, and zero boss HP ends in victory.
- Gameplay input: arrow keys / WASD, drag steering, and on-screen directional arrows. Press Space to pause and R to restart.

This is an isolated boss experiment, **not yet integrated into the full runner course**. The published `Integer-Run` repository is unchanged. The Testing root's Vertical Crossing build remains untouched.

## Files

`index.html` + `boss-src/{model,art,lab}.js` + `assets/{dr-fin-poses,forest-chasm,mossy-stone}.webp`. All asset paths are local to this folder.

## Test status

Syntax checks and deterministic state-machine tests passed for pad relocation, sign wave behavior, four-blob deployment, opposite/same sign combat, zero-army defeat, and drawing invocation. A full browser input/performance pass remains to be completed.

## Build v3 — November 17, 2026

- Three smaller operation lights appear directly on the arena floor: two addition/subtraction options and one nonzero multiplication. No solid pad graphics or icons; operations and result previews float over the light.
- Using a spot previews its next location with blue fiery ground-light before it arrives.
- An addition/subtraction that **reaches or crosses zero** ends the run, even if the arithmetic result has the opposite sign. Example: −8 + 16 passes through zero and loses.
- At least two currently active operations are always safe. If another spot is used while one is recharging, the previous spot completes its return first.
- The faster boss rhythm, attacks, and sign wave from the prior local testing build are retained.

## Build v4 — Four-direction attack and ground-light operations

- Four groups enter from four different locations along the arena rim on independent paths. Exactly two are blue/positive, two red/negative; each group carries a different integer value.
- Each group appears as a small visible swarm of blobs, labeled only with its signed integer (no multiplication tokens).
- Three operations remain: two addition/subtraction and one multiplication. The operation is written in bright tilted light directly on the ground, without outcome previews.
- Using a spot fades it out and causes its next spot to form with a warning at a randomized position around the arena.
- The zero-crossing loss rule and guarantee of two safe active operations remain intact.
- Tested in Chromium: 24 four-group spawn samples, sign/value/separation checks, zero-crossing and safe-operation checks, pad reappearance, and page rendering.

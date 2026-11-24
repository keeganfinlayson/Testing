# Integer Runner 2.0 — Widescreen Development Build

[Play the game](https://keeganfinlayson.github.io/Testing/integer-runner-v2/)

Work-in-progress major visual revision of the original integer-runner app. **The main published Integer-Run repository is unchanged.**

## Visual direction
- Widescreen 16:9 stage (1920×1080 target; 1366×768 baseline), no mobile-first vertical cropping.
- Continuous quiet gray stone bridge, sparse moss, low-contrast stable seams and parapets.
- Simplified jungle silhouettes and soft atmospheric valley fade.
- Improved cached expressive water-blue/fire-red blob sprites and independent visual followers from the previously tested crowd preview.
- Three existing math courses retained; signed arithmetic, gates and collisions remain as implemented.

## Boss
The boss page in this folder contains the revised square arena with four straight walls, four separate red/blue enemy entry points, and the preserved signed operation / zero-crossing mechanics.

## Test status
The JavaScript files were syntax-checked before commit. The arena boundary and math logic need full hands-on gameplay validation before replacing the production game.

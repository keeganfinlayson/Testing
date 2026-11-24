# Integer Runner 2.0 — Widescreen Development Build

[Play the game](https://keeganfinlayson.github.io/Testing/integer-runner-v2/)

Work-in-progress major visual revision of the original integer-runner app. **The main published Integer-Run repository is unchanged.**

## Visual direction
- Widescreen 16:9 stage (1920×1080 target; 1366×768 baseline), no mobile-first vertical cropping.
- Continuous quiet gray stone bridge, sparse moss, low-contrast stable seams and parapets, with world-anchored geometry.
- Simplified jungle silhouettes and soft atmospheric valley fade.
- Improved cached expressive water-blue/fire-red blob sprites and independent visual followers from the previously tested crowd preview.
- Course operations use the boss arena's red/blue ground-light vocabulary, with larger outlined symbols.
- Three existing math courses retained; signed arithmetic, gates and collisions remain as implemented.

## Boss
The boss page in this folder contains the revised square arena with four straight movement boundaries, four separate red/blue enemy entry points, and the preserved signed operation / zero-crossing mechanics. Its world-space width and depth are equal. The v2 checkpoint is isolated from the published game.

## Test status
The JavaScript files were syntax-checked. A Chromium smoke test of the quiet course background ran without page errors. A mocked Canvas runtime check of the published square boss rendered without throwing, kept 100 scripted movements within the new bounds, and produced four incoming groups (two blue, two red) from separate corners. Full visual and gameplay testing of the deployed Pages site, especially performance and course-to-boss transitions, is still required before promotion.

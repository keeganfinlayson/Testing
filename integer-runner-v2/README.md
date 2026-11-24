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

## Bridge depth and early gate warnings — November 24, 2026

- Tall, continuous stone parapets with simple top caps, world-fixed seam spacing and regularly placed buttresses. The surface stays subdued gray and the joints remain low contrast.
- Longer visible bridge perspective, with road, rails and supports progressively dissolving into the mist before the vanishing point. Quiet layered jungle silhouettes and horizontal valley haze appear behind the bridge.
- Small noninteractive advance warning above the playfield: **BLUE GATE AHEAD** (positive army), **RED GATE AHEAD** (negative army), or **SIZE GATE AHEAD** (nonzero magnitude below the gate's capacity). It changes from *In the distance* to *Approaching* to *Coming up*, before the actual gate, without covering math objects.
- Course model, runner arithmetic, boss rules, and the main published repository are unchanged.

### Test notes

Source syntax and mocked Canvas drawing checks completed at 1366×768 and 1920×1080, with no exceptions or unbalanced canvas state. Warning state is tested across all three courses. The GitHub Pages build still needs hands-on visual/performance validation.

## Roadside warning signs and stone surface — November 24, 2026

- Removed the floating gate-warning HUD and its explanatory text.
- Added a single perspective-scaled sign on a post beside the right parapet before each relevant operation choice. Its only wording is **Warning Blue Gate**, **Warning Red Gate**, or **Warning Size Gate <5** (shown in two lines as “WARNING” and the gate type).
- Road texture gains broad low-opacity wear patches anchored to fixed slab coordinates, preserving the quieter look and minimizing shimmer.
- The level arithmetic, mathematical rules, boss encounter, and published main game are unchanged.

Source changes are syntax-checked. Live visual and gameplay testing is required before promoting the build.

## Boss operations v2.0.3 — November 24, 2026

- Three ground-light choices per sign-wave cycle: positive addition, negative subtraction, and a third choice weighted **88% division, 12% multiplication**. Multiplication is usually ×(−1), with ×2 uncommon. Addition/subtraction values are modest (typically 2, 4, 6, or 8).
- Division uses the mathematical ceiling: `7 ÷ 3 = 3` and `−7 ÷ 3 = −2`. Division that produces zero ends the attempt. The sign of the operation still determines red versus blue illumination.
- Each spot first displays **one second of colored ground glow** without a label; its operation then fades in over 0.25 seconds before the spot can be activated. The glow and lettering colors match the operation sign.
- Players may apply **one** of the three operations per complete boss cycle. All three fade after that use and reappear at fresh locations on the next sign-wave warning. This prevents immediately farming additions or multipliers without capping or falsifying the actual integer result.
- The existing zero-crossing rule, boss HP, four signed enemy entrants, and rectangular arena remain unchanged.
- Verified through mocked Canvas/runtime tests: operation label hidden before the glow completes, later visible, one-use-per-cycle behavior, recharge on next warning, positive/negative ceiling division, and weighted operation selection.

The full hosted browser gameplay and deployment appearance have not yet been independently verified.

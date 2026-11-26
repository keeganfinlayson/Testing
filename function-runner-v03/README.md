# Function Runner — Testing Build v0.9

## Canonical builds
- Current editable prototype: `function-runner-v03/index.html` (self-contained HTML with embedded raster animation atlases).
- Preserved v0.8 branch: `function-runner-v08-preserved`.
- Do not update the older `function-runner/index.html` prototype.
- Canonical character and movement source art: Google Drive → Math Teaching Software Apps → Function Runner.
- Versioned art backup: Function Runner → Versioned Builds and Assets → v0.8 — preserved asset set.

## Goals
Students draw directly in a coordinate plane, run the character over the same drawing, and see qualitative graph features as physical action. The entire run is choreographed from a left-to-right path plan; it must not react frantically to single-pixel drawing bumps.

## Implemented through v0.9
- Draw, segment, point, move, erase, undo, replay, scrub; example graphs and gaps.
- Uphill / downhill / flat slope acting over sustained neighborhoods, with forgiving thresholds.
- Precomputed run plan and transitions, jumpable and unjumpable gaps, discrete points and vertical segments.
- Illustrated eight-frame run atlas and sixteen-frame uphill/downhill/jump/landing atlas preserved from v0.8.
- v0.9 transition cues: crest, brace before steep descent, balance recovery after skidding.
- v0.9 procedural comic tumble on failure, celebration accents, recovery dust and crest acting.
- v0.9 speed adjustment to reduce excessive slowing on challenging slopes.
- Optional Show movements timeline chips for inspection; hidden by default.

## Deliberate limitations
- New v0.9 transition acting uses the existing procedural character model. It is not yet a new hand-illustrated sprite atlas.
- Browser visual/regression testing and GitHub Pages deployment have not been verified by an automated run.

## Manual acceptance scenarios
1. Rolling hill: forgiving small bumps; normal run ↔ struggle ↔ crest ↔ downhill without shaking.
2. The wall: visible hands-and-feet scramble without large horizontal slowdown.
3. Runaway descent: brace, controlled loss of balance/skid, and recovery afterward.
4. Jumpable break: anticipate, launch, land, resume.
5. Unreachable break/asymptote: realize and comic fall.
6. Staircase, isolated points, vertical path: preserve geometry, handle separately.
7. Draw new paths, undo, erase, scrub, replay, resize; original lines must stay fixed while running.

## Next
Illustrate steep climb, skid, wobble, impact, fall, recovery, and finish frames matching the approved character model; replace only the procedural fallback for those states after visual review. Then test the acting-director transitions and classroom drawing ergonomics.

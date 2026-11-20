# Integer Runner — Crowd Visual Preview

[Play the visual preview](https://keeganfinlayson.github.io/Testing/integer-runner-visual/)

A **separate development build** based on the existing Integer Runner game. The published main game is unchanged.

## New visuals

- Cached 112×112 water-blue and fire-red character frames, with stronger silhouettes, eyes, highlights, and restrained elemental details.
- Persistent individual units with varied follower lag and a visually corrected center of mass, based on the previously selected movement concept. Rendering is independent of arithmetic and collisions.
- No solid duplicate crowd overlay. Large armies use individual representative sprites and a subtle shared ground shadow. Numerical labels remain exact.
- Existing simplified jungle, misty valley, and gray stone scene carried forward from the main repository.
- Current courses, gates, arithmetic, and steering retained. The boss encounter links to the production boss on the same GitHub Pages origin.

## Test notes

Tested in headless Chromium at 1366×768 by loading the same source scripts inline: level starts, steering moves the visible army, sprite cache is 112 px, a simulated 500-unit group renders, with no observed JavaScript page errors. This is not a Chromebook-wide performance guarantee.

Source: `index.html`, `environment.js`, `blob-runner/src/{art,game,model,styles.css}`, and `assets/mossy-stone.webp`.

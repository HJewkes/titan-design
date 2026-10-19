---
section: Added
---

`/motion` gains a keyed morph for storytelling transitions, after Manim's TransformMatchingParts (MIT, attributed in `ui/motion/morph/LICENSE-manim`). `matchParts(from, to, keyMap)` pairs two scenes' parts by key (a part's `key`, defaulting to its `id`), lets a `keyMap` claim renamed parts first, and lists the rest as exits and enters. `partsMorph(from, to, options)` turns that into painted layers as a pure function of progress: matched parts move and scale to their target box, optionally along an `arc`; key-mapped parts move while cross-fading; unmatched parts fade out over the first half and in over the second. `<Morph progress>` renders the layers with transform and opacity only and shows the target scene under reduced motion (TD-863).

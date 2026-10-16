---
section: Added
---

Motion timing toolkit (TD-862), from `@titan-design/react-ui/motion`:

- `lagged(n, { totalS, lagRatio, ease? })` fits `n` overlapping items into `totalS` (Manim's LaggedStart). It returns `itemS`, each item's window and `progress(t, index)`. `ease` eases the group's time, and no window ends past `totalS`.
- `span(durationS)`, `chain(...spans)`, `all(...spans)` and `delay(s, span)` compose timelines as pure data. Each returns `{ durationS, windows }`.
- A `keyframes` stop takes an optional third element, `{ holdS?, connectedRight? }`: `holdS` keeps the value that long before easing to the next stop, and `connectedRight: false` keeps it until the next stop, then steps. A hold on the first or the last stop is legal.
- New types: `KeyframeOptions`, `Lagged`, `LaggedOptions`, `Span`, `TimeWindow`.

**Changed (motion is unreleased).** `stagger` takes a required `count`, `each` defaults to `MOTION.video.staggerEach`, and the step shrinks so no delay passes `MOTION.video.staggerMax`. An `index` outside `[0, count)` throws `RangeError`. `keyframes` now validates its stops and throws `RangeError` for a non-finite stop, stops that are not strictly increasing in t, a negative hold or a hold that runs past the next stop. Two stops at one t no longer jump; express a jump with `connectedRight: false`.

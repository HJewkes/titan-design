---
section: Added
---

`Beat` takes `cues: { name: atS }`, named moments in seconds from the beat's start, and `useCue(name)` returns a cue's time from the current origin, so `useLocalTime(useCue('vo-2'), 0.5)` works at any depth (TD-862). A name an enclosing Beat already declared throws `Error`, an unknown name throws an `Error` that lists the known ones, and a cue that is not finite or falls outside `[0, durationS]` throws `RangeError`. Sibling Beats may reuse a name. A Beat without `cues` renders as before. New exports from `@titan-design/react-ui/motion`: `useCue`, `BeatCues`.

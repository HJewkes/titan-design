---
section: Added
---

`ui/motion` gains a pure SVG path toolkit, ported from MIT `@remotion/paths` with attribution (`ui/motion/paths/LICENSE`). `parsePath` reads the full path grammar (relative forms, `H V S T`, arcs with compact flags) into absolute `M L C Q A Z`. `pathLength`, `pointAtLength`, `tangentAtLength` and `cutPath` measure and cut by arc length, and `pathModel(d)` parses a path once for repeated reads. `drawOn(length, progress)` returns `strokeDasharray` and `strokeDashoffset` from a measured length, so a draw-on works without `pathLength={1}`. `interpolatePath` and `pathMorph` morph between two paths with different command counts (TD-839).

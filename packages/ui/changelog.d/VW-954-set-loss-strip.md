---
section: Added
---

`SetLossStrip` (`custom/Workout`, on `/workout`) draws one exercise's sets as velocity-loss bars on a
fixed scale against the VL lines, with set, reps, load and e1RM rows column-aligned underneath. A null
loss draws the calibrating hatch, warm-up and other sets draw narrow and grey, unscored sets draw
hollow, and the marked set gets a ring and a `StatusGlyph` in `markedTone`. `label` replaces the set
number (`#1 L`), and `columns` pads strips so they align down a page. The icon set gains
`TriangleUpIcon` and `TriangleDownIcon` (VW-954).

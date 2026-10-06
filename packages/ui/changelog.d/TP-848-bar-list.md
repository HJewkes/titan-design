---
section: Added
---

`BarList` (`ui/charts/bar-list`), a ranked horizontal bar list with a value, an optional secondary value, a top-N cap with an overflow row, a text readout for assistive tech and a `layout` of `inline` or `stacked`. Bars are silver and a flagged row is red; `formatValue(value, row?)` also formats the hidden total. `ui/charts/kit/silverRed.ts` holds the silver/red tones (moved from `custom/Fatigue/fatigue-tokens.ts`, which re-exports them) and `silverRed(mode)` (TP-848).

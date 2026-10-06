---
section: Added
---

`BarList` (`ui/charts/bar-list`), a ranked horizontal bar list with a value, an optional secondary value, a top-N cap with an overflow row, a text readout for assistive tech and a `layout` of `inline` or `stacked`. Bars are silver and a flagged row is red; the value, secondary value and flag label sit in aligned columns right of the bar. `readouts` chooses which of the value and the flag label a row prints; a hidden one stays in the row's accessible name and in a tip that hover, keyboard focus (the list is one tab stop) or a long press opens. `formatValue(value, row?)` also formats the hidden total. `ui/charts/kit/silverRed.ts` holds the silver/red tones (moved from `custom/Fatigue/fatigue-tokens.ts`, which re-exports them) and `silverRed(mode)` (TP-848).

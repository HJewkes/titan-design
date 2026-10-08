---
section: Added
---

`BarList` (`ui/charts/bar-list`), a ranked horizontal bar list with a value, an optional secondary value, a top-N cap with an overflow row, a text readout for assistive tech and a `layout` of `inline` or `stacked`. Bars are silver; a flagged row is red, a quieter red for a `warning` flag (near a limit) and the full red for `error` (over it). The flag's label is not printed in the row: it is in the row's accessible name and in a tip that hover, keyboard focus (the list is one tab stop) or a long press opens. `isValueHidden` takes the value out of the row the same way. The value and secondary value sit in aligned columns right of the bar. `formatValue(value, row?)` also formats the hidden total. `ui/charts/kit/silverRed.ts` holds the silver/red tones (moved from `custom/Fatigue/fatigue-tokens.ts`, which re-exports them) and `silverRed(mode)` with `neutral`, `near` and `over` (TP-848).

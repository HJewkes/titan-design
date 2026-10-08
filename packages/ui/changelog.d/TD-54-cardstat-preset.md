---
section: Added
---

`CardStat` (`ui/card`), the Card stat preset: a `filled` Card one plane up holding a `Metric`, with `label`, `value`, `unit`, `size`, `align` and a `tone` that colours the value from a semantic token. `Metric` takes `valueStyle`. `Tile` now renders a `CardStat` (its value sits over its label, on the card plane), and its `valueColor` is deprecated in favour of `tone` (TD-54).

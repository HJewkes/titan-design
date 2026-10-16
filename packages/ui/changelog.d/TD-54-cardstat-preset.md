---
section: Added
---

`CardStat` (`ui/card`), the Card stat preset: a `filled` Card one plane up holding a `Metric`, with `label`, `value`, `unit`, `size`, `align`, a `tone` that colours the value from a semantic token, and `metricProps` for the Metric's class and style hooks. `Metric` takes `valueStyle` and `labelPosition` (`above` or `below`, default `below`). `Tile` now renders a `CardStat` with no visual change; a `bg-<token>` class on it still sets its plane, and its `valueColor` is deprecated in favour of `tone` (TD-54).

---
section: Added
---

`AnimatedNumber` counts or rolls a number from `from` to `value` as a caller-driven `progress` goes 0 → 1, landing exactly on `format(value)` at 1 and always labelling the final value for assistive tech (`mode: 'count' | 'reel'`, TD-846). `formatGrouped` joins `utils/number-format`.

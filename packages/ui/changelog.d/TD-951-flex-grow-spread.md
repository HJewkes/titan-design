---
section: Internal
---

`pnpm audit:stories` collects each node's `flex-grow`, and `gap-outlier` and `proximity-inversion` skip a gap a flex-grow child spreads: a `flex: 1` cell whose box reaches past its ink into the gap, or an inkless `flex: 1` spacer. A lift row with a `flex: 1` name cell no longer reads as a 41× gap outlier or an inverted group. The `space-between` and auto-margin exemption stays (TD-951).

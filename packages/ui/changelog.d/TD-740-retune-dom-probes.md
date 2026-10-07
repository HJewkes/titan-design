---
section: Changed
---

`pnpm audit:stories` retunes four DOM probes from a catch report (TD-740): `proximity-inversion` needs the inner gap to be 1.5 times the outer one and skips painted groups and control rows nearer their content than their items are apart; `gap-outlier` skips `space-between` and auto-margin rows; `alignment-near-miss` reads the baseline a browser aligns a child by (an icon-first child at the icon's bottom). Every kind stays a warning.

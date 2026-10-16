---
section: Fixed
---

`BodyMapDetailPanel` takes `unit` (`'lb' | 'kg'`, default `'lb'`) and labels its e1RM, band, PR and prior-best figures and the mini `StrengthTrendChart` with it instead of a hardcoded lb; `bandLabel` takes the same optional `unit`. Opening the sheet focuses it with `preventScroll`, so an off-screen sheet mid-slide no longer scrolls a narrow page sideways (VW-950).

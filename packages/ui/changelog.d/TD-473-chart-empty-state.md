---
section: Added
---

`Scatter` and `Treemap` take `emptyState`; with no data (Treemap: no positive `value`) they draw it, or a "No data" `EmptyState`, centred in the chart box in place of bare axes or a blank box. `Gauge` takes `value: number | null`: `null` or a non-finite value draws the unfilled track and a dash readout, and `emptyState` replaces the dash (TD-473).

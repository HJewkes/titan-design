---
section: Added
---

`Scatter`, `Treemap` and `Gauge` take `emptyState`. With no data, `Scatter` keeps its axes and draws it, or a "No data" `EmptyState`, centred inside them over the plot box; `Treemap` (no positive `value`) draws it centred in the chart box in place of a blank box. `Gauge` takes `value: number | null`: `null` or a non-finite value draws the unfilled track with the "No data" `EmptyState` in the centre (TD-473).

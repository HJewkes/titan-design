---
section: Added
---

`laneLayout({ lanes, rankEdgeKinds })` lays a `NetworkGraph` out as swimlanes: one full-width `box` band per lane in the order given, columns from the same longest-path ranking as `layeredLayout`, rows stacked inside each band, and a trailing `Other` band for nodes in no lane (TD-1034).

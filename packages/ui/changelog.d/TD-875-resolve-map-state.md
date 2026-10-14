---
section: Added
---

`resolveMapState(timeline, layout, t)` is the network-graph map's pure state model: node, edge, card and minimap state at video time `t`, with no clock and no rendering, so a seek and a frame-by-frame sweep agree (TD-875). Internal to `network-graph/map`; not yet exported from the barrel.

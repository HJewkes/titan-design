---
section: Changed
---

`ZoneTrack` drops the clip-reveal gradient fill: a `fill` marker now requires `color`. Zones take an
optional `faded` colour for the zone highlight, so only the zone the marker lands in keeps its
colour. The `GradientFill` and `LandmarkFill` stories give way to `ZoneHighlight` (TD-750).

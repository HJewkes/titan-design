---
section: Changed
---

`ZoneTrack` drops the clip-reveal gradient fill: a `fill` marker now requires `color`. Zones take an
optional `faded` colour for the zone highlight, so only the zone the marker lands in keeps its
colour. The zone highlight is ZoneTrack's one story design; the `GradientFill`, `LandmarkFill`,
`Needle`, `SolidTrendFill`, `BandWithMarker`, `BareTrack`, `WallDensity`, `Glow` and
`ColoredTooltipTicks` stories are removed, and the modes they showed stay for FatigueMeter,
VolumeLandmarkBar and BodyweightGoalCard. The `needleOverhang` prop is removed; the overhang now
follows `size` (TD-750).

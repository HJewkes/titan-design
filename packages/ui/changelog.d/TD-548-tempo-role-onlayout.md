---
section: Fixed
---

`TempoDisplay` no longer renders an inert button (no role, tabindex or press styles) when neither `onPress` nor `showInfo` is set, and `ZoneTrack` now calls the consumer's `onLayout` as well as its own width handler (TD-548).

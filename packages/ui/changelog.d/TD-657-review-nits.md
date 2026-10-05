---
section: Internal
---

Three review nits (TD-657). The three `shell/workout` `*.decision` stories and `DatavizLightPalette` keep `status:lab` and now also carry `!status:review`. `CapacityBandChart` treats a `null` projection as absent, as it already did for the projection pixels, so it no longer draws an empty projection layer. `titan/no-raw-spacing` now covers the 16 `custom/Workout` files that the TD-6 split wave created from enrolled parents.

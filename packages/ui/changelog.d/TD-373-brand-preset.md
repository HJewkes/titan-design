---
section: Changed
---

Breaking: `brand` is now required on `AppShell`, `TopBar` and `BrandLockup`, and no longer defaults to `voltras`. It takes a `BrandKey` or a `BrandPreset` object, so an app with no registry entry passes its own mark, wordmark, accent and subtitle. `resolveBrand` maps either form to the preset. The registry keys and values are unchanged, and `WorkoutShell` passes `voltras` itself. A caller that relied on the default must now pass `brand="voltras"`. This needs a minor bump (TD-373).

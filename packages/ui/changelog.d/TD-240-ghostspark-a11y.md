---
section: Fixed
---

`GhostSpark` and `DualGhostSpark` now expose a text alternative: the wrapper is an image with a label such as "Rep 5 of 8, peak 0.62 m/s" (the dual adds left and right peaks), an `accessibilityLabel` prop overrides it, and the `<svg>` is hidden from the accessibility tree so the band labels stop leaking (TD-240).

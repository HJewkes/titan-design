---
section: Fixed
---

`springSettleS` and `springEase` stay tight just above and below critical damping, where the settle bound used to blow up (TD-864). Both throw a `RangeError` for damping of 0 or less instead of returning Infinity and NaN (TD-865).

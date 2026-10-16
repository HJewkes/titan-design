---
section: Changed
---

`ui/motion` refuses bad input instead of animating NaN: `seekClock().seek(t)` throws a `RangeError` for a non-finite `t` and keeps the previous time, `cubicBezier` throws for a non-finite argument or an x outside [0, 1] (as CSS does), a clock warns when its subscribers re-enter notify 10 deep and throws at 100, and `useBeatTime` (so `BeatFrame` and `useBeatEnvelope`) throws outside a `Beat` instead of reading a zero-length window (TD-873).

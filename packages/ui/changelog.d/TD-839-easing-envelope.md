---
section: Added
---

`ui/motion` gains an easing vocabulary (`easeIn`, `easeOut`, `easeInOut`, `poly`, `back`, `smoothstep`, `smootherstep`), `springSettleS` and `springEase` (a spring fitted to a 0-to-1 window, exactly 1 at the end), `interpolateScale` (lerps in signed-area space), per-segment easing in `keyframes`, `envelope` and `useBeatEnvelope` (fixed in and out with an elastic hold, compressed in proportion when the window is short), `cropInset` (a `clip-path: inset(...)` string) and `interpolateColor`, which mixes resolved hex colours in Oklab; it bypasses tokens, so prefer cross-fading token-painted layers (TD-839).

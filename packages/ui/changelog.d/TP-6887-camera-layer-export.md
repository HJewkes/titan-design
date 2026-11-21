---
section: Added
---

`camera`, `CAMERA_MOTION` (a 1.5 s move on smootherstep), `fitBox`, `project`, `unproject` and the camera types export from `@titan-design/react-ui/motion`, and from a new `@titan-design/react-ui/motion/camera` entry that imports neither react nor react-native, for node callers (TP-6887). `camera()` now defaults to `CAMERA_MOTION.ease` (smootherstep) instead of `MOTION.ease.inOut`; nothing called it before, so no render changes.

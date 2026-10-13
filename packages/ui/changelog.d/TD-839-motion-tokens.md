---
section: Added
---

The `motion` tokens gain a video tier for time-driven motion (TD-839). `ease.in` is a new exit curve, also published as `--ease-in` and the Tailwind `ease-in` key. `motion.video` holds the video durations (emphasis 0.5 s, enter 1.0 s, hero and count 1.5 s, exit 0.85 × enter), a 60 ms stagger capped at 0.5 s per cascade, plus `rise` and `scaleFrom`. `motion.spring` adds `snappy`, `smooth`, `heavy` and `bouncy` presets, and `motion.dim.context` (35% opacity, fully desaturated) is the weight for de-emphasised context. `MOTION` exposes them in seconds, adds `MOTION.staggerEachS(count)`, and damps every spring critically unless `MOTION.springPreset(name, { allowOvershoot: true })` asks for the payoff overshoot. The existing eases and durations, and their CSS values, are unchanged.

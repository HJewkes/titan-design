---
section: Added
---

`motion.tiers` (`video`, `app`) and `motion.presets` (`riseIn`, `countUp`, `payoff`) in the theme
tokens, and `MOTION.preset(name, tier)` in `/motion`, which evaluates a preset's duration, stagger,
values and reduced-motion fallback at a tier. ChapterCard takes its rise and exit ratio from
`riseIn`; its frames are unchanged (TD-909).

---
section: Changed
---

Mono text renders in JetBrains Mono (OFL 1.1), self-hosted in `src/theme/fonts/` like the other families. `fontFamilies.mono` and `--font-family-mono` are one stack, `'JetBrains Mono', monospace`, instead of two system-font lists that differed per host (TD-840). Its ligatures are off: `font-mono` sets `font-variant-ligatures: none`, so `!=` and `=>` show the two characters typed.

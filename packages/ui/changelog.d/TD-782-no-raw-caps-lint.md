---
section: Internal
---

`titan/no-raw-caps` flags `uppercase`, `tracking-*`, `text-[Npx]`, `textTransform` and
`letterSpacing` outside `Typography` and `Eyebrow`, ratcheted by `no-raw-caps-baseline.json`
(`scripts/update-no-raw-caps-baseline.mjs` regenerates it). `typography-roles.test.ts` holds
eyebrow sites to `overline` or `microLabel` on `text-text-secondary` and value sites to
`font-bold` on `text-text-primary`, with today's misses in a shrink-only baseline (TD-782).

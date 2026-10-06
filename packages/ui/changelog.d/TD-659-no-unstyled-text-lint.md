---
section: Internal
---

New `titan/no-unstyled-text` lint across `src/` (tests exempt): a react-native `Text` with no `className`, no `style`, no spread and no Text ancestor renders black 14px System on web, so it is blocked outside a shrink-only baseline (3 sites in 3 files). An unspent baseline allowance is reported as stale until `node scripts/update-no-unstyled-text-baseline.mjs` regenerates it (TD-659).

---
section: Internal
---

New `titan/no-truncation` lint for `custom/` and `shell/`: truncation props, properties and classes are blocked outside a shrink-only baseline (24 sites in 18 files) and an owner allowlist. An unspent baseline allowance is reported as stale until `node scripts/update-no-truncation-baseline.mjs` regenerates it (TD-327).

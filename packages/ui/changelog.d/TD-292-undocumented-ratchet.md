---
section: Internal
---

`api-undocumented.test.ts` ratchets `(undocumented)` exports in the API reports against `api/undocumented-baseline.json`; the baseline only shrinks, and `pnpm api:update` refuses growth without `--allow-increase` (TD-292).

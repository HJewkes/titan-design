---
section: Internal
---

`pnpm docs:check` type-checks the `ts` and `tsx` fences in the markdown docs against the `src` entries and runs in CI. Fences that fail today are listed in a shrink-only baseline; a fence that is not standalone code opts out with the info string `tsx fragment` (TD-290).

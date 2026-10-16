---
section: Internal
---

`pnpm type-check:examples` type-checks the stories and tests, which `tsconfig.json` excludes, and runs in CI. Today's errors are counted per file in a shrink-only baseline: a new error fails, and so does a fixed one until its entry is lowered with `--update` (TD-293).

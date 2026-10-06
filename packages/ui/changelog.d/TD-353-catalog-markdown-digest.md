---
section: Added
---

`pnpm catalog` also writes `docs/component-catalog.md`, a markdown digest of `component-catalog.json` with one row per entry (name, status, family, purpose, composes, first story id), sorted by name and free of global counts so a change to one entry touches only its row. It ships in the package under `docs/`. `src/arch/component-catalog.digest.test.ts` renders the committed JSON and fails when the markdown differs, naming the stale rows (TD-353).

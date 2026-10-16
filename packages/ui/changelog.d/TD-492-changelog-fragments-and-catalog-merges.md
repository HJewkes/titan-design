---
section: Internal
---

Changelog entries are per-PR fragments in `changelog.d/` (`pnpm changelog:compile` folds them into `[Unreleased]` at release), and `component-catalog.json` drops its global `inputsHash`; the freshness test regenerates the catalog and compares it byte for byte. Neither file now conflicts between open PRs (TD-492).

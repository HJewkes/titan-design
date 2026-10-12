---
section: Internal
---

`arch-graph.json` stores only nodes and whole-library figures; the edge list and counts are derived when read, so two PRs that each add a component no longer conflict in it. The barrel hash and `pnpm arch:barrel-hash` are gone; the freshness test now fails on a missing node or a node whose file was deleted (TD-792).

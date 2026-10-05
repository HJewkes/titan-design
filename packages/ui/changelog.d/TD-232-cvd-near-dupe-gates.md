---
section: Internal
---

Token tests now gate colour-vision deficiency and near-duplicate colours: `token-cvd.test.ts` holds the categorical all-pairs and `dataviz-diverging-*` / `dataviz-sequential-*` adjacent-step deutan/protan floors in both modes, and `token-near-dupes.test.ts` fails a new semantic colour within ΔE 3 of another, against a shrink-only `near-dupe-baseline.json` (TD-232).

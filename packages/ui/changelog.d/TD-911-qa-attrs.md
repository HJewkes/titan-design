---
section: Added
---

`StatCard`, `StateChip` and `NetworkGraph` emit the `data-qa-*` hooks a render-QA inspector reads (`data-qa-container` and `data-qa-title` on the card, `data-qa-glyph` on the chip label, `data-qa-context` on dimmed graph nodes), through one internal `qaAttrs()` helper. Attributes only; nothing paints differently (TD-911).

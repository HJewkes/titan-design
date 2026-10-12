---
section: Changed
---

`font-heading` (Space Grotesk) now renders weights 400-500 as designed: the three `@font-face` rules declare `font-weight: 300 700`, matching the shipped variable files (wght 300-700), so medium and regular heading-face text no longer falls back to 600. Native consumers must register the lighter Space Grotesk weights themselves (TD-804).

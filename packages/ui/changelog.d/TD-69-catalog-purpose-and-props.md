---
section: Changed
---

`src/arch/component-catalog.json` now fills each entry's `purpose` (the first JSDoc sentence on the entry export) and `props` (from react-docgen-typescript, inherited `node_modules` props dropped, sorted by name: `name`, `type`, `required`, `default` and `description`), and records `sources.props`. The freshness test regenerates through one docgen program and proves with a source overlay on `Alert.tsx` that a function-body edit passes while a changed purpose sentence or an added prop fails (TD-69).

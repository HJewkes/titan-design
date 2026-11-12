---
section: Added
---

`SchemaForm` renders a controlled form from an object JSON Schema: strings with a `maxLength` counter, string enums as a select, numbers, booleans, nested objects and arrays whose rows add, remove and reorder inside `minItems`/`maxItems`, with per-path `errors` and read-only `lockedIds` (TD-1031).

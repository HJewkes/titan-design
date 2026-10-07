---
section: Fixed
---

`MarkdownProse` now warns in development when a `ProseLinker` pattern carries regex flags such as `i` or `u`, which the combined tokenizer has always dropped; the `ProseLinker` docs state the rule (TD-542).

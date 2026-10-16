---
section: Internal
---

Three script CLIs (`check-doc-examples`, `check-examples-types`, `check-release-bump`) use the shared `isEntryPoint` guard, so they still run when invoked through a symlink (TD-648).

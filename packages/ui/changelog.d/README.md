# Changelog fragments

Record a change here instead of editing `CHANGELOG.md`, so two open PRs never edit the same
lines. One file per PR, `<TASK-ID>-<slug>.md`:

```markdown
---
section: Added
---

`Foo` takes `bar` (TD-1).
```

`section` is one of Added, Changed, Deprecated, Removed, Fixed, Security, Internal. The release
PR runs `pnpm changelog:compile`, which folds every fragment into `## [Unreleased]` and deletes it.

---
section: Fixed
---

`SessionList` no longer reuses a React key for two period groups when sessions arrive unsorted and a month repeats; each group is keyed by position and label, and grouping order is unchanged (TD-544).

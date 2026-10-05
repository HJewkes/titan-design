---
section: Fixed
---

`Autocomplete` keeps the label of an option clicked just after the input blurs; the 200 ms blur reset no longer overwrites it with the previous selection, and the timer is cleared on unmount (TD-523).

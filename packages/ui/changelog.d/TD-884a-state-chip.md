---
section: Added
---

`StateChip` shows whether a requirement is met: a tone capsule, success when met and neutral with a
dashed border when unmet. Given `from` and `progress` it draws the change as a pure function of
progress: entering met fills to warning left to right, then turns to success; leaving met cross-fades
back with no fill. `stateChipLook` exports the same timeline for other renderers (TD-884).

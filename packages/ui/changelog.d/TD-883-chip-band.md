---
section: Added
---

`ChipBand` lays one beat's citations on a single line at video scale: the lead `EvidenceChip` with its
citation, the next chips as kind tabs and the rest as a `+d` count. Entry is a 60 ms stagger capped at
0.5 s, a pure function of `progress`, so a seeked frame equals a played one. Like `EvidenceChip`, it
exports from `@titan-design/react-ui/motion` only (TD-883, TD-893).

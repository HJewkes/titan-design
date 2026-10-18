---
section: Changed
---

`EvidenceChip` and `elideSource`, with their types `EvidenceChipProps`, `EvidenceChipSize`, `EvidenceKind`,
`ElidedSource` and `ElisionLevel`, export from `@titan-design/react-ui/motion` instead of the root entry, so
video work spends the `/motion` budget rather than the root's (TD-893). They are new in this release and
no published version exported them from the root, so this changes no published import.

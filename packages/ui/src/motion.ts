// Subpath entry: @titan-design/react-ui/motion
//
// The motion kit (`ui/motion`): clocks, easing, interpolation, springs,
// timelines, noise and the Beat/MotionProvider runtime. It ships behind its own
// subpath (decision 323c, motion plan D3) so the remaining motion slices grow
// this entry rather than the root bundle every consumer measures.
export * from './components/ui/motion'

// Video-only components and utils (TD-893). They live in their own `ui/` and
// `utils/` homes but export from here alone, so video work spends this entry's
// budget rather than the root's.
export { EvidenceChip } from './components/ui/chip/EvidenceChip'
export type { EvidenceChipProps, EvidenceChipSize } from './components/ui/chip/EvidenceChip'
export type { EvidenceKind } from './components/ui/chip/evidence'
export { elideSource } from './utils/elideSource'
export type { ElidedSource, ElisionLevel } from './utils/elideSource'

// Subpath entry: @titan-design/react-ui/motion
//
// The motion kit (`ui/motion`): clocks, easing, interpolation, springs,
// timelines, noise and the Beat/MotionProvider runtime. It ships behind its own
// subpath (decision 323c, motion plan D3) so the remaining motion slices grow
// this entry rather than the root bundle every consumer measures.
export * from './components/ui/motion'

// The arch map's pop-out card and its file content (TD-897). They move to the `/diagram` subpath
// once it exists (TD-904); until then they stay out of the root entry to hold its bundle budget.
export * from './components/ui/map-card'
export {
  FileCard,
  type FileCardProps,
  type FileCardStatus,
} from './components/custom/Code/FileCard'
export {
  FILE_CARD_METRIC_ORDER,
  type FileCardMetric,
} from './components/custom/Code/file-card-rows'

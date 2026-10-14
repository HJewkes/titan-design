// Subpath entry: @titan-design/react-ui/motion
//
// The motion kit (`ui/motion`): clocks, easing, interpolation, springs,
// timelines, noise and the Beat/MotionProvider runtime. It ships behind its own
// subpath (decision 323c, motion plan D3) so the remaining motion slices grow
// this entry rather than the root bundle every consumer measures.
export * from './components/ui/motion'

// SchemaCard (TD-859) ships here, not in the index entry, whose bundle budget is spent; the home of
// the diagram suite's components is an open owner question.
export {
  SchemaCard,
  schemaCardDurationS,
  schemaCardSize,
  type SchemaCardProps,
  type SchemaData,
  type SchemaField,
  type SchemaFieldRef,
  type SchemaHighlight,
  type SchemaRelation,
  type SchemaTable,
} from './components/ui/charts/schema-card'

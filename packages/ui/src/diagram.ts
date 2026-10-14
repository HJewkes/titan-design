// Subpath entry: @titan-design/react-ui/diagram
//
// The network-graph map suite's pure contract (owner decision 336(3)): the D0
// layout and timeline types, the D1 `resolveMapState` model and the validators.
// It sits behind its own subpath so the map suite grows this entry rather than
// the root bundle every consumer measures.
export type * from './components/ui/charts/network-graph/map/types'
export {
  MAP_WEIGHT,
  mapTime,
  resolveMapState,
  type MapCardState,
  type MapNodeState,
  type MapState,
} from './components/ui/charts/network-graph/map/map-state-model'
export {
  validateMapLayout,
  validateMapTimeline,
} from './components/ui/charts/network-graph/map/validate'
// Card content the map suite's MapCard hosts (TD-859).
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

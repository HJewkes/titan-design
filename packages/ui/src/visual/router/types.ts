// Shared shapes for the visual router: patterns.ts, catalogue.ts and route.ts.

export type PatternId =
  | 'fan-in-queue'
  | 'stage-framework'
  | 'input-to-artifact'
  | 'paired-traces'
  | 'paved-road'
  | 'control-catalog'
  | 'compensating-layers'
  | 'block-decomposition'
  | 'lifecycle'

export type TypeId =
  | 'architecture'
  | 'architecture-delta'
  | 'it-current-state'
  | 'flowchart'
  | 'sequence'
  | 'state-machine'
  | 'er'
  | 'timeline'
  | 'swimlane'
  | 'quadrant'
  | 'radar'
  | 'polar'
  | 'loop'
  | 'nested'
  | 'tree'
  | 'org-chart'
  | 'layer-stack'
  | 'exploded-axonometric'
  | 'axonometric-plan'
  | 'venn'
  | 'funnel'
  | 'bar'
  | 'waterfall'
  | 'treemap'
  | 'heatmap'
  | 'line'
  | 'gantt'
  | 'scatter'
  | 'high-level'
  | 'process'
  | 'tiers'
  | 'data-flow'
  | 'hub-spoke'
  | 'access-matrix'
  | 'sankey'
  | 'fishbone'
  | 'wardley'
  | 'kanban'
  | 'user-journey'
  | 'service-blueprint'
  | 'deployment'
  | 'dependency-graph'
  | 'uml-class'
  | 'story-map'
  | 'db-schema'

/**
 * `have`: a component on main renders the type. Every other status is a gap:
 * `in-flight` (another task owns it), `ng` (to build on NetworkGraph), `new` (new
 * geometry), `template` (a preset over existing components) and `skip` (not planned).
 */
export type TypeStatus = 'have' | 'in-flight' | 'ng' | 'new' | 'template' | 'skip'

export interface VisualPattern {
  id: PatternId
  name: string
  /** What the reader must come away understanding. */
  trigger: string
  primitives: readonly string[]
  budget: string
  nearestType: TypeId
}

export interface NotThis {
  when: string
  use: TypeId
}

export interface VisualType {
  id: TypeId
  name: string
  bestFor: string
  notThis: readonly NotThis[]
  patterns: readonly PatternId[]
  budget: string
  status: TypeStatus
  /** Where the type is (or will be) built in titan-design. */
  basis: string
  /** Export name of the rendering component; null until the type is `have`. */
  component: string | null
  storyId: string | null
  /** Adapter name in `visual/presets/` when the type is a preset over `component`. */
  preset?: string
  /** Closest `have` types to render instead while this one is a gap, best first. */
  fallback: readonly TypeId[]
}

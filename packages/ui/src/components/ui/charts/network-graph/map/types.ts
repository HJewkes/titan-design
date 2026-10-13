// The repo-map/v1 layout and the compiled MapTimeline: data only, no React. See API-NOTE.md.

/** An axis-aligned box in the layout's one absolute frame, in px. */
export interface MapBox {
  x: number
  y: number
  w: number
  h: number
}

/** A point in the layout frame, in px. */
export type MapPoint = readonly [number, number]

/** Where an edge's evidence comes from. `traced` is inferred and paints dashed. */
export type MapEdgeSource = 'import' | 'call' | 'protocol' | 'traced'

/** One zoom level. Level 0 is the coarsest; a node's children sit one or more levels deeper. */
export interface MapLevel {
  id: number
  name: string
}

/** A box on the map. Its box lies inside its parent's box, so every level shares one frame. */
export interface MapNode {
  id: string
  label: string
  sublabel?: string
  level: number
  parentId?: string
  kind?: string
  box: MapBox
  /** An overflow node stands for this many pruned siblings. */
  hidden?: number
}

/** A directed edge. `route` is the absolute polyline from the source's border to the target's. */
export interface MapEdge {
  id: string
  source: string
  target: string
  level: number
  kind?: string
  edgeSource: MapEdgeSource
  label?: string
  weight?: number
  /** Routed by the pipeline at every level. Absent means a border-to-border straight line. */
  route?: readonly MapPoint[]
}

/** One numbered step of a flow, along one edge. */
export interface MapFlowHop {
  step: number
  edgeId: string
  from: string
  to: string
  edgeSource: MapEdgeSource
}

/** A path through the map, such as one request. `projected` folds the hops to a coarser level. */
export interface MapFlow {
  id: string
  title?: string
  hops: readonly MapFlowHop[]
  projected?: Readonly<Record<number, readonly { from: string; to: string }[]>>
}

/** A pop-out card anchored to a node. Its content is the consumer's; the map knows only the anchor. */
export interface MapCardRef {
  id: string
  kind: string
  anchor: string
}

/** The precomputed layout: one frame, every level, every route. Never re-laid out at render. */
export interface MapLayout {
  version: 'repo-map/v1'
  width: number
  height: number
  levels: readonly MapLevel[]
  nodes: readonly MapNode[]
  edges: readonly MapEdge[]
  flows: readonly MapFlow[]
  cards: readonly MapCardRef[]
  sha: string
}

/** The annotation marks a keyframe can place on a node. */
export type MapMark = 'circle' | 'box' | 'underline' | 'arrow' | 'marker'

/** Ops whose keyframe names a set of node, edge or card ids. */
export type MapIdsOp = 'reveal' | 'edge' | 'focus' | 'lit' | 'card-in' | 'card-out'

/** A keyframe op over a set of ids. `focus` and `lit` replace the previous set; an empty set clears it. */
export interface MapIdsKeyframe {
  op: MapIdsOp
  ids: readonly string[]
}

/**
 * The op-specific half of a keyframe. D1 resolves `reveal`, `edge`, `focus`, `lit`, `card-in`,
 * `card-out`, `level` and `minimap`; `camera`, `flow`, `annotate` and `pin` are read by later layers.
 */
export type MapKeyframeOp =
  | MapIdsKeyframe
  | { op: 'level'; level: number }
  | { op: 'minimap'; on: boolean }
  | { op: 'camera'; box: MapBox }
  | { op: 'flow'; flowId: string; fromHop: number; toHop: number; speed?: 1 | 3 }
  | { op: 'annotate'; anchor: string; mark: MapMark }
  | { op: 'pin'; anchor: string; text: string }

/** One change, starting at `atS` video seconds and taking `durS` seconds of map time. */
export type MapKeyframe = { atS: number; durS: number } & MapKeyframeOp

/** A stretch of video, `[startS, endS)`, during which the map is on screen. */
export interface MapSpan {
  startS: number
  endS: number
}

/** A compiled timeline: keyframes sorted by `atS`, and the spans the map is on screen. */
export interface MapTimeline {
  layoutSha: string
  /** Absent means the map is on screen for the whole video. */
  spans?: readonly MapSpan[]
  keyframes: readonly MapKeyframe[]
}

# NetworkGraph API note

Source: TP-850 Round 0 contract (owner-decided), restated in our own words for the part that has
landed. TP-850a (TP-1040) ships the model, the layout seam, two layouts and fixtures, all pure `.ts`.
The component (`NetworkGraph.tsx`, `NetworkGraphPlot.tsx`, `useNetworkGraph.ts`, story, barrel and
README row) arrives with TP-850b (TP-1041). Nothing here is exported from a barrel yet.

## Purpose

A directed graph of things and relations. A node has a label and an optional kind. An edge says its
source acts on its target; it has an optional kind and an optional weight (a count). Position carries
no other meaning. Nodes, edges and kinds name no domain concept, so the unit sits in
`ui/charts/network-graph/`.

## Files

| File                               | Holds                                                              |
| ---------------------------------- | ------------------------------------------------------------------ |
| `types.ts`                         | Data, layout and model types, and `NetworkGraphProps` (type only). |
| `network-graph-model.ts`           | Cleaning, indexing, weight bins, edge path, `buildGraphModel`.     |
| `network-graph-focus.ts`           | `nextFocus`, keyboard traversal over the graph.                    |
| `network-graph-text.ts`            | `nodeLabel`, `edgeLabel`, `summarizeGraph`.                        |
| `layouts/layered-layout-model.ts`  | `layeredLayout(options)`.                                          |
| `layouts/supplied-layout-model.ts` | `suppliedLayout(positions)`.                                       |
| `fixtures.ts`                      | Synthetic graphs at 5, 30 and 150 nodes, and the edge-case set.    |

## The layout seam

A layout is a value, `GraphLayout = { key, compute }`.

- `compute({ nodes, edges, width, height })` is pure and synchronous. The nodes and edges are already
  cleaned: unique node ids, known endpoints, no self edges, duplicate edges merged.
- It returns `{ positions, order, width, height }`. `width` and `height` are the natural size and may
  exceed the viewport. A node with no position, or a non-finite one, is not drawn, and neither are its
  edges. `buildGraphModel` drops them and counts them.
- Determinism is the layout's contract. The same input in any order gives the same output. A layout
  that needs randomness takes a `seed` option and draws from `kit/seededRandom.ts`.
- `key` is a string built from the factory's options, so a factory called inline on every render
  costs nothing: the caller memoises on `key`, not on the object.
- One layout is one file, `layouts/<name>-layout-model.ts`, exporting a factory. A consumer may write
  its own `GraphLayout`.

TP-851 adds `force-`, `ego-` and `clustered-layout-model.ts`. `d3-force` is imported only by the force
file. `GraphLayoutResult` may gain optional fields later (`groups`, `edgeShape`, `labelMode`); this
slice adds none of them.

## Cleaning

`cleanGraph` keeps the first of duplicate node ids. It drops self edges and edges to unknown ids.
Edges with the same source, target and kind merge: weights sum, `null` plus a number is the number,
and the newest `activityAt` wins. A weight that is `NaN`, infinite or negative counts as unknown
(`null`). Every edge gets a unique id, `${source}->${target}:${kind ?? ''}` by default. Every drop is
counted in `GraphCleanReport` and reported by `summarizeGraph`.

## The layered layout

No dependency. Nodes and ranking edges are sorted by id first, so input order never matters. Ranking
edges are those whose kind is in `rankEdgeKinds` (every edge by default). A ranking edge that would
close a cycle, taken in id order, is dropped. A node's layer is its longest path from a root. Its
primary parent is its first ranking predecessor by id. A leaf takes the next row and a parent centres
on its first and last child. Layers run left to right at 186 px, rows top to bottom at 30 px. The
natural size holds the last column and 160 px of label room.

## The supplied layout

`suppliedLayout(positions)` places each input node at its own point. A node with no entry, or with a
non-finite `x` or `y`, is left out. `order` follows y, then x, then id. Its `key` lists the positions.

## Keyboard traversal

`nextFocus(index, focus, key)` follows the graph, not the geometry, so it is the same for every layout.
Keys are `Down`, `Up`, `Right`, `Left`, `Home` and `End`. It returns the next focus or `null`, and it
never wraps.

| Key       | From a node                  | From an edge                                            |
| --------- | ---------------------------- | ------------------------------------------------------- |
| Down, Up  | Next, previous node in order | Next, previous edge of the node it was entered from     |
| Right     | First outgoing edge          | The edge's target                                       |
| Left      | First incoming edge          | The edge's source                                       |
| Home, End | First, last node in order    | First, last edge of that node (outgoing, then incoming) |

An edge focus carries `from`, the node it was entered from, so Down and Up keep their anchor.

## Accessibility

Names come from `nodeLabel` (`"<label>, <kind>, <n> incoming, <m> outgoing"`, the id when the label is
empty) and `edgeLabel` (`"<source> to <target>, <kind>, weight <w>"` or `weight unknown`).
`summarizeGraph` gives node and edge counts, counts per kind, the most connected node, and every
dropped or unplaced count. A graph with one node and no edges claims no structure. The pure modules
render nothing, so they carry no jest-axe test; the component tests in TP-850b do.

## Fixtures

Names are invented (`lead-01`, `worker-07`, `human-01`, `alpha-03`). Large graphs use `seededRandom`,
so every import gives the same data. `networkGraphFixtures` holds Small (5), Medium (30), Large (150),
Wide fan-out, Deep chain, Supplied, Empty, One item, No edges, All equal, Missing values, Many kinds,
Pulse, Long label and Hostile. `hostilePositions` holds the supplied positions for the Hostile case,
two nodes missing and one non-finite, for use with `suppliedLayout`.

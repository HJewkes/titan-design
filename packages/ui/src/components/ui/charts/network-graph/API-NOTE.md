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

| File                                | Holds                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------- |
| `types.ts`                          | Data, layout and model types, and `NetworkGraphProps` (type only).                     |
| `network-graph-model.ts`            | Cleaning, indexing, weight bins, edge path, `buildGraphModel`.                         |
| `network-graph-focus.ts`            | `nextFocus`, keyboard traversal over the graph.                                        |
| `network-graph-text.ts`             | `nodeLabel`, `edgeLabel`, `summarizeGraph`.                                            |
| `layouts/layered-layout-model.ts`   | `layeredLayout(options)`.                                                              |
| `layouts/supplied-layout-model.ts`  | `suppliedLayout(positions)`.                                                           |
| `layouts/layout-geometry.ts`        | `LAYOUT_DEFAULTS`, `toSeed`, `clampInt`, `frameLayout`, `readingOrder`, `packCircles`. |
| `layouts/force-layout-model.ts`     | `forceLayout(options)` and `simulateForces`; the only `d3-force` importer.             |
| `layouts/ego-layout-model.ts`       | `egoLayout(options)`: rings by hop around a focus, no random source.                   |
| `layouts/clustered-layout-model.ts` | `clusteredLayout(options)`: force per group, regions packed in rows.                   |
| `fixtures.ts`                       | Synthetic graphs at 5, 30 and 150 nodes, and the edge-case set.                        |

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
file. `GraphLayoutResult` gains the optional `edgeShape` (`'horizontal'` or `'arc'`, default horizontal) and
`labelMode` (`'all'` or `'declutter'`, default all) with the force layout, and the optional `groups`
(`GraphGroupRegion[]`) with the ego and clustered layouts.

## Cleaning

`cleanGraph` output never depends on input order. The exact order is:

1. Nodes: the first of duplicate node ids is kept, then nodes sort by id (plain code-unit comparison).
2. Edges: self edges and edges to unknown ids are dropped. Edges with the same source, target and
   kind form one group. A group merges into one edge: it takes the smallest id among its members,
   weights sum (ascending, so float sums do not depend on order; `null` plus a number is the
   number), and the newest `activityAt` wins.
3. Merged edges sort by source, then target, then kind (a missing kind sorts as `''`). The three form
   a total order because each group has a distinct triple.
4. Unique ids are assigned in that sorted order: an edge whose id is already taken becomes
   `<id>#2`, `<id>#3` and so on. The default id is `${source}->${target}:${kind ?? ''}`.

A weight that is `NaN`, infinite or negative counts as unknown (`null`). Every drop is counted in
`GraphCleanReport` and reported by `summarizeGraph`, whose per-kind counts list kinds in sorted order
of their label.

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

## The force layout

`forceLayout({ seed, iterations })` runs `d3-force` forces without `forceSimulation`, whose constructor
starts a `d3-timer`. It steps the forces itself in a fixed loop, so `compute` stays pure and leaves no
timer behind.

1. Nodes sort by id and edges by source, then target, by code unit. An edge with an unknown endpoint or
   a repeated endpoint is dropped. Edges are copied as plain ids, so the input is never mutated.
2. `seed` goes through `toSeed` (a finite number becomes an unsigned 32-bit integer, anything else 1)
   into `seededRandom`. Start positions draw from it in id order inside a square of
   `80 * sqrt(n)` px.
3. Forces, in this order: many-body repulsion, link (distance 80), collide (radius 14), then `forceX(0)`
   and `forceY(0)`, which keep unlinked parts in view. All use the seeded random source.
4. The loop runs exactly `iterations` times (default 300, floored and clamped to 1..1000, NaN gives
   300). Each pass cools alpha by `1 - 0.001 ** (1 / iterations)`, calls each force, then moves each
   node by its velocity after a 0.6 decay. This is the body of `simulation.tick`.
5. `frameLayout` translates every node at least 24 px from the top and left, adds 160 px of label room
   on the right, centres the padded box when it is smaller than the viewport, and rounds to 0.01 px.
   `order` is reading order: 30 px bands by y, then x, then id. The result asks for arc edges and
   decluttered labels.

Edge weight does not change the layout. Positions are not stable when the data changes; a consumer that
needs stability passes the last positions through `suppliedLayout`. The guarantee is the same
JavaScript engine: floating-point results can differ across engines.

`key` is `JSON.stringify(['force', seed, iterations])` after sanitising, so `forceLayout()` and
`forceLayout({ seed: 1, iterations: 300 })` share it.

The force layout counts each distinct node id once, so a repeated id in raw input adds no second body.

## Groups on a layout result

`groups` is a list of `GraphGroupRegion`: `{ id, label, nodeIds, cx, cy, radius, variant }`, in the
same frame as the positions. `variant: 'region'` is a disc that encloses its members (clustered);
`variant: 'ring'` is an outline at a hop distance (ego). A radius of 0 is not painted. Each label is
meant for the members' accessible names and the summary, so hop and membership are never position
alone; the painting and the wording arrive with TP-851c and TP-851d.

## The ego layout

`egoLayout({ focusId, hops, direction })` places the nodes within `hops` of the focus on rings. It
has no `seed`, because it draws no random number.

1. A `null` or unknown `focusId` places nothing, so the empty state renders.
2. `direction` picks the adjacency: `'both'` (default) treats every edge as two-way, `'outgoing'`
   follows source to target, `'incoming'` target to source. Neighbour lists are in id order; edges
   with an unknown or repeated endpoint are ignored.
3. Breadth-first search from the focus up to `hops` (default 2, floored, at least 0; NaN gives 2,
   Infinity reaches the whole component). Each ring lists its nodes in discovery order, so the
   children of one node sit together.
4. Ring radius: `r(0) = 0`, `r(d) = max(r(d - 1) + 120, count * 40 / (2 * PI))`, so a crowded ring
   grows and keeps 40 px of arc per node. Node `i` of `count` sits at angle `-PI / 2 + 2 * PI * i / count`.
5. `order` is the focus, then ring by ring in angular order. `groups` holds one `'ring'` per populated
   hop (`hop-0` labelled `focus` with radius 0, then `1 hop`, `2 hops`), all centred on the focus.
   The natural size holds the outermost ring, not only its nodes.
6. Arc edges and decluttered labels. Every edge between two placed nodes is drawn.

`key` is `JSON.stringify(['ego', focusId, hops, direction])` after sanitising.

## The clustered layout

`clusteredLayout({ seed, iterations, groups, ungroupedLabel })` gives each group a region. It uses
`simulateForces` and imports no `d3-force` of its own.

1. A node's group is `node.group`; no group, or `''`, is ungrouped. In raw input with a repeated id,
   the smallest group wins, so input order never matters.
2. Region order: the `groups` option in the order given (the first entry wins on a repeated id), then
   unlisted group ids sorted, then one ungrouped region last. A listed group with no member gives no
   region. A label is the option's label, else the group id; the ungrouped region has id `''` (no
   group id can equal it) and label `ungroupedLabel` (default `Ungrouped`).
3. Each group is simulated alone on its own edges (`seed`, `iterations` as the force layout). Edges
   between groups shape nothing, so one group changing never moves the inside of another.
4. A region is a circle at the centre of its members' bounding box; its radius is the furthest member
   plus 24 px.
5. Regions are packed in rows in region order with `packCircles`: a 32 px gap and a 24 px label band
   above every row. Rows wrap so the framed width stays within the viewport unless one region alone
   is wider.
6. `order` runs region by region, reading order inside each. Arc edges and decluttered labels.

`key` is `JSON.stringify(['clustered', seed, iterations, groups, ungroupedLabel])` after sanitising.

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
Pulse, Long label, Hostile, Two components, Mutual pair, Grouped (40), Hub and spokes, Directed chain,
One group and Many groups. `Large (150)` gives every node the group of its root. A fixture may carry
the `focusId` an ego view centres on and the `groups` a clustered view orders by. `hostilePositions`
holds the supplied positions for the Hostile case, two nodes missing and one non-finite, for use with
`suppliedLayout`. `hostileLayoutOptions` holds hostile seeds, iterations, focus ids, hops and groups.

# NetworkGraph map: Round 0 contract (TD-874, slice D0 of the architecture diagram suite)

Status: **draft**. Contract only: types, synthetic fixtures and a pure validator. No component, story or barrel export
exists yet. The model (D1, TD-875) is pure `.ts` beside these files. The painter (D2) extends NetworkGraph after #798
lands.

## Owner decisions (2026-10-13)

1. **Home.** The map extends NetworkGraph rather than living in a sibling directory. New files go in
   `network-graph/map/`. Until #798 lands, nothing here edits an existing NetworkGraph file.
2. **Export.** The suite ships later through a `/diagram` subpath. Nothing is exported now: no barrel, size-limit or
   API report entry.
3. **The map is optional per beat.** A video leaves the map for other slides and comes back. While it is off screen,
   the map's clock stops; on re-entry the state resumes from where it stopped (see _Map clock_).
4. **Every level is routed.** L2 and L3 edges are routed by the compound ELK layout. L0 and L1 edges come from a second
   ELK pass over the collapsed graph with the boxes fixed. Every fixture edge carries a `route`.

## Purpose

A map is one nested layout in one coordinate frame. A node is a box; a node one level deeper sits inside its parent's
box, so zooming in shows the children inside the parent, and no level is laid out again. An edge is a directed
relation with a routed polyline. A flow is an ordered path of hops along edges. A card is a pop-out anchored to a node.
Nodes, levels, kinds and cards name no domain concept: the fixture describes a code base, but nothing in the types
does.

Everything is precomputed. The pipeline emits the `repo-map/v1` layout (with a sha) and compiles each beat's map
state into a `MapTimeline`. Render is a pure function of the layout, the timeline and `t`. Nothing is measured, laid
out or randomised at render.

## Files

| File                 | Holds                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| `types.ts`           | `MapLayout` (repo-map/v1) and `MapTimeline`, data only.                                            |
| `fixtures.ts`        | `mapLayoutFixture` (four levels, routed at every level), `mapTimelineFixture` (map, non-map, map). |
| `validate.ts`        | `validateMapLayout`, `validateMapTimeline`: pure invariant checks.                                 |
| `fixtures.test.ts`   | The fixtures are valid, and each invariant has a failing case.                                     |
| `map-state-model.ts` | `resolveMapState`, `mapTime`, `MAP_WEIGHT`: the pure state model (D1).                             |

## Layout invariants (`validateMapLayout`)

- Node ids are unique; edge ids are unique.
- A child is deeper than its parent, and its box lies inside the parent's box, edges included.
- An edge's ends exist. A route has at least two points, starts on or in its source box and ends on or in its target
  box.
- A flow hop names an existing edge with the same `from` and `to`. A card's anchor is an existing node.

Units: px in the layout frame, origin top-left. The pipeline rounds coordinates to 0.5 px. Extra fields in the JSON
(repo, engine, stats, card data) are ignored by titan; card content is the consumer's.

## Timeline

A `MapTimeline` is a sorted list of keyframes. Each starts at `atS` (video seconds, resolved from spoken cues by the
pipeline) and takes `durS` seconds. `reveal`, `edge`, `focus`, `lit`, `card-in` and `card-out` carry ids; `focus`
and `lit` replace the previous set, and an empty set clears it. `level`, `minimap`, `camera`, `flow`, `annotate` and
`pin` carry their own fields.

`spans` lists the stretches `[startS, endS)` of video during which the map is on screen. A beat without map state adds
no span. No `spans` means the map is on screen throughout. Every keyframe starts inside a span.

### Map clock

The map keeps its own clock, `mapT`: the on-screen time elapsed before `t`. It stops between spans. A keyframe's start
is converted to map time and its `durS` runs in map time, so a change that straddles an exit finishes after the map
returns. The camera and flow layers read the same `mapT`, so every layer resumes together.

## State model (`resolveMapState`)

`resolveMapState(timeline, layout, t)` returns the map's state at video time `t`. It reads no clock, hook or previous
frame; a cold seek and a 1/60 s sweep agree at every frame. It imports only `interpolate` and `MOTION` from the motion
core. Every change eases with `MOTION.ease.inOut` over `[atS, atS + durS]` in map time, and a change that interrupts
another starts from the value at that moment.

| Channel             | Rule                                                                                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `nodes[id].opacity` | 0 until the node's first `reveal`, then 1. A node no `reveal` names is always 1.                                     |
| `nodes[id].weight`  | `MAP_WEIGHT.full` (1) for the focus set, `MAP_WEIGHT.context` (0.35) for the rest; no focus is full.                 |
| `nodes[id].lit`     | 1 for the `lit` set, else 0.                                                                                         |
| `edges[id]`         | Draw-on progress, 0 until the edge's first `edge` keyframe. An edge none names is always 1.                          |
| `cards`             | `enter` and `exit` progress, sorted as `layout.cards`. A card is listed from its `card-in` until its exit completes. |
| `level`, `minimap`  | The latest `level` (a step; D5 cross-fades by camera scale); the minimap fades 0 to 1.                               |
| `mapT`, `onMap`     | The map clock and whether `t` falls inside a span. Off the map the state holds.                                      |

`MAP_WEIGHT.context` is local until the motion core gains a context weight token; it moves there with the `/diagram`
subpath.

## Not in this slice

The painter (D2), the camera (`motion/camera.ts`, D4), semantic zoom, the flow
token, cards and the minimap. The `map_state` beat schema and its lints live with the pipeline, which compiles them
into a `MapTimeline`.

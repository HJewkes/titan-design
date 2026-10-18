---
section: Added
---

`NetworkGraph` layouts can ask for three more shapes, each additive: `nodeShape: 'box'` with `nodeBoxes` paints each node as its rectangle, with the label centred inside and the press target and tooltip over the whole box; a group `variant: 'box'` with a `box` paints a compound rectangle under its members, outermost first; and `edgeShape: 'routed'` with `routes` draws each edge through every point of its route, or straight from border to border when it has none, with parallel straight edges 18px apart. `GraphBox` is the new rectangle type, and `GraphModel` gains `nodeShape`, `nodeBoxes` and `routes`. A layout that sets none of these paints exactly as before (TD-877).

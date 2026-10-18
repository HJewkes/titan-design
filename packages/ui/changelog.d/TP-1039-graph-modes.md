---
section: Added
---

`NetworkGraph` paints its free-form layouts and exports them: `forceLayout`, `egoLayout` and `clusteredLayout` (with `ForceLayoutOptions`, `EgoLayoutOptions`, `EgoDirection`, `ClusteredLayoutOptions`, `GraphGroup` and `GraphGroupRegion`). A layout that asks for arcs gets quadratic edges with the arrowhead at the target's rim, a clustered layout's regions and an ego layout's hop rings are painted under the edges with their labels (hidden from assistive tech, since each node's name, tooltip and the summary already state its group or hop), and a decluttered layout leaves out labels that would overlap while the selected node, the active node and its neighbours always keep theirs. The story's `layout` control gains `force`, `ego` and `clustered` with `seed`, `iterations`, `hops`, `focusId` and `direction` args; in ego mode pressing a node refocuses the view (TP-1039).

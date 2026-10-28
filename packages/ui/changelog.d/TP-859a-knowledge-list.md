---
section: Added
---

`KnowledgeList` (`custom/ActiveWork`), a filterable, sortable, paged table of notes and sources across initiatives. A row's title is a link that selects it. The list reports unreadable files in a warning `Alert`, has separate empty and no-match states, and has a `slots.filterBar` that replaces its built-in Input-and-Select filter row. `KnowledgeClassLabel` shows a record class as a categorical dot beside its name. `knowledge-class` owns the record-class vocabulary and accepts singular and plural wire names. `knowledge-filters` holds the `KnowledgeItem` view model, `filterKnowledge`, `knowledgeFacetCounts` and `uniqueKnowledge`. `Link` now activates on Enter when it has no `href`, because react-native-web leaves Enter to a native anchor that is not there. TaskRow's capped tag cell moves into a shared `TagPills` (TP-859a).

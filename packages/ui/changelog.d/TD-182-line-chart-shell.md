---
section: Internal
---

`ui/charts/line-chart/`: the `LineChart` shell on the TD-181 model. One plot of up to six series painted as a single image named by the generated summary, with gridlines, labelled reference lines and boundary rules, direct end labels or a legend, and a `Skeleton` and an empty placeholder for the loading and empty states. The points are one tab stop: arrow keys, Home and End move the active point, `aria-activedescendant` names it, a `Tooltip` readout follows it, and Enter or Space calls `onPointPress`. Facets beyond six series and the compact size are not drawn yet. Not yet exported (TD-182).

# Visual router

Generated from `src/visual/router/` by `pnpm visual-router:digest`. Do not edit by hand.

Pick a pattern first when behaviour, risk or enforcement is the point of the picture, and draw it
with the pattern’s type. Otherwise pick a type by what it is best for, and check its “not this”
list. `routeVisual({ pattern, type, need })` from `@titan-design/react-ui/visual-router` returns
the same answer as these tables, including the closest available type for a gap.

- `have`: a component on main renders the type.
- `in-flight`: a contract or model is on main and another task owns the component.
- `ng`: to be built on NetworkGraph: a layout, the map suite or node shapes.
- `new`: a new component with its own computed geometry.
- `template`: a preset over existing components that adds no geometry.
- `skip`: not planned.

## Patterns

| Pattern | When | Draw with | Status | Renders now |
| --- | --- | --- | --- | --- |
| Fan-in queue (`fan-in-queue`) | Several producers feed one constrained resource, so waiting and capacity tell the story. | `data-flow` | ng | gap: closest `dependency-graph`, NetworkGraph |
| Stage framework (`stage-framework`) | Every stage answers the same set of questions, and comparing stages matters most. | `process` | template | gap: closest `timeline`, Timeline |
| Input to artifact (`input-to-artifact`) | Loose input such as a chat or notes is turned into a lasting structured record. | `data-flow` | ng | gap: closest `dependency-graph`, NetworkGraph |
| Paired traces (`paired-traces`) | Two similar requests end differently and the reader must find where they split. | `flowchart` | ng | gap: closest `dependency-graph`, NetworkGraph |
| Paved road (`paved-road`) | A supported route crosses trust boundaries, and some routes must be shown as blocked. | `architecture` | ng | gap: closest `dependency-graph`, NetworkGraph |
| Control catalogue (`control-catalog`) | Controls only make sense grouped by the surface that enforces them. | `layer-stack` | new | gap: closest `bar`, BarList |
| Compensating layers (`compensating-layers`) | Each defence catches some of what the previous one missed, and some risk survives. | `layer-stack` | new | gap: closest `bar`, BarList |
| Block decomposition (`block-decomposition`) | A system breaks into parts that each carry a stable id someone can cite. | `tree` | ng | gap: closest `dependency-graph`, NetworkGraph |
| Lifecycle (`lifecycle`) | One subject moves through phases, and its waits, retries and endings carry weight. | `state-machine` | ng | gap: closest `dependency-graph`, NetworkGraph |

### Fan-in queue (`fan-in-queue`)

Several producers feed one constrained resource, so waiting and capacity tell the story.

- **Show:** named sources; a queue showing its depth; a capacity figure with units; the single constrained service; accepted and turned-away outcomes.
- **Budget:** Up to 5 sources and 5 queued items; group extra sources into one cohort.
- **Draw with:** `data-flow`

### Stage framework (`stage-framework`)

Every stage answers the same set of questions, and comparing stages matters most.

- **Show:** stage headers in order; one slot row per question, labelled; a visible marker for an empty slot; handoffs between stages.
- **Budget:** 3 to 6 stages, at most 4 slot rows, about 20 filled cells.
- **Draw with:** `process`

### Input to artifact (`input-to-artifact`)

Loose input such as a chat or notes is turned into a lasting structured record.

- **Show:** a short excerpt of the input; the transformation step, named; the finished record with its fields; links from statements to the fields they fill; fields still unknown.
- **Budget:** At most 4 input excerpts, 6 record fields and 3 provenance links.
- **Draw with:** `data-flow`

### Paired traces (`paired-traces`)

Two similar requests end differently and the reader must find where they split.

- **Show:** one shared ordered rule list; a worded status per rule on each side; the first point of divergence, marked; an outcome per trace.
- **Budget:** Two traces, 3 to 6 rules, one marked divergence.
- **Draw with:** `flowchart`

### Paved road (`paved-road`)

A supported route crosses trust boundaries, and some routes must be shown as blocked.

- **Show:** labelled trust zones; allowed routes with a text label; blocked routes that end at the zone edge; the privileged gate; where audit records land.
- **Budget:** Up to 3 zones, 8 components and 2 blocked routes.
- **Draw with:** `architecture`

### Control catalogue (`control-catalog`)

Controls only make sense grouped by the surface that enforces them.

- **Show:** one group per enforcement surface; named controls; who or what enforces each; when it runs; gaps and exception routes.
- **Budget:** 3 to 5 surfaces, about 24 controls in all.
- **Draw with:** `layer-stack`

### Compensating layers (`compensating-layers`)

Each defence catches some of what the previous one missed, and some risk survives.

- **Show:** the incoming risk; layers in order, each with what it stops; what slips past each layer; the residual risk at the end, stated in words.
- **Budget:** 3 to 5 layers following one risk thread.
- **Draw with:** `layer-stack`

### Block decomposition (`block-decomposition`)

A system breaks into parts that each carry a stable id someone can cite.

- **Show:** an id badge per block; a noun name per block; parent to child links only; detail kept in data, not on the canvas.
- **Budget:** Root plus 3 levels, about 9 visible blocks; split by subsystem beyond that.
- **Draw with:** `tree`

### Lifecycle (`lifecycle`)

One subject moves through phases, and its waits, retries and endings carry weight.

- **Show:** a main rail of phases; a separate band for waiting and recovery; a separate band for end states; labelled transitions.
- **Budget:** 4 or 5 main phases, at most 9 states and 10 transitions.
- **Draw with:** `state-machine`

## Types

| Type | Status | Renders now | Best for | Not this | Patterns | Budget |
| --- | --- | --- | --- | --- | --- | --- |
| Architecture (`architecture`) | ng | gap: closest `dependency-graph`, NetworkGraph | Components, the boundaries around them and the connections that cross those lines. | the point is what changed between two versions: `architecture-delta`; machines, zones and replicas matter more than logical parts: `deployment` | `paved-road` | About 9 components in at most 3 zones. |
| Architecture delta (`architecture-delta`) | ng | gap: closest `dependency-graph`, NetworkGraph | Before and after views of one system, with additions, removals and moves called out. | only one state of the system matters: `architecture` | — | One system in two states, with a change ledger of up to 8 rows. |
| IT current state (`it-current-state`) | ng | gap: closest `dependency-graph`, NetworkGraph | An inventory of the systems in place today, grouped by department or phase. | the connections between systems are the message: `architecture` | — | Up to 5 groups of 4 systems. |
| Flowchart (`flowchart`) | ng | gap: closest `dependency-graph`, NetworkGraph | Branching decisions and algorithms where steps lead to yes or no choices. | several actors exchange messages over time: `sequence`; one subject moves between named states: `state-machine`; owners and handoffs matter more than the logic: `swimlane` | `paired-traces` | About 9 steps and 3 decisions. |
| Sequence (`sequence`) | new | gap: closest `timeline`, Timeline | Messages passed between actors in order, such as a request and its response. | there is one subject and its state is what changes: `state-machine`; the order of decisions matters, not who sends what: `flowchart` | `paired-traces` | Up to 5 actors and 12 messages. |
| State machine (`state-machine`) | ng | gap: closest `dependency-graph`, NetworkGraph | The states one subject can be in and the events that move it between them. | actors trade messages: `sequence`; the steps are decisions, not states: `flowchart` | `lifecycle` | About 9 states and 10 transitions. |
| Entity relationship (`er`) | have | SchemaCard | Entities, their attributes and how many of one relate to another. | physical tables, keys and column types are the point: `db-schema`; classes carry methods and inheritance: `uml-class` | — | Up to 6 entities of 8 attributes. |
| Timeline (`timeline`) | have | Timeline | Dated events placed along one time axis. | tasks span date ranges: `gantt`; a measure changes continuously over time: `line` | — | About 12 events on one axis. |
| Swimlane (`swimlane`) | new | gap: closest `timeline`, Timeline | Work passing between owners, one lane per owner, with each handoff drawn. | rows are questions asked at every stage rather than owners: `process`; there is only one owner: `flowchart` | `stage-framework` | Up to 5 lanes and 6 stages. |
| Quadrant (`quadrant`) | template | gap: closest `scatter`, Scatter | Items placed on two judged axes and read by the corner they land in. | both axes are measured and the spread matters: `scatter` | — | About 12 items and one label per corner. |
| Radar (`radar`) | new | gap: closest `bar`, BarList | A few items compared across the same five to eight measures. | more than three items are compared: `bar`; the categories repeat in a cycle such as months: `polar` | — | 3 to 8 axes and at most 3 series. |
| Polar (`polar`) | new | gap: closest `bar`, BarList | Values for categories that wrap around, such as hours of a day. | the categories have no natural cycle: `bar` | — | Up to 12 segments. |
| Loop (`loop`) | ng | gap: closest `dependency-graph`, NetworkGraph | A cycle that feeds itself, such as a flywheel or a review loop. | the cycle has exits and end states: `state-machine` | — | 3 to 6 steps around one hub. |
| Nested (`nested`) | ng | gap: closest `treemap`, Treemap | Containment where each level sits wholly inside the one above. | a parent has several children: `tree`; the levels are ordered defences, not containers: `layer-stack` | `compensating-layers` | Up to 5 levels in a single chain. |
| Tree (`tree`) | ng | gap: closest `dependency-graph`, NetworkGraph | A hierarchy in which each child has exactly one parent. | a node has several parents or links form cycles: `dependency-graph`; the nodes are people with roles: `org-chart`; the size of each branch is the message: `treemap` | `block-decomposition` | Root plus 3 levels, about 5 children per node. |
| Org chart (`org-chart`) | ng | gap: closest `dependency-graph`, NetworkGraph | Who reports to whom, with a name and role on each card. | the nodes are not people or teams: `tree` | — | About 12 cards over 3 levels. |
| Layer stack (`layer-stack`) | new | gap: closest `bar`, BarList | Ordered layers, each resting on the one beneath, with what each layer holds. | the layers are containers drawn inside one another: `nested`; it is a data platform split into quality tiers: `tiers` | `control-catalog`, `compensating-layers` | 4 to 6 layers with a few items each. |
| Exploded axonometric (`exploded-axonometric`) | skip | gap: closest `treemap`, Treemap | Illustrated 3D art that pulls a product apart into its parts. | the parts and how they stack are what matters: `layer-stack`; the parts form a hierarchy: `tree` | — | Not planned. |
| Axonometric plan (`axonometric-plan`) | skip | gap: closest `treemap`, Treemap | A floor-plan illustration of a physical space. | zones and what runs in them are the point: `deployment`; logical parts and their links are the point: `architecture` | — | Not planned. |
| Venn (`venn`) | new | gap: closest `bar`, BarList | Overlaps between two or three sets, with a count or label per region. | there are more than three sets: `heatmap`; set sizes matter more than their overlap: `bar` | — | 2 or 3 sets. |
| Pyramid / funnel (`funnel`) | new | gap: closest `bar`, BarList | Stages that narrow by value, or a ranked hierarchy drawn widest at the base. | the stages do not narrow: `bar`; flows split and merge between stages: `sankey` | — | 3 to 7 tiers. |
| Bar (`bar`) | have | BarList | Comparing one value across categories. | the categories are points in time and the trend matters: `line`; a running total steps up and down: `waterfall`; the values are nested parts of one whole: `treemap` | — | About 12 bars. |
| Waterfall (`waterfall`) | new | gap: closest `bar`, BarList | How a starting total becomes a final one through gains and losses. | each value stands on its own: `bar` | — | Up to 10 steps. |
| Treemap (`treemap`) | have | Treemap | Shares of a whole across many parts, nested when the parts group. | there are only a few parts: `bar`; the hierarchy itself matters more than size: `tree` | — | About 30 leaves in two levels. |
| Heatmap (`heatmap`) | in-flight | gap: closest `treemap`, Treemap | A grid of two categories with an intensity in each cell. | each cell holds a category, not a level: `access-matrix` | — | Up to 12 by 12 cells and 4 intensity steps. |
| Line (`line`) | in-flight | gap: closest `scatter`, Scatter | A measure changing over time, including slope, bump and ridgeline forms. | the data are discrete events, not a measure: `timeline`; the categories have no order: `bar` | — | Up to 5 series. |
| Gantt (`gantt`) | new | gap: closest `timeline`, Timeline | Tasks with start and end dates on one time axis, plus milestones. | events are single moments: `timeline`; cards move through workflow columns: `kanban` | — | About 15 rows. |
| Scatter (`scatter`) | have | Scatter | How two measures relate across many items, with bubble size as an optional third. | the axes are judgements and the corners carry meaning: `quadrant`; one measure is tracked over time: `line` | — | Points readable without overlap; label at most 8. |
| High-level overview (`high-level`) | template | gap: closest `dependency-graph`, NetworkGraph | A one-glance overview of a data stack, with phases across the top. | routes and boundaries need detail: `architecture` | — | Up to 5 phases and 9 components. |
| Process (`process`) | template | gap: closest `timeline`, Timeline | Ordered stages that each answer the same questions, with inputs and outputs. | the rows are owners, not questions: `swimlane`; branching decisions matter: `flowchart` | `stage-framework`, `input-to-artifact` | 3 to 6 stages and up to 4 slot rows. |
| Tiers (medallion) (`tiers`) | template | gap: closest `bar`, BarList | Data quality tiers from raw to curated, with who may read each. | the layers are general, not data quality tiers: `layer-stack` | — | 3 or 4 tiers. |
| Data flow (`data-flow`) | ng | gap: closest `dependency-graph`, NetworkGraph | Where data comes from, what transforms it and where it ends up. | the order of decisions is the point: `flowchart`; volumes split and merge along the way: `sankey` | `fan-in-queue`, `input-to-artifact` | About 9 nodes grouped by role. |
| Hub and spoke (`hub-spoke`) | ng | gap: closest `dependency-graph`, NetworkGraph | One central system and those around it, labelled with how each connects. | the outer systems also connect to each other: `dependency-graph` | — | Up to 8 spokes. |
| Access matrix (`access-matrix`) | template | gap: closest `bar`, BarList | Which roles may do what, with one categorical value per cell. | the cells hold a level, not a category: `heatmap`; controls are grouped by where they are enforced: `layer-stack` | `control-catalog` | Up to 8 roles by 10 resources. |
| Sankey (`sankey`) | new | gap: closest `dependency-graph`, NetworkGraph | Quantities moving from sources to destinations, with band width set by volume. | the stages only narrow, without splitting: `funnel`; the paths matter, not the amounts: `data-flow` | — | Up to 12 nodes in 4 columns. |
| Fishbone (`fishbone`) | new | gap: closest `dependency-graph`, NetworkGraph | Causes of one effect, grouped into categories along a spine. | the causes form a general hierarchy: `tree` | — | 4 to 6 categories with 3 causes each. |
| Wardley map (`wardley`) | ng | gap: closest `scatter`, Scatter | Components placed by how visible they are to users and how mature they are. | the axes are opinions with no maturity scale: `quadrant` | — | About 15 components. |
| Kanban (`kanban`) | in-flight | gap: closest `bar`, BarList | Work items shown as cards in workflow columns. | dates and durations matter: `gantt` | — | 3 to 6 columns. |
| User journey (`user-journey`) | template | gap: closest `timeline`, Timeline | A customer's steps through a service and how they feel at each one. | back-office work matters as much as the customer: `service-blueprint` | — | 4 to 7 steps. |
| Service blueprint (`service-blueprint`) | template | gap: closest `timeline`, Timeline | A service seen from the customer down through staff and back-office systems. | only the customer view matters: `user-journey` | — | 4 or 5 lanes and up to 7 steps. |
| Deployment (`deployment`) | ng | gap: closest `dependency-graph`, NetworkGraph | What runs where: zones, hosts and replica counts. | logical parts matter, not where they run: `architecture` | — | Up to 3 zones and 9 hosts. |
| Dependency graph (`dependency-graph`) | have | NetworkGraph | Things that depend on other things, including shared and circular dependencies. | every node has exactly one parent: `tree`; boundaries and zones matter: `architecture` | — | About 20 nodes before grouping. |
| UML class (`uml-class`) | template | gap: closest `er`, SchemaCard | Classes with their fields, operations and inheritance. | the model is stored data, not behaviour: `er` | — | Up to 6 classes. |
| Story map (`story-map`) | template | gap: closest `treemap`, Treemap | User activities across the top, stories beneath by priority, and release cuts. | work moves through status columns: `kanban` | — | Up to 6 activities and 3 releases. |
| Database schema (`db-schema`) | have | SchemaCard | Tables, columns, keys and the foreign keys between them. | the model is conceptual, without column types: `er` | — | Up to 6 tables. |

## Attribution

Routing by semantic pattern before type, the type list, the “not this” lists and complexity
budgets are ideas from cathrynlavery/diagram-design (MIT, © 2025 Cathryn Lavery). All wording,
budgets and titan mappings here are titan’s own.

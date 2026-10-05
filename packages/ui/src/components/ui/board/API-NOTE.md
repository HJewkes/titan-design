# Board API note

Source: TP-852 Round 0 contract (accepted), Part B, restated here in our own words. This is a design
note for a component that does not exist yet (`ui/board/`, story `Components/Organisms/Board`). Only the
model, types and fixtures are on disk. Nothing is exported from any barrel.

## Purpose

A read-only kanban board. Each item sits in exactly one column and, when lanes are on, in exactly one
lane. A column is a stage and its count is the number of items the consumer passed for it. A column
`limit` is the largest count the stage should hold: the board reports under, at and over, and never hides
an item because of it. A lane is a second grouping that runs across every column. Order inside a cell is
the consumer's array order. No drag, no reorder, no write.

## Controlled versus uncontrolled

One state slice: the active card (the roving tab stop), as `activeItemId` / `defaultActiveItemId` /
`onActiveItemChange`. It is normally uncontrolled.

`highlightedItemId` is an input, not state: the board never changes it and runs no timer. When it changes
to a known id the board scrolls that card into view, makes it the active card and reports
`onActiveItemChange`. It does not move DOM focus. An unknown id is a no-op.

## Composition

`renderCard` is the one render slot; the card is consumer vocabulary. The board wraps each card in its own
`Pressable`, which owns the focus ring, the highlight ring, the accessible name (`item.label`) and the
press. Cards must not contain pressable children in v1, because a button inside the wrapper fails axe
`nested-interactive`. The header is fixed anatomy: tone dot, label, count, limit, an optional `Tooltip`
for `description`, then `headerTrailing`. State slots (`emptyState`, `emptyCell`) have `ui/` defaults.

## Colour

The board holds no id-to-colour table. A column's colour comes only from `column.tone`. `BoardTone` is a
subset of `PillTone`, so one record can type both a board column and a `Pill` that shows the same stage
elsewhere. `brand-secondary` is left out because `Indicator` has no matching colour. A sixth hue needs an
owner decision, never an inline colour.

## Accessibility

WAI-ARIA APG grid, layout-grid variant, with the card as the focus target. All structure uses raw `role`
and `aria-*` props, because React Native Web drops `accessibilityState`.

- Root: `role="grid"`, `aria-label`, `aria-rowcount`, `aria-colcount`, `aria-busy`, `aria-disabled`.
- Header row: `role="row"` of `role="columnheader"` cells, each naming its label, count and limit in
  words through `formatCount`, for example "Drafting, 6 items, at limit of 6".
- One `role="row"` per lane with a `role="rowheader"`, then one `role="gridcell"` per column. With no
  lanes there is one body row and no row header.
- Inside a cell: the card wrappers, each `role="button"` when `onItemPress` is set, else `role="group"`.
- An over-limit count carries text and an icon, not colour alone (WCAG 1.4.1).

One tab stop with roving `tabIndex`.

| Key                       | Action                                                                                                                           |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Tab, Shift+Tab            | Enter the board at the active card (or the first card), leave it                                                                 |
| Down, Up                  | Next or previous card in the cell; at the cell's edge, the nearest card in the same column of the next or previous lane. No wrap |
| Right, Left               | The nearest non-empty cell in the same lane in that direction, at the same index, clamped to its last card. No wrap              |
| Home, End                 | First, last card of the current cell                                                                                             |
| Control+Home, Control+End | First card of the first non-empty column, last card of the last non-empty column                                                 |
| Page Down, Page Up        | Ten cards down or up the column, crossing lanes                                                                                  |
| Enter, Space              | `onItemPress(item)` unless `isDisabled`                                                                                          |

Empty cells are skipped, because the column header already announces "0 items". A cell holds many cards,
so Down and Up move inside the cell before they cross lanes. Focus follows the active card and scrolls it
into view.

## Virtualisation

None in v1: cards vary in height and the shared window function needs one fixed item size. The DOM is
bounded another way. A cell renders at most `maxItemsPerCell` cards (default 50), then a static line such
as "+ 382 more". Counts always cover every item. The highlighted and the active card are always rendered,
even past the fold. Contract size: 900 items, 5 columns, 8 lanes.

## Internal modules

`board-model.ts`, pure and named so mutation testing reaches it:

- `buildBoardModel(columns, lanes, items)` returns rows of cells, counts per column, and `problems`. It
  drops later duplicate ids (items, columns, lanes), drops items with an unknown `columnId` and reports
  them, and routes a missing or unknown `laneId` to a trailing catch-all row (`UNASSIGNED_LANE_ID`). With
  no lanes there is one row and `laneId` on items is ignored.
- `limitStatus(count, limit)` returns `'none' | 'under' | 'at' | 'over'`. Anything but a positive integer
  limit is `'none'`.
- `foldCell(items, max, pinnedIds)` returns the visible items and the hidden count.
- `nextItem(model, activeId, key, fold)` returns the next active id, never wrapping and never landing on
  an empty or folded card. An unknown active id enters at the first card.

A later `useBoardNavigation` owns the active id, the key handler, the ref registry and the highlight
effect. `Board.tsx` and `BoardParts.tsx` stay thin bindings.

Properties to test: every kept item is in exactly one cell; kept plus dropped equals unique ids in;
hostile input never throws; a fold keeps a subsequence that holds every pinned id; `nextItem` always
returns a visible id.

## Fixtures

`fixtures.ts` holds ten synthetic fixtures: Default, Lanes, Over limit, One item, Empty, No columns, Very
large (900 items, 432 in the last column), Long label, Missing and Hostile. All names are invented (an
editorial pipeline) and every fixture is deterministic by construction. Every fixture except Missing and
Hostile references only column and lane ids it declares.

## Cross-platform

Keys and scroll-into-view are web behaviour. On native the board renders, scrolls and presses; it has no
hardware-key navigation and does not auto-scroll to the highlight.

## Decisions

- A lane is a row that crosses every column, so the keyboard sees a rectangular grid.
- Items are plain `BoardItem<T>` objects with `columnId` and `laneId`, not accessor functions.
- An unknown `columnId` drops the item and lists it in `problems`; a missing lane is normal data and goes
  to the catch-all lane.
- A fold has no expand control, so the active position is always an item id. The consumer raises the cap
  or filters.
- Column and lane collapse is out of scope. The names `collapsedColumnIds`, `defaultCollapsedColumnIds`
  and `onCollapsedColumnIdsChange` are reserved and not in `types.ts`.
- Highlight is one id, input only, no timer, no focus steal.
- Nested pressables inside cards are not supported in v1.
- `BoardTone` excludes `brand-secondary`.

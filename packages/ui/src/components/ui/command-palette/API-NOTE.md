# CommandPalette API note

Source: TP-853 Round 0 contract, Part B, restated here with the two seat overrides applied. This is a
design note for a component that does not exist yet (`ui/command-palette/`, story
`Components/Organisms/CommandPalette`). The pure model (`palette-model.ts`), its types and its
fixtures land first; the hook, the component and the stories follow. Nothing here is exported from
any barrel.

## Pending owner decision

1. **Leading glyph (TD-407).** `components/icons` has no search glyph. Whether the input shows one,
   and whether a `SearchIcon` joins the icon set, waits on the owner. Until then the input has no
   leading glyph; the placeholder already says what the field does.

## Purpose

A grouped, fuzzy-ranked list of places to jump to and actions to run, read from one text input
inside a modal dialog. Items come from a static list the palette ranks itself, and from an optional
async source whose results arrive already ranked. The palette owns the query text, the ranking of
static items, the request lifecycle of the async source and the active row. It does not own
navigation, the storage of recent items or the shortcut that opens it.

## Props

| Prop                                     | Type                                               | Default      | Notes                                                                     |
| ---------------------------------------- | -------------------------------------------------- | ------------ | ------------------------------------------------------------------------- |
| `isOpen`                                 | `boolean`                                          | uncontrolled | Controlled open state.                                                    |
| `defaultIsOpen`                          | `boolean`                                          | `false`      | Initial open state when uncontrolled.                                     |
| `onOpenChange`                           | `(isOpen: boolean) => void`                        | unset        | Fires on Escape, a backdrop press and a closing select.                   |
| `query`, `defaultQuery`, `onQueryChange` | `string`, `string`, `(query: string) => void`      | `''`         | Full controlled triplet.                                                  |
| `items`                                  | `CommandItem<T>[]`                                 | `[]`         | Static source; the palette ranks it.                                      |
| `groups`                                 | `CommandGroup[]`                                   | `[]`         | Array order is display order.                                             |
| `loadResults`                            | `(query, { signal }) => Promise<CommandItem<T>[]>` | unset        | Async source; results keep the order returned.                            |
| `debounceMs`                             | `number`                                           | 150          | Delay before `loadResults` runs.                                          |
| `minQueryLength`                         | `number`                                           | 2            | Async source only.                                                        |
| `onLoadError`                            | `(error: unknown) => void`                         | unset        | Called when `loadResults` rejects.                                        |
| `recentItems`                            | `CommandItem<T>[]`                                 | `[]`         | Most recent first; shown when the query is empty.                         |
| `recentLabel`                            | `string`                                           | `'Recent'`   | Header of the recent section.                                             |
| `ungroupedLabel`                         | `string`                                           | `'Other'`    | Header of the trailing section for items with no group or an unknown one. |
| `onSelect`                               | `(item: CommandItem<T>) => void`                   | required     | Enter on the active row, or a press on a row.                             |
| `closeOnSelect`                          | `boolean`                                          | `true`       | Calls `onOpenChange(false)` after `onSelect`.                             |
| `maxResults`                             | `number`                                           | 50           | Cut applied to the whole list.                                            |
| `renderItem`                             | `(item, state: CommandItemState) => ReactNode`     | built-in row | Replaces the row content, not the row wrapper that owns role and press.   |
| `placeholder`                            | `string`                                           | unset        |                                                                           |
| `footer`                                 | `ReactNode`                                        | unset        | Key hints, or a parsed-query line.                                        |
| `emptyState`                             | `ReactNode`                                        | `EmptyState` | A query with no results, once the async source has settled.               |
| `errorState`                             | `ReactNode`                                        | `Alert`      | The async source failed; static matches stay above it.                    |
| `isLoading`                              | `boolean`                                          | `false`      | The static list is not ready; three `Skeleton` rows replace the list.     |
| `accessibilityLabel`                     | `string`                                           | required     | Names the dialog and the input.                                           |
| `className`                              | `string`                                           | unset        |                                                                           |

`CommandItem<T>` is `{ id, label, description?, groupId?, keywords?, leading?, trailing?, isDisabled?, data? }`.
`keywords` are matched and never shown. `CommandItemState` is `{ isActive, isDisabled, matches }`, where
`matches` are the matched ranges of the label, end exclusive.

## Controlled versus uncontrolled

The open state is the triplet `isOpen` / `defaultIsOpen` / `onOpenChange`, as `Menu` and `Popover`
have it through `useControllableState`. The palette registers no trigger and no global shortcut, so
an uncontrolled palette is opened by `defaultIsOpen` and closes itself; most consumers control it.
The query is a full triplet too. The active row is internal: it resets to the first enabled row when
the result list changes. An uncontrolled query clears each time the palette opens.

## Composition

Fixed anatomy: `Modal` and `ModalContent`, `Input` with a `Spinner` in `rightElement`, a `ScrollView`
list of groups, `Eyebrow` group headers, `ListItem` rows. Slots: `renderItem`, `footer`, and
`emptyState` and `errorState` with `ui/` defaults. `leading` and `trailing` on an item cover the
common cases without `renderItem`.

## Sources and merge

One pure function, `buildSections`, fixes the display order, and the arrow keys walk exactly that
order.

1. Empty query: the recent section, then static items in their given order, group by group.
2. Non-empty query: static matches ranked by score inside each group, then async items in the order
   returned, appended to their groups. Async items are never re-ranked or re-filtered.
3. Sections follow `groups` order; a repeated group id keeps its first label. An item with no group or
   an unknown group goes to a trailing "Other" section. A section with no items is not drawn.
4. Ids are deduplicated across all three sources; the first occurrence in display order wins.
5. The list is cut at `maxResults`.

## Async lifecycle

`loadResults` runs after `debounceMs` once the query is at least `minQueryLength` long. A new query
aborts the previous request through its `signal`. `asyncResultsReducer` applies a response only when
it answers the pending request; a late response, or one after a reset, is discarded. A rejection
records the error and leaves the static matches on screen; the next keystroke retries.

## Fuzzy matching

`fuzzyMatch(query, text)` is a hand-written subsequence matcher with no dependency, and it never
builds a `RegExp` from the query. It is case-insensitive by UTF-16 code unit. It scores a prefix above
a word start above a mid-word hit, rewards consecutive characters, and returns the matched ranges.
`description` and `keywords` can match, at half the score of the same match on the label and with no
label ranges. An empty query matches everything with score 0.

## Accessibility

Two APG patterns together: Dialog (Modal) containing an editable Combobox with a listbox popup, list
autocomplete with manual selection.

- The dialog comes from `Modal` and is named by `accessibilityLabel`.
- The input has `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"` and
  `aria-activedescendant`. DOM focus never leaves the input.
- The list is `role="listbox"`; each section is `role="group"` labelled by its header; each row is
  `role="option"` with `aria-selected` on the active row and `aria-disabled` where set.
- Option DOM ids come from `useId` plus the display index, never from the item id.
- A polite live region reports the result count, "Searching" and "Search failed".

| Key                    | Action                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------- |
| Down, Up               | Next or previous enabled option in display order; wraps at both ends               |
| Enter                  | `onSelect(activeItem)`, then `onOpenChange(false)` unless `closeOnSelect` is false |
| Escape                 | `onOpenChange(false)`                                                              |
| Home, End, Left, Right | Move the caret in the input                                                        |
| Tab                    | Stays in the dialog; the input is the only tab stop                                |

Disabled rows are skipped by the arrow keys and ignore Enter and press. When every row is disabled,
the active row does not move.

## States

Loading: a pending `loadResults` keeps the static matches, shows the spinner and a "Searching" status;
`isLoading` shows skeleton rows. Both set `aria-busy` on the listbox. Empty: `emptyState`. Error:
`errorState` under the static matches, and `onLoadError`. Disabled does not apply to the palette as a
whole; it applies per item.

## Virtualisation

None. `maxResults` bounds the mounted options (50 by default) however many items exist.

## Internal modules

`palette-model.ts`, pure: `buildSections`, `nextOptionIndex`, `asyncResultsReducer`, and a re-export of
`fuzzyMatch` and `rankItems`, which live in `match-model.ts` to keep each file under the line limit. `useCommandPalette` (planned) wires the query triplet, the debounce, the abort
and the active index.

## Fixtures

`fixtures.ts` holds synthetic fixtures with invented names: Default, Static only, One item, Empty, No
match, Very large (10,000 items), Long label, Missing, Slow, Failing, Hostile and All disabled. Async
fixtures are factories over `createDelayedSource`, which settles after a delay or on `release()`, so
tests use fake timers.

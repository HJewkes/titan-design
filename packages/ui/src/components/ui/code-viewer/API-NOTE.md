# CodeViewer: Round 0 contract (TD-74, slice S1 of TD-31)

Status: **draft for owner confirmation**. Contract only: no component, story or barrel export exists yet.
S2 to S4 build it; S5 adds syntax colouring. Home: `ui/code-viewer/`, story `Components/Molecules/CodeViewer`,
status `candidate` until the `ui/README.md` row and the axe tests exist.

Binding owner decisions: a highlighter is bundled in titan, with token colours through TD-30 (31.1); fixed-height
windowing now, with a 5,000-line test (31.2); a controlled selected line range on an APG Listbox gutter, which adds a
disabled state and keyboard tests (31.3). Delegate decisions folded in below: neutral highlight emphasis only, inverted
spans dropped with a development warning, plain mono in S2 to S4 with `language` reserved, no long-line cap in v1,
fixtures from titan-design at a pinned sha.

## 1. Data meaning

The viewer shows one contiguous window of one source file as it was at one snapshot. Its input is a `SourceExcerpt`
as produced by the code-read service (consumer side; titan never imports its types):
`{ path, startLine, endLine, text, contentHash, origin: 'commit' | 'worktree' | 'export', highlights: Span[], truncated }`
with `Span = { startLine, endLine }`. The excerpt is the flagged spans plus a few context lines either side, clipped to
the file and capped at 80 lines from the window start. A finding with no spans (a metric finding) starts at line 1. A
missing excerpt (`changed-since-snapshot`, `not-in-export`, `no-source`) means no source is available; the consumer maps
that to words and passes it as `emptyState`.

A highlight means "the rule flagged these lines". It is evidence, not severity, so it gets **one neutral emphasis
treatment and no status colour; a range has no `color` prop**. A selection (31.3) is the reader's own pick of lines, for
example to copy or link them, and is independent of highlights. The viewer never fetches data, reads a path, or knows what
a finding is.

Units and invariants, all enforced in the pure line model (S2) and tested there:

- **Lines are 1-based file line numbers.** The gutter shows `startLine + i`, never a window index. `startLine` is an
  integer of 1 or more; any other value is clamped to 1 with a development warning.
- **Ranges are inclusive** on both ends: `{ startLine: 10, endLine: 10 }` is one line.
- **`text` is authoritative.** The producer joins lines with `\n` and emits no trailing newline. The model splits on LF,
  CRLF and lone CR. One trailing newline adds no empty line, which matches editor numbering. Consequence: an excerpt whose
  last line is blank arrives with a trailing `\n`, and the viewer shows one row fewer than `endLine` implies. Treat that as
  the text winning; the warning below names both numbers.
- **`endLine` is informational.** If it disagrees with `startLine + lineCount - 1`, the text wins and a development
  warning names both numbers.
- **Ranges are normalized** in this order: drop non-integer or non-finite ends, **drop inverted spans** (`endLine <
startLine`) with a development warning (swapping would hide an upstream bug), clip to the window, drop spans wholly
  outside, merge overlapping and nested spans, then sort. The producer already clips, but the viewer does not trust that.
- **Tabs** stay in the copied text. For display each tab expands to the next multiple of `tabSize` (default 4), because RN
  `Text` has no `tab-size` on native. Copy fidelity therefore holds on web only (section 7).
- **Long lines are never truncated or wrapped by default, and there is no length cap in v1.** The content width is the
  longest line's character count times the mono advance, so the scrollbar does not jump as windowed rows mount. Wide
  characters (CJK, emoji) count as one unit. The functional gate measures the 10,000-character fixture; a cap is added
  only if that measurement fails.
- **No CR, BOM or control characters are painted.** A leading U+FEFF is dropped from display; the rest render as-is.

## 2. Considered existing

Sources: `src/arch/arch-graph.json`, `MATURITY.md`, `ui/README.md`, component JSDoc and `REJECTED.md`. No `REJECTED.md`
entry names a code block, viewer or highlighter.

| Nearest                                                                                          | Verdict                                       | Reason                                                                                                                                                                                                                      |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MarkdownProse` (`custom/Prose/MarkdownProse.tsx`, `renderInline`)                               | **Reject**                                    | It turns inline backtick spans into one `font-mono` `Text`. It has no block, line model, gutter or ranges, and it sits in `custom/`, a higher tier. If fenced blocks are ever added, it becomes a consumer of `CodeViewer`. |
| `Typography` `mono` variant (`ui/typography/Typography.tsx`, `font-mono text-xs leading-normal`) | **Compose**                                   | Every code run and every line number renders through it. The viewer copies none of its classes onto raw `Text`. The fixed row height derives from this variant's line box.                                                  |
| `Table` (`custom/Table`, generic, still in `custom/` per the baseline)                           | **Reject** as a base, **reuse** its precedent | Row and cell semantics are wrong for code, and it sits in a higher tier. Its loading-skeleton swap is the precedent `docs/component-states.md` names. Table virtualization will share `computeWindow`, not Table code.      |

Also composed: `Card` (the frame, per TD-1's sole-container direction; Card composes Surface), `Skeleton` (loading),
`EmptyState` (empty default), `computeWindow` (`src/utils/fixed-window.ts`, windowing, not RN `FlatList`), `ScrollView`,
`View`. Also checked: `FilePathLabel` (`custom/ActiveWork`) suits a header, but it is in a higher tier and names an app's
files, so `header` is a slot. `SessionListItem` and `FileActivityRow` are the in-repo `role="option"` and `aria-selected`
precedent for the gutter. No highlighter dependency exists in `packages/ui/package.json`, and there is no
visually-hidden primitive in `packages/ui/src`.

## 3. Props sketch (names and types only)

```ts
type LineRange = { startLine: number; endLine: number; label?: string }

interface CodeViewerProps extends Omit<ViewProps, 'children'> {
  text: string
  startLine?: number // default 1
  highlights?: LineRange[] // evidence; neutral emphasis, no per-range colour
  focusLine?: number // one-way command: scroll this file line into view on mount and change
  selectedRange?: LineRange | null // 31.3, controlled
  defaultSelectedRange?: LineRange | null
  onSelectedRangeChange?: (range: LineRange | null) => void
  language?: string // 31.1; reserved, no effect until S5 lands a tokenizer
  wrap?: boolean // default false; disables windowing
  showLineNumbers?: boolean // default true
  tabSize?: number // default 4
  size?: 'sm' | 'md' // row density; default 'sm' (Typography mono)
  maxHeight?: number // viewport cap; windowing needs a bounded viewport
  isTruncated?: boolean // excerpt.truncated; drives the default footer notice
  isLoading?: boolean
  loadingLineCount?: number // default 8
  isDisabled?: boolean // 31.3; stops selection, keeps scroll and copy
  header?: ReactNode // consumer vocabulary: path, origin badge, copy action
  footer?: ReactNode // default: truncation notice when isTruncated
  emptyState?: ReactNode // default: ui/ EmptyState "No source to show"
  accessibilityLabel: string // required; e.g. "Tooltip.tsx, lines 78 to 157"
  className?: string
}
```

The adapter from `SourceExcerpt` is three lines in the consumer: `text`, `startLine`, `highlights`, and
`isTruncated={excerpt.truncated}`. There is no `variant`, `color` or `onPress`: the single treatment and the selection
pair replace them. There is no per-line render prop in v1, because it would break the fixed row height that windowing
depends on. S5's tokenizer is internal.

## 4. Fixtures (`fixtures.ts`)

Real fixtures are hand-assembled `SourceExcerpt` values from **titan-design's own public source at commit
`83122ef6878350d6803123c21410edae5674cb2e`** (verify with `git show 83122ef6:packages/ui/src/<path>`), using the
producer's window arithmetic (5 context lines, 80-line cap), `origin: 'commit'`, and `contentHash` set to the blob's git
object id. The findings are illustrative except `tooltipLongFunction`. Nothing comes from private repos or owner data.

| Fixture                | Source                                                          | Shape                                                        | Proves                                                                                                                           |
| ---------------------- | --------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `tooltipLongFunction`  | `ui/tooltip/Tooltip.tsx`, `Tooltip` lines 83 to 253             | window 78 to 157, `highlights [{83,157}]`, `truncated: true` | Cap clipping, highlight cut at the window edge, truncation footer                                                                |
| `proseTwoRanges`       | `custom/Prose/MarkdownProse.tsx`, `renderInline` and `Block`    | window 123 to 196, two highlights                            | Two ranges, gap between them, three-digit gutter                                                                                 |
| `fixedWindowOneLine`   | `utils/fixed-window.ts`, line 27                                | window 22 to 32, `highlights [{27,27}]`                      | Single-line range, `startLine` above 1                                                                                           |
| `fixedWindowWholeFile` | `utils/fixed-window.ts`, all 74 lines                           | window 1 to 74, no highlights                                | Metric finding, `startLine` 1                                                                                                    |
| `gutterGrowth`         | `ui/tooltip/Tooltip.tsx`                                        | window 95 to 106                                             | Gutter width from two to three digits (the window ends on code: a blank last line would carry a trailing newline, see section 1) |
| `longLineReal`         | `custom/ActiveWork/initiative-fixture.ts:17` (1,480 characters) | window 12 to 22, `highlights [{17,17}]`                      | Horizontal scroll and `wrap` on a real long line                                                                                 |
| `unicodeReal`          | `custom/ActiveWork/format-time.ts` (em dashes at 4, 10, 12)     | window 1 to 32                                               | Non-ASCII BMP text                                                                                                               |
| `scale5k`, `scale10k`  | the Tooltip window repeated, **synthetic**                      | 5,000 and 10,000 lines, three highlights each                | 31.2 scale target, `focusLine` 4,990, five-digit gutter                                                                          |

Synthetic degenerate fixtures:

| Fixture                             | Shape                                                     | Contract outcome                                                |
| ----------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------- |
| `empty`                             | `text: ''`                                                | `emptyState`, or the default EmptyState                         |
| `missingSource`                     | three `{ excerpt: null, excerptMissing }` values          | Consumer-level, for the composition story; renders `emptyState` |
| `oneLine`                           | `'export {}'`                                             | One row, one-digit gutter                                       |
| `trailingNewline`                   | `'a\nb\n'`                                                | Two lines, not three                                            |
| `crlf`, `loneCr`                    | `'a\r\nb\r\n'`, `'a\rb'`                                  | Two lines each, no CR painted                                   |
| `tabs`                              | leading and mid-line `\t`                                 | Expanded to `tabSize` on display                                |
| `wideChars`                         | CJK, emoji, a ZWJ family, a combining accent, an RTL word | No crash; width drift recorded by the functional gate           |
| `line2000`, `line10000`             | one generated line each                                   | Renders in full, stays scrollable                               |
| `rangePastEof`                      | window 1 to 20, `highlights [{18,40}]`                    | Clipped to 18 to 20                                             |
| `rangeOutside`                      | `highlights [{50,60}]` on 20 lines                        | Dropped                                                         |
| `invertedRange`                     | `highlights [{12,8}]`                                     | Dropped with a development warning                              |
| `overlappingRanges`, `nestedRanges` | `[{3,8},{6,12}]`, `[{2,20},{5,6}]`                        | Merged into one run each; both labels kept for the summary      |
| `allLinesHighlighted`               | one span over every line                                  | Every row flagged; the summary reads one range                  |
| `endLineMismatch`                   | `endLine` 30, text has 25 lines                           | 25 rows and a development warning                               |
| `bigStartLine`                      | `startLine 99,996`, 10 lines                              | Gutter from five to six digits                                  |
| `badNumbers`                        | `startLine 0`, `highlights [{1.5,NaN}]`                   | `startLine` clamped to 1, range dropped                         |

"Missing baseline" does not apply: the viewer has no reference value.

## 5. The four states (`docs/component-states.md`)

| State    | Verdict and render                                                                                                                                                                                                                                                      |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading  | **Applies.** `isLoading` replaces the rows with `loadingLineCount` `Skeleton` rows of varied width inside the same frame. The gutter is hidden, `header` stays, and the region reports `aria-busy="true"` (a direct prop; `accessibilityState` does not reach the DOM). |
| Empty    | **Applies.** An empty `text` (after the BOM strip) renders `emptyState`, or a default `ui/` `EmptyState` titled "No source to show". The frame and `header` stay, so the consumer's path still shows.                                                                   |
| Error    | **Does not apply.** A non-form component has no shared error prop. The consumer renders a failed fetch with `Alert`, and a missing excerpt is an empty state, not an error. The autodocs carry one line that says so.                                                   |
| Disabled | **Applies (31.3).** `isDisabled` removes the gutter listbox from the tab order, ignores selection keys and presses, sets `aria-disabled="true"` on the listbox, and keeps an existing selection visible. Scroll, focus on the region, and copy keep working.            |

## 6. Accessibility contract

No APG pattern covers read-only code, so the viewer uses two named structures. React Native Web (0.19) emission rules:
direct `role` and `aria-*` props reach the DOM, and `accessibilityState` is dropped.

| Part                  | Role and props                                                                                                                                         | RNW emits                                            | Native                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Frame                 | `View role="region" aria-label={accessibilityLabel}`                                                                                                   | `<div role="region" aria-label>`                     | Container with `accessibilityLabel`                                                           |
| Code scroller         | `ScrollView` with `tabIndex={0}` (axe `scrollable-region-focusable`)                                                                                   | `<div tabindex="0">` that arrow-key scrolls natively | Native scroll; screen readers read the text                                                   |
| Line numbers          | `aria-hidden`, `select-none`                                                                                                                           | `aria-hidden="true"`, `user-select: none`            | `importantForAccessibility="no-hide-descendants"`                                             |
| Highlight summary     | Text placed before the code: "Flagged: lines 83 to 157" plus labels, one per merged range. **PROPOSED visible; not decided (see Open for the owner).** | `<div dir="auto">` text                              | `Text`                                                                                        |
| Flagged row mark      | Non-colour gutter mark (WCAG 1.4.1), `aria-hidden`                                                                                                     | Decorative                                           | Decorative                                                                                    |
| Gutter listbox (31.3) | `role="listbox" aria-multiselectable="true" aria-label="Select lines"`, with `aria-activedescendant` pointing at the active option                     | Each attribute reaches the DOM as written            | No listbox role; the gutter becomes per-line `accessibilityRole="button"` toggles (section 7) |
| Gutter option         | `role="option"`, `aria-selected`, `aria-setsize={lineCount}`, `aria-posinset={i+1}`, name "Line 120" plus ", flagged" when highlighted                 | Each attribute reaches the DOM as written            | Button with the same label and `accessibilityState.selected`                                  |

Keyboard: Tab goes to the code scroller, then to the gutter listbox (unless `isDisabled`). In the listbox, Up and Down
move the active line, and Shift+Up and Shift+Down extend the selection from its anchor. Home and End jump to the first and
last line. Space toggles the active line as a one-line selection, and Escape clears the selection (null). Moving the active
line scrolls it into view through the same code path as `focusLine`. **Windowing rule:** the active option always stays
mounted, even outside the computed window, because `aria-activedescendant` must point at a node that exists.
`aria-setsize` and `aria-posinset` give the true counts across unmounted rows. Selecting never scrolls on its own, and
`focusLine` never selects. Syntax colours (S5) are decorative, so the summary and the gutter mark are the only non-colour
signals.

## 7. API design note extras (generic component)

**Placement and tier.** `ui/code-viewer/`, story `Components/Molecules/CodeViewer`. No barrel export until S6.

**Out of scope for S1 to S4:** syntax colouring. S5 is a required slice (31.1): it picks a synchronous tokenizer,
proposes the syntax tokens through TD-30 and the owner, and ships the tokenizer on **its own tsup subpath entry**, so the
root barrel and Voltras native bundles carry no grammars. S2 to S4 render plain mono text with `language` reserved.
Also out of scope: line wrapping with windowing (`wrap` turns windowing off, and the docs say thousands of wrapped lines
are unsupported), diff views, editing, search, folding, stepping between highlights, per-range colours, and fetching.

**Extension points:** `header`, `footer` and `emptyState` slots; `language`, reserved for S5's internal tokenizer; and
`LineRange.label` for the summary and, after S4, a Tooltip. A future diff or blame view composes `CodeViewer`; it does not
get props bolted on.

**Logic location:** `lines.ts` holds pure functions (`splitLines`, `expandTabs`, `normalizeRanges`, `lineFlags`,
`gutterDigits`, `contentWidth`). Headless hooks are `useLineWindow` (a thin wrapper over `computeWindow`, plus the pinned
active row), `useFocusLine`, and `useLineSelection` (the controlled pair, anchor and keys). Each has jsdom and fast-check
tests: merged ranges never overlap, normalizing twice changes nothing, and every rendered row is in the window or is the
active row. The shell only paints.

**Virtualization:** `computeWindow` over a fixed row height (the `size` line box). It turns on above 500 lines and is off
when `wrap` is set. There is no new dependency.

**Platform story.** Web is the primary consumer. On native, scroll and windowing work the same way. The gutter listbox
degrades to per-line buttons, because RN has no listbox role, and Shift+arrow ranges need a hardware keyboard, so
long-press then press extends the range instead. Copy keeps tabs on web only, because display expansion on native replaces
them. Scale and keyboard proof run on web (Storybook play functions, as in `Carousel.interaction.stories.tsx`). Native proof
is a smoke render only.

## Open for the owner

1. **Highlight summary (Q2, taste).** PROPOSED, not decided: a visible one-line summary above the code ("Flagged: lines
   83 to 157"), replaceable through `header`. It needs no new primitive and helps sighted readers too. The alternative is a
   new `VisuallyHidden` primitive, which needs the owner's approval. Frames for the decision: CodeViewer with flagged ranges,
   summary visible against summary absent, 360 and 1280 wide, dark and light. It rides the component's own Gate 2 round, so
   S2 is not blocked.

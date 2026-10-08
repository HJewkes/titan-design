# Microcopy

Rules for the words on a titan surface. Read with [the design floor](design-floor.md); the floor wins where they disagree. Run every check on your own render before calling the work done.

## Rules

### M-01 Cut every word the context already carries: the page header, the card title, the axis or the value's own unit. Add a label only when the number is ambiguous without it.

Check: for each rendered label, delete it; if the reader still knows what the number is, it stays deleted.

Sources: [Material writing](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices), [Atlassian writing](https://atlassian.design/foundations/content/).

### M-02 One line of copy per fact. An explanation goes into one tip, and a tip never opens another tip.

Check: list every rendered string; no fact has two lines, and no tip contains a trigger for a second tip.

Sources: [NN/g progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/), [Material writing](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices).

### M-03 Write only copy the brief or the domain supplies. No advice, coaching or calls to action nobody asked for.

Check: every rendered sentence traces to the brief or the fixture; list the strings in the PR description.

Sources: [GOV.UK content design](https://www.gov.uk/guidance/content-design/writing-for-gov-uk), [Polaris voice and tone](https://polaris.shopify.com/content/voice-and-tone).

### M-04 No identifiers, enum values, code units or variable names in user-facing text. Map every enum to words in the formatter layer.

Check: render each story and scan the text and accessible names for camelCase, snake_case and SCREAMING_CASE tokens.

Sources: [Atlassian writing](https://atlassian.design/foundations/content/), [Material writing](https://m3.material.io/foundations/content-design/style-guide/ux-writing-best-practices).

### M-05 An inline label and value read `Label: value`. A label stacked above its value takes no colon.

Check: search rendered text for a capitalised word followed by a value on one line; each has its colon, and no stacked label has one.

Sources: [Carbon content](https://carbondesignsystem.com/guidelines/content/overview/), [GOV.UK style guide](https://www.gov.uk/guidance/style-guide/a-to-z).

### M-06 Short related sentences in one tip share a line, separated by a period. A single fragment takes no period.

Check: every tip is one line; a period appears only between sentences, never after a lone fragment.

Sources: [Polaris content fundamentals](https://polaris.shopify.com/content/fundamentals), [Atlassian punctuation](https://atlassian.design/foundations/content/).

### M-07 Source strings are sentence case. Capitals come only from a typography variant (`overline`, `monoLabel`, `microLabel`).

Check: search JSX literals for all-caps words over three letters outside the glossary; none remain.

Sources: [Atlassian capitalization](https://atlassian.design/foundations/content/), [Polaris](https://polaris.shopify.com/content/fundamentals), [Carbon](https://carbondesignsystem.com/guidelines/content/overview/), [GOV.UK](https://www.gov.uk/guidance/style-guide/a-to-z).

### M-10 Deltas are signed and name their baseline.

Check: a formatter test covers a positive, zero and negative delta; each rendered delta shows its sign and says what it is measured against.

Sources: [Material data visualization](https://m3.material.io/foundations/designing/structure), [Carbon data visualization](https://carbondesignsystem.com/data-visualization/getting-started/).

### M-11 A missing value is one short token ("N/A"), never a fake `0` and never a sentence in a value slot.

Check: a story fixture with the value absent renders the token; no zero and no sentence appears in the slot.

Sources: [Atlassian writing](https://atlassian.design/foundations/content/), [GOV.UK style guide](https://www.gov.uk/guidance/style-guide/a-to-z).

### M-12 An empty state says what is absent and gives one next step. It replaces only the element the reader expected, and its default copy comes from the `ui/` component.

Check: the empty-state story (see `docs/component-states.md`) shows the absence, one action and the default copy; nothing else on the page is replaced.

Sources: [Carbon empty states](https://carbondesignsystem.com/patterns/empty-states-pattern/), [Atlassian empty states](https://atlassian.design/components/empty-state/), [Polaris empty state](https://polaris.shopify.com/components/layout-and-structure/empty-state).

### M-16 Compressed text keeps its words for assistive tech: a glyph-collapsed status, a dot or an abbreviation carries an `accessibilityLabel` in full words.

Check: take the accessibility snapshot of the collapsed state; its name equals the expanded text.

Sources: [WCAG 1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html), [WCAG 1.4.1 Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html), [WCAG 2.5.3 Label in Name](https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html).

### M-18 Numeric ranges use an en dash in tight UI (`8–10`). Positions use "of" (`2 of 9`). A slash appears only in a compact tally.

Check: formatter tests cover a range and a position; search rendered text for a hyphen between digits or a slash outside a tally.

Sources: [Atlassian punctuation](https://atlassian.design/foundations/content/), [Microsoft style guide: dashes](https://learn.microsoft.com/en-us/style-guide/punctuation/dashes-hyphens/).

## Pending

M-08 (numeral and operator spacing) and M-09 (unit tokens) wait on a decision and carry no value yet. Do not infer one from existing code.

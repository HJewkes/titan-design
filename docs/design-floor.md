# Design floor

Read before writing titan UI. Run every check on your own render before calling the work done.

## Precedence

Highest first: (1) the brief; (2) titan system facts: `CLAUDE.md`, `packages/ui/TOKENS.md`, and the tokens and ui/ primitives at your commit; (3) this floor; (4) general craft advice. A lower level adds what a higher one does not cover and never overrides it. If a rule seems to need a new token, hue or primitive, use the nearest existing one and record the gap in the PR description or Round 0 contract.

## Compose first

Search `packages/ui/src/components/ui/` and the nearest `custom/<Family>/` before writing JSX for a shape. Wrap a close primitive or pass props; never draw a second card shell, pill, dot, divider or tooltip.

- In ui/: surface, card, stat-card, typography, eyebrow, stack, section, divider, data-row, list-item, pill, badge, indicator, tooltip, skeleton, spinner, empty-state, alert, progress. Icons come from `packages/ui/src/components/icons`; no raw `Text` with font classes, unicode glyphs or inline svg icons.
- Charts: read `packages/ui/src/components/custom/charts/README.md` first; `d3-*` imports are legal only under ui/charts/.
- Code: `resolveColor` in `packages/ui/src/theme/resolve-color.ts`, `usePrefersReducedMotion` in `packages/ui/src/hooks/usePrefersReducedMotion.ts`.
- Admission rule: a new overlay, picker or tablist in custom/ or shell/ composes the ui/ primitive or raises the gap against it.

## Rules

### F1 Titles, labels, values, errors and status wrap, never truncate: no `numberOfLines`, no ellipsis. Truncate only user-generated names, paths and breadcrumbs, with the full text on press. When the row runs short, status and actions move under the title.

Check: at the narrowest width, with the longest fixture name, the whole text is readable.

### F2 Status is never dropped, never carried by colour alone, and keeps a spoken name. When the row runs short, the status word collapses to its glyph; the glyph opens a tip with the full word and carries it as its accessible name (M-16).

Check: at 320, 360 and 560, in both forms, the status is visible; the collapsed glyph's tip and accessible name both equal the expanded word.

### F3 Each fact appears once per surface; if the title or chart says it, nothing repeats it.

Check: list every rendered string and number; none appears twice.

### F4 Labels are one to three words, and no sentence explaining the UI sits on the surface. A reason or explanation lives in a glyph's tip and in its spoken label, never as visible text; at narrow width a label that will not fit collapses to the same glyph-plus-tip form.

Check: every rendered text traces to the brief or the fixture; at 320 no visible sentence remains, and each glyph has a tip and an accessible name in full words.

### F5 Label data directly: lines, bars and reference lines carry their own label in the mark's colour; with four or fewer series, no legend.

Check: no legend element exists, and no label touches another text or mark.

### F6 Tight groups, clear edges: the gap inside a group (`stack-sm`, `stack-md`) is smaller than between groups (`stack-lg`+); text clears its container by the inset (`inset-md`+ on a card).

Check: measure the render; inner gap < outer gap, edges clear the inset, every gap on the 4px scale.

### F7 One concept, one look: the same glyph, colour token and casing everywhere, matching existing titan components; section titles in a component share one Typography variant.

Check: search titan for the concept before drawing it, then compare your render.

### F8 Reuse or extend: one component with a size or density prop beats two similar ones.

Check: the PR description or Round 0 contract names the nearest components and why each was reused or not.

### F9 Vivid colour, one meaning each: `status-*` for a condition, `result-*` for better or worse, `categoricalPalette` for peer categories; full chroma, never opacity-dimmed.

Check: list each colour and its meaning; none has two and none is a raw value.

### F10 Domain numbers are props: thresholds, targets, zones and cut-offs arrive as props or fixture data with a typed default.

Check: every numeric literal is geometry or a default prop value.

### F11 Follow the established convention for patterns people know (chat thread, bottom navigation, swipe, stepper).

Check: the PR description or Round 0 contract names the convention followed.

### F12 Compact numerals: no space between number and unit or operator (`3×6`, `90s`, `12%`); changing or compared numbers use tabular figures.

Check: search rendered text for a digit, a space, then `%`, `×` or `s`; no hits.

### F13 Depth comes from Surface and Card elevation, never a hand-written shadow or decorative border; a list row has no own background or lift.

Check: no shadow literal; each plane's level matches the elevation table in `CLAUDE.md`.

### F14 Every state is shown: loading, empty, error, disabled (or say why not), plus one item, longest label, zero, negative, missing value, many items; loading keeps the loaded size.

Check: each state has its own story with realistic data, and no story shows a blank frame.

### F15 Both themes, every width: semantic token classes only; nothing overflows, clips or overlaps from 320 to 1280.

Check: render dark and light at 360, 768 and 1280 (320 for a phone surface) and look at every frame.

### F16 Motion is rare and safe: animate only transform and opacity, ease out, never start at scale 0, render the final state first under reduced motion, never carry a fact by motion alone.

Check: with reduced motion on, the first frame is the final frame.

## Conflict register

This floor wins where craft advice disagrees: generous white space loses to F6; a space before units loses to F12; "always show a legend" and "tooltips last" lose to F5 and F4; "truncate with an ellipsis" loses to F1.

Copy rules for the words on a surface: [Microcopy](microcopy.md).

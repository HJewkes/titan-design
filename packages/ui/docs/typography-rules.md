# Typography rules (draft, TD-781)

The rule for every text role the library uses. The test for a role: **a title names a thing, a label
categorises a value, a value is the number, a caption explains.** Case follows the role, colour follows
importance, weight marks the one thing to read first.

The owner's direction (Gate 2 batch 11): headers and labels are either the heading face (Space
Grotesk) or all caps; the body face (Nunito Sans) is never used as a header or label. All-caps items
use `overline` (bold where the item is a status token), never `monoLabel`. Pill keeps `font-heading`.

The live version of this table, with each role rendered and its colour named by ramp step with the
measured ratio in both themes, is Storybook `Lab/Typography/Rules` (`src/lab/typography/`). The data
behind both is `src/lab/typography/typography-roles.ts`. Ratios there are on the review plane
(background-base in dark, surface-base in light); on surface-base in dark, 12px text-tertiary is
4.32:1, which is what D2 and D3 are about. Two colour facts the page surfaced: `result-improve` text
on white is 2.78:1, so a light-mode delta cannot rely on the token alone, and the ZoneTrack brand
tick misses on white (already in the contrast baseline).

## Cross-cutting rules

- **Case.** Uppercase is a label treatment, never a title, sentence, value or control treatment. It is
  allowed only on `overline`, `microLabel` and uppercase mono ticks; a string longer than three words
  or at 14px or above is sentence case.
- **Face.** Headings and card titles are the heading face. All-caps labels are `overline` (body face,
  tracked) or `microLabel` (10px sans). Values, ticks, ids and code are mono. Body, descriptions and
  captions are the body face. Which sentence-case labels and controls take the heading face is open
  (D5, D7).
- **Colour.** `text-primary` for titles, values, control and nav labels. `text-secondary` for labels
  and informative small text. Whether `text-tertiary` is the redundant/decorative role only (repeated
  units, separators, chart tick numerals under the 3:1 chart-ink floor) is open (D2, D3).
- **Weight.** Bold is for the value, for a status token, and for exactly one element per lockup.
  Semibold for headings and uppercase labels. Medium for control and form labels. Regular for body,
  captions and axis numerals. A caption or body sentence is never bold.

## Rule table

| Role                                        | Variant                | Family  | Weight   | Case     | Colour                              | Status                         |
| ------------------------------------------- | ---------------------- | ------- | -------- | -------- | ----------------------------------- | ------------------------------ |
| Display heading                             | `h1`-`h4`              | heading | bold     | sentence | `text-primary`                      | established                    |
| Page heading                                | `h5`                   | heading | semibold | sentence | `text-primary`                      | established                    |
| Section title (SectionHeader)               | raw 14px caps today    | body    | semibold | upper    | `text-secondary`                    | **OPEN D6**                    |
| Card title                                  | `h6`                   | heading | semibold | sentence | `text-primary`                      | established                    |
| Row title / subtitle                        | `subtitle2`            | body    | medium   | sentence | `text-primary`                      | established                    |
| Eyebrow / stat header / menu group header   | `overline`             | body    | semibold | upper    | `text-tertiary` today               | **OPEN D2** (default secondary) |
| Column header                               | `overline`/`microLabel`| body    | semibold | upper    | `text-secondary`; sorted primary    | established                    |
| Label-value lockup name                     | `overline`             | body    | semibold | upper    | `text-secondary`                    | established (#764 pick C)      |
| Label-value lockup value                    | `mono`                 | mono    | bold     | digits   | `text-primary`; secondary on a track | established (#764 pick C)     |
| Unit / suffix beside a value                | `mono`, one step down  | mono    | regular  | as written | `text-tertiary`                   | OPEN D3 (redundant text)       |
| Delta / trend                               | `mono`                 | mono    | medium   | digits   | `result-*`, never colour alone      | established                    |
| Status token (LIVE, REST, PR)               | `overline` + bold      | body    | bold     | upper    | tone                                | established (not `monoLabel`)  |
| Nav label under a glyph                     | `microLabel`           | sans    | bold     | upper    | `text-primary`                      | established                    |
| Body text                                   | `body1`                | body    | regular  | sentence | `text-primary`                      | established                    |
| Description / card body / help text         | `body2`                | body    | regular  | sentence | `text-secondary`                    | established                    |
| Caption / metadata / timestamp              | `caption`              | body    | regular  | sentence | `text-tertiary` today               | **OPEN D3** (default secondary) |
| Button label                                | `button`               | sans    | semibold | sentence | on tone                             | **OPEN D5** (face)             |
| Pill / Badge / Chip / Tab label             | component              | sans (Pill heading) | medium | sentence | on tone                      | **OPEN D5** (face)             |
| Form label                                  | `subtitle2`            | body    | medium   | sentence | `text-primary`                      | **OPEN D7** (face)             |
| Inline label (DataRow, Metric, Gauge)       | `body2` / `caption`    | body    | regular  | sentence | `text-secondary`                    | **OPEN D7** (face)             |
| Table cell                                  | `body2`                | body    | regular  | sentence | `text-primary`                      | established                    |
| Axis tick numeral                           | `mono`                 | mono    | regular  | digits   | `text-tertiary` (3:1 floor)         | **OPEN D4**                    |
| Axis category / track label                 | `microLabel`           | sans    | semibold | upper    | `text-secondary`; emphasised bold   | **OPEN D4**                    |
| Axis title                                  | `caption` + heading face | heading | semibold | sentence | `text-secondary`                  | **OPEN D4**                    |
| Legend / data label                         | `caption` + heading face | heading | medium | sentence | `text-secondary`                    | **OPEN D4**                    |
| Code / readout / id                         | `mono`                 | mono    | regular  | as written | `text-primary`                    | established                    |

## Open decisions and recommended defaults

Each has its own story under `Lab/Typography/Rules`, changing one thing between its options.

| #  | Question                                                                 | Recommended default                                                   | Story              |
| -- | ------------------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------ |
| D2 | Which colour token do uppercase labels read?                             | `text-secondary` everywhere; Eyebrow moves off tertiary               | `D2LabelColour`    |
| D3 | What may `text-tertiary` paint?                                          | Captions default to secondary; tertiary only for redundant text and chart ticks | `D3TertiaryRole` |
| D4 | One chart text spec?                                                     | Yes: ticks mono regular tertiary, categories `microLabel`, title and legend heading face | `D4ChartText` |
| D5 | Which face do control labels take?                                       | Heading face on every control; weights as built                       | `D5ControlFace`    |
| D6 | SectionHeader title: 14px caps, heading face, or 12px eyebrow?           | Heading face, semibold, sentence case, `text-primary`                 | `D6SectionTitle`   |
| D7 | Sentence-case labels (form, DataRow, Metric): body face or heading face? | Heading face                                                          | `D7LabelFace`      |

D1 (the lockup name) closed with #764's pick C and is in the table as established.

Space Grotesk is loaded at weights 600-700 only (`global.css`). Any D4, D5 or D7 default that puts a
regular or medium label on the heading face renders at the nearest loaded weight until the 400 and
500 faces are added, which is an asset change for the owner.

## Where the code drifts from the table

See section 5 of the typography rules proposal (design-coord sources, 2026-10-09): Eyebrow's tertiary
override, SectionHeader's 14px caps, MenuGroup's untracked caps, Tile's 10px bold label, the inline
caps in `custom/Workout`, the per-chart axis text, and SessionStatePill on `monoLabel`. Each lands in
its own slice (TD-782 to TD-788) after the decisions above.

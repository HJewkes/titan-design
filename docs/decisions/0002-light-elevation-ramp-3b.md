# 0002. Light elevation ramp 3b

## Status

accepted

## Need

Light mode had no ordered set of planes to measure colours against. On main, the light planes
collided: `surface-base` and `surface-overlay` were both white, and `background-base` and
`surface-raised` were both grey 100. The levels did not get lighter as they rose, so a pair checked
on "the page" said nothing about the same pair on a card or a well. Every contrast check, token
baseline and story baseline takes a plane list as input and needs one fixed light set to read from.

Scope: the planes, and every light role re-point that ships with them. This decision fixes which grey
each light elevation level takes, and records each light colour moved so that text and marks stay
above their floors on those planes. The tone recipe that names the text roles is a separate
decision; this one only applies it.

## Why existing tokens or primitives cannot serve it

1. Main's light planes: not monotonic, and two pairs of levels share one value, so the elevation
   system cannot separate them in light.
2. The dark ramp (`greyRamp` 975 to 850): monotonic, but a dark-mode set; its order is the model,
   not the values.
3. `greyRamp` 50 to 400: the steps exist. What was missing is the mapping from level to step. No new
   primitive or token category is added.

## Options

Rendered in the TD-789 labs. Each row lists frame (-2), background (-1), page (0), elevated (+1),
raised (+2) and overlay (+3 to +5).

1. **Fully monotonic (option 3 as first picked):** grey 400, 300, 200, 100, 50, white. Every level up
   is one grey step lighter, as in dark.
2. **Fully monotonic with its minimal role re-colour set:** the same planes as option 1.
3. **3b, Q5 C with stepped insets:** grey 300, 200, 100, 50, white, white. Raised and overlay share
   white; the lift separates them.
4. **Hybrid:** grey 200, 100, 50, white, white, white. No plane that carries text is darker than
   main's; three levels share white.

Dark is unchanged in every option: grey 975, 950, 925, 900, 875, 850.

## Rendered evidence

- `lab-decisions-elevation-ramp-aa--option-3-fallback-3b`, with
  `--option-1-as-picked`, `--option-2-recoloured`, `--option-4-hybrid` and `--dark-reference` beside it.
- `lab-decisions-elevation-ramps--default` (the first ramp comparison).

Weighed in Gate 2 batch 12/13.

## Checks

Contrast, light, with text tiers at their step before any re-colour (WCAG 2.1):

| Ink      | on white (main's page) | on grey 100 (3b page) | on grey 200 (option 1 page, 3b well) |
| -------- | ---------------------- | --------------------- | ------------------------------------ |
| grey 600 | 4.88                   | 4.07                  | 3.21                                 |
| grey 700 | 6.99                   | 5.83                  | 4.60                                 |
| grey 800 | 10.19                  | 8.50                  | 6.70                                 |

Rendered story-themes the lab counted as failing after each option's re-colour set: option 2, 262;
3b, 235; hybrid, 226. Of those, 176, 155 and 162 only re-key a miss the story baseline already held
on another plane.

CVD and near-duplicate: not applicable. No hue or new colour value is added; every plane is an
existing `greyRamp` step.

Light role re-points, ratio before and after on the grey 100 page and the grey 200 background (WCAG
2.1; text needs 4.5, marks and borders 3):

| Role                                             | Old to new                              | Floor | grey 100     | grey 200     |
| ------------------------------------------------ | --------------------------------------- | ----- | ------------ | ------------ |
| `text-tertiary`                                  | grey 600 to 700                         | 4.5   | 4.07 to 5.83 | 3.21 to 4.60 |
| `text-secondary`                                 | grey 700 to 800                         | 4.5   | 5.83 to 8.50 | 4.60 to 6.70 |
| `text-success`                                   | green 700 to 800                        | 4.5   | 5.42 to 8.11 | 4.27 to 6.39 |
| `text-brand-secondary`                           | cyan 700 to 800                         | 4.5   | 5.63 to 8.31 | 4.43 to 6.55 |
| `border-input`                                   | grey 500 to 600                         | 3     | 3.03 to 4.07 | 2.39 to 3.21 |
| `border-input-hover`                             | grey 600 to 700                         | 3     | 4.07 to 5.83 | 3.21 to 4.60 |
| `status-success`                                 | green 600 to 700                        | 3     | 3.80 to 5.42 | 3.00 to 4.27 |
| `status-warning`                                 | amber 500 to 600                        | 3     | 3.03 to 4.19 | 2.38 to 3.30 |
| BarList neutral bar                              | grey 600 to 700                         | 3     | 4.07 to 5.83 | 3.21 to 4.60 |
| BarList near bar                                 | red 500 to 600                          | 3     | 3.18 to 3.81 | 2.51 to 3.01 |
| `status-error-vivid` (consequential)             | vivid pin to red 700                    | 3     | 2.79 to 6.21 | 2.20 to 4.89 |
| `status-info` (consequential)                    | blue 600 to 700                         | 3     | 4.08 to 5.74 | 3.22 to 4.52 |
| `status-deload` (consequential)                  | magenta 600 to 700                      | 4.5   | 4.56 to 6.37 | 3.59 to 5.02 |
| `status-success-dark`                            | green 600 to 800                        | none  | 3.80 to 8.11 | 3.00 to 6.39 |
| `status-warning-dark`                            | amber 500 to 700                        | none  | 3.03 to 5.83 | 2.38 to 4.60 |
| `status-info-dark`                               | blue 600 to 800                         | none  | 4.08 to 8.49 | 3.22 to 6.69 |
| `status-error-vivid-subtle`, `-muted`, `-strong` | vivid pin to red 700 at the same alphas | none  |              |              |

The alpha hairlines are set by lightness difference, not ratio: `hairline-default` and `divider` move
from black 15% to 16% (ΔL\* 12 on grey 200), `hairline-strong` from 22% to 24% (ΔL\* 18).

Labels that painted a fill or mark tone as text now read the tone's text role, per the tone recipe.
Before and after on grey 100 and grey 200:

| Label                                                      | Old to new                                  | grey 100     | grey 200     |
| ---------------------------------------------------------- | ------------------------------------------- | ------------ | ------------ |
| Link; Button outline, ghost, link; Pill clear: `secondary` | `brand-secondary` to `text-brand-secondary` | 3.95 to 8.31 | 3.12 to 6.55 |
| Alert; Button outline, ghost, link; Pill clear: `error`    | `status-error` to `text-error`              | 3.81 to 6.21 | 3.01 to 4.89 |
| Alert, Typography, Metric, Button, Pill clear: `warning`   | `status-warning` to `text-warning`          | 4.19 to 5.83 | 3.30 to 4.60 |
| Alert, Typography, Metric, Button, Pill clear: `success`   | `status-success` to `text-success`          | 5.42 to 8.11 | 4.27 to 6.39 |
| Pill clear, `brand`                                        | `brand-primary` to `text-brand`             | 2.19 to 6.04 | 1.73 to 4.76 |

## Decision

Option 3, 3b (decisions item 149(1), Gate 2 batch 12/13). Light frame grey 300, background grey 200,
page grey 100, elevated grey 50, raised and overlay white; the input well follows elevated. Dark is
unchanged. The text-bearing planes are -1 through overlay plus the input; the frame is not.

3b keeps the monotonic order of option 1 one step lighter, so the page and the planes above it lose
less contrast against every ink than option 1 does, and it needs fewer re-colours. It keeps a
darker well than the hybrid, which inputs and insets need. Sharing white at raised and overlay is
accepted because the lift, not the fill, separates those levels.

These planes are the locked light measurement set (lock L-0001): every token, non-text and story
contrast baseline is measured against them.

### Role re-points

The re-points in the first table above, from `text-tertiary` to the BarList bars, and the two
hairlines are the lab's 3b re-colour set. They ship with the planes under the same pick (decisions
item 149(1)).

Three re-points had no owner pick. Each is a consequence of the planes: without it a gate adds a miss.
They are shown in the next Gate 2 round, and a Don't ship on any of them flips this record to
`rejected`, as the README sets out for role re-points:

- `status-error-vivid` to red 700. The vivid pin reads 2.79 on the page, under 3 for a mark. Red 600
  is `status-error`, so Critical and High would collapse into one colour; red 700 is the next step.
- `status-info` to blue 700. Its Progress fill reads 2.54 against its track on the grey 200 rail.
- `status-deload` to magenta 700. The deload WorkoutPill label reads 3.84 on its wash over grey 100,
  and 4.56 bare, at the floor's edge.

The rest follow from those picks and add no value:

- The vivid red tints move to red 700 with their base. The theme-independent `-rgb` triplet stays on
  the vivid pin, because it is one value shared with dark, where the pin is still the base.
- The light `-dark` variants of success, warning and info sit one step past their base, as
  `status-error-dark` already did. 3b moved each base a step darker and left `-dark` behind it.
- The labels in the second table above read the tone's text role, the recipe this decision applies
  but does not set.

## Rejected alternatives

- **Option 1 and 2, fully monotonic from grey 200.** The page drops to grey 200, where grey 600 text
  reads 3.21 and grey 700 4.60. It needs the most re-colours and leaves the most failing stories.
- **Hybrid.** No plane that carries text gets darker, but three levels share white and the well is
  only grey 100, too close to the page for an inset to read.
- **Keep main's light planes.** Two pairs of levels collide, so elevation cannot be measured or seen.

## Consequences

These files change together when this decision lands:

- `packages/ui/src/theme/tokens/semantic.ts` (light `surface-*`, `background-*` and the role
  re-points above) and the `.light` block of `packages/ui/src/theme/global.css`.
- The components whose labels read a text role: Alert, Button, Link, Metric, Pill and Typography.
- `packages/ui/api/*.api.md` (the light token values in the API reports).
- The contrast baselines measured against the planes: `src/theme/tokens/contrast-baseline.json`,
  `src/theme/nontext-contrast/`, and `tests/visual/contrast-stories-baseline.json`.

Light colours of shell accents and categorical inks are re-measured on these planes in their own
decisions; this one does not set them.

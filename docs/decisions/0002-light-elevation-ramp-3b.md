# 0002. Light elevation ramp 3b

## Status

accepted

## Need

Light mode had no ordered set of planes to measure colours against. On main, the light planes
collided: `surface-base` and `surface-overlay` were both white, and `background-base` and
`surface-raised` were both grey 100. The levels did not get lighter as they rose, so a pair checked
on "the page" said nothing about the same pair on a card or a well. Every contrast check, token
baseline and story baseline takes a plane list as input and needs one fixed light set to read from.

Scope: planes only. This decision fixes which grey each light elevation level takes. The role
re-colours that keep text and marks above their floors on these planes, and the tone recipe that
names them, are separate decisions.

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

## Rejected alternatives

- **Option 1 and 2, fully monotonic from grey 200.** The page drops to grey 200, where grey 600 text
  reads 3.21 and grey 700 4.60. It needs the most re-colours and leaves the most failing stories.
- **Hybrid.** No plane that carries text gets darker, but three levels share white and the well is
  only grey 100, too close to the page for an inset to read.
- **Keep main's light planes.** Two pairs of levels collide, so elevation cannot be measured or seen.

## Consequences

These files change together when this decision lands:

- `packages/ui/src/theme/tokens/semantic.ts` (light `surface-*`, `background-*`) and the `.light`
  block of `packages/ui/src/theme/global.css`.
- `packages/ui/api/*.api.md` (the light token values in the API reports).
- The contrast baselines measured against the planes: `src/theme/tokens/contrast-baseline.json`,
  `src/theme/nontext-contrast/`, and `tests/visual/contrast-stories-baseline.json`.

Light colours of shell accents, categorical inks and the tone recipe are re-measured on these
planes in their own decisions; this one does not set them.

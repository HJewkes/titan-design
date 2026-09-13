# Choosing tokens

The decision table for building a titan component. Everything here already existed — it was spread
across `theme/tokens/*.ts` JSDoc, `ColorPalettes.stories.tsx` prose, and one comment in `Surface.tsx`.
This file is the single place to look **before** writing a component, so the answer is reachable from
where the choice is actually made.

> Rendered in Storybook as **Foundations → Choosing Tokens**, from this same file.

---

## 1. Which colour palette?

Pick by **what the colour means**, not by what looks right.

| The colour means…                                         | Use                                                           | Not                                      |
| --------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| **A value got better / worse** (delta, trend, growth)     | `result-improve` / `result-degrade` / `result-neutral`        | `status-success` / `status-error`        |
| **A thing is in a state** (error, warning, live, info)    | `status-*`                                                    | `result-*`, brand colours                |
| **N peer categories** (chart series, tags, split counts)  | `categoricalPalette` (see §2)                                 | `data-1..10` — **superseded**            |
| **Brand identity / primary action**                       | `brand-primary`, `brand-secondary`                            | a status token that happens to be orange |
| **Structural chrome** (page, card, input backgrounds)     | `surface-*`, `background-*`                                   | grey ramp steps directly                 |
| **Text**                                                  | `text-primary` / `-secondary` / `-tertiary`                   | grey ramp steps directly                 |
| **Rules and separators**                                  | `hairline-*`, `divider`, `border-*`                           | a hardcoded `border` colour              |
| **A dimming layer over content** (modal, drawer, press)   | `scrim-*`                                                     | `bg-black/50` — see below                |
| **A label ON a fill** (solid button, chart tile, toolbar) | `on-brand-*`, `on-status-*`, `on-control-*`, `on-data-strong` | `text-white`, `text-primary`             |

### `result-*` vs `status-*` — the distinction that gets missed

They overlap visually (both have a green and a red) and mean different things.

- **`status-*`** describes _a thing's condition_: this request errored, this session is live.
- **`result-*`** describes _a change in a measurement_: velocity improved, the file net-shrank.

A net-negative char delta is **not an error** — it is a `result-degrade`. Reaching for `status-error`
there says "something is wrong" about a file that was simply refactored down. `Metric` and
`WeightBadge` already use `result-*` for exactly this; follow them.

### Translucent roles are their own token — never a `/n` modifier

`bg-black/50` works. `bg-scrim-default/50` does not, and neither does `bg-brand-primary/10`:
Tailwind v3 cannot parse a `var()` colour when an opacity modifier is applied, so it emits **no
rule at all** and the class silently does nothing. Anything translucent therefore ships as a token
carrying its own alpha — which is what `hairline-*`, `interactive-*` and `scrim-*` all are.

| Token                | Value                 | Use                                       |
| -------------------- | --------------------- | ----------------------------------------- |
| `scrim-press`        | `rgba(0, 0, 0, 0.10)` | press/hover wash on a control over a fill |
| `scrim-press-strong` | `rgba(0, 0, 0, 0.20)` | the active half of that pair              |
| `scrim-subtle`       | `rgba(0, 0, 0, 0.30)` | blurred modal backdrop, filled input fill |
| `scrim-default`      | `rgba(0, 0, 0, 0.50)` | modal backdrop, drawer overlay            |

Scrims do **not** flip with the theme. A scrim's job is to push content back so an overlay reads,
and that is as true on a light page as a dark one.

### `on-control-*` and `on-data-strong`

The `on-*` family is "the label that sits ON this fill". Two members are not fills at all:

- **`on-control-*`** — a toolbar control face is a grey plane, not a brand or status fill. Use
  `on-control-active` / `on-control-idle` rather than `on-brand-primary`, even though the active
  value is the same white; the role is what makes it survive a retune.
- **`on-data-strong`** — a label on a light categorical data tile. Every `text-*` role is far too
  light to read there.

### `data-1..10` is superseded

Still shipped, still has swatches, consumed by **no** component. `ColorPalettes.stories.tsx` story 11
marks it _"Do not use for new work."_ It is the single easiest wrong turn in this system — the names
look like the obvious choice for chart data. Use `categoricalPalette`.

---

## 2. The categorical palette

```ts
import { categoricalPalette, CATEGORICAL_CVD_SAFE_MAX } from '../theme/tokens/primitives'

const [reads, writes, edits] = categoricalPalette.default
```

- **Canonical order:** blue → magenta → red → orange → green → cyan → amber.
- **Nested-stable:** a chart with N series takes the first N. A series' colour does not shift when N
  changes, so adding a series never recolours the existing ones.
- **CVD-safe through `CATEGORICAL_CVD_SAFE_MAX` (6).** The 7th is extended and needs a legend or a
  second encoding.
- **Two variants:** `default` (vivid — neutral/light surfaces, legible under black text) and `dark`
  (deeper — legible under white text on a filled swatch).

Take colours **in order from the front**. Hand-picking indices to "look nicer" breaks the CVD
guarantee and the nested-stability property in one move.

---

## 3. Resolving a colour in code

| Context                                           | Use                                                |
| ------------------------------------------------- | -------------------------------------------------- |
| Anywhere a className works                        | `className="text-text-tertiary bg-surface-raised"` |
| Inline style, SVG attr, gradient, per-edge border | `resolveColor('result-degrade')`                   |
| A whole surface's background/text pairing         | `<Surface>` / `useSurfaceMode()`                   |

**Do not call `getSemanticColors('dark')` in a component.** It freezes the value to the dark-mode hex,
so the component stops responding to the theme. `resolveColor` returns `var(--color-<token>)` on web —
which is what makes light/dark switching work — and the resolved hex on native, where it is dark-only.

```ts
// ✗ frozen to dark, silently breaks light theme
const t = getSemanticColors('dark')
;<View style={{ backgroundColor: t['brand-primary'] }} />

// ✓ theme-correct on web, renders on native
;<View style={{ backgroundColor: resolveColor('brand-primary') }} />
```

`getSemanticColors` is for tests, stories, and token-layer code — places where a concrete value is the
point. There are ~98 legacy call sites in components; they are a known migration, not a precedent.

**In tested component code, resolve at render time instead of reaching for `resolveColor`.** Under the
RNW vitest alias `resolveColor` returns the `var()` string, which `toHaveStyle` cannot match, so a
component whose colours are asserted needs literal hex that still follows the theme. That is what the
Surface hooks give you: the mode comes from the nearest `<Surface>` on every render.

```ts
// ✗ frozen at import time — one palette for the process's lifetime
const t = getSemanticColors('dark')

// ✓ literal hex, re-resolved per render from the enclosing Surface
const t = getSemanticColors(useSurfaceMode())
const label = useOnSurfaceColor('secondary') // the three neutral text roles
```

A helper module that has no render of its own takes the mode as a parameter (`tone(mode)`) and lets
its caller pass `useSurfaceMode()`. `titan/no-frozen-theme` enforces both halves — see §6.

### Translucency: never `/<n>` on a token (VW-308)

**Tailwind v3 emits no rule at all for an opacity modifier on a `var()`-backed colour.** Not a
warning, not a fallback — the class is dead CSS, and the element paints nothing. Every colour in
`tailwind.config.js` is `var(--color-…)`, which is exactly what makes light/dark switching work, so
this hits every token in the system:

```tsx
// ✗ dead CSS — no rule is generated, the tint never appears
<View className="bg-brand-primary/10" />

// ✓ a published wash rung
<View className="bg-brand-primary-subtle" />
```

The trap is that `text-white/70` and `bg-black/50` **do** compile, because Tailwind's own palette
holds literal values. So the modifier looks like it works until you point it at a token. It shipped
unnoticed in `IconBox`, `Progress`, `Toast` and `InitiativeBrief` for months.

Reach for one of these instead:

| Need                                     | Use                                                               |
| ---------------------------------------- | ----------------------------------------------------------------- |
| A tinted container or track              | a wash rung — `-subtle` (0.12) / `-muted` (0.30) / `-strong` (0.50) |
| A state that already has a role          | `text-text-disabled`, `hairline-*`, `interactive-*`               |
| A one-off alpha in an inline style / SVG | `alpha(resolveColor('brand-primary'), 0.06)`                      |

Wash rungs are published for `brand-primary`, `brand-secondary`, and every `status-*` role. They work
on native too, which `color-mix()` and the `<alpha-value>` channel-triplet pattern do not — that is
why the fix was to remove the modifiers rather than teach the config to honour them.

`titan/no-var-color-opacity` blocks new ones, deriving the token list from `tailwind.config.js` so a
new token is covered the day it lands. `src/theme/tailwind-var-opacity.test.ts` compiles the real
config against a fixture and pins both halves: the dead classes still emit nothing, and
`text-white/70` still compiles.

---

## 4. Type scale

Compose `Typography` and pick a **variant**. Do not pass `style={{ fontSize }}` — it defeats the scale
and the line-height that comes with it.

| Variant                   | Use                                       |
| ------------------------- | ----------------------------------------- |
| `h1`–`h6`                 | headings                                  |
| `subtitle1` / `subtitle2` | card and section titles                   |
| `body1` / `body2`         | prose                                     |
| `caption`                 | secondary/meta text                       |
| `overline`                | uppercase micro-labels (or use `Eyebrow`) |
| `mono` / `monoLabel`      | numerals, paths, identifiers              |
| `microLabel`              | 10px uppercase column/table headers       |
| `boldLabel`               | 12px bold badge and row labels            |

`overline` and `microLabel` are the same idea at two sizes and in two faces: `overline` is
12px `font-body`, `microLabel` is 10px `font-sans` for dense tabular headers.

Raw sizes, when a variant genuinely does not fit:

| Class       | Size |
| ----------- | ---- |
| `text-2xs`  | 10px |
| `text-xs`   | 12px |
| `text-sm`   | 14px |
| `text-base` | 16px |
| `text-lg`   | 18px |
| `text-xl`   | 24px |
| `text-2xl`  | 32px |

`text-[11px]` is not a size the system has. Round to the scale.

---

## 5. Spacing and radius

Default Tailwind 4px scale — `gap-2` is 8px, `p-3` is 12px, `p-4` is 16px.

| Radius       | Size |
| ------------ | ---- |
| `rounded-sm` | 4px  |
| `rounded-md` | 8px  |
| `rounded-lg` | 12px |
| `rounded-xl` | 16px |

**Arbitrary values (`p-[18px]`, `gap-[14px]`, `rounded-[10px]`) are lint errors** in token-pure
families. They are how a specimen's hand-tuned pixels leak into the library: each one is individually
defensible and collectively there is no scale left. Mature components (`ExerciseCard`, `SetRow`,
`Card`) contain zero.

Genuine one-off layout dimensions — a fixed pane width like `w-[420px]` — are fine. The rule targets
spacing, radius, and type, not layout geometry.

---

## 6. Guardrails

`eslint.config.js` enforces a subset of the above, scoped by directory:

| Scope                                  | Enforced                                                         |
| -------------------------------------- | ---------------------------------------------------------------- |
| all of `src/**`                        | no `/<n>` opacity modifier on a token colour (**error**)         |
| all of `src/components/**`             | no inline `linear-gradient` strings (warn)                       |
| all of `src/components/**`             | no frozen theme — module-scope or literal-mode `getSemanticColors()` (**error**, ratcheted) |
| `shell/`, `icons/`                     | \+ no raw hex (warn)                                             |
| `custom/ActiveWork/`, `custom/charts/` | \+ no raw hex, no arbitrary px, no inline `fontSize` (**error**) |
| `custom/Workout/` — batch B1 only      | same errors, listed file by file until the family is ported      |

Workout is being ported in batches (E3), so it is enrolled per file rather than per
family. Batch B1: `SetStrip`, `SetTableHeader`, `SetsRepsLoad`, `ExerciseHeading`,
`ExerciseIndicator`, `ExerciseCardHeading`, `PrBadge`. Add each later batch's files to
the same list as it lands; swap the list for a `Workout/**` glob when the last one is in.

The scope is deliberately per-family rather than repo-wide: a codebase-wide migration is a separate
effort, and a rule that fires 140 times on legacy code gets ignored. **When you harden a new family
into the library, add it to the token-pure list** — that is the ratchet, and it only works if each
new family opts in while it is still clean.

`titan/no-frozen-theme` is the exception that covers every family at once, because it can: its
offenders are recorded per file in `eslint-rules/frozen-theme-baseline.json`, keyed by frozen value.
A new frozen call fails immediately anywhere under `src/components/**`; the 38 recorded ones migrate
in batches (VW-316). After migrating a file, run
`node scripts/update-frozen-theme-baseline.mjs` to lower its allowance — the script refuses to raise
one without `--allow-increase`, so the ratchet only shrinks.

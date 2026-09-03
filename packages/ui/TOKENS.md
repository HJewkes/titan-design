# Choosing tokens

The decision table for building a titan component. Everything here already existed — it was spread
across `theme/tokens/*.ts` JSDoc, `ColorPalettes.stories.tsx` prose, and one comment in `Surface.tsx`.
This file is the single place to look **before** writing a component, so the answer is reachable from
where the choice is actually made.

> Rendered in Storybook as **Foundations → Choosing Tokens**, from this same file.

---

## 1. Which colour palette?

Pick by **what the colour means**, not by what looks right.

| The colour means…                                        | Use                                                    | Not                                      |
| -------------------------------------------------------- | ------------------------------------------------------ | ---------------------------------------- |
| **A value got better / worse** (delta, trend, growth)    | `result-improve` / `result-degrade` / `result-neutral` | `status-success` / `status-error`        |
| **A thing is in a state** (error, warning, live, info)   | `status-*`                                             | `result-*`, brand colours                |
| **N peer categories** (chart series, tags, split counts) | `categoricalPalette` (see §2)                          | `data-1..10` — **superseded**            |
| **Brand identity / primary action**                      | `brand-primary`, `brand-secondary`                     | a status token that happens to be orange |
| **Structural chrome** (page, card, input backgrounds)    | `surface-*`, `background-*`                            | grey ramp steps directly                 |
| **Text**                                                 | `text-primary` / `-secondary` / `-tertiary`            | grey ramp steps directly                 |
| **Rules and separators**                                 | `hairline-*`, `divider`, `border-*`                    | a hardcoded `border` colour              |

### `result-*` vs `status-*` — the distinction that gets missed

They overlap visually (both have a green and a red) and mean different things.

- **`status-*`** describes _a thing's condition_: this request errored, this session is live.
- **`result-*`** describes _a change in a measurement_: velocity improved, the file net-shrank.

A net-negative char delta is **not an error** — it is a `result-degrade`. Reaching for `status-error`
there says "something is wrong" about a file that was simply refactored down. `Metric` and
`WeightBadge` already use `result-*` for exactly this; follow them.

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

Raw sizes, when a variant genuinely does not fit:

| Class       | Size |
| ----------- | ---- |
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
| all of `src/components/**`             | no inline `linear-gradient` strings (warn)                       |
| `shell/`, `icons/`                     | \+ no raw hex (warn)                                             |
| `custom/ActiveWork/`, `custom/charts/` | \+ no raw hex, no arbitrary px, no inline `fontSize` (**error**) |

The scope is deliberately per-family rather than repo-wide: a codebase-wide migration is a separate
effort, and a rule that fires 140 times on legacy code gets ignored. **When you harden a new family
into the library, add it to the token-pure list** — that is the ratchet, and it only works if each
new family opts in while it is still clean.

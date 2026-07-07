# Shell chrome — component family

The persistent dashboard frame (top bar, and — as the decomposition proceeds — side nav, session
rail, drawers, pinned strip). Components live flat on disk; the tiering below is a documentation
contract, not a directory layout, so promoting/composing is pure import churn.

This README is the **index**: it maps each component's dependencies (**composes ↓**) and its consumers
(**used-by ↑**) so you can navigate the tree in both directions and spot where a hand-rolled element
should be reaching for an existing primitive instead. Storybook mirrors this tree under `Shell/TopBar/…`,
and every component's autodocs page repeats its "Composes" links.

## Specimen: `TopBar` (the first shell unit, S1)

```
TopBar ....................... organism — the chrome band (Shell/TopBar)
├─ BrandLockup ............... molecule
│  ├─ VoltrasMark ............ icons (shared primitive)
│  └─ Typography ............. titan · button variant
├─ SessionStatePill .......... molecule  (= the reusable StatusPill)
│  ├─ Indicator .............. titan · ping pulse + vivid color
│  └─ Typography ............. titan · monoLabel
├─ Divider ................... titan · bg-border-prominent
├─ DeviceMenu ................ organism
│  ├─ Popover ................ titan
│  ├─ DeviceIndicator ........ molecule → BluetoothIcon (icons primitive)
│  ├─ DeviceRow .............. molecule → Indicator + Typography (body2 / mono)
│  └─ Typography ............. titan · monoLabel (header)
├─ DateTime .................. titan · mono variant, live 24h clock
└─ surfaceGradient.chrome .... theme · gradient primitive
```

## Dependency map

| Component | Tier | Composes ↓ | Used-by ↑ |
|---|---|---|---|
| `TopBar` | organism | BrandLockup, SessionStatePill, Divider, DeviceMenu, DateTime, `surfaceGradient.chrome` | dashboard app root *(planned)* |
| `BrandLockup` | molecule | VoltrasMark, Typography | TopBar |
| `SessionStatePill` | molecule | Indicator, Typography | TopBar, **Live-view header** *(planned reuse)* |
| `DeviceMenu` | organism | Popover, DeviceIndicator, DeviceRow, Typography | TopBar |
| `DeviceIndicator` | molecule | BluetoothIcon | DeviceMenu |
| `DeviceRow` | molecule | Indicator, Typography | DeviceMenu |
| `VoltrasMark` / `BluetoothIcon` | **`components/icons`** primitive | `SvgIcon` base | BrandLockup / DeviceIndicator (+ any consumer) |

## Shared substrates introduced here (reusable beyond the shell)

Building S1 grew the design system — these are now available to every component:

- **`components/icons`** — a shared icon primitive: an `SvgIcon` base (24×24, a11y contract, `currentColor`)
  + `IconProps`. VoltrasMark / BluetoothIcon live here, and the previously-orphaned Workout icons
  (Dumbbell / Star) were folded in (re-exported from `Workout/icons` for back-compat).
- **`theme/gradients.ts`** — `linearGradient(from, to, angle)` + named `surfaceGradient.*`, built on
  `resolveColor` (themeable web CSS vars + native hex fallback).
- **`Indicator`** (titan atom) — `pulse: 'ping'` (expanding ring) + `success-vivid` / `error-vivid` colors.
- **`DateTime`** (titan) — `hour12`, `seconds`, self-ticking `live`, and Typography routing via `variant`.
- **`Typography`** — `mono` (technical readouts) + `monoLabel` (all-caps mono) variants.
- **Tokens** — a full **vivid** green/red palette + **`border-prominent`** divider token.

## Reuse audit (the "are we failing to use existing components?" check)

Every leaf now composes a primitive rather than hand-rolling it:

| Concern | Uses | Not |
|---|---|---|
| status dots | `Indicator` | raw CSS/`View` dots |
| dividers | `Divider` (`border-prominent`) | hairline `View`s |
| mono / all-caps text | `Typography` `mono`/`monoLabel` | ad-hoc `font-mono` classes |
| glyphs | icon atoms (`VoltrasMark`, `BluetoothIcon`) | unicode chars / inline `<svg>` |
| chrome gradient | `surfaceGradient.chrome` | inline `linear-gradient` strings |
| colors | semantic tokens (vivid palette) | magic hex |

**Watch-list (known gaps to close as we go):**
- **Dot primitive overlap** — titan has both `StatusDot` (Workout, semantic) and `Indicator` (ui, generic).
  The shell standardizes on `Indicator`; a future pass could consolidate.
- **Other hand-rolled gradients** — `MesoCard`, `DeviationBar`, `MesoStatusCard`, `BodyMapDetailPanel` still
  inline `linear-gradient` strings; they should adopt `surfaceGradient` / `linearGradient`.

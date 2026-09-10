# Shell chrome — component family

The persistent dashboard frame (top bar, side nav, and — as the decomposition proceeds — session
rail, drawers, pinned strip). The tiering below is a documentation contract, not a directory
layout, so promoting/composing is pure import churn.

This README is the **index**: it maps each component's dependencies (**composes ↓**) and its consumers
(**used-by ↑**) so you can navigate the tree in both directions and spot where a hand-rolled element
should be reaching for an existing primitive instead. Storybook mirrors this tree under `Shell/TopBar/…`,
and every component's autodocs page repeats its "Composes" links.

## The generic/app split (AW-132)

`shell/` is **generic**. It knows about a band, a rail, a brand lockup and a content region, and
nothing about any one product. `shell/workout/` is the **workout app's** chrome, and it composes
the generic family. The dependency arrow points one way only: nothing in `shell/` may import from
`shell/workout/`, and a second app (audiobook, active-work, agent dashboards, brain) gets its own
sibling directory rather than a new prop on `AppShell`.

**The composition mechanism is the library's existing slot idiom** — named `ReactNode` props with a
built-in default, the same shape as `Pill`'s `leading`/`trailing` and `SectionHeader`'s `trailing`.
No second mechanism was introduced.

| Slot                     | On          | Default                          | An app uses it to…                       |
| ------------------------ | ----------- | -------------------------------- | ---------------------------------------- |
| `TopBar.trailing`        | `TopBar`    | just the clock                   | put its own chrome in the right cluster  |
| `TopBar.leading`         | `TopBar`    | `<BrandLockup brand=…>`          | replace the brand region outright        |
| `AppShell.topBarTrailing` | `AppShell`  | —                                | pass chrome through to the default bar   |
| `AppShell.topBar`        | `AppShell`  | `<TopBar brand=…>`               | swap the whole band                      |
| `AppShell.nav`           | `AppShell`  | `<SideNav items=…>`              | swap the whole rail                      |
| `AppShell.children`      | `AppShell`  | a placeholder                    | mount its page                           |

`TopBar.trailing` takes an array as well as a node. **The bar interleaves its own vertical dividers
between the items**, so an app supplies the controls and the shell keeps the divider rhythm from the
S1 lock — the app never hand-places a `Divider`, and can't drift from it.

Two things stopped being generic defaults and became the workout app's data:

- `SideNav.items` is **required**. The four Live · Review · Plan · Body categories are
  `workoutNavItems` in `shell/workout/`.
- `BrandLockup` is generic over `brand` (five presets in `brands.tsx`), rather than hard-coding
  the Voltras mark and wordmark.

## Specimen: `SideNav` (the second shell unit, S2)

```
SideNav ...................... organism — the 60px left rail (Shell/SideNav)
├─ NavItem ................... molecule × `items` (the app's own categories)
│  ├─ icon ................... icons (shared primitive) — supplied per item
│  └─ Typography ............. titan · button variant (uppercase micro-label)
└─ (accent bar) .............. bg-brand-primary edge bar on the active item
```

Decisions locked 2026-07-08 (specimen `sources/design/shell/S2-sidenav/`): lucide glyphs
(activity · history · layers · figure) · **Plan** label (narrower than "Program") · active = **left accent
bar** (short, centered on the icon+label) · **60px** icon+micro-label · live cue = **muted-green label**
(`status-live-muted`) on the Live item while a set runs off-Live · four items, no footer, no top-nav. Fixed
60px at every width (labels sit under the glyph). `SideNav` is presentational — `activeKey` / `onNavigate` /
`liveKey`; the app owns routing + which key is live. Those four categories are now
`workoutNavItems` in `shell/workout/` (AW-132); the rail itself has no built-in set.

## Specimen: `TopBar` (the first shell unit, S1)

```
TopBar ....................... organism — the chrome band (Shell/TopBar)
├─ BrandLockup ............... molecule — default `leading`
│  ├─ brand mark ............. icons (shared primitive) — per `brands.tsx` preset
│  └─ Typography ............. titan · button variant
├─ trailing[] ................ SLOT — app chrome, divider-interleaved by the bar
├─ Divider ................... titan · bg-border-prominent (one per slot gap)
├─ DateTime .................. titan · mono variant, live 24h clock (edge-pinned)
└─ surfaceGradient.chrome .... theme · gradient primitive
```

## Specimen: `WorkoutTopBar` (the same band, filled by the workout app)

```
WorkoutTopBar ................ organism — Shell/Workout/WorkoutTopBar
└─ TopBar .................... generic band, brand="voltras"
   └─ trailing[] ............. supplied by the workout app:
      ├─ SessionStatePill .... molecule → Indicator + Typography (monoLabel)
      └─ DeviceMenu .......... organism
         ├─ Popover .......... titan
         ├─ DeviceIndicator .. molecule → BluetoothIcon (icons primitive)
         ├─ DeviceRow ........ molecule → Indicator + Typography (body2 / mono)
         └─ Typography ....... titan · monoLabel (header)
```

## Dependency map — generic (`shell/`)

| Component | Tier | Composes ↓ | Used-by ↑ |
|---|---|---|---|
| `AppShell` | page shell | TopBar, SideNav, Surface | WorkoutShell, any app root |
| `SideNav` | organism | NavItem × `items` | AppShell |
| `NavItem` | molecule | icon, Typography | SideNav |
| `TopBar` | organism | BrandLockup, Divider, DateTime, `surfaceGradient.chrome` | AppShell, WorkoutTopBar |
| `BrandLockup` | molecule | a brand mark icon, Typography | TopBar |
| `brands.tsx` | data | VoltrasMark / Headphones / Kanban / Bot / Brain icons | BrandLockup, TopBar, AppShell |

## Dependency map — workout app (`shell/workout/`)

| Component | Tier | Composes ↓ | Used-by ↑ |
|---|---|---|---|
| `WorkoutShell` | page shell | AppShell, WorkoutTopBar, workoutNavItems | dashboard app root |
| `WorkoutTopBar` | organism | TopBar, SessionStatePill, DeviceMenu | WorkoutShell |
| `SessionStatePill` | molecule | Indicator, Typography | WorkoutTopBar, **Live-view header** *(planned reuse)* |
| `DeviceMenu` | organism | Popover, DeviceIndicator, DeviceRow, Typography | WorkoutTopBar |
| `DeviceIndicator` | molecule | BluetoothIcon | DeviceMenu |
| `DeviceRow` | molecule | Indicator, Typography | DeviceMenu |
| `workoutNavItems` | data | Activity/History/Layers/PersonStanding icons | WorkoutShell |

## Shared substrates introduced here (reusable beyond the shell)

Building S1 grew the design system — these are now available to every component:

- **`components/icons`** — a shared icon primitive: an `SvgIcon` base (24×24, a11y contract, `currentColor`)
  + `IconProps`. VoltrasMark / BluetoothIcon live here, and the previously-orphaned Workout icons
  (Dumbbell / Star) were folded in (re-exported from `Workout/icons` for back-compat).
- **`theme/gradients.ts`** — `linearGradient(from, to, angle)` + named `surfaceGradient.*`, built on
  `resolveColor` (themeable web CSS vars + native hex fallback).
- **`Indicator`** (titan atom) — `pulse: 'ping'` (expanding ring) + `success` / `error-vivid` colors.
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

## Testing

- **Unit** — every component + primitive has a `*.test.tsx` (render, behavior, a11y); shell branch coverage ≈96%.
- **Visual** — `tests/visual/stories.spec.ts` screenshots the `Shell/*` + `Icons` stories via Playwright
  (`toHaveScreenshot`), clock-frozen + animations-disabled so the live-clock/animated stories are
  deterministic. Widen `SCOPE` to cover more of the library. **Baselines must be generated in the pinned
  container** (`mcr.microsoft.com/playwright:v1.58.2-noble`) — the `visual.yml` "Layer 2" step seeds them as
  an artifact; commit the `*-chromium-linux.png` and flip the step to the `test:visual:stories` gate.
- **Lint guardrails** — components may not inline `linear-gradient` (use `surfaceGradient`); shell + icons may
  not use raw hex (use tokens).

**AW-132 shared substrate:** four brand marks added to `components/icons` (`HeadphonesIcon`,
`KanbanIcon`, `BotIcon`, `BrainIcon`), so `brands.tsx` can carry a preset for every app expected to
mount this shell. Brand accents come from `data-*` rather than `status-*`: `data-*` is the library's
set of distinct, CVD-checked hues with no semantic load, which is what a per-app identity accent
needs. Voltras keeps the real `brand-primary` token.

**S2 shared substrate:** four nav glyphs added to `components/icons` (`ActivityIcon`, `HistoryIcon`,
`LayersIcon`, `PersonStandingIcon` — lucide-mirrored, like Dumbbell/Star), available system-wide.

**Watch-list (known gaps to close as we go):**
- **Dot primitive overlap** — titan has both `StatusDot` (Workout, semantic) and `Indicator` (ui, generic).
  The shell standardizes on `Indicator`; a future pass could consolidate.
- **Other hand-rolled gradients** — `MesoCard`, `DeviationBar`, `MesoStatusCard`, `BodyMapDetailPanel` still
  inline `linear-gradient` strings; they should adopt `surfaceGradient` / `linearGradient`.
- **`status-live` token family (new, decoupled from success)** — introduced `status-live` (green-300, the
  vivid LIVE-pill green) + `status-live-muted` (green-500 `#22A444`, the quiet nav cue) so "live" has its own
  role: changing `status-success` no longer affects live, and vice-versa. Wired the full chain (semantic →
  config → global.css → tailwind); `Indicator` gained a `live` color; the S1 LIVE pill was repointed
  `success`→`live` (value-preserving). This realized a slice of TD-05.09 Fork 1b (wiring ramp steps as tokens).
- **`aria-selected` on `NavItem`** — RNW does not emit `aria-selected` from `accessibilityState={{selected}}`
  in the jsdom test env, so active-state is asserted via the accent-bar testID. Confirm the on-device/RNW
  build exposes selection to AT (may need an explicit `aria-selected` for full tab semantics).

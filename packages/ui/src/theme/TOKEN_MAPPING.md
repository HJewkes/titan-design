# Token Mapping: CSS Variables / Tailwind Classes / Actual Values

Canonical reference for the titan-design token system. When in doubt, this file is the
source of truth for which Tailwind class maps to which value.

**Mode note**: Dark mode is the default (`:root`). Light mode activates with `.light`.
All values below are dark-mode unless noted.

---

## Font Families

| HTML Demo Variable | HTML Demo Value | Tailwind Class | Tailwind Resolved Value | Notes |
|---|---|---|---|---|
| `--font-heading` | Space Grotesk | `font-heading` | Space Grotesk | Match |
| `--font-ui` | Nunito Sans | `font-body` | Nunito Sans | Name mismatch: HTML calls it "ui", Tailwind calls it "body" |
| `--font-body` | Inter | `font-sans` | Inter | Name mismatch: HTML calls it "body", Tailwind calls it "sans" |
| _(none)_ | _(none)_ | `font-mono` | SF Mono, Monaco, Inconsolata... | Monospace stack |

### Font Family Cheat Sheet

| Purpose | Correct Tailwind Class | Font Loaded |
|---|---|---|
| Headings / display text | `font-heading` | Space Grotesk |
| UI labels, body copy, captions | `font-body` | Nunito Sans |
| Base / system / buttons | `font-sans` | Inter |
| Code snippets | `font-mono` | SF Mono / system mono |

---

## Font Sizes

| Tailwind Class | Size | Line Height |
|---|---|---|
| `text-xs` | 0.75rem (12px) | 1rem |
| `text-sm` | 0.875rem (14px) | 1.25rem |
| `text-base` | 1rem (16px) | 1.5rem |
| `text-lg` | 1.125rem (18px) | 1.75rem |
| `text-xl` | 1.5rem (24px) | 2rem |
| `text-2xl` | 2rem (32px) | 2.5rem |
| `text-3xl` | 2.25rem (36px) | 2.75rem |
| `text-4xl` | 3rem (48px) | 3.5rem |
| `text-5xl` | 3.5rem (56px) | 4rem |

---

## Colors

### Brand

| Token | CSS Variable | Dark Value | Light Value | Tailwind Class (bg/text/border) |
|---|---|---|---|---|
| brand-primary | `--color-brand-primary` | #FF7900 | #FF7900 | `brand-primary` |
| brand-primary-light | `--color-brand-primary-light` | #FF9630 | #FF9630 | `brand-primary-light` |
| brand-primary-dark | `--color-brand-primary-dark` | #D0620C | #D0620C | `brand-primary-dark` |
| brand-primary-subtle | `--color-brand-primary-subtle` | rgba(255,121,0,0.12) | rgba(255,121,0,0.08) | `brand-primary-subtle` |
| brand-primary-hover | `--color-brand-primary-hover` | #FF8500 | #F56C00 | `brand-primary-hover` |
| brand-primary-active | `--color-brand-primary-active` | #FF9630 | #E06D10 | `brand-primary-active` |
| brand-secondary | `--color-brand-secondary` | #406D87 | #406D87 | `brand-secondary` |
| brand-secondary-light | `--color-brand-secondary-light` | #678498 | #678498 | `brand-secondary-light` |
| brand-secondary-dark | `--color-brand-secondary-dark` | #32556D | #32556D | `brand-secondary-dark` |
| brand-secondary-subtle | `--color-brand-secondary-subtle` | rgba(64,109,135,0.12) | rgba(64,109,135,0.08) | `brand-secondary-subtle` |
| brand-secondary-hover | `--color-brand-secondary-hover` | #557488 | #39617A | `brand-secondary-hover` |
| brand-secondary-active | `--color-brand-secondary-active` | #678498 | #32556D | `brand-secondary-active` |

### Text on Brand

| Token | CSS Variable | Value | Tailwind Class |
|---|---|---|---|
| on-brand-primary | `--color-on-brand-primary` | #FFFFFF | `on-brand-primary` |
| on-brand-secondary | `--color-on-brand-secondary` | #FFFFFF | `on-brand-secondary` |

### Status

| Token | CSS Variable | Value (both modes) | Tailwind Class |
|---|---|---|---|
| status-success | `--color-status-success` | #14B8A6 | `status-success` |
| status-success-light | `--color-status-success-light` | #43C6B7 | `status-success-light` |
| status-success-dark | `--color-status-success-dark` | #0E8074 | `status-success-dark` |
| status-success-subtle | `--color-status-success-subtle` | rgba(20,184,166,0.12) / #F0FDFA | `status-success-subtle` |
| status-error | `--color-status-error` | #D14343 | `status-error` |
| status-error-light | `--color-status-error-light` | #DA6868 | `status-error-light` |
| status-error-dark | `--color-status-error-dark` | #922E2E | `status-error-dark` |
| status-error-subtle | `--color-status-error-subtle` | rgba(209,67,67,0.12) / #FEF2F2 | `status-error-subtle` |
| status-warning | `--color-status-warning` | #FFB020 | `status-warning` |
| status-warning-light | `--color-status-warning-light` | #FFBF4C | `status-warning-light` |
| status-warning-dark | `--color-status-warning-dark` | #B27B16 | `status-warning-dark` |
| status-warning-subtle | `--color-status-warning-subtle` | rgba(255,176,32,0.12) / #FFFBEB | `status-warning-subtle` |
| status-info | `--color-status-info` | #2196F3 | `status-info` |
| status-info-light | `--color-status-info-light` | #64B6F7 | `status-info-light` |
| status-info-dark | `--color-status-info-dark` | #0B79D0 | `status-info-dark` |
| status-info-subtle | `--color-status-info-subtle` | rgba(33,150,243,0.12) / #F0F9FF | `status-info-subtle` |

### Text on Status

| Token | CSS Variable | Value | Tailwind Class |
|---|---|---|---|
| on-status-success | `--color-on-status-success` | #FFFFFF | `on-status-success` |
| on-status-error | `--color-on-status-error` | #FFFFFF | `on-status-error` |
| on-status-warning | `--color-on-status-warning` | #FFFFFF | `on-status-warning` |
| on-status-info | `--color-on-status-info` | #FFFFFF | `on-status-info` |

### Result / Outcome

| Token | CSS Variable | Value (both modes) | Tailwind Class |
|---|---|---|---|
| result-improve | `--color-result-improve` | #4caf50 | `result-improve` |
| result-improve-light | `--color-result-improve-light` | rgba(76,175,80,0.16) / rgba(76,175,80,0.12) | `result-improve-light` |
| result-improve-dark | `--color-result-improve-dark` | #248a24 | `result-improve-dark` |
| result-degrade | `--color-result-degrade` | #ef5350 | `result-degrade` |
| result-degrade-light | `--color-result-degrade-light` | rgba(239,83,80,0.16) / rgba(239,83,80,0.12) | `result-degrade-light` |
| result-degrade-dark | `--color-result-degrade-dark` | #b30000 | `result-degrade-dark` |
| result-inconclusive | `--color-result-inconclusive` | #9E9A97 | `result-inconclusive` |
| result-inconclusive-light | `--color-result-inconclusive-light` | rgba(158,154,151,0.16) / rgba(158,154,151,0.12) | `result-inconclusive-light` |
| result-neutral | `--color-result-neutral` | #9CA3AF (dark) / #6B7280 (light) | `result-neutral` |

### Text on Result

| Token | CSS Variable | Value | Tailwind Class |
|---|---|---|---|
| on-result-improve | `--color-on-result-improve` | #FFFFFF | `on-result-improve` |
| on-result-degrade | `--color-on-result-degrade` | #FFFFFF | `on-result-degrade` |
| on-result-inconclusive | `--color-on-result-inconclusive` | #FFFFFF | `on-result-inconclusive` |

### Surface

| Token | CSS Variable | Dark Value | Light Value | Tailwind Class |
|---|---|---|---|---|
| surface-base | `--color-surface-base` | #161616 | #FFFFFF | `surface-base` |
| surface-elevated | `--color-surface-elevated` | #191919 | #FAFAFA | `surface-elevated` |
| surface-raised | `--color-surface-raised` | #1C1C1C | #F3F4F6 | `surface-raised` |
| surface-overlay | `--color-surface-overlay` | #191919 | #FFFFFF | `surface-overlay` |
| surface-input | `--color-surface-input` | #191919 | #FAFAFA | `surface-input` |

### Background

| Token | CSS Variable | Dark Value | Light Value | Tailwind Class |
|---|---|---|---|---|
| background-base | `--color-background-base` | #101010 | #EBEBEB | `background-base` |
| background-default | `--color-background-default` | #161616 | #FFFFFF | `bg-background` (DEFAULT) |
| background-subtle | `--color-background-subtle` | #1C1C1C | #FAFAFA | `background-subtle` |

### Text

| Token | CSS Variable | Dark Value | Light Value | Tailwind Class |
|---|---|---|---|---|
| text-primary | `--color-text-primary` | #F3F4F6 | #121828 | `text-primary` |
| text-secondary | `--color-text-secondary` | #9CA3AF | #65748B | `text-secondary` |
| text-tertiary | `--color-text-tertiary` | #6B7280 | #9CA3AF | `text-tertiary` |
| text-disabled | `--color-text-disabled` | rgba(255,255,255,0.38) | rgba(55,65,81,0.48) | `text-disabled` |
| text-inverse | `--color-text-inverse` | #111827 | #FFFFFF | `text-inverse` |
| text-link | `--color-text-link` | #828DF8 | #5048E5 | `text-link` |
| text-link-hover | `--color-text-link-hover` | #60A5FA | #3832A0 | `text-link-hover` |

### Border

| Token | CSS Variable | Dark Value | Light Value | Tailwind Class |
|---|---|---|---|---|
| border-default | `--color-border-default` | #1F1F1F | #E8E9EB | `border-border` (DEFAULT) |
| border-subtle | `--color-border-subtle` | #1C1C1C | #F3F4F6 | `border-border-subtle` |
| border-strong | `--color-border-strong` | #2C2C2C | #D1D5DB | `border-border-strong` |
| border-focus | `--color-border-focus` | #828DF8 | #5048E5 | `border-border-focus` |
| border-input | `--color-border-input` | #4B5563 | #D1D5DB | `border-border-input` |
| border-input-hover | `--color-border-input-hover` | #6B7280 | #9CA3AF | `border-border-input-hover` |
| border-input-focus | `--color-border-input-focus` | #828DF8 | #5048E5 | `border-border-input-focus` |
| border-input-error | `--color-border-input-error` | #EF4444 | #D14343 | `border-border-input-error` |

### Interactive States

| Token | CSS Variable | Dark Value | Light Value | Tailwind Class |
|---|---|---|---|---|
| interactive-hover | `--color-interactive-hover` | rgba(255,255,255,0.04) | rgba(55,65,81,0.04) | `interactive-hover` |
| interactive-focus | `--color-interactive-focus` | rgba(255,255,255,0.12) | rgba(55,65,81,0.12) | `interactive-focus` |
| interactive-active | `--color-interactive-active` | rgba(255,255,255,0.16) | rgba(55,65,81,0.16) | `interactive-active` |
| interactive-selected | `--color-interactive-selected` | rgba(255,255,255,0.08) | rgba(55,65,81,0.08) | `interactive-selected` |
| interactive-disabled | `--color-interactive-disabled` | rgba(255,255,255,0.12) | rgba(55,65,81,0.12) | `interactive-disabled` |
| interactive-disabled-text | `--color-interactive-disabled-text` | rgba(255,255,255,0.26) | rgba(55,65,81,0.26) | `interactive-disabled-text` |

### Misc

| Token | CSS Variable | Dark Value | Light Value | Tailwind Class |
|---|---|---|---|---|
| divider | `--color-divider` | #1F1F1F | #E8E9EB | `divider` |
| avatar-background | `--color-avatar-background` | #4B5563 | #6B7280 | `avatar-background` |
| avatar-text | `--color-avatar-text` | #FFFFFF | #FFFFFF | `avatar-text` |

### Data Visualization

| Token | CSS Variable | Value (both modes) | Tailwind Class |
|---|---|---|---|
| data-1 | `--color-data-1` | #1965B0 | `data-1` |
| data-2 | `--color-data-2` | #4EB265 | `data-2` |
| data-3 | `--color-data-3` | #F7F056 | `data-3` |
| data-4 | `--color-data-4` | #DC050C | `data-4` |
| data-5 | `--color-data-5` | #882E72 | `data-5` |
| data-6 | `--color-data-6` | #F4A736 | `data-6` |
| data-7 | `--color-data-7` | #7BAFDE | `data-7` |
| data-8 | `--color-data-8` | #90C987 | `data-8` |
| data-9 | `--color-data-9` | #CAACCB | `data-9` |
| data-10 | `--color-data-10` | #EE8026 | `data-10` |

### Velocity Zone Colors (NOT in Tailwind)

These are defined in the HTML prototype only. There are no Tailwind classes for them.
Use inline styles or import from `workout-tokens.ts`.

| HTML Demo Variable | Value | Tailwind Class |
|---|---|---|
| `--vel-green` | #2ed573 | NONE -- use inline style |
| `--vel-yellow` | #ffd43b | NONE -- use inline style |
| `--vel-orange` | #ffa502 | NONE -- use inline style |
| `--vel-red` | #ff4757 | NONE -- use inline style |

---

## Border Radius

| Token | Value | Tailwind Class | Notes |
|---|---|---|---|
| none | 0 | `rounded-none` | |
| sm | 4px | `rounded-sm` | This is 4px, NOT the standard Tailwind 2px |
| DEFAULT / md | 8px | `rounded` or `rounded-md` | For cards, inputs, containers |
| lg | 12px | `rounded-lg` | For modals, large cards |
| xl | 16px | `rounded-xl` | |
| 2xl | 24px | `rounded-2xl` | |
| full | 9999px | `rounded-full` | For pills, avatars, dots |

---

## Box Shadow / Glow

| Tailwind Class | Value |
|---|---|
| `shadow-sm` | 0px 1px 2px rgba(100,116,139,0.12) |
| `shadow` | 0px 1px 3px rgba(100,116,139,0.12), 0px 1px 2px rgba(100,116,139,0.24) |
| `shadow-md` | 0px 4px 6px rgba(100,116,139,0.12) |
| `shadow-lg` | 0px 10px 15px rgba(100,116,139,0.12) |
| `shadow-xl` | 0px 20px 25px rgba(100,116,139,0.12) |
| `shadow-glow-primary` | 0 0 20px 2px rgba(brand-primary-rgb, 0.4) |
| `shadow-glow-secondary` | 0 0 20px 2px rgba(brand-secondary-rgb, 0.4) |
| `shadow-glow-success` | 0 0 20px 2px rgba(status-success-rgb, 0.35) |
| `shadow-glow-error` | 0 0 20px 2px rgba(status-error-rgb, 0.4) |
| `shadow-glow-warning` | 0 0 20px 2px rgba(status-warning-rgb, 0.35) |
| `shadow-glow-info` | 0 0 20px 2px rgba(status-info-rgb, 0.35) |
| `shadow-glow-sm` | 0 0 12px 0px (needs color) |
| `shadow-glow-md` | 0 0 20px 2px (needs color) |
| `shadow-glow-lg` | 0 0 30px 4px (needs color) |

---

## Animation

| Tailwind Class | Keyframes | Duration / Easing |
|---|---|---|
| `animate-fade-in` | translateY(8px)->0, opacity 0->1 | 250ms ease-out |
| `animate-slide-down` | translateY(-8px)->0, opacity 0->1 | 250ms ease-out |
| `animate-slide-up` | translateY(100%)->0, opacity 0->1 | 400ms spring |
| `animate-scale-in` | scale(0.95)->1, opacity 0->1 | 200ms ease-out |
| `animate-shimmer` | backgroundPosition -200%->200% | 2s linear infinite |

### Transition Timing

| Tailwind Class | Value |
|---|---|
| `ease-out` | cubic-bezier(0.22, 1, 0.36, 1) |
| `ease-in-out` | cubic-bezier(0.65, 0, 0.35, 1) |
| `ease-spring` | cubic-bezier(0.34, 1.56, 0.64, 1) |
| `duration-fast` | 150ms |
| `duration-normal` | 250ms |
| `duration-slow` | 400ms |

---

## Known Pitfalls

### 1. Font class naming does not match HTML prototype naming

```
WRONG: className="font-ui"
  WHY: 'font-ui' does not exist in the Tailwind config
RIGHT: className="font-body" (resolves to Nunito Sans)

WRONG: className="font-body" expecting Inter
  WHY: In Tailwind, font-body = Nunito Sans. The HTML prototype's --font-body = Inter.
RIGHT: className="font-sans" (resolves to Inter)
```

Summary of the naming confusion:

| You want | HTML demo calls it | Tailwind class |
|---|---|---|
| Space Grotesk | `--font-heading` | `font-heading` |
| Nunito Sans | `--font-ui` | `font-body` |
| Inter | `--font-body` | `font-sans` |

### 2. `border` class adds black border color

```
WRONG: className="border border-border-default"
  WHY: The bare 'border' utility sets borderWidth:1 AND borderColor to currentColor
       (often black on web, or unexpected on native). The border-border-default class
       only sets the color, but the initial currentColor flash can appear.
RIGHT: className="border border-border" (border-border resolves to --color-border-default)
  OR for React Native: style={{ borderWidth: 1, borderColor: '#1F1F1F' }}
```

### 3. `rounded-sm` is 4px, not 2px

```
WRONG: className="rounded-sm" (expecting 2px for tiny badge radius)
  WHY: titan-design sets rounded-sm = 4px (standard Tailwind is 2px)
RIGHT: className="rounded-[2px]" or style={{ borderRadius: 2 }}
```

### 4. Velocity zone colors do not exist in Tailwind

```
WRONG: className="bg-vel-green" or className="bg-velocity-green"
  WHY: Velocity zone colors are not defined in the Tailwind config
RIGHT: style={{ backgroundColor: '#2ed573' }}
  OR: import { WORKOUT_TOKENS } from '@titan-design/react-ui/theme/workout-tokens'
      style={{ backgroundColor: WORKOUT_TOKENS.velocity.green }}
```

### 5. Using raw hex instead of CSS variable classes

```
WRONG: style={{ color: '#F3F4F6' }}
  WHY: Bypasses theme switching; will not change between light/dark mode
RIGHT: className="text-text-primary" (resolves to var(--color-text-primary))
```

Exception: Tokens that are NOT in the Tailwind config (velocity zones, specific workout
values) must use raw hex or import from workout-tokens.ts.

### 6. `bg-background` vs `bg-background-base`

```
WRONG: className="bg-background-base" expecting the default page background
  WHY: background-base (#101010 dark) is the darkest level, not the main page bg
RIGHT: className="bg-background" for the main page background (#161616 dark)
```

### 7. Confusing surface hierarchy

The surface elevation order from lowest to highest:

| Level | Tailwind Class | Dark Value |
|---|---|---|
| Page background | `bg-background` | #161616 |
| Base surface | `bg-surface-base` | #161616 |
| Elevated (cards) | `bg-surface-elevated` | #191919 |
| Raised (nested cards) | `bg-surface-raised` | #1C1C1C |

---

## Spacing

Standard Tailwind spacing scale is used. The config does not override it, so all
default Tailwind spacing utilities (p-1 = 4px, p-2 = 8px, etc.) work as expected.

Primitive spacing tokens in `primitives.ts` match the Tailwind defaults.

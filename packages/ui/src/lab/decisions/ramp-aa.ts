/**
 * TD-789 follow-up: what option 3's light ramp does to the roles that sit on it, and the
 * options for resolving it. Pure data and measurements; `RampAaView.tsx` paints them.
 *
 * Nothing here edits a token. Each option names its light planes and a re-colour set drawn
 * from existing primitives; `solveRecolours` finds the lightest existing step at or below each
 * role's current one that clears the role's floor on every plane the role appears on.
 */
import { silverRed } from '../../components/ui/charts/kit/silverRed'
import { compositeOver, contrast, relativeLuminance } from '../../theme/color-checks'
import { greyRamp, primitiveColors, primitiveRamps } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'

export type PlaneKey = 'background' | 'base' | 'elevated' | 'raised' | 'overlay'
export const PLANE_KEYS: PlaneKey[] = ['background', 'base', 'elevated', 'raised', 'overlay']

export const PLANE_ROLE: Record<PlaneKey, string> = {
  background: '-1 background-base: rail, wells',
  base: '0 surface-base: the page',
  elevated: '+1 surface-elevated',
  raised: '+2 surface-raised: Card',
  overlay: '+3 surface-overlay',
}

export type Group = 'Text' | 'Input' | 'Status marks' | 'BarList fill' | 'Hairline' | 'Shell accent'
type Kind = 'text' | 'mark' | 'fill' | 'hairline'

export interface Role {
  id: string
  group: Group
  kind: Kind
  /** WCAG ratio, or ΔL* for a hairline. */
  floor: number
  planes: PlaneKey[]
  /** Why the role cannot be re-coloured here. */
  pinned?: string
  /** A misuse fixed by painting another role instead of re-colouring a shared token. */
  repointTo?: string
  /** A BarList tone measured against the plane, not the track (BarList.test.tsx exception). */
  againstPlane?: boolean
}

const ALL = PLANE_KEYS
const RAIL: PlaneKey[] = ['background', 'elevated']
const text = (id: string, pinned?: string): Role => ({
  id,
  group: 'Text',
  kind: 'text',
  floor: 4.5,
  planes: ALL,
  pinned,
})
const mark = (id: string, group: Group, planes = ALL, pinned?: string): Role => ({
  id,
  group,
  kind: 'mark',
  floor: 3,
  planes,
  pinned,
})
const line = (id: string, floor: number): Role => ({
  id,
  group: 'Hairline',
  kind: 'hairline',
  floor,
  planes: ALL,
})
const fill = (id: string, againstPlane = false): Role => ({
  id,
  group: 'BarList fill',
  kind: 'fill',
  floor: 3,
  planes: ALL,
  againstPlane,
})

const BRAND_PIN = 'brand pin (orange 400): needs the owner'

/** Hairlines come first: the BarList track is hairline-default over the plane. */
export const ROLES: Role[] = [
  line('hairline-subtle', 7),
  line('hairline-default', 12),
  line('hairline-strong', 18),
  line('border-prominent', 12),
  text('text-primary'),
  text('text-tertiary'),
  text('text-secondary'),
  text('text-link'),
  text('text-success'),
  text('text-error'),
  text('text-brand-secondary'),
  { ...text('status-error'), id: 'status-error as text', repointTo: 'text-error' },
  mark('border-input', 'Input'),
  mark('border-input-hover', 'Input'),
  mark('brand-secondary', 'Status marks'),
  mark('status-success', 'Status marks'),
  mark('status-warning', 'Status marks'),
  mark('status-info', 'Status marks'),
  mark('status-error', 'Status marks'),
  mark('status-error-vivid', 'Status marks'),
  fill('bar neutral'),
  fill('bar near', true),
  fill('bar over'),
  mark('voltras: brand-primary', 'Shell accent', RAIL, BRAND_PIN),
  mark('active-work: dataviz-categorical-0', 'Shell accent', RAIL),
  mark('audiobook: dataviz-categorical-1', 'Shell accent', RAIL),
  mark('agents: dataviz-categorical-4', 'Shell accent', RAIL),
  mark('brain: dataviz-categorical-6', 'Shell accent', RAIL),
]

/** A role's colour in the tokens as #800 ships them (light is option 3), keyed by role id. */
export function roleColours(mode: ThemeMode): Record<string, string> {
  const c = getSemanticColors(mode) as Record<string, string>
  const bars = silverRed(mode)
  return Object.fromEntries(
    ROLES.map(({ id }) => {
      if (id === 'bar neutral') return [id, bars.neutral]
      if (id === 'bar near') return [id, bars.near]
      if (id === 'bar over') return [id, bars.over]
      const token = id.replace(/ as text$/, '').replace(/^[\w-]+: /, '')
      return [id, c[token]]
    })
  )
}

export type Planes = Record<PlaneKey, string> & { frame: string }
const g = greyRamp
const white = primitiveColors.white
const planes = (frame: string, ...rest: string[]): Planes => ({
  frame,
  background: rest[0],
  base: rest[1],
  elevated: rest[2],
  raised: rest[3],
  overlay: rest[4],
})

export type OptionKey = 'asPicked' | 'recoloured' | 'q5cInsets' | 'hybrid'

export interface AaOption {
  key: OptionKey
  title: string
  summary: string
  planes: Planes
  /** Whether the option carries its minimal re-colour set (option 1 shows the misses as they are). */
  recolours: boolean
  /**
   * Story-themes the CI contrast spec would fail. Option 1 is #800's CI run at 826c63f8. The
   * others re-measure each node of that report: its option-3 plane swapped for this option's
   * plane at the same level, its light ink swapped by the re-colour set, at 4.5:1. Nodes on
   * composited backgrounds keep their option-3 colour, so the others are upper bounds.
   * `reKeyOnly` counts story-themes whose new pairs are only an ink the baseline already lists
   * for that story on another plane: an existing miss that moved, not a new one.
   */
  storyThemes: { failing: number; reKeyOnly: number }
}

export const MONOTONIC = planes(g[400], g[300], g[200], g[100], g[50], white)

export const OPTIONS: AaOption[] = [
  {
    key: 'asPicked',
    title: '1 · Option 3 as picked, nothing re-coloured',
    summary:
      'The planes #800 ships: frame grey 400, background grey 300, page grey 200, elevated grey 100, raised grey 50, overlay white. Every role keeps today’s step.',
    planes: MONOTONIC,
    recolours: false,
    storyThemes: { failing: 499, reKeyOnly: 156 },
  },
  {
    key: 'recoloured',
    title: '2 · Option 3 plus the minimal re-colour set',
    summary:
      'Option 3’s planes, with each role moved to the lightest existing step that clears its floor on every plane it appears on. Text tiers stay distinct.',
    planes: MONOTONIC,
    recolours: true,
    storyThemes: { failing: 262, reKeyOnly: 176 },
  },
  {
    key: 'q5cInsets',
    title: '3 · Fall back to 3b: Q5 C with stepped insets',
    summary:
      'Frame grey 300, background grey 200, page grey 100, elevated grey 50, raised and overlay white (the lift separates them). Its own minimal re-colour set.',
    planes: planes(g[300], g[200], g[100], g[50], white, white),
    recolours: true,
    storyThemes: { failing: 235, reKeyOnly: 155 },
  },
  {
    key: 'hybrid',
    title: '4 · Hybrid: today’s darkest content plane, monotonic',
    summary:
      'Frame grey 200, background grey 100 (today’s), page grey 50, elevated, raised and overlay white (the lift separates them). Differs from 3b: page grey 50 not grey 100, wells grey 100 not grey 200, so no plane that carries text is darker than today’s; the cost is three levels sharing white. (Page grey 100, elevated grey 50, raised and overlay white, insets 200/300 is 3b level for level.) Its own minimal re-colour set.',
    planes: planes(g[200], g[100], g[50], white, white, white),
    recolours: true,
    storyThemes: { failing: 226, reKeyOnly: 162 },
  },
]

export const DARK_PLANES = planes(g[975], g[950], g[925], g[900], g[875], g[850])

/** Light on main before #800: a role that misses here too is an existing debt, not this ramp's. */
export const MAIN_LIGHT = planes(g[400], g[100], white, g[50], g[100], white)

export function missesOnMain(role: Role): boolean {
  const colours = roleColours('light')
  return readRole(role, colours[role.id], MAIN_LIGHT, colours).some((r) => !r.passes)
}

/** Light ink for labels and the miss mark; both clear 4.5:1 on every light plane above. */
export const INK: Record<ThemeMode, { label: string; miss: string }> = {
  light: { label: getSemanticColors('light')['text-primary'], miss: primitiveRamps.red[800] },
  dark: { label: getSemanticColors('dark')['text-primary'], miss: primitiveRamps.red[300] },
}

// CIE L*, as surface.contract.test.ts measures the hairline floors.
const lstar = (hex: string) => {
  const y = relativeLuminance(hex)
  return y <= 0.008856 ? y * 903.3 : 116 * Math.cbrt(y) - 16
}

/** A role's reading on one plane: WCAG ratio, or ΔL* for a hairline. */
export function measureOn(role: Role, colour: string, plane: string, track: string): number {
  if (role.kind === 'hairline') return Math.abs(lstar(compositeOver(colour, plane)) - lstar(plane))
  if (role.kind === 'fill' && !role.againstPlane)
    return contrast(colour, compositeOver(track, plane))
  return contrast(colour, plane)
}

const RAMPS: Record<string, Record<string, string>> = { grey: greyRamp, ...primitiveRamps }

function findStep(hex: string): { hue: string; step: string } | undefined {
  for (const [hue, ramp] of Object.entries(RAMPS)) {
    const hit = Object.entries(ramp).find(([, v]) => v.toUpperCase() === hex.toUpperCase())
    if (hit) return { hue, step: hit[0] }
  }
  return undefined
}

const BLACK_ALPHA = /^rgba\(0, 0, 0, ([\d.]+)\)$/
const ALPHA = /^rgba\((0|255), \1, \1, ([\d.]+)\)$/

/** A colour by ramp step ("grey 600", "black 15%", "white"), or "pin" with its value. */
export function stepName(value: string): string {
  if (value.toUpperCase() === white) return 'white'
  const alpha = ALPHA.exec(value)
  if (alpha) return `${alpha[1] === '0' ? 'black' : 'white'} ${Math.round(Number(alpha[2]) * 100)}%`
  const step = findStep(value)
  return step ? `${step.hue} ${step.step}` : `pin ${value.toUpperCase()}`
}

/** Darker candidates for a colour: later steps of its ramp, or heavier black alphas. */
function darkerCandidates(value: string): string[] {
  const alpha = BLACK_ALPHA.exec(value)
  if (alpha) {
    const from = Math.round(Number(alpha[1]) * 100)
    return Array.from({ length: 40 - from }, (_, i) => `rgba(0, 0, 0, ${(from + i + 1) / 100})`)
  }
  const step = findStep(value)
  const ramp = step ? RAMPS[step.hue] : primitiveRamps.red
  const floor = contrast(value, white)
  return Object.values(ramp).filter((hex) => contrast(hex, white) > floor)
}

/** Tiers that must stay ordered: [lighter, darker]. */
const TIERS: [string, string][] = [
  ['text-tertiary', 'text-secondary'],
  ['border-input', 'border-input-hover'],
]

export interface Reading {
  plane: PlaneKey
  value: number
  passes: boolean
}

export function readRole(
  role: Role,
  colour: string,
  on: Planes,
  colours: Record<string, string>
): Reading[] {
  return role.planes.map((plane) => {
    const value = measureOn(role, colour, on[plane], colours['hairline-default'])
    return { plane, value, passes: value >= role.floor }
  })
}

const clears = (role: Role, colour: string, on: Planes, colours: Record<string, string>) =>
  readRole(role, colour, on, colours).every((r) => r.passes)

/** The re-coloured value of every role that needs one, keyed by role id. */
export function solveRecolours(on: Planes): Record<string, string> {
  const colours = roleColours('light')
  const changed: Record<string, string> = {}
  for (const role of ROLES) {
    if (role.pinned || clears(role, colours[role.id], on, colours)) continue
    if (role.repointTo) {
      colours[role.id] = changed[role.id] = colours[role.repointTo]
      continue
    }
    const next = darkerCandidates(colours[role.id]).find((c) => clears(role, c, on, colours))
    if (next) colours[role.id] = changed[role.id] = next
  }
  for (const [lighter, darker] of TIERS) {
    if (contrast(colours[darker], white) > contrast(colours[lighter], white)) continue
    const next = darkerCandidates(colours[lighter])[0]
    if (next) colours[darker] = changed[darker] = next
  }
  return changed
}

/** The colours an option paints: today's light roles, plus its re-colour set. */
export function optionColours(option: AaOption): Record<string, string> {
  return { ...roleColours('light'), ...(option.recolours ? solveRecolours(option.planes) : {}) }
}

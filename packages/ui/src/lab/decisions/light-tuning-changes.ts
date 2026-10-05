import { greyRamp, primitiveRamps } from '../../theme/tokens/primitives'
import {
  TONE_TEXT_700,
  alertSolidFill,
  baseSet,
  chipLabelFix,
  chipRecipe,
  measure,
  overriddenTokens,
  resolveToken,
  type TokenSet,
} from './light-tuning'

/**
 * TD-487 "What changes": every light override of a set, described against the ramps.
 *
 * Rows come from `overriddenTokens` and `resolveToken`, and ramp steps are found by matching
 * the hex against the ramps, so the table cannot drift from the overrides it describes.
 */

const RAMPS: Record<string, Record<string, string>> = { grey: greyRamp, ...primitiveRamps }

interface RampStep {
  hue: string
  step: number
}

type Described =
  | { kind: 'ramp'; ramp: RampStep }
  | { kind: 'tint'; ramp: RampStep; alpha: number }
  | { kind: 'black'; alpha: number }
  | { kind: 'off-ramp'; value: string }

function findStep(hex: string): RampStep | undefined {
  const target = hex.toUpperCase()
  for (const [hue, ramp] of Object.entries(RAMPS)) {
    const hit = Object.entries(ramp).find(([, value]) => value.toUpperCase() === target)
    if (hit) return { hue, step: Number(hit[0]) }
  }
  return undefined
}

function toHex(channels: number[]): string {
  return `#${channels.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

function describe(value: string): Described {
  const match = /rgba\(([^)]+)\)/.exec(value)
  if (!match) {
    const ramp = findStep(value)
    return ramp ? { kind: 'ramp', ramp } : { kind: 'off-ramp', value }
  }
  const [r, g, b, alpha] = match[1].split(',').map((part) => parseFloat(part))
  if (r === 0 && g === 0 && b === 0) return { kind: 'black', alpha }
  const ramp = findStep(toHex([r, g, b]))
  return ramp ? { kind: 'tint', ramp, alpha } : { kind: 'off-ramp', value }
}

const stepName = ({ hue, step }: RampStep) => `${hue}[${step}]`

const WHITE = '#FFFFFF'

/**
 * The existing ramp step darker than `fill` that gives a label the most contrast on it, for
 * fills where a white label falls short (TD-666). Measured, so it moves with the ramps.
 */
export function bestDarkLabel(fill: string): { hex: string; ratio: number } {
  const onFill = (hex: string) => contrastOn(hex, fill)
  const darker = Object.values(RAMPS)
    .flatMap((ramp) => Object.values(ramp))
    .filter((hex) => contrastOn(hex, WHITE) > contrastOn(fill, WHITE))
  const hex = darker.reduce((best, next) => (onFill(next) > onFill(best) ? next : best))
  return { hex, ratio: onFill(hex) }
}

/** WCAG contrast of an opaque label on an opaque fill. */
export function contrastOn(label: string, fill: string): number {
  const pair = { label: '', fg: { raw: label }, bg: { raw: fill }, plane: 'surface-base', floor: 0 }
  return measure(pair, 'main', 'light').value
}

/** A colour named by its ramp step, alpha, or as off-ramp. */
export function rampName(value: string): string {
  return formatValue(describe(value))
}

export function formatValue(d: Described): string {
  if (d.kind === 'ramp') return stepName(d.ramp)
  if (d.kind === 'tint') return `${stepName(d.ramp)} @ ${d.alpha}`
  if (d.kind === 'black') return `black @ ${d.alpha}`
  return `off-ramp ${d.value}`
}

function changeWords(before: Described, after: Described): string {
  if (before.kind === 'ramp' && after.kind === 'ramp' && before.ramp.hue === after.ramp.hue) {
    const tone = after.ramp.step > before.ramp.step ? 'darker' : 'lighter'
    return `${before.ramp.hue} ${before.ramp.step} -> ${after.ramp.step}, ${tone}`
  }
  if (before.kind === 'black' && after.kind === 'black') {
    const tone = after.alpha > before.alpha ? 'stronger' : 'weaker'
    return `black ${before.alpha} -> ${after.alpha}, ${tone}`
  }
  if (before.kind === 'tint' && after.kind === 'ramp') {
    return `${before.ramp.hue} alpha ${before.alpha} -> solid ${stepName(after.ramp)}`
  }
  if (before.kind === 'off-ramp') return `off-ramp -> ${formatValue(after)} snap`
  return `${formatValue(before)} -> ${formatValue(after)}`
}

const TASK_OF: Record<string, string> = {
  'border-input': 'TD-488 outlines',
  'border-input-hover': 'TD-488 outlines',
  'hairline-subtle': 'TD-489 separators',
  'hairline-default': 'TD-489 separators',
  'hairline-strong': 'TD-489 separators',
  divider: 'TD-489 separators',
  'status-success': 'TD-490 tone marks',
  'status-info': 'TD-490 tone marks',
  'status-warning': 'TD-490 tone marks',
  'background-base': 'TD-491 snaps and link',
  'on-control-idle': 'TD-491 snaps and link',
  'text-link': 'TD-491 snaps and link',
  'brand-primary-subtle': 'TD-491 snaps and link',
  'brand-primary-muted': 'TD-491 snaps and link',
  'brand-secondary-subtle': 'TD-491 snaps and link',
  'brand-secondary-muted': 'TD-491 snaps and link',
  'brand-primary': 'Brand',
}

function taskFor(token: string, base: TokenSet): string {
  if (base === 'accepted') return token.includes('subtle') ? 'TD-624 subtle set' : 'TD-624 solids'
  return TASK_OF[token] ?? 'Other'
}

export interface ChangeRow {
  token: string
  main: string
  proposed: string
  change: string
}

export interface ChangeGroup {
  task: string
  rows: ChangeRow[]
}

/** The light overrides of a set that differ from its base, grouped by the proposing task. */
export function changeGroups(set: TokenSet): ChangeGroup[] {
  const base = baseSet(set)
  const groups = new Map<string, ChangeRow[]>()
  for (const token of overriddenTokens(set, 'light')) {
    const was = resolveToken(base, 'light', token)
    const now = resolveToken(set, 'light', token)
    if (was === now) continue
    const before = describe(was)
    const after = describe(now)
    const task = taskFor(token, base)
    const row = {
      token,
      main: formatValue(before),
      proposed: formatValue(after),
      change: changeWords(before, after),
    }
    groups.set(task, [...(groups.get(task) ?? []), row])
  }
  return [...groups].map(([task, rows]) => ({ task, rows }))
}

/** The set's lab-only component recipes, named from the values that paint them. */
export function simulationLine(set: TokenSet): string {
  const name = (hex: string) => formatValue(describe(hex))
  const toneText = Object.entries(TONE_TEXT_700)
    .map(([tone, hex]) => `${tone} ${name(hex)}`)
    .join(', ')
  const fix = chipLabelFix(set)
  const chipLabel = fix ? `; unselected Chip label ${name(fix)}` : ''
  const alert = alertSolidFill(set, 'warning')
  const alertLine = alert ? `; warning solid Alert reads the *-solid fill ${name(alert)}` : ''
  return (
    'Simulated in the lab (component recipes, not token changes): neutral Progress track ' +
    `(hairline-default); selected Chip: ${chipRecipe(set)?.name ?? 'today'}${chipLabel}${alertLine}; ` +
    `tone as text at the 700 step (${toneText}).`
  )
}

/** "No new colour" only if every proposed and simulated value is a ramp hex or a black alpha. */
export function introducedLine(set: TokenSet): string {
  const chip = chipRecipe(set)
  const fix = chipLabelFix(set)
  const values = [
    ...overriddenTokens(set, 'light').map((t) => resolveToken(set, 'light', t)),
    ...[chip?.solidFill, chip?.border, chip?.label, fix].filter((v) => v !== undefined),
    ...Object.values(TONE_TEXT_700),
  ]
  const outside = values
    .map(describe)
    .filter((d) => d.kind === 'off-ramp' || d.kind === 'tint')
    .map(formatValue)
  if (outside.length === 0) {
    return 'New ramps: none. Off-ramp values introduced: none. Every proposed colour is an existing ramp step or a black alpha.'
  }
  return `New ramps: none. Values that are not a ramp step or a black alpha: ${outside.join(', ')}.`
}

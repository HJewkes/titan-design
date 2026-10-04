import {
  SELECTED_CHIP,
  TONE_TEXT_700,
  measure,
  type Mode,
  type Pair,
  type TokenSet,
} from './light-tuning'

/** The tones the Representative panel shows; error has no proposal and stays as the control. */
export const TONES = ['brand', 'success', 'info', 'warning', 'error'] as const
export type Tone = (typeof TONES)[number]

const CARD = 'surface-base'
const PAGE = 'background-base'

interface ToneTokens {
  base: string
  solid: string
  onSolid: string
  subtle: string
  onSubtle: string
  muted: string
}

export function toneTokens(tone: Tone): ToneTokens {
  if (tone === 'brand') {
    return {
      base: 'brand-primary',
      solid: 'brand-primary-solid',
      onSolid: 'on-brand-primary',
      subtle: 'brand-primary-subtle',
      onSubtle: 'on-brand-primary-subtle',
      muted: 'brand-primary-muted',
    }
  }
  const s = `status-${tone}`
  return {
    base: s,
    solid: `${s}-solid`,
    onSolid: `on-${s}`,
    subtle: `${s}-subtle`,
    onSubtle: `on-${s}-subtle`,
    muted: `${s}-muted`,
  }
}

function tonePairs(tone: Tone): Record<string, Pair> {
  const t = toneTokens(tone)
  const toneText = tone === 'error' ? 'text-error' : { raw: TONE_TEXT_700[tone] }
  return {
    [`pill-solid-${tone}`]: {
      label: `${tone} solid label`,
      fg: t.onSolid,
      bg: t.solid,
      plane: CARD,
      floor: 4.5,
    },
    [`pill-subtle-${tone}`]: {
      label: `${tone} subtle label`,
      fg: t.onSubtle,
      bg: t.subtle,
      plane: CARD,
      floor: 4.5,
    },
    [`pill-outline-${tone}`]: {
      label: `${tone} outline label`,
      fg: t.base,
      plane: CARD,
      floor: 4.5,
    },
    [`dot-${tone}`]: { label: `${tone} dot`, fg: t.base, plane: CARD, floor: 3 },
    [`alert-icon-${tone}`]: {
      label: `${tone} alert icon`,
      fg: t.base,
      bg: t.subtle,
      plane: CARD,
      floor: 3,
    },
    [`alert-solid-${tone}`]: {
      label: `${tone} alert solid label`,
      fg: t.onSolid,
      bg: t.base,
      plane: CARD,
      floor: 4.5,
    },
    [`tone-text-${tone}`]: {
      label: `${tone} as text`,
      fg: tone === 'error' ? 'text-error' : t.base,
      proposedFg: tone === 'error' ? undefined : toneText,
      plane: CARD,
      floor: 4.5,
    },
  }
}

const CONTROL_PAIRS: Record<string, Pair> = {
  link: { label: 'link on page', fg: 'text-link', plane: PAGE, floor: 4.5 },
  'link-brand': { label: 'brand link on page', fg: 'brand-primary', plane: PAGE, floor: 4.5 },
  'header-rule': {
    label: 'header rule',
    fg: 'border-prominent',
    plane: PAGE,
    floor: 18,
    metric: 'deltaL',
  },
  'page-text': { label: 'body text on page', fg: 'text-primary', plane: PAGE, floor: 4.5 },
  'input-outline': { label: 'input outline', fg: 'border-input', plane: CARD, floor: 3 },
  'input-hover': { label: 'input hover outline', fg: 'border-input-hover', plane: CARD, floor: 3 },
  'input-filled': { label: 'filled input fill', fg: 'surface-input', plane: CARD, floor: 3 },
  'control-on': { label: 'checked fill / switch on', fg: 'brand-primary', plane: CARD, floor: 3 },
  'checkbox-off': {
    label: 'checkbox unchecked edge',
    fg: 'hairline-default',
    plane: CARD,
    floor: 3,
  },
  'radio-off': {
    label: 'radio edge / switch off track',
    fg: 'hairline-strong',
    plane: CARD,
    floor: 3,
  },
  'chip-selected-label': {
    label: 'selected chip label',
    fg: 'on-brand-primary',
    bg: 'brand-primary-solid',
    proposedFg: { raw: SELECTED_CHIP.label },
    proposedBg: 'brand-primary-subtle',
    plane: CARD,
    floor: 4.5,
  },
  'chip-selected-edge': {
    label: 'selected chip edge',
    fg: 'brand-primary-solid',
    proposedFg: { raw: SELECTED_CHIP.border },
    plane: CARD,
    floor: 3,
  },
  'chip-label': {
    label: 'chip label',
    fg: 'text-secondary',
    bg: 'hairline-subtle',
    plane: CARD,
    floor: 4.5,
  },
  'progress-fill': {
    label: 'progress fill on track',
    fg: 'status-success',
    bg: 'status-success-muted',
    proposedBg: 'hairline-default',
    plane: CARD,
    floor: 3,
  },
  'progress-track': {
    label: 'progress track on card',
    fg: 'status-success-muted',
    proposedFg: 'hairline-default',
    plane: CARD,
    floor: 3,
  },
  'progress-brand-fill': {
    label: 'brand progress fill on track',
    fg: 'brand-primary',
    bg: 'brand-primary-muted',
    proposedBg: 'hairline-default',
    plane: CARD,
    floor: 3,
  },
  divider: {
    label: 'divider / list separator',
    fg: 'divider',
    plane: CARD,
    floor: 12,
    metric: 'deltaL',
  },
}

export const PAIRS: Record<string, Pair> = Object.assign(
  {},
  CONTROL_PAIRS,
  ...TONES.map((tone) => tonePairs(tone))
)

/** Every pair the Representative panel prints, in page order. */
export const REPRESENTATIVE_PAIR_IDS: string[] = [
  'page-text',
  'link',
  'link-brand',
  'header-rule',
  'input-outline',
  'input-hover',
  'input-filled',
  'control-on',
  'checkbox-off',
  'radio-off',
  ...TONES.flatMap((t) => [`pill-solid-${t}`, `pill-subtle-${t}`, `pill-outline-${t}`]),
  ...TONES.filter((t) => t !== 'brand').flatMap((t) => [`alert-icon-${t}`, `alert-solid-${t}`]),
  ...TONES.map((t) => `dot-${t}`),
  'progress-fill',
  'progress-brand-fill',
  'progress-track',
  'chip-selected-label',
  'chip-selected-edge',
  'chip-label',
  'divider',
  ...TONES.map((t) => `tone-text-${t}`),
]

export interface Miss {
  id: string
  label: string
  text: string
}

/** Pairs below their floor under a set, measured, never typed. */
export function misses(ids: string[], set: TokenSet, mode: Mode): Miss[] {
  return ids.flatMap((id) => {
    const pair = PAIRS[id]
    const m = measure(pair, set, mode)
    if (m.passes) return []
    const prefix = pair.metric === 'deltaL' ? 'ΔL* ' : ''
    const digits = pair.metric === 'deltaL' ? 1 : 2
    return [{ id, label: pair.label, text: `${prefix}${m.value.toFixed(digits)} / ${pair.floor}` }]
  })
}

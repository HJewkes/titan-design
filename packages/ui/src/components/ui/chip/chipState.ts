import type { PillTone } from '../pill'

/** Whether a requirement holds. Only the two states a beat has used so far; more join when one does. */
export const CHIP_STATES = ['met', 'unmet'] as const

/** One of the states in {@link CHIP_STATES}. */
export type ChipState = (typeof CHIP_STATES)[number]

export const STATE_TONE: Record<ChipState, PillTone> = {
  met: 'success',
  unmet: 'neutral',
}

/** Lowercase on purpose: `titan/no-raw-caps` bans `uppercase` on a label. */
export const STATE_LABEL: Record<ChipState, string> = {
  met: 'met',
  unmet: 'unmet',
}

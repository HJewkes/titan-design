// Pure layout and entry for ChipBand: every value is a function of its inputs, so a
// video frame renders the same whether it is played to or seeked to.
import { elideSource, type ElidedSource } from '../../../utils/elideSource'
import { MOTION } from '../motion/tokens'
import { pillScale } from '../pill/pillScale'
import type { EvidenceKind } from './evidence'

/** One citation in a band. */
export interface BandChip {
  kind: EvidenceKind
  text: string
}

/** The smallest legible chip text on a 1080 px frame. */
const FLOOR_PX_AT_1080 = 40
// JetBrains Mono's fixed advance, measured at 40 px in Chromium: 0.600 em, with headroom.
const MONO_ADVANCE_EM = 0.602
// Space Grotesk semibold has no fixed advance; an average misjudged these labels by up
// to 25 %, so each width is measured once at 40 px in Chromium and rounded up.
const KIND_LABEL_EM: Record<EvidenceKind, number> = {
  verified: 3.65,
  measured: 4.75,
  computed: 5.0,
  'docs-claim': 5.2,
  estimated: 4.85,
  target: 3.05,
  'our-framing': 5.65,
  reconstructed: 7.05,
  illustrative: 5.1,
}
// Digits and `+` in the label face, per character, with headroom.
const COUNTER_EM_PER_CHAR = 0.65

/** The chip font size for a frame: 40 px per 1080 px of height, never per width. */
export function videoFontPx(frameHeight: number): number {
  return (FLOOR_PX_AT_1080 * frameHeight) / 1080
}

export interface ChipBandLayout {
  fontPx: number
  /** The one chip shown with its citation. */
  lead: BandChip
  /** The lead citation's character budget at the fixed mono advance. */
  leadMaxChars: number
  leadElision: ElidedSource
  /** Chips shown as their kind capsule only. */
  tabs: BandChip[]
  /** Chips folded into the trailing `+d` count. */
  dropped: BandChip[]
  /** Estimated width of the laid-out band at the fixed advances. */
  usedWidth: number
  fits: boolean
}

export interface ChipBandLayoutOptions {
  width: number
  frameHeight?: number
  fontPx?: number
  /** Most chips shown, counting the lead and its tabs. */
  max?: number
}

function capsuleWidth(labelEm: number, fontPx: number): number {
  return labelEm * fontPx + 2 * pillScale(fontPx).paddingHorizontal
}

/** Gap between band items: twice the capsule-to-citation gap, so each chip reads as one unit. */
export const bandGap = (fontPx: number) => 2 * pillScale(fontPx).besideGap

function railWidth(tabs: BandChip[], droppedCount: number, fontPx: number): number {
  const labelEms = tabs.map((tab) => KIND_LABEL_EM[tab.kind])
  if (droppedCount > 0) labelEms.push(`+${droppedCount}`.length * COUNTER_EM_PER_CHAR)
  return labelEms.reduce((sum, em) => sum + bandGap(fontPx) + capsuleWidth(em, fontPx), 0)
}

function fitLead(
  lead: BandChip,
  tabs: BandChip[],
  dropped: BandChip[],
  width: number,
  fontPx: number
) {
  const rail = railWidth(tabs, dropped.length, fontPx)
  const chrome = capsuleWidth(KIND_LABEL_EM[lead.kind], fontPx) + pillScale(fontPx).besideGap
  const advance = MONO_ADVANCE_EM * fontPx
  const leadMaxChars = Math.max(0, Math.floor((width - rail - chrome) / advance))
  const leadElision = elideSource(lead.text, leadMaxChars)
  const usedWidth = chrome + leadElision.text.length * advance + rail
  const fits = leadElision.fits
  return { fontPx, lead, leadMaxChars, leadElision, tabs, dropped, usedWidth, fits }
}

/**
 * Lays out one lead chip with its citation, the next chips as kind tabs and the
 * rest as a `+d` count, on one line. When the lead's citation cannot fit, the
 * last tab folds into the count until it does.
 */
export function layoutChipBand(chips: BandChip[], options: ChipBandLayoutOptions): ChipBandLayout {
  const { width, frameHeight = 1080, max = 3 } = options
  const floor = videoFontPx(frameHeight)
  const fontPx = options.fontPx ?? floor
  if (fontPx < floor) {
    throw new RangeError(
      `ChipBand: ${fontPx}px is under the ${floor}px floor for a ${frameHeight}px frame`
    )
  }
  if (chips.length === 0) throw new RangeError('ChipBand: needs at least one chip')
  const [lead, ...rest] = chips
  const tabs = rest.slice(0, Math.max(0, max - 1))
  const dropped = rest.slice(tabs.length)
  for (;;) {
    const layout = fitLead(lead, tabs, dropped, width, fontPx)
    if (layout.fits || tabs.length === 0) return layout
    dropped.unshift(tabs.pop() as BandChip)
  }
}

/** How far a chip rises on entry: the video rise token, scaled to the frame. */
export function entryRisePx(frameHeight: number): number {
  return (MOTION.video.rise * frameHeight) / 1080
}

export interface ChipEntry {
  opacity: number
  translateY: number
}

export interface ChipEntryOptions {
  frameHeight?: number
  /** `fade` drops the rise. */
  entry?: 'rise' | 'fade'
  reducedMotion?: boolean
}

/** Item `index` of `count` at `progressS` seconds after the band's cue. */
export function chipEntry(
  index: number,
  count: number,
  progressS: number,
  { frameHeight = 1080, entry = 'rise', reducedMotion = false }: ChipEntryOptions = {}
): ChipEntry {
  if (reducedMotion) return { opacity: 1, translateY: 0 }
  const start = index * MOTION.staggerEachS(count)
  const raw = (progressS - start) / MOTION.video.emphasis
  const eased = MOTION.ease.out(Math.min(1, Math.max(0, raw)))
  const rise = entry === 'rise' ? entryRisePx(frameHeight) : 0
  return { opacity: eased, translateY: (1 - eased) * rise }
}

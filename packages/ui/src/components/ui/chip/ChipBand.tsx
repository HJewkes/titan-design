import type { ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { ScaledPill } from '../pill/ScaledPill'
import { EvidenceChip, EvidenceKindCapsule } from './EvidenceChip'
import { EVIDENCE_LABEL } from './evidence'
import {
  bandGap,
  chipEntry,
  layoutChipBand,
  type BandChip,
  type ChipBandLayout,
  type ChipEntryOptions,
} from './chipBandLayout'

export interface ChipBandProps extends Omit<ViewProps, 'children'> {
  /** The beat's citations, lead first. */
  chips: BandChip[]
  /** Band width in px. The band never positions itself; the consumer places it. */
  width: number
  /** Seconds since the band's cue. Entry is a pure function of it, so seeking equals playing. */
  progress: number
  /** Frame height in px; the chip font is 40 px per 1080. Default 1080. */
  frameHeight?: number
  /** Most chips shown, counting the lead. Default 3. */
  max?: number
  /** `rise` fades in and rises; `fade` only fades. Default `rise`. */
  entry?: ChipEntryOptions['entry']
  /** Show the end state at any `progress`. Defaults to the OS preference. */
  reducedMotion?: boolean
  className?: string
}

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }
const isDev = () => typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'

function droppedLabel(dropped: BandChip[]): string {
  return `${dropped.length} more: ${dropped.map((chip) => EVIDENCE_LABEL[chip.kind]).join(', ')}`
}

const citationLabel = (chip: BandChip) => `${EVIDENCE_LABEL[chip.kind]}: ${chip.text}`

// Each item's accessible name carries the full citation, whatever the band shows of it.
function bandItems({ fontPx, lead, leadElision, tabs, dropped }: ChipBandLayout) {
  const items: { label: string; node: ReactNode }[] = [
    {
      label: citationLabel(lead),
      node: (
        <EvidenceChip
          kind={lead.kind}
          text={leadElision.text}
          fontPx={fontPx}
          accessibilityElementsHidden
        />
      ),
    },
    ...tabs.map((tab) => ({
      label: citationLabel(tab),
      node: <EvidenceKindCapsule kind={tab.kind} fontPx={fontPx} />,
    })),
  ]
  if (dropped.length > 0) {
    const node = <ScaledPill tone="neutral" label={`+${dropped.length}`} fontPx={fontPx} />
    items.push({ label: droppedLabel(dropped), node })
  }
  return items
}

/**
 * ChipBand — one beat's citations on a single line at video scale: the lead
 * chip with its citation, the next chips as kind tabs, the rest as a `+d`
 * count. Entry is a 60 ms stagger capped at half a second, driven by
 * `progress` alone.
 *
 * @example
 * <ChipBand chips={beat.chips} width={1800} progress={t - cueS} />
 */
export function ChipBand({
  chips,
  width,
  progress,
  frameHeight = 1080,
  max = 3,
  entry,
  reducedMotion,
  className,
  style,
  ...props
}: ChipBandProps) {
  const prefersReduced = usePrefersReducedMotion()
  const layout = layoutChipBand(chips, { width, frameHeight, max })
  if (!layout.fits && isDev()) {
    throw new RangeError(
      `ChipBand: "${layout.lead.text}" cannot fit ${width}px at ${layout.fontPx}px`
    )
  }
  const items = bandItems(layout)
  const motion = { frameHeight, entry, reducedMotion: reducedMotion ?? prefersReduced }
  return (
    <View
      role="list"
      className={cn('flex-row flex-nowrap items-center overflow-hidden', className)}
      style={[{ width, gap: bandGap(layout.fontPx) }, style]}
      {...props}
    >
      {items.map((item, i) => {
        const { opacity, translateY } = chipEntry(i, items.length, progress, motion)
        return (
          <View
            key={i}
            role="listitem"
            accessibilityLabel={item.label}
            className="shrink-0"
            style={{ opacity, transform: [{ translateY }] }}
          >
            {item.node}
          </View>
        )
      })}
    </View>
  )
}

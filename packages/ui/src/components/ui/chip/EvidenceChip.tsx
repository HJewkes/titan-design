import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { elideSource } from '../../../utils/elideSource'
import { Pill } from '../pill'
import { pillScale } from '../pill/pillScale'
import { Typography } from '../typography'
import { EVIDENCE_LABEL, EVIDENCE_TONE, type EvidenceKind } from './evidence'

/** App sizes, one per Pill rung. */
export type EvidenceChipSize = 'sm' | 'md' | 'lg'

/** Props for {@link EvidenceChip}. */
export interface EvidenceChipProps extends Omit<ViewProps, 'children'> {
  /** What kind of evidence backs the on-screen fact; picks the capsule's tone and label. */
  kind: EvidenceKind
  /** The citation: refs joined by `"; "`, e.g. `ab@1a2b3c4:src/core/loop.ts:12-30`. */
  text: string
  /** App size, one Pill rung. Ignored when `fontPx` is set. */
  size?: EvidenceChipSize
  /** Video size in px, for frames with no Tailwind rung (`40 × frameHeight / 1080`). */
  fontPx?: number
  /** Character budget for `text`. Over it, the middle is elided and the pin and `path:L` stay whole. */
  maxChars?: number
  /** Additional className on the row. */
  className?: string
}

const sourceSize: Record<EvidenceChipSize, string> = {
  sm: 'text-2xs',
  md: 'text-xs',
  lg: 'text-sm',
}

const besideGap: Record<EvidenceChipSize, string> = {
  sm: 'gap-inline-sm',
  md: 'gap-inline-sm',
  lg: 'gap-inline-md',
}

function KindCapsule({ kind, size, fontPx }: Pick<EvidenceChipProps, 'kind' | 'size' | 'fontPx'>) {
  const label = EVIDENCE_LABEL[kind]
  if (fontPx === undefined) {
    return (
      <Pill tone={EVIDENCE_TONE[kind]} size={size} testID="evidence-chip-kind">
        {label}
      </Pill>
    )
  }
  const { fontSize, paddingHorizontal, paddingVertical } = pillScale(fontPx)
  return (
    <Pill
      tone={EVIDENCE_TONE[kind]}
      size="lg"
      style={{ paddingHorizontal, paddingVertical }}
      testID="evidence-chip-kind"
    >
      <Text className="font-heading font-semibold text-inherit" style={{ fontSize }}>
        {label}
      </Text>
    </Pill>
  )
}

/**
 * EvidenceChip — a `Pill` preset that cites the source behind an on-screen
 * fact: a tone capsule naming the evidence kind, then the citation in mono.
 * Colour stays on the kind; the label names it too, so colour is never the
 * only signal. The accessible name always carries the full, unelided citation.
 *
 * @example
 * <EvidenceChip kind="verified" text="ab@1a2b3c4:src/core/loop.ts:12-30" />
 * <EvidenceChip kind="docs-claim" text={citation} fontPx={40} maxChars={60} />
 */
export function EvidenceChip({
  kind,
  text,
  size = 'md',
  fontPx,
  maxChars,
  className,
  style,
  ...props
}: EvidenceChipProps) {
  const shown = maxChars === undefined ? text : elideSource(text, maxChars).text
  const video = fontPx === undefined ? undefined : pillScale(fontPx)
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel={`${EVIDENCE_LABEL[kind]}: ${text}`}
      className={cn(
        'flex-row items-center self-start shrink-0',
        !video && besideGap[size],
        className
      )}
      style={[video ? { gap: video.besideGap } : undefined, style]}
      {...props}
    >
      <KindCapsule kind={kind} size={size} fontPx={fontPx} />
      <Typography
        variant="mono"
        color="secondary"
        numberOfLines={1}
        className={cn(!video && sourceSize[size])}
        style={video ? { fontSize: video.fontSize } : undefined}
        testID="evidence-chip-source"
      >
        {shown}
      </Typography>
    </View>
  )
}

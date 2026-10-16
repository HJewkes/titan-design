// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * FatigueLights — the three "why" status dots (VEL · ROM · TEMPO) that stand behind
 * the verdict word: the supporting reason the verdict reads the way it does. Each dot
 * COMPOSES the shared {@link StatusDot} primitive (glow) wrapped in a {@link Tooltip}
 * that reveals the dimension detail on hover.
 *
 * `variant="chips"` draws each dimension as a neutral {@link Pill} led by a
 * {@link StatusGlyph}: the shape and colour carry the tone, the label stays in neutral
 * ink, and the tone word is in the accessible name.
 *
 * Warming up (`dimensions === null`) shows three neutral dots (or chips).
 */
import { View, Text } from 'react-native'
import { cn } from '../../../utils/cn'
import { StatusDot, type StatusDotVariant } from '../Workout/StatusDot'
import { Pill } from '../../ui/pill'
import { StatusGlyph } from '../../ui/status-glyph'
import { Tooltip } from '../../ui/tooltip/Tooltip'
import { useOnSurfaceColor } from '../../ui/surface'
import { MONO_TEXT, TONE_GLYPH, TONE_TOKEN } from './fatigue-tokens'
import type { DimensionTone, FatigueVerdict } from './fatigue-model'

/** Tone → the StatusDot variant, read off the status token `TONE_TOKEN` names for it. */
const TONE_VARIANT = Object.fromEntries(
  Object.entries(TONE_TOKEN).map(([tone, token]) => [tone, token.slice('status-'.length)])
) as Record<DimensionTone, StatusDotVariant>
const TONE_WORD: Record<DimensionTone, string> = { ok: 'ok', warn: 'watch', alarm: 'alarm' }

export interface FatigueLightsProps {
  /** The three per-dimension tones. `null` = warming up (all neutral). */
  dimensions: FatigueVerdict['dimensions'] | null
  /** Distribute the three lights evenly across the full width (space-between). Default false (left-grouped). */
  spread?: boolean
  /** `dots` (default) are glowing status dots; `chips` are neutral pills led by a status glyph. */
  variant?: 'dots' | 'chips'
}

interface LightProps {
  label: string
  tone: DimensionTone | null
  detail: string
}

function Chip({ label, tone, detail }: LightProps) {
  const word = tone ? TONE_WORD[tone] : 'warming up'
  return (
    <Tooltip label={`${detail} · ${word}`} placement="bottom">
      <View accessibilityRole="image" accessibilityLabel={`${detail}, ${word}`}>
        <Pill
          tone="neutral"
          size="lg"
          leading={
            <StatusGlyph tone={tone ? TONE_GLYPH[tone] : 'neutral'} size="sm" label={word} />
          }
          textClassName="text-text-primary"
        >
          {label}
        </Pill>
      </View>
    </Tooltip>
  )
}

function Dot({ label, tone, detail }: LightProps) {
  const variant: StatusDotVariant = tone ? TONE_VARIANT[tone] : 'neutral'
  const word = tone ? TONE_WORD[tone] : 'warming up'
  const labelColor = useOnSurfaceColor('secondary')
  return (
    <Tooltip label={`${detail} · ${word}`} placement="bottom">
      <View
        accessibilityRole="image"
        accessibilityLabel={`${detail}, ${word}`}
        className="flex-row items-center gap-inline-sm"
      >
        <StatusDot variant={variant} size="sm" glow />
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 0.6,
            ...MONO_TEXT,
            color: labelColor,
          }}
        >
          {label}
        </Text>
      </View>
    </Tooltip>
  )
}

export function FatigueLights({
  dimensions,
  spread = false,
  variant = 'dots',
}: FatigueLightsProps) {
  const Light = variant === 'chips' ? Chip : Dot
  return (
    <View
      testID="fatigue-lights"
      className={cn('flex-row items-center', spread ? 'justify-between' : 'justify-start gap-4')}
    >
      <Light label="VEL" tone={dimensions?.velocityLoss ?? null} detail="Velocity loss" />
      <Light label="ROM" tone={dimensions?.rom ?? null} detail="ROM depth" />
      <Light label="TEMPO" tone={dimensions?.tempo ?? null} detail="Tempo" />
    </View>
  )
}

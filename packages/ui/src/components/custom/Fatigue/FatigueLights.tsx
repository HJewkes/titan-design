// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * FatigueLights — the three "why" status dots (VEL · ROM · TEMPO) that stand behind
 * the verdict word: the supporting reason the verdict reads the way it does. Each dot
 * COMPOSES the shared {@link StatusDot} primitive (glow) wrapped in a {@link Tooltip}
 * that reveals the dimension detail on hover.
 *
 * Warming up (`dimensions === null`) shows three neutral dots.
 */
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { StatusDot, type StatusDotVariant } from '../Workout/StatusDot'
import { Tooltip } from '../../ui/tooltip/Tooltip'
import { FONT_MONO } from './fatigue-tokens'
import type { DimensionTone, FatigueVerdict } from './fatigue-model'

const t = getSemanticColors('dark')

/** Tone → the StatusDot variant (ok=success, warn=warning, alarm=error). */
const TONE_VARIANT: Record<DimensionTone, StatusDotVariant> = {
  ok: 'success',
  warn: 'warning',
  alarm: 'error',
}
const TONE_WORD: Record<DimensionTone, string> = { ok: 'ok', warn: 'watch', alarm: 'alarm' }

export interface FatigueLightsProps {
  /** The three per-dimension tones. `null` = warming up (all neutral). */
  dimensions: FatigueVerdict['dimensions'] | null
  /** Distribute the three lights evenly across the full width (space-between). Default false (left-grouped). */
  spread?: boolean
}

function Light({
  label,
  tone,
  detail,
}: {
  label: string
  tone: DimensionTone | null
  detail: string
}) {
  const variant: StatusDotVariant = tone ? TONE_VARIANT[tone] : 'neutral'
  const word = tone ? TONE_WORD[tone] : 'warming up'
  return (
    <Tooltip label={`${detail} · ${word}`} placement="bottom">
      <View
        accessibilityLabel={`${detail}, ${word}`}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
      >
        <StatusDot variant={variant} size="sm" glow />
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 0.6,
            fontFamily: FONT_MONO,
            color: t['text-secondary'],
          }}
        >
          {label}
        </Text>
      </View>
    </Tooltip>
  )
}

export function FatigueLights({ dimensions, spread = false }: FatigueLightsProps) {
  return (
    <View
      testID="fatigue-lights"
      style={{
        flexDirection: 'row',
        gap: spread ? 0 : 16,
        alignItems: 'center',
        justifyContent: spread ? 'space-between' : 'flex-start',
      }}
    >
      <Light label="VEL" tone={dimensions?.velocityLoss ?? null} detail="Velocity loss" />
      <Light label="ROM" tone={dimensions?.rom ?? null} detail="ROM depth" />
      <Light label="TEMPO" tone={dimensions?.tempo ?? null} detail="Tempo" />
    </View>
  )
}

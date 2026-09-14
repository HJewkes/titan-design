// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * VerdictHero — the fatigue card's single focal read: a big tone-flooded RPE number
 * beside the aggregated verdict word (Good / Slowing / Grinding / Form breaking
 * down). Integrated straight into the card (no nested box), in the StopSetDecision
 * idiom. RPE-LED by design — there is deliberately NO reps-in-reserve line (the card
 * covers exertion state with the number + word alone).
 *
 * Warming up (a cold-start set, `verdict === null`) renders a neutral "Warming up"
 * with an em-dash RPE.
 */
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { formatRpe } from '../../../utils/workout-format'
import { useSurfaceMode } from '../../ui/surface'
import { FONT_HEAD, FONT_MONO, TONE_TOKEN, STATE_LABEL } from './fatigue-tokens'
import type { FatigueVerdict } from './fatigue-model'

export interface VerdictHeroProps {
  /** Exact (unrounded) RPE estimate; rounded to the conventional 0.5 for display. `null` = warming up. */
  rpe: number | null
  /** The aggregated verdict + tone. `null` = warming up (renders neutral). */
  verdict: FatigueVerdict | null
}

export function VerdictHero({ rpe, verdict }: VerdictHeroProps) {
  const t = getSemanticColors(useSurfaceMode())
  const tone = verdict ? t[TONE_TOKEN[verdict.tone]] : t['text-tertiary']
  const word = verdict ? STATE_LABEL[verdict.state] : 'Warming up'
  return (
    <View className="gap-1.5" testID="verdict-hero">
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 1.5,
          fontFamily: FONT_MONO,
          color: t['text-tertiary'],
        }}
      >
        FATIGUE
      </Text>
      <View className="gap-0.5">
        <View
          className="flex-row items-end"
          // The 62px numeral's right side bearing already reads as space, so the 8px rung
          // parts the lockup instead of setting the suffix beside it.
          // optical: 7px between the numeral and its RPE suffix, below the 4px grain.
          style={{ gap: 7 }}
        >
          <Text
            style={{
              fontSize: 62,
              fontWeight: '900',
              fontFamily: FONT_HEAD,
              color: tone,
              lineHeight: 60,
            }}
            accessibilityLabel={`RPE ${formatRpe(rpe)}`}
          >
            {formatRpe(rpe)}
          </Text>
          <Text
            style={{
              fontSize: 18,
              fontWeight: '800',
              color: tone,
              // `items-end` aligns the two boxes, not the two baselines: the 62px numeral
              // sits in a 60px line box, so its glyph bottom is not its box bottom.
              // optical: 9px lifts the suffix onto the numeral's baseline.
              marginBottom: 9,
              fontFamily: FONT_HEAD,
            }}
          >
            RPE
          </Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '800', fontFamily: FONT_HEAD, color: tone }}>
          {word}
        </Text>
      </View>
    </View>
  )
}

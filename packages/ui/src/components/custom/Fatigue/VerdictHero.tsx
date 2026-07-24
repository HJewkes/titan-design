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
import { FONT_HEAD, FONT_MONO, TONE_COLOR, STATE_LABEL } from './fatigue-tokens'
import type { FatigueVerdict } from './fatigue-model'

const t = getSemanticColors('dark')

export interface VerdictHeroProps {
  /** Exact (unrounded) RPE estimate; rounded to the conventional 0.5 for display. `null` = warming up. */
  rpe: number | null
  /** The aggregated verdict + tone. `null` = warming up (renders neutral). */
  verdict: FatigueVerdict | null
}

/** Round an exact RPE to the conventional 0.5 step; em-dash when absent. */
function formatRpe(rpe: number | null): string {
  if (rpe == null) return '—'
  return (Math.round(rpe * 2) / 2).toFixed(1)
}

export function VerdictHero({ rpe, verdict }: VerdictHeroProps) {
  const tone = verdict ? TONE_COLOR[verdict.tone] : t['text-tertiary']
  const word = verdict ? STATE_LABEL[verdict.state] : 'Warming up'
  return (
    <View style={{ gap: 6 }} testID="verdict-hero">
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
      <View style={{ gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 7 }}>
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

// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * VerdictHero — the fatigue card's single focal read, in one of two leads.
 *
 * `lead="rpe"` (the default, used by the Live card): a big tone-flooded RPE number
 * beside the aggregated verdict word (Good / Slowing / Grinding / Form breaking
 * down). Integrated straight into the card (no nested box), in the StopSetDecision
 * idiom. There is deliberately NO reps-in-reserve line (the card covers exertion
 * state with the number + word alone).
 *
 * `lead="word"` (a finished set's read): the verdict word itself is the hero, led by
 * its {@link StatusGlyph} so the tone never rests on colour alone. No RPE row and no
 * "FATIGUE" eyebrow; the consumer's `kicker` names what was read instead. A set that
 * was never scored shows `noVerdict`: a short title, with the reason in the glyph's
 * tip and accessible name rather than as visible prose.
 *
 * Warming up (a cold-start set, `verdict === null`) renders a neutral "Warming up"
 * with an em-dash RPE.
 */
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { cn } from '../../../utils/cn'
import { formatRpe } from '../../../utils/workout-format'
import { useSurfaceMode } from '../../ui/surface'
import { Eyebrow } from '../../ui/eyebrow'
import { StatusGlyph } from '../../ui/status-glyph'
import { Tooltip } from '../../ui/tooltip/Tooltip'
import { Typography } from '../../ui/typography'
import { FONT_HEAD, MONO_TEXT, TONE_GLYPH, TONE_TOKEN, STATE_LABEL } from './fatigue-tokens'
import type { FatigueVerdict } from './fatigue-model'

/** The RPE-led hero the Live card shows. */
export interface VerdictHeroRpeProps {
  lead?: 'rpe'
  /** Exact (unrounded) RPE estimate; rounded to the conventional 0.5 for display. `null` = warming up. */
  rpe: number | null
  /** The aggregated verdict + tone. `null` = warming up (renders neutral). */
  verdict: FatigueVerdict | null
}

/** The word-led hero: glyph + verdict word, no RPE. */
export interface VerdictHeroWordProps {
  lead: 'word'
  /** The aggregated verdict + tone. `null` = warming up (renders neutral). */
  verdict: FatigueVerdict | null
  /** `card` sets the word at h3; `wall` at h2 for reading across a room. Default `card`. */
  scale?: 'card' | 'wall'
  /** A label above the word naming what was read ("HOW IT MOVED · WORST SET #2"). A string renders as an Eyebrow. */
  kicker?: ReactNode
  /** The set was not scored: `title` shows in place of the word, `reason` is the glyph's tip and spoken name. */
  noVerdict?: { title: string; reason: string }
}

export type VerdictHeroProps = VerdictHeroRpeProps | VerdictHeroWordProps

export function VerdictHero(props: VerdictHeroProps) {
  return props.lead === 'word' ? <WordLead {...props} /> : <RpeLead {...props} />
}

// The glyph sits in a box one line tall, so it centres on the word's first line and
// stays there when a long word ("Form breaking down") wraps.
const WORD_SCALE = {
  card: { variant: 'h3', glyph: 'md', lineBox: 'h-11' },
  wall: { variant: 'h2', glyph: 'lg', lineBox: 'h-14' },
} as const

function WordLead({ verdict, scale = 'card', kicker, noVerdict }: VerdictHeroWordProps) {
  const t = getSemanticColors(useSurfaceMode())
  const look = WORD_SCALE[scale]
  const tone = noVerdict ? null : (verdict?.tone ?? null)
  const word = noVerdict?.title ?? (verdict ? STATE_LABEL[verdict.state] : 'Warming up')
  const color = tone ? t[TONE_TOKEN[tone]] : t['text-secondary']
  const glyph = (
    <StatusGlyph
      tone={tone ? TONE_GLYPH[tone] : 'neutral'}
      size={look.glyph}
      label={noVerdict?.reason ?? word}
    />
  )
  return (
    <View className="gap-stack-sm" testID="verdict-hero">
      {typeof kicker === 'string' ? <Eyebrow>{kicker}</Eyebrow> : kicker}
      <View className="flex-row items-start gap-inline-md">
        <View className={cn(look.lineBox, 'justify-center')} aria-hidden={!noVerdict}>
          {noVerdict ? <Tooltip label={noVerdict.reason}>{glyph}</Tooltip> : glyph}
        </View>
        {/* A verdict, not a section title: keep it out of the page's heading outline. */}
        <Typography
          variant={look.variant}
          color="inherit"
          accessibilityRole="text"
          aria-level={undefined}
          className="shrink"
          style={{ color }}
        >
          {word}
        </Typography>
      </View>
    </View>
  )
}

function RpeLead({ rpe, verdict }: VerdictHeroRpeProps) {
  const t = getSemanticColors(useSurfaceMode())
  const tone = verdict ? t[TONE_TOKEN[verdict.tone]] : t['text-tertiary']
  const word = verdict ? STATE_LABEL[verdict.state] : 'Warming up'
  return (
    <View className="gap-1.5" testID="verdict-hero">
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 1.5,
          ...MONO_TEXT,
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

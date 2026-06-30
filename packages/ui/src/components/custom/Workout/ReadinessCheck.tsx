// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, Text, Pressable } from 'react-native'
import { Card } from '../../ui/card'
import { Badge, type BadgeColor } from '../../ui/badge'
import { WORKOUT_TOKENS } from '../../../theme/workout-tokens'

const BRAND_PRIMARY = '#FF7900'
const BRAND_PRIMARY_SUBTLE = 'rgba(255,121,0,0.12)'
const STATUS_SUCCESS = '#14B8A6'
const STATUS_WARNING = '#FFB020'
const STATUS_ERROR = '#D14343'
const TEXT_PRIMARY = '#F3F4F6'
const TEXT_SECONDARY = '#9CA3AF'

/** Emoji option sets per known factor, keyed by lowercase id/label. */
const EMOJI_SETS: Record<string, readonly string[]> = {
  sleep: ['😴', '😐', '🙂', '😊', '🤩'],
  soreness: ['😵', '😣', '😐', '🙂', '💪'],
  motivation: ['😑', '😐', '🙂', '😄', '🔥'],
  stress: ['😰', '😟', '😐', '😌', '😎'],
}
const DEFAULT_EMOJI_SET = ['😞', '😕', '😐', '🙂', '😄'] as const

export type WarmUpStatus = 'good' | 'moderate' | 'caution'

export interface ReadinessFactor {
  /** Stable identifier; also used to pick the emoji set (sleep/soreness/motivation/stress). */
  id: string
  /** Human label, e.g. "Sleep". */
  label: string
  /** Selected level, 1-5. */
  value: number
  /** Called with the new 1-5 level when an emoji is tapped. */
  onChange: (value: number) => void
}

export interface WarmUpValidation {
  /** Percent below the 14-day rolling velocity average. */
  velocityDeficit: number
  /** Short human recommendation, e.g. "Velocity on target — proceed as planned". */
  recommendation: string
  /** Severity of the deficit. */
  status: WarmUpStatus
}

export interface ReadinessCheckProps {
  /** Subjective readiness factors (Sleep, Soreness, Motivation, Stress). */
  factors: ReadinessFactor[]
  /** Computed overall readiness score, 0-100. */
  score: number
  /** VBT warm-up validation result, shown once the warm-up set is performed. */
  warmUpValidation?: WarmUpValidation
  /** Whether the VBT warm-up has been performed. */
  warmUpCompleted: boolean
  /** Called when the assessment is confirmed and the workout can begin. */
  onConfirm: () => void
  className?: string
}

/** Maps a 0-100 readiness score onto a status color. */
function scoreColor(score: number): string {
  if (score < 40) return STATUS_ERROR
  if (score < 70) return STATUS_WARNING
  return STATUS_SUCCESS
}

const WARMUP_BADGE: Record<WarmUpStatus, { color: BadgeColor; label: string }> = {
  good: { color: 'success', label: 'Good' },
  moderate: { color: 'warning', label: 'Moderate' },
  caution: { color: 'error', label: 'Caution' },
}

function emojiSet(factor: ReadinessFactor): readonly string[] {
  return EMOJI_SETS[factor.id.toLowerCase()] ?? EMOJI_SETS[factor.label.toLowerCase()] ?? DEFAULT_EMOJI_SET
}

interface EmojiSliderProps {
  factor: ReadinessFactor
}

/** One factor row: label plus a radiogroup of five tappable emoji. */
function EmojiSlider({ factor }: EmojiSliderProps) {
  const emojis = emojiSet(factor)
  return (
    <View style={{ marginTop: 14 }} testID={`readiness-check-factor-${factor.id}`}>
      <Text
        style={{ fontSize: 12, fontWeight: '500', fontFamily: 'Inter, sans-serif', color: TEXT_SECONDARY }}
        testID="readiness-check-factor-label"
      >
        {factor.label}
      </Text>
      <View
        className="flex-row items-center"
        style={{ marginTop: 6, gap: 6 }}
        accessibilityRole="radiogroup"
        aria-label={factor.label}
        testID="readiness-check-factor-options"
      >
        {emojis.map((emoji, index) => {
          const level = index + 1
          const selected = factor.value === level
          return (
            <Pressable
              key={level}
              onPress={() => factor.onChange(level)}
              accessibilityRole="radio"
              accessibilityLabel={`${factor.label} level ${level} of 5`}
              aria-checked={selected}
              testID="readiness-check-emoji"
              style={({ pressed }) => ({
                flex: 1,
                alignItems: 'center',
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selected ? BRAND_PRIMARY : WORKOUT_TOKENS.border.default,
                backgroundColor: selected ? BRAND_PRIMARY_SUBTLE : WORKOUT_TOKENS.surface.raised,
                opacity: selected ? 1 : pressed ? 0.8 : 0.55,
                transform: [{ scale: selected ? 1.06 : 1 }],
              })}
            >
              <Text style={{ fontSize: 20 }}>{emoji}</Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

/** Circular score gauge: 60px ring colored by range with the score centered. */
function ScoreGauge({ score }: { score: number }) {
  const color = scoreColor(score)
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Readiness score: ${score} out of 100`}
      testID="readiness-check-score"
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 4,
        borderColor: color,
        backgroundColor: WORKOUT_TOKENS.surface.raised,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{ fontSize: 20, fontWeight: '700', fontFamily: '"Space Grotesk", sans-serif', color }}
        testID="readiness-check-score-value"
      >
        {score}
      </Text>
    </View>
  )
}

/** VBT warm-up validation card with status badge and recommendation. */
function WarmUpCard({ validation }: { validation: WarmUpValidation }) {
  const badge = WARMUP_BADGE[validation.status]
  return (
    <View
      style={{
        marginTop: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: WORKOUT_TOKENS.border.default,
        backgroundColor: WORKOUT_TOKENS.surface.raised,
      }}
      testID="readiness-check-warmup"
    >
      <View className="flex-row items-center justify-between" style={{ gap: 8 }}>
        <Text
          style={{ fontSize: 12, fontWeight: '600', fontFamily: 'Inter, sans-serif', color: TEXT_SECONDARY }}
          testID="readiness-check-warmup-deficit"
        >
          {`Velocity ${validation.velocityDeficit}% below 14-day average`}
        </Text>
        <Badge variant="subtle" color={badge.color} size="sm" testID="readiness-check-warmup-badge">
          {badge.label}
        </Badge>
      </View>
      <Text
        style={{ marginTop: 6, fontSize: 13, fontFamily: 'Inter, sans-serif', color: TEXT_PRIMARY }}
        testID="readiness-check-warmup-recommendation"
      >
        {validation.recommendation}
      </Text>
    </View>
  )
}

/**
 * Pre-workout readiness assessment combining subjective emoji sliders with an
 * objective VBT warm-up validation and a computed readiness score.
 *
 * @example
 * <ReadinessCheck
 *   factors={[{ id: 'sleep', label: 'Sleep', value: 4, onChange: setSleep }]}
 *   score={78}
 *   warmUpCompleted
 *   warmUpValidation={{ velocityDeficit: 4, recommendation: 'On target', status: 'good' }}
 *   onConfirm={start}
 * />
 */
export function ReadinessCheck({
  factors,
  score,
  warmUpValidation,
  warmUpCompleted,
  onConfirm,
  className,
}: ReadinessCheckProps) {
  return (
    <Card variant="outline" elevation={2} className={className} testID="readiness-check">
      <View style={{ padding: 16 }}>
        <View className="flex-row items-center justify-between" style={{ gap: 12 }}>
          <Text
            style={{ fontSize: 18, fontWeight: '700', fontFamily: '"Space Grotesk", sans-serif', color: TEXT_PRIMARY }}
            testID="readiness-check-title"
          >
            How are you feeling?
          </Text>
          <ScoreGauge score={score} />
        </View>

        {factors.map((factor) => (
          <EmojiSlider key={factor.id} factor={factor} />
        ))}

        {warmUpCompleted && warmUpValidation && <WarmUpCard validation={warmUpValidation} />}

        <Pressable
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel="Confirm readiness and start workout"
          testID="readiness-check-confirm"
          style={({ pressed }) => ({
            marginTop: 16,
            width: '100%',
            alignItems: 'center',
            backgroundColor: BRAND_PRIMARY,
            borderRadius: 8,
            paddingVertical: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', fontFamily: 'Inter, sans-serif', color: '#FFFFFF' }}>
            Start Workout
          </Text>
        </Pressable>
      </View>
    </Card>
  )
}

// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * LiveFatiguePanel — the aligned "Live panel v2": the loss-relative {@link VelocityHero}
 * (primary) beside the vertical {@link LiveFatigueCard} (secondary), flooded by a
 * coaching {@link LiveAuraFrame} whose category tracks the verdict state. The optional
 * lite exercise header sits above.
 *
 * The velocity hero's per-rep velocities are NOT on the fatigue model (they come from
 * the live-view velocity path), so they're passed as their own `velocity` prop.
 */
import { View, Text } from 'react-native'
import { LiveAuraFrame, type LiveAuraCategory } from '../Workout/LiveAuraFrame'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { alpha } from '../../../utils/colors'
import { VelocityHero } from './VelocityHero'
import { LiveFatigueCard } from './LiveFatigueCard'
import { FONT_HEAD, FONT_UI, FONT_MONO, auraForVerdict } from './fatigue-tokens'
import type { LiveFatigueModel } from './fatigue-model'

const t = getSemanticColors('dark')

export interface LiveFatiguePanelHeader {
  /** Exercise name — the large title. */
  title: string
  /** Prescription / block line under the title. */
  subtitle?: string
  /** Right-aligned progress meta, e.g. "SET 3 · REP 7 / 8". */
  meta?: string
}

export interface LiveFatiguePanelVelocity {
  /** Per-rep MEAN concentric velocity (m/s), ordered by rep. */
  velocities: number[]
  targetReps?: number
  liveRepIndex?: number
}

export interface LiveFatiguePanelProps {
  /** The live fatigue read-model for the current set. */
  model: LiveFatigueModel
  /** The velocity-hero data (its own source — not on the fatigue model). */
  velocity: LiveFatiguePanelVelocity
  /** Optional lite exercise header. Omitted → no header row. */
  header?: LiveFatiguePanelHeader
  /** Aura-flood category. Defaults to the verdict-derived category. */
  aura?: LiveAuraCategory
  /** Panel body height in px. Default 508. */
  bodyHeight?: number
  /** Fixed fatigue-card column width. Default 318. */
  cardWidth?: number
  /** Pin the ghost-spark revealed — for static screenshots. */
  revealChart?: boolean
}

function ExerciseHeaderLite({ header }: { header: LiveFatiguePanelHeader }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 18,
        paddingBottom: 14,
        borderBottomWidth: 1,
        borderColor: alpha(t['text-primary'], 0.08),
      }}
    >
      <View style={{ gap: 2 }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '700',
            fontFamily: FONT_HEAD,
            color: t['text-primary'],
          }}
        >
          {header.title}
        </Text>
        {header.subtitle && (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              fontFamily: FONT_UI,
              color: t['text-secondary'],
            }}
          >
            {header.subtitle}
          </Text>
        )}
      </View>
      {header.meta && (
        <Text
          style={{
            fontSize: 13,
            fontWeight: '800',
            fontFamily: FONT_MONO,
            color: t['text-tertiary'],
          }}
        >
          {header.meta}
        </Text>
      )}
    </View>
  )
}

export function LiveFatiguePanel({
  model,
  velocity,
  header,
  aura,
  bodyHeight = 508,
  cardWidth = 318,
  revealChart,
}: LiveFatiguePanelProps) {
  const category = aura ?? auraForVerdict(model.verdict?.state ?? null)
  const heroH = bodyHeight - 26 // leaves room for the hero's own eyebrow above it
  return (
    <LiveAuraFrame
      category={category}
      style={{ borderRadius: 0, borderWidth: 0 }}
      testID="live-fatigue-panel"
    >
      <View style={{ flex: 1 }}>
        {header && <ExerciseHeaderLite header={header} />}
        <View style={{ padding: 24, flexDirection: 'row', gap: 18, alignItems: 'stretch' }}>
          {/* PRIMARY — the velocity hero with VL bands; flexes to fill the width the card leaves. */}
          <View style={{ flex: 1, gap: 8 }}>
            <Text
              style={{
                fontSize: 9,
                letterSpacing: 1.2,
                fontFamily: FONT_MONO,
                color: t['text-tertiary'],
              }}
            >
              VELOCITY · this set
            </Text>
            <VelocityHero
              velocities={velocity.velocities}
              targetReps={velocity.targetReps}
              liveRepIndex={velocity.liveRepIndex}
              height={heroH}
            />
          </View>
          {/* SECONDARY — the vertical fatigue card. */}
          <LiveFatigueCard
            model={model}
            width={cardWidth}
            height={bodyHeight}
            revealChart={revealChart}
          />
        </View>
      </View>
    </LiveAuraFrame>
  )
}

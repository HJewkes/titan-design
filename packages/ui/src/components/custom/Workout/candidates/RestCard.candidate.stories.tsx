// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/RestCard.tsx
// Rating:   High · titan equiv: none (bar-style RestTimer has no recap strip)
// Why:      Circular rest countdown + inline "Set N complete" recap row — titan's
//           RestTimer is a linear bar with no completed-set summary.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `0:${s.toString().padStart(2, '0')}`
}

/** Inlined static re-render of the mobile CircularTimer (no live tick). */
function MiniCircularTimer({
  elapsedMs,
  targetMs,
}: {
  elapsedMs: number
  targetMs: number | null
}) {
  const size = 80
  const strokeWidth = 6
  if (!targetMs) {
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '700', color: t['text-primary'] }}>
          {formatTime(elapsedMs)}
        </Text>
      </View>
    )
  }
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(1, elapsedMs / targetMs)
  const overshot = elapsedMs > targetMs
  const circleColor = overshot ? t['status-error'] : t['brand-primary']
  const trackColor = overshot ? 'rgba(255,59,48,0.15)' : 'rgba(255,255,255,0.08)'
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={circleColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: overshot ? t['status-error'] : t['text-primary'],
        }}
      >
        {formatTime(elapsedMs)}
      </Text>
    </View>
  )
}

interface RestCardSpecimenProps {
  restElapsedMs: number
  restTargetMs: number | null
  setNumber: number
  hasRecap: boolean
  repCount?: number
  weight?: number
  avgVelocity?: number
}

/** Static faithful re-render of the mobile RestCard (ring + set recap strip). */
function RestCardSpecimen({
  restElapsedMs,
  restTargetMs,
  setNumber,
  hasRecap,
  repCount = 0,
  weight = 0,
  avgVelocity = 0,
}: RestCardSpecimenProps) {
  return (
    <View style={{ width: 260 }}>
      <View style={{ alignItems: 'center', paddingVertical: 16 }}>
        <MiniCircularTimer elapsedMs={restElapsedMs} targetMs={restTargetMs} />
      </View>
      {hasRecap && (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 8,
            backgroundColor: alpha('#fff', 0.04),
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 13, color: t['text-secondary'] }}>Set {setNumber} complete</Text>
          <Text style={{ fontSize: 13, color: t['text-tertiary'] }}>·</Text>
          <Text style={{ fontSize: 13, color: t['text-primary'], fontWeight: '600' }}>
            {repCount} reps
          </Text>
          <Text style={{ fontSize: 13, color: t['text-tertiary'] }}>·</Text>
          <Text style={{ fontSize: 13, color: t['text-primary'], fontWeight: '600' }}>
            {weight} lbs
          </Text>
          <Text style={{ fontSize: 13, color: t['text-tertiary'] }}>·</Text>
          <Text style={{ fontSize: 13, color: t['text-primary'], fontWeight: '600' }}>
            {avgVelocity.toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  )
}

const meta: Meta<typeof RestCardSpecimen> = {
  title: 'Lab/Candidates/Rest/RestCard',
  component: RestCardSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Circular rest countdown paired ' +
          'with an inline "Set N complete · reps · lbs · velocity" recap strip. titan has no bar-style ' +
          'equivalent that pairs a rest timer with a recap row. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RestCardSpecimen>

export const MidRestWithRecap: Story = {
  args: {
    restElapsedMs: 45000,
    restTargetMs: 90000,
    setNumber: 2,
    hasRecap: true,
    repCount: 8,
    weight: 185,
    avgVelocity: 0.62,
  },
}
export const OvershootWithRecap: Story = {
  args: {
    restElapsedMs: 96000,
    restTargetMs: 90000,
    setNumber: 3,
    hasRecap: true,
    repCount: 10,
    weight: 225,
    avgVelocity: 0.41,
  },
}
export const FirstSetNoRecap: Story = {
  args: { restElapsedMs: 20000, restTargetMs: 60000, setNumber: 1, hasRecap: false },
}
export const FreeRestNoTarget: Story = {
  args: {
    restElapsedMs: 30000,
    restTargetMs: null,
    setNumber: 4,
    hasRecap: true,
    repCount: 6,
    weight: 275,
    avgVelocity: 0.35,
  },
}

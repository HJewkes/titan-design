// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/exercise/CircularTimer.tsx
// Rating:   High · titan equiv: none (Gauge is a value-arc, not a countdown)
// Why:      Circular countdown ring — titan only has the linear-bar RestTimer.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { getSemanticColors } from '../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `0:${s.toString().padStart(2, '0')}`
}

/** Static faithful re-render of the mobile CircularTimer (no live tick). */
function CircularTimerSpecimen({
  elapsedMs,
  targetMs,
  size = 80,
  strokeWidth = 6,
}: {
  elapsedMs: number
  targetMs: number | null
  size?: number
  strokeWidth?: number
}) {
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

const meta: Meta<typeof CircularTimerSpecimen> = {
  title: 'Lab/Candidates/Rest/CircularTimer',
  component: CircularTimerSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). SVG ring countdown; ' +
          'overshoot turns the ring + digits red. titan has no circular countdown — only the ' +
          'linear-bar `RestTimer`. Static specimen; rebuild for real if promoted.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CircularTimerSpecimen>

export const MidCountdown: Story = { args: { elapsedMs: 45000, targetMs: 90000 } }
export const NearComplete: Story = { args: { elapsedMs: 82000, targetMs: 90000 } }
export const Overshot: Story = { args: { elapsedMs: 104000, targetMs: 90000 } }
export const NoTarget: Story = { args: { elapsedMs: 38000, targetMs: null } }

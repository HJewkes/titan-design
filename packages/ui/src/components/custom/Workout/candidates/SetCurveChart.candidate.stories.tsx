// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/analytics/charts/SetCurveChart.tsx
// Rating:   High · titan equiv: none (no live time-series curve with phase bands)
// Why:      Full-set velocity/force/position curve with concentric/hold/eccentric
//           phase-tinted bands and a playhead. Live signal toggle (CycleToggle) and
//           in-progress playhead motion stripped; renders one static finished curve.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import Svg, { Path, Line, Rect } from 'react-native-svg'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')

type MovementPhase = 'concentric' | 'hold' | 'eccentric' | 'idle'

interface WorkoutSample {
  timestamp: number
  velocity: number
  force: number
  position: number
  phase: MovementPhase
}

type ChartSignal = 'velocity' | 'force' | 'position'

const SIGNAL_CONFIG: Record<
  ChartSignal,
  { getValue: (s: WorkoutSample) => number; color: string }
> = {
  velocity: { getValue: (s) => s.velocity, color: t['status-success'] },
  force: { getValue: (s) => s.force, color: t['brand-primary'] },
  position: { getValue: (s) => s.position, color: t['status-info'] },
}

function getPhaseColor(phase: MovementPhase): string {
  switch (phase) {
    case 'concentric':
      return alpha(t['status-success'], 0.12)
    case 'hold':
      return alpha(t['status-warning'], 0.12)
    case 'eccentric':
      return alpha(t['status-info'], 0.12)
    default:
      return alpha(t['border-strong'], 0.06)
  }
}

/** Static faithful re-render of the mobile SetCurveChart (frozen, no live toggle/playhead motion). */
function SetCurveChartSpecimen({
  samples,
  width,
  height,
  signal = 'velocity',
}: {
  samples: WorkoutSample[]
  width: number
  height: number
  signal?: ChartSignal
}) {
  const config = SIGNAL_CONFIG[signal]
  const padding = { top: 8, right: 10, bottom: 18, left: 36 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const startTime = samples[0].timestamp
  const totalDurationMs = samples[samples.length - 1].timestamp - startTime
  const msToX = (ms: number) => padding.left + (ms / totalDurationMs) * chartWidth
  const values = samples.map(config.getValue)
  const minVal = 0
  const maxVal = Math.max(...values) * 1.1
  const valToY = (v: number) => padding.top + (maxVal - v) * (chartHeight / (maxVal - minVal))

  let dataPath = ''
  samples.forEach((sample, i) => {
    const x = msToX(sample.timestamp - startTime)
    const y = valToY(config.getValue(sample))
    dataPath += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`
  })

  const bands: { x: number; width: number; phase: MovementPhase }[] = []
  let bandStartMs = 0
  let currentPhase = samples[0].phase
  samples.forEach((sample, i) => {
    const sampleMs = sample.timestamp - startTime
    if (sample.phase !== currentPhase || i === samples.length - 1) {
      const endMs = i === samples.length - 1 ? sampleMs + 91 : sampleMs
      bands.push({
        x: msToX(bandStartMs),
        width: msToX(endMs) - msToX(bandStartMs),
        phase: currentPhase,
      })
      bandStartMs = sampleMs
      currentPhase = sample.phase
    }
  })

  const totalSec = Math.round(totalDurationMs / 1000)

  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '600', color: config.color, marginBottom: 4 }}>
        {signal}
      </Text>
      <View>
        <Svg width={width} height={height - 32}>
          {bands.map((band, i) => (
            <Rect
              key={i}
              x={band.x}
              y={padding.top}
              width={band.width}
              height={chartHeight}
              fill={getPhaseColor(band.phase)}
            />
          ))}
          <Path d={dataPath} stroke={config.color} strokeWidth={2} fill="none" />
          <Line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={height - 32 - padding.bottom}
            stroke={t['border-strong']}
            strokeWidth={1}
          />
          <Line
            x1={padding.left}
            y1={height - 32 - padding.bottom}
            x2={width - padding.right}
            y2={height - 32 - padding.bottom}
            stroke={t['border-strong']}
            strokeWidth={1}
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: padding.top,
            width: padding.left - 4,
            alignItems: 'flex-end',
          }}
        >
          <Text style={{ fontSize: 9, color: t['text-disabled'] }}>
            {signal === 'velocity' ? maxVal.toFixed(1) : Math.round(maxVal)}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 1,
            left: padding.left,
            right: padding.right,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 9, color: t['text-disabled'] }}>0s</Text>
          <Text style={{ fontSize: 9, color: t['text-disabled'] }}>{totalSec}s</Text>
        </View>
      </View>
    </View>
  )
}

const meta: Meta<typeof SetCurveChartSpecimen> = {
  title: 'Lab/Candidates/Charts/SetCurveChart',
  component: SetCurveChartSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). Time-series curve ' +
          '(velocity/force/position) with concentric/hold/eccentric phase-tinted bands. ' +
          'titan has no equivalent live-signal curve chart. Live playhead + signal toggle ' +
          'stripped; renders one frozen finished-set curve. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof SetCurveChartSpecimen>

function makeSamples(): WorkoutSample[] {
  const samples: WorkoutSample[] = []
  let t0 = 0
  for (let i = 0; i < 12; i++) {
    samples.push({
      timestamp: t0,
      velocity: 0.15 + i * 0.03,
      force: 28 + i * 1.5,
      position: 0.1 + i * 0.02,
      phase: 'concentric',
    })
    t0 += 91
  }
  for (let i = 0; i < 3; i++) {
    samples.push({ timestamp: t0, velocity: 0.02, force: 45, position: 0.46, phase: 'hold' })
    t0 += 91
  }
  for (let i = 0; i < 10; i++) {
    samples.push({
      timestamp: t0,
      velocity: 0.4 - i * 0.03,
      force: 38 - i * 1.2,
      position: 0.46 - i * 0.045,
      phase: 'eccentric',
    })
    t0 += 91
  }
  return samples
}

const sampleSet = makeSamples()

export const VelocityCurve: Story = {
  args: { samples: sampleSet, width: 300, height: 160, signal: 'velocity' },
}
export const ForceCurve: Story = {
  args: { samples: sampleSet, width: 300, height: 160, signal: 'force' },
}
export const PositionCurve: Story = {
  args: { samples: sampleSet, width: 300, height: 160, signal: 'position' },
}

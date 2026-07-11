// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the mobile app's component, ported in for the
// component-direction review (see packages/ui/MATURITY.md). Interactivity,
// store wiring, and reanimated motion are intentionally stripped — this shows
// the LOOK only, so we can judge design direction. Rebuild for real (props,
// tests, motion) via the titan-component-workflow if the review promotes it.
//
// Source:   voltras/mobile/src/components/mode/LoadProfileChart.tsx
// Rating:   High · titan equiv: none (no rep-timeline load chart in titan)
// Why:      Concentric/eccentric load profile with chain + eccentric drag handles —
//           unique to the mode-config surface. PanResponder drag stripped; handles
//           are drawn frozen at their resting position.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import Svg, { Line, Path, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg'
import { getSemanticColors } from '../../../../theme/tokens/semantic'
import { alpha } from '../../../../utils/colors'

const t = getSemanticColors('dark')
const PADDING = { top: 24, right: 32, bottom: 28, left: 48 }
const HANDLE_RADIUS = 10

function computeYTicks(min: number, max: number, count: number): number[] {
  const range = max - min
  const rawStep = range / count
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const normalized = rawStep / magnitude
  const niceStep =
    normalized <= 1.5
      ? magnitude
      : normalized <= 3.5
        ? 2 * magnitude
        : normalized <= 7.5
          ? 5 * magnitude
          : 10 * magnitude
  const ticks: number[] = []
  for (let v = Math.ceil(min / niceStep) * niceStep; v <= max; v += niceStep) ticks.push(v)
  return ticks
}

/** Static faithful re-render of the mobile LoadProfileChart (drag handles frozen). */
function LoadProfileChartSpecimen({
  baseWeight,
  chains,
  inverseChains,
  eccentric,
  width,
  height,
}: {
  baseWeight: number
  chains: number
  inverseChains: number
  eccentric: number
  width: number
  height: number
}) {
  const chartW = width - PADDING.left - PADDING.right
  const chartH = height - PADDING.top - PADDING.bottom
  const chainValue = inverseChains > 0 ? inverseChains : chains
  const isInverse = inverseChains > 0
  const conBottom = isInverse ? baseWeight : baseWeight + chainValue
  const conTop = isInverse ? baseWeight + chainValue : baseWeight
  const eccMultiplier = 1 + eccentric / 100
  const eccBottom = conBottom * eccMultiplier
  const eccTop = conTop * eccMultiplier
  const maxConLoad = baseWeight + 100
  const maxEccLoad = maxConLoad * (1 + 195 / 100)
  const yMax = Math.max(220, maxEccLoad * 1.05)
  const xScale = (pos: number) => PADDING.left + pos * chartW
  const yScale = (lbs: number) => PADDING.top + ((yMax - lbs) / yMax) * chartH
  const conStartX = xScale(0)
  const midX = xScale(0.5)
  const eccEndX = xScale(1)
  const conStartY = yScale(conBottom)
  const conEndY = yScale(conTop)
  const eccStartY = yScale(eccTop)
  const eccEndY = yScale(eccBottom)
  const baselineY = yScale(baseWeight)
  const hasEccentric = eccentric !== 0
  const fillPath = hasEccentric
    ? `M ${conStartX} ${conStartY} L ${midX} ${conEndY} L ${midX} ${eccStartY} L ${eccEndX} ${eccEndY} L ${eccEndX} ${yScale(conBottom)} L ${conStartX} ${conStartY} Z`
    : ''
  const eccHandleX = xScale(0.75)
  const eccHandleY = yScale((eccTop + eccBottom) / 2)
  const yTicks = computeYTicks(0, yMax, 4)
  const loadLabel = `${baseWeight} lbs`
  const chainLabel = chainValue > 0 ? `${chainValue} lbs ${isInverse ? 'inv' : ''}` : ''
  const eccLabel = eccentric !== 0 ? `${eccentric > 0 ? '+' : ''}${eccentric}%` : ''

  return (
    <View>
      <View>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="eccFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={t['status-info']} stopOpacity={0.2} />
              <Stop offset="1" stopColor={t['status-info']} stopOpacity={0.05} />
            </LinearGradient>
          </Defs>
          <Rect
            x={PADDING.left}
            y={PADDING.top}
            width={chartW}
            height={chartH}
            fill={alpha(t['surface-elevated'], 0.3)}
            rx={4}
          />
          {yTicks.map((tick) => (
            <Line
              key={tick}
              x1={PADDING.left}
              y1={yScale(tick)}
              x2={eccEndX}
              y2={yScale(tick)}
              stroke={alpha(t['border-strong'], 0.3)}
              strokeWidth={0.5}
            />
          ))}
          <Line
            x1={midX}
            y1={PADDING.top}
            x2={midX}
            y2={PADDING.top + chartH}
            stroke={alpha(t['border-strong'], 0.2)}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
          <Line
            x1={conStartX}
            y1={baselineY}
            x2={eccEndX}
            y2={baselineY}
            stroke={alpha(t['text-tertiary'], 0.5)}
            strokeWidth={1}
            strokeDasharray="6,4"
          />
          {hasEccentric && <Path d={fillPath} fill="url(#eccFill)" />}
          <Line
            x1={conStartX}
            y1={conStartY}
            x2={midX}
            y2={conEndY}
            stroke={t['brand-primary']}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {hasEccentric ? (
            <Line
              x1={midX}
              y1={eccStartY}
              x2={eccEndX}
              y2={eccEndY}
              stroke={t['status-info']}
              strokeWidth={2}
              strokeLinecap="round"
              strokeDasharray="6,3"
            />
          ) : (
            <Line
              x1={midX}
              y1={conEndY}
              x2={eccEndX}
              y2={conStartY}
              stroke={alpha(t['brand-primary'], 0.4)}
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeDasharray="4,3"
            />
          )}
          {hasEccentric && (
            <Line
              x1={midX}
              y1={conEndY}
              x2={midX}
              y2={eccStartY}
              stroke={t['status-info']}
              strokeWidth={1.5}
              strokeDasharray="2,2"
            />
          )}
          <Circle
            cx={conStartX}
            cy={conStartY}
            r={HANDLE_RADIUS}
            fill={t['text-primary']}
            stroke={t['surface-elevated']}
            strokeWidth={2}
          />
          <Circle
            cx={midX}
            cy={conEndY}
            r={HANDLE_RADIUS}
            fill={t['brand-primary']}
            stroke={t['surface-elevated']}
            strokeWidth={2}
          />
          <Circle
            cx={eccHandleX}
            cy={eccHandleY}
            r={HANDLE_RADIUS}
            fill={eccentric !== 0 ? t['status-info'] : alpha(t['status-info'], 0.5)}
            stroke={t['surface-elevated']}
            strokeWidth={2}
          />
          <Circle
            cx={eccEndX}
            cy={hasEccentric ? eccEndY : conStartY}
            r={4}
            fill={hasEccentric ? t['status-info'] : alpha(t['brand-primary'], 0.4)}
          />
        </Svg>
        <View
          style={{
            position: 'absolute',
            bottom: 4,
            left: PADDING.left,
            right: PADDING.right,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 10, color: t['text-disabled'] }}>Start</Text>
          <Text style={{ fontSize: 10, color: t['text-disabled'] }}>Top</Text>
          <Text style={{ fontSize: 10, color: t['text-disabled'] }}>End</Text>
        </View>
        <View
          style={{ position: 'absolute', left: conStartX + HANDLE_RADIUS + 6, top: conStartY - 8 }}
        >
          <Text style={{ fontSize: 10, color: t['text-primary'], fontWeight: '600' }}>
            {loadLabel}
          </Text>
        </View>
        {chainLabel !== '' && (
          <View
            style={{
              position: 'absolute',
              left: midX - 50,
              top: conEndY - HANDLE_RADIUS - 16,
              width: 100,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 10, color: t['brand-primary'], fontWeight: '600' }}>
              {chainLabel}
            </Text>
          </View>
        )}
        {eccLabel !== '' && (
          <View
            style={{
              position: 'absolute',
              left: eccHandleX + HANDLE_RADIUS + 6,
              top: eccHandleY - 8,
            }}
          >
            <Text style={{ fontSize: 10, color: t['status-info'], fontWeight: '600' }}>
              {eccLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const meta: Meta<typeof LoadProfileChartSpecimen> = {
  title: 'Lab/Explorations/LoadProfileChart',
  component: LoadProfileChartSpecimen,
  tags: ['status:lab', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (mobile → titan review). SVG rep-timeline load ' +
          'profile (concentric slope → eccentric jump) with three drag handles for base ' +
          'weight, chains, and eccentric offset. titan has no equivalent load-profile chart. ' +
          'Drag stripped; handles frozen at their resting position. Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof LoadProfileChartSpecimen>

export const FlatWeight: Story = {
  args: { baseWeight: 135, chains: 0, inverseChains: 0, eccentric: 0, width: 320, height: 220 },
}
export const WithChains: Story = {
  args: { baseWeight: 95, chains: 40, inverseChains: 0, eccentric: 0, width: 320, height: 220 },
}
export const InverseChainsWithEccentric: Story = {
  args: { baseWeight: 115, chains: 0, inverseChains: 30, eccentric: 25, width: 320, height: 220 },
}
export const HeavyOverload: Story = {
  args: { baseWeight: 185, chains: 20, inverseChains: 0, eccentric: 40, width: 320, height: 220 },
}

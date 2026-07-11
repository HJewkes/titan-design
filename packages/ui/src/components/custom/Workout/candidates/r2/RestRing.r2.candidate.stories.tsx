// CANDIDATE VISUAL SPECIMEN — do not consume in app surfaces.
//
// A faithful *static* re-render of the R2 dashboard harness's live-view
// subcomponent (voltras-mcp, branch feat/VMCP-r2-react-harness), ported in for
// the component-direction review (see packages/ui/MATURITY.md). The live
// countdown tick is stripped — this shows the LOOK only, in a still state.
//
// Source:   voltras-mcp/src/dashboard/spa/r2/restring.tsx + r2.css `.r2-restring`
// Rating:   High · titan equiv: RestTimer (compact linear bar) + the mobile CircularTimer
//           candidate (elapsed/target countdown w/ overshoot) — a related but distinct shape
// Why:      "Beautiful timer": a large SVG ring countdown with the remaining seconds as the
//           center numeral — Direction C's wall-hero rest treatment, sized for the across-room
//           glance. `RestTimer` cannot take this form.
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { getSemanticColors } from '../../../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** Static faithful re-render of the R2 RestRing — large countdown ring, no live tick. */
function RestRingSpecimen({
  totalSeconds,
  elapsedMs,
  size = 180,
}: {
  totalSeconds: number
  elapsedMs: number
  size?: number
}) {
  const remaining = Math.max(0, totalSeconds - Math.floor(elapsedMs / 1000))
  const frac = totalSeconds > 0 ? remaining / totalSeconds : 0
  const strokeWidth = 8
  const r = size / 2 - strokeWidth
  const circ = 2 * Math.PI * r
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#20232a"
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={t['brand-primary']}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text
        style={{
          fontSize: size * 0.26,
          fontWeight: '800',
          letterSpacing: -1,
          color: t['text-primary'],
        }}
      >
        {remaining}
      </Text>
      <Text
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 1.5,
          color: t['text-secondary'],
        }}
      >
        seconds
      </Text>
    </View>
  )
}

const meta: Meta<typeof RestRingSpecimen> = {
  title: 'Lab/Candidates/R2Live/RestRing',
  component: RestRingSpecimen,
  tags: ['status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Candidate visual specimen** (R2 dashboard harness → titan review). Large SVG ring ' +
          'countdown, remaining seconds as the center numeral — the wall-hero rest treatment. ' +
          'Candidate titan `RestTimer` ring variant (the real component renders a compact linear ' +
          'bar and cannot take this form). Static specimen.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof RestRingSpecimen>

export const JustStarted: Story = { args: { totalSeconds: 120, elapsedMs: 8000 } }
export const Midway: Story = { args: { totalSeconds: 120, elapsedMs: 60000 } }
export const AlmostDone: Story = { args: { totalSeconds: 120, elapsedMs: 112000 } }

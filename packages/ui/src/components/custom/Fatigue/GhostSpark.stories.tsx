import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { GhostSpark } from './GhostSpark'
import { primitiveColors } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES } from './fatigue-mock'

const PANEL_BG = primitiveColors.charcoal[800]
const PAGE_BG = primitiveColors.charcoal[900]
const t = getSemanticColors('dark')

const meta: Meta<typeof GhostSpark> = {
  title: 'Workout/Fatigue/Ghost Spark',
  component: GhostSpark,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Per-rep velocity-time sparkline: current rep solid over faded ghosts, phase-coloured zero ' +
          'axis (ecc magenta / con cyan), control-aware silver/red line tint (silver when controlled, ' +
          'dimming with tempo drift; shades of red on collapse), and the tempo tuple embedded (revealed on hover). ' +
          '`forceRevealed` pins the annotated state.',
      },
    },
  },
  argTypes: { forceRevealed: { control: 'boolean' } },
}
export default meta
type Story = StoryObj<typeof GhostSpark>

const box = (child: React.ReactNode) => (
  <View style={{ width: 400, backgroundColor: PANEL_BG, borderRadius: 12, padding: 16 }}>
    {child}
  </View>
)
const cur = FATIGUE_STATES[3].model // the full 8-rep set

/** Rest vs hover — identical geometry, only the annotations bloom. */
export const RestVsHover: Story = {
  render: () => (
    <View
      style={{
        backgroundColor: PAGE_BG,
        padding: 28,
        flexDirection: 'row',
        gap: 24,
        alignItems: 'flex-start',
      }}
    >
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 1,
            fontFamily: 'monospace',
            color: t['text-tertiary'],
          }}
        >
          RESTING (hover me)
        </Text>
        {box(
          <GhostSpark
            curves={cur.velocityCurves}
            tempoSeconds={cur.tempoSeconds}
            width={360}
            height={190}
          />
        )}
      </View>
      <View style={{ gap: 8 }}>
        <Text
          style={{
            fontSize: 9,
            letterSpacing: 1,
            fontFamily: 'monospace',
            color: t['text-tertiary'],
          }}
        >
          REVEALED
        </Text>
        {box(
          <GhostSpark
            curves={cur.velocityCurves}
            tempoSeconds={cur.tempoSeconds}
            width={360}
            height={190}
            forceRevealed
          />
        )}
      </View>
    </View>
  ),
}

/** The line tint across the set — early controlled reps stay silver, late reps go through shades of red. */
export const ControlAwareTint: Story = {
  render: () => (
    <View
      style={{
        backgroundColor: PAGE_BG,
        padding: 28,
        flexDirection: 'row',
        gap: 24,
        flexWrap: 'wrap',
      }}
    >
      {FATIGUE_STATES.map((s) => (
        <View key={s.name} style={{ gap: 8 }}>
          <Text
            style={{
              fontSize: 9,
              letterSpacing: 1,
              fontFamily: 'monospace',
              color: t['text-tertiary'],
            }}
          >
            {s.name}
          </Text>
          {box(
            <GhostSpark
              curves={s.model.velocityCurves}
              tempoSeconds={s.model.tempoSeconds}
              width={360}
              height={170}
              forceRevealed
            />
          )}
        </View>
      ))}
    </View>
  ),
}

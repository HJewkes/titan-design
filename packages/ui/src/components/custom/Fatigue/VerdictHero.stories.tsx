import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VerdictHero } from './VerdictHero'
import { Surface } from '../../ui/surface'
import { greyRamp } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'
import type { FatigueVerdictState } from './fatigue-model'

const PAGE_BG = greyRamp[975]
const t = getSemanticColors('dark')

interface StoryArgs {
  lead: 'rpe' | 'word'
  scale: 'card' | 'wall'
  state: FatigueVerdictState | 'warming-up'
  kicker: string
  notScored: boolean
  width: number
}

function modelFor(state: StoryArgs['state']) {
  const found = FATIGUE_STATES.find((s) => s.model.verdict?.state === state)
  return (found ?? { model: WARMING_UP_MODEL }).model
}

function VerdictHeroStory({ lead, scale, state, kicker, notScored, width }: StoryArgs) {
  const { rpe, verdict } = modelFor(state)
  const noVerdict = notScored
    ? { title: 'Not scored', reason: 'No bar-speed data for this set' }
    : undefined
  return (
    <Surface level="raised" className="p-inset-md" style={{ width }}>
      {lead === 'word' ? (
        <VerdictHero
          lead="word"
          verdict={verdict}
          scale={scale}
          kicker={kicker || undefined}
          noVerdict={noVerdict}
        />
      ) : (
        <VerdictHero rpe={rpe} verdict={verdict} />
      )}
    </Surface>
  )
}

const meta: Meta<StoryArgs> = {
  title: 'Custom/Fatigue/Verdict Hero',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    docs: {
      description: {
        component:
          '**Custom/Fatigue.** The focal fatigue read, in two leads. `lead="rpe"` (the Live card): a ' +
          'big tone-flooded RPE number + the verdict word, no reps-in-reserve line. `lead="word"` (a ' +
          'finished set): [StatusGlyph](?path=/docs/components-atoms-statusglyph--docs) + the verdict ' +
          'word at h3 (`card`) or h2 (`wall`), under an ' +
          '[Eyebrow](?path=/docs/components-molecules-eyebrow--docs) kicker; `notScored` shows the ' +
          'noVerdict title with its reason in the glyph tip. `verdict === null` renders a neutral ' +
          '"Warming up". The default args set the longest word on a 396px wall column, where it wraps.',
      },
    },
  },
  args: {
    lead: 'word',
    scale: 'wall',
    state: 'form-breakdown',
    kicker: 'HOW IT MOVED · WORST SET #2 · VL12%',
    notScored: false,
    width: 396,
  },
  argTypes: {
    lead: { control: 'inline-radio', options: ['rpe', 'word'] },
    scale: { control: 'inline-radio', options: ['card', 'wall'] },
    state: {
      control: 'select',
      options: ['good', 'slowing', 'grinding', 'form-breakdown', 'warming-up'],
    },
    kicker: { control: 'text' },
    notScored: { control: 'boolean' },
    width: { control: { type: 'range', min: 240, max: 640, step: 4 } },
  },
  render: (args) => <VerdictHeroStory {...args} />,
}
export default meta
type Story = StoryObj<StoryArgs>

export const Default: Story = {}

export const AcrossStates: Story = {
  // A dark-only frame: the Surface keeps VerdictHero on dark tokens in the light theme too.
  render: () => (
    <Surface
      theme="dark"
      level="background"
      style={{
        backgroundColor: PAGE_BG,
        padding: 28,
        flexDirection: 'row',
        gap: 40,
        flexWrap: 'wrap',
      }}
    >
      {[
        ...FATIGUE_STATES.map((s) => ({ name: s.name, model: s.model })),
        { name: 'WARMING UP', model: WARMING_UP_MODEL },
      ].map((s) => (
        <View key={s.name} style={{ gap: 8, width: 240 }}>
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
          <VerdictHero rpe={s.model.rpe} verdict={s.model.verdict} />
        </View>
      ))}
    </Surface>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import type { ThemeMode } from '../../theme/tokens/semantic'
import { CATEGORICAL_OPTIONS, type CategoricalOptionId } from './categorical-options'
import { OptionCard } from './CategoricalOptionsView'

type OptionFilter = 'all' | CategoricalOptionId
type ModeFilter = 'both' | ThemeMode

interface Args {
  option: OptionFilter
  mode: ModeFilter
}

const MODES: readonly ThemeMode[] = ['light', 'dark']

function visible({ option, mode }: Args) {
  return CATEGORICAL_OPTIONS.filter(
    (candidate) => option === 'all' || candidate.id === option
  ).flatMap((candidate) =>
    MODES.filter((m) => mode === 'both' || m === mode).map((m) => ({ option: candidate, mode: m }))
  )
}

/**
 * TD-759 option set for the categorical palette round. Each option is one card per mode: the seven
 * fills on every plane (✗ under 3:1, ✗✗ under 2:1), the three label modes on top of them on
 * `surface-base` (AA 4.5, lg 3.0), the three dichromacy rows with the all-pairs minimum ΔE through
 * slot 5 and its weakest pair, and the console and agents shell accents on both shell planes.
 * Every number is measured from `categorical-options.ts`, so a changed step re-measures.
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Categorical Options',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { option: 'all', mode: 'both' },
  argTypes: {
    option: { control: 'select', options: ['all', ...CATEGORICAL_OPTIONS.map((o) => o.id)] },
    mode: { control: 'inline-radio', options: ['both', 'light', 'dark'] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-759 option set). Plain swatches, no composed components. Contrast is ' +
          'WCAG 2.x; CVD ΔE is OKLab ×100 after Machado-2009 simulation with `cvdDelta` unclamped, as ' +
          '`token-cvd.test.ts` gates it (floor 8 for deutan and protan; tritan printed). Labels: white, ' +
          'ink (`on-data-strong`) and one ramp step per hue, the step that labels the most slots at AA. ' +
          'Fills, labels and planes are inline hexes under test. `option` picks one option, `mode` one mode.',
      },
    },
  },
  render: function Render(args) {
    const cards = visible(args)
    return (
      <View className="gap-4 p-2">
        {cards.length === 0 ? (
          <Text className="text-sm text-text-primary">Nothing to show for these controls.</Text>
        ) : (
          cards.map(({ option, mode }) => (
            <OptionCard key={`${option.id}-${mode}`} option={option} mode={mode} />
          ))
        )}
      </View>
    )
  },
}
export default meta
type Story = StoryObj<Args>

/** Every option, both modes: `lab-decisions-categorical-options--default`. */
export const Default: Story = {}

/** O1, main today: `lab-decisions-categorical-options--current`. */
export const Current: Story = { args: { option: 'O1-current' } }

/** O2, B′ as PR #794 variant A: `lab-decisions-categorical-options--b-prime`. */
export const BPrime: Story = { args: { option: 'O2-bprime' } }

/** O3, solid-derived: `lab-decisions-categorical-options--solid`. */
export const Solid: Story = { args: { option: 'O3-solid' } }

/** O4, subtle-derived tints: `lab-decisions-categorical-options--subtle`. */
export const Subtle: Story = { args: { option: 'O4-subtle' } }

/** O5, the TD-757 ink tier: `lab-decisions-categorical-options--ink`. */
export const Ink: Story = { args: { option: 'O5-ink' } }

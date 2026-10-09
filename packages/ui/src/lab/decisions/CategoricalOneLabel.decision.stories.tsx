import type { Meta, StoryObj } from '@storybook/react-vite'
import { D3_OPTIONS, D4_OPTIONS } from './categorical-one-label'
import { OptionFrame } from './CategoricalOneLabelView'

const d3 = (id: string) => D3_OPTIONS.filter((o) => o.id === id)
const BOTH = ['normal', 'deuteranopia'] as const

/**
 * Surface-system plan S3, sibling of `Lab/Decisions/Categorical Light vs Dark` (TD-757): the
 * categorical sets under the one-label rule, one story per option so each sits beside its own
 * question.
 */
const meta: Meta = {
  title: 'Lab/Decisions/Categorical One Label',
  tags: ['autodocs', 'status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (surface-system plan S3; D3, D4). Each option is one set with one label ' +
          'colour for every slot in its mode: bars with in-fill labels, a legend and a line, under ' +
          'normal vision and deuteranopia (Machado 2009, severity 1.0). Label ratios are WCAG 2.x on ' +
          'the fill; CVD ΔE is OKLab ×100, worst of deutan and protan over slots 0-5, the CI ' +
          "gate's convention. A label under its floor is left off the fill and its ratio printed. " +
          'No token changes.',
      },
    },
  },
}
export default meta
type Story = StoryObj

/** D3 option L-a (default): W2 with white labels. */
export const D3W2WhiteLabels: Story = {
  render: () => <OptionFrame options={d3('w2')} visions={BOTH} />,
}

/** D3 option L-b: B′ (#794) with its best single label, on-data-strong, at the 3:1 floor. */
export const D3BPrimeLabelFloor: Story = {
  render: () => <OptionFrame options={d3('bprime-floor')} visions={BOTH} />,
}

/** D3 option L-c: B′ (#794) with labels outside the fill. */
export const D3BPrimeNoInFillLabels: Story = {
  render: () => <OptionFrame options={d3('bprime-outside')} visions={BOTH} />,
}

/** D4: the dark label, on-data-strong against grey[950] (and grey[950] with magenta[400]). */
export const D4DarkLabel: Story = {
  render: () => <OptionFrame options={D4_OPTIONS} visions={['normal']} />,
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { KnowledgeClassLabel } from './KnowledgeClassLabel'
import { KNOWLEDGE_CLASS_ORDER } from './knowledge-class'

const meta: Meta<typeof KnowledgeClassLabel> = {
  title: 'Custom/ActiveWork/KnowledgeClassLabel',
  component: KnowledgeClassLabel,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { knowledgeClass: 'note', isPlural: false, dotOnly: false },
  argTypes: {
    knowledgeClass: {
      control: 'select',
      options: [...KNOWLEDGE_CLASS_ORDER, 'notes', 'nested_sources', 'artifact'],
      description:
        'A class, a plural wire name, or an unknown name (`artifact`) that renders as given.',
    },
    isPlural: { control: 'boolean' },
    dotOnly: { control: 'boolean' },
  },
  parameters: {
    docs: {
      description: {
        component:
          '**Molecule.** A record class as a categorical dot plus its name, the one owner of the class ' +
          'vocabulary (`knowledge-class.ts`). Composes ' +
          '[Indicator](?path=/docs/components-atoms-indicator--docs) and ' +
          '[Typography](?path=/docs/foundations-typography--docs). `nested_source` and `transcript` share ' +
          'the sixth categorical token because no view shows both; the name always tells them apart. ' +
          'No loading, empty, error or disabled state: it renders a value it is given and takes no input; ' +
          'an unknown class shows its raw name beside a neutral dot.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof KnowledgeClassLabel>

export const Default: Story = {}

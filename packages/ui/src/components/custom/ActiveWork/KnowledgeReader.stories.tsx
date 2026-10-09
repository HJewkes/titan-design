import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Surface } from '../../ui/surface'
import { KnowledgeReader, type KnowledgeReaderProps } from './KnowledgeReader'
import type { KnowledgeDocument } from './knowledge-document'
import {
  DOCUMENT_BINARY,
  DOCUMENT_EMPTY_BODY,
  DOCUMENT_JSON,
  DOCUMENT_TRUNCATED,
  NOTE_DOCUMENT,
  SOURCE_DOCUMENT_LONG,
  SOURCE_DOCUMENT_TABLES,
} from './knowledge-document-fixture'
import { KNOWLEDGE_NOW } from './knowledge-fixture'

const DOCUMENTS: Record<string, KnowledgeDocument | undefined> = {
  note: NOTE_DOCUMENT,
  tables: SOURCE_DOCUMENT_TABLES,
  long: SOURCE_DOCUMENT_LONG,
  truncated: DOCUMENT_TRUNCATED,
  'empty body': DOCUMENT_EMPTY_BODY,
  json: DOCUMENT_JSON,
  binary: DOCUMENT_BINARY,
  none: undefined,
}

type StoryArgs = Omit<KnowledgeReaderProps, 'document'> & { documentKey: string }

// Storybook maps a key to its fixture; composeStories (the smoke test) passes the key through.
const pick = (value: string | KnowledgeDocument | undefined) =>
  typeof value === 'string' ? DOCUMENTS[value] : value

const meta: Meta<StoryArgs> = {
  title: 'Custom/ActiveWork/KnowledgeReader',
  component: KnowledgeReader as unknown as Meta<StoryArgs>['component'],
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { documentKey: 'note', now: KNOWLEDGE_NOW, isLoading: false },
  argTypes: {
    documentKey: {
      name: 'document',
      control: 'select',
      options: Object.keys(DOCUMENTS),
      mapping: DOCUMENTS,
    },
    isLoading: { control: 'boolean' },
    metaLayout: { control: 'inline-radio', options: ['inline', 'split'] },
    now: { table: { disable: true } },
    onPressInitiative: { control: false },
    onPressTag: { control: false },
    onPressTask: { control: false },
    onPressLink: { control: false },
    onPressPr: { control: false },
    actions: { control: false },
    emptyState: { control: false },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6">
        <View className="w-full max-w-[760px]">
          <Story />
        </View>
      </Surface>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Organism.** One note or source under a metadata header: title, an eyebrow of initiative, ' +
          'record and kind (a note kind as icon + label), date and tags on one line, and the file’s text. ' +
          '`SplitMetadata` right-aligns the record and kind and the date, for comparison. Composes ' +
          '[Card](?path=/docs/components-molecules-card--docs), ' +
          '[Typography](?path=/docs/foundations-typography--docs), ' +
          '[Pill](?path=/docs/components-atoms-pill--docs), ' +
          '[DateTime](?path=/docs/components-atoms-datetime--docs), ' +
          '[Alert](?path=/docs/components-molecules-alert--docs), ' +
          '[EmptyState](?path=/docs/components-molecules-emptystate--docs), ' +
          '[Skeleton](?path=/docs/components-atoms-skeleton--docs) and ' +
          '[MarkdownProse](?path=/docs/custom-prose-markdownprose--docs), with the session linkers for task ids, ' +
          '`[[name]]` links and PR numbers. Loading: `isLoading` swaps the card for skeleton lines. ' +
          'Empty: no `document` renders `emptyState`, by default “Select a note or source”; an empty body ' +
          'reads “This file has no text”. Error: a truncated read shows an info `Alert` with the byte count, ' +
          'and a file type with no preview shows an `EmptyState` with its path; a failed or missing read is ' +
          'the host’s `Alert`, passed as `emptyState`. No disabled state: the reader is read-only and not a control.',
      },
    },
  },
  render: function Render({ documentKey, ...args }) {
    return <KnowledgeReader {...args} document={pick(documentKey)} />
  },
}
export default meta

type Story = StoryObj<StoryArgs>

export const Default: Story = {}

/** The right-aligned variant, for comparison with `Default`: record and kind, and the date, at the right edge. */
export const SplitMetadata: Story = { args: { metaLayout: 'split' } }

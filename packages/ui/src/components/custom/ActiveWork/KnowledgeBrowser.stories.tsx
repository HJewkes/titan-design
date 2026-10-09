import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert'
import { Surface } from '../../ui/surface'
import { KnowledgeList } from './KnowledgeList'
import { KnowledgeReader } from './KnowledgeReader'
import { KNOWLEDGE_DOCUMENTS } from './knowledge-document-fixture'
import { uniqueKnowledge, type KnowledgeItem } from './knowledge-filters'
import { KNOWLEDGE_ITEMS, KNOWLEDGE_NOW } from './knowledge-fixture'

interface BrowserArgs {
  items: KnowledgeItem[]
  now: number
  isLoading: boolean
  onPressInitiative: (initiative: string) => void
  onPressTask: (id: string) => void
  onPressLink: (name: string) => void
  onPressPr: (number: number) => void
}

const DOCUMENT_ITEMS = KNOWLEDGE_DOCUMENTS.map((document) => document.item)

function MissingDocument({ title }: { title: string }) {
  return (
    <Alert status="error" testID="knowledge-missing">
      <AlertTitle>This file could not be read</AlertTitle>
      <AlertDescription>{`${title} has no text in the host’s store.`}</AlertDescription>
    </Alert>
  )
}

/**
 * The list beside the reader the way the console lays them out: the host owns the
 * selection, finds the document for the selected item, and passes a missing one
 * to the reader as an `Alert`. There is deliberately no `KnowledgeBrowser`
 * organism; this story is the reference composition.
 */
function KnowledgeBrowser({ items, now, isLoading, ...handlers }: BrowserArgs) {
  const all = useMemo(() => uniqueKnowledge([...DOCUMENT_ITEMS, ...items]), [items])
  const [selectedId, setSelectedId] = useState<string | undefined>(DOCUMENT_ITEMS[0]?.id)
  const selected = all.find((item) => item.id === selectedId)
  const document = KNOWLEDGE_DOCUMENTS.find((d) => d.item.id === selectedId)
  return (
    <View className="flex-row items-start gap-4">
      <KnowledgeList
        className="min-w-0 flex-1"
        items={all}
        now={now}
        isLoading={isLoading}
        selectedId={selectedId}
        onSelectedIdChange={setSelectedId}
        table={{ hideColumns: ['record', 'tags'] }}
      />
      <KnowledgeReader
        {...handlers}
        className="min-w-0 flex-1"
        document={document}
        now={now}
        isLoading={isLoading}
        emptyState={selected && !document ? <MissingDocument title={selected.title} /> : undefined}
      />
    </View>
  )
}

const meta: Meta<BrowserArgs> = {
  title: 'Custom/ActiveWork/KnowledgeBrowser',
  component: KnowledgeBrowser,
  tags: ['autodocs', 'status:candidate', '!status:review'],
  args: { items: KNOWLEDGE_ITEMS, now: KNOWLEDGE_NOW, isLoading: false },
  argTypes: {
    items: { table: { disable: true } },
    now: { table: { disable: true } },
    isLoading: { control: 'boolean' },
    onPressInitiative: { action: 'onPressInitiative' },
    onPressTask: { action: 'onPressTask' },
    onPressLink: { action: 'onPressLink' },
    onPressPr: { action: 'onPressPr' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6">
        <View className="w-full max-w-[1200px]">
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
          '**Composition.** Composes **KnowledgeList** (→ KnowledgeRow, Table) · **KnowledgeReader** ' +
          '(→ MarkdownProse, Card, Pill, DateTime). The host owns the selection and the document store: the ' +
          'six items that have a document open in the reader; any other row shows the host’s “could not be ' +
          'read” `Alert`, which is how a missing document reads. `isLoading` puts both halves in their loading ' +
          'state. See [KnowledgeList](?path=/docs/custom-activework-knowledgelist--docs) and ' +
          '[KnowledgeReader](?path=/docs/custom-activework-knowledgereader--docs).',
      },
    },
  },
}
export default meta

type Story = StoryObj<BrowserArgs>

/** The first document is open; pick a row without a document to see the missing-file alert. */
export const Default: Story = {}

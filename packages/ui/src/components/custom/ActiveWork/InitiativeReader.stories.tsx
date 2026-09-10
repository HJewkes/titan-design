import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Card } from '../../ui/card'
import { Surface } from '../../ui/surface'
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '../../ui/tabs'
import { InitiativeHeader } from './InitiativeHeader'
import { InitiativeBrief, type InitiativeBriefData } from './InitiativeBrief'
import { OpenLoops, type OpenLoop } from './OpenLoops'
import { SessionList } from './SessionList'
import { TaskTable } from './TaskTable'
import type { TaskListItem } from './TaskRow'
import { sessionLinkers } from './session-linkers'
import { SESSION_FIXTURE, SESSION_NOW } from './session-fixture'
import {
  INITIATIVE_BRIEF_FIXTURE,
  INITIATIVE_LOOPS_FIXTURE,
  INITIATIVE_NOW,
  INITIATIVE_TASKS_FIXTURE,
} from './initiative-fixture'

interface ReaderArgs {
  brief: InitiativeBriefData
  loops: OpenLoop[]
  tasks: TaskListItem[]
  now: number
  onPressTask: (id: string) => void
  onPressLink: (name: string) => void
  onPressPr: (number: number) => void
}

/**
 * The pieces composed the way a host would: identity header, then the open
 * loops (the durable current state), then the brief beside the tasks and
 * recent sessions. There is deliberately no `InitiativeReader` organism; this
 * story is the reference composition.
 */
function InitiativeReader({
  brief,
  loops,
  tasks,
  now,
  onPressTask,
  onPressLink,
  onPressPr,
}: ReaderArgs) {
  const linkers = sessionLinkers({ onPressTask, onPressLink, onPressPr })
  // A default Card already resolves the card plane from the page it is on and wears the lift.
  // A `bg-*` className here would be silently discarded — Card writes its plane into `style`.
  const cardClass = 'gap-1 p-4'
  // A tab strip is the card's header: its own py-2 is the whole gap above the labels, so the card gives none.
  const tabCardClass = `min-w-[360px] flex-1 ${cardClass} pt-2`
  return (
    <View className="gap-4">
      <InitiativeHeader
        title={brief.title}
        slug={brief.slug}
        state={brief.state as never}
        rank={brief.rank ?? undefined}
        shipTarget={brief.shipTarget ?? undefined}
        updated={brief.updated}
      />
      <Card className={cardClass} testID="reader-card">
        <OpenLoops loops={loops} now={now} linkers={linkers} />
      </Card>
      <View className="flex-row flex-wrap items-start gap-4">
        <Card className={`min-w-[360px] flex-1 ${cardClass}`} testID="reader-card">
          <InitiativeBrief brief={brief} linkers={linkers} />
        </Card>
        <Card className={tabCardClass} testID="reader-card">
          <Tabs defaultIndex={0}>
            <TabList>
              <Tab>{`Tasks (${tasks.length})`}</Tab>
              <Tab>{`Sessions (${SESSION_FIXTURE.length})`}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <TaskTable tasks={tasks} now={now} hideLegend hideColumns={['slug']} label=" " />
              </TabPanel>
              <TabPanel>
                <SessionList sessions={SESSION_FIXTURE} now={SESSION_NOW} label=" " />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Card>
      </View>
    </View>
  )
}

/**
 * **M2 · Initiative reader** — one initiative's durable state: the identity
 * header, the open loops from the session ledger, the brief in collapsible
 * sections, and its open tasks and recent sessions.
 *
 * Composes `InitiativeHeader` · `OpenLoops` · `InitiativeBrief` · `TaskTable`
 * · `SessionList`, all over `MarkdownProse` and the session linkers.
 */
const meta: Meta<ReaderArgs> = {
  title: 'Custom/ActiveWork/InitiativeReader',
  component: InitiativeReader,
  tags: ['autodocs'],
  args: {
    brief: INITIATIVE_BRIEF_FIXTURE,
    loops: INITIATIVE_LOOPS_FIXTURE,
    tasks: INITIATIVE_TASKS_FIXTURE,
    now: INITIATIVE_NOW,
  },
  argTypes: {
    brief: { table: { disable: true } },
    loops: { table: { disable: true } },
    tasks: { table: { disable: true } },
    now: { table: { disable: true } },
    onPressTask: { action: 'onPressTask' },
    onPressLink: { action: 'onPressLink' },
    onPressPr: { action: 'onPressPr' },
  },
  decorators: [
    (Story) => (
      <Surface level="base" className="min-h-screen p-6" testID="page-surface">
        <Story />
      </Surface>
    ),
  ],
  parameters: {
    // Fullscreen: the page Surface is the host plane every card lifts off, so it owns the frame.
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Composes **InitiativeHeader** · **OpenLoops** · **InitiativeBrief** · **TaskTable** · **SessionList**, over **MarkdownProse** and the session linkers. The host owns layout.',
      },
    },
  },
}
export default meta

type Story = StoryObj<ReaderArgs>

/** The active-work initiative: five open loops, four open tasks, its v0.1 brief. */
export const Default: Story = {}

/** A quiet initiative: no open loops, so the section reads its empty state. */
export const NoOpenLoops: Story = {
  args: { loops: [] },
}

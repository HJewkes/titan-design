import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { Card } from '../../ui/card'
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
  // Content-level cards sit one tone up from the page (surface-raised, the card plane) with a
  // hairline, per the family's depth model — tone first, then hairline, never a heavy border.
  const cardClass = 'gap-1 bg-surface-raised p-4'
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
      <Card variant="subtle" className={cardClass}>
        <OpenLoops loops={loops} now={now} linkers={linkers} />
      </Card>
      <View className="flex-row flex-wrap items-start gap-4">
        <Card variant="subtle" className={`min-w-[360px] flex-1 ${cardClass}`}>
          <InitiativeBrief brief={brief} linkers={linkers} />
        </Card>
        <Card variant="subtle" className={`min-w-[360px] flex-1 ${cardClass}`}>
          <Tabs defaultIndex={0}>
            <TabList>
              <Tab>{`Tasks (${tasks.length})`}</Tab>
              <Tab>{`Sessions (${SESSION_FIXTURE.length})`}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <View className="pt-3">
                  <TaskTable tasks={tasks} now={now} hideLegend hideColumns={['slug']} label=" " />
                </View>
              </TabPanel>
              <TabPanel>
                <View className="pt-3">
                  <SessionList sessions={SESSION_FIXTURE} now={SESSION_NOW} label=" " />
                </View>
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
  title: 'Custom/ActiveWork/Initiative Reader',
  component: InitiativeReader,
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
  parameters: {
    // Top-anchored: the global `centered` layout would re-centre the reader as sections expand and collapse.
    layout: 'padded',
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

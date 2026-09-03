import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { View } from 'react-native'
import { SessionDetail } from './SessionDetail'
import { SessionList } from './SessionList'
import type { SessionSummary } from './SessionListItem'
import { SESSION_FIXTURE, SESSION_NOW, SESSION_TASK_FIXTURE } from './session-fixture'
import type { TaskListItem } from './TaskRow'

interface ReaderArgs {
  sessions: SessionSummary[]
  /** The host's task store; the detail looks its touched ids up here. */
  tasks: TaskListItem[]
  now: number
  onPressTask: (id: string) => void
  onPressLink: (name: string) => void
  onPressPr: (number: number) => void
}

/**
 * The two halves composed the way a host would: the host owns `selectedId`
 * and lays the list beside the detail. There is deliberately no
 * `SessionReader` organism; this story is the reference composition.
 */
function SessionReader({ sessions, tasks, now, onPressTask, onPressLink, onPressPr }: ReaderArgs) {
  const [selectedId, setSelectedId] = useState(sessions[0]?.id)
  const selected = sessions.find((s) => s.id === selectedId) ?? sessions[0]
  return (
    <View className="flex-row gap-4">
      <SessionList
        className="w-72"
        sessions={sessions}
        now={now}
        selectedId={selected?.id}
        onSelect={(s) => setSelectedId(s.id)}
      />
      {selected ? (
        <SessionDetail
          className="flex-1"
          session={selected}
          tasks={tasks}
          now={now}
          onPressTask={onPressTask}
          onPressLink={onPressLink}
          onPressPr={onPressPr}
        />
      ) : null}
    </View>
  )
}

/**
 * **M1 · Session reader** — a selectable list of session logs beside the
 * selected log, rendered as prose with task ids, `[[name]]` links and PR
 * numbers auto-linked.
 *
 * Composes `SessionList` (→ `SessionListItem`) and `SessionDetail`
 * (→ `MarkdownProse`). Selection lives in the host.
 */
const meta: Meta<ReaderArgs> = {
  title: 'Custom/ActiveWork/Session Reader',
  component: SessionReader,
  args: {
    sessions: SESSION_FIXTURE,
    tasks: SESSION_TASK_FIXTURE,
    now: SESSION_NOW,
  },
  argTypes: {
    sessions: { table: { disable: true } },
    tasks: { table: { disable: true } },
    now: { table: { disable: true } },
    onPressTask: { action: 'onPressTask' },
    onPressLink: { action: 'onPressLink' },
    onPressPr: { action: 'onPressPr' },
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[1100px] p-4">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Composes **SessionList** (→ SessionListItem) · **SessionDetail** (→ MarkdownProse, Card, Divider, Pill, DateTime). The host owns selection.',
      },
    },
  },
}
export default meta

type Story = StoryObj<ReaderArgs>

/** Six real sessions, newest first; the newest is selected. */
export const Default: Story = {}

/** A single session, so the list and detail read without neighbours. */
export const OneSession: Story = {
  args: { sessions: SESSION_FIXTURE.slice(0, 1) },
}

/** No task store: the tasks-touched strip stays pills with no table toggle. */
export const WithoutTaskStore: Story = {
  args: { tasks: [] },
}

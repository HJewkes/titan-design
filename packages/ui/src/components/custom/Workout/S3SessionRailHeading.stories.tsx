/**
 * SHEET · Session Rail Heading — the always-shown exercise heading unit, in isolation.
 * Locked: name row + indicator · tight sets/reps/load (tempo language) + tempo · per-set segmented strip
 * (completed colored · active pulse + grey remainder · upcoming grey). OPEN: strip height · indicator taxonomy
 * · rep-range treatment · set-types (drop/myo). See DECISIONS-ExerciseRow doc.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heading, INSET, INSET_SHADOW, Page, monoTag, reps, type Exercise } from './setHeadingKit'

const DONE: Exercise = {
  name: 'Seated Cable Row',
  sets: 5,
  reps: 8,
  load: 145,
  tempo: [3, 1, 2, 0],
  indicator: 'pr',
  setStates: [1.0, 0.9, 0.8, 0.7, 0.6].map((s) => ({ status: 'done', reps: reps(8, s) })),
}
const ACTIVE: Exercise = {
  name: 'Cable Chest Press',
  sets: 3,
  reps: 10,
  load: 90,
  tempo: [2, 1, 2, 0],
  indicator: 'info',
  setStates: [
    { status: 'done', reps: reps(10, 0.72) },
    { status: 'active', reps: reps(5, 0.62), planned: 10 },
    { status: 'todo', planned: 10 },
  ],
}
const UPCOMING: Exercise = {
  name: 'Standing Calf Raise',
  sets: 5,
  reps: 20,
  load: 25,
  tempo: [2, 1, 2, 0],
  upcoming: true,
  setStates: [1, 2, 3, 4, 5].map(() => ({ status: 'todo', planned: 20 })),
}
const RANGE: Exercise = {
  name: 'Face Pull',
  sets: 3,
  reps: '15-20',
  load: 40,
  tempo: [2, 1, 2, 0],
  setStates: [1, 2, 3].map(() => ({ status: 'todo', planned: 18 })),
}

// a heading on the sunk inset surface, at the real rail width
function Row({ ex, h }: { ex: Exercise; h: number }) {
  return (
    <div style={{ width: 246, background: INSET, boxShadow: INSET_SHADOW }}>
      <Heading ex={ex} stripH={h} />
    </div>
  )
}

type Args = { stripHeight: number }
const meta: Meta<Args> = {
  title: 'Lab/Explorations/Session Rail Heading',
  parameters: { layout: 'fullscreen' },
  argTypes: { stripHeight: { control: { type: 'range', min: 3, max: 14, step: 1 } } },
  args: { stripHeight: 8 },
}
export default meta
type Story = StoryObj<Args>

export const States: Story = {
  name: 'Heading · states + heights',
  render: (args) => (
    <Page
      title="Session rail heading — the exercise unit"
      note="The always-shown heading: name + indicator · tight sets/reps/load (tempo language) + tempo · per-set strip. Left column = the three states at the current height; right = the completed heading across 4 / 6 / 8 / 10px."
    >
      <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(
            [
              ['completed', DONE],
              ['active (pulsing)', ACTIVE],
              ['upcoming', UPCOMING],
              ['rep range', RANGE],
            ] as [string, Exercise][]
          ).map(([lbl, ex]) => (
            <div key={lbl} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={monoTag}>{lbl}</span>
              <Row ex={ex} h={args.stripHeight} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[4, 6, 8, 10].map((h) => (
            <div key={h} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={monoTag}>strip {h}px</span>
              <Row ex={DONE} h={h} />
            </div>
          ))}
        </div>
      </div>
    </Page>
  ),
}

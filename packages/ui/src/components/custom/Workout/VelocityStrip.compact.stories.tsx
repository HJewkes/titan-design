import type { Meta, StoryObj } from '@storybook/react-vite'
import { VelocityStrip } from './VelocityStrip'
import {
  Sheet,
  Note,
  ScenarioPair,
  SetTypeBoard,
  RepTypeBoard,
  REP_SET,
  REP_SET_LAGGING,
  FATIGUE_SET,
  FATIGUE_SET_LAGGING,
} from './velocity-story-kit'

/**
 * `compact` — the flat resting strip. SetBarChart in flat mode: uniform short
 * bars, no labels, no axis. The glance used in the SetRow table and on cards,
 * where the bar is colour-encoded rather than height-encoded.
 *
 * The compact dual FOLDS into one footprint rather than stacking to 2x: each
 * rep column splits at the centre into an L top pill and an R bottom pill.
 * Because resting bars carry their meaning in colour, the pair costs the same
 * vertical space as a single — 2x is only forced for the value-height expanded.
 */
const meta: Meta<typeof VelocityStrip> = {
  title: 'Workout/DataViz/VelocityStrip/Compact',
  component: VelocityStrip,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof VelocityStrip>

export const Default: Story = {
  name: 'Default',
  render: () => (
    <Sheet>
      <Note>
        The representative set at rest. Single fills its plot; the dual folds the same reps into
        rounded L/R pills sharing that footprint.
      </Note>
      <ScenarioPair
        view="compact"
        title="Default"
        single={REP_SET}
        left={REP_SET}
        right={REP_SET_LAGGING}
      />
    </Sheet>
  ),
}

export const SetTypes: Story = {
  name: 'Set Types',
  render: () => (
    <Sheet>
      <Note>
        The full set-type vocabulary at resting scale. The chunk-notch still separates drop
        sub-loads even when every bar is the same height.
      </Note>
      <SetTypeBoard view="compact" />
    </Sheet>
  ),
}

export const FatigueDecline: Story = {
  name: 'Fatigue Decline',
  render: () => (
    <Sheet>
      <Note>
        Loss colouring is the default: each bar is coloured by its drop from the set&apos;s own
        best, so a fatiguing set reads green-to-red regardless of absolute speed. At compact scale
        this colour IS the signal — there is no height to read.
      </Note>
      <ScenarioPair
        view="compact"
        title="Fatigue decline"
        single={FATIGUE_SET}
        left={FATIGUE_SET}
        right={FATIGUE_SET_LAGGING}
        barColor="loss"
      />
    </Sheet>
  ),
}

export const EmptyColdBoot: Story = {
  name: 'Empty / Cold Boot',
  render: () => (
    <Sheet>
      <Note>
        Before the first rep lands. A planned set draws its upcoming reps, so the strip holds both
        its footprint AND its column count — nothing reflows when rep one arrives.
      </Note>
      <ScenarioPair
        view="compact"
        title="Cold boot · 6 planned, none logged"
        singleSet={{ type: 'straight', velocities: [], planned: 6 }}
        leftSet={{ type: 'straight', velocities: [], planned: 6 }}
        rightSet={{ type: 'straight', velocities: [], planned: 6 }}
      />
      <ScenarioPair
        view="compact"
        title="Truly empty · no plan to draw"
        note="No planned count either — the only case where there is nothing to hold."
        single={[]}
        left={[]}
        right={[]}
      />
    </Sheet>
  ),
}

export const DualLaggingSide: Story = {
  name: 'Dual · Lagging Side',
  render: () => (
    <Sheet>
      <Note>
        Index-locked: the right slot has logged fewer reps, so its trailing columns render as faint
        empties directly under the left&apos;s. Columns never shift — the next rep a lagging side
        performs lands in its own column.
      </Note>
      <ScenarioPair
        view="compact"
        title="Equal counts · the common case"
        note="Both slots logged the same reps. This is what most of a session looks like."
        single={REP_SET}
        left={REP_SET}
        right={[0.93, 0.88, 0.84, 0.78, 0.7]}
      />
      <ScenarioPair
        view="compact"
        title="Missed rep · lower slot"
        note="Rep 3 missing from the LOWER slot — its column holds as a faint empty."
        single={REP_SET}
        left={REP_SET}
        right={[0.93, 0.88, 0.78, 0.7]}
      />
      <ScenarioPair
        view="compact"
        title="Missed rep · upper slot"
        note="The mirror: the UPPER slot is short a rep."
        single={REP_SET}
        left={[0.95, 0.9, 0.8, 0.72]}
        right={[0.93, 0.88, 0.84, 0.78, 0.7]}
      />
      <ScenarioPair
        view="compact"
        title="One slot well behind"
        single={REP_SET}
        left={REP_SET}
        right={REP_SET_LAGGING.slice(0, 2)}
      />
    </Sheet>
  ),
}

export const Responsive: Story = {
  name: 'Responsive',
  render: () => (
    <Sheet width={520}>
      <Note>
        Compact degrades by WIDTH, not height — the bar layout is shared geometry, so bars and gaps
        scale together and the chunk-notch stays proportional.
      </Note>
      {[440, 300, 180, 110].map((w) => (
        <ScenarioPair
          key={w}
          view="compact"
          title={`${w}px`}
          width={w}
          single={REP_SET}
          left={REP_SET}
          right={REP_SET_LAGGING}
        />
      ))}
    </Sheet>
  ),
}

export const RepTypes: Story = {
  name: 'Rep Types',
  render: () => (
    <Sheet>
      <Note>
        Every state a rep column can be in at resting scale. Colour is the only channel compact has,
        so a state that needs height to read must find another way here.
      </Note>
      <RepTypeBoard view="compact" />
    </Sheet>
  ),
}

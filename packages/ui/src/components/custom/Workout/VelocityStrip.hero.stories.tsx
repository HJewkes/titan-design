import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { VelocityStrip, DualVelocityStrip } from './VelocityStrip'
import {
  Sheet,
  Note,
  ViewLabel,
  ScenarioPair,
  SetTypeBoard,
  RepTypeBoard,
  REP_SET,
  REP_SET_LAGGING,
  FATIGUE_SET,
  FATIGUE_SET_LAGGING,
  IN_PROGRESS_SET,
  IN_PROGRESS_LAGGING,
  wallDecorator,
} from './velocity-story-kit'

/**
 * `hero` — the across-the-room wall treatment. Tall bars, per-bar value labels,
 * a dashed running-best reference line, and dashed placeholders for the reps
 * still to come via `targetReps`.
 *
 * No horizontal axis: the single baseline and the dual centre axis were both
 * removed. The dual hero is two composed heroes — an up-oriented strip over a
 * mirrored down-oriented one — separated by the same 2px gap the expanded rail
 * uses, so the pair reads as one lockup without needing a rule between them.
 *
 * A live hero should run `scale="fixed"` so bar heights stay comparable across
 * sets and do not reflow as each rep lands.
 */
const meta: Meta<typeof VelocityStrip> = {
  title: 'Workout/DataViz/VelocityStrip/Hero',
  component: VelocityStrip,
  tags: ['autodocs'],
}
export default meta
type Story = StoryObj<typeof VelocityStrip>

export const Default: Story = {
  name: 'Default',
  render: () => (
    <Sheet width={700}>
      <Note>The representative set on the wall — same data, same geometry, wall scale.</Note>
      <ScenarioPair
        view="hero"
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
    <Sheet width={700}>
      <Note>The set-type vocabulary at wall scale, each type paired single above dual.</Note>
      <SetTypeBoard view="hero" />
    </Sheet>
  ),
}

export const InProgress: Story = {
  name: 'In Progress',
  render: () => (
    <Sheet width={700}>
      <Note>
        4 of 8 done, newest bar live, the remaining four drawn as dashed placeholders. Fixed scale,
        so nothing reflows as reps land.
      </Note>
      <ScenarioPair
        view="hero"
        title="Mid set"
        single={IN_PROGRESS_SET}
        left={IN_PROGRESS_SET}
        right={IN_PROGRESS_LAGGING}
        scale="fixed"
        targetReps={8}
        liveRepIndex={3}
      />
    </Sheet>
  ),
}

export const FatigueDecline: Story = {
  name: 'Fatigue Decline',
  render: () => (
    <Sheet width={700}>
      <Note>
        A hard decline with loss colouring and the VL bands — the reading the wall exists to make
        obvious from across the room.
      </Note>
      <ScenarioPair
        view="hero"
        title="Fatigue decline"
        single={FATIGUE_SET}
        left={FATIGUE_SET}
        right={FATIGUE_SET_LAGGING}
        scale="fixed"
        barColor="loss"
      />
    </Sheet>
  ),
}

export const EmptyColdBoot: Story = {
  name: 'Empty / Cold Boot',
  render: () => (
    <Sheet width={700}>
      <Note>
        Cold boot: the set is planned but no rep has landed. Placeholders carry the shape so the
        wall is never blank mid-session.
      </Note>
      <ScenarioPair
        view="hero"
        title="Zero reps · 8 planned"
        single={[]}
        left={[]}
        right={[]}
        scale="fixed"
        targetReps={8}
      />
    </Sheet>
  ),
}

export const DualLaggingSide: Story = {
  name: 'Dual · Lagging Side',
  render: () => (
    <Sheet width={700}>
      <Note>
        Index-locked empties at wall scale — the lagging slot&apos;s gaps sit directly under the
        leading slot&apos;s reps, so the imbalance is the thing you see.
      </Note>
      <ScenarioPair
        view="hero"
        title="Lagging right"
        single={REP_SET}
        left={REP_SET}
        right={REP_SET_LAGGING.slice(0, 2)}
        scale="fixed"
      />
    </Sheet>
  ),
}

export const Responsive: Story = {
  name: 'Responsive',
  render: () => (
    <Sheet width={760}>
      <Note>
        HEIGHT first. The side labels are sized to the WING, not the chart, so the collapse
        threshold is per-wing: below 70px of wing extent a slot name degrades to its initial. A dual
        splits its height into two wings, so the ladder below crosses that boundary between 160 and
        120 — at 120 the names are &quot;L&quot; / &quot;R&quot;. Dashed VL lines and washes always
        survive; only their labels go.
      </Note>
      {[220, 160, 140, 120, 90].map((h) => (
        <View key={h} style={{ gap: 8 }}>
          <ViewLabel text={`${h}px · wings ${Math.round((h - 2) / 2)}px each`} />
          <DualVelocityStrip
            left={{ velocities: REP_SET, label: 'Left' }}
            right={{ velocities: REP_SET_LAGGING, label: 'Right' }}
            variant="hero"
            height={h}
            scale="fixed"
          />
        </View>
      ))}

      <Note>
        Then WIDTH. Bars and gaps come from the shared layout maths, so they thin together rather
        than the gaps collapsing first; the per-bar value labels drop out once a column can no
        longer seat one.
      </Note>
      {[700, 460, 300, 190].map((w) => (
        <View key={w} style={{ gap: 8, width: w }}>
          <ViewLabel text={`${w}px`} />
          <VelocityStrip
            velocities={REP_SET}
            variant="hero"
            label="Set"
            height={180}
            scale="fixed"
          />
          <DualVelocityStrip
            left={{ velocities: REP_SET, label: 'Left' }}
            right={{ velocities: REP_SET_LAGGING, label: 'Right' }}
            variant="hero"
            height={200}
            scale="fixed"
          />
        </View>
      ))}
    </Sheet>
  ),
}

export const RepTypes: Story = {
  name: 'Rep Types',
  render: () => (
    <Sheet width={700}>
      <Note>
        Every state a rep column can be in at wall scale — where there is room for all of it to be
        unambiguous, and therefore the reference the smaller views are judged against.
      </Note>
      <RepTypeBoard view="hero" />
    </Sheet>
  ),
}

export const EdgeCases: Story = {
  name: 'Edge Cases',
  decorators: [wallDecorator],
  render: () => (
    <View style={{ gap: 26 }}>
      <View style={{ gap: 8 }}>
        <ViewLabel text="near complete · 7 of 8" />
        <VelocityStrip
          velocities={[0.82, 0.79, 0.81, 0.76, 0.74, 0.71, 0.68]}
          variant="hero"
          label="Set"
          targetReps={8}
          scale="fixed"
        />
      </View>

      <View style={{ gap: 8 }}>
        <ViewLabel text="ends on the best rep · reference line sits on the last bar" />
        <VelocityStrip
          velocities={[0.7, 0.74, 0.78, 0.86]}
          variant="hero"
          label="Set"
          scale="fixed"
        />
      </View>

      <View style={{ gap: 8 }}>
        <ViewLabel text="exceeds target · more reps performed than planned" />
        <VelocityStrip
          velocities={[0.9, 0.88, 0.85, 0.83, 0.8, 0.78, 0.75]}
          variant="hero"
          label="Set"
          targetReps={5}
          scale="fixed"
        />
      </View>

      <View style={{ gap: 8 }}>
        <ViewLabel text="single rep · no decline to draw" />
        <VelocityStrip velocities={[0.88]} variant="hero" label="Set" scale="fixed" />
      </View>
    </View>
  ),
}

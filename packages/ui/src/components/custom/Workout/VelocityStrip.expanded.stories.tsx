import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Pressable } from 'react-native'
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
} from './velocity-story-kit'

/**
 * `expanded` — the velocity-HEIGHT bar chart. Bars are scaled to their value,
 * rounded on top and flat on the bottom so the set reads as grounded.
 *
 * Chrome is a prop spectrum rather than a variant: with `showNumbers`/`showInfo`
 * ON it is the framed chart (per-bar m/s labels, mean/loss info row, tap to
 * expand); with both OFF it is the bare active-set spotlight. The framed form is
 * SINGLE-ONLY — there is no dual framed chart, and this group does not fake one.
 *
 * The dual expanded is the lean `rail` renderer: value-height wings separated by
 * the shared 2px gap, with no gutter, slot labels or axis. It is the one view
 * where the dual genuinely needs 2x the height, because here height carries
 * meaning.
 */
const meta: Meta<typeof VelocityStrip> = {
  title: 'Workout/DataViz/VelocityStrip/Expanded',
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
        The representative set at value height. Bars sit at identical x-positions to the compact
        view — only the heights change.
      </Note>
      <ScenarioPair
        view="expanded"
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
        The set-type vocabulary at value height — to-do remainders, the cyan variable window, the
        AMRAP continue window, and drop sub-loads split by the chunk-notch.
      </Note>
      <SetTypeBoard view="expanded" />
    </Sheet>
  ),
}

export const InProgress: Story = {
  name: 'In Progress',
  render: () => (
    <Sheet>
      <Note>
        Mid-set: performed reps, the newest bar live, and the planned remainder still to come. Use
        `scale=&quot;fixed&quot;` while a set is live so bar heights never reflow as reps land.
      </Note>
      <ScenarioPair
        view="expanded"
        title="4 of 8 done"
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
    <Sheet>
      <Note>
        Loss colouring against the set&apos;s own best. At value height the colour and the height
        agree, which is what makes the compact view legible on colour alone.
      </Note>
      <ScenarioPair
        view="expanded"
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
        Pre-first-rep. A planned set draws its upcoming reps as placeholders, so the plot holds its
        height AND its columns — the card does not jump, and the bars do not re-space, on rep one.
      </Note>
      <ScenarioPair
        view="expanded"
        title="Cold boot · 6 planned, none logged"
        singleSet={{ type: 'straight', velocities: [], planned: 6 }}
        leftSet={{ type: 'straight', velocities: [], planned: 6 }}
        rightSet={{ type: 'straight', velocities: [], planned: 6 }}
      />
      <ScenarioPair
        view="expanded"
        title="Truly empty · no plan to draw"
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
        The right slot trails. Its missing reps hold their columns as empties rather than shifting
        the remaining bars left.
      </Note>
      <ScenarioPair
        view="expanded"
        title="Lagging right"
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
        Two ladders. WIDTH first — bars and gaps scale together from the shared layout maths.
      </Note>
      {[440, 300, 180, 110].map((w) => (
        <ScenarioPair
          key={w}
          view="expanded"
          title={`${w}px`}
          width={w}
          single={REP_SET}
          left={REP_SET}
          right={REP_SET_LAGGING}
        />
      ))}

      <Note>
        Then HEIGHT. The expanded plot compresses toward the compact language as it shrinks — at the
        bottom of the ladder it is effectively the resting strip, which is what makes the
        compact↔expanded toggle a morph rather than a swap.
      </Note>
      {[80, 60, 40, 24, 12].map((h) => (
        <View key={h} style={{ gap: 8 }}>
          <ViewLabel text={`${h}px`} />
          <VelocityStrip
            velocities={REP_SET}
            variant="expanded"
            height={h}
            scale="fixed"
            showNumbers={false}
            showInfo={false}
          />
          <DualVelocityStrip
            left={{ velocities: REP_SET, label: 'Left' }}
            right={{ velocities: REP_SET_LAGGING, label: 'Right' }}
            variant="rail"
            height={h}
            scale="fixed"
          />
        </View>
      ))}
    </Sheet>
  ),
}

// ── Expanded-only: the framed chrome spectrum ───────────────────────────────

export const FramedChrome: Story = {
  name: 'Framed Chrome (single-only)',
  render: () => (
    <Sheet width={420}>
      <Note>
        The chrome spectrum, single-only. There is no dual framed chart — the diverging form uses
        the lean rail instead.
      </Note>

      <View style={{ gap: 8 }}>
        <ViewLabel text="framed · numbers + info" />
        <VelocityStrip velocities={REP_SET} variant="expanded" expanded showNumbers showInfo />
      </View>

      <View style={{ gap: 8 }}>
        <ViewLabel text="numbers only" />
        <VelocityStrip
          velocities={REP_SET}
          variant="expanded"
          expanded
          showNumbers
          showInfo={false}
        />
      </View>

      <View style={{ gap: 8 }}>
        <ViewLabel text="bare spotlight · numbers + info off" />
        <VelocityStrip
          velocities={REP_SET}
          variant="expanded"
          showNumbers={false}
          showInfo={false}
          height={24}
          scale="fixed"
        />
      </View>
    </Sheet>
  ),
}

function TapToToggle() {
  const [open, setOpen] = useState(false)
  return (
    <Pressable onPress={() => setOpen((v) => !v)} accessibilityRole="button">
      <VelocityStrip
        velocities={REP_SET}
        variant={open ? 'expanded' : 'compact'}
        height={open ? 60 : 8}
        scale="fixed"
        showNumbers={false}
        showInfo={false}
      />
    </Pressable>
  )
}

export const Interactive: Story = {
  name: 'Interactive · compact ↔ expanded',
  render: () => (
    <Sheet width={420}>
      <Note>
        Tap to toggle between the resting compact strip and the value-height expanded one. Because
        both go through the same geometry, only the bar HEIGHTS change — the columns never move, so
        the transition reads as a morph rather than a swap.
      </Note>
      <TapToToggle />
      <Note>
        Compact sits at its real 8px resting height here, not a padded stand-in — the toggle is only
        honest if the closed state is the size it ships at.
      </Note>
    </Sheet>
  ),
}

export const RepTypes: Story = {
  name: 'Rep Types',
  render: () => (
    <Sheet>
      <Note>
        Every state a rep column can be in at value height. Here height and colour agree, which is
        the reference the compact view is judged against.
      </Note>
      <RepTypeBoard view="expanded" />
    </Sheet>
  ),
}

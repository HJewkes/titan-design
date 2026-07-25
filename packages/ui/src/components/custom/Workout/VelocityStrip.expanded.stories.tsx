import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { VelocityStrip } from './VelocityStrip'
import {
  Sheet,
  Note,
  ViewLabel,
  ScenarioPair,
  SetTypeBoard,
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
      <Note>Pre-first-rep: the plot holds its height so the card does not jump on rep one.</Note>
      <ScenarioPair view="expanded" title="Zero reps" single={[]} left={[]} right={[]} />
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
      <Note>Width ladder — bars and gaps scale together from the shared layout maths.</Note>
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

function TapToExpand() {
  const [open, setOpen] = useState(false)
  return (
    <VelocityStrip
      velocities={REP_SET}
      variant="expanded"
      expanded={open}
      onToggle={() => setOpen((v) => !v)}
      showNumbers
      showInfo
    />
  )
}

export const Interactive: Story = {
  name: 'Interactive · tap to expand',
  render: () => (
    <Sheet width={420}>
      <Note>Tap the chart to toggle the framed chart open and closed.</Note>
      <TapToExpand />
    </Sheet>
  ),
}

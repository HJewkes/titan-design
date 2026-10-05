import type { Meta, StoryObj } from '@storybook/react-vite'
import { ScrollView, useWindowDimensions, View } from 'react-native'

import { MesoHeader, type MesoHeaderShape } from '../../components/custom/Workout/MesoHeader'
import {
  MESO_HEADER_FIXTURES,
  mesoHeaderPropsFrom,
  PROGRAM_CYCLE,
  type MesoHeaderFixtureKey,
} from '../../components/custom/Workout/mesoHeader-fixture'
import { PinnedLiveStrip } from '../../components/shell/workout/PinnedLiveStrip'
import { LIVE_STRIP_SCENARIOS } from '../../components/shell/workout/pinnedLiveStrip-fixture'
import { WorkoutShell } from '../../components/shell/workout/WorkoutShell'
import { Surface } from '../../components/ui/surface'
import { Typography } from '../../components/ui/typography'

interface FrameArgs {
  fixture: MesoHeaderFixtureKey
  shape: MesoHeaderShape
  prioritiesLine: 1 | 2
  isPrioritiesOpen: boolean
}

/** Room under the phone frame for the open priorities popover, which the frame would clip. */
const POPOVER_ROOM = 460
/** The phone screen Round 0 costs the pinned area against, and the wall screen. */
const PHONE_SCREEN = { width: 360, height: 640 }
const WALL_SCREEN_HEIGHT = 1080
const PHONE_MAX = 640

function header({ fixture, shape, prioritiesLine, isPrioritiesOpen }: FrameArgs) {
  return (
    <MesoHeader
      {...mesoHeaderPropsFrom(MESO_HEADER_FIXTURES[fixture])}
      shape={shape}
      cycle={PROGRAM_CYCLE}
      prioritiesLine={prioritiesLine}
      isPrioritiesOpen={isPrioritiesOpen || undefined}
    />
  )
}

function RoundFrame(args: FrameArgs) {
  return (
    <View className="bg-background-base p-gutter-sm" testID="meso-header-frame">
      {header(args)}
    </View>
  )
}

/** P1 and P2: the phone form at a phone's width on every canvas, with the popover pinned open. */
function PhonePopoverFrame(args: FrameArgs) {
  return (
    <View
      className="bg-background-base p-gutter-sm"
      style={{ minHeight: POPOVER_ROOM }}
      testID="meso-header-frame"
    >
      <View style={{ maxWidth: PHONE_SCREEN.width }}>{header(args)}</View>
    </View>
  )
}

function PageBody() {
  return (
    <View className="gap-section-sm">
      {['Lead goal', 'Per-lift', 'Whole body'].map((heading) => (
        <Surface
          key={heading}
          raise={1}
          className="gap-stack-md p-inset-xl"
          style={{ minHeight: 180 }}
        >
          <Typography variant="h6">{heading}</Typography>
          <Typography variant="body2">Page content scrolls under the pinned rows.</Typography>
        </Surface>
      ))}
    </View>
  )
}

const strip = <PinnedLiveStrip {...LIVE_STRIP_SCENARIOS.set} onPress={() => undefined} />

/**
 * K2. Wall: header then strip, both pinned (round 1: "wall-only"). Phone: the strip attaches flush
 * under the top bar, above the header, as top app state; the header is the page's pinned row.
 */
function StripAboveHeaderFrame(args: FrameArgs) {
  const { width } = useWindowDimensions()
  const isPhone = width < PHONE_MAX
  return (
    <View
      style={{ height: isPhone ? PHONE_SCREEN.height : WALL_SCREEN_HEIGHT }}
      testID="meso-header-frame"
    >
      <WorkoutShell activeKey="program" liveKey="live" state="live" subtitle="goals">
        <View className="flex-1" testID="meso-header-chrome">
          {isPhone ? <View testID="live-strip-pinned">{strip}</View> : null}
          <View className="px-5 pt-5" testID="meso-header-pinned">
            {header(args)}
          </View>
          {isPhone ? null : (
            <View className="px-5 pt-5" testID="live-strip-pinned">
              {strip}
            </View>
          )}
          <ScrollView className="flex-1" contentContainerClassName="p-5">
            <PageBody />
          </ScrollView>
        </View>
      </WorkoutShell>
    </View>
  )
}

/**
 * VW-466 pinned mesocycle header on `#/goals`, before integration. Shoot at 1920 and 360; the
 * header measures its own width and takes its phone form below 640 px, the live strip's threshold.
 *
 * Round 1 (owner, 2026-10-05): CHOSEN shape C, the spine; phone "keep" (two lines and the
 * Priorities popover), with the popover off the bar and the dates inside it; pinning "wall-only".
 * NOT CHOSEN: shape A (one band) and shape B (the program cycle), still in the code until the
 * round-2 render is approved.
 *
 * Round 2: the wall in two rows, each priority level over its lifts; the phone with the title alone
 * on line 1 and week, state and cells on line 2, in two variants (P1 trigger on line 1, P2 on
 * line 2); K2 the strip attached above the header on a phone. Fixtures are synthetic.
 */
const meta: Meta<FrameArgs> = {
  title: 'Lab/Decisions/Meso Header',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  args: { fixture: 'm3Current', shape: 'spine', prioritiesLine: 1, isPrioritiesOpen: false },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(MESO_HEADER_FIXTURES) },
    shape: { control: 'inline-radio', options: ['spine', 'band', 'cycle'] },
    prioritiesLine: { control: 'inline-radio', options: [1, 2] },
    isPrioritiesOpen: { control: 'boolean' },
  },
  render: (args) => <RoundFrame {...args} />,
}
export default meta

type Story = StoryObj<FrameArgs>

/** W: shape C on M3, week 2 of 2. Wall in two rows; the phone form at 360. */
export const SpineCurrent: Story = {}

/** D: shape C on M8, week 6 of 6 is the deload. */
export const SpineDeload: Story = { args: { fixture: 'm8Deload' } }

/** P1: phone, nine priorities, the trigger beside the title, popover open under the header. */
export const SpinePhonePrioritiesTitleLine: Story = {
  args: { fixture: 'm13NinePriorities', prioritiesLine: 1, isPrioritiesOpen: true },
  render: (args) => <PhonePopoverFrame {...args} />,
}

/** P2: as P1, with the trigger on the week line so the title has line 1 to itself. */
export const SpinePhonePrioritiesWeekLine: Story = {
  args: { fixture: 'm13NinePriorities', prioritiesLine: 2, isPrioritiesOpen: true },
  render: (args) => <PhonePopoverFrame {...args} />,
}

/** K2: a running set's strip above the header on a phone; header then strip on the wall. */
export const SpineStripAboveHeader: Story = {
  render: (args) => <StripAboveHeaderFrame {...args} />,
}

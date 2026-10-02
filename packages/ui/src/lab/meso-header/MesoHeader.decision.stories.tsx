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
}

/** Room under the phone frame for the open priorities popover, which the frame would clip. */
const POPOVER_ROOM = 420
/** The phone screen Round 0 costs the pinned area against, and the wall screen. */
const PHONE_SCREEN = { width: 360, height: 640 }
const WALL_SCREEN_HEIGHT = 1080
const PHONE_MAX = 640

function header({ fixture, shape }: FrameArgs) {
  return (
    <MesoHeader
      {...mesoHeaderPropsFrom(MESO_HEADER_FIXTURES[fixture])}
      shape={shape}
      cycle={PROGRAM_CYCLE}
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

/** P: the phone form at a phone's width on every canvas, with the popover pinned open. */
function PhonePopoverFrame({ fixture }: FrameArgs) {
  return (
    <View
      className="bg-background-base p-gutter-sm"
      style={{ minHeight: POPOVER_ROOM }}
      testID="meso-header-frame"
    >
      <View style={{ maxWidth: PHONE_SCREEN.width }}>
        <MesoHeader {...mesoHeaderPropsFrom(MESO_HEADER_FIXTURES[fixture])} isPrioritiesOpen />
      </View>
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
          <Typography variant="body2" color="tertiary">
            Page content scrolls under the pinned header and strip.
          </Typography>
        </Surface>
      ))}
    </View>
  )
}

/** K: the SPA chrome's column, [header][strip][scroll], each pinned row inset by the page gutter. */
function WithLiveStripFrame(args: FrameArgs) {
  const { width } = useWindowDimensions()
  const height = width < PHONE_MAX ? PHONE_SCREEN.height : WALL_SCREEN_HEIGHT
  return (
    <View style={{ height }} testID="meso-header-frame">
      <WorkoutShell activeKey="program" liveKey="live" state="live" subtitle="goals">
        <View className="flex-1" testID="meso-header-chrome">
          <View className="px-5 pt-5" testID="meso-header-pinned">
            {header(args)}
          </View>
          <View className="px-5 pt-5" testID="live-strip-pinned">
            <PinnedLiveStrip {...LIVE_STRIP_SCENARIOS.set} onPress={() => undefined} />
          </View>
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
 * Round 1 (VW-648): A one band, B the cycle (A plus the program's blocks), C the spine (labelled
 * weeks), each on M3; P the phone popover open on M13; K the header above a running set's strip in
 * the shell; D the deload on M8. Shape B's block bar is drawn inside the specimen, read-only, and
 * the program's blocks it reads are not on the goals payload today. Fixtures are synthetic.
 */
const meta: Meta<FrameArgs> = {
  title: 'Lab/Decisions/Meso Header',
  tags: ['status:lab'],
  parameters: { layout: 'fullscreen' },
  args: { fixture: 'm3Current', shape: 'band' },
  argTypes: {
    fixture: { control: 'select', options: Object.keys(MESO_HEADER_FIXTURES) },
    shape: { control: 'inline-radio', options: ['band', 'cycle', 'spine'] },
  },
  render: (args) => <RoundFrame {...args} />,
}
export default meta

type Story = StoryObj<FrameArgs>

/** A: shape A on M3. Wall: one band. Phone: two lines with "Priorities · 3". */
export const BandCurrent: Story = {}

/** B: shape B on M3, A plus the program's three blocks as a proportional bar. */
export const CycleCurrent: Story = { args: { shape: 'cycle' } }

/** C: shape C on M3, labelled week cells as the spine with a today line. */
export const SpineCurrent: Story = { args: { shape: 'spine' } }

/** P: shape A's phone form on M13, nine priorities, popover pinned open. */
export const BandPhonePrioritiesOpen: Story = {
  args: { fixture: 'm13NinePriorities' },
  render: (args) => <PhonePopoverFrame {...args} />,
}

/** K: shape A above a running set's live strip, inside the shell, over page content. */
export const BandWithLiveStrip: Story = {
  render: (args) => <WithLiveStripFrame {...args} />,
}

/** D: shape A on M8, week 6 of 6 is the deload: short cell plus the Deload pill. */
export const BandDeload: Story = { args: { fixture: 'm8Deload' } }

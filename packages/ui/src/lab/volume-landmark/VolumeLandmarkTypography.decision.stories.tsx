import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { DataRow } from '../../components/ui/data-row/DataRow'
import { Surface } from '../../components/ui/surface'
import { useSurfaceMode } from '../../components/ui/surface/SurfaceContext'
import { Typography, type TypographyVariant } from '../../components/ui/typography'
import {
  VolumeLandmarkTrack,
  volumeLandmarkReading,
} from '../../components/custom/Workout/VolumeLandmarkBar'
import { contrast } from '../../theme/color-checks'
import { getSemanticColors } from '../../theme/tokens/semantic'

type TextColor = 'primary' | 'secondary'

interface HeaderOption {
  key: string
  name: string
  title: TypographyVariant
  figure: TextColor
}

// A is the head of PR #764. B and C are the owner's alternative with the two all-caps label
// variants the library has: `monoLabel` matches the track's mono tick labels, `overline` is
// the font-body form. No house rule is picked here; the typography research lands it.
const OPTIONS: HeaderOption[] = [
  {
    key: 'a',
    name: 'A · as built: body2 name, body2 bold % in text-primary',
    title: 'body2',
    figure: 'primary',
  },
  {
    key: 'b',
    name: 'B · monoLabel name, body2 bold % in text-secondary',
    title: 'monoLabel',
    figure: 'secondary',
  },
  {
    key: 'c',
    name: 'C · overline name, body2 bold % in text-secondary',
    title: 'overline',
    figure: 'secondary',
  },
]

const LANDMARKS = { mev: 8, mav: 16, mrv: 22 }

// The five states of the component's stories (UnderMEV … OverMRV); AllZones is this stack.
const STATES = [
  { muscle: 'Rear Delts', currentSets: 5 },
  { muscle: 'Calves', currentSets: 12 },
  { muscle: 'Quads', currentSets: 17 },
  { muscle: 'Back', currentSets: 21 },
  { muscle: 'Biceps', currentSets: 26 },
]

const BAR_WIDTH = 220
const PLANE_TOKEN = 'background-base'

function Bar({ option, muscle, currentSets }: { option: HeaderOption } & (typeof STATES)[number]) {
  const { pct } = volumeLandmarkReading(currentSets, LANDMARKS)
  return (
    <View style={{ width: BAR_WIDTH, gap: 3 }}>
      <DataRow
        label={
          <Typography variant={option.title} color="secondary">
            {muscle}
          </Typography>
        }
        value={
          <Typography variant="body2" color={option.figure} className="font-bold">
            {pct}%
          </Typography>
        }
        className="p-0"
      />
      <VolumeLandmarkTrack
        muscle={muscle}
        currentSets={currentSets}
        landmarks={LANDMARKS}
        trackHeight={10}
      />
    </View>
  )
}

function MeasuredContrast({ option }: { option: HeaderOption }) {
  const mode = useSurfaceMode()
  const colors = getSemanticColors(mode)
  const plane = colors[PLANE_TOKEN]
  const ratio = (color: TextColor) => contrast(colors[`text-${color}`], plane).toFixed(2)
  return (
    <Typography variant="caption" color="secondary">
      {`${mode}, on ${PLANE_TOKEN} ${plane}: name text-secondary ${ratio('secondary')}:1 · % text-${option.figure} ${ratio(option.figure)}:1`}
    </Typography>
  )
}

function OptionColumn({ option }: { option: HeaderOption }) {
  return (
    <View style={{ width: BAR_WIDTH, gap: 28 }} testID={`vlb-typography-${option.key}`}>
      <View style={{ gap: 4 }}>
        <Typography variant="body2" color="primary" className="font-bold">
          {option.name}
        </Typography>
        <MeasuredContrast option={option} />
      </View>
      {STATES.map((state) => (
        <Bar key={state.muscle} option={option} {...state} />
      ))}
    </View>
  )
}

/**
 * TD-101, owner revision of 2026-10-09: the header lockup as built (A) against an all-caps label
 * name with a text-secondary bold % (B, C). Follows the toolbar theme; shoot it in dark and light.
 * Each column is one option over the five states of the component's stories, with the measured
 * contrast of its two text roles on the story's plane.
 */
const meta: Meta = {
  title: 'Lab/Decisions/VolumeLandmarkBar Typography',
  tags: ['status:lab'],
  decorators: [
    (Story) => (
      <Surface level="background" style={{ padding: 24, paddingBottom: 40 }}>
        <Story />
      </Surface>
    ),
  ],
}
export default meta

export const Comparison: StoryObj = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 48 }}>
      {OPTIONS.map((option) => (
        <OptionColumn key={option.key} option={option} />
      ))}
    </View>
  ),
}

// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'

import {
  ActivityIcon,
  ChevronsDownIcon,
  CircleSlashIcon,
  EqualIcon,
  HistoryIcon,
  LayersIcon,
  RepeatIcon,
  ScaleIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  type IconProps,
} from '../../icons'
import { Pill } from '../../ui/pill'
import { Surface } from '../../ui/surface'
import { Typography } from '../Typography'

type Glyph = (props: IconProps) => JSX.Element

interface PhaseRow {
  phase: string
  proposed: Glyph
  alternate: Glyph
  alternateName: string
}

/**
 * The four phases and their glyphs. `proposed` is what the cards draw today;
 * `alternate` is the nearest other candidate already in the icon module.
 */
const ROWS: PhaseRow[] = [
  {
    phase: 'Cut',
    proposed: TrendingDownIcon,
    alternate: ChevronsDownIcon,
    alternateName: 'ChevronsDown',
  },
  { phase: 'Bulk', proposed: TrendingUpIcon, alternate: ActivityIcon, alternateName: 'Activity' },
  {
    phase: 'Maintenance',
    proposed: EqualIcon,
    alternate: CircleSlashIcon,
    alternateName: 'CircleSlash',
  },
  { phase: 'Recomp', proposed: RepeatIcon, alternate: HistoryIcon, alternateName: 'History' },
]

const LARGE = 48
const PILL_ICON = 13

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-stack-sm" style={{ alignItems: 'center', width: 150 }}>
      <Typography variant="overline" color="tertiary">
        {title}
      </Typography>
      {children}
    </View>
  )
}

function Row({ row }: { row: PhaseRow }) {
  const { proposed: Proposed, alternate: Alternate } = row
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-lg">
      <View style={{ width: 150 }}>
        <Typography variant="body1">{row.phase}</Typography>
      </View>
      <Column title="Proposed">
        <Proposed size={LARGE} />
      </Column>
      <Column title="In the pill">
        <Pill tone="neutral" variant="outline" size="sm" leading={<Proposed size={PILL_ICON} />}>
          {row.phase}
        </Pill>
      </Column>
      <Column title="Collapsed">
        <Pill tone="neutral" variant="outline" size="sm">
          <Proposed size={PILL_ICON} />
        </Pill>
      </Column>
      <Column title={`Alternate: ${row.alternateName}`}>
        <Alternate size={LARGE} />
      </Column>
    </View>
  )
}

function DietPhaseIcons() {
  return (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-md gap-stack-xl">
      <View className="gap-stack-md">
        {ROWS.map((row) => (
          <Row key={row.phase} row={row} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }} className="gap-inline-lg">
        <Typography variant="caption" color="tertiary">
          Bodyweight, for scale
        </Typography>
        <ScaleIcon size={LARGE} />
        <LayersIcon size={LARGE} />
      </View>
    </Surface>
  )
}

const meta: Meta<typeof DietPhaseIcons> = {
  title: 'Lab/Decisions/Diet Phase Icons',
  component: DietPhaseIcons,
  tags: ['autodocs', 'status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'PROPOSED glyphs for the four diet phases (VW-455 round 4), each shown large, inside ' +
          'its pill, and collapsed to the glyph alone, with the nearest alternate from the icon ' +
          'module beside it. The icon choice is the owner’s. `TrendingUp` and `Repeat` are ' +
          'new to the icon module, mirrored from lucide the same way every other glyph here is; ' +
          'adding them widens the `foundations-icons--all` baseline, which is refreshed from CI.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof DietPhaseIcons>

/** All four phases, proposed and alternate. */
export const Default: Story = {}

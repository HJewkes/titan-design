// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View } from 'react-native'

import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { GoalLiftCard, type GoalLiftCardProps } from './GoalLiftCard'

type Lift = Omit<GoalLiftCardProps, 'density' | 'statusForm'> & { prWeek?: number }

const CURRENT_WEEK = 5

/** The four lifts the per-lift grid shows, so the captures compare like for like. */
const LIFTS: Lift[] = [
  {
    name: 'BENCH PRESS',
    status: 'on_track',
    milestone: { reps: 8, load: 105, unit: 'lb', goalWeek: 8 },
    committed: 102.5,
    stretch: 110,
    isPR: true,
    prWeek: 5,
    actuals: [92.5, 95, 95, 97.5, 100].map((value, i) => ({ weekIndex: i + 1, value })),
    weeks: [
      { outcome: 'on_track', reading: { reps: 8, load: 92.5 } },
      { outcome: 'ahead', reading: { reps: 8, load: 95 } },
      { outcome: 'none' },
      { outcome: 'missed', reading: { reps: 8, load: 97.5 } },
    ],
  },
  {
    name: 'BACK SQUAT',
    status: 'ahead',
    milestone: { reps: 5, load: 245, unit: 'lb', goalWeek: 8 },
    committed: 242.5,
    stretch: 250,
    actuals: [225, 230, 235, 240, 242.5].map((value, i) => ({ weekIndex: i + 1, value })),
    weeks: [
      { outcome: 'on_track', reading: { reps: 5, load: 225 } },
      { outcome: 'ahead', reading: { reps: 5, load: 230 } },
      { outcome: 'ahead', reading: { reps: 5, load: 235 } },
      { outcome: 'ahead', reading: { reps: 5, load: 240 } },
    ],
  },
  {
    name: 'DEADLIFT',
    status: 'behind',
    milestone: { reps: 5, load: 315, unit: 'lb', goalWeek: 8 },
    committed: 312.5,
    stretch: 320,
    actuals: [285, 285, 287.5, 287.5, 290].map((value, i) => ({ weekIndex: i + 1, value })),
    weeks: [
      { outcome: 'on_track', reading: { reps: 5, load: 285 } },
      { outcome: 'missed', reading: { reps: 5, load: 285 } },
      { outcome: 'missed', reading: { reps: 5, load: 287.5 } },
      { outcome: 'missed', reading: { reps: 5, load: 287.5 } },
    ],
  },
  {
    name: 'OVERHEAD PRESS',
    status: 'calibrating',
    milestone: { reps: 8, load: 95, unit: 'lb', goalWeek: 8 },
    committed: 92.5,
    stretch: 100,
    isPR: true,
    prWeek: 5,
    actuals: [{ weekIndex: 5, value: 95 }],
  },
]

function Row({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <View testID={`row-${id}`} className="gap-stack-sm">
      <Typography variant="caption" color="tertiary">
        {title}
      </Typography>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }} className="gap-gutter-sm">
        {children}
      </View>
    </View>
  )
}

interface DecisionArgs {
  cardWidth: 440 | 328
}

/**
 * VW-385 ideation, DECIDED — a record, not a menu.
 *
 * **CHOSEN: D1.** The block's week cells stand on the compact chart's plane, on
 * its own week columns, so each cell heads the column its point sits in; the
 * current week's column is lit; the line is recessed so the points lead; no
 * ticks; the cells are not inside the plane. It is what `GoalCard size="compact"`
 * ships, so this row renders the real card — there is no stand-in left to drift
 * from it.
 *
 * Not chosen, and **deleted from the code** (see `REJECTED.md`): A, the plane
 * with line and points and no cells; D2, D1 plus a hairline from each cell to its
 * point; D3, the cells inside the plane; and the Sparkline the compact card used
 * to draw. B (stretch rule plus left values) and C (no plane) were dropped before
 * they were built.
 *
 * The big chart's committed/stretch labels were decided in the same round: left,
 * now the `referenceLabelSide` default. Dark only (VW-397).
 */
const meta: Meta<DecisionArgs> = {
  title: 'Lab/Decisions/Compact Goal Chart',
  tags: ['autodocs', 'status:lab'],
  parameters: { layout: 'fullscreen' },
  argTypes: { cardWidth: { control: 'inline-radio', options: [440, 328] } },
  render: (args) => (
    <Surface level="base" style={{ minHeight: '100%' }} className="p-gutter-sm gap-section-sm">
      <Row id="d1" title="D1 — CHOSEN. Cells on the plane top edge, current-week column lit">
        {LIFTS.map((lift) => (
          <View key={lift.name} style={{ width: args.cardWidth }}>
            <GoalLiftCard {...lift} currentWeek={CURRENT_WEEK} />
          </View>
        ))}
      </Row>
    </Surface>
  ),
}
export default meta

type Story = StoryObj<DecisionArgs>

/** The four-up grid at 1920: each card 440 wide. */
export const LiftCardWidth: Story = { args: { cardWidth: 440 } }

/** The phone: one card per row at 328. */
export const Phone: Story = { args: { cardWidth: 328 } }

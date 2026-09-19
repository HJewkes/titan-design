// Story fixtures for the carousel: real goal cards on the existing goal fixtures, never placeholders.
import { View } from 'react-native'

import { Card } from '../../ui/card'
import { Metric } from '../Metric'
import { Typography } from '../Typography'
import { GoalCard, type GoalCardProps } from './GoalCard'
import { GoalMuscleCard, type GoalMuscleCardProps } from './GoalMuscleCard'
import { MuscleGroup } from './muscleTaxonomy'
import { PRIMARY_GOAL_SCENARIOS as S } from './primaryGoal-fixture'
import { CarouselSlide } from '../../ui/carousel'

type Scenario = keyof typeof S

const TREND: NonNullable<GoalCardProps['trend']> = {
  committed: 185,
  stretch: 195,
  goalWeek: 6,
  unit: 'lb',
  actuals: [
    { weekIndex: 1, value: 175 },
    { weekIndex: 2, value: 178 },
    { weekIndex: 3, value: 181 },
    { weekIndex: 4, value: 184 },
  ],
}

export interface LiftFixture {
  id: string
  name: string
  scenario: Scenario
  /** The SPA's calibration sentence under the card, which makes a slide taller. */
  note?: string
}

/** Nine per-lift goals, the contract's large case (C3). */
export const NINE_LIFTS: LiftFixture[] = [
  { id: 'bench', name: 'Bench press', scenario: 'onTrack' },
  { id: 'squat', name: 'Back squat', scenario: 'behind' },
  { id: 'rdl', name: 'Romanian deadlift', scenario: 'ahead' },
  { id: 'tricep', name: 'Cable overhead tricep extension', scenario: 'onTrack' },
  { id: 'row', name: 'Seated cable row', scenario: 'hitExact' },
  { id: 'pulldown', name: 'Lat pulldown', scenario: 'beyondGoal' },
  { id: 'incline', name: 'Incline dumbbell press', scenario: 'behind' },
  { id: 'legpress', name: 'Leg press', scenario: 'onTrack' },
  { id: 'chest', name: 'Cable chest press', scenario: 'calibrating' },
]

/** Names that wrap at a phone column (C6). */
export const LONG_NAME_LIFTS: LiftFixture[] = [
  { id: 'tricep', name: 'Cable overhead tricep extension', scenario: 'onTrack' },
  {
    id: 'single-arm',
    name: 'Single-arm half-kneeling cable overhead tricep extension (rope)',
    scenario: 'behind',
  },
  { id: 'bench', name: 'Bench press', scenario: 'ahead' },
]

/** One lift carrying the calibration sentence, beside two without (C4). */
export const NOTED_LIFTS: LiftFixture[] = [
  { id: 'bench', name: 'Bench press', scenario: 'onTrack' },
  {
    id: 'chest',
    name: 'Cable chest press',
    scenario: 'calibrating',
    note: 'Calibrating: 1 session logged, the band appears after 2 more working sets.',
  },
  { id: 'squat', name: 'Back squat', scenario: 'behind' },
]

function liftCardProps(lift: LiftFixture): GoalCardProps {
  const scenario = S[lift.scenario]
  return { ...scenario, size: 'compact', title: lift.name, goal: undefined, trend: TREND }
}

/** A compact goal card as the per-lift section renders it, stretched to its slide. */
export function LiftCard({ lift }: { lift: LiftFixture }) {
  if (lift.note === undefined) return <GoalCard {...liftCardProps(lift)} className="flex-1" />
  return (
    <View className="flex-1 gap-stack-sm">
      <GoalCard {...liftCardProps(lift)} className="flex-1" />
      <Typography variant="body2" color="secondary">
        {lift.note}
      </Typography>
    </View>
  )
}

export function liftSlides(lifts: LiftFixture[]) {
  return lifts.map((lift) => (
    <CarouselSlide key={lift.id} value={lift.id} label={lift.name}>
      <LiftCard lift={lift} />
    </CarouselSlide>
  ))
}

const BACK_LIFTS: GoalMuscleCardProps['lifts'] = [
  { name: 'Barbell row', status: 'on_track', reps: 10, load: 100, unit: 'lb', goalWeek: 5 },
  { name: 'Weighted pull up', status: 'deload_week', reps: 6, load: 30, unit: 'lb', goalWeek: 5 },
  { name: 'Lat pulldown', status: 'ahead', reps: 12, load: 70, unit: 'lb', goalWeek: 7 },
  { name: 'Seated cable row', status: 'on_track', reps: 10, load: 120, unit: 'lb', goalWeek: 5 },
  { name: 'Chest-supported row', status: 'behind', reps: 10, load: 60, unit: 'lb', goalWeek: 5 },
  {
    name: 'Straight-arm pulldown',
    status: 'on_track',
    reps: 12,
    load: 40,
    unit: 'lb',
    goalWeek: 5,
  },
]

export interface MuscleFixture extends Omit<GoalMuscleCardProps, 'className'> {
  id: string
}

/** Muscle priorities: one lift beside six, so the slides differ in height (C4). */
export const MUSCLES: MuscleFixture[] = [
  {
    id: 'back',
    name: 'BACK',
    muscle: MuscleGroup.UPPER_BACK,
    side: 'back',
    status: 'on_track',
    liftsOnTrack: 4,
    liftsTotal: 6,
    commonGoalWeek: 5,
    lifts: BACK_LIFTS,
  },
  {
    id: 'chest',
    name: 'CHEST',
    muscle: MuscleGroup.CHEST,
    side: 'front',
    status: 'ahead',
    liftsOnTrack: 1,
    liftsTotal: 1,
    commonGoalWeek: 6,
    lifts: [{ name: 'Bench press', status: 'ahead', reps: 8, load: 185, unit: 'lb', goalWeek: 6 }],
  },
  {
    id: 'quads',
    name: 'QUADS',
    muscle: MuscleGroup.QUADS,
    side: 'front',
    status: 'behind',
    liftsOnTrack: 1,
    liftsTotal: 2,
    commonGoalWeek: 6,
    lifts: [
      { name: 'Back squat', status: 'behind', reps: 5, load: 225, unit: 'lb', goalWeek: 6 },
      { name: 'Leg press', status: 'on_track', reps: 10, load: 360, unit: 'lb', goalWeek: 6 },
    ],
  },
]

export function muscleSlides(muscles: MuscleFixture[]) {
  return muscles.map(({ id, ...muscle }) => (
    <CarouselSlide key={id} value={id} label={muscle.name}>
      <GoalMuscleCard {...muscle} className="flex-1" />
    </CarouselSlide>
  ))
}

/**
 * The whole-body pair as two separate cards. A stand-in: the real
 * `BodyweightGoalCard` and `SessionsGoalCard` land with titan PR 273.
 */
export function WholeBodyStandIn({ title, value, unit, line }: StandInProps) {
  return (
    <Card className="flex-1 gap-stack-md p-inset-lg">
      <Typography variant="h6">{title}</Typography>
      <Metric value={value} unit={unit} label={line} size="lg" className="items-start" />
      <Typography variant="caption" color="tertiary">
        Stand-in until titan PR 273 lands
      </Typography>
    </Card>
  )
}

interface StandInProps {
  title: string
  value: string
  unit?: string
  line: string
}

export function wholeBodySlides() {
  return [
    <CarouselSlide key="bodyweight" value="bodyweight" label="Bodyweight">
      <WholeBodyStandIn title="BODYWEIGHT" value="196.8" unit="lb" line="Cut, week 3 of 8" />
    </CarouselSlide>,
    <CarouselSlide key="sessions" value="sessions" label="Sessions, 28 days">
      <WholeBodyStandIn title="SESSIONS (28 DAYS)" value="9 of 12" line="10 due by now" />
    </CarouselSlide>,
  ]
}

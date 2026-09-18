// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `PrimaryGoalCard` is `GoalCard size="full"` (VW-385 round 5, human: "arguably,
 * the primary goal card should just be the goal card and the per lift goal card
 * just a more compact variant"). The name is kept for the wall's lead card and
 * for the SPA port; everything it does lives in `GoalCard.tsx`.
 */
import {
  GoalCard,
  type GoalCardChart,
  type GoalCardMilestone,
  type GoalCardProps,
} from './GoalCard'

export { goalStatusBadge, markSizeFor } from './GoalCard'

/** The trajectory chart's payload. Renamed to `GoalCardChart`; this alias stays. */
export type PrimaryGoalChart = GoalCardChart
/** The meso target's content. Renamed to `GoalCardMilestone`; this alias stays. */
export type PrimaryGoalMilestone = GoalCardMilestone

export interface PrimaryGoalCardProps extends Omit<GoalCardProps, 'size' | 'goal' | 'trend'> {
  /** The trajectory chart's payload; the full card always draws one. */
  goal: GoalCardChart
}

/** The wall's lead goal card: {@link GoalCard} at `full` size. */
export function PrimaryGoalCard(props: PrimaryGoalCardProps) {
  return <GoalCard {...props} size="full" testID="primary-goal-card" />
}

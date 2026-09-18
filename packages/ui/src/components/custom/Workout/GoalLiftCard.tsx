// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `GoalLiftCard` is `GoalCard size="compact"` (VW-385 round 5). The name stays
 * because voltras-mcp's `#/goals` imports it; the implementation, the props and
 * the shared goal vocabulary all live in `GoalCard.tsx` now.
 */
export {
  GoalCard,
  GoalLiftCard,
  goalLiftStatusLabel,
  goalStatusBadge,
  markSizeFor,
  milestoneBlock,
  GOAL_STATUS_LABEL,
  GOAL_STATUS_TONE,
  STATUS_COLLAPSE_WIDTH,
  type GoalCardChart,
  type GoalCardMilestone,
  type GoalCardProps,
  type GoalCardSize,
  type GoalCardTrend,
  type GoalLiftActual,
  type GoalLiftCardDensity,
  type GoalLiftCardProps,
  type GoalLiftMilestone,
  type GoalLiftStatus,
} from './GoalCard'

// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import type { ReactElement } from 'react'
import { View } from 'react-native'

import { getSemanticColors } from '../../../theme/tokens/semantic'
import { ChevronsDownIcon, EqualIcon, TargetIcon, type IconProps } from '../../icons'
import { useSurfaceMode } from '../../ui/surface'
import { TipTrigger } from '../../ui/tooltip'
import { Typography } from '../../ui/typography'

/** What the block asks of a lift. Mirrors `GoalPriority.level` in voltras-mcp. */
export type GoalPriority = 'specialize' | 'maintain' | 'deprioritize'

export interface GoalPriorityIconProps {
  priority: GoalPriority
  /** Glyph size in px; 14 matches `PrBadge`'s compact star. */
  size?: number
  /** Opens the priority's meaning on hover, focus or press. */
  withTip?: boolean
  className?: string
}

export const GOAL_PRIORITY_LABEL: Record<GoalPriority, string> = {
  specialize: 'Specialize',
  maintain: 'Maintain',
  deprioritize: 'Deprioritize',
}

/** What the level means for the block's overload budget. */
export const GOAL_PRIORITY_MEANING: Record<GoalPriority, string> = {
  specialize: 'This block spends its overload budget here.',
  maintain: 'Held where it is while another lift specialises.',
  deprioritize: 'Giving up ground here on purpose this block.',
}

const GLYPH: Record<GoalPriority, (props: IconProps) => ReactElement> = {
  specialize: TargetIcon,
  maintain: EqualIcon,
  deprioritize: ChevronsDownIcon,
}

/**
 * The accent is the priority worth spending attention on; the other two levels
 * step back through the text ramp rather than taking a status colour. Priority
 * is not pace, so it never borrows the `status-*` family.
 */
const TONE = {
  specialize: 'brand-secondary',
  maintain: 'text-secondary',
  deprioritize: 'text-tertiary',
} as const satisfies Record<GoalPriority, keyof ReturnType<typeof getSemanticColors>>

function Glyph({ priority, size, color }: { priority: GoalPriority; size: number; color: string }) {
  const Icon = GLYPH[priority]
  return <Icon size={size} color={color} strokeWidth={2} />
}

/** Wide enough to read as a sentence: an in-flow tip inherits its trigger's box. */
const TIP_WIDTH = 220

function Tip({ priority }: { priority: GoalPriority }) {
  return (
    <View className="gap-stack-sm" style={{ width: TIP_WIDTH }}>
      <Typography variant="overline" color="tertiary">
        {GOAL_PRIORITY_LABEL[priority]}
      </Typography>
      <Typography variant="body2">{GOAL_PRIORITY_MEANING[priority]}</Typography>
    </View>
  )
}

/**
 * The goal's priority level as a mark, sized and placed like `PrBadge`'s compact
 * star so a card's upper right reads as one row of marks.
 *
 * @example
 * <GoalPriorityIcon priority="specialize" />
 */
export function GoalPriorityIcon({
  priority,
  size = 14,
  withTip = true,
  className,
}: GoalPriorityIconProps) {
  const color = getSemanticColors(useSurfaceMode())[TONE[priority]]
  const label = `Priority: ${GOAL_PRIORITY_LABEL[priority]}`
  const glyph = <Glyph priority={priority} size={size} color={color} />
  if (!withTip) {
    return (
      <View
        className={className}
        accessibilityRole="image"
        accessibilityLabel={label}
        testID="goal-priority-icon"
      >
        {glyph}
      </View>
    )
  }
  return (
    <TipTrigger
      label={label}
      content={<Tip priority={priority} />}
      // Downwards, in flow, for the same reasons the status tip is.
      placement="bottom-end"
      usePortal={false}
      testID="goal-priority-icon"
    >
      {glyph}
    </TipTrigger>
  )
}

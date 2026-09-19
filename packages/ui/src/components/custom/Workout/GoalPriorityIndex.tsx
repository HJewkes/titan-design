// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View, type ViewProps } from 'react-native'

import { Typography } from '../Typography'
import { cn } from '../../../utils/cn'
import { GOAL_PRIORITY_LABEL, GoalPriorityIcon, type GoalPriority } from './GoalPriorityIcon'

/** One declared priority, as the index names it. */
export interface GoalPriorityIndexEntry {
  /** Display name, e.g. "Bench press" or "Back". */
  name: string
  level: GoalPriority
  /** False when nothing on the page tracks it, which is the one thing only this index can say. */
  hasTarget: boolean
}

export interface GoalPriorityIndexGroup {
  level: GoalPriority
  names: string[]
}

const LEVEL_ORDER: readonly GoalPriority[] = ['specialize', 'maintain', 'deprioritize']

/** Declared priorities grouped by level, in level order, each keeping its declaration order. */
export function groupPriorities(
  entries: readonly GoalPriorityIndexEntry[]
): GoalPriorityIndexGroup[] {
  return LEVEL_ORDER.flatMap((level) => {
    const names = entries
      .filter((entry) => entry.level === level)
      .map((entry) => (entry.hasTarget ? entry.name : `${entry.name} (no target)`))
    return names.length === 0 ? [] : [{ level, names }]
  })
}

export interface GoalPriorityIndexProps extends ViewProps {
  priorities: readonly GoalPriorityIndexEntry[]
  className?: string
}

/**
 * Every declared priority on one wrapping line, grouped by level: the page's
 * index of what the lifter asked this block for. A priority with no target
 * says so, because no card on the page carries it.
 *
 * Renders nothing with no priorities. No loading, error or disabled state: the
 * consumer passes loaded data, and nothing here is pressable.
 */
export function GoalPriorityIndex({ priorities, className, ...props }: GoalPriorityIndexProps) {
  const groups = groupPriorities(priorities)
  if (groups.length === 0) return null
  return (
    <View
      style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}
      className={cn('gap-x-inline-lg gap-y-stack-sm', className)}
      testID="goal-priority-index"
      {...props}
    >
      {groups.map((group) => (
        <View
          key={group.level}
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            flexShrink: 1,
            minWidth: 0,
          }}
          className="gap-inline-sm"
          testID="goal-priority-index-group"
        >
          <GoalPriorityIcon priority={group.level} size={16} />
          <Typography variant="overline" color="tertiary">
            {GOAL_PRIORITY_LABEL[group.level]}
          </Typography>
          <View style={{ flexShrink: 1, minWidth: 0 }}>
            <Typography variant="body2">{group.names.join(', ')}</Typography>
          </View>
        </View>
      ))}
    </View>
  )
}

import { Text } from 'react-native'
import { cn } from '../../../utils/cn'
import { Pill } from '../../ui/pill'
import { toolFamilyMeta } from './session-vocabulary'
import type { ToolFamily } from './session-types'

export interface ToolBadgeProps {
  /** A ToolFamily, or any string from a newer read model (falls back to other_tool). */
  family: ToolFamily | string
  size?: 'sm' | 'md'
  className?: string
}

const PILL_SIZE = { sm: 'xs', md: 'sm' } as const
// The text step Pill gives a string label at the same size; the glyph is a node so it can hide.
const GLYPH_SIZE = { sm: 'text-3xs', md: 'text-2xs' } as const

/**
 * A tool family as a one-character glyph in a neutral pill. The badge is named by the family
 * label ("Read files"), and the glyph is hidden from assistive tech, so the mark never stands
 * alone. Neutral by decision: a tint per family needs fill and on-fill tokens that do not exist.
 */
export function ToolBadge({ family, size = 'md', className }: ToolBadgeProps) {
  const { label, glyph } = toolFamilyMeta(family)
  return (
    <Pill
      tone="neutral"
      variant="subtle"
      size={PILL_SIZE[size]}
      rounded={false}
      // RNW drops a label on a role-less View; `image` keeps the name on the root.
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="tool-badge"
      className={className}
    >
      <Text
        aria-hidden
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={cn('font-mono font-semibold text-inherit', GLYPH_SIZE[size])}
      >
        {glyph}
      </Text>
    </Pill>
  )
}

// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { cn } from '../../../utils/cn'
import { Pill } from '../../ui/pill'
import { StatusDot } from '../Workout/StatusDot'
import { DateTime } from '../DateTime'
import { Typography } from '../Typography'
import { INITIATIVE_STATE_META, type InitiativeState } from './InitiativeCard'

export interface InitiativeHeaderProps {
  title: string
  /** Short slug shown under the title, e.g. `active-work`. */
  slug: string
  state: InitiativeState
  /** Focused rank (1-based). Shown as `#N` for a ranked state. */
  rank?: number
  /** Ship-target label, e.g. `2026-Q3`. */
  shipTarget?: string
  /** ISO date the brief last changed. */
  updated?: string
  className?: string
}

/**
 * InitiativeHeader — an initiative's identity line: title, slug, state, rank,
 * ship target and when it was last touched.
 *
 * Shares the state vocabulary with {@link InitiativeCard} through
 * `INITIATIVE_STATE_META`. Composes {@link StatusDot}, {@link Pill},
 * {@link DateTime} and {@link Typography}. Used by the initiative reader.
 */
export function InitiativeHeader({
  title,
  slug,
  state,
  rank,
  shipTarget,
  updated,
  className,
}: InitiativeHeaderProps) {
  const meta = INITIATIVE_STATE_META[state]
  return (
    <View className={cn('gap-1', className)}>
      <Typography variant="h5" className="text-text-primary">
        {title}
      </Typography>
      <View className="flex-row flex-wrap items-center gap-2.5">
        <Typography variant="mono" className="text-text-tertiary">
          {slug}
        </Typography>
        <StatusDot variant={meta.dot} size="sm" label={meta.label} />
        {rank ? (
          <Pill variant="subtle" color="primary" size="xs">
            {`#${rank}`}
          </Pill>
        ) : null}
        {shipTarget ? (
          <Typography variant="caption" className="text-text-tertiary">
            {`ship ${shipTarget}`}
          </Typography>
        ) : null}
        {updated ? (
          <View className="flex-row items-center gap-1">
            <Typography variant="caption" className="text-text-tertiary">
              updated
            </Typography>
            <DateTime value={updated} format="medium" isUTC variant="caption" color="tertiary" />
          </View>
        ) : null}
      </View>
    </View>
  )
}

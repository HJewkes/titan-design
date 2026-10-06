import React, { useMemo } from 'react'
import { EmptyState } from '../empty-state'

export interface TableEmptyStateProps {
  /** Title for empty state */
  title?: string
  /** Description for empty state */
  description?: string
  /** Action button/element */
  action?: React.ReactNode
  /** Custom icon */
  icon?: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Empty state component for tables with no data.
 */
export function TableEmptyState({
  title = 'No data',
  description = 'There are no items to display.',
  action,
  icon,
  className,
}: TableEmptyStateProps) {
  const Icon = useMemo(() => (icon ? () => <>{icon}</> : undefined), [icon])

  return (
    <EmptyState
      icon={Icon}
      title={title}
      description={description}
      action={action}
      className={className}
    />
  )
}

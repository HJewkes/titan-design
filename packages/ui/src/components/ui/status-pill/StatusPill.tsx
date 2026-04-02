import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { CircularProgress, type ProgressColor } from '../progress'
import { Spinner } from '../spinner'
import { Popover, PopoverTrigger, PopoverContent } from '../popover'

export type StatusPillStatus = 'idle' | 'active' | 'success' | 'error'

export interface StatusPillProps extends ViewProps {
  /** Progress value (0-100) for the circular ring */
  progress: number
  /** Primary text label */
  label: string
  /** Secondary detail text (e.g., "142/220") */
  detail?: string
  /** Status determines border color, glow, and text color */
  status?: StatusPillStatus
  /** Optional StatusPillContent for hover dropdown */
  children?: React.ReactNode
  /** Additional className */
  className?: string
}

export interface StatusPillContentProps {
  /** Dropdown content */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

const statusBorderStyles: Record<StatusPillStatus, string> = {
  idle: 'border-border',
  active: 'border-brand-primary/40',
  success: 'border-status-success/30',
  error: 'border-status-error/30',
}

const statusShadowStyles: Record<StatusPillStatus, string> = {
  idle: '',
  active: 'shadow-[0_0_20px_rgba(var(--color-brand-primary-rgb),0.15)]',
  success: '',
  error: '',
}

const statusLabelStyles: Record<StatusPillStatus, string> = {
  idle: 'text-text-tertiary',
  active: 'text-brand-primary',
  success: 'text-status-success',
  error: 'text-status-error',
}

const statusProgressColor: Record<StatusPillStatus, ProgressColor> = {
  idle: 'secondary',
  active: 'primary',
  success: 'success',
  error: 'error',
}

function PillBody({ progress, label, detail, status = 'idle', className, children, ...props }: StatusPillProps) {
  const progressColor = statusProgressColor[status]

  return (
    <View
      className={cn(
        'rounded-full px-4 py-2 border bg-surface-base',
        'flex-row items-center gap-3',
        statusBorderStyles[status],
        statusShadowStyles[status],
        className
      )}
      {...props}
    >
      <View className="relative items-center justify-center" style={{ width: 32, height: 32 }}>
        <CircularProgress
          value={progress}
          size={32}
          strokeWidth={3}
          color={progressColor}
        />
        {status === 'active' && (
          <View style={{ position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -8 }, { translateY: -8 }] }}>
            <Spinner size="sm" color="primary" label="Active" />
          </View>
        )}
      </View>

      <View>
        <Text className={cn('text-sm font-medium', statusLabelStyles[status])}>
          {label}
        </Text>
        {detail && (
          <Text className="text-xs font-mono text-text-tertiary">
            {detail}
          </Text>
        )}
      </View>
    </View>
  )
}

/**
 * StatusPill component: a compact pill-shaped status indicator with a circular
 * progress ring, text, and an optional hover dropdown for details.
 *
 * @example
 * <StatusPill progress={65} label="Processing" detail="142/220" status="active" />
 *
 * @example
 * <StatusPill progress={100} label="Complete" status="success">
 *   <StatusPillContent>
 *     <div>Custom dropdown content here</div>
 *   </StatusPillContent>
 * </StatusPill>
 */
export function StatusPill(props: StatusPillProps) {
  const { children, ...rest } = props

  if (!children) {
    return <PillBody {...rest} />
  }

  return (
    <Popover triggerMode="hover" closeDelay={150} placement="bottom">
      <PopoverTrigger>
        <PillBody {...rest} />
      </PopoverTrigger>
      {children}
    </Popover>
  )
}

/**
 * Content wrapper for the StatusPill hover dropdown.
 * Renders inside a PopoverContent with default styling.
 */
export function StatusPillContent({ children, className }: StatusPillContentProps) {
  return (
    <PopoverContent
      className={cn(
        'min-w-[220px] bg-surface-base border border-border rounded-lg shadow-lg p-4',
        className
      )}
    >
      {children}
    </PopoverContent>
  )
}

import React, { createContext, useContext } from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { CircularProgress } from '../progress'
import type { ProgressColor } from '../progress'
import { Tooltip } from '../tooltip'
import { semanticColorsDark } from '../../../theme/tokens/semantic'

interface StepProgressContextValue {
  compact: boolean
}

const StepProgressContext = createContext<StepProgressContextValue>({
  compact: false,
})

export interface StepProgressProps extends ViewProps {
  /** Use smaller rings (28px) and thinner connectors */
  compact?: boolean
  /** Step elements */
  children: React.ReactNode
  /** Additional className */
  className?: string
}

export interface StepProps {
  /** Single character displayed in the center of the ring */
  label: string
  /** Progress 0-100 */
  value: number
  /** Tooltip text shown on hover */
  tooltip?: string
  /** Click handler (makes step clickable) */
  onClick?: () => void
  /** Shows checkmark and success color */
  isComplete?: boolean
  /** Primary color styling */
  isActive?: boolean
  /** Dimmed/disabled appearance, not clickable */
  isLocked?: boolean
  /** Additional className */
  className?: string
}

function resolveColor(props: Pick<StepProps, 'isComplete' | 'isActive' | 'isLocked'>): ProgressColor {
  if (props.isComplete) return 'success'
  if (props.isActive) return 'primary'
  return 'secondary'
}

export function Step({
  label,
  value,
  tooltip,
  onClick,
  isComplete = false,
  isActive = false,
  isLocked = false,
  className,
}: StepProps) {
  const { compact } = useContext(StepProgressContext)
  const size = compact ? 28 : 40
  const strokeWidth = compact ? 3 : 4
  const color = resolveColor({ isComplete, isActive, isLocked })
  const isClickable = !!onClick && !isLocked
  const displayValue = isComplete ? 100 : value

  const labelColor = isComplete
    ? semanticColorsDark['status-success']
    : isActive
      ? semanticColorsDark['brand-primary']
      : semanticColorsDark['text-tertiary']

  const centerLabel = (
    <Text
      className={cn(
        'absolute text-text-primary font-semibold',
        isLocked && 'opacity-50'
      )}
      style={{ fontSize: compact ? 10 : 13, color: labelColor }}
    >
      {isComplete ? '\u2713' : label}
    </Text>
  )

  const ring = (
    <Pressable
      onPress={isClickable ? onClick : undefined}
      disabled={isLocked}
      className={cn(
        'items-center justify-center',
        isLocked && 'opacity-50 cursor-not-allowed',
        isClickable && 'cursor-pointer hover:scale-110 transition-transform',
        className
      )}
      style={{ opacity: isLocked ? 0.5 : 1 }}
      testID={`step-${label}`}
    >
      <View className="relative items-center justify-center">
        <CircularProgress
          value={displayValue}
          size={size}
          strokeWidth={strokeWidth}
          color={color}
        />
        <View
          className="absolute items-center justify-center"
          style={{ width: size, height: size, top: 0, left: 0 }}
        >
          {centerLabel}
        </View>
      </View>
    </Pressable>
  )

  if (tooltip) {
    return (
      <Tooltip label={tooltip}>
        {ring}
      </Tooltip>
    )
  }

  return ring
}

export function StepProgress({
  compact = false,
  children,
  className,
  ...props
}: StepProgressProps) {
  const childArray = React.Children.toArray(children)

  const elements: React.ReactNode[] = []
  childArray.forEach((child, i) => {
    elements.push(child)
    if (i < childArray.length - 1) {
      const nextChild = childArray[i + 1]
      const nextIsLocked =
        React.isValidElement<StepProps>(nextChild) && nextChild.props.isLocked
      elements.push(
        <View
          key={`connector-${i}`}
          className={cn(
            'h-[2px] rounded-[1px] bg-border-default',
            compact ? 'w-2 mx-0.5' : 'w-3 mx-1',
            nextIsLocked && 'opacity-20'
          )}
        />
      )
    }
  })

  return (
    <StepProgressContext.Provider value={{ compact }}>
      <View
        className={cn('flex-row items-center', className)}
        {...props}
      >
        {elements}
      </View>
    </StepProgressContext.Provider>
  )
}

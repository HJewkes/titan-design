import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { useSurfaceMode } from '../surface'
import { railPosition, type ProgressStepState } from './railTimeline'
import { RailStep } from './ProgressRail'
import { progressColor, type ProgressColor } from './progressColor'

/** `dots`: the compact indicator. `rail`: state chips joined by connectors that fill with `progress`. */
export type ProgressStepsVariant = 'dots' | 'rail'
export type { ProgressStepState }

export interface ProgressStepsProps extends ViewProps {
  /** Current step (0-indexed) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Color of completed steps. Default `primary`; `success` for the rail. */
  color?: ProgressColor
  /**
   * Size of step indicators. `ProgressSize` spelled out: importing it from `./Progress`, which
   * re-exports this file, is an import cycle.
   */
  size?: 'sm' | 'md' | 'lg'
  /** Labels for each step */
  labels?: string[]
  /** `dots` (default) or `rail`: state chips joined by connectors that fill with `progress`. */
  variant?: ProgressStepsVariant
  /**
   * Fractional position along the steps, 0..totalSteps-1. Overrides `currentStep` in the
   * rail. The span `k-1..k` is the work on step `k`: at 1.5 steps 0-1 are done, step 2 is
   * active and the bar into it two-thirds full (it is full at 1.75, and step 2 is done at 2).
   */
  progress?: number
  /** Additional className */
  className?: string
}

const stepColorStyles: Record<ProgressColor, string> = {
  primary: 'bg-brand-primary',
  secondary: 'bg-brand-secondary',
  success: 'bg-status-success',
  error: 'bg-status-error',
  warning: 'bg-status-warning',
  info: 'bg-status-info',
}

type StepSize = NonNullable<ProgressStepsProps['size']>

const stepSizeStyles: Record<StepSize, { dot: string; connector: string; chip: string }> = {
  sm: { dot: 'w-2 h-2', connector: 'h-0.5', chip: 'w-4 h-4' },
  md: { dot: 'w-3 h-3', connector: 'h-1', chip: 'w-5 h-5' },
  lg: { dot: 'w-4 h-4', connector: 'h-1.5', chip: 'w-6 h-6' },
}

function StepLabels({ labels, reached }: { labels?: string[]; reached: number }) {
  if (!labels || labels.length === 0) return null
  return (
    <View className="flex-row">
      {labels.map((label, index) => (
        <Text
          key={index}
          className={cn(
            'flex-1 text-xs text-center',
            index <= reached ? 'text-text-primary font-medium' : 'text-text-secondary'
          )}
        >
          {label}
        </Text>
      ))}
    </View>
  )
}

function DotSteps({
  currentStep,
  totalSteps,
  color = 'primary',
  size = 'md',
  labels,
  className,
  ...props
}: Omit<ProgressStepsProps, 'variant' | 'progress'>) {
  const { dot, connector } = stepSizeStyles[size]

  return (
    <View className={cn('w-full gap-stack-md', className)} {...props}>
      <View className="flex-row items-center">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            {/* Step dot */}
            <View
              className={cn(
                'rounded-full',
                dot,
                index <= currentStep ? stepColorStyles[color] : 'bg-hairline-strong'
              )}
            />

            {/* Connector line */}
            {index < totalSteps - 1 && (
              <View
                className={cn(
                  'flex-1 mx-1',
                  connector,
                  index < currentStep ? stepColorStyles[color] : 'bg-hairline-strong'
                )}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <StepLabels labels={labels} reached={currentStep} />
    </View>
  )
}

function RailSteps({
  currentStep,
  progress,
  totalSteps,
  color = 'success',
  size = 'md',
  labels,
  className,
  accessibilityLabel,
  ...props
}: Omit<ProgressStepsProps, 'variant'>) {
  const reducedMotion = usePrefersReducedMotion()
  const position = railPosition(progress ?? currentStep, totalSteps, reducedMotion)
  const reached = Math.min(Math.ceil(position), totalSteps - 1)
  const { chip, connector } = stepSizeStyles[size]
  const fillClass = stepColorStyles[color]
  const mode = useSurfaceMode()
  const tintColors = [progressColor('primary', mode), progressColor(color, mode)] as const

  return (
    <View
      className={cn('w-full flex-row items-start', className)}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel ?? `Step ${reached + 1} of ${totalSteps}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: reached + 1 }}
      // react-native-web drops accessibilityValue, so web reads the aria props.
      aria-valuemin={0}
      aria-valuemax={totalSteps}
      aria-valuenow={reached + 1}
      {...props}
    >
      {Array.from({ length: totalSteps }).map((_, index) => (
        <RailStep
          key={index}
          index={index}
          position={position}
          totalSteps={totalSteps}
          sizeClass={chip}
          fillClass={fillClass}
          tintColors={tintColors}
          connectorClass={connector}
          label={labels?.[index]}
          isReached={index <= reached}
        />
      ))}
    </View>
  )
}

/**
 * Step-based progress indicator. `variant="rail"` draws done / active / pending chips whose
 * connectors fill with a fractional `progress`; time stays a prop.
 *
 * @example
 * <ProgressSteps currentStep={2} totalSteps={4} labels={['Cart', 'Shipping', 'Payment', 'Done']} />
 *
 * @example
 * <ProgressSteps variant="rail" currentStep={1} progress={1.5} totalSteps={4} />
 */
export function ProgressSteps({ variant = 'dots', progress, ...props }: ProgressStepsProps) {
  return variant === 'rail' ? <RailSteps progress={progress} {...props} /> : <DotSteps {...props} />
}

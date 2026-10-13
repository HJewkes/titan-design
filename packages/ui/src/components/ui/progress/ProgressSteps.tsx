import React from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { interpolate } from '../motion/interpolate'
import { easeOut, poly } from '../motion/easing'
import type { ProgressColor } from './progressColor'

/** `dots`: the compact indicator. `rail`: state chips joined by connectors that fill with `progress`. */
export type ProgressStepsVariant = 'dots' | 'rail'
/** A rail chip's state, announced in its accessibility label. */
export type ProgressStepState = 'done' | 'active' | 'pending'

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
   * rail: at 1.5 steps 0-1 are done, step 2 is active and the connector into it is half full.
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

/** The active chip's core grows as the position arrives at it; quadratic ease-out. */
const arrivalEase = easeOut(poly(2))
/** Full core diameter, as a share of the chip, so the ring stays visible around it. */
const CORE_PERCENT = 50

/** Steps behind the position are done; the step it is moving toward (or resting on) is active. */
function stepStateAt(index: number, position: number): ProgressStepState {
  const active = Math.ceil(position)
  if (index < active) return 'done'
  return index === active ? 'active' : 'pending'
}

function railPosition(position: number, totalSteps: number, reducedMotion: boolean): number {
  const clamped = Math.min(Math.max(position, 0), Math.max(totalSteps - 1, 0))
  // Reduced motion shows where each transition ends: the active step reached, connectors full.
  return reducedMotion ? Math.ceil(clamped) : clamped
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

interface RailChipProps {
  index: number
  position: number
  sizeClass: string
  fillClass: string
  label?: string
}

function RailChip({ index, position, sizeClass, fillClass, label }: RailChipProps) {
  const state = stepStateAt(index, position)
  const arrival = interpolate(position, [index - 1, index], [0, CORE_PERCENT], {
    ease: arrivalEase,
  })

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Step ${index + 1}${label ? `, ${label}` : ''}: ${state}`}
      className={cn(
        'rounded-full items-center justify-center',
        sizeClass,
        state === 'done' && fillClass,
        state === 'active' && 'border-2 border-brand-primary',
        state === 'pending' && 'border-2 border-hairline-strong'
      )}
    >
      {state === 'active' && (
        <View
          className="rounded-full bg-brand-primary"
          style={{ width: `${arrival}%`, height: `${arrival}%` }}
        />
      )}
    </View>
  )
}

function RailConnector({ index, position, sizeClass, fillClass }: Omit<RailChipProps, 'label'>) {
  const fill = interpolate(position, [index, index + 1], [0, 100])

  return (
    <View className={cn('flex-1 mx-1 rounded-full overflow-hidden bg-hairline-strong', sizeClass)}>
      <View className={cn('h-full', fillClass)} style={{ width: `${fill}%` }} />
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
  const active = Math.ceil(position)
  const { chip, connector } = stepSizeStyles[size]
  const fillClass = stepColorStyles[color]

  return (
    <View className={cn('w-full gap-stack-md', className)} {...props}>
      <View
        className="flex-row items-center"
        accessibilityRole="progressbar"
        accessibilityLabel={accessibilityLabel ?? `Step ${active + 1} of ${totalSteps}`}
        accessibilityValue={{ min: 0, max: totalSteps, now: active + 1 }}
        // react-native-web drops accessibilityValue, so web reads the aria props.
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-valuenow={active + 1}
      >
        {Array.from({ length: totalSteps }).map((_, index) => (
          <React.Fragment key={index}>
            <RailChip
              index={index}
              position={position}
              sizeClass={chip}
              fillClass={fillClass}
              label={labels?.[index]}
            />
            {index < totalSteps - 1 && (
              <RailConnector
                index={index}
                position={position}
                sizeClass={connector}
                fillClass={fillClass}
              />
            )}
          </React.Fragment>
        ))}
      </View>

      <StepLabels labels={labels} reached={active} />
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

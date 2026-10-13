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

/** The core grows as the position arrives at a chip, and on to a full disc as it leaves. */
const coreEase = easeOut(poly(2))
/** Core diameter, as a share of the chip, while the position rests on it: a dot in a ring. */
const RESTING_CORE = 50
/**
 * A chip's timeline, in steps of position relative to its anchor: the core grows to the
 * resting dot over `ARRIVE`, fills the chip over `FILL`, then the done colour fades in over
 * `FADE`. Pure functions of position, so a seek or a frame-stepped capture reproduces it.
 */
const ARRIVE = 0.5
const FILL = 0.25
const FADE = 0.25

/** Where a chip's resting point sits: the last step's runs early, so the rail ends done. */
function chipAnchor(index: number, totalSteps: number): number {
  return index === totalSteps - 1 ? index - FILL - FADE : index
}

/** Steps behind the position are done; the step it is moving toward (or resting on) is active. */
function stepStateAt(index: number, position: number, totalSteps: number): ProgressStepState {
  if (index === totalSteps - 1 && position >= totalSteps - 1) return 'done'
  const active = Math.ceil(position)
  if (index < active) return 'done'
  return index === active ? 'active' : 'pending'
}

interface ChipLook {
  state: ProgressStepState
  /** Brand core diameter, percent of the chip. */
  core: number
  /** Opacity of the done-colour layer over the core. */
  done: number
}

function chipLook(index: number, position: number, totalSteps: number): ChipLook {
  const anchor = chipAnchor(index, totalSteps)
  const core =
    position <= anchor
      ? interpolate(position, [anchor - ARRIVE, anchor], [0, RESTING_CORE], { ease: coreEase })
      : interpolate(position, [anchor, anchor + FILL], [RESTING_CORE, 100], { ease: coreEase })
  const done = interpolate(position, [anchor + FILL, anchor + FILL + FADE], [0, 1])
  return { state: stepStateAt(index, position, totalSteps), core, done }
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

interface RailPartProps {
  index: number
  position: number
  totalSteps: number
  sizeClass: string
  fillClass: string
}

function RailChip({
  index,
  position,
  totalSteps,
  sizeClass,
  fillClass,
  label,
}: RailPartProps & { label?: string }) {
  const { state, core, done } = chipLook(index, position, totalSteps)

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={`Step ${index + 1}${label ? `, ${label}` : ''}: ${state}`}
      className={cn('rounded-full items-center justify-center', sizeClass)}
    >
      {done < 1 && (
        <View
          className={cn(
            'absolute inset-0 rounded-full border-2',
            state === 'pending' ? 'border-hairline-strong' : 'border-brand-primary'
          )}
        />
      )}
      {core > 0 && done < 1 && (
        <View
          testID={`progress-steps-core-${index}`}
          className="rounded-full bg-brand-primary"
          style={{ width: `${core}%`, height: `${core}%` }}
        />
      )}
      {done > 0 && (
        <View
          testID={`progress-steps-done-${index}`}
          className={cn('absolute inset-0 rounded-full', fillClass)}
          style={{ opacity: done }}
        />
      )}
    </View>
  )
}

/** Half of the connector between `segment` and `segment + 1`; each half fills over half a step. */
function RailHalf({
  segment,
  half,
  position,
  sizeClass,
  fillClass,
}: { segment: number; half: 'start' | 'end' } & Omit<RailPartProps, 'index' | 'totalSteps'>) {
  const from = half === 'start' ? segment : segment + 0.5
  const fill = interpolate(position, [from, from + 0.5], [0, 100])

  return (
    <View className={cn('flex-1 mx-1 rounded-full overflow-hidden bg-hairline-strong', sizeClass)}>
      <View
        testID={`progress-steps-segment-${segment}-${half}`}
        className={cn('h-full', fillClass)}
        style={{ width: `${fill}%` }}
      />
    </View>
  )
}

interface RailStepProps extends RailPartProps {
  connectorClass: string
  label?: string
  isReached: boolean
}

/** One column: the chip between its connector halves, its label centred beneath. */
function RailStep({ connectorClass, label, isReached, ...part }: RailStepProps) {
  const { index, totalSteps, position, fillClass } = part
  const halfProps = { position, fillClass, sizeClass: connectorClass }

  return (
    <View className="flex-1 items-center gap-stack-md">
      <View className="w-full flex-row items-center">
        {index > 0 ? (
          <RailHalf segment={index - 1} half="end" {...halfProps} />
        ) : (
          <View className="flex-1 mx-1" />
        )}
        <RailChip {...part} label={label} />
        {index < totalSteps - 1 ? (
          <RailHalf segment={index} half="start" {...halfProps} />
        ) : (
          <View className="flex-1 mx-1" />
        )}
      </View>
      {label != null && (
        <Text
          className={cn(
            'px-1 text-xs text-center',
            isReached ? 'text-text-primary font-medium' : 'text-text-secondary'
          )}
        >
          {label}
        </Text>
      )}
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

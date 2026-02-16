import React, { createContext, useContext } from 'react'
import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export type StepStatus = 'completed' | 'active' | 'upcoming' | 'error'
export type StepperOrientation = 'horizontal' | 'vertical'

interface StepperContextType {
  activeStep: number
  orientation: StepperOrientation
}

const StepperContext = createContext<StepperContextType>({
  activeStep: 0,
  orientation: 'horizontal',
})

export interface StepperProps extends ViewProps {
  /** Current active step (0-indexed) */
  activeStep: number
  /** Stepper orientation */
  orientation?: StepperOrientation
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Stepper component for multi-step flows.
 *
 * @example
 * <Stepper activeStep={1}>
 *   <Step>
 *     <StepIndicator />
 *     <StepLabel>Account</StepLabel>
 *   </Step>
 *   <Step>
 *     <StepIndicator />
 *     <StepLabel>Profile</StepLabel>
 *   </Step>
 *   <Step>
 *     <StepIndicator />
 *     <StepLabel>Review</StepLabel>
 *   </Step>
 * </Stepper>
 */
export function Stepper({
  activeStep,
  orientation = 'horizontal',
  className,
  children,
  ...props
}: StepperProps) {
  return (
    <StepperContext.Provider value={{ activeStep, orientation }}>
      <View
        className={cn(
          orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
          className
        )}
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (React.isValidElement(child)) {
            return (
              <>
                {React.cloneElement(child as React.ReactElement<any>, { index })}
                {index < React.Children.count(children) - 1 && (
                  <StepConnector index={index} />
                )}
              </>
            )
          }
          return child
        })}
      </View>
    </StepperContext.Provider>
  )
}

interface StepConnectorProps {
  index: number
}

function StepConnector({ index }: StepConnectorProps) {
  const { activeStep, orientation } = useContext(StepperContext)
  const isCompleted = index < activeStep

  if (orientation === 'horizontal') {
    return (
      <View
        className={cn(
          'flex-1 h-0.5 mx-2',
          isCompleted ? 'bg-brand-primary' : 'bg-border-default'
        )}
      />
    )
  }

  return (
    <View
      className={cn(
        'w-0.5 h-8 ml-4 my-1',
        isCompleted ? 'bg-brand-primary' : 'bg-border-default'
      )}
    />
  )
}

export interface StepProps {
  /** Step index (injected by Stepper) */
  index?: number
  /** Override step status */
  status?: StepStatus
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Individual step in the stepper.
 */
export function Step({ index = 0, status, className, children }: StepProps) {
  const { activeStep, orientation } = useContext(StepperContext)

  const derivedStatus: StepStatus = status || (
    index < activeStep ? 'completed' :
    index === activeStep ? 'active' : 'upcoming'
  )

  return (
    <View
      className={cn(
        orientation === 'horizontal' ? 'items-center' : 'flex-row items-start',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            status: derivedStatus,
            index,
          })
        }
        return child
      })}
    </View>
  )
}

export interface StepIndicatorProps {
  /** Step status (injected by Step) */
  status?: StepStatus
  /** Step index (injected by Step) */
  index?: number
  /** Custom icon */
  icon?: React.ReactNode
  /** Additional className */
  className?: string
}

/**
 * Visual indicator for step status.
 */
export function StepIndicator({
  status = 'upcoming',
  index = 0,
  icon,
  className,
}: StepIndicatorProps) {
  const statusStyles: Record<StepStatus, string> = {
    completed: 'bg-brand-primary border-brand-primary',
    active: 'bg-brand-primary border-brand-primary',
    upcoming: 'bg-surface-base border-border-strong',
    error: 'bg-status-error border-status-error',
  }

  return (
    <View
      className={cn(
        'w-8 h-8 rounded-full border-2 items-center justify-center',
        statusStyles[status],
        className
      )}
    >
      {icon || (
        <Text
          className={cn(
            'text-sm font-semibold',
            status === 'upcoming' ? 'text-text-secondary' : 'text-white'
          )}
        >
          {status === 'completed' ? '✓' : index + 1}
        </Text>
      )}
    </View>
  )
}

export interface StepLabelProps {
  /** Step status (injected by Step) */
  status?: StepStatus
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Label for a step.
 */
export function StepLabel({ status = 'upcoming', className, children }: StepLabelProps) {
  const { orientation } = useContext(StepperContext)

  return (
    <Text
      className={cn(
        'text-sm font-medium',
        orientation === 'horizontal' ? 'mt-2' : 'ml-3',
        status === 'active' ? 'text-text-primary' :
        status === 'completed' ? 'text-brand-primary' :
        status === 'error' ? 'text-status-error' :
        'text-text-secondary',
        className
      )}
    >
      {children}
    </Text>
  )
}

export interface StepContentProps {
  /** Step status (injected by Step) */
  status?: StepStatus
  /** Additional className */
  className?: string
  children?: React.ReactNode
}

/**
 * Content area for vertical stepper.
 */
export function StepContent({ status = 'upcoming', className, children }: StepContentProps) {
  if (status !== 'active') return null

  return (
    <View className={cn('ml-11 mt-2 pb-4', className)}>
      {children}
    </View>
  )
}

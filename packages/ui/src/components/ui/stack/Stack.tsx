import React from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12

const gapClasses: Record<Gap, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
}

export interface StackProps extends ViewProps {
  gap?: Gap
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
  className?: string
  children: React.ReactNode
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
}

export function Stack({
  gap = 0,
  align,
  justify,
  wrap,
  className,
  children,
  ...props
}: StackProps) {
  return (
    <View
      className={cn(
        'flex',
        gapClasses[gap],
        align && alignMap[align],
        justify && justifyMap[justify],
        wrap && 'flex-wrap',
        className,
      )}
      {...props}
    >
      {children}
    </View>
  )
}

export function HStack(props: StackProps) {
  return <Stack {...props} className={cn('flex-row', props.className)} />
}

export function VStack(props: StackProps) {
  return <Stack {...props} className={cn('flex-col', props.className)} />
}

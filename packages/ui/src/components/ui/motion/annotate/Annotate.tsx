import { useCallback, useState, type ReactNode } from 'react'
import { View, type LayoutChangeEvent } from 'react-native'
import { cn } from '../../../../utils/cn'
import type { AnnotationBox } from './annotation-geometry'
import { AnnotationMark, type AnnotationMarkProps } from './AnnotationMark'

/** Props of {@link Annotate}. */
export interface AnnotateProps extends Omit<AnnotationMarkProps, 'box'> {
  /** The annotated content, usually a `Typography` word or phrase. */
  children: ReactNode
  /** Pins the mark's box instead of measuring the children, for a story or a test. */
  box?: AnnotationBox
  /** Tailwind classes merged onto the root. */
  className?: string
}

function useLayoutBox(pinned?: AnnotationBox) {
  const [measured, setMeasured] = useState<AnnotationBox | null>(null)
  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout
    setMeasured({ x: 0, y: 0, w: width, h: height })
  }, [])
  return { box: pinned ?? measured, onLayout }
}

/**
 * Annotate: marks its children with a hand-drawn highlight, underline, box, circle, strike-through or
 * cross, drawn on as `progress` runs 0..1. It measures the children and hands their box to
 * {@link AnnotationMark}; a highlight paints behind the children, every other mark over them.
 *
 * @example
 * <Annotate kind="underline" progress={0.6}>
 *   <Typography variant="h3">deterministic</Typography>
 * </Annotate>
 */
export function Annotate({ children, box: pinned, className, testID, ...mark }: AnnotateProps) {
  const { box, onLayout } = useLayoutBox(pinned)
  const markNode = box && box.w > 0 && box.h > 0 ? <AnnotationMark box={box} {...mark} /> : null
  const isBehind = mark.kind === 'highlight'

  return (
    <View testID={testID} className={cn('relative self-start', className)}>
      {isBehind ? markNode : null}
      <View onLayout={onLayout}>{children}</View>
      {isBehind ? null : markNode}
    </View>
  )
}

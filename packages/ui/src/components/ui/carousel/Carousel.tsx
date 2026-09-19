import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Platform,
  ScrollView,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ViewProps,
} from 'react-native'

import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { usePrefersReducedMotion } from '../../../hooks/usePrefersReducedMotion'
import { space } from '../../../theme/tokens/semantic'
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons'
import { Button, ButtonIcon } from '../button'
import {
  indexAtOffset,
  offsetForIndex,
  positionText,
  slideGeometry,
  slideLabel,
  type SlideGeometry,
} from './carouselMath'
import { useCarouselState, type CarouselState } from './useCarouselState'

export type CarouselPeek = 'sm' | 'md' | 'lg'
export type CarouselControlsSize = 'md' | 'lg'

const PEEK_PX: Record<CarouselPeek, number> = {
  sm: space.gutter.sm,
  md: space.gutter.md,
  lg: space.section.md,
}

const SLIDE_GAP = space.inline.lg

const ICON_PX: Record<CarouselControlsSize, number> = { md: 20, lg: 24 }

/** How long the scroll must rest before the slide under it becomes current. */
const SETTLE_MS = 150

export interface CarouselProps extends ViewProps {
  /** Accessible name of the carousel region, usually the section title. */
  label: string
  /** Controlled current slide (a `CarouselSlide` `value`). */
  value?: string
  /** Uncontrolled starting slide; the first slide when omitted. */
  defaultValue?: string
  /** Fires when a slide becomes current: a settled swipe, an arrow, or focus moving in. */
  onValueChange?: (value: string, index: number) => void
  /** How much of the next slide shows at the trailing edge. */
  peek?: CarouselPeek
  /** Caps a slide on a wide column, so more of the next one shows. */
  maxSlideWidth?: number
  /** Size of the previous and next arrows. `lg` meets the 44pt hit-target floor. */
  controlsSize?: CarouselControlsSize
  className?: string
  /** `CarouselSlide` elements, directly or through an array. */
  children?: React.ReactNode
}

export interface CarouselSlideProps {
  /** Stable key of this slide, e.g. the record id it renders. */
  value: string
  /** Accessible name of this slide, read after its position ("2 of 9: Bench press"). */
  label: string
  /** The card. Give it `flex-1` to stretch it to the tallest slide. */
  children?: React.ReactNode
}

/** One slide's content. `Carousel` reads its props and lays it out. */
export function CarouselSlide({ children }: CarouselSlideProps) {
  return <>{children}</>
}

interface SlideEntry {
  value: string
  label: string
  node: React.ReactNode
}

function collectSlides(children: React.ReactNode): SlideEntry[] {
  return React.Children.toArray(children).flatMap((child) =>
    React.isValidElement<CarouselSlideProps>(child) && child.type === CarouselSlide
      ? [{ value: child.props.value, label: child.props.label, node: child.props.children }]
      : []
  )
}

const regionRole = { 'aria-roledescription': 'carousel' } as ViewProps
const slideRole = { 'aria-roledescription': 'slide' } as ViewProps

/**
 * A row of peer cards, one per view with the next one peeking, that a phone
 * swipes through instead of scrolling past. Follows the WAI-ARIA APG carousel
 * pattern (basic, never rotating): a labelled region, labelled slides, and
 * previous / next buttons under the slides with the position between them.
 * Every slide stays in the accessibility tree in reading order.
 *
 * The current slide is tracked by `value`, so a re-render that adds or removes
 * a slide before it keeps the same card in view.
 *
 * @example
 * <Carousel label="Per-lift" peek="md">
 *   {lifts.map((lift) => (
 *     <CarouselSlide key={lift.id} value={lift.id} label={lift.name}>
 *       <GoalCard size="compact" className="flex-1" {...lift.card} />
 *     </CarouselSlide>
 *   ))}
 * </Carousel>
 */
export function Carousel({
  label,
  value,
  defaultValue,
  onValueChange,
  peek = 'md',
  maxSlideWidth,
  controlsSize = 'lg',
  className,
  children,
  ...props
}: CarouselProps) {
  const slides = collectSlides(children)
  const state = useCarouselState({
    keys: slides.map((slide) => slide.value),
    value,
    defaultValue,
    onValueChange,
  })
  if (slides.length === 0) return null
  if (slides.length === 1) {
    return (
      <View className={className} {...props}>
        {slides[0].node}
      </View>
    )
  }
  return (
    <View role="region" aria-label={label} {...regionRole} className={className} {...props}>
      <CarouselTrack
        slides={slides}
        state={state}
        peek={PEEK_PX[peek]}
        maxSlideWidth={maxSlideWidth}
        controlsSize={controlsSize}
      />
    </View>
  )
}

interface CarouselTrackProps {
  slides: SlideEntry[]
  state: CarouselState
  peek: number
  maxSlideWidth?: number
  controlsSize: CarouselControlsSize
}

function CarouselTrack({ slides, state, peek, maxSlideWidth, controlsSize }: CarouselTrackProps) {
  const { width, onLayout } = useMeasuredWidth()
  const count = slides.length
  const geometry = useMemo(
    () => slideGeometry({ viewportWidth: width ?? 0, count, peek, gap: SLIDE_GAP, maxSlideWidth }),
    [width, count, peek, maxSlideWidth]
  )
  const scrollRef = useRef<ScrollView>(null)
  const sync = useScrollSync(scrollRef, state, geometry, width !== null)
  return (
    <View className="gap-stack-md">
      <View onLayout={onLayout} style={width === null ? { opacity: 0 } : undefined}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled={Platform.OS === 'web'}
          snapToInterval={Platform.OS === 'web' ? undefined : geometry.step}
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={sync.onScroll}
          onMomentumScrollEnd={sync.onSettle}
          contentContainerStyle={{ gap: SLIDE_GAP }}
          style={WEB_OVERSCROLL}
          testID="carousel-viewport"
        >
          {slides.map((slide, index) => (
            <View
              key={slide.value}
              role="group"
              aria-label={slideLabel(index, count, slide.label)}
              {...slideRole}
              onFocus={() => sync.focusSlide(index)}
              style={
                width === null ? WEB_SLIDE_FILL : [WEB_SLIDE_FILL, { width: geometry.slideWidth }]
              }
              testID={`carousel-slide-${slide.value}`}
            >
              {slide.node}
            </View>
          ))}
        </ScrollView>
      </View>
      <CarouselControls
        index={sync.visibleIndex}
        state={state}
        size={controlsSize}
        onStep={sync.stepAnimated}
      />
    </View>
  )
}

// react-native-web wraps each paged child in a snap View; the slide must fill it to stretch.
const WEB_SLIDE_FILL = Platform.OS === 'web' ? { flexGrow: 1 } : {}

// A swipe past the last card must not become the browser's back-swipe navigation.
const WEB_OVERSCROLL = (Platform.OS === 'web' ? { overscrollBehaviorX: 'contain' } : {}) as object

type TimerRef = React.MutableRefObject<ReturnType<typeof setTimeout> | null>

interface ScrollSync {
  visibleIndex: number
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
  onSettle: () => void
  focusSlide: (index: number) => void
  stepAnimated: (delta: number) => void
}

/**
 * Keeps the scroller and the current slide in step. A swipe updates the counter
 * live and commits the slide once the scroll rests; a committed change the
 * scroller did not make (an arrow, focus, a width or data change) scrolls to it.
 */
function useScrollSync(
  scrollRef: React.RefObject<ScrollView>,
  state: CarouselState,
  geometry: SlideGeometry,
  measured: boolean
): ScrollSync {
  const offset = useRef(0)
  const animateNext = useRef(false)
  // True while a glide we started is running, so its frames do not drive the counter.
  const gliding = useRef(false)
  const settleTimer: TimerRef = useRef(null)
  const reducedMotion = usePrefersReducedMotion()
  const [swipeIndex, setSwipeIndex] = useState<number | null>(null)
  const { activeIndex, count, select, step } = state

  useEffect(() => {
    if (!measured) return
    const target = offsetForIndex(activeIndex, count, geometry)
    if (Math.abs(offset.current - target) > 0.5) {
      const animated = animateNext.current && !reducedMotion
      gliding.current = animated
      scrollRef.current?.scrollTo({ x: target, animated })
      offset.current = target
    }
    animateNext.current = false
  }, [scrollRef, activeIndex, count, geometry, measured, reducedMotion])

  useEffect(() => () => clearSettleTimer(settleTimer), [])

  const onSettle = useCallback(() => {
    clearSettleTimer(settleTimer)
    gliding.current = false
    setSwipeIndex(null)
    const index = indexAtOffset(offset.current, count, geometry)
    // An interrupted glide can rest a pixel or two off its snap point; land exactly.
    const target = offsetForIndex(index, count, geometry)
    if (Math.abs(offset.current - target) > 0.5) {
      scrollRef.current?.scrollTo({ x: target, animated: false })
      offset.current = target
    }
    select(index)
  }, [scrollRef, count, geometry, select])

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      offset.current = event.nativeEvent.contentOffset.x
      if (!gliding.current) setSwipeIndex(indexAtOffset(offset.current, count, geometry))
      clearSettleTimer(settleTimer)
      settleTimer.current = setTimeout(onSettle, SETTLE_MS)
    },
    [count, geometry, onSettle]
  )

  const focusSlide = useCallback(
    (index: number) => {
      if (index === activeIndex) return
      animateNext.current = true
      select(index)
    },
    [activeIndex, select]
  )

  const stepAnimated = useCallback(
    (delta: number) => {
      animateNext.current = true
      step(delta)
    },
    [step]
  )

  return { visibleIndex: swipeIndex ?? activeIndex, onScroll, onSettle, focusSlide, stepAnimated }
}

function clearSettleTimer(timer: TimerRef) {
  if (timer.current !== null) clearTimeout(timer.current)
  timer.current = null
}

interface CarouselControlsProps {
  index: number
  state: CarouselState
  size: CarouselControlsSize
  onStep: (delta: number) => void
}

/** Previous arrow, "2 of 9", next arrow: centred under the slides, on the page plane. */
function CarouselControls({ index, state, size, onStep }: CarouselControlsProps) {
  return (
    <View className="flex-row items-center justify-center gap-inline-md">
      <Button
        variant="ghost"
        size={size}
        isIconButton
        isDisabled={!state.canPrevious}
        onPress={() => onStep(-1)}
        accessibilityLabel="Previous slide"
        testID="carousel-previous"
      >
        <ButtonIcon as={ChevronLeftIcon} size={ICON_PX[size]} />
      </Button>
      <View aria-live="polite" aria-atomic>
        <Text className="font-body text-sm text-text-secondary" testID="carousel-position">
          {positionText(index, state.count)}
        </Text>
      </View>
      <Button
        variant="ghost"
        size={size}
        isIconButton
        isDisabled={!state.canNext}
        onPress={() => onStep(1)}
        accessibilityLabel="Next slide"
        testID="carousel-next"
      >
        <ButtonIcon as={ChevronRightIcon} size={ICON_PX[size]} />
      </Button>
    </View>
  )
}

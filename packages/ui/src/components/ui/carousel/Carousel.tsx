import React, { useMemo, useRef } from 'react'
import { Platform, ScrollView, Text, View, type ViewProps } from 'react-native'

import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { space } from '../../../theme/tokens/semantic'
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons'
import { Button, ButtonIcon } from '../button'
import { canClone, slideGeometry, slideLabel, slideSlots, type SlideGeometry } from './carouselMath'
import { useCarouselState, type CarouselState } from './useCarouselState'
import { useDragToScroll } from './useDragToScroll'
import { useScrollSync } from './useScrollSync'

export type CarouselPeek = 'xs' | 'sm' | 'md' | 'lg'
export type CarouselPeekSides = 'trailing' | 'both'
export type CarouselControlsSize = 'md' | 'lg'
export type CarouselControlsGap = 'none' | 'xs' | 'sm'

const PEEK_PX: Record<CarouselPeek, number> = {
  xs: space.inset.md,
  sm: space.gutter.sm,
  md: space.gutter.md,
  lg: space.section.md,
}

const SLIDE_GAP = space.inline.lg

const ICON_PX: Record<CarouselControlsSize, number> = { md: 20, lg: 24 }

/**
 * The arrow keeps a 44pt box for the finger while its glyph sits at the top of
 * it, so the space a reader sees between the cards and the arrow is the gap
 * they chose, not half of the leftover box. The pair adds up to the box height.
 */
const LEAD_IN_CLASS: Record<CarouselControlsGap, string> = {
  none: 'pt-0 pb-6',
  xs: 'pt-1 pb-5',
  sm: 'pt-2 pb-4',
}

const HIT_TARGET_CLASS = 'w-11 h-11'

export interface CarouselProps extends ViewProps {
  /** Accessible name of the carousel region, usually the section title. */
  label: string
  /** Controlled current slide (a `CarouselSlide` `value`). */
  value?: string
  /** Uncontrolled starting slide; the first slide when omitted. */
  defaultValue?: string
  /** Fires when a slide becomes current: a settled swipe, an arrow, or focus moving in. */
  onValueChange?: (value: string, index: number) => void
  /** How much of the neighbouring slide shows. */
  peek?: CarouselPeek
  /** A hint of the next slide only, or of both neighbours with the current slide centred. */
  peekSides?: CarouselPeekSides
  /** Wrap around: forward from the last slide lands on the first, and back again. */
  loop?: boolean
  /** Caps a slide on a wide column, so more of the next one shows. */
  maxSlideWidth?: number
  /** Size of the previous and next arrow glyphs; both sizes keep a 44pt hit target. */
  controlsSize?: CarouselControlsSize
  /** Visible space between the cards and the arrows: 0, 4 or 8 px. */
  controlsGap?: CarouselControlsGap
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
 * A row of peer cards, one per view with the neighbours peeking, that a phone
 * swipes through instead of scrolling past. Follows the WAI-ARIA APG carousel
 * pattern (basic, never rotating): a labelled region, labelled slides, and
 * previous / next buttons under the slides with the position between them.
 * Every real slide stays in the accessibility tree in reading order.
 *
 * The current slide is tracked by `value`, so a re-render that adds or removes
 * a slide before it keeps the same card in view. With `loop`, a copy of each end
 * slide renders at the other end so the first card can hint at the last; the
 * copies are hidden from assistive technology and cannot take focus, and the
 * counter always names the real slide.
 *
 * @example
 * <Carousel label="Per-lift" peek="sm" peekSides="both" loop>
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
  peekSides = 'trailing',
  loop = false,
  maxSlideWidth,
  controlsSize = 'md',
  controlsGap = 'none',
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
        peekSides={peekSides}
        loop={loop}
        maxSlideWidth={maxSlideWidth}
        controlsSize={controlsSize}
        controlsGap={controlsGap}
      />
    </View>
  )
}

interface CarouselTrackProps {
  slides: SlideEntry[]
  state: CarouselState
  peek: number
  peekSides: CarouselPeekSides
  loop: boolean
  maxSlideWidth?: number
  controlsSize: CarouselControlsSize
  controlsGap: CarouselControlsGap
}

function CarouselTrack({
  slides,
  state,
  peek,
  peekSides,
  loop,
  maxSlideWidth,
  controlsSize,
  controlsGap,
}: CarouselTrackProps) {
  const { width, onLayout } = useMeasuredWidth()
  const wrapperRef = useRef<View>(null)
  const scrollRef = useRef<ScrollView>(null)
  const count = slides.length
  const cloned = loop && canClone(count)
  const slots = useMemo(() => slideSlots(count, cloned), [count, cloned])
  const align = peekSides === 'both' ? 'center' : 'start'
  const geometry = useMemo(
    () =>
      slideGeometry({
        viewportWidth: width ?? 0,
        count: slots.length,
        peek,
        gap: SLIDE_GAP,
        maxSlideWidth,
        align,
      }),
    [width, slots.length, peek, maxSlideWidth, align]
  )
  const sync = useScrollSync({
    scrollRef,
    state,
    geometry,
    total: slots.length,
    count,
    cloned,
    loop,
    measured: width !== null,
  })
  useDragToScroll(wrapperRef, sync.onDragStart, sync.onDragRelease)
  return (
    <View>
      <View
        ref={wrapperRef}
        onLayout={onLayout}
        style={width === null ? { opacity: 0 } : undefined}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          snapToInterval={Platform.OS === 'web' ? undefined : geometry.step}
          snapToAlignment={align}
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={sync.onScroll}
          onMomentumScrollEnd={sync.onSettle}
          contentContainerStyle={{ gap: SLIDE_GAP, paddingHorizontal: geometry.padding }}
          style={WEB_SCROLLER_STYLE}
          testID="carousel-viewport"
        >
          {slots.map((slot, position) => (
            <CarouselSlideBox
              key={`${slot.isClone ? 'clone' : 'slide'}-${position}`}
              slide={slides[slot.index]}
              index={slot.index}
              count={count}
              isClone={slot.isClone}
              geometry={geometry}
              measured={width !== null}
              onFocus={sync.focusSlide}
            />
          ))}
        </ScrollView>
      </View>
      <CarouselControls
        index={sync.visibleIndex}
        state={state}
        loop={loop}
        size={controlsSize}
        gap={controlsGap}
        onStep={sync.stepAnimated}
      />
    </View>
  )
}

/**
 * Web needs the snap rules as CSS: `pagingEnabled` would set them itself, but
 * it only ever aligns to the start, and a two-sided hint centres.
 * `overscroll-behavior-x` keeps a swipe past the end off the browser's history.
 */
const WEB_SCROLLER_STYLE = (
  Platform.OS === 'web' ? { overscrollBehaviorX: 'contain', scrollSnapType: 'x mandatory' } : {}
) as object

// react-native-web lays the slide out in a row; it fills the row's height to stretch its card.
const WEB_SLIDE_FILL = Platform.OS === 'web' ? { flexGrow: 1 } : {}

interface CarouselSlideBoxProps {
  slide: SlideEntry
  index: number
  count: number
  isClone: boolean
  geometry: SlideGeometry
  measured: boolean
  onFocus: (index: number) => void
}

/** One rendered slot. A clone is scenery: hidden from assistive tech and unfocusable. */
function CarouselSlideBox({
  slide,
  index,
  count,
  isClone,
  geometry,
  measured,
  onFocus,
}: CarouselSlideBoxProps) {
  const snap = Platform.OS === 'web' ? { scrollSnapAlign: geometry.align } : {}
  const box = measured ? { width: geometry.slideWidth } : {}
  const hidden = isClone ? ({ 'aria-hidden': true } as ViewProps) : {}
  return (
    <View
      ref={isClone ? markInert : undefined}
      role={isClone ? undefined : 'group'}
      aria-label={isClone ? undefined : slideLabel(index, count, slide.label)}
      {...(isClone ? hidden : slideRole)}
      onFocus={isClone ? undefined : () => onFocus(index)}
      style={[WEB_SLIDE_FILL, snap, box] as object}
      testID={isClone ? `carousel-clone-${slide.value}` : `carousel-slide-${slide.value}`}
    >
      {slide.node}
    </View>
  )
}

/** `inert` has no React Native prop, and a clone must not be tabbable. */
function markInert(node: View | null) {
  if (Platform.OS !== 'web' || node === null) return
  ;(node as unknown as HTMLElement).inert = true
}

interface CarouselControlsProps {
  index: number
  state: CarouselState
  loop: boolean
  size: CarouselControlsSize
  gap: CarouselControlsGap
  onStep: (delta: number) => void
}

/** Previous arrow, "2 of 9", next arrow: centred under the slides, on the page plane. */
function CarouselControls({ index, state, loop, size, gap, onStep }: CarouselControlsProps) {
  const lead = LEAD_IN_CLASS[gap]
  return (
    <View className="flex-row items-start justify-center gap-inline-md">
      <CarouselArrow
        direction="previous"
        isDisabled={!loop && !state.canPrevious}
        size={size}
        lead={lead}
        onPress={() => onStep(-1)}
      />
      <View aria-live="polite" aria-atomic className={lead}>
        <Text
          className="font-body text-sm leading-5 text-text-secondary"
          testID="carousel-position"
        >
          {positionLabel(index, state.count)}
        </Text>
      </View>
      <CarouselArrow
        direction="next"
        isDisabled={!loop && !state.canNext}
        size={size}
        lead={lead}
        onPress={() => onStep(1)}
      />
    </View>
  )
}

function positionLabel(index: number, count: number): string {
  return `${String(index + 1)} of ${String(count)}`
}

interface CarouselArrowProps {
  direction: 'previous' | 'next'
  isDisabled: boolean
  size: CarouselControlsSize
  lead: string
  onPress: () => void
}

function CarouselArrow({ direction, isDisabled, size, lead, onPress }: CarouselArrowProps) {
  const isPrevious = direction === 'previous'
  return (
    <Button
      variant="ghost"
      size={size}
      isIconButton
      isDisabled={isDisabled}
      onPress={onPress}
      accessibilityLabel={isPrevious ? 'Previous slide' : 'Next slide'}
      className={`${HIT_TARGET_CLASS} ${lead}`}
      testID={`carousel-${direction}`}
    >
      <ButtonIcon as={isPrevious ? ChevronLeftIcon : ChevronRightIcon} size={ICON_PX[size]} />
    </Button>
  )
}

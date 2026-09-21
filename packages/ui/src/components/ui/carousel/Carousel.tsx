import React, { useEffect, useMemo, useRef } from 'react'
import { Platform, ScrollView, Text, View, type ViewProps } from 'react-native'

import { useMeasuredWidth } from '../../../hooks/useMeasuredWidth'
import { space } from '../../../theme/tokens/semantic'
import { ChevronLeftIcon, ChevronRightIcon } from '../../icons'
import { Button, ButtonIcon } from '../button'
import { cn } from '../../../utils/cn'
import {
  canClone,
  positionText,
  slideGeometry,
  slideLabel,
  slideSlots,
  type SlideGeometry,
} from './carouselMath'
import { useCarouselState, type CarouselState } from './useCarouselState'
import { useDragToScroll } from './useDragToScroll'
import { useScrollSync } from './useScrollSync'

/** How much of each neighbour shows beside the current slide (owner, round 3). */
const HINT_PX = space.inset.md

const SLIDE_GAP = space.inline.lg

const ICON_PX = 20

/**
 * The arrow keeps a 44pt box for the finger while its glyph sits near the top
 * of it, so the space a reader sees between the cards and the arrow is 4px
 * (owner, round 3) rather than half the leftover box. The pair adds up to 44.
 */
const LEAD_IN_CLASS = 'pt-1 pb-5'

const HIT_TARGET_CLASS = 'w-11 h-11'

export interface CarouselProps extends ViewProps {
  /** Accessible name of the carousel region, usually the section title. */
  label: string
  /** Controlled current slide (a `CarouselSlide` `value`). */
  value?: string
  /** Uncontrolled starting slide; the first slide when omitted. */
  defaultValue?: string
  /**
   * Fires when a slide becomes current: a settled swipe, an arrow, or focus moving in.
   * Also fires when `value` names no slide, or the current slide is removed, with the
   * slide shown instead. A controlled carousel whose owner ignores the call scrolls
   * back to `value` once the swipe rests.
   */
  onValueChange?: (value: string, index: number) => void
  /** Wrap around: forward from the last slide lands on the first, and back again. */
  loop?: boolean
  /** Caps a slide on a wide column, so more of each neighbour shows. */
  maxSlideWidth?: number
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

/**
 * The slides among the children: direct, in arrays, or inside fragments. Anything
 * else is dropped, and so is a second slide with a value already taken, since two
 * slides with one value cannot be told apart; both drops warn in development.
 */
function collectSlides(children: React.ReactNode): SlideEntry[] {
  const slides: SlideEntry[] = []
  collectInto(children, slides, new Set<string>())
  return slides
}

function collectInto(children: React.ReactNode, slides: SlideEntry[], seen: Set<string>) {
  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return
    if (child.type === React.Fragment) {
      collectInto((child.props as { children?: React.ReactNode }).children, slides, seen)
      return
    }
    if (child.type !== CarouselSlide) {
      warnOnce(
        `Carousel dropped a <${typeName(child.type)}> child; wrap each card in <CarouselSlide>.`
      )
      return
    }
    const { value, label, children: node } = child.props as CarouselSlideProps
    if (seen.has(value)) {
      warnOnce(`Carousel has two slides with the value "${value}"; the later one is dropped.`)
      return
    }
    seen.add(value)
    slides.push({ value, label: label.trim(), node })
  })
}

function typeName(type: unknown): string {
  if (typeof type === 'string') return type
  const named = type as { displayName?: string; name?: string }
  return named.displayName ?? named.name ?? 'Unknown'
}

// Bundlers replace `process.env.NODE_ENV` literally; the DTS build has no Node types.
declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()

/** Warn once per message in development; the page re-renders on a poll. */
function warnOnce(message: string) {
  if (typeof process === 'undefined' || process.env.NODE_ENV === 'production') return
  if (warned.has(message)) return
  warned.add(message)
  console.warn(`titan: ${message}`)
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
 * Slides are matched by element type, so pass `CarouselSlide` elements (in an
 * array or a fragment is fine); a component that returns one is dropped with a
 * development warning. Values are strings: stringify numeric ids. Slide content
 * should keep no state of its own, because a copy renders the same card again.
 * To stretch a card to the tallest slide, give it and any wrapper between it and
 * the slide `flex-1`.
 *
 * @example
 * <Carousel label="Per-lift">
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
  loop = true,
  maxSlideWidth,
  className,
  children,
  ...props
}: CarouselProps) {
  const slides = collectSlides(children)
  const cap = maxSlideWidth !== undefined && maxSlideWidth > 0 ? maxSlideWidth : undefined
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
      <CarouselTrack slides={slides} state={state} loop={loop} maxSlideWidth={cap} label={label} />
    </View>
  )
}

interface CarouselTrackProps {
  slides: SlideEntry[]
  state: CarouselState
  loop: boolean
  maxSlideWidth?: number
  label: string
}

function CarouselTrack({ slides, state, loop, maxSlideWidth, label }: CarouselTrackProps) {
  const { width, onLayout } = useMeasuredWidth()
  const wrapperRef = useRef<View>(null)
  const scrollRef = useRef<ScrollView>(null)
  const count = slides.length
  const cloned = loop && canClone(count)
  const slots = useMemo(() => slideSlots(count, cloned), [count, cloned])
  const geometry = useMemo(
    () =>
      slideGeometry({
        viewportWidth: width ?? 0,
        count: slots.length,
        peek: HINT_PX,
        gap: SLIDE_GAP,
        maxSlideWidth,
        align: 'center',
      }),
    [width, slots.length, maxSlideWidth]
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
  useDragToScroll(wrapperRef, sync.onDragStart, sync.onDragRelease, sync.onUserScroll)
  useScrollerFocus(wrapperRef, slides, label)
  // The controls come first in the DOM so Tab reaches them before the cards (the APG
  // order; owner, S7), and `flex-col-reverse` still draws them below the cards.
  return (
    <View className="flex-col-reverse">
      <CarouselControls
        index={sync.visibleIndex}
        state={state}
        loop={loop}
        onStep={sync.stepAnimated}
      />
      <View
        ref={wrapperRef}
        onLayout={onLayout}
        style={width === null ? { opacity: 0 } : undefined}
      >
        <ScrollView
          ref={scrollRef}
          horizontal
          snapToInterval={Platform.OS === 'web' ? undefined : geometry.step}
          snapToAlignment="center"
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

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * A scroll region a keyboard cannot reach fails WCAG 2.1.1. When no real card
 * holds anything focusable, the scroller itself takes a Tab stop; when one does,
 * it stays out of the order, since Tab already walks the cards.
 */
function useScrollerFocus(
  wrapperRef: React.RefObject<View | null>,
  slides: SlideEntry[],
  label: string
) {
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const scroller = (wrapperRef.current as unknown as HTMLElement | null)?.firstElementChild
    if (!(scroller instanceof HTMLElement)) return
    const reachable = [...scroller.querySelectorAll(FOCUSABLE)].some((el) => !el.closest('[inert]'))
    if (reachable) {
      scroller.removeAttribute('tabindex')
      scroller.removeAttribute('role')
      scroller.removeAttribute('aria-label')
      return
    }
    // A Tab stop needs a role and a name, or a screen reader announces an unnamed element.
    scroller.setAttribute('tabindex', '0')
    scroller.setAttribute('role', 'group')
    scroller.setAttribute('aria-label', `${label} cards`)
  }, [wrapperRef, slides, label])
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
  onStep: (delta: number) => void
}

/** Previous arrow, "2 of 9", next arrow: centred under the slides, on the page plane. */
function CarouselControls({ index, state, loop, onStep }: CarouselControlsProps) {
  const previousRef = useRef<View>(null)
  const nextRef = useRef<View>(null)
  // A native disabled button drops focus to the page; when a press reaches the
  // end, hand focus to the other arrow first (APG keeps focus on a control).
  const press = (delta: number) => {
    const lands = state.activeIndex + delta
    const atEnd = !loop && (lands <= 0 || lands >= state.count - 1)
    if (atEnd) focusWeb(delta > 0 ? previousRef : nextRef)
    onStep(delta)
  }
  return (
    <View className="flex-row items-start justify-center gap-inline-md">
      <CarouselArrow
        ref={previousRef}
        direction="previous"
        isDisabled={!loop && !state.canPrevious}
        onPress={() => press(-1)}
      />
      <View aria-live="polite" className={LEAD_IN_CLASS}>
        <Text
          className="font-body text-sm leading-5 text-text-secondary"
          testID="carousel-position"
        >
          {positionText(index, state.count)}
        </Text>
      </View>
      <CarouselArrow
        ref={nextRef}
        direction="next"
        isDisabled={!loop && !state.canNext}
        onPress={() => press(1)}
      />
    </View>
  )
}

function focusWeb(ref: React.RefObject<View | null>) {
  if (Platform.OS !== 'web') return
  ;(ref.current as unknown as HTMLElement | null)?.focus()
}

interface CarouselArrowProps {
  direction: 'previous' | 'next'
  isDisabled: boolean
  onPress: () => void
}

const CarouselArrow = React.forwardRef<View, CarouselArrowProps>(function CarouselArrow(
  { direction, isDisabled, onPress },
  ref
) {
  const isPrevious = direction === 'previous'
  return (
    <Button
      ref={ref}
      variant="ghost"
      isIconButton
      isDisabled={isDisabled}
      onPress={onPress}
      accessibilityLabel={isPrevious ? 'Previous slide' : 'Next slide'}
      className={cn(HIT_TARGET_CLASS, LEAD_IN_CLASS)}
      testID={`carousel-${direction}`}
    >
      <ButtonIcon as={isPrevious ? ChevronLeftIcon : ChevronRightIcon} size={ICON_PX} />
    </Button>
  )
})

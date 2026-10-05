import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native'

import { canClone, slideGeometry, slideSlots } from './carouselMath'
import { useCarouselState } from './useCarouselState'
import { useScrollSync } from './useScrollSync'

const COUNT = 9
const KEYS = Array.from({ length: COUNT }, (_, i) => `slide-${String(i)}`)

function geometryFor(total: number) {
  return slideGeometry({ viewportWidth: 360, count: total, peek: 12, gap: 8, align: 'center' })
}

const LOOPED = geometryFor(slideSlots(COUNT, true).length)
const UNLOOPED = geometryFor(slideSlots(COUNT, false).length)

function scrollEvent(x: number) {
  return { nativeEvent: { contentOffset: { x } } } as NativeSyntheticEvent<NativeScrollEvent>
}

function setup({ loop = true, measured = true } = {}) {
  const cloned = loop && canClone(COUNT)
  const total = slideSlots(COUNT, cloned).length
  const geometry = loop ? LOOPED : UNLOOPED
  const scrollTo = vi.fn()
  const scrollRef = { current: { scrollTo } as unknown as ScrollView }
  const hook = renderHook(
    (props: { measured: boolean }) => {
      const state = useCarouselState({ keys: KEYS })
      const sync = useScrollSync({
        scrollRef,
        state,
        geometry,
        total,
        count: COUNT,
        cloned,
        loop,
        measured: props.measured,
      })
      return { sync, activeIndex: state.activeIndex }
    },
    { initialProps: { measured } }
  )
  const log: unknown[] = []
  const record = (step: string) => {
    log.push({
      step,
      scrollTo: scrollTo.mock.calls.splice(0),
      activeIndex: hook.result.current.activeIndex,
      visibleIndex: hook.result.current.sync.visibleIndex,
    })
  }
  const run = (step: string, action: () => void) => {
    act(action)
    record(step)
  }
  record('mount')
  return { hook, log, run, step: geometry.step, sync: () => hook.result.current.sync }
}

describe('useScrollSync', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('aligns without animation once the width is measured', () => {
    const { hook, log, run } = setup({ measured: false })
    run('measured', () => hook.rerender({ measured: true }))
    expect(log).toMatchSnapshot()
  })

  it('glides one slide forward on an arrow', () => {
    const { log, run, sync } = setup()
    run('step +1', () => sync().stepAnimated(1))
    expect(log).toMatchSnapshot()
  })

  it('jumps one slide forward under reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }))
    const { log, run, sync } = setup()
    run('step +1', () => sync().stepAnimated(1))
    expect(log).toMatchSnapshot()
  })

  it('commits the last slide and glides onto its copy on a step back from the first', () => {
    const { log, run, sync } = setup()
    run('step -1', () => sync().stepAnimated(-1))
    expect(log).toMatchSnapshot()
  })

  it('leaves the copy before a second step back that lands before the settle', () => {
    const { log, run, sync } = setup()
    run('step -1', () => sync().stepAnimated(-1))
    run('step -1 again', () => sync().stepAnimated(-1))
    expect(log).toMatchSnapshot()
  })

  it('stops at the last slide without a loop', () => {
    const { log, run, sync } = setup({ loop: false })
    run('focus last', () => sync().focusSlide(COUNT - 1))
    run('step +1', () => sync().stepAnimated(1))
    expect(log).toMatchSnapshot()
  })

  it('follows a user scroll and commits it once the scroll rests', () => {
    const { log, run, sync, step } = setup()
    run('scroll', () => sync().onScroll(scrollEvent(4.2 * step)))
    run('149 ms', () => vi.advanceTimersByTime(149))
    run('150 ms', () => vi.advanceTimersByTime(1))
    expect(log).toMatchSnapshot()
  })

  it('holds the counter during its own glide and releases it within 1 px of the target', () => {
    const { log, run, sync, step } = setup()
    run('step +1', () => sync().stepAnimated(1))
    run('mid glide', () => sync().onScroll(scrollEvent(1.5 * step)))
    run('near target', () => sync().onScroll(scrollEvent(2 * step - 1)))
    run('past target', () => sync().onScroll(scrollEvent(3 * step)))
    expect(log).toMatchSnapshot()
  })

  it('lands a forward flick and re-aligns a flick back onto the start slide', () => {
    const { log, run, sync, step } = setup()
    run('drag start', () => sync().onDragStart())
    run('flick forward', () => sync().onDragRelease({ offset: 1.3 * step, velocity: 2 }))
    run('drag start again', () => sync().onDragStart())
    run('flick back', () => sync().onDragRelease({ offset: 2.2 * step, velocity: -0.01 }))
    expect(log).toMatchSnapshot()
  })

  it('ignores focus on the current slide and glides to another', () => {
    const { log, run, sync } = setup()
    run('focus current', () => sync().focusSlide(0))
    run('focus 3', () => sync().focusSlide(3))
    expect(log).toMatchSnapshot()
  })

  it('drops the wrap when the user takes the scroll mid-wrap', () => {
    const { log, run, sync, step } = setup()
    run('step -1', () => sync().stepAnimated(-1))
    run('user scroll', () => sync().onUserScroll())
    run('scroll', () => sync().onScroll(scrollEvent(0.2 * step)))
    run('settle', () => vi.advanceTimersByTime(150))
    expect(log).toMatchSnapshot()
  })

  it('starts no settle timer for a scroll event after unmount', () => {
    const { hook, sync, step } = setup()
    const onScroll = sync().onScroll
    hook.unmount()
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    onScroll(scrollEvent(3 * step))

    expect(setTimeoutSpy.mock.calls.filter(([, ms]) => ms === 150)).toHaveLength(0)
  })

  it('keeps the drag handlers stable across a re-render with unchanged input', () => {
    const { hook, sync } = setup()
    const before = sync()

    hook.rerender({ measured: true })

    expect(sync().onDragStart).toBe(before.onDragStart)
    expect(sync().onDragRelease).toBe(before.onDragRelease)
    expect(sync().onUserScroll).toBe(before.onUserScroll)
  })
})

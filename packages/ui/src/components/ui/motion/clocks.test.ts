import { afterEach, describe, expect, it, vi } from 'vitest'
import { fakeRaf } from '../../../test/fake-raf'
import { mediaClock, rafClock, REDUCED_MOTION_END_S, seekClock } from './clocks'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('seekClock', () => {
  it('reports the last seek and notifies each subscriber once per seek', () => {
    const clock = seekClock()
    const cb = vi.fn()
    clock.subscribe(cb)
    clock.seek(2.5)
    clock.seek(1.25)
    expect(clock.now()).toBe(1.25)
    expect(cb).toHaveBeenCalledTimes(2)
  })

  it('starts at its initial time', () => {
    expect(seekClock(4).now()).toBe(4)
  })

  it.each([NaN, Infinity, -Infinity])('refuses seek(%s) and keeps the previous time', (t) => {
    const clock = seekClock(2)
    const cb = vi.fn()
    clock.subscribe(cb)
    expect(() => clock.seek(t)).toThrow(RangeError)
    expect(clock.now()).toBe(2)
    expect(cb).not.toHaveBeenCalled()
  })

  it('warns when subscribers re-enter notify 10 deep and throws at 100', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const clock = seekClock()
    let seeks = 0
    clock.subscribe(() => {
      if (seeks++ < 10) clock.seek(seeks)
    })
    clock.seek(0)
    expect(warn).toHaveBeenCalledTimes(1)
    clock.subscribe(() => clock.seek(clock.now() + 1))
    expect(() => clock.seek(0)).toThrow('re-entered notify 100 times')
    warn.mockRestore()
  })

  it('accepts re-entrant seeks below the warning depth silently', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const clock = seekClock()
    clock.subscribe(() => {
      if (clock.now() < 9) clock.seek(clock.now() + 1)
    })
    clock.seek(0)
    expect(clock.now()).toBe(9)
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })

  it('stops notifying after unsubscribe', () => {
    const clock = seekClock()
    const cb = vi.fn()
    clock.subscribe(cb)()
    clock.seek(1)
    expect(cb).not.toHaveBeenCalled()
  })
})

describe('rafClock', () => {
  it('advances by frame timestamps from the first frame', () => {
    const raf = fakeRaf()
    const clock = rafClock()
    const unsubscribe = clock.subscribe(() => {})
    raf.frame(1000)
    expect(clock.now()).toBe(0)
    raf.frame(1500)
    expect(clock.now()).toBe(0.5)
    unsubscribe()
  })

  it('counts on from startS', () => {
    const raf = fakeRaf()
    const clock = rafClock({ startS: 2 })
    const unsubscribe = clock.subscribe(() => {})
    raf.frame(1000)
    raf.frame(1250)
    expect(clock.now()).toBe(2.25)
    unsubscribe()
  })

  it('stops requesting frames when the last subscriber leaves', () => {
    const raf = fakeRaf()
    const unsubscribe = rafClock().subscribe(() => {})
    expect(raf.pending()).toBe(1)
    unsubscribe()
    expect(raf.pending()).toBe(0)
  })

  it('stops at endS: reports the end and requests no further frames while still subscribed', () => {
    const raf = fakeRaf()
    const clock = rafClock({ endS: 1 })
    const cb = vi.fn()
    const unsubscribe = clock.subscribe(cb)
    raf.frame(0)
    raf.frame(1200)
    expect(clock.now()).toBe(1)
    expect(raf.pending()).toBe(0)
    const notifications = cb.mock.calls.length
    raf.frame(5000)
    expect(cb).toHaveBeenCalledTimes(notifications)
    unsubscribe()
  })

  it('shares one frame request between clocks', () => {
    const raf = fakeRaf()
    const a = rafClock()
    const b = rafClock({ startS: 1 })
    const stopA = a.subscribe(() => {})
    const stopB = b.subscribe(() => {})
    expect(raf.pending()).toBe(1)
    raf.frame(0)
    raf.frame(500)
    expect([a.now(), b.now()]).toEqual([0.5, 1.5])
    stopA()
    expect(raf.pending()).toBe(1)
    stopB()
    expect(raf.pending()).toBe(0)
  })

  it('jumps to the end under reduced motion', () => {
    fakeRaf()
    expect(rafClock({ reducedMotion: true }).now()).toBe(REDUCED_MOTION_END_S)
    expect(rafClock({ reducedMotion: true, endS: 0.4 }).now()).toBe(0.4)
  })

  it('requests no frames under reduced motion', () => {
    const raf = fakeRaf()
    rafClock({ reducedMotion: true }).subscribe(() => {})
    expect(raf.pending()).toBe(0)
  })
})

describe('mediaClock', () => {
  it('follows currentTime on timeupdate', () => {
    fakeRaf()
    const audio = document.createElement('audio')
    const clock = mediaClock(audio)
    const cb = vi.fn()
    clock.subscribe(cb)
    audio.currentTime = 3
    audio.dispatchEvent(new Event('timeupdate'))
    expect(clock.now()).toBe(3)
    expect(cb).toHaveBeenCalledTimes(1)
  })

  it('ignores a timeupdate that does not move the time', () => {
    fakeRaf()
    const audio = document.createElement('audio')
    const clock = mediaClock(audio)
    const cb = vi.fn()
    clock.subscribe(cb)
    audio.dispatchEvent(new Event('timeupdate'))
    expect(cb).not.toHaveBeenCalled()
  })

  it('polls every frame while playing and stops on pause', () => {
    const raf = fakeRaf()
    const video = document.createElement('video')
    const clock = mediaClock(video)
    const unsubscribe = clock.subscribe(() => {})
    video.dispatchEvent(new Event('play'))
    video.currentTime = 1.5
    raf.frame(16)
    expect(clock.now()).toBe(1.5)
    video.dispatchEvent(new Event('pause'))
    expect(raf.pending()).toBe(0)
    unsubscribe()
  })

  it('removes its listeners when the last subscriber leaves', () => {
    fakeRaf()
    const audio = document.createElement('audio')
    const clock = mediaClock(audio)
    const cb = vi.fn()
    clock.subscribe(cb)()
    audio.currentTime = 2
    audio.dispatchEvent(new Event('seeked'))
    expect(cb).not.toHaveBeenCalled()
  })
})

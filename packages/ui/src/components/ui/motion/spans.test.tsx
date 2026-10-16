import { act, render } from '@testing-library/react'
import { Text } from 'react-native'
import { describe, expect, it } from 'vitest'
import { seekClock, type SeekClock } from './clocks'
import { localTime, useMotionTime } from './hooks'
import { MotionProvider } from './MotionProvider'
import { all, chain, delay, span } from './timeline'

const timeline = chain(span(1), all(span(1), delay(0.5, span(1))), span(0.5))
const FRAME_S = 1 / 60

function Leaves() {
  const now = useMotionTime()
  return (
    <>
      {timeline.windows.map(({ startS, endS }, i) => {
        const { progress, phase } = localTime(now - startS, endS - startS)
        return <Text key={i} testID={`leaf-${i}`}>{`${progress} ${phase}`}</Text>
      })}
    </>
  )
}

/** Each element's tag, attributes and text, with attribute order ignored: that order is not output. */
function domState(root: Element): string[] {
  return [...root.querySelectorAll('*')].map((el) => {
    const attrs = [...el.attributes].map((a) => `${a.name}=${a.value}`).sort()
    return `${el.tagName} ${attrs.join(' ')} ${el.childElementCount ? '' : el.textContent}`
  })
}

function renderAt(clock: SeekClock) {
  return render(
    <MotionProvider clock={clock}>
      <Leaves />
    </MotionProvider>
  )
}

function play(clock: SeekClock, fromS: number, toS: number): void {
  const step = toS >= fromS ? FRAME_S : -FRAME_S
  for (let s = fromS; step > 0 ? s < toS : s > toS; s += step) act(() => clock.seek(s))
  act(() => clock.seek(toS))
}

const times = [0, 0.4, 1, 1.75, 2.5, 3]

describe('spans under a seek clock', () => {
  it.each(times)('seeking straight to %s s renders what playing up to it renders', (t) => {
    const clock = seekClock(0)
    const played = renderAt(clock)
    play(clock, 0, t)
    const seeked = renderAt(seekClock(t))
    expect(domState(played.container)).toEqual(domState(seeked.container))
  })

  it.each(times)('playing back from the end to %s s renders what seeking to it renders', (t) => {
    const clock = seekClock(0)
    const played = renderAt(clock)
    play(clock, 0, timeline.durationS)
    play(clock, timeline.durationS, t)
    const seeked = renderAt(seekClock(t))
    expect(domState(played.container)).toEqual(domState(seeked.container))
  })
})

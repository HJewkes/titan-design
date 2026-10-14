import { act, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Text } from 'react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { seekClock, type SeekClock } from '../clocks'
import { linear } from '../easing'
import { useLocalTime } from '../hooks'
import { MotionProvider } from '../MotionProvider'
import type { MorphPart } from './match-parts'
import { Morph } from './Morph'

interface Token extends MorphPart {
  label: string
}

const token = (id: string, label: string, x: number, key?: string): Token => ({
  id,
  key,
  label,
  box: { x, y: 0, width: 40, height: 20 },
})

const FROM = [token('a', 'a', 0), token('plus', '+', 40), token('b', 'b', 80), token('old', 'old', 120)]
const TO = [token('b', 'b', 0), token('plus', '+', 40), token('a', 'a', 80), token('new', 'new', 120)]

const paint = (part: Token) => <Text>{part.label}</Text>

function TimedMorph({ keyMap }: { keyMap?: Record<string, string> }) {
  const { progress } = useLocalTime(0, 2)
  return (
    <Morph
      from={FROM}
      to={TO}
      keyMap={keyMap}
      ease={linear}
      progress={progress}
      width={160}
      height={20}
      renderPart={paint}
    />
  )
}

function mountAt(clock: SeekClock, keyMap?: Record<string, string>) {
  return render(
    <MotionProvider clock={clock}>
      <TimedMorph keyMap={keyMap} />
    </MotionProvider>
  )
}

/** What a viewer sees: each layer's id, style, visibility to assistive tech and text. */
const frameOf = (root: HTMLElement) =>
  [...root.querySelectorAll('[data-testid^="morph-layer-"]')].map((el) => [
    el.getAttribute('data-testid'),
    el.getAttribute('style'),
    el.getAttribute('aria-hidden'),
    el.textContent,
  ])

const layer = (id: string) => screen.getByTestId(`morph-layer-${id}`)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Morph', () => {
  // Mutation: rendering `from` parts for matched layers, which would paint `old` labels at the end.
  it('paints each matched part once and each unmatched part on its own layer', () => {
    render(<Morph from={FROM} to={TO} progress={0.5} width={160} height={20} renderPart={paint} />)

    expect(screen.getAllByText('+')).toHaveLength(1)
    expect(layer('from:old')).toHaveTextContent('old')
    expect(layer('to:new')).toHaveTextContent('new')
  })

  // Mutation: reading the clock inside Morph or holding any per-frame state.
  it('renders the same frame for the same time under a seekClock, however it got there', () => {
    const clock = seekClock(1.4)
    const fresh = frameOf(mountAt(clock).container)
    const seeking = seekClock(0)
    const { container } = mountAt(seeking)
    act(() => seeking.seek(2))
    act(() => seeking.seek(0.3))
    act(() => seeking.seek(1.4))

    expect(frameOf(container)).toEqual(fresh)
  })

  // Mutation: dropping `keyMap` before it reaches `partsMorph`.
  it('cross-fades a key-mapped pair', () => {
    mountAt(seekClock(1), { old: 'new' })

    expect(layer('from:old')).toHaveStyle({ opacity: '0.5' })
    expect(layer('to:new')).toHaveStyle({ opacity: '0.5' })
  })

  // Mutation: hiding by `opacity < 0.5` on both sides, which announces both labels mid-fade.
  it('announces only the target at an even cross-fade', () => {
    mountAt(seekClock(1), { old: 'new' })

    expect(layer('from:old')).toHaveAttribute('aria-hidden', 'true')
    expect(layer('to:new')).not.toHaveAttribute('aria-hidden')
  })

  // Mutation: ignoring reduced motion, which leaves the source scene on screen.
  it('shows the target scene under reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })
    )
    render(<Morph from={FROM} to={TO} progress={0} width={160} height={20} renderPart={paint} />)

    expect(layer('from:old')).toHaveStyle({ opacity: '0' })
    expect(layer('to:new')).toHaveStyle({ opacity: '1' })
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <Morph from={FROM} to={TO} progress={0.5} width={160} height={20} renderPart={paint} />
    )

    expect(await axe(container)).toHaveNoViolations()
  })
})

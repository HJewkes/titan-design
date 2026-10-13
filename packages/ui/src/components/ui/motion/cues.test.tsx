import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { ReactNode } from 'react'
import { Text } from 'react-native'
import { describe, expect, it, vi } from 'vitest'
import { Beat, BeatFrame } from './Beat'
import { seekClock } from './clocks'
import { useCue, withCues } from './cues'
import { useLocalTime } from './hooks'
import { MotionProvider } from './MotionProvider'

function CuePhase({ name }: { name: string }) {
  const { phase } = useLocalTime(useCue(name), 1)
  return <Text testID={`cue-${name}`}>{phase}</Text>
}

function CueAt({ name }: { name: string }) {
  return <Text testID="cue-at">{useCue(name)}</Text>
}

/** Each element's tag, attributes and text, with attribute order ignored: that order is not output. */
function domState(root: Element): string[] {
  return [...root.querySelectorAll('*')].map((el) => {
    const attrs = [...el.attributes].map((a) => `${a.name}=${a.value}`).sort()
    return `${el.tagName} ${attrs.join(' ')} ${el.childElementCount ? '' : el.textContent}`
  })
}

function renderAt(at: number, children: ReactNode) {
  return render(<MotionProvider clock={seekClock(at)}>{children}</MotionProvider>)
}

function expectRenderToThrow(children: ReactNode, error: RegExp | ErrorConstructor) {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    expect(() => renderAt(3, children)).toThrow(error)
  } finally {
    consoleError.mockRestore()
  }
}

describe('Beat cues', () => {
  it.each([
    { at: 3.4, phase: 'before' },
    { at: 3.5, phase: 'during' },
  ])('places a cue from the beat start: $phase at $at', ({ at, phase }) => {
    renderAt(
      at,
      <Beat startS={2} durationS={4} cues={{ vo: 1.5 }}>
        <CuePhase name="vo" />
      </Beat>
    )
    expect(screen.getByTestId('cue-vo').textContent).toBe(phase)
  })

  it('reads an outer cue from a nested beat origin', () => {
    renderAt(
      3,
      <Beat startS={2} durationS={4} cues={{ vo: 1.5 }}>
        <Beat startS={1} durationS={2}>
          <CueAt name="vo" />
        </Beat>
      </Beat>
    )
    expect(screen.getByTestId('cue-at').textContent).toBe('0.5')
  })

  it('throws when a nested beat declares a name an enclosing beat already has', () => {
    expectRenderToThrow(
      <Beat startS={0} durationS={4} cues={{ vo: 1 }}>
        <Beat startS={1} durationS={2} cues={{ vo: 0.5 }} />
      </Beat>,
      /"vo"/
    )
  })

  it('lets sibling beats each declare the same name', () => {
    renderAt(
      5,
      <>
        <Beat startS={0} durationS={4} cues={{ vo: 1 }} />
        <Beat startS={4} durationS={4} cues={{ vo: 0.5 }}>
          <CueAt name="vo" />
        </Beat>
      </>
    )
    expect(screen.getByTestId('cue-at').textContent).toBe('0.5')
  })

  it('throws on an unknown cue name and lists the known ones', () => {
    expectRenderToThrow(
      <Beat startS={0} durationS={4} cues={{ vo: 1, title: 2 }}>
        <CueAt name="missing" />
      </Beat>,
      /"missing".*vo, title/
    )
  })

  it.each([{ atS: NaN }, { atS: 5 }, { atS: -0.1 }])(
    'throws a RangeError for a cue at $atS on a 4 s beat',
    ({ atS }) => {
      expectRenderToThrow(<Beat startS={0} durationS={4} cues={{ vo: atS }} />, RangeError)
    }
  )

  it('renders the same DOM with or without cues', () => {
    const frame = (
      <BeatFrame kind="title">
        <Text>Release notes</Text>
      </BeatFrame>
    )
    const plain = renderAt(1, <Beat startS={0} durationS={3}>{frame}</Beat>)
    const cued = renderAt(1, <Beat startS={0} durationS={3} cues={{ vo: 1 }}>{frame}</Beat>)
    expect(domState(cued.container)).toEqual(domState(plain.container))
  })

  it('has no accessibility violations', async () => {
    const { container } = renderAt(
      2,
      <Beat startS={0} durationS={4} cues={{ vo: 1.5 }}>
        <BeatFrame kind="title">
          <CuePhase name="vo" />
        </BeatFrame>
      </Beat>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('withCues', () => {
  it('returns the parent scope unchanged for a beat without cues', () => {
    const parent = new Map([['vo', 1]])
    expect(withCues(parent, undefined, 2, 4)).toBe(parent)
  })

  it('places cues at the beat origin without changing the parent scope', () => {
    const parent = new Map([['vo', 1]])
    const scoped = withCues(parent, { title: 0.5 }, 2, 4)
    expect([...scoped]).toEqual([
      ['vo', 1],
      ['title', 2.5],
    ])
    expect(parent.has('title')).toBe(false)
  })

  it('accepts cues on both edges of the window', () => {
    expect([...withCues(new Map(), { start: 0, end: 4 }, 0, 4).values()]).toEqual([0, 4])
  })

  it('rejects an ancestor duplicate without rendering', () => {
    expect(() => withCues(new Map([['vo', 1]]), { vo: 2 }, 0, 4)).toThrow(/already declared/)
  })
})

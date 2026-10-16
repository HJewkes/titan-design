import React, { useRef } from 'react'
import { render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeOverflow, stageOverflow, useStageFit, type StageContentBox } from './stage-fit'

function Probe({ boxes }: { boxes: StageContentBox[] }) {
  const ref = useRef<HTMLDivElement>(null)
  useStageFit(ref, 'c4-2', () => ({ width: 1920, height: 774, boxes }))
  return <div ref={ref} />
}

function renderQuietly(ui: React.ReactElement) {
  const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
  try {
    return render(ui)
  } finally {
    quiet.mockRestore()
  }
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('stageOverflow', () => {
  it('measures a box past the bottom edge on the vertical axis', () => {
    expect(stageOverflow(1920, 774, [{ x: 0, y: 700, w: 100, h: 80 }])).toEqual({
      top: 0,
      right: 0,
      bottom: 6,
      left: 0,
    })
  })

  it('ignores up to 1 px of layout noise and rounds anything more up', () => {
    expect(stageOverflow(100, 100, [{ x: 0, y: 0, w: 101, h: 10 }]).right).toBe(0)
    expect(stageOverflow(100, 100, [{ x: 0, y: 0, w: 101.5, h: 10 }]).right).toBe(2)
  })

  it('measures every side', () => {
    expect(stageOverflow(100, 100, [{ x: -5, y: -3, w: 120, h: 110 }])).toEqual({
      top: 3,
      right: 15,
      bottom: 7,
      left: 5,
    })
  })
})

describe('describeOverflow', () => {
  it('names the worst side and lists every overflowing side', () => {
    expect(describeOverflow('c4-2', { top: 3, right: 15, bottom: 0, left: 5 })).toBe(
      'c4-2 overflows its stage box by 15 px (top 3, right 15, left 5)'
    )
  })

  it('says nothing when the content fits', () => {
    expect(describeOverflow('c4-2', { top: 0, right: 0, bottom: 0, left: 0 })).toBeUndefined()
  })
})

describe('useStageFit', () => {
  it('throws in development when content runs past the stage, naming it', () => {
    expect(() => renderQuietly(<Probe boxes={[{ x: 0, y: 0, w: 10, h: 900 }]} />)).toThrow(
      'c4-2 overflows its stage box by 126 px (bottom 126)'
    )
  })

  it('stays quiet in production builds', () => {
    vi.stubEnv('NODE_ENV', 'production')

    expect(() => render(<Probe boxes={[{ x: 0, y: 0, w: 10, h: 900 }]} />)).not.toThrow()
  })

  it('accepts content that reaches exactly to the edge', () => {
    expect(() => render(<Probe boxes={[{ x: 0, y: 0, w: 1920, h: 774 }]} />)).not.toThrow()
  })
})

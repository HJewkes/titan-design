import React from 'react'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Text, View } from 'react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Surface } from '../surface/Surface'
import { useResolvedSurface } from '../surface/resolveSurface'
import { BeatStage, type BeatStageProps } from './BeatStage'

expect.extend(toHaveNoViolations)

const HD = { width: 1920, height: 1080 }
const SHIPPED = { header: { headline: 'body' as const }, chipRows: 2 as const }

function renderStage(props: Partial<BeatStageProps> = {}) {
  return render(<BeatStage frame={HD} chrome={SHIPPED} label="c4-2" {...props} />)
}

function rectOf(testID: string) {
  const { left, top, width, height } = screen.getByTestId(testID).style
  return {
    x: parseFloat(left),
    y: parseFloat(top),
    width: parseFloat(width),
    height: parseFloat(height),
  }
}

// jsdom has no layout, so derive one from each element's inline px styles: enough for the fit
// check to measure what a browser would.
const LAYOUT: Record<string, (el: HTMLElement) => unknown> = {
  offsetParent: (el) => el.parentElement,
  offsetLeft: (el) => parseFloat(el.style.left) || 0,
  offsetTop: (el) => parseFloat(el.style.top) || 0,
  offsetWidth: (el) => parseFloat(el.style.width) || 0,
  offsetHeight: (el) => parseFloat(el.style.height) || 0,
  clientWidth: (el) => parseFloat(el.style.width) || 0,
  clientHeight: (el) => parseFloat(el.style.height) || 0,
}

function stubLayout() {
  for (const [prop, read] of Object.entries(LAYOUT)) {
    vi.spyOn(HTMLElement.prototype, prop as 'offsetTop', 'get').mockImplementation(function (
      this: HTMLElement
    ) {
      return read(this) as number
    })
  }
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
  vi.restoreAllMocks()
})

describe('BeatStage', () => {
  it('places each slot at its stageBox rect in frame units', () => {
    renderStage({ units: 'frame' })

    expect(rectOf('beat-stage-header')).toEqual({ x: 60, y: 0, width: 1800, height: 122 })
    expect(rectOf('beat-stage-stage')).toEqual({ x: 0, y: 122, width: 1920, height: 774 })
    expect(rectOf('beat-stage-chips')).toEqual({ x: 60, y: 915, width: 1800, height: 165 })
    expect(screen.getByTestId('beat-stage-stage').style.transform).toBe('')
  })

  it('scales a half-1080 design canvas up to the frame in canvas units', () => {
    renderStage()

    const stage = screen.getByTestId('beat-stage-stage')
    expect(stage.style.transform).toBe('scale(2)')
    expect(rectOf('beat-stage-stage')).toEqual({ x: 0, y: 122, width: 960, height: 387 })
  })

  it('lifts a card from the stage plane, not from the plane it is rendered on', () => {
    function Plane({ testID }: { testID: string }) {
      return <Text testID={testID}>{useResolvedSurface({ raise: 2 }).plane}</Text>
    }
    render(
      <Surface level="frame">
        <BeatStage frame={HD} label="c4-2">
          <Plane testID="lifted" />
        </BeatStage>
        <Surface level="base">
          <Plane testID="expected" />
        </Surface>
      </Surface>
    )

    const lifted = screen.getByTestId('lifted').textContent
    expect(lifted).toBe(screen.getByTestId('expected').textContent)
    expect(lifted).not.toBe('base')
  })

  it('throws naming the beat when stage content runs past the stage', () => {
    stubLayout()

    expect(() =>
      renderQuietly(
        <BeatStage frame={HD} chrome={SHIPPED} units="frame" label="c4-2">
          <View style={{ width: 100, height: 900 }} />
        </BeatStage>
      )
    ).toThrow('c4-2 overflows its stage box by 126 px (bottom 126)')
  })

  it('throws naming the chip band when a chip row runs past it', () => {
    stubLayout()

    expect(() =>
      renderQuietly(
        <BeatStage
          frame={HD}
          chrome={SHIPPED}
          units="frame"
          label="c4-2"
          chips={<View style={{ width: 1900, height: 52 }} />}
        />
      )
    ).toThrow('c4-2 chips overflows its stage box by 100 px (right 100)')
  })

  it('renders content that fits without throwing', () => {
    stubLayout()

    expect(() =>
      render(
        <BeatStage frame={HD} chrome={SHIPPED} units="frame" label="c4-2">
          <View style={{ width: 1920, height: 774 }} />
        </BeatStage>
      )
    ).not.toThrow()
  })

  it('has no accessibility violations and hides the stage material', async () => {
    const { container } = renderStage({
      header: <Text accessibilityRole="header">Seven parts</Text>,
      chips: <Text>verified</Text>,
      children: <Text>Stage content</Text>,
    })

    expect(screen.getByTestId('ambient-stage-grain').getAttribute('aria-hidden')).toBe('true')
    expect(await axe(container)).toHaveNoViolations()
  })
})

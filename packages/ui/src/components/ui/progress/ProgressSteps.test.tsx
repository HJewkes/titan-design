import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ProgressSteps } from './ProgressSteps'
import { progressColor } from './progressColor'
import { chipTint } from './railTimeline'
import { interpolateColor, interpolateColorOklch } from '../motion/color'

const reducedMotion = vi.hoisted(() => ({ value: false }))
vi.mock('../../../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => reducedMotion.value,
}))

const LABELS = ['Plan', 'Build', 'Ship', 'Learn']

function renderRail(progress: number) {
  return render(
    <ProgressSteps
      variant="rail"
      currentStep={0}
      progress={progress}
      totalSteps={4}
      labels={LABELS}
    />
  )
}

function chipStates() {
  return screen.getAllByRole('img').map((chip) => chip.getAttribute('aria-label'))
}

function halfFill(segment: number, half: 'start' | 'end') {
  return parseFloat(screen.getByTestId(`progress-steps-segment-${segment}-${half}`).style.width)
}

/** Each connector is drawn as two halves, one in each step's column; report the whole. */
function connectorFills() {
  return [0, 1, 2].map((segment) => (halfFill(segment, 'start') + halfFill(segment, 'end')) / 2)
}

function cssColor(hex: string) {
  const probe = document.createElement('div')
  probe.style.backgroundColor = hex
  return probe.style.backgroundColor
}

function chipLook(index: number) {
  const core = screen.queryByTestId(`progress-steps-core-${index}`)
  const ring = screen.queryByTestId(`progress-steps-ring-${index}`)
  return {
    ring: ring ? Number(ring.style.opacity) : 0,
    core: core ? core.style.width : null,
    colour: core?.style.backgroundColor || null,
    done: screen.queryByTestId(`progress-steps-done-${index}`) != null,
  }
}

const [BRAND, DONE] = [progressColor('primary', 'dark'), progressColor('success', 'dark')]

describe('ProgressSteps rail', () => {
  beforeEach(() => {
    reducedMotion.value = false
  })

  it('marks passed steps done, the approached step active and the rest pending', () => {
    renderRail(1.5)

    expect(chipStates()).toEqual([
      'Step 1, Plan: done',
      'Step 2, Build: done',
      'Step 3, Ship: active',
      'Step 4, Learn: pending',
    ])
  })

  it('targets the next step as soon as the position leaves a step', () => {
    renderRail(1.25)

    expect(chipStates()[1]).toBe('Step 2, Build: done')
    expect(chipStates()[2]).toBe('Step 3, Ship: active')
  })

  it('fills the connector into the active step with the work on it', () => {
    renderRail(1.375)

    expect(connectorFills()).toEqual([100, 50, 0])
  })

  it('reports the active step as the progressbar value', () => {
    renderRail(1.5)

    const bar = screen.getByRole('progressbar', { name: 'Step 3 of 4' })
    expect(bar).toHaveAttribute('aria-valuenow', '3')
    expect(bar).toHaveAttribute('aria-valuemax', '4')
  })

  it('renders the same tree for the same position', () => {
    const first = renderRail(1.5).container.innerHTML
    const second = renderRail(1.5).container.innerHTML

    expect(second).toBe(first)
  })

  it('takes currentStep as the position when progress is absent', () => {
    render(<ProgressSteps variant="rail" currentStep={2} totalSteps={4} />)

    expect(chipStates()).toEqual([
      'Step 1: done',
      'Step 2: done',
      'Step 3: done',
      'Step 4: pending',
    ])
    expect(connectorFills()).toEqual([100, 100, 0])
  })

  it('clamps a position past the last step to the end, where every step is done', () => {
    renderRail(9)

    expect(chipStates()).toEqual([
      'Step 1, Plan: done',
      'Step 2, Build: done',
      'Step 3, Ship: done',
      'Step 4, Learn: done',
    ])
    expect(chipLook(3)).toEqual({ ring: 0, core: null, colour: null, done: true })
    expect(connectorFills()).toEqual([100, 100, 100])
  })

  it('runs a step from grey ring to orange ring, fills it with the bar, then completes it green', () => {
    const at = (position: number) => {
      const { unmount } = renderRail(position)
      const look = { state: chipStates()[2], bar: connectorFills()[1], ...chipLook(2) }
      unmount()
      return look
    }
    const look = (
      state: string,
      bar: number,
      ring: number,
      core: string | null,
      colour: string | null
    ) => ({
      state: `Step 3, Ship: ${state}`,
      bar,
      ring,
      core,
      colour,
      done: state === 'done',
    })
    const mid = cssColor(chipTint(0.5, [BRAND, DONE]))

    expect(at(1)).toEqual(look('pending', 0, 0, null, null))
    expect(at(1.05)).toMatchObject({ state: 'Step 3, Ship: active', ring: 0.5 })
    expect(at(1.375)).toEqual(look('active', 50, 1, '42.5%', null))
    expect(at(1.75)).toEqual(look('active', 100, 1, '85%', null))
    expect(at(1.875)).toEqual({ ...look('active', 100, 1, '96.25%', mid), ring: 1 })
    expect(at(2)).toEqual(look('done', 100, 0, null, null))
  })

  it('has the prior step green before the bar into the next one starts', () => {
    renderRail(1)

    expect(chipLook(1)).toEqual({ ring: 0, core: null, colour: null, done: true })
    expect(chipStates()[2]).toBe('Step 3, Ship: pending')
  })

  it('mixes the completing colour in OKLCH, not Oklab', () => {
    expect(chipTint(0.5, [BRAND, DONE])).not.toBe(interpolateColor(0.5, [0, 1], [BRAND, DONE]))
  })

  it('holds lightness through the turn so the light theme passes gold, not olive', () => {
    const light = [progressColor('primary', 'light'), progressColor('success', 'light')] as const
    const brightness = (hex: string) =>
      [1, 3, 5].reduce((sum, i) => sum + parseInt(hex.slice(i, i + 2), 16), 0)

    expect(brightness(chipTint(0.5, light))).toBeGreaterThan(
      brightness(interpolateColorOklch(0.5, [0, 1], light))
    )
  })

  it('completes the last step only once the bar into it is full', () => {
    renderRail(2.875)

    expect(chipStates()[3]).toBe('Step 4, Learn: active')
    expect(connectorFills()[2]).toBe(100)
    expect(chipLook(3)).toEqual({
      ring: 1,
      core: '96.25%',
      colour: cssColor(chipTint(0.5, [BRAND, DONE])),
      done: false,
    })
  })

  it('centres each label under its own chip', () => {
    renderRail(1.5)

    LABELS.forEach((label) => {
      const column = screen.getByText(label).parentElement
      expect(column).toContainElement(screen.getByRole('img', { name: new RegExp(label) }))
      expect(column?.querySelectorAll('[role="img"]')).toHaveLength(1)
    })
  })

  it('jumps to the end of the step being worked on under reduced motion', () => {
    reducedMotion.value = true
    renderRail(1.5)

    expect(chipStates()[2]).toBe('Step 3, Ship: done')
    expect(chipLook(2)).toEqual({ ring: 0, core: null, colour: null, done: true })
    expect(chipLook(3)).toEqual({ ring: 0, core: null, colour: null, done: false })
    expect(connectorFills()).toEqual([100, 100, 0])
  })

  it('has no accessibility violations', async () => {
    const { container } = renderRail(1.5)

    expect(await axe(container)).toHaveNoViolations()
  })
})

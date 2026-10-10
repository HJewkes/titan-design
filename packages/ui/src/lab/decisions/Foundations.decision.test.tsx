import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import { axe, toHaveNoViolations } from 'jest-axe'
import preview from '../../../.storybook/preview'
import * as stories from './Foundations.decision.stories'
import {
  FAMILY_MEMBERS,
  TONES,
  familySubtleCell,
  lightLadder,
  planeLadder,
  readAll,
  solidCell,
  subtleCell,
  worst,
  type PackageId,
} from './foundations'

expect.extend(toHaveNoViolations)

const composed = composeStories(stories, { decorators: preview.decorators })
const at2 = (n: number) => Number(n.toFixed(2))

const worstLabel = (pkg: PackageId, mode: 'light' | 'dark') =>
  TONES.map((tone) => at2(worst(readAll(subtleCell(pkg, tone, mode), mode), 'label')))

describe('FD1 planes', () => {
  it('names the 3b light ladder by grey step, frame to input', () => {
    expect(planeLadder('light').map((p) => `${p.level} ${p.swatch.label}`)).toEqual([
      '-2 grey 300',
      '-1 grey 200',
      '0 grey 100',
      '+1 grey 50',
      '+2 white',
      '+3 white',
      '+4 white',
      '+5 white',
      'input grey 50',
    ])
  })

  it('marks every plane but the frame as text-bearing, in both frames', () => {
    render(<composed.Fd1PlanesL />)
    render(<composed.Fd1PlanesD />)

    expect(screen.getAllByText('● carries text')).toHaveLength(16)
    expect(screen.getAllByText('○ no text')).toHaveLength(2)
  })

  it('paints the light frame with the 3b light map whatever the story theme', () => {
    render(<composed.Fd1PlanesL />)
    const frame = screen.getByTestId('fd1-planes-light')

    expect(frame.style.getPropertyValue('--color-surface-base')).toBe('#EDEAE7')
    expect(frame.style.getPropertyValue('--color-background-base')).toBe('#D4D1CE')
  })
})

describe('FD4 subtle packages', () => {
  it('package 1 reads 6.94 to 7.11 in light and 6.95 to 7.65 in dark on every plane', () => {
    expect(worstLabel('opaque', 'light')).toEqual([6.97, 6.98, 6.98, 7.11, 7.02, 6.94])
    expect(worstLabel('opaque', 'dark')).toEqual([7.0, 7.5, 6.95, 7.65, 7.03, 7.15])
  })

  it('today misses AA only on the dark brand and error washes', () => {
    const misses = TONES.filter((_, i) => worstLabel('today', 'dark')[i] < 4.5)

    expect(misses).toEqual(['brand', 'error'])
    expect(Math.min(...worstLabel('today', 'light'))).toBeGreaterThanOrEqual(4.5)
  })

  it('prints the today misses as swatches with their ratio, never as live text', () => {
    render(<composed.Fd4SubtleD />)
    const unit = screen.getByTestId('unit-today')

    expect(within(unit).getAllByText(/misses AA/).length).toBeGreaterThan(0)
    expect(within(screen.getByTestId('cell-today-brand-+3')).queryByText('brand pill')).toBeNull()
  })

  it('states that the 100/700 measurement was taken on a white page', () => {
    render(<composed.Fd4SubtleL />)

    expect(screen.getByText(/measured on a white page/)).toBeTruthy()
  })
})

describe('FD5 family', () => {
  it('reads every solid label at AA except the two light exceptions', () => {
    const light = FAMILY_MEMBERS.map((m) =>
      at2(worst(readAll(solidCell(m, 'light'), 'light'), 'label'))
    )
    const dark = FAMILY_MEMBERS.map((m) =>
      at2(worst(readAll(solidCell(m, 'dark'), 'dark'), 'label'))
    )

    expect(FAMILY_MEMBERS.filter((_, i) => light[i] < 4.5)).toEqual(['orange', 'amber'])
    expect([light[1], light[2]]).toEqual([3.74, 3.63])
    expect(Math.min(...dark)).toBeGreaterThanOrEqual(4.5)
  })

  it('reads every subtle label at AA in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const labels = FAMILY_MEMBERS.map((m) =>
        worst(readAll(familySubtleCell(m, mode), mode), 'label')
      )
      expect(Math.min(...labels)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('renders a row per member with a ToolBadge in each', () => {
    render(<composed.Fd5FamilyL />)

    for (const member of FAMILY_MEMBERS) {
      expect(within(screen.getByTestId(`row-${member}`)).getByTestId('tool-badge')).toBeTruthy()
    }
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<composed.Fd5FamilyL />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('FD3 light ladder', () => {
  it('marks orange 500 and amber 500 as the exceptions, 2.46 and 2.38 on grey 200', () => {
    const ladder = lightLadder()
    const exceptions = ladder.filter((r) => r.isException)

    expect(exceptions.map((r) => r.cell.fillLabel)).toEqual(['orange 500', 'amber 500'])
    expect(exceptions.map((r) => at2(r.edgeOnInset))).toEqual([2.46, 2.38])
  })

  it('prints the edge numbers on the frame', () => {
    render(<composed.Fd3LadderL />)

    expect(screen.getByText(/orange 500 · ★ named exception · edge on grey 200 2.46/)).toBeTruthy()
    expect(screen.getByText(/amber 500 · ★ named exception · edge on grey 200 2.38/)).toBeTruthy()
  })
})

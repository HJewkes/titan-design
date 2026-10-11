import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { contrast } from '../../theme/color-checks'
import { getElevationSurface } from '../../theme/elevation'
import { primitiveRamps } from '../../theme/tokens/primitives'
import { LEVELS, OPTIONS, planesFor, readRamp, type OptionKey } from './elevation-ramps'
import { RampUnit } from './ElevationRampsView'

expect.extend(toHaveNoViolations)

const option = (key: OptionKey) => OPTIONS.find((o) => o.key === key)!
const breaks = (key: OptionKey) =>
  readRamp(option(key), 'light')
    .filter((r) => r.step === 'flat' || r.step === 'down')
    .map((r) => r.level)

describe('Elevation ramps decision', () => {
  it.each(OPTIONS.map((o) => [o.key, o] as const))(
    'renders option %s with every level in both modes',
    (key, o) => {
      render(<RampUnit option={o} />)
      const unit = screen.getByTestId(`ramp-${key}`)
      expect(within(unit).getByRole('heading', { name: o.title })).toBeInTheDocument()
      expect(within(unit).getAllByText(/vs below/)).toHaveLength(LEVELS.length * 2)
    }
  )

  it('paints today exactly as the theme resolves each level', () => {
    for (const mode of ['dark', 'light'] as const) {
      const planes = planesFor(option('today'), mode)
      expect(LEVELS.map((l) => planes[l])).toEqual(LEVELS.map((l) => getElevationSurface(l, mode)))
    }
  })

  it('flags the light breaks the owner described today and none in dark', () => {
    expect(breaks('today')).toEqual([1, 2])
    expect(
      readRamp(option('today'), 'dark').filter((r) => r.step === 'down' || r.step === 'flat')
    ).toEqual([])
  })

  it('finds the monotonic option lighter at every step below the shared overlay', () => {
    expect(breaks('monotonic')).toEqual([])
    expect(breaks('q5c')).toEqual([0, 3])
    expect(breaks('q5cInsets')).toEqual([3])
  })

  it('keeps the red break marks at 4.5:1 on every page they sit on', () => {
    for (const o of OPTIONS) {
      expect(contrast(primitiveRamps.red[700], planesFor(o, 'light')[0])).toBeGreaterThanOrEqual(
        4.5
      )
    }
    expect(
      contrast(primitiveRamps.red[300], planesFor(option('today'), 'dark')[0])
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<RampUnit option={option('today')} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

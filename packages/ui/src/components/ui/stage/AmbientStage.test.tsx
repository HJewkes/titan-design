import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Text } from 'react-native'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AmbientStage } from './AmbientStage'
import { atmosphereWashes, stageGrain } from './atmosphere'

expect.extend(toHaveNoViolations)

const GLOBAL_CSS = readFileSync(join(__dirname, '../../../theme/global.css'), 'utf8')

function cssRule(selector: string): string {
  const start = GLOBAL_CSS.indexOf(`${selector} {`)
  return GLOBAL_CSS.slice(start, GLOBAL_CSS.indexOf('}', start))
}

// `radial-gradient(<shape> at <cx> <cy>, rgba(var(--color-<token>-rgb, …), <a>) 0%, transparent <stop>)`
const CSS_WASH =
  /radial-gradient\((ellipse [\d% ]+) at ([\d.]+%) ([\d.]+%), rgba\(var\(--color-([\w-]+)-rgb[^)]*\), ([\d.]+)\) 0%, transparent ([\d.]+%)\)/g

function cssWashes() {
  return [...cssRule('.atmosphere-warm::before').matchAll(CSS_WASH)].map(
    ([, shape, cx, cy, token, a, stop]) => ({
      image: `radial-gradient(${shape} at ${cx} ${cy}, var(--color-${token}) 0%, transparent ${stop})`,
      opacity: Number(a),
    })
  )
}

afterEach(() => {
  vi.useRealTimers()
})

describe('atmosphere', () => {
  it('paints the .atmosphere-warm washes: same shapes, centres, stops and strengths', () => {
    expect(cssWashes()).toHaveLength(2)
    expect(atmosphereWashes()).toEqual(cssWashes())
  })

  it('paints the .grain page-root tile at seed 0', () => {
    const css = cssRule('.grain::after').match(/background-image: (url\(".*"\));/)![1]

    expect(stageGrain(0)).toBe(css)
    expect(stageGrain()).toBe(css)
  })

  it('seeds the grain deterministically', () => {
    expect(stageGrain(7)).toContain("seed='7'")
    expect(stageGrain(7)).toBe(stageGrain(7))
    expect(stageGrain(7)).not.toBe(stageGrain(8))
  })

  it('hides both decorative layers from assistive tech and keeps the content', () => {
    render(
      <AmbientStage>
        <Text>Stage content</Text>
      </AmbientStage>
    )

    const layers = [
      ...screen.getAllByTestId('ambient-stage-wash'),
      screen.getByTestId('ambient-stage-grain'),
    ]
    expect(layers).toHaveLength(3)
    layers.forEach((layer) => expect(layer.getAttribute('aria-hidden')).toBe('true'))
    expect(screen.getByText('Stage content')).toBeTruthy()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AmbientStage>
        <Text>Stage content</Text>
      </AmbientStage>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

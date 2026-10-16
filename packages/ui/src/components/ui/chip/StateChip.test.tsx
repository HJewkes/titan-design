import type { ReactNode } from 'react'
import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { StateChip } from './StateChip'
import { CHIP_STATES, type ChipState } from './chipState'
import { FILL_END } from './stateChipTimeline'
import { SurfaceContext } from '../surface'
import { semanticColorsLight } from '../../../theme/tokens/semantic'
import { capturedClassNames } from '../../../test/classname-capture'

const classesOf = (testID: string) => (capturedClassNames.get(testID) ?? '').split(/\s+/)

function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

const inLight = (node: ReactNode) => (
  <SurfaceContext.Provider value={{ mode: 'light', level: 'base' }}>{node}</SurfaceContext.Provider>
)

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StateChip', () => {
  it.each<[ChipState, string]>([
    ['met', 'bg-status-success-subtle'],
    ['unmet', 'bg-hairline-subtle'],
  ])('paints a %s chip with %s', (state, face) => {
    render(<StateChip text="ci:green@h" state={state} />)
    expect(classesOf('state-chip')).toContain(face)
  })

  it('dashes the border only while unmet, so colour is never the only signal', () => {
    const { rerender } = render(<StateChip text="ci:green@h" state="unmet" />)
    expect(classesOf('state-chip')).toContain('border-dashed')

    rerender(<StateChip text="ci:green@h" state="met" />)
    expect(classesOf('state-chip')).not.toContain('border-dashed')
  })

  it('names the target state as soon as it is set, before the face has turned', () => {
    const { rerender } = render(<StateChip text="ci:green@h" state="unmet" />)
    expect(screen.getByLabelText('ci:green@h: unmet')).toBeInTheDocument()

    rerender(<StateChip text="ci:green@h" state="met" from="unmet" progress={0} />)
    expect(screen.getByLabelText('ci:green@h: met')).toBeInTheDocument()
  })

  it('draws the warning fill partway across the capsule while entering met', () => {
    render(<StateChip text="ci:green@h" state="met" from="unmet" progress={FILL_END / 2} />)
    const width = parseFloat(screen.getByTestId('state-chip-fill').style.width)

    expect(width).toBeGreaterThan(0)
    expect(width).toBeLessThan(100)
  })

  it('mixes the label from the surface theme, not a frozen dark palette', () => {
    render(inLight(<StateChip text="ci:green@h" state="met" from="unmet" progress={FILL_END} />))
    const expected = semanticColorsLight['on-status-warning-subtle'].toLowerCase()

    expect(screen.getByTestId('state-chip-label')).toHaveStyle({ color: expected })
  })

  it('scales label and padding to a video font size', () => {
    render(<StateChip text="ci:green@h" state="unmet" fontPx={40} />)
    expect(screen.getByText('ci:green@h').style.fontSize).toBe('40px')
    expect(screen.getByTestId('state-chip').style.paddingLeft).toBe(`${(16 * 40) / 14}px`)
  })

  it('shows the settled met face under reduced motion', () => {
    stubReducedMotion(true)
    render(<StateChip text="ci:green@h" state="met" from="unmet" progress={0.2} />)

    expect(screen.queryByTestId('state-chip-fill')).toBeNull()
    expect(classesOf('state-chip')).toContain('bg-status-success-subtle')
  })

  it.each(['dark', 'light'] as const)(
    'has no accessibility violations at rest and mid-turn in %s',
    async (theme) => {
      const chips = (
        <div className={theme === 'light' ? 'light' : undefined}>
          {CHIP_STATES.map((state) => (
            <StateChip key={state} text="proof:reproduced@h" state={state} fontPx={40} />
          ))}
          <StateChip text="ci:green@h" state="met" from="unmet" progress={0.8} fontPx={40} />
        </div>
      )
      const { container } = render(theme === 'light' ? inLight(chips) : chips)
      expect(await axe(container)).toHaveNoViolations()
    }
  )
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ChipBand } from './ChipBand'
import { beatFixture } from './__fixtures__/evidence-chips'
import { capturedClassNames } from '../../../test/classname-capture'

const MACHINE = beatFixture('a7-9-machine').chips
const band = (progress: number, extra: Partial<Parameters<typeof ChipBand>[0]> = {}) => (
  <ChipBand testID="band" chips={MACHINE} width={1800} progress={progress} {...extra} />
)

describe('ChipBand', () => {
  it('renders a seeked frame identically to a played one', () => {
    const direct = render(band(0.3)).container.innerHTML
    const { container, rerender } = render(band(0))
    rerender(band(0.1))
    rerender(band(0.3))
    expect(container.innerHTML).toBe(direct)
    expect(render(band(0.3)).container.innerHTML).toBe(direct)
  })

  it('sets every label and citation at 40 px or more on a 1080 frame', () => {
    render(band(1))
    for (const text of [
      screen.getByText('verified'),
      screen.getByText('our framing'),
      screen.getByText('+1'),
    ]) {
      expect(parseFloat(text.style.fontSize)).toBeGreaterThanOrEqual(40)
    }
    expect(
      parseFloat(screen.getByTestId('evidence-chip-source').style.fontSize)
    ).toBeGreaterThanOrEqual(40)
  })

  it('lays the chips on one line that never wraps', () => {
    render(band(1))
    expect((capturedClassNames.get('band') ?? '').split(/\s+/)).toContain('flex-nowrap')
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('starts hidden and shows the end state at once under reduced motion', () => {
    render(band(0))
    expect(screen.getAllByRole('listitem').map((item) => item.style.opacity)).toEqual([
      '0',
      '0',
      '0',
    ])
    render(band(0, { testID: 'reduced', reducedMotion: true }))
    const reduced = screen.getByTestId('reduced').querySelectorAll('[role="listitem"]')
    expect([...reduced].map((item) => (item as HTMLElement).style.opacity)).toEqual(['1', '1', '1'])
  })

  it('names each item by its full citation and the count by the kinds it hides', () => {
    render(band(1))
    expect(
      screen.getByRole('listitem', { name: `verified: ${MACHINE[0].text}` })
    ).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: '1 more: computed' })).toBeInTheDocument()
  })

  it('throws in development when the lead citation cannot fit', () => {
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(band(1, { width: 500 }))).toThrow(/cannot fit/)
    quiet.mockRestore()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(band(1))
    expect(await axe(container)).toHaveNoViolations()
  })
})

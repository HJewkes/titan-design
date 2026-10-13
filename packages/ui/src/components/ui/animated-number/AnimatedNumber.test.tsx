import { render, screen } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AnimatedNumber } from './AnimatedNumber'

expect.extend(toHaveNoViolations)

const visualText = () => screen.getByTestId('animated-number-visual').textContent

function stubReducedMotion(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }))
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('AnimatedNumber', () => {
  it('lands exactly on the formatted value at progress 1', () => {
    render(<AnimatedNumber value={1234.5} decimals={1} progress={1} />)
    expect(visualText()).toBe('1,234.5')
  })

  it('counts with the ease-out curve partway through', () => {
    render(<AnimatedNumber value={100} progress={0.5} />)
    expect(visualText()).toBe('75')
  })

  it('reads the final value across reel columns at progress 1', () => {
    render(<AnimatedNumber value={100} progress={1} mode="reel" />)
    expect(screen.getAllByTestId('animated-number-column')).toHaveLength(3)
    expect(visualText()).toBe('100')
  })

  it('labels the final value for assistive tech even at progress 0', () => {
    render(<AnimatedNumber value={100} progress={0} />)
    expect(visualText()).toBe('0')
    expect(screen.getByLabelText('100')).toBeTruthy()
  })

  it('uses a custom format for both the text and the label', () => {
    render(<AnimatedNumber value={42} progress={1} format={(n) => `${n}%`} />)
    expect(visualText()).toBe('42%')
    expect(screen.getByLabelText('42%')).toBeTruthy()
  })

  it('renders the final value when the user prefers reduced motion', () => {
    stubReducedMotion(true)
    render(<AnimatedNumber value={100} progress={0.2} mode="reel" />)
    expect(visualText()).toBe('100')
  })

  it('renders the same tree for the same progress', () => {
    const first = render(<AnimatedNumber value={9876} progress={0.37} mode="reel" />).container
      .innerHTML
    const second = render(<AnimatedNumber value={9876} progress={0.37} mode="reel" />).container
      .innerHTML
    expect(second).toBe(first)
  })

  it('has no accessibility violations in either mode', async () => {
    const { container } = render(
      <>
        <AnimatedNumber value={1234.5} decimals={1} progress={0.4} />
        <AnimatedNumber value={1234.5} decimals={1} progress={0.4} mode="reel" />
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

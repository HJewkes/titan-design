import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { axe } from 'jest-axe'
import { HighlightText } from './HighlightText'

// Tailwind classes are compiled away under react-native-web, so the stub exposes the
// props Typography receives as DOM attributes.
vi.mock('../typography', () => ({
  Typography: ({
    children,
    color,
    variant,
    className,
  }: {
    children?: React.ReactNode
    color?: string
    variant?: string
    className?: string
  }) => (
    <span data-color={color} data-variant={variant} className={className}>
      {children}
    </span>
  ),
}))

const label = 'Open recent project'
const ranges = [{ start: 0, end: 4 }]

describe('HighlightText', () => {
  it('renders a matched substring in a font-bold node and the rest not', () => {
    const { container } = render(<HighlightText text={label} ranges={ranges} />)
    const bold = container.querySelectorAll('.font-bold')
    expect(bold).toHaveLength(1)
    expect(bold[0].textContent).toBe('Open')
    expect(container.firstElementChild?.className ?? '').not.toContain('font-bold')
  })

  it('exposes the full text as one string', () => {
    const { container } = render(
      <HighlightText
        text={label}
        ranges={[
          { start: 0, end: 4 },
          { start: 12, end: 15 },
        ]}
      />
    )
    expect(container.textContent).toBe(label)
  })

  it('renders nothing for empty text', () => {
    const { container } = render(<HighlightText text="" ranges={ranges} />)
    expect(container.firstChild).toBeNull()
  })

  it('passes color to the root and adds no colour to matched segments', () => {
    const { container } = render(<HighlightText text={label} ranges={ranges} color="disabled" />)
    const root = container.firstElementChild as HTMLElement
    const match = container.querySelector('.font-bold') as HTMLElement
    expect(root.dataset.color).toBe('disabled')
    expect(match.dataset.color).toBe('inherit')
    expect(match.className).toBe('font-bold')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<HighlightText text={label} ranges={ranges} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

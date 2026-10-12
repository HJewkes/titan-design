import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CardStat } from './CardStat'
import { capturedByNode } from '../../../test/classname-capture'

const classNameOf = (node: Element) => capturedByNode.get(node) ?? ''

describe('CardStat', () => {
  it('renders its label and value', () => {
    render(<CardStat label="Volume" value="76%" />)

    expect(screen.getByText('Volume')).toBeInTheDocument()
    expect(screen.getByText('76%')).toBeInTheDocument()
  })

  it('colours a toned value from a semantic token with no inline colour', () => {
    render(<CardStat label="Fatigue" value="MOD" tone="warning" />)

    const value = screen.getByText('MOD')
    expect(classNameOf(value)).toContain('text-text-warning')
    expect(value.style.color).toBe('')
  })

  it('keeps an untoned value on the primary text token', () => {
    render(<CardStat label="Volume" value="76%" />)

    expect(classNameOf(screen.getByText('76%'))).toContain('text-text-primary')
  })

  it('sits on a card plane rather than a hand-drawn surface class', () => {
    render(<CardStat label="Volume" value="76%" testID="stat" />)

    const card = screen.getByTestId('stat')
    expect(classNameOf(card)).not.toMatch(/bg-surface/)
    expect(card.style.backgroundColor).not.toBe('')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<CardStat label="Fatigue" value="MOD" tone="warning" />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { Tile } from './Tile'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'
import { capturedByNode } from '../../../test/classname-capture'

const classesOf = (node: Element) => (capturedByNode.get(node) ?? '').split(' ')

describe('Tile', () => {
  it('renders label and value', () => {
    render(<Tile label="Volume" value="76%" />)
    expect(screen.getByText('Volume')).toBeInTheDocument()
    expect(screen.getByText('76%')).toBeInTheDocument()
  })

  it('renders its label as a microLabel eyebrow on text-secondary', () => {
    render(<Tile label="Volume" value="76%" />)
    const classes = classesOf(screen.getByText('Volume'))
    expect(classes).toEqual(
      expect.arrayContaining([
        'font-sans',
        'text-2xs',
        'font-semibold',
        'uppercase',
        'tracking-widest',
        'text-text-secondary',
      ])
    )
    expect(classes).not.toContain('text-text-tertiary')
  })

  it('applies valueColor to the value text', () => {
    render(<Tile label="Fatigue" value="MOD" valueColor="#F5A623" />)
    const value = screen.getByText('MOD')
    expect(value).toHaveStyle({ color: '#F5A623' })
  })

  it('does not set an inline color when valueColor is omitted', () => {
    render(<Tile label="Volume" value="76%" />)
    const value = screen.getByText('76%')
    expect(value.style.color).toBe('')
  })

  it('reads its label above its value, as before the CardStat wrapper', () => {
    render(<Tile label="Volume" value="76%" />)
    const label = screen.getByText('Volume')
    const value = screen.getByText('76%')
    expect(label.compareDocumentPosition(value) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('paints the raised plane by default', () => {
    render(<Tile label="Volume" value="76%" testID="tile" />)
    expect(screen.getByTestId('tile').style.backgroundColor).toBe('var(--color-surface-raised)')
  })

  it('takes its plane from a bg class the caller passes', () => {
    render(<Tile label="Reads" value="3" className="bg-surface-overlay" testID="tile" />)
    expect(screen.getByTestId('tile').style.backgroundColor).toBe('var(--color-surface-overlay)')
  })

  it('centres wrapped label and value text by default, and starts it when start-aligned', () => {
    const { rerender } = render(<Tile label="Time" value="3:37 PM" />)
    expect(classesOf(screen.getByText('3:37 PM'))).toContain('text-center')
    expect(classesOf(screen.getByText('Time'))).toContain('text-center')
    rerender(<Tile label="Time" value="3:37 PM" align="start" />)
    expect(classesOf(screen.getByText('3:37 PM'))).toContain('text-left')
  })

  it('renders with start alignment', () => {
    render(<Tile label="Program" value="Pull A" align="start" />)
    expect(screen.getByText('Program')).toBeInTheDocument()
    expect(screen.getByText('Pull A')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Tile label="Load" value="7.3k" className="custom-class" />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('passes additional props through', () => {
    render(<Tile label="Load" value="7.3k" testID="tile-test" />)
    expect(screen.getByText('7.3k')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<Tile label="Volume" value="76%" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

/**
 * Tile's inset, pinned (AW-142 wave two).
 *
 * `px-1.5 py-2` was 6 across and 8 down; 6 is not on the inset ramp, so the
 * tile squares up at 8. The value's `mt-0.5` becomes the parent's stack gap.
 */
describe('Tile geometry resolves to the spacing tokens', () => {
  it('Tile ships its inset and stack gap', () => {
    render(<Tile label="Fatigue" value="MOD" />)
    expect(spacingClassesAt(screen.getByText('Fatigue').parentElement)).toEqual([
      'p-inset-sm',
      'gap-stack-sm',
    ])
    expect(resolveAll(['p-inset-sm', 'gap-stack-sm'])).toEqual(['8px', '4px'])
  })
})

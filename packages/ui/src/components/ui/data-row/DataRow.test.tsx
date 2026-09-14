import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DataRow } from './DataRow'
import { resolveAll, siblingSource, spacingClassesIn } from '../../../test/spacing-resolver'

describe('DataRow', () => {
  it('renders label and string value', () => {
    render(<DataRow label="Weight" value="185 lbs" />)
    expect(screen.getByText('Weight')).toBeInTheDocument()
    expect(screen.getByText('185 lbs')).toBeInTheDocument()
  })

  it('renders label and ReactNode value', () => {
    render(<DataRow label="Status" value={<span data-testid="custom-node">Active</span>} />)
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByTestId('custom-node')).toBeInTheDocument()
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('renders string value as text content', () => {
    render(<DataRow label="Sets" value="5" />)
    const valueEl = screen.getByText('5')
    expect(valueEl).toBeInTheDocument()
    expect(valueEl.textContent).toBe('5')
  })

  it('wraps ReactNode value in a View container', () => {
    const { container } = render(
      <DataRow label="Custom" value={<div data-testid="inner">Content</div>} />
    )
    expect(screen.getByTestId('inner')).toBeInTheDocument()
  })

  it('applies custom className to root container', () => {
    const { container } = render(<DataRow label="Test" value="Value" className="bg-red-500" />)
    const root = container.firstChild as HTMLElement
    expect(root).toBeInTheDocument()
  })

  it('applies valueClassName to string value', () => {
    render(<DataRow label="Test" value="Value" valueClassName="text-lg" />)
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('applies valueClassName to ReactNode wrapper', () => {
    render(<DataRow label="Test" value={<span>Node</span>} valueClassName="text-lg" />)
    expect(screen.getByText('Node')).toBeInTheDocument()
  })

  it('passes through additional ViewProps', () => {
    render(<DataRow label="Test" value="Value" testID="data-row" />)
    expect(screen.getByTestId('data-row')).toBeInTheDocument()
  })

  describe('accessibility', () => {
    it('has no accessibility violations with string value', async () => {
      const { container } = render(<DataRow label="Weight" value="185 lbs" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('has no accessibility violations with ReactNode value', async () => {
      const { container } = render(<DataRow label="Status" value={<span>Active</span>} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

/**
 * DataRow's row inset, pinned (AW-142 wave two).
 *
 * DataRow shipped `py-2` and NO horizontal inset at all. It gains one at 12,
 * one rung below ListItem's 16, so the two row primitives read as one ladder:
 * ListItem 12/16 loose, DataRow 8/12 dense.
 */
describe('DataRow geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'DataRow.tsx')

  it.each([['DataRow', ['py-inset-sm', 'px-inset-md'], ['8px', '12px']]] as const)(
    '%s ships %s',
    (functionName, classes, pixels) => {
      expect(spacingClassesIn(source, functionName)).toEqual([...classes])
      expect(resolveAll([...classes])).toEqual([...pixels])
    }
  )
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DataRow } from './DataRow'
import { resolveAll, siblingSource, spacingClassesIn } from '../../../test/spacing-resolver'
import { cn } from '../../../utils/cn'

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
    render(<DataRow label="Custom" value={<div data-testid="inner">Content</div>} />)
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
 * DataRow's row inset, pinned (AW-142 wave three).
 *
 * Wave two named `py-2` and deliberately left the row GUTTERLESS, because both
 * in-repo callers sat inside a padded container and would have double-inset.
 * Wave three completes the ladder: the row owns 12 across, and the same PR
 * strips the callers' reliance on their container. ListItem is 16/12 loose,
 * DataRow 12/8 dense.
 *
 * The override is asserted too. A semantic key that tailwind-merge does not
 * recognise survives beside the caller's `px-0` and stylesheet order picks the
 * winner — the exact failure that rendered all three Badge sizes at 8px in wave
 * two — so the ladder's escape hatch gets a test, not an assumption.
 */
describe('DataRow geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'DataRow.tsx')

  it('ships the dense rung: 12 across, 8 down, 8 between', () => {
    expect(spacingClassesIn(source, 'DataRow')).toEqual([
      'gap-inline-md',
      'px-inset-md',
      'py-inset-sm',
    ])
    expect(resolveAll(['gap-inline-md', 'px-inset-md', 'py-inset-sm'])).toEqual([
      '8px',
      '12px',
      '8px',
    ])
  })

  it('sits one rung inside ListItem', () => {
    expect(resolveAll(['px-inset-lg', 'py-inset-md'])).toEqual(['16px', '12px'])
  })

  it.each([
    ['px-0 py-1', 'flex-row items-center justify-between gap-inline-md px-0 py-1'],
    ['p-0', 'flex-row items-center justify-between gap-inline-md p-0'],
  ])("a caller's %s replaces the row inset rather than nesting inside it", (override, expected) => {
    expect(
      cn('flex-row items-center justify-between gap-inline-md px-inset-md py-inset-sm', override)
    ).toBe(expected)
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { DataRow } from './DataRow'

describe('DataRow', () => {
  it('renders label and string value', () => {
    render(<DataRow label="Weight" value="185 lbs" />)
    expect(screen.getByText('Weight')).toBeInTheDocument()
    expect(screen.getByText('185 lbs')).toBeInTheDocument()
  })

  it('renders label and ReactNode value', () => {
    render(
      <DataRow label="Status" value={<span data-testid="custom-node">Active</span>} />
    )
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
    const { container } = render(
      <DataRow label="Test" value="Value" className="bg-red-500" />
    )
    const root = container.firstChild as HTMLElement
    expect(root).toBeInTheDocument()
  })

  it('applies valueClassName to string value', () => {
    render(
      <DataRow label="Test" value="Value" valueClassName="text-lg" />
    )
    expect(screen.getByText('Value')).toBeInTheDocument()
  })

  it('applies valueClassName to ReactNode wrapper', () => {
    render(
      <DataRow label="Test" value={<span>Node</span>} valueClassName="text-lg" />
    )
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
      const { container } = render(
        <DataRow label="Status" value={<span>Active</span>} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedClassNames } from '../../../test/classname-capture'
import { IconBox } from './IconBox'

function MockIcon({ size, className }: { size?: number; className?: string }) {
  return (
    <span data-testid="icon" data-size={size} className={className}>
      icon
    </span>
  )
}

describe('IconBox', () => {
  it('renders the icon component', () => {
    render(<IconBox icon={MockIcon} />)
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('passes correct default size to icon (md = 20)', () => {
    render(<IconBox icon={MockIcon} />)
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '20')
  })

  it('passes correct size to icon for sm variant', () => {
    render(<IconBox icon={MockIcon} size="sm" />)
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '16')
  })

  it('passes correct size to icon for lg variant', () => {
    render(<IconBox icon={MockIcon} size="lg" />)
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '24')
  })

  const boxClasses = () => capturedClassNames.get('box')?.split(/\s+/) ?? []

  it.each([
    ['sm', ['w-8', 'h-8', 'rounded-lg']],
    ['md', ['w-10', 'h-10', 'rounded-xl']],
    ['lg', ['w-12', 'h-12', 'rounded-xl']],
  ] as const)('sizes the box with %s classes for size %s', (size, expected) => {
    render(<IconBox icon={MockIcon} size={size} testID="box" />)
    expect(boxClasses()).toEqual(expect.arrayContaining([...expected]))
  })

  it('sizes the box as md by default', () => {
    render(<IconBox icon={MockIcon} testID="box" />)
    expect(boxClasses()).toEqual(expect.arrayContaining(['w-10', 'h-10', 'rounded-xl']))
  })

  it.each([
    ['primary', 'bg-brand-primary-subtle', 'text-brand-primary'],
    ['secondary', 'bg-brand-secondary-subtle', 'text-brand-secondary'],
    ['success', 'bg-status-success-subtle', 'text-status-success'],
    ['error', 'bg-status-error-subtle', 'text-status-error'],
    ['warning', 'bg-status-warning-subtle', 'text-status-warning'],
    ['info', 'bg-status-info-subtle', 'text-status-info'],
    ['neutral', 'bg-surface-elevated', 'text-text-secondary'],
  ] as const)('tints the box and icon for color %s', (color, bg, text) => {
    render(<IconBox icon={MockIcon} color={color} testID="box" />)
    expect(boxClasses()).toContain(bg)
    expect(screen.getByTestId('icon').className.split(/\s+/)).toContain(text)
  })

  it('tints with the neutral color by default', () => {
    render(<IconBox icon={MockIcon} testID="box" />)
    expect(boxClasses()).toContain('bg-surface-elevated')
  })

  it('appends the className prop to the box classes', () => {
    render(<IconBox icon={MockIcon} className="mt-4" testID="box" />)
    expect(boxClasses()).toContain('mt-4')
  })

  it('passes through testID prop', () => {
    render(<IconBox icon={MockIcon} testID="my-icon-box" />)
    expect(screen.getByTestId('my-icon-box')).toBeInTheDocument()
  })

  it('renders with all props combined', () => {
    render(
      <IconBox icon={MockIcon} color="success" size="lg" className="mt-2" testID="full-icon-box" />
    )
    expect(screen.getByTestId('full-icon-box')).toBeInTheDocument()
    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', '24')
  })

  describe('accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = render(<IconBox icon={MockIcon} color="primary" />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })
})

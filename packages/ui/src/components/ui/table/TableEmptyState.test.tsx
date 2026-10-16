import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import type { ViewProps } from 'react-native'
import { TableEmptyState } from './TableEmptyState'

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const React = await import('react')
  const View = React.forwardRef<unknown, ViewProps & { className?: string }>((props, ref) =>
    React.createElement(actual.View, {
      ...props,
      ref,
      dataSet: { class: props.className },
    } as ViewProps)
  )
  return { ...actual, View }
})

describe('TableEmptyState', () => {
  it('draws a custom icon bare, without a well behind it', () => {
    render(<TableEmptyState icon={<span data-testid="empty-icon">E</span>} />)
    expect(screen.getByTestId('empty-icon').parentElement).toHaveAttribute('data-class', 'mb-4')
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TableEmptyState icon={<span>E</span>} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

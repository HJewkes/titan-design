import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const React = await import('react')
  const withClass = (Base: React.ElementType) =>
    React.forwardRef<unknown, { className?: string }>((props, ref) =>
      React.createElement(Base, { ...props, ref, dataSet: { class: props.className } })
    )
  return { ...actual, Pressable: withClass(actual.Pressable), Text: withClass(actual.Text) }
})

import { Select } from './Select'

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
]

const classOf = (el: HTMLElement) => (el.getAttribute('data-class') ?? '').split(/\s+/)

describe('Select classes', () => {
  it('colours the placeholder text-secondary, not text-tertiary', () => {
    render(<Select options={options} placeholder="Pick one" />)
    const classes = classOf(screen.getByText('Pick one'))
    expect(classes).toContain('text-text-secondary')
    expect(classes).not.toContain('text-text-tertiary')
  })

  it('puts the filled variant on the scrim in both modes', () => {
    render(<Select variant="filled" options={options} />)
    expect(classOf(screen.getByRole('combobox'))).toContain('bg-scrim-subtle')
  })

  it('keeps the default variant on the plain surface', () => {
    render(<Select options={options} />)
    expect(classOf(screen.getByRole('combobox'))).toContain('bg-surface-base')
  })

  it.each([
    ['sm', 'h-8'],
    ['md', 'h-10'],
    ['lg', 'h-12'],
  ] as const)('gives size %s the Input control height %s', (size, height) => {
    render(<Select size={size} options={options} />)
    expect(classOf(screen.getByRole('combobox'))).toContain(height)
  })

  it('keeps the padded height when no size is given', () => {
    render(<Select options={options} />)
    const classes = classOf(screen.getByRole('combobox'))
    expect(classes).toContain('py-2.5')
    expect(classes).not.toContain('h-10')
  })
})

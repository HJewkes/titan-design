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
import { Surface } from '../surface'
import { insetFieldStyle } from '../surface/insetField'

const options = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
]

function normalisedColor(color: string) {
  const probe = document.createElement('div')
  probe.style.backgroundColor = color
  return probe.style.backgroundColor
}

const classOf = (el: HTMLElement) => (el.getAttribute('data-class') ?? '').split(/\s+/)

describe('Select classes', () => {
  it('colours the placeholder text-secondary, not text-tertiary', () => {
    render(<Select options={options} placeholder="Pick one" />)
    const classes = classOf(screen.getByText('Pick one'))
    expect(classes).toContain('text-text-secondary')
    expect(classes).not.toContain('text-text-tertiary')
  })

  it.each([
    ['dark', 'raised'],
    ['light', 'raised'],
  ] as const)('fills the filled trigger with the inset well, no bg class (%s)', (mode, level) => {
    render(
      <Surface theme={mode} level={level}>
        <Select variant="filled" options={options} />
      </Surface>
    )
    const trigger = screen.getByRole('combobox')
    const expected = insetFieldStyle(level, mode) as { backgroundColor: string; boxShadow: string }
    expect(classOf(trigger).filter((c) => c.startsWith('bg-'))).toEqual([])
    expect(trigger.style.boxShadow).toBe(expected.boxShadow)
    expect(trigger.style.backgroundColor).toBe(normalisedColor(expected.backgroundColor))
  })

  it('keeps the default variant on the plain surface', () => {
    render(<Select options={options} />)
    expect(classOf(screen.getByRole('combobox'))).toContain('bg-surface-base')
  })

  it.each([
    ['sm', 'h-control-sm'],
    ['md', 'h-control-md'],
    ['lg', 'h-control-lg'],
  ] as const)('gives size %s the Input control height %s', (size, height) => {
    render(<Select size={size} options={options} />)
    expect(classOf(screen.getByRole('combobox'))).toContain(height)
  })

  it('keeps the padded height when no size is given', () => {
    render(<Select options={options} />)
    const classes = classOf(screen.getByRole('combobox'))
    expect(classes).toContain('py-2.5')
    expect(classes).not.toContain('h-control-md')
  })
})

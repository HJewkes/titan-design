import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from '../input'
import { Select } from '../select'
import { Surface } from './Surface'
import { insetFieldClassName, insetFieldStyle, type FieldState } from './insetField'
import { capturedByNode } from '../../../test/classname-capture'

/**
 * Input, TextArea (multiline Input) and Select share one inset-well treatment (#424): the same
 * edge classes per state and the same well, so they read as one family in a form.
 */
const options = [{ value: 'a', label: 'Alpha' }]

type FieldOptions = { isInvalid?: boolean; isDisabled?: boolean }

function renderField(kind: string, opts: FieldOptions): HTMLElement {
  if (kind === 'select') {
    render(<Select variant="filled" options={options} placeholder="Field" {...opts} />)
    return screen.getByRole('combobox')
  }
  render(<Input variant="filled" multiline={kind === 'textarea'} placeholder="Field" {...opts} />)
  return screen.getByPlaceholderText('Field').parentElement as HTMLElement
}

function focusField(kind: string, box: HTMLElement) {
  if (kind === 'select') fireEvent.click(box)
  else fireEvent.focus(screen.getByPlaceholderText('Field'))
}

const classesOf = (node: Element) => (capturedByNode.get(node) ?? '').split(/\s+/)
const expectedClasses = (state: FieldState) => insetFieldClassName(state).split(/\s+/)

const KINDS = ['input', 'textarea', 'select'] as const
const REST: FieldState = { isFocused: false, isInvalid: false, isDisabled: false }

describe('inset-well field family', () => {
  it.each(KINDS)('%s at rest wears the shared edge, with a transparent border', (kind) => {
    const box = renderField(kind, {})
    expect(classesOf(box)).toEqual(expect.arrayContaining(expectedClasses(REST)))
    expect(classesOf(box)).not.toContain('border-hairline-subtle')
  })

  it.each(KINDS)('%s focused drops the well for the focus border and ring', (kind) => {
    const box = renderField(kind, {})
    focusField(kind, box)
    expect(classesOf(box)).toEqual(
      expect.arrayContaining(expectedClasses({ ...REST, isFocused: true }))
    )
    expect(classesOf(box)).toContain('focus-ring')
    expect(box.style.boxShadow).toBe('')
  })

  it('treats a Select holding focus, not yet open, as focused', () => {
    const box = renderField('select', {})
    fireEvent.focus(box)
    expect(classesOf(box)).toEqual(
      expect.arrayContaining(expectedClasses({ ...REST, isFocused: true }))
    )
    fireEvent.blur(box)
    expect(box.style.boxShadow).toContain('inset')
  })

  it.each(KINDS)('%s invalid keeps the well under the error border', (kind) => {
    const box = renderField(kind, { isInvalid: true })
    expect(classesOf(box)).toContain('border-border-input-error')
    expect(box.style.boxShadow).toContain('inset')
  })

  it.each(KINDS)('%s disabled keeps the well, dimmed to the shared opacity', (kind) => {
    const box = renderField(kind, { isDisabled: true })
    expect(classesOf(box)).toContain('opacity-40')
    expect(box.style.boxShadow).toContain('inset')
  })

  it.each([
    ['dark', 'raised'],
    ['light', 'base'],
  ] as const)('gives Input and Select the same well on one plane (%s %s)', (mode, level) => {
    render(
      <Surface theme={mode} level={level}>
        <Input variant="filled" placeholder="Field" />
        <Select variant="filled" options={options} />
      </Surface>
    )
    const inputBox = screen.getByPlaceholderText('Field').parentElement as HTMLElement
    const selectBox = screen.getByRole('combobox')
    const { boxShadow } = insetFieldStyle(level, mode) as { boxShadow: string }
    expect(inputBox.style.boxShadow).toBe(boxShadow)
    expect(selectBox.style.boxShadow).toBe(boxShadow)
    expect(selectBox.style.backgroundColor).toBe(inputBox.style.backgroundColor)
  })
})

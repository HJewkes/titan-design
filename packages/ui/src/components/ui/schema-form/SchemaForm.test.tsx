import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { describe, expect, it, vi } from 'vitest'
import { SchemaForm, type SchemaFormErrors, type SchemaFormProps } from './SchemaForm'
import { compareSchema, compareValue, emptySchema } from './fixtures'
import type { SchemaFormValue } from './schemaFormModel'

expect.extend(toHaveNoViolations)

type HarnessProps = Partial<Omit<SchemaFormProps, 'value' | 'onChange'>> & {
  initial?: SchemaFormValue
  onValue?: (value: SchemaFormValue) => void
}

/** A consumer that owns the value, as every real one does: the form is controlled. */
function Harness({ initial = compareValue, onValue, ...props }: HarnessProps) {
  const [value, setValue] = useState(initial)
  const change = (next: SchemaFormValue) => {
    setValue(next)
    onValue?.(next)
  }
  return <SchemaForm schema={compareSchema} value={value} onChange={change} {...props} />
}

const textbox = (name: string) => screen.getByRole('textbox', { name })
const row = (n: number) => screen.getByRole('group', { name: `Rows row ${n}` })
const rowLefts = () =>
  [1, 2, 3]
    .flatMap((n) => screen.queryAllByRole('group', { name: `Rows row ${n}` }))
    .map((each) => within(each).getByRole('textbox', { name: 'Left' }))

describe('SchemaForm', () => {
  it('renders one control per schema property, each labelled by its title', () => {
    render(<Harness />)

    expect(textbox('Title')).toHaveValue('Alpha vs beta')
    expect(screen.getByRole('combobox', { name: 'Tone' })).toHaveTextContent('calm')
    expect(textbox('Columns')).toHaveValue('2')
    expect(screen.getByRole('checkbox', { name: 'Show legend' })).toHaveAttribute(
      'aria-checked',
      'true'
    )
    expect(
      within(screen.getByRole('group', { name: 'Footer' })).getByRole('textbox', { name: 'Note' })
    ).toHaveValue('Synthetic sample')
    expect(screen.getByText('[0,10]')).toBeInTheDocument()
  })

  it('hands onChange the whole next value when a nested field changes', () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)

    fireEvent.change(within(row(2)).getByRole('textbox', { name: 'Right' }), {
      target: { value: 'Higher' },
    })

    expect(onValue).toHaveBeenLastCalledWith({
      ...compareValue,
      rows: [
        { id: 'speed', left: 'Fast', right: 'Steady' },
        { id: 'cost', left: 'Low', right: 'Higher' },
      ],
    })
  })

  it('counts a maxLength string and turns invalid past the limit', () => {
    render(<Harness />)
    expect(screen.getByText('13/24')).toBeInTheDocument()

    fireEvent.change(textbox('Title'), { target: { value: 'x'.repeat(25) } })

    expect(screen.getByText('25/24')).toHaveAttribute(
      'id',
      textbox('Title').getAttribute('aria-describedby')
    )
    expect(textbox('Title')).toHaveAttribute('aria-invalid', 'true')
  })

  it('picks an enum value from the select', () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)

    fireEvent.click(screen.getByRole('combobox', { name: 'Tone' }))
    fireEvent.click(screen.getByText('bright'))

    expect(onValue).toHaveBeenLastCalledWith(expect.objectContaining({ tone: 'bright' }))
  })

  it('parses a finite number and keeps half-typed text as text', () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)

    fireEvent.change(textbox('Columns'), { target: { value: '3' } })
    expect(onValue).toHaveBeenLastCalledWith(expect.objectContaining({ columns: 3 }))
    fireEvent.change(textbox('Columns'), { target: { value: '-' } })
    expect(onValue).toHaveBeenLastCalledWith(expect.objectContaining({ columns: '-' }))
  })

  it('toggles a boolean', () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)

    fireEvent.click(screen.getByRole('checkbox', { name: 'Show legend' }))

    expect(onValue).toHaveBeenLastCalledWith(expect.objectContaining({ showLegend: false }))
  })

  it('adds rows up to maxItems, giving each a fresh id, then disables Add', () => {
    const onValue = vi.fn()
    render(<Harness onValue={onValue} />)

    fireEvent.click(screen.getByRole('button', { name: 'Add Rows row' }))

    expect(onValue.mock.lastCall?.[0].rows[2]).toEqual({ id: 'row-1', left: '', right: '' })
    expect(screen.getByText('3 of 1–3 rows')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add Rows row' })).toBeDisabled()
  })

  it('removes rows down to minItems and then disables Remove', () => {
    render(<Harness />)

    fireEvent.click(screen.getByRole('button', { name: 'Remove Rows row 2' }))

    expect(rowLefts().map((input) => (input as HTMLInputElement).value)).toEqual(['Fast'])
    expect(screen.getByRole('button', { name: 'Remove Rows row 1' })).toBeDisabled()
  })

  it('reorders rows and disables the moves past either end', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Move Rows row 1 up' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Rows row 2 down' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Move Rows row 2 up' }))

    expect(rowLefts().map((input) => (input as HTMLInputElement).value)).toEqual(['Low', 'Fast'])
  })

  it('shows a locked id read-only with its hint, and keeps its row from being removed', () => {
    render(<Harness lockedIds={['cost']} lockedIdHint="A cue targets this id" />)
    const id = within(row(2)).getByRole('textbox', { name: 'Id' })

    expect(id).toHaveAttribute('readonly')
    expect(screen.getByText('A cue targets this id')).toHaveAttribute(
      'id',
      id.getAttribute('aria-describedby')
    )
    expect(within(row(1)).getByRole('textbox', { name: 'Id' })).not.toHaveAttribute('readonly')
    expect(screen.getByRole('button', { name: 'Remove Rows row 2' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remove Rows row 1' })).toBeEnabled()
  })

  it('places each error at its path and names it from the control', () => {
    const errors: SchemaFormErrors = {
      title: 'Too formal',
      'rows.1.left': ['Too short', 'Not a word'],
      rows: 'Needs a third row',
      tone: 'Pick another',
    }
    render(<Harness errors={errors} />)
    const left = within(row(2)).getByRole('textbox', { name: 'Left' })

    expect(screen.getByText('13/24 · Too formal')).toHaveAttribute(
      'id',
      textbox('Title').getAttribute('aria-describedby')
    )
    expect(screen.getByText('3/16 · Too short; Not a word')).toHaveAttribute(
      'id',
      left.getAttribute('aria-describedby')
    )
    expect(left).toHaveAttribute('aria-invalid', 'true')
    expect(within(row(1)).getByRole('textbox', { name: 'Left' })).toHaveAttribute(
      'aria-invalid',
      'false'
    )
    expect(screen.getByRole('group', { name: 'Rows' })).toHaveAccessibleDescription(
      'Needs a third row'
    )
    expect(screen.getByRole('group', { name: 'Tone' })).toHaveAccessibleDescription('Pick another')
  })

  it('disables every control and row button when isDisabled', () => {
    render(<Harness isDisabled />)

    expect(textbox('Title')).toHaveAttribute('readonly')
    expect(screen.getByRole('checkbox', { name: 'Show legend' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Add Rows row' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Move Rows row 1 down' })).toBeDisabled()
  })

  it('renders the empty state when the schema has no properties', () => {
    render(<SchemaForm schema={emptySchema} value={{}} onChange={() => {}} />)

    expect(screen.getByText('Nothing to edit')).toBeInTheDocument()
  })

  it('has no accessibility violations with values, errors and a locked id', async () => {
    const { container } = render(
      <Harness errors={{ title: 'Too formal', rows: 'Needs a third row' }} lockedIds={['speed']} />
    )

    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations when disabled', async () => {
    const { container } = render(<Harness isDisabled />)

    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no accessibility violations when empty', async () => {
    const { container } = render(<SchemaForm schema={emptySchema} value={{}} onChange={() => {}} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

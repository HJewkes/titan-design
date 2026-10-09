import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { RefChip } from './RefChip'
import { REF_KIND_META, REF_KIND_ORDER, refGraphKinds } from './ref-kind'
import { TASK_PR_STATE_META } from './task-pr'

describe('RefChip', () => {
  it('shows the label and the kind glyph', () => {
    render(<RefChip kind="task" id="task:PL-18" label="PL-18" />)
    expect(screen.getByText('PL-18')).toBeInTheDocument()
    expect(screen.getByText(REF_KIND_META.task.glyph)).toBeInTheDocument()
  })

  it('names the kind, the label and the status for screen readers', () => {
    render(<RefChip kind="pr" id="pr:52" label="#52" status={TASK_PR_STATE_META.merged} />)
    expect(screen.getByLabelText('Pull request #52, Merged')).toBeInTheDocument()
    expect(screen.getByText('Merged')).toBeInTheDocument()
  })

  it('renders static with neither href nor onPressRef: no link and no tab stop', () => {
    const { container } = render(<RefChip kind="session" id="session:e1" label="e1" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('[tabindex="0"]')).toBeNull()
  })

  it('is one link and one tab stop when given onPressRef', () => {
    const { container } = render(
      <RefChip kind="task" id="task:PL-18" label="PL-18" onPressRef={() => {}} />
    )
    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(container.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
  })

  it('is a link when given only an href', () => {
    render(<RefChip kind="task" id="task:PL-18" label="PL-18" href="#/tasks/PL-18" />)
    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('passes the ref to onPressRef on press', () => {
    const onPressRef = vi.fn()
    render(<RefChip kind="task" id="task:PL-18" label="PL-18" onPressRef={onPressRef} />)
    fireEvent.click(screen.getByRole('link'))
    expect(onPressRef).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'task', id: 'task:PL-18', label: 'PL-18' })
    )
  })

  it('has no a11y violations when static', async () => {
    const { container } = render(<RefChip kind="note" id="note:a" label="a.md" />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no a11y violations as a link with a status', async () => {
    const { container } = render(
      <RefChip
        kind="pr"
        id="pr:54"
        label="#54"
        status={TASK_PR_STATE_META.open}
        onPressRef={() => {}}
      />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ref kind vocabulary', () => {
  it('maps every kind onto a graph node kind with a colour', () => {
    const kinds = refGraphKinds()
    expect(kinds.map((k) => k.id)).toEqual([...REF_KIND_ORDER])
    expect(kinds.every((k) => k.color.startsWith('data-'))).toBe(true)
  })

  it('gives every kind its own glyph', () => {
    const glyphs = REF_KIND_ORDER.map((kind) => REF_KIND_META[kind].glyph)
    expect(new Set(glyphs).size).toBe(glyphs.length)
  })
})

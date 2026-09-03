import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { FileActivityRow, type FileActivity } from './FileActivityRow'

const file: FileActivity = {
  path: 'src/commands/open.ts',
  reads: 84,
  writes: 12,
  edits: 61,
  touches: 157,
  timeline: [120, 340, -80, 910],
}

describe('FileActivityRow', () => {
  it('renders the path, touch count, and the read/write/edit split', () => {
    render(<FileActivityRow file={file} />)
    expect(screen.getByText('src/commands/')).toBeInTheDocument()
    expect(screen.getByText('open.ts')).toBeInTheDocument()
    expect(screen.getByText('157')).toBeInTheDocument()
    expect(screen.getByText('84r')).toBeInTheDocument()
    expect(screen.getByText('12w')).toBeInTheDocument()
    expect(screen.getByText('61e')).toBeInTheDocument()
  })

  it('renders a sparkline of the timeline', () => {
    render(<FileActivityRow file={file} />)
    expect(screen.getAllByTestId(/^spark-bars-bar-/)).toHaveLength(4)
  })

  it('shows the selection accent only when selected', () => {
    const { rerender } = render(<FileActivityRow file={file} />)
    expect(screen.queryByTestId('file-activity-row-accent')).not.toBeInTheDocument()
    rerender(<FileActivityRow file={file} selected />)
    expect(screen.getByTestId('file-activity-row-accent')).toBeInTheDocument()
  })

  it('reports selection state to assistive tech as a listbox option', () => {
    const { rerender } = render(<FileActivityRow file={file} selected />)
    expect(screen.getByRole('option', { selected: true })).toBeInTheDocument()
    rerender(<FileActivityRow file={file} />)
    expect(screen.getByRole('option', { selected: false })).toBeInTheDocument()
  })

  it('calls onSelect when pressed', () => {
    const onSelect = vi.fn()
    render(<FileActivityRow file={file} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('option'))
    expect(onSelect).toHaveBeenCalledOnce()
  })

  it('does not throw when pressed without an onSelect handler', () => {
    render(<FileActivityRow file={file} />)
    expect(() => fireEvent.click(screen.getByRole('option'))).not.toThrow()
  })

  it('has no a11y violations inside its listbox', async () => {
    // `role="option"` is only valid within a listbox — which is how
    // FileHistoryExplorer renders it, so the a11y check mirrors that context.
    const { container } = render(
      <div role="listbox" aria-label="Hottest files">
        <FileActivityRow file={file} />
      </div>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { FileHistoryExplorer } from './FileHistoryExplorer'
import {
  FILE_HISTORY_CO_EDGES,
  FILE_HISTORY_FILES,
  FILE_HISTORY_STATS,
} from './file-history-fixture'

const base = {
  stats: FILE_HISTORY_STATS,
  files: FILE_HISTORY_FILES,
  coEdges: FILE_HISTORY_CO_EDGES,
}

describe('FileHistoryExplorer', () => {
  it('renders a KPI tile per stat', () => {
    render(<FileHistoryExplorer {...base} />)
    for (const s of FILE_HISTORY_STATS) {
      // "Sessions" also appears in the detail pane's growth block, so match loosely.
      expect(screen.getAllByText(s.label).length).toBeGreaterThan(0)
    }
  })

  it('renders the provenance caption only when supplied', () => {
    const { rerender } = render(<FileHistoryExplorer {...base} />)
    expect(screen.queryByText('mined deterministically')).not.toBeInTheDocument()
    rerender(<FileHistoryExplorer {...base} provenance="mined deterministically" />)
    expect(screen.getByText('mined deterministically')).toBeInTheDocument()
  })

  it('renders a row per file, capped by maxRows', () => {
    const { rerender } = render(<FileHistoryExplorer {...base} />)
    expect(screen.getAllByTestId('file-activity-row')).toHaveLength(4)
    rerender(<FileHistoryExplorer {...base} maxRows={2} />)
    expect(screen.getAllByTestId('file-activity-row')).toHaveLength(2)
  })

  it('selects the first file by default', () => {
    render(<FileHistoryExplorer {...base} />)
    const rows = screen.getAllByTestId('file-activity-row')
    expect(rows[0]).toHaveAttribute('aria-selected', 'true')
    expect(rows[1]).toHaveAttribute('aria-selected', 'false')
  })

  it('moves the selection on press when uncontrolled', () => {
    render(<FileHistoryExplorer {...base} />)
    fireEvent.click(screen.getAllByTestId('file-activity-row')[1])
    const rows = screen.getAllByTestId('file-activity-row')
    expect(rows[0]).toHaveAttribute('aria-selected', 'false')
    expect(rows[1]).toHaveAttribute('aria-selected', 'true')
  })

  it('honours selectedPath and does not self-update when controlled', () => {
    const onSelectFile = vi.fn()
    render(
      <FileHistoryExplorer
        {...base}
        selectedPath="src/utils/fs-atomic.ts"
        onSelectFile={onSelectFile}
      />
    )
    expect(screen.getAllByTestId('file-activity-row')[2]).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(screen.getAllByTestId('file-activity-row')[0])
    expect(onSelectFile).toHaveBeenCalledWith('src/commands/open.ts')
    expect(screen.getAllByTestId('file-activity-row')[2]).toHaveAttribute('aria-selected', 'true')
  })

  it('falls back to the first file when selectedPath matches nothing', () => {
    render(<FileHistoryExplorer {...base} selectedPath="does/not/exist.ts" />)
    expect(screen.getAllByTestId('file-activity-row')[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('renders a co-change chip per edge, capped by maxCoEdges', () => {
    const { rerender } = render(<FileHistoryExplorer {...base} />)
    expect(screen.getAllByTestId('co-change-chip')).toHaveLength(4)
    rerender(<FileHistoryExplorer {...base} maxCoEdges={2} />)
    expect(screen.getAllByTestId('co-change-chip')).toHaveLength(2)
  })

  it('drops the co-change strip entirely when there are no edges', () => {
    render(<FileHistoryExplorer {...base} coEdges={[]} />)
    expect(screen.queryByTestId('co-change-chip')).not.toBeInTheDocument()
    expect(screen.queryByText('Strongest co-changes across the repo')).not.toBeInTheDocument()
  })

  it('renders no detail pane when there are no files', () => {
    render(<FileHistoryExplorer {...base} files={[]} coEdges={[]} />)
    expect(screen.queryByTestId('file-activity-detail')).not.toBeInTheDocument()
    expect(screen.getByTestId('file-history-explorer')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<FileHistoryExplorer {...base} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { FileActivityDetail } from './FileActivityDetail'
import { FILE_HISTORY_FILES } from './file-history-fixture'

const grew = FILE_HISTORY_FILES[0]
const shrank = FILE_HISTORY_FILES[2]
const noCoChange = FILE_HISTORY_FILES[3]

describe('FileActivityDetail', () => {
  it('renders the split path header and session summary', () => {
    render(<FileActivityDetail file={grew} />)
    // The header dir and a co-change entry share this prefix, hence getAllByText.
    expect(screen.getAllByText('src/commands/').length).toBeGreaterThan(0)
    expect(screen.getByText('open.ts')).toBeInTheDocument()
    expect(screen.getByText(/23 sessions/)).toBeInTheDocument()
  })

  it('renders a tile per activity kind', () => {
    render(<FileActivityDetail file={grew} />)
    for (const label of ['Reads', 'Writes', 'Edits', 'Touches']) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.getByText('157')).toBeInTheDocument()
  })

  it('compacts the growth figures', () => {
    render(<FileActivityDetail file={grew} />)
    expect(screen.getByText('+31.6k ch')).toBeInTheDocument()
    expect(screen.getByText('+41.3k')).toBeInTheDocument()
    expect(screen.getByText('-9.6k')).toBeInTheDocument()
  })

  it('signs a net-negative growth readout', () => {
    render(<FileActivityDetail file={shrank} />)
    expect(screen.getByText('-3.4k ch')).toBeInTheDocument()
  })

  it('lists co-changed files with their counts', () => {
    render(<FileActivityDetail file={grew} />)
    expect(screen.getByText('_open-helpers.ts')).toBeInTheDocument()
    expect(screen.getByText('19×')).toBeInTheDocument()
    expect(screen.getByText('11×')).toBeInTheDocument()
  })

  it('falls back to an explicit line when nothing co-changed', () => {
    render(<FileActivityDetail file={noCoChange} />)
    expect(screen.getByText('no co-changes recorded')).toBeInTheDocument()
  })

  it('falls back to a dash for a missing touch date', () => {
    render(<FileActivityDetail file={{ ...grew, firstTouched: null, lastTouched: null }} />)
    expect(screen.getAllByText('—')).toHaveLength(2)
  })

  it('renders "./" for a file at the repo root', () => {
    render(<FileActivityDetail file={noCoChange} />)
    expect(screen.getByText('./')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<FileActivityDetail file={grew} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

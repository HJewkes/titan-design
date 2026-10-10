import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedClassNames } from '../../../test/classname-capture'
import { StatusMark } from './StatusMark'
import { CODE_CHANGE_META, CODE_CHANGE_ORDER } from './code-status'
import { statusMarkFixtures } from './fixtures'

const markClasses = () => capturedClassNames.get('mark')?.split(/\s+/) ?? []

describe('StatusMark', () => {
  it('renders the visible label for each kind', () => {
    for (const kind of CODE_CHANGE_ORDER) {
      const { unmount } = render(<StatusMark kind={kind} />)
      expect(screen.getByText(CODE_CHANGE_META[kind].label)).toBeInTheDocument()
      unmount()
    }
  })

  it('shows the signed delta for worsened and improved', () => {
    const { unmount } = render(<StatusMark kind="worsened" delta={120} />)
    expect(screen.getByText('+120')).toBeInTheDocument()
    unmount()
    render(<StatusMark kind="improved" delta={120} />)
    expect(screen.getByText('-120')).toBeInTheDocument()
  })

  it('exposes one img with the accessible name in words', () => {
    render(<StatusMark kind="worsened" delta={120} />)
    expect(screen.getAllByRole('img')).toHaveLength(1)
    expect(screen.getByRole('img', { name: 'Worsened by 120' })).toBeInTheDocument()
  })

  it('uses the error tone for worsened over the cutoff', () => {
    const { rerender } = render(<StatusMark kind="worsened" delta={5} testID="mark" />)
    expect(markClasses()).toContain('bg-status-warning-subtle')
    rerender(<StatusMark kind="worsened" delta={5} isOverCutoff testID="mark" />)
    expect(markClasses()).toContain('bg-status-error-subtle')
  })

  it('keeps the tone of other kinds when isOverCutoff is set', () => {
    render(<StatusMark kind="improved" isOverCutoff testID="mark" />)
    expect(markClasses()).toContain('bg-status-success-subtle')
  })

  it('has no accessibility violations for every kind', async () => {
    const { container } = render(
      <>
        {CODE_CHANGE_ORDER.map((kind) => (
          <StatusMark key={kind} kind={kind} delta={42} />
        ))}
        {statusMarkFixtures.map((f) => (
          <StatusMark key={f.name} kind={f.kind} delta={f.delta} isOverCutoff={f.isOverCutoff} />
        ))}
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AwShell } from './AwShell'

describe('AwShell', () => {
  it('marks only the active nav tab as selected', () => {
    render(
      <AwShell active="tasks" title="Tasks">
        {null}
      </AwShell>
    )
    expect(screen.getByRole('tab', { name: 'Tasks' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'false')
  })
})

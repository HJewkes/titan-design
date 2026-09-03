import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { CoChangeChip } from './CoChangeChip'

describe('CoChangeChip', () => {
  it('renders both basenames and the count', () => {
    render(<CoChangeChip a="src/commands/open.ts" b="src/registry/index.ts" count={19} />)
    expect(screen.getByText('open.ts')).toBeInTheDocument()
    expect(screen.getByText('index.ts')).toBeInTheDocument()
    expect(screen.getByText('19×')).toBeInTheDocument()
  })

  it('hides the directory prefixes', () => {
    render(<CoChangeChip a="src/commands/open.ts" b="src/registry/index.ts" count={19} />)
    expect(screen.queryByText('src/commands/')).not.toBeInTheDocument()
    expect(screen.queryByText('src/registry/')).not.toBeInTheDocument()
  })

  it('describes the pair for screen readers', () => {
    render(<CoChangeChip a="a.ts" b="b.ts" count={3} />)
    expect(screen.getByLabelText('a.ts and b.ts changed together 3 times')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<CoChangeChip a="a.ts" b="b.ts" count={3} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

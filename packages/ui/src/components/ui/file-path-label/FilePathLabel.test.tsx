import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { FilePathLabel, splitPath } from './FilePathLabel'

describe('splitPath', () => {
  it('splits a nested path into a trailing-slash dir and a basename', () => {
    expect(splitPath('src/commands/open.ts')).toEqual({
      dir: 'src/commands/',
      base: 'open.ts',
    })
  })

  it('returns an empty dir for a bare filename', () => {
    expect(splitPath('README.md')).toEqual({ dir: '', base: 'README.md' })
  })
})

describe('FilePathLabel', () => {
  it('renders the directory and the basename as separate elements', () => {
    render(<FilePathLabel path="src/commands/open.ts" />)
    expect(screen.getByText('src/commands/')).toBeInTheDocument()
    expect(screen.getByText('open.ts')).toBeInTheDocument()
  })

  it('omits the directory element for a bare filename', () => {
    render(<FilePathLabel path="README.md" />)
    expect(screen.getByText('README.md')).toBeInTheDocument()
    expect(screen.queryByText('/')).not.toBeInTheDocument()
  })

  it('drops the directory when baseOnly is set', () => {
    render(<FilePathLabel path="src/commands/open.ts" baseOnly />)
    expect(screen.queryByText('src/commands/')).not.toBeInTheDocument()
    expect(screen.getByText('open.ts')).toBeInTheDocument()
  })

  // The dir/base size difference now comes from `text-xs` / `text-sm` classes, and
  // nativewind does not compile classNames in the vitest env — so the rendered size
  // is not observable here. Asserting it would mean asserting nothing. Left to
  // visual regression (see the family README's testing follow-up); what remains
  // testable is that both sizes render their parts.
  it.each(['sm', 'md'] as const)('renders both parts at size %s', (size) => {
    render(<FilePathLabel path="src/open.ts" size={size} />)
    expect(screen.getByText('src/')).toBeInTheDocument()
    expect(screen.getByText('open.ts')).toBeInTheDocument()
  })

  it('has no a11y violations', async () => {
    const { container } = render(<FilePathLabel path="src/commands/open.ts" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

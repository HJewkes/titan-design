import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { capturedByNode } from '../../../test/classname-capture'
import { Kbd } from './Kbd'

describe('Kbd', () => {
  it('names a symbol shortcut by its spoken key names', () => {
    render(<Kbd keys={['⌘', 'K']} />)

    expect(screen.getByLabelText('Command K')).toBeInTheDocument()
  })

  it('reads an unknown key as itself', () => {
    render(<Kbd keys={['Q']} />)

    expect(screen.getByLabelText('Q')).toBeInTheDocument()
  })

  it('renders one keycap per key', () => {
    render(<Kbd keys={['⌘', '⇧', 'P']} />)

    expect(screen.getAllByTestId('kbd-key')).toHaveLength(3)
  })

  it('renders nothing when there are no keys', () => {
    const { container } = render(<Kbd keys={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('lets accessibilityLabel override the derived name', () => {
    render(<Kbd keys={['⌘', 'K']} accessibilityLabel="Open command palette" />)

    expect(screen.getByLabelText('Open command palette')).toBeInTheDocument()
    expect(screen.queryByLabelText('Command K')).not.toBeInTheDocument()
  })

  it('merges className onto the root', () => {
    render(<Kbd keys={['⌘', 'K']} className="ml-2" />)

    const classes = capturedByNode.get(screen.getByLabelText('Command K'))?.split(' ')
    expect(classes).toContain('ml-2')
  })

  it.each(['sm', 'md'] as const)('has no accessibility violations at size %s', async (size) => {
    const { container } = render(<Kbd keys={['⌘', '⇧', 'P']} size={size} />)

    expect(await axe(container)).toHaveNoViolations()
  })
})

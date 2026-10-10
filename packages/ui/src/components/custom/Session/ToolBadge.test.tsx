import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { ToolBadge } from './ToolBadge'
import { TOOL_FAMILY_META, TOOL_FAMILY_ORDER } from './session-vocabulary'

describe('ToolBadge', () => {
  it.each(TOOL_FAMILY_ORDER)(
    'names a %s badge by its family label and hides the glyph',
    (family) => {
      const { label, glyph } = TOOL_FAMILY_META[family]
      render(<ToolBadge family={family} />)

      const badge = screen.getByRole('img', { name: label })
      expect(badge).toHaveTextContent(glyph)
      expect(screen.getByText(glyph)).toHaveAttribute('aria-hidden', 'true')
    }
  )

  it('reads a family from a newer read model as Other tool', () => {
    render(<ToolBadge family="future_family" />)

    expect(screen.getByRole('img', { name: TOOL_FAMILY_META.other_tool.label })).toBeInTheDocument()
  })

  it('has no accessibility violations at either size', async () => {
    const { container } = render(
      <>
        <ToolBadge family="fs_read" size="sm" />
        <ToolBadge family="bash" size="md" />
      </>
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})

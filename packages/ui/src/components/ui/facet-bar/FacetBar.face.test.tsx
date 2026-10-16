import { render } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FacetBar } from './FacetBar'
import { facetBarFixtures } from './fixtures'

interface SeenChip {
  variant?: string
  rightElement?: ReactNode
}
const seen: SeenChip[] = []

vi.mock('../chip', () => ({
  Chip: (props: SeenChip & { children?: ReactNode }) => {
    seen.push({ variant: props.variant, rightElement: props.rightElement })
    return <>{props.children}</>
  },
}))

describe('FacetBar face', () => {
  beforeEach(() => {
    seen.length = 0
  })

  it('leaves the chip variant to Chip, so no outline face is requested', () => {
    render(<FacetBar label="Record" options={facetBarFixtures.default.options} />)
    expect(seen).toHaveLength(3)
    expect(seen.every((chip) => chip.variant === undefined)).toBe(true)
  })

  it('the count carries no opacity class, so it reads the label colour', () => {
    render(<FacetBar label="Record" options={facetBarFixtures.default.options} />)
    const count = seen[0].rightElement as ReactElement<{ className: string }>
    expect(count.props.className).not.toMatch(/opacity/)
  })
})

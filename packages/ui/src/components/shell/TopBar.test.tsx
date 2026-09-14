import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { axe } from 'jest-axe'
import { TopBar } from './TopBar'
import { resolveAll, siblingSource } from '../../test/spacing-resolver'

const AT_1612 = new Date(2024, 0, 1, 16, 12) // local 16:12

describe('TopBar', () => {
  it('renders the brand and a 24h clock', () => {
    render(<TopBar time={AT_1612} showClock />)
    expect(screen.getByText('VOLTRAS')).toBeInTheDocument()
    expect(screen.getByText('16:12')).toBeInTheDocument()
  })

  it('renders another app brand without knowing anything about it', () => {
    render(<TopBar brand="brain" showClock={false} />)
    expect(screen.getByText('BRAIN')).toBeInTheDocument()
    expect(screen.getByText('/ knowledge')).toBeInTheDocument()
  })

  it('mounts app chrome from the trailing slot', () => {
    render(
      <TopBar
        showClock={false}
        trailing={[<Text key="a">alpha</Text>, <Text key="b">beta</Text>]}
      />
    )
    expect(screen.getByText('alpha')).toBeInTheDocument()
    expect(screen.getByText('beta')).toBeInTheDocument()
  })

  it('accepts a single trailing node as well as an array', () => {
    render(<TopBar showClock={false} trailing={<Text>solo</Text>} />)
    expect(screen.getByText('solo')).toBeInTheDocument()
  })

  it('replaces the brand region when a leading node is given', () => {
    render(<TopBar leading={<Text>my own lockup</Text>} showClock={false} />)
    expect(screen.getByText('my own lockup')).toBeInTheDocument()
    expect(screen.queryByText('VOLTRAS')).not.toBeInTheDocument()
  })

  it('hides the clock when showClock is false', () => {
    render(<TopBar time={AT_1612} showClock={false} />)
    expect(screen.queryByText('16:12')).not.toBeInTheDocument()
  })

  it('hides the subtitle when showSubtitle is false', () => {
    render(<TopBar showSubtitle={false} />)
    expect(screen.queryByText('/ wall dashboard')).not.toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TopBar time={AT_1612} showClock trailing={<Text>chrome</Text>} />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

/**
 * The chrome band's spacing, pinned (AW-142 wave three).
 *
 * `px-4` is named `px-inset-lg`; the trailing cluster's 12px is `gap-inline-lg`.
 * The bar's own 14px leading gap has no semantic key — the inline ramp runs
 * 4 / 8 / 12 — so it is the numeric rung `gap-3.5` rather than a pixel moved to
 * 12. Read as source: the first className in the function belongs to the clock.
 */
describe('TopBar geometry resolves to the spacing tokens', () => {
  const source = siblingSource(import.meta.url, 'TopBar.tsx')

  it.each([
    ['the bar', ['gap-3.5', 'px-inset-lg'], ['14px', '16px']],
    ['the trailing cluster', ['gap-inline-lg'], ['12px']],
  ] as const)('%s ships %s', (_label, classes, pixels) => {
    classes.forEach((className) => expect(source).toContain(className))
    expect(resolveAll([...classes])).toEqual([...pixels])
  })
})

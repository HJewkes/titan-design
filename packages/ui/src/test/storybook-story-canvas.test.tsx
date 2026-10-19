import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { composeStory } from '@storybook/react-vite'
import { axe, toHaveNoViolations } from 'jest-axe'
import { Text } from 'react-native'
import preview from '../../.storybook/preview'
import { storyCanvasKind, withStoryCanvas } from '../../.storybook/withStoryCanvas'
import { withSurfaceTheme } from '../../.storybook/withSurfaceTheme'
import { StoryPanel, StorySpecimen, StorySpecimens } from '../lab/story-canvas'
import { raisedLevel, surfaceBackground } from '../theme/surface-planes'
import { getSemanticColors, type ThemeMode } from '../theme/tokens/semantic'

expect.extend(toHaveNoViolations)

// TD-970: story canvases are opt-in by `parameters.canvas`, paint the theme's base plane, and pin
// the section token. The audit probe reads numbers only (gap-stack-xl and gap-section-sm are both
// 24px), so these tests, not the probe, guard the token.

// jsdom has no NativeWind transform, so surface className as data-cls for class-name assertions.
vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  const withCls = <P extends { className?: string }>(Base: React.ComponentType<P>) =>
    function WithCls(props: P) {
      return <Base {...props} dataSet={{ cls: props.className ?? '' }} />
    }
  return {
    ...actual,
    View: withCls(actual.View as React.ComponentType<{ className?: string }>),
    Text: withCls(actual.Text as React.ComponentType<{ className?: string }>),
  }
})

const cls = (el: Element | null) => (el?.getAttribute('data-cls') ?? '').split(/\s+/)

function hexToRgb(hex: string): string {
  const n = parseInt(hex.slice(1, 7), 16)
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`
}

const meta = { title: 'Test/StoryCanvas', component: () => <Text>probe</Text> }
const probeStory = { render: () => <Text testID="probe">probe</Text> }

function renderStory(parameters: object, theme: ThemeMode = 'dark', tags: string[] = []) {
  const Story = composeStory({ ...probeStory, parameters, tags }, meta, {
    decorators: preview.decorators,
    initialGlobals: { theme },
  })
  return render(<Story />)
}

describe.each<ThemeMode>(['dark', 'light'])('canvas under the %s theme', (theme) => {
  it("paints the base plane for canvas: 'page'", () => {
    renderStory({ canvas: 'page' }, theme)

    const page = screen.getByTestId('story-page')
    expect(page.style.backgroundColor).toBe(hexToRgb(getSemanticColors(theme)['surface-base']))
    expect(page).toContainElement(screen.getByTestId('probe'))
  })

  it("puts the story in a panel one step above base for canvas: 'panel'", () => {
    renderStory({ canvas: 'panel' }, theme)

    const panel = screen.getByTestId('story-panel')
    expect(screen.getByTestId('story-page')).toContainElement(panel)
    expect(panel).toContainElement(screen.getByTestId('probe'))
    expect(panel.style.backgroundColor).toBe(
      hexToRgb(surfaceBackground(raisedLevel('base', 1), theme))
    )
  })
})

describe('withStoryCanvas pass-through', () => {
  it('passes the story through untouched without a canvas parameter', () => {
    const Story = composeStory(probeStory, meta, { decorators: [withStoryCanvas] })
    const { container } = render(<Story />)

    expect(container.firstElementChild).toBe(screen.getByTestId('probe'))
  })

  it('ignores an unknown canvas value', () => {
    renderStory({ canvas: 'board' })

    expect(screen.queryByTestId('story-page')).toBeNull()
  })

  it('leaves a width-matrix story without a page, so its frames hold no duplicate main', () => {
    renderStory({ canvas: 'page' }, 'dark', ['width-matrix'])

    expect(screen.queryByTestId('story-page')).toBeNull()
    expect(storyCanvasKind({ canvas: 'page' }, ['width-matrix'])).toBeUndefined()
  })

  it('sits inside the surface-theme provider in the preview decorator order', () => {
    const decorators = preview.decorators as unknown[]

    expect(decorators.indexOf(withStoryCanvas)).toBeGreaterThanOrEqual(0)
    expect(decorators.indexOf(withStoryCanvas)).toBeLessThan(decorators.indexOf(withSurfaceTheme))
  })

  it('renders a page canvas with no accessibility violations', async () => {
    const { container } = renderStory({ canvas: 'panel' }, 'light')

    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('specimen rhythm tokens', () => {
  it('spaces specimens on section-sm by default', () => {
    render(<StorySpecimens />)

    expect(cls(screen.getByTestId('story-specimens'))).toContain('gap-section-sm')
  })

  it.each([
    ['md', 'gap-section-md'],
    ['lg', 'gap-section-lg'],
  ] as const)('spaces specimens on the section-%s token', (gap, token) => {
    render(<StorySpecimens gap={gap} />)

    expect(cls(screen.getByTestId('story-specimens'))).toContain(token)
  })

  it('lays a row of specimens side by side', () => {
    render(<StorySpecimens direction="row" />)

    expect(cls(screen.getByTestId('story-specimens'))).toEqual(
      expect.arrayContaining(['flex-row', 'flex-wrap', 'gap-section-sm'])
    )
  })

  it('sets a string label stack-sm above its specimen', () => {
    render(
      <StorySpecimen label="Rest">
        <Text testID="probe">probe</Text>
      </StorySpecimen>
    )

    const specimen = screen.getByTestId('story-specimen')
    expect(cls(specimen)).toContain('gap-stack-sm')
    expect(specimen.firstElementChild).toHaveTextContent('Rest')
  })

  it('pads a panel on inset-md and stacks its children on stack-md', () => {
    render(<StoryPanel />)

    expect(cls(screen.getByTestId('story-panel'))).toEqual(
      expect.arrayContaining(['p-inset-md', 'gap-stack-md'])
    )
  })
})

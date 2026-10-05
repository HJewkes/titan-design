import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { composeStory } from '@storybook/react-vite'
import { Text } from 'react-native'
import { matrixWidths, withWidthMatrix } from '../../.storybook/withWidthMatrix'

// TD-324: the width matrix is opt-in by tag, and a threshold adds the frames either side of it.

const meta = { title: 'Test/WidthMatrix', component: () => <Text>probe</Text> }

function frameWidths(tags: string[], parameters: object = {}): number[] {
  const Story = composeStory({ tags, parameters, render: () => <Text>probe</Text> }, meta, {
    decorators: [withWidthMatrix],
  })
  const { container } = render(<Story />)
  return [...container.querySelectorAll('[data-testid^="width-frame-"]')].map((el) =>
    Number(el.getAttribute('data-testid')?.replace('width-frame-', ''))
  )
}

describe('withWidthMatrix', () => {
  it('renders the five matrix widths for a tagged story', () => {
    expect(frameWidths(['width-matrix'])).toEqual([320, 360, 560, 720, 1280])
  })

  it('adds a frame either side of a threshold', () => {
    const widths = frameWidths(['width-matrix'], { widthMatrix: { thresholds: [320] } })
    expect(widths).toEqual([319, 320, 321, 360, 560, 720, 1280])
  })

  it('renders no frames without the width-matrix tag', () => {
    expect(frameWidths([], { widthMatrix: { thresholds: [320] } })).toEqual([])
  })

  it('sorts and deduplicates widths in matrixWidths', () => {
    expect(matrixWidths([361, 559])).toEqual([320, 360, 362, 558, 560, 720, 1280])
  })
})

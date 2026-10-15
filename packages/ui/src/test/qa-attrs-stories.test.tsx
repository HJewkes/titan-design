import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DIM_OPACITY } from '../components/ui/charts/network-graph/NetworkGraphPlot'
import { QA_ATTRIBUTES } from '../utils/qa-attrs'
import { loadComposedStories } from './composed-stories'

/**
 * The render-QA hooks each qa-relevant story emits, as a snapshot of every element carrying a
 * `data-qa-*` attribute. A component that stops stamping a hook changes its story's snapshot.
 */

const QA_STORY_FILES = new Set([
  'ui/stat-card/StatCard.stories.tsx',
  'ui/chip/StateChip.stories.tsx',
  'ui/charts/network-graph/NetworkGraph.stories.tsx',
])

const stories = await loadComposedStories((file) => QA_STORY_FILES.has(file))

const SELECTOR = QA_ATTRIBUTES.map((name) => `[${name}]`).join(', ')

/** One line per marked element: who it is, then its `data-qa-*` attributes. */
function qaProjection(root: ParentNode): string[] {
  return [...root.querySelectorAll(SELECTOR)].map((el) => {
    const who = el.getAttribute('data-testid') ?? el.tagName.toLowerCase()
    const marks = QA_ATTRIBUTES.filter((name) => el.hasAttribute(name)).map((name) => {
      const value = el.getAttribute(name)
      return value === '' ? name : `${name}=${value}`
    })
    return `${who}: ${marks.join(' ')}`
  })
}

describe('qa-relevant stories emit the render-QA hooks', () => {
  it('finds every qa-relevant story file', () => {
    expect(new Set(stories.map((story) => story.file))).toEqual(QA_STORY_FILES)
  })

  for (const { file, name, Story } of stories) {
    it(`${file} › ${name}`, () => {
      const { container } = render(<Story />)

      expect(qaProjection(container)).toMatchSnapshot()
    })
  }

  it('NetworkGraph › Default marks every node it dims as context once a node is hovered', () => {
    const graph = stories.find((story) => story.file.endsWith('NetworkGraph.stories.tsx'))
    if (!graph) throw new Error('NetworkGraph story not loaded')
    const { container } = render(<graph.Story />)
    const leaf = screen.getAllByTestId(/^network-graph-node-/).at(-1)
    if (!leaf) throw new Error('NetworkGraph story drew no nodes')

    fireEvent.pointerEnter(leaf)

    const dimmedIds = [...container.querySelectorAll(`g[data-node][opacity="${DIM_OPACITY}"]`)].map(
      (mark) => mark.getAttribute('data-node')
    )
    expect(dimmedIds.length).toBeGreaterThan(0)
    for (const id of dimmedIds) {
      expect(screen.getByTestId(`network-graph-node-${id}`)).toHaveAttribute('data-qa-context')
    }
    expect(qaProjection(container)).toMatchSnapshot()
  })
})

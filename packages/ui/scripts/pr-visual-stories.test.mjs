import { describe, expect, it } from 'vitest'
import { PIPELINE_CANARY, storiesFor } from './pr-visual-stories.mjs'

const ui = 'packages/ui/src/components/ui'
const entry = (name, composes = [], storyIds = [`${name.toLowerCase()}--default`]) => ({
  name,
  file: `${ui}/${name}/${name}.tsx`,
  sources: { status: `${ui}/${name}/${name}.stories.tsx` },
  composes,
  storyIds,
})
const catalog = {
  entries: [
    entry('Pill'),
    entry('Card', ['Pill'], ['card--default', 'card--empty']),
    entry('Page', ['Card']),
    entry('Button'),
  ],
}

describe('pr-visual story selection (TP-1697)', () => {
  it('selects a changed component and the entries that compose it', () => {
    expect(storiesFor([`${ui}/Pill/Pill.tsx`], catalog).storyIds).toEqual([
      'card--default',
      'card--empty',
      'pill--default',
    ])
  })

  it('selects a changed stories file without walking past one level of composers', () => {
    expect(storiesFor([`${ui}/Card/Card.stories.tsx`], catalog).storyIds).toEqual([
      'card--default',
      'card--empty',
      'page--default',
    ])
  })

  it('goes broad on a rendered path no entry owns', () => {
    const selection = storiesFor(['packages/ui/src/theme/tokens/semantic.ts'], catalog)
    expect(selection).toMatchObject({ broad: true, storyIds: [] })
    expect(selection.reason).toContain('semantic.ts')
  })

  it('goes broad past the cap', () => {
    const selection = storiesFor([`${ui}/Pill/Pill.tsx`], catalog, { cap: 2 })
    expect(selection).toMatchObject({ broad: true, storyIds: [] })
  })

  it('selects nothing for a change that renders no story', () => {
    const selection = storiesFor(['README.md', `${ui}/Pill/Pill.test.tsx`], catalog)
    expect(selection).toEqual({
      storyIds: [],
      selected: [],
      reason: expect.stringContaining('2 changed paths'),
    })
  })

  it('renders the canary story when the capture pipeline itself changes', () => {
    expect(storiesFor(['.github/workflows/pr-visual.yml'], catalog).storyIds).toEqual([
      PIPELINE_CANARY,
    ])
  })
})

describe('pr-visual selected paths (TP-4774)', () => {
  it('names the changed path that selected each story, direct or by composition', () => {
    const path = `${ui}/Pill/Pill.tsx`
    const { selected } = storiesFor([path], catalog)
    expect(selected).toEqual([
      { story: 'card--default', paths: [path] },
      { story: 'card--empty', paths: [path] },
      { story: 'pill--default', paths: [path] },
    ])
  })

  it('selects nothing and names no story when the change is broad', () => {
    const selection = storiesFor(['packages/ui/src/theme/tokens/semantic.ts'], catalog)
    expect(selection.selected).toEqual([])
  })
})

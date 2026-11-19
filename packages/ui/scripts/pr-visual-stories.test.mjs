import { describe, expect, it } from 'vitest'
import { changesStories, PIPELINE_CANARY, storiesFor } from './pr-visual-stories.mjs'

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

describe('pr-visual paths beside a catalogued component (TP-6757)', () => {
  const pill = `${ui}/Pill/Pill.tsx`

  it('ignores generated catalog, baseline and snapshot files that render nothing', () => {
    const selection = storiesFor(
      [
        pill,
        'packages/ui/src/arch/component-catalog.json',
        'packages/ui/src/arch/decomposition-baseline.json',
        `${ui}/Pill/__snapshots__/Pill.test.tsx.snap`,
        'packages/ui/tests/visual/contrast-stories-baseline.json',
        'packages/ui/tests/visual/reference/pill--default-chromium-linux.png',
      ],
      catalog
    )
    expect(selection.broad).toBeUndefined()
    expect(selection.storyIds).toEqual(['card--default', 'card--empty', 'pill--default'])
  })

  it('selects the entry that imports a helper module in its directory', () => {
    const helper = `${ui}/Card/CardParts.tsx`
    const shared = { entries: [...catalog.entries, entry('CardHeader')] }
    shared.entries.at(-1).file = `${ui}/Card/CardHeader.tsx`
    const sources = { [`${ui}/Card/Card.tsx`]: "import { Face } from './CardParts'\n" }
    const selection = storiesFor([helper], shared, { readSource: (file) => sources[file] ?? '' })
    expect(selection.storyIds).toEqual(['card--default', 'card--empty', 'page--default'])
    expect(selection.selected[0]).toEqual({ story: 'card--default', paths: [helper] })
  })

  it("selects every entry in a helper's directory when none imports it", () => {
    const selection = storiesFor([`${ui}/Pill/pillTone.ts`], catalog)
    expect(selection.storyIds).toEqual(['card--default', 'card--empty', 'pill--default'])
  })

  it('selects the primary entry for a secondary stories file', () => {
    const selection = storiesFor([`${ui}/Card/Card.interaction.stories.tsx`], catalog)
    expect(selection.storyIds).toEqual(['card--default', 'card--empty', 'page--default'])
  })

  it('names the reached entries when none of them has a story', () => {
    const silent = { entries: [entry('Beat', [], [])] }
    const selection = storiesFor([`${ui}/Beat/cues.ts`], silent)
    expect(selection).toEqual({
      storyIds: [],
      selected: [],
      reason: 'the change reaches only entries without stories: Beat',
    })
  })

  it('goes broad on a helper outside every catalogued directory and logs each such path', () => {
    const paths = ['packages/ui/src/hooks/useThing.ts', 'packages/ui/src/utils/format.ts']
    const selection = storiesFor(paths, catalog)
    expect(selection).toMatchObject({ broad: true, storyIds: [], unowned: paths })
    expect(selection.reason).toBe('packages/ui/src/hooks/useThing.ts maps to no catalog entry')
  })

  it('goes broad on a global and says it can change any story', () => {
    const selection = storiesFor([pill, 'packages/ui/tailwind.config.js'], catalog)
    expect(selection).toMatchObject({ broad: true, storyIds: [] })
    expect(selection.reason).toMatch(
      /^packages\/ui\/tailwind\.config\.js is a global .* can change any story/
    )
  })

  it('over the cap captures the changed entry first, then composers, and records the truncation', () => {
    const selection = storiesFor([pill], catalog, { cap: 2 })
    expect(selection.broad).toBeUndefined()
    expect(selection.storyIds).toEqual(['card--default', 'pill--default'])
    expect(selection.selected.map((item) => item.story)).toEqual(selection.storyIds)
    expect(selection.truncated).toEqual({ reached: 3, cap: 2 })
    expect(selection.reason).toContain('3 stories reached, over the cap of 2')
  })
})

describe('pr-visual changes to rendered UI (TP-6766)', () => {
  it('counts a component, helper or global change as changing rendered UI', () => {
    expect(changesStories([`${ui}/Pill/Pill.tsx`])).toBe(true)
    expect(changesStories([`${ui}/Pill/pillTone.ts`])).toBe(true)
    expect(changesStories(['packages/ui/tailwind.config.js'])).toBe(true)
  })

  it('counts a change to the capture pipeline as changing rendered UI', () => {
    expect(changesStories(['.github/workflows/pr-visual.yml'])).toBe(true)
  })

  it('does not count docs, tests, snapshots or generated metadata', () => {
    expect(
      changesStories([
        'README.md',
        `${ui}/Pill/Pill.test.tsx`,
        `${ui}/Pill/__snapshots__/Pill.test.tsx.snap`,
        'packages/ui/src/arch/component-catalog.json',
        'packages/ui/tests/visual/reference/pill--default-chromium-linux.png',
      ])
    ).toBe(false)
  })

  it('counts a changed-path list at the API cap as changing rendered UI', () => {
    const docs = Array.from({ length: 3000 }, (_, i) => `docs/page-${i}.md`)

    expect(changesStories(docs)).toBe(true)
  })
})

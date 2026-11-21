import { describe, expect, it } from 'vitest'
import { buildManifest, seatFailure } from './pr-visual-manifest.mjs'
import {
  changesStories,
  inertPaths,
  pathRole,
  PIPELINE_CANARY,
  storiesFor,
} from './pr-visual-stories.mjs'
import { RENDERED_UI_PATTERNS } from './visual-paths.mjs'

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

  it('renders the canary story, not a broad selection, when a module the pipeline imports changes', () => {
    const selection = storiesFor(['packages/ui/scripts/visual-paths.mjs'], catalog)

    expect(selection.broad).toBeUndefined()
    expect(selection.storyIds).toEqual([PIPELINE_CANARY])
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

  it('does not count test or CI support files that no story renders', () => {
    const support = [
      '.github/workflows/ci.yml',
      'turbo.json',
      'packages/ui/vitest.config.ts',
      'packages/ui/playwright.config.ts',
      'packages/ui/tests/visual/components.spec.ts',
      'packages/ui/tests/interaction/x.spec.ts',
      'packages/ui/src/test/blank-render.ts',
      'packages/ui/src/test/stories-axe.test.tsx',
      'packages/ui/scripts/storybook-launch.mjs',
      'packages/ui/scripts/lib/regen-eslint-baseline.test.mjs',
    ]

    expect(support.filter((path) => changesStories([path]))).toEqual([])
  })

  it('counts a rendered path that no catalog entry owns', () => {
    expect(changesStories(['packages/ui/src/hooks/useThing.ts'])).toBe(true)
    expect(changesStories(['packages/ui/src/test/fixtures/stress.ts'])).toBe(true)
  })
})

describe('pr-visual package exports that render nothing (TP-6890)', () => {
  const manifest = 'packages/ui/package.json'
  const entryFile = 'packages/ui/src/motion-camera.ts'
  const motion = { react: './src/motion.ts', import: { default: './dist/motion.mjs' } }
  const base = { name: 'ui', exports: { './motion': motion }, dependencies: { react: '19.0.0' } }
  const withEntry = (pkg) => ({
    ...pkg,
    exports: { ...pkg.exports, './motion/camera': { 'react-native': './src/motion-camera.ts' } },
  })
  const dir = `${ui}/motion`
  const [beat, hooks, camera, barrel] = ['Beat.tsx', 'hooks.ts', 'camera.ts', 'index.ts'].map(
    (file) => `${dir}/${file}`
  )
  const motionCatalog = {
    entries: [
      ...catalog.entries,
      { name: 'Beat', file: beat, sources: {}, composes: [], storyIds: ['beat--default'] },
    ],
  }
  const baseFiles = {
    [manifest]: JSON.stringify(base),
    [beat]: "import { View } from 'react-native'\nimport { useLocalTime } from './hooks'\n",
    [hooks]: "import { useContext } from 'react'\nexport const useLocalTime = () => 0\n",
    [`${dir}/easing.ts`]: 'export const linear = (t) => t\n',
    [camera]: "import { linear } from './easing'\nexport const camera = linear\n",
    [barrel]: "export { useLocalTime } from './hooks'\n",
  }
  const pureEntry = "export { camera } from './components/ui/motion/camera'\n"
  const trees = (before, after) => ({
    readBase: (file) => before[file],
    readHead: (file) => after[file],
    headFiles: new Set(Object.keys(after)),
    entries: motionCatalog.entries,
  })
  const change = (headPkg, headFiles = {}) =>
    trees(baseFiles, { ...baseFiles, [manifest]: JSON.stringify(headPkg), ...headFiles })
  const edit = (headFiles) => trees(baseFiles, { ...baseFiles, ...headFiles })
  const classify = (paths, readers) => {
    const inert = inertPaths(paths, readers)
    return {
      inert,
      changes: changesStories(paths, inert),
      selection: storiesFor(paths, motionCatalog, { inert, readSource: readers.readHead }),
    }
  }

  it('does not count a change that only adds an exports entry and its new pure entry file', () => {
    const paths = [manifest, entryFile]
    const { changes, selection } = classify(
      paths,
      change(withEntry(base), { [entryFile]: pureEntry })
    )

    expect(changes).toBe(false)
    expect(selection).toEqual({
      storyIds: [],
      selected: [],
      reason: 'none of 2 changed paths renders a story',
    })
    const run = { ...selection, changesStories: changes }
    expect(seatFailure(buildManifest({ selection: run, before: [], after: [] }), run)).toBe(
      undefined
    )
  })

  it('keeps package.json global when a dependency changes beside the exports', () => {
    const bumped = { ...withEntry(base), dependencies: { react: '19.1.0' } }
    const { inert, changes, selection } = classify(
      [manifest, entryFile],
      change(bumped, { [entryFile]: pureEntry })
    )

    expect(inert).toEqual(new Set([entryFile]))
    expect(changes).toBe(true)
    expect(selection).toMatchObject({ broad: true, unowned: [manifest] })
  })

  it.each([
    ['devDependencies', { ...withEntry(base), devDependencies: { vitest: '3.0.0' } }],
    ['sideEffects', { ...withEntry(base), sideEffects: false }],
    ['name', { ...withEntry(base), name: 'ui-next' }],
  ])('keeps package.json global when %s changes beside the exports', (_field, headPkg) => {
    expect(pathRole(manifest, inertPaths([manifest], change(headPkg)))).toBe('global')
  })

  it('keeps package.json global when either side does not parse', () => {
    const { changes } = classify([manifest], trees({ [manifest]: '{' }, { [manifest]: '{}' }))
    expect(changes).toBe(true)
  })

  it('does not count an edited pure helper that no entry or story imports', () => {
    const { inert, changes } = classify(
      [camera],
      edit({
        [camera]: "import { linear } from './easing'\nexport const camera = (t) => linear(t)\n",
      })
    )

    expect(inert).toEqual(new Set([camera]))
    expect(changes).toBe(false)
  })

  it('selects the entry whose import graph reaches an edited pure helper', () => {
    const importsCamera = `${baseFiles[beat]}import { camera } from './camera'\n`
    const { inert, changes, selection } = classify(
      [camera],
      edit({ [beat]: importsCamera, [camera]: `${baseFiles[camera]}// edited\n` })
    )

    expect(inert).toEqual(new Set())
    expect(changes).toBe(true)
    expect(selection.storyIds).toEqual(['beat--default'])
  })

  it('does not count an entry that imports a helper only as a type, which is erased', () => {
    const typeOnly = `${baseFiles[beat]}import type { Camera } from './camera'\n`
    expect(classify([camera], edit({ [beat]: typeOnly })).changes).toBe(false)
  })

  it('counts a pure helper a story file imports', () => {
    const story = `${dir}/Beat.stories.tsx`
    const { changes } = classify([camera], edit({ [story]: "import { camera } from './camera'\n" }))
    expect(changes).toBe(true)
  })

  it('counts a helper whose own import graph loads react', () => {
    const { changes } = classify(
      [camera],
      edit({ [camera]: "import { useLocalTime } from './hooks'\n" })
    )
    expect(changes).toBe(true)
  })

  it('does not count a barrel change that only adds a re-export of a pure module', () => {
    const reexports = `${baseFiles[barrel]}export { camera, type Camera } from './camera'\n`
    expect(classify([barrel], edit({ [barrel]: reexports })).changes).toBe(false)
  })

  it('counts a barrel change that re-exports a react module or edits a line', () => {
    const beatExport = `${baseFiles[barrel]}export { Beat } from './Beat'\n`
    const edited = "export { useLocalTime as useTime } from './hooks'\n"
    expect(classify([barrel], edit({ [barrel]: beatExport })).changes).toBe(true)
    expect(classify([barrel], edit({ [barrel]: edited })).changes).toBe(true)
  })

  it('clears nothing when an import names no file in the tree', () => {
    const dangling = edit({ [beat]: `${baseFiles[beat]}import { x } from './missing'\n` })
    expect(() => inertPaths([manifest, camera], dangling)).toThrow(/names no file/)
  })
})

// One sample per family of CI's trigger list, each with the role the capture gives it.
const ROLE_SAMPLES = [
  ['packages/ui/src/components/ui/Pill/Pill.tsx', 'story'],
  ['packages/ui/src/hooks/useThing.ts', 'story'],
  ['packages/ui/src/test/fixtures/stress.ts', 'story'],
  ['packages/ui/src/test/blank-render.ts', 'non-story'],
  ['packages/ui/src/arch/component-catalog.json', 'non-story'],
  ['packages/ui/src/test/stories-axe.test.tsx', 'non-story'],
  ['packages/ui/src/components/ui/Pill/Pill.stories.tsx', 'story'],
  ['packages/ui/.storybook/preview.tsx', 'global'],
  ['packages/ui/tailwind.config.js', 'global'],
  ['packages/ui/vitest.config.ts', 'non-story'],
  ['packages/ui/specimen/index.tsx', 'non-story'],
  ['packages/ui/tests/visual/components.spec.ts', 'non-story'],
  ['packages/ui/tests/capture/x.ts', 'non-story'],
  ['packages/ui/playwright.visual.config.ts', 'non-story'],
  ['packages/ui/scripts/storybook-launch.mjs', 'non-story'],
  ['packages/ui/scripts/check-play-count.mjs', 'non-story'],
  ['packages/ui/scripts/lib/regen-eslint-baseline.mjs', 'non-story'],
  ['packages/ui/scripts/lib/entry.mjs', 'pipeline'],
  ['packages/ui/scripts/visual-paths.mjs', 'pipeline'],
  ['packages/ui/package.json', 'global'],
  ['pnpm-lock.yaml', 'global'],
  ['turbo.json', 'non-story'],
  ['.github/workflows/ci.yml', 'non-story'],
  ['.github/workflows/pr-visual.yml', 'pipeline'],
  ['README.md', undefined],
]

describe('pr-visual path roles (TP-6766)', () => {
  it.each(ROLE_SAMPLES)('classifies %s as %s', (path, role) => {
    expect(pathRole(path)).toBe(role)
  })

  it('has a sample for every pattern in CI trigger list, so a new one must be classified', () => {
    const unsampled = RENDERED_UI_PATTERNS.filter(
      (pattern) => !ROLE_SAMPLES.some(([path]) => pattern.test(path))
    )

    expect(unsampled).toEqual([])
  })
})

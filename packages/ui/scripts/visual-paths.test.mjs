import { describe, expect, it } from 'vitest'
import { decide, fetchChangedPaths } from './visual-paths.mjs'

describe('rendered-UI path classifier (TD-645, TD-725)', () => {
  it.each([
    ['a pure-TS utils test change', ['packages/ui/src/utils/cn.test.ts']],
    ['a hook type test change', ['packages/ui/src/hooks/useTimer.test-d.ts']],
    ['a docs-only change', ['packages/ui/docs/render-testing-pattern.md', 'README.md']],
    ['a script change', ['packages/ui/scripts/check-cycles.mjs']],
    ['a changelog fragment', ['packages/ui/changelog.d/TD-1-thing.md']],
    ['another workflow', ['.github/workflows/mutation.yml']],
    ['a component test change', ['packages/ui/src/components/ui/button/Button.test.tsx']],
    ['no changed paths', []],
  ])('skips %s', (_scenario, paths) => {
    expect(decide(paths).run).toBe(false)
  })

  it.each([
    ['a component change', 'packages/ui/src/components/ui/button/Button.tsx'],
    ['a story change', 'packages/ui/src/components/shell/workout/SessionStatePill.stories.tsx'],
    ['a token change', 'packages/ui/src/theme/tokens/semantic.ts'],
    ['a global.css change', 'packages/ui/src/theme/global.css'],
    ['a font change', 'packages/ui/src/theme/fonts/inter/latin.woff2'],
    ['a utils source change, which components import', 'packages/ui/src/utils/number-format.ts'],
    ['a lab change, which Storybook indexes', 'packages/ui/src/lab/explorations/Draft.tsx'],
    ['the blank-render guard Layer 2 imports', 'packages/ui/src/test/blank-render.ts'],
    ['a Storybook config change', 'packages/ui/.storybook/preview.tsx'],
    ['the Tailwind config', 'packages/ui/tailwind.config.js'],
    ['the Vite svg resolver', 'packages/ui/vite-rn-svg-plugins.ts'],
    ['a specimen change', 'packages/ui/specimen/comparison.tsx'],
    ['a Layer 2 spec change', 'packages/ui/tests/visual/stories.spec.ts'],
    ['an interaction spec change', 'packages/ui/tests/interaction/carousel.spec.ts'],
    ['the offline-fonts fixture', 'packages/ui/tests/offline-fonts/fixture/main.ts'],
    ['a Playwright config', 'packages/ui/playwright.baseline.config.ts'],
    ['the Storybook launcher', 'packages/ui/scripts/storybook-launch.mjs'],
    ['this classifier', 'packages/ui/scripts/visual-paths.mjs'],
    ['the package manifest', 'packages/ui/package.json'],
    ['the lockfile', 'pnpm-lock.yaml'],
    ['ci.yml', '.github/workflows/ci.yml'],
    ['the stories-axe suite', 'packages/ui/src/test/stories-axe.test.tsx'],
    ['a stories-axe shard', 'packages/ui/src/test/stories-axe.charts.test.tsx'],
    ['the vitest config the axe and play projects live in', 'packages/ui/vitest.config.ts'],
    ['the play-count check', 'packages/ui/scripts/check-play-count.mjs'],
  ])('runs every layer for %s', (_scenario, path) => {
    const decision = decide(['packages/ui/docs/notes.md', path])
    expect(decision).toEqual({ run: true, reason: `${path} is rendered UI; running every layer` })
  })

  it('logs the changed-path count when it skips', () => {
    expect(decide(['a.md', 'b.md']).reason).toBe(
      'none of 2 changed paths is rendered UI; skipping every visual layer'
    )
  })

  it('runs every layer when the API file list may be truncated', () => {
    const paths = Array.from({ length: 3000 }, (_, i) => `docs/${i}.md`)
    expect(decide(paths).run).toBe(true)
  })
})

describe('fetchChangedPaths', () => {
  const page = (files) => ({ ok: true, json: async () => files })

  it('follows pages and counts a rename under both names', async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ filename: `docs/${i}.md` }))
    const pages = [page(full), page([{ filename: 'b.ts', previous_filename: 'a.ts' }])]
    const urls = []
    const fetchImpl = async (url) => (urls.push(url), pages.shift())

    const paths = await fetchChangedPaths({ repo: 'o/r', pr: '7', token: 't', fetchImpl })

    expect(paths).toHaveLength(102)
    expect(paths.slice(-2)).toEqual(['b.ts', 'a.ts'])
    expect(urls[1]).toBe('https://api.github.com/repos/o/r/pulls/7/files?per_page=100&page=2')
  })

  it('throws on a failed request so the caller runs every layer', async () => {
    const fetchImpl = async () => ({ ok: false, status: 403 })
    await expect(
      fetchChangedPaths({ repo: 'o/r', pr: '7', token: 't', fetchImpl })
    ).rejects.toThrow(/failed with 403/)
  })
})

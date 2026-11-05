import { describe, expect, it } from 'vitest'
import { buildManifest } from './pr-visual-manifest.mjs'

const run = { repo: 'owner/repo', pr: 7, baseSha: 'b'.repeat(40), headSha: 'h'.repeat(40) }
const selected = { storyIds: ['pill--default'], reason: '1 stories reached' }

describe('pr-visual manifest selected stories (TP-4774)', () => {
  const selection = {
    storyIds: ['pill--default', 'pill--tone'],
    selected: [
      { story: 'pill--default', paths: ['packages/ui/src/Pill.tsx'] },
      { story: 'pill--tone', paths: ['packages/ui/src/Pill.tsx'] },
    ],
    reason: '2 stories reached',
  }

  it('lists each selected story with the paths that selected it', () => {
    const files = ['pill--default@1280.png']
    const manifest = buildManifest({ ...run, selection, before: files, after: files })
    expect(manifest.selected).toEqual(selection.selected)
    expect(manifest.broad).toBeUndefined()
  })

  it('keeps a story whose capture threw in selected and out of shots', () => {
    const files = ['pill--default@1280.png']
    const manifest = buildManifest({ ...run, selection, before: files, after: files })
    expect(manifest.selected.map((item) => item.story)).toContain('pill--tone')
    expect(manifest.shots.map((shot) => shot.story)).toEqual(['pill--default'])
  })

  it('names the reason when the selection went broad', () => {
    const broad = {
      broad: true,
      storyIds: [],
      selected: [],
      reason: 'x.css maps to no catalog entry',
    }
    const manifest = buildManifest({ ...run, selection: broad, before: [], after: [] })
    expect(manifest).toMatchObject({
      rendered: false,
      selected: [],
      broad: { reason: 'x.css maps to no catalog entry' },
    })
  })
})

describe('pr-visual manifest (TP-1697)', () => {
  it('pairs each shot captured on both sides', () => {
    const files = ['pill--default@1280.png', 'pill--default@390.png']
    const manifest = buildManifest({ ...run, selection: selected, before: files, after: files })
    expect(manifest).toEqual({
      v: 1,
      ...run,
      selected: [],
      rendered: true,
      shots: [
        {
          story: 'pill--default',
          width: '1280',
          before: 'before/pill--default@1280.png',
          after: 'after/pill--default@1280.png',
        },
        {
          story: 'pill--default',
          width: '390',
          before: 'before/pill--default@390.png',
          after: 'after/pill--default@390.png',
        },
      ],
    })
  })

  it('drops a one-sided shot and names it in the reason', () => {
    const manifest = buildManifest({
      ...run,
      selection: selected,
      before: ['pill--default@1280.png'],
      after: ['pill--default@1280.png', 'pill--new@1280.png'],
    })
    expect(manifest.rendered).toBe(true)
    expect(manifest.shots.map((shot) => shot.story)).toEqual(['pill--default'])
    expect(manifest.reason).toBe('dropped one-sided shots: pill--new@1280.png (after only)')
  })

  it('says nothing rendered when no story was selected', () => {
    const selection = { storyIds: [], reason: 'none of 3 changed paths renders a story' }
    const manifest = buildManifest({ ...run, selection, before: [], after: [] })
    expect(manifest).toMatchObject({ rendered: false, reason: selection.reason, shots: [] })
  })

  it('says nothing rendered when every shot is one-sided', () => {
    const manifest = buildManifest({
      ...run,
      selection: selected,
      before: [],
      after: ['pill--default@390.png'],
    })
    expect(manifest.rendered).toBe(false)
    expect(manifest.reason).toContain('no story rendered on both sides')
  })

  it('says selection never ran when there is no selection', () => {
    expect(buildManifest({ ...run, before: [], after: [] })).toMatchObject({
      rendered: false,
      reason: 'story selection did not run',
    })
  })
})

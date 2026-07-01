import { describe, it, expect } from 'vitest'
import {
  buildFreezeTagName,
  buildFreezeTagMessage,
  assertFileCommitted,
  slugifyVariant,
  generateSpecimenSkeleton,
  parseArgs,
} from '../../../scripts/design-freeze.mjs'

describe('buildFreezeTagName', () => {
  it('namespaces the tag under design-freeze/ with the component and version', () => {
    expect(buildFreezeTagName('e1rm-badge', '2026-06-30')).toBe(
      'design-freeze/e1rm-badge-2026-06-30'
    )
  })

  it('throws when component is missing', () => {
    expect(() => buildFreezeTagName('', '1')).toThrow(/requires a component name/)
  })
})

describe('buildFreezeTagMessage', () => {
  it('records the prototype path and selector the freeze covers', () => {
    const message = buildFreezeTagMessage({
      component: 'status-dot',
      htmlPath: 'docs/prototypes/component-demo.html',
      selector: '.status-dot',
    })

    expect(message).toContain('Design freeze: status-dot')
    expect(message).toContain('docs/prototypes/component-demo.html')
    expect(message).toContain('.status-dot')
    expect(message).toContain('re-freeze')
  })
})

describe('assertFileCommitted', () => {
  it('does not throw for a clean porcelain result', () => {
    expect(() => assertFileCommitted('', 'docs/prototypes/component-demo.html')).not.toThrow()
    expect(() => assertFileCommitted('   \n', 'docs/prototypes/component-demo.html')).not.toThrow()
  })

  it('throws with the porcelain output when the file has uncommitted changes', () => {
    expect(() =>
      assertFileCommitted(
        ' M docs/prototypes/component-demo.html\n',
        'docs/prototypes/component-demo.html'
      )
    ).toThrow(/uncommitted changes/)
  })

  it('throws for an untracked file', () => {
    expect(() => assertFileCommitted('?? new-prototype.html\n', 'new-prototype.html')).toThrow(
      /uncommitted changes/
    )
  })
})

describe('slugifyVariant', () => {
  it('returns an empty string when there are no variant axes', () => {
    expect(slugifyVariant(undefined)).toBe('')
    expect(slugifyVariant({})).toBe('')
  })

  it('joins axis/value pairs with hyphens', () => {
    expect(slugifyVariant({ size: 'md' })).toBe('size-md')
    expect(slugifyVariant({ variant: 'solid', size: 'md' })).toBe('variant-solid-size-md')
  })
})

describe('generateSpecimenSkeleton', () => {
  it('embeds the frozen markup and a TODO placeholder for the React side', () => {
    const skeleton = generateSpecimenSkeleton({
      component: 'e1rm-badge',
      htmlSnippet: '<div class="e1rm-badge md">217 lbs</div>',
    })

    expect(skeleton).toContain('testId="compare-e1rm-badge"')
    expect(skeleton).toContain('label="e1rm-badge"')
    expect(skeleton).toContain('<div class="e1rm-badge md">217 lbs</div>')
    expect(skeleton).toContain('<ComparisonPair')
    expect(skeleton).toContain('render <e1rm-badge /> here')
  })

  it('suffixes testId and label with the slugified baseVariant', () => {
    const skeleton = generateSpecimenSkeleton({
      component: 'status-dot',
      htmlSnippet: '<div class="status-dot sm success"></div>',
      baseVariant: { size: 'sm', variant: 'success' },
    })

    expect(skeleton).toContain('testId="compare-status-dot-size-sm-variant-success"')
    expect(skeleton).toContain('label="status-dot size sm variant success"')
  })

  it('escapes backticks in the markup so the template literal stays valid', () => {
    const skeleton = generateSpecimenSkeleton({
      component: 'quote',
      htmlSnippet: '<div>`backtick`</div>',
    })

    expect(skeleton).toContain('\\`backtick\\`')
  })

  it('throws when required fields are missing', () => {
    expect(() => generateSpecimenSkeleton({ component: '', htmlSnippet: '<div></div>' })).toThrow(
      /requires a component name/
    )
    expect(() => generateSpecimenSkeleton({ component: 'x', htmlSnippet: '' })).toThrow(
      /requires an htmlSnippet/
    )
  })
})

describe('parseArgs', () => {
  it('parses positional args and design-freeze-specific flags', () => {
    const result = parseArgs([
      'docs/prototypes/component-demo.html',
      '.e1rm-badge',
      'e1rm-badge',
      '--out-manifest',
      'src/theme/manifest/e1rm-badge.manifest.json',
      '--out-skeleton',
      'e1rm-badge.skeleton.tsx',
      '--tag-version',
      '2026-06-30',
      '--variant',
      'size=md',
    ])

    expect(result).toMatchObject({
      htmlPath: 'docs/prototypes/component-demo.html',
      selector: '.e1rm-badge',
      component: 'e1rm-badge',
      outManifest: 'src/theme/manifest/e1rm-badge.manifest.json',
      outSkeleton: 'e1rm-badge.skeleton.tsx',
      version: '2026-06-30',
      baseVariant: { size: 'md' },
      skipGitTag: false,
    })
  })

  it('defaults tag version to an ISO date and recognizes --skip-git-tag', () => {
    const result = parseArgs([
      'docs/prototypes/component-demo.html',
      '.badge',
      'badge',
      '--skip-git-tag',
    ])

    expect(result.skipGitTag).toBe(true)
    expect(result.version).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

import { describe, expect, it } from 'vitest'

import { foldFragments, parseFragment } from './changelog-compile.mjs'

const CHANGELOG = [
  '# Changelog',
  '',
  '## [Unreleased]',
  '',
  '### Added',
  '',
  '- old added',
  '',
  '### Fixed',
  '',
  '- old fixed',
  '',
  '## 1.0.0',
  '',
  '### Added',
  '',
  '- shipped',
  '',
].join('\n')

const fragment = (section, text) =>
  parseFragment('f.md', `---\nsection: ${section}\n---\n${text}\n`)

describe('changelog fragments', () => {
  it('puts a new bullet first in its section and leaves released sections alone', () => {
    const out = foldFragments(CHANGELOG, [fragment('Added', 'new added')])
    expect(out).toMatch(/### Added\n\n- new added\n- old added\n/)
    expect(out).toMatch(/## 1\.0\.0\n\n### Added\n\n- shipped\n/)
  })

  it('creates a missing section in canonical order', () => {
    const out = foldFragments(CHANGELOG, [fragment('Changed', 'c'), fragment('Internal', 'i')])
    expect(out).toMatch(/- old added\n\n### Changed\n\n- c\n\n### Fixed\n/)
    expect(out).toMatch(/- old fixed\n\n### Internal\n\n- i\n\n## 1\.0\.0/)
  })

  it('rejects a fragment without a known section or without text', () => {
    expect(() => parseFragment('a.md', 'no front matter')).toThrow(/a\.md/)
    expect(() => parseFragment('b.md', '---\nsection: Nope\n---\nx\n')).toThrow(/b\.md/)
    expect(() => parseFragment('c.md', '---\nsection: Added\n---\n\n')).toThrow(/c\.md/)
  })

  it('indents continuation lines under the bullet', () => {
    expect(fragment('Added', 'one\ntwo').bullet).toBe('- one\n  two')
  })
})

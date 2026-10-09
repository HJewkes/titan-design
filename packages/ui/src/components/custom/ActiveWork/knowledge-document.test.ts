import { describe, expect, it } from 'vitest'
import { knowledgeBodyFormat } from './knowledge-document'

describe('knowledgeBodyFormat', () => {
  it('picks markdown by extension, ignoring case', () => {
    expect(knowledgeBodyFormat('/s/garden/notes/a.md')).toBe('markdown')
    expect(knowledgeBodyFormat('/s/garden/notes/A.MD')).toBe('markdown')
  })

  it('shows text-like extensions as plain text', () => {
    expect(knowledgeBodyFormat('/s/kiln/sources/run/export.json')).toBe('text')
    expect(knowledgeBodyFormat('/s/kiln/sources/run/export.JSON')).toBe('text')
  })

  it('treats a file with no extension as text, including a dotfile', () => {
    expect(knowledgeBodyFormat('/s/kiln/sources/run/README')).toBe('text')
    expect(knowledgeBodyFormat('/s/kiln/sources/run/.env')).toBe('text')
    expect(knowledgeBodyFormat('/s.d/kiln/NOTES')).toBe('text')
  })

  it('offers no preview for any other extension rather than defaulting to markdown', () => {
    expect(knowledgeBodyFormat('/s/kiln/sources/run/chart.png')).toBe('unsupported')
    expect(knowledgeBodyFormat('/s/kiln/sources/run/archive.tar.gz')).toBe('unsupported')
  })
})

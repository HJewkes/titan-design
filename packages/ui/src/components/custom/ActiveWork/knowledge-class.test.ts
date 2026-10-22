import { describe, expect, it } from 'vitest'
import {
  KNOWLEDGE_CLASS_META,
  KNOWLEDGE_CLASS_ORDER,
  NOTE_KINDS,
  NOTE_KIND_LABEL,
  SOURCE_TYPES,
  SOURCE_TYPE_LABEL,
  toKnowledgeClass,
} from './knowledge-class'

describe('toKnowledgeClass', () => {
  it('maps the plural wire names', () => {
    expect(toKnowledgeClass('notes')).toBe('note')
    expect(toKnowledgeClass('sources')).toBe('source')
    expect(toKnowledgeClass('nested_sources')).toBe('nested_source')
    expect(toKnowledgeClass('initiatives')).toBe('initiative')
    expect(toKnowledgeClass('tasks')).toBe('task')
    expect(toKnowledgeClass('sessions')).toBe('session')
    expect(toKnowledgeClass('transcripts')).toBe('transcript')
  })

  it('maps singular and plural wire names, and nothing else', () => {
    expect(toKnowledgeClass('note')).toBe('note')
    expect(toKnowledgeClass('nested_source')).toBe('nested_source')
    expect(toKnowledgeClass('artifact')).toBeUndefined()
    expect(toKnowledgeClass('Notes')).toBeUndefined()
    expect(toKnowledgeClass('')).toBeUndefined()
  })

  it('does not mistake an object prototype key for a class', () => {
    expect(toKnowledgeClass('toString')).toBeUndefined()
    expect(toKnowledgeClass('__proto__')).toBeUndefined()
    expect(toKnowledgeClass('constructor')).toBeUndefined()
  })
})

describe('knowledge class vocabulary', () => {
  it('orders every class exactly once', () => {
    expect([...KNOWLEDGE_CLASS_ORDER].sort()).toEqual(Object.keys(KNOWLEDGE_CLASS_META).sort())
  })

  it('gives every class a categorical token', () => {
    for (const knowledgeClass of KNOWLEDGE_CLASS_ORDER) {
      expect(KNOWLEDGE_CLASS_META[knowledgeClass].colorToken).toMatch(/^dataviz-categorical-[0-5]$/)
    }
  })

  it('shares a token only between nested sources and transcripts, which no view shows together', () => {
    const byToken = new Map<string, string[]>()
    for (const knowledgeClass of KNOWLEDGE_CLASS_ORDER) {
      const token = KNOWLEDGE_CLASS_META[knowledgeClass].colorToken
      byToken.set(token, [...(byToken.get(token) ?? []), knowledgeClass])
    }
    const shared = [...byToken.values()].filter((classes) => classes.length > 1)
    expect(shared).toEqual([['nested_source', 'transcript']])
  })

  it('labels every note kind and source type', () => {
    expect(NOTE_KINDS.every((kind) => NOTE_KIND_LABEL[kind].length > 0)).toBe(true)
    expect(SOURCE_TYPES.every((type) => SOURCE_TYPE_LABEL[type].length > 0)).toBe(true)
  })
})

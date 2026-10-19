import { describe, expect, it } from 'vitest'
import { MOTION } from '../../motion/tokens'
import { blogHighlights, blogSchema } from './fixtures'
import type { SchemaData } from './schema-card-layout'
import { schemaCardDurationS, schemaFrame, schemaSchedule } from './schema-card-motion'

const schedule = schemaSchedule(blogSchema, blogHighlights)
const at = (t: number) => schemaFrame(schedule, t)
const ROW_IN_S = MOTION.duration.normal
const rowEnd = (table: string, field: string) =>
  schedule.rowAt.get(`${table}\u0000${field}`)! + ROW_IN_S

describe('schemaSchedule', () => {
  it('enters tables in turn: the next starts once the last row of the one before is in', () => {
    // Catches: every table starting at 0.
    expect(schedule.tableAt.get('authors')).toBe(0)
    expect(schedule.tableAt.get('posts')).toBeCloseTo(rowEnd('authors', 'handle'))
  })

  it('starts a connector only once both of its rows are fully in', () => {
    // Catches: taking the earlier row (min) instead of the later, so a line draws to an empty slot.
    const drawAt = schedule.drawAt.get('post-author')!
    expect(drawAt).toBeCloseTo(Math.max(rowEnd('posts', 'author_id'), rowEnd('authors', 'id')))
    expect(at(drawAt - 0.01).draw('post-author')).toBe(0)
  })

  it('honours explicit times on tables, rows and relations', () => {
    // Catches: the data’s own `atS` ignored in favour of the default cascade.
    const data: SchemaData = {
      tables: [{ id: 'a', name: 'a', atS: 2, fields: [{ id: 'x', name: 'x', atS: 5 }] }],
      relations: [
        { id: 'self', from: { table: 'a', field: 'x' }, to: { table: 'a', field: 'x' }, atS: 9 },
      ],
    }
    const s = schemaSchedule(data)
    expect(s.tableAt.get('a')).toBe(2)
    expect(s.rowAt.get('a\u0000x')).toBe(5)
    expect(s.drawAt.get('self')).toBe(9)
  })
})

describe('schemaFrame', () => {
  it('hides everything at 0 except the first table as it starts', () => {
    // Catches: a reveal compared with `>` at its start, so the first frame is not blank.
    expect(at(0).table('authors')).toEqual({ opacity: 0, offset: 8 })
    expect(at(0).row('posts', 'id').opacity).toBe(0)
  })

  it('draws a connector fully before its marks show', () => {
    // Catches: the marks shown while the line is still drawing.
    const drawAt = schedule.drawAt.get('post-author')!
    const mid = at(drawAt + MOTION.video.emphasis / 2)
    expect(mid.draw('post-author')).toBeGreaterThan(0)
    expect(mid.draw('post-author')).toBeLessThan(1)
    expect(mid.marks('post-author')).toBe(0)
    expect(at(Infinity).draw('post-author')).toBe(1)
    expect(at(Infinity).marks('post-author')).toBe(1)
  })

  it('raises a highlight, holds it, and drops it after its window, exiting faster than it enters', () => {
    // Catches: a highlight that never ends, or an exit as long as the entrance.
    const { atS, durS } = blogHighlights[0]!
    const h = (t: number) => at(t).highlight('posts', 'author_id')
    expect(h(atS - 0.01)).toBe(0)
    expect(h(atS + durS! / 2)).toBe(1)
    expect(h(atS + durS!)).toBe(0)
    expect(h(atS + durS! - ROW_IN_S * MOTION.video.exitScale)).toBe(1)
    expect(at(atS + durS! / 2).highlight('posts', 'id')).toBe(0)
  })

  it('is settled at the reported duration', () => {
    // Catches: a duration that ends before the last connector’s marks are in.
    const end = schemaCardDurationS(blogSchema, blogHighlights)
    const settled = at(Infinity)
    const atEnd = at(end)
    for (const r of blogSchema.relations!) expect(atEnd.marks(r.id)).toBe(settled.marks(r.id))
    for (const t of blogSchema.tables) {
      for (const f of t.fields) expect(atEnd.row(t.id, f.id)).toEqual(settled.row(t.id, f.id))
    }
  })
})

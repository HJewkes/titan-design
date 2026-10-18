import { describe, expect, it } from 'vitest'
import { pathModel, pointAtLength } from '../../motion/paths'
import { blogSchema } from './fixtures'
import {
  DEFAULT_TABLE_WIDTH,
  rowCentre,
  schemaCardSize,
  schemaLayout,
  tableHeight,
  type SchemaData,
} from './schema-card-layout'

const layout = schemaLayout(blogSchema)
const box = (id: string) => layout.tables.find((t) => t.table.id === id)!
const connector = (id: string) => layout.connectors.find((c) => c.relation.id === id)!

function ends(path: string) {
  const model = pathModel(path)
  return [pointAtLength(model, 0), pointAtLength(model, model.length)]
}

describe('schemaLayout', () => {
  it('places a later column to the right and a later row below the tallest table above it', () => {
    // Catches: column and row swapped, or the row gap dropped.
    const [authors, posts, comments] = ['authors', 'posts', 'comments'].map(box)
    expect(authors!.x).toBe(0)
    expect(posts!.x).toBeGreaterThan(authors!.x + DEFAULT_TABLE_WIDTH)
    expect(comments!.x).toBe(posts!.x)
    expect(comments!.y).toBeGreaterThan(tableHeight(blogSchema.tables[1]!))
  })

  it('runs a connector from the referencing row to the referenced row on the facing edges', () => {
    // Catches: the side condition inverted, so the line leaves the far edge of each table.
    const posts = box('posts')
    const authors = box('authors')
    const [start, end] = ends(connector('post-author').path)
    expect(start).toEqual({ x: posts.x, y: posts.y + rowCentre(1) })
    expect(end).toEqual({ x: authors.x + authors.width, y: authors.y + rowCentre(0) })
  })

  it('bows a connector between two tables of one column out past their right edge', () => {
    // Catches: no room reserved for the bow, so it would clip at the card's edge.
    const posts = box('posts')
    const path = connector('comment-post').path
    const [start, end] = ends(path)
    expect(start!.x).toBe(posts.x + posts.width)
    expect(end!.x).toBe(posts.x + posts.width)
    expect(layout.width).toBeGreaterThan(posts.x + posts.width)
  })

  it('draws a crow’s foot at the many end and a bar at the one end', () => {
    // Catches: the marks swapped between the two ends.
    const posts = box('posts')
    const marks = connector('post-author').marks
    expect(marks.match(/M/g)).toHaveLength(3)
    expect(marks.startsWith(`M${posts.x - 12},`)).toBe(true)
  })

  it('draws bars at both ends of a one-to-one relation', () => {
    // Catches: cardinality ignored, so a one-to-one still shows a crow’s foot.
    const data: SchemaData = {
      ...blogSchema,
      relations: [{ ...blogSchema.relations![0]!, cardinality: 'one-to-one' }],
    }
    const marks = schemaLayout(data).connectors[0]!.marks
    expect(marks.match(/V/g)).toHaveLength(2)
  })

  it('drops a relation that names a missing field', () => {
    // Catches: an unresolved end drawn to the origin instead of being dropped.
    const data: SchemaData = {
      ...blogSchema,
      relations: [
        {
          id: 'ghost',
          from: { table: 'posts', field: 'nope' },
          to: { table: 'authors', field: 'id' },
        },
      ],
    }
    expect(schemaLayout(data).connectors).toEqual([])
  })

  it('reports the settled size, and none for no tables', () => {
    // Catches: the size helper and the painted layout disagreeing.
    expect(schemaCardSize(blogSchema)).toEqual({ width: layout.width, height: layout.height })
    expect(schemaCardSize({ tables: [] })).toEqual({ width: 0, height: 0 })
  })
})

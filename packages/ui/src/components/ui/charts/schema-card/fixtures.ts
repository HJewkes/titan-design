// Synthetic schema for stories and tests: a small blog with three tables and three relations, one of
// them between two tables stacked in one column.
import type { SchemaData } from './schema-card-layout'
import type { SchemaHighlight } from './schema-card-motion'

export const blogSchema: SchemaData = {
  tables: [
    {
      id: 'authors',
      name: 'authors',
      fields: [
        { id: 'id', name: 'id', type: 'uuid', key: 'primary' },
        { id: 'handle', name: 'handle', type: 'text' },
      ],
    },
    {
      id: 'posts',
      name: 'posts',
      column: 1,
      fields: [
        { id: 'id', name: 'id', type: 'uuid', key: 'primary' },
        { id: 'author_id', name: 'author_id', type: 'uuid', key: 'foreign' },
        { id: 'title', name: 'title', type: 'text' },
      ],
    },
    {
      id: 'comments',
      name: 'comments',
      column: 1,
      row: 1,
      fields: [
        { id: 'id', name: 'id', type: 'uuid', key: 'primary' },
        { id: 'post_id', name: 'post_id', type: 'uuid', key: 'foreign' },
        { id: 'author_id', name: 'author_id', type: 'uuid', key: 'foreign' },
      ],
    },
  ],
  relations: [
    {
      id: 'post-author',
      from: { table: 'posts', field: 'author_id' },
      to: { table: 'authors', field: 'id' },
    },
    {
      id: 'comment-post',
      from: { table: 'comments', field: 'post_id' },
      to: { table: 'posts', field: 'id' },
    },
    {
      id: 'comment-author',
      from: { table: 'comments', field: 'author_id' },
      to: { table: 'authors', field: 'id' },
    },
  ],
}

export const blogHighlights: readonly SchemaHighlight[] = [
  { field: { table: 'posts', field: 'author_id' }, atS: 3.2, durS: 1.2 },
]

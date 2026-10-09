import type { KnowledgeItem } from './knowledge-filters'

/** How a file's text is shown: as markdown prose, as plain mono text, or not at all. */
export type KnowledgeBodyFormat = 'markdown' | 'text' | 'unsupported'

const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown'])
const TEXT_EXTENSIONS = new Set([
  'txt',
  'json',
  'jsonl',
  'yaml',
  'yml',
  'toml',
  'csv',
  'log',
  'ini',
  'xml',
  'html',
  'ts',
  'tsx',
  'js',
  'mjs',
  'py',
  'sh',
])

function extensionOf(path: string): string | undefined {
  const name = path.slice(Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')) + 1)
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : undefined
}

/**
 * How a file's text renders, from its extension: markdown for `.md`, mono text for
 * text-like extensions and for a file with no extension, and no preview for the
 * rest. Unknown extensions never default to markdown, so binary text cannot reach
 * the prose renderer.
 */
export function knowledgeBodyFormat(path: string): KnowledgeBodyFormat {
  const extension = extensionOf(path)
  if (extension === undefined) return 'text'
  if (MARKDOWN_EXTENSIONS.has(extension)) return 'markdown'
  return TEXT_EXTENSIONS.has(extension) ? 'text' : 'unsupported'
}

/**
 * One note or source opened for reading. The host passes the list item it already
 * holds and maps `note.read`'s `body` or `source.read`'s `content` onto `body`.
 */
export interface KnowledgeDocument {
  /** The list item, which supplies the title and the metadata line. */
  item: KnowledgeItem
  /** The file's text; empty when the file holds only frontmatter. */
  body: string
  /** The read stopped at the size cap, so `body` is the start of the file. */
  isTruncated?: boolean
  /** The file's full size, shown in the truncation notice. */
  bytes?: number
}

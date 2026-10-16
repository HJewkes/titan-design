import ReactMarkdown, { type Components, type Options, type UrlTransform } from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import remarkGfm from 'remark-gfm'

const SAFE_SCHEMES = new Set(['http', 'https', 'mailto'])

/**
 * http, https, mailto and relative URLs pass; any other scheme (javascript:, data:, vbscript:)
 * loses its href, so the link renders inert. A colon after the first `/`, `?` or `#` belongs to
 * a relative path, not a scheme.
 */
export const safeUrl: UrlTransform = (url) => {
  const colon = url.indexOf(':')
  const pathStart = [url.indexOf('/'), url.indexOf('?'), url.indexOf('#')].filter((i) => i >= 0)
  if (colon === -1 || pathStart.some((i) => colon > i)) return url
  return SAFE_SCHEMES.has(url.slice(0, colon).toLowerCase()) ? url : undefined
}

const components: Components = {
  // A link opens beside the review, so following one never navigates the unsent draft away.
  a: ({ node: _node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
  // The page loads nothing from outside the Mac, so an image shows as its alt text.
  img: ({ alt }) => alt ?? null,
}

/** What a heading or list item can hold; block constructs keep their text and lose their box. */
const INLINE_ELEMENTS = ['a', 'br', 'code', 'del', 'em', 'strong']

const inlineOptions: Options = { allowedElements: INLINE_ELEMENTS, unwrapDisallowed: true }

interface MarkdownProps {
  children: string
  /** Inside a heading or list item: phrasing only, no wrapper. */
  inline?: boolean
}

/**
 * Round text as GitHub-flavoured markdown, with a single newline kept as a line break. Raw
 * HTML in the source renders as text (no rehype-raw), never as elements.
 */
export function Markdown({ children, inline = false }: MarkdownProps) {
  const body = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      urlTransform={safeUrl}
      components={components}
      {...(inline ? inlineOptions : {})}
    >
      {children}
    </ReactMarkdown>
  )
  return inline ? body : <div className="md">{body}</div>
}

const ALLOWED_SCHEMES = new Set(['http', 'https', 'mailto'])
const codeOf = (char: string) => char.charCodeAt(0)
const COLON = codeOf(':')
const DELETE = codeOf('\u007f')
const SPACE = codeOf(' ')
const PATH_STARTS = new Set(Array.from('/?#', codeOf))
const SCHEME_PUNCTUATION = new Set(Array.from('+.-', codeOf))

const isLetter = (code: number) => (code | 32) >= codeOf('a') && (code | 32) <= codeOf('z')
const isDigit = (code: number) => code >= codeOf('0') && code <= codeOf('9')
const isSchemeChar = (code: number) =>
  isLetter(code) || isDigit(code) || SCHEME_PUNCTUATION.has(code)

/** The scheme before the first `:`, as RFC 3986 spells one, or `null`. */
function schemeOf(url: string): string | null {
  if (!isLetter(url.charCodeAt(0))) return null
  for (let i = 1; i < url.length; i++) {
    const code = url.charCodeAt(i)
    if (code === COLON) return url.slice(0, i)
    if (!isSchemeChar(code)) return null
  }
  return null
}

// Browsers strip tabs and newlines from a URL before reading its scheme, so `java\tscript:` must not pass as relative.
function hasControlOrSpace(url: string): boolean {
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i)
    if (code <= SPACE || code === DELETE) return true
  }
  return false
}

/** A colon before the first `/`, `?` or `#` is a scheme a browser might still honour. */
function colonBeforePath(url: string): boolean {
  for (let i = 0; i < url.length; i++) {
    const code = url.charCodeAt(i)
    if (code === COLON) return true
    if (PATH_STARTS.has(code)) return false
  }
  return false
}

/**
 * The href a markdown link may carry, or `null` when it must render as text.
 * Only http(s), mailto and relative targets (`/a`, `./a`, `a/b`, `#id`, `?q`) pass.
 */
export function safeHref(url: string): string | null {
  if (!url || hasControlOrSpace(url)) return null
  const scheme = schemeOf(url)
  if (scheme) return ALLOWED_SCHEMES.has(scheme.toLowerCase()) ? url : null
  return colonBeforePath(url) ? null : url
}

/** An absolute web or mail target, which opens outside the app. */
export function isExternalHref(href: string): boolean {
  return schemeOf(href) !== null
}

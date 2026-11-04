const ALLOWED_SCHEMES = new Set(['http', 'https', 'mailto'])
const SCHEME = /^([a-zA-Z][a-zA-Z0-9+.-]*):/
// Browsers strip tabs and newlines from a URL before reading its scheme, so `java\tscript:` must not pass as relative.
// eslint-disable-next-line no-control-regex -- matching control characters is the point
const CONTROL_OR_SPACE = /[\u0000- \u007f]/

/**
 * The href a markdown link may carry, or `null` when it must render as text.
 * Only http(s), mailto and relative targets (`/a`, `./a`, `a/b`, `#id`, `?q`) pass.
 */
export function safeHref(url: string): string | null {
  if (!url || CONTROL_OR_SPACE.test(url)) return null
  const scheme = SCHEME.exec(url)?.[1]
  if (scheme) return ALLOWED_SCHEMES.has(scheme.toLowerCase()) ? url : null
  // A colon before the first `/`, `?` or `#` is a scheme a browser might still honour.
  const head = url.split(/[/?#]/)[0] ?? ''
  return head.includes(':') ? null : url
}

/** An absolute web or mail target, which opens outside the app. */
export function isExternalHref(href: string): boolean {
  return SCHEME.test(href)
}

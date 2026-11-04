// eslint-disable-next-line no-control-regex -- VitePress strips control characters; so must we
const CONTROL = /[\u0000-\u001f]/g
const SPECIAL = /[\s~`!@#$%^&*()\-_+=[\]{}|\\;:"'“”‘’<>,.?/]+/g
const COMBINING = /[̀-ͯ]/g
const CUSTOM_ID = /^(.*?)\s*\{#([\w-]+)\}\s*$/

/**
 * A heading's anchor id, by the same rule as VitePress (`@mdit-vue/shared`), so a site moved
 * off VitePress keeps every `#fragment` it already links to.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(COMBINING, '')
    .replace(CONTROL, '')
    .replace(SPECIAL, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^(\d)/, '_$1')
    .toLowerCase()
}

/** Splits `Title {#custom-id}` into its text and the id it pins. */
export function readCustomId(heading: string): { text: string; id?: string } {
  const match = CUSTOM_ID.exec(heading)
  return match ? { text: match[1]!, id: match[2]! } : { text: heading }
}

/** Hands out ids in document order; a repeat gets `-1`, `-2`, … like markdown-it-anchor. */
export function createSlugger(): (base: string) => string {
  const seen = new Map<string, number>()
  return (base) => {
    let id = base
    let n = seen.get(base) ?? 0
    while (seen.has(id)) id = `${base}-${++n}`
    seen.set(base, n)
    seen.set(id, 0)
    return id
  }
}

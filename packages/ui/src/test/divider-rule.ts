import { capturedByNode } from './classname-capture'

/**
 * The classes `node` rendered with if it is a `Divider` (role `presentation`), or `undefined`
 * when it is anything else. A band's rule is a sibling `Divider`, not a border on the band,
 * so tests read it from the band's `nextElementSibling` / `previousElementSibling`.
 */
export function dividerClasses(node: Element | null | undefined): string[] | undefined {
  if (!node || node.getAttribute('role') !== 'presentation') return undefined
  return capturedByNode.get(node)?.split(/\s+/)
}

/** The border and hairline classes `node` rendered with: a band ruled by its own border, not a `Divider`. */
export function bandRules(node: Element | null | undefined): string[] {
  const classes = node ? (capturedByNode.get(node)?.split(/\s+/) ?? []) : []
  return classes.filter((c) => /^border(-[btlrxy])?$|hairline/.test(c))
}

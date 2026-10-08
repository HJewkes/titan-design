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

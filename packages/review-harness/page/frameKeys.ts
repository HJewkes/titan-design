interface KeySource {
  key: string
  code: string
  metaKey: boolean
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  repeat: boolean
  target: unknown
}

const TEXT_ENTRY_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/** Tag-based, because an element from the frame's realm fails `instanceof` in the page's. */
function isStoryTextEntry(target: unknown): boolean {
  const el = target as { tagName?: string; isContentEditable?: boolean } | null
  return !!el && (TEXT_ENTRY_TAGS.has(el.tagName ?? '') || el.isContentEditable === true)
}

const INTERACTIVE =
  'button, a[href], input, select, textarea, summary, [role=button], [contenteditable]'

/** Plain Enter on these activates them, so the page must not swallow it. */
function isStoryInteractive(target: unknown): boolean {
  const el = target as { tagName?: string; closest?: (selector: string) => unknown } | null
  if (!el) return false
  return el.closest
    ? el.closest(INTERACTIVE) !== null
    : ['BUTTON', 'A', 'SUMMARY'].includes(el.tagName ?? '')
}

/** What the page should hear of a key pressed inside a story frame; null while the story's own field takes typing. */
export function forwardedKey(e: KeySource): KeyboardEventInit | null {
  if (isStoryTextEntry(e.target) && !(e.key === 'Enter' && (e.metaKey || e.ctrlKey))) return null
  const chord = e.metaKey || e.ctrlKey
  if (e.key === 'Enter' && !chord && isStoryInteractive(e.target)) return null
  const { key, code, metaKey, ctrlKey, shiftKey, altKey, repeat } = e
  return { key, code, metaKey, ctrlKey, shiftKey, altKey, repeat, bubbles: true, cancelable: true }
}

/**
 * A click inside a story moves keyboard focus into its iframe, whose keys never reach the
 * page's window listener; re-dispatch them on the page so the shortcuts keep working.
 */
export function forwardFrameKeys(frame: Window): () => void {
  const listener = (e: KeyboardEvent) => {
    const init = forwardedKey(e)
    if (!init) return
    const forwarded = new KeyboardEvent('keydown', init)
    window.dispatchEvent(forwarded)
    if (forwarded.defaultPrevented) e.preventDefault()
  }
  frame.addEventListener('keydown', listener)
  return () => frame.removeEventListener('keydown', listener)
}

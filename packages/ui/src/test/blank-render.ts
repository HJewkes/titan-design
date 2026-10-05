export interface RootMetrics {
  width: number
  height: number
  childElementCount: number
}

/** Why a story root would freeze as a blank baseline, or null when it rendered. */
export function blankRenderReason(root: RootMetrics | null): string | null {
  if (!root) return '#storybook-root is missing'
  if (root.width === 0 || root.height === 0) {
    return `#storybook-root has a zero-size box (${root.width}x${root.height}, ${root.childElementCount} children)`
  }
  if (root.childElementCount === 0) return '#storybook-root has no child elements'
  return null
}

import { Platform, type GestureResponderEvent } from 'react-native'

interface ClickModifiers {
  metaKey?: boolean
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

export interface AnchorOptions {
  href?: string
  isExternal?: boolean
  isDisabled?: boolean
  onPress?: () => void
}

export interface AnchorProps {
  onPress: (event: GestureResponderEvent) => void
  href?: string
  hrefAttrs?: { target: string; rel: string }
  /** Keeps the browser's default anchor colour and underline out of the look. */
  className?: string
}

function hasModifier(event: GestureResponderEvent): boolean {
  const keys = event.nativeEvent as unknown as ClickModifiers
  return Boolean(keys.metaKey || keys.ctrlKey || keys.shiftKey || keys.altKey)
}

/**
 * Props that make a react-native-web Pressable render a real `<a href>`.
 *
 * Off web, or without an `href`, only `onPress` is returned and the element stays as it was.
 * A modified click (ctrl, meta, shift) is left to the browser, so it opens a new tab or window.
 * A plain click calls `onPress`; when one is given, it owns navigation and the default is
 * prevented, except for external links, which always follow `href`.
 */
export function anchorProps({ href, isExternal, isDisabled, onPress }: AnchorOptions): AnchorProps {
  const isAnchor = Platform.OS === 'web' && href != null && !isDisabled

  const handlePress = (event: GestureResponderEvent) => {
    if (isDisabled) return
    if (!isAnchor) {
      onPress?.()
      return
    }
    if (hasModifier(event) || !onPress) return
    if (!isExternal) event.preventDefault()
    onPress()
  }

  if (!isAnchor) return { onPress: handlePress }
  return {
    onPress: handlePress,
    href,
    hrefAttrs: isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : undefined,
    className: 'no-underline text-inherit',
  }
}

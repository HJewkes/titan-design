import { AccessibilityInfo, Platform } from 'react-native'

// iOS ignores accessibilityLiveRegion, so the text a live region would speak is announced directly.
export function announceOnIOS(text: string): void {
  if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(text)
}

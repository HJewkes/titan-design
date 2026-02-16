/**
 * NativeWind type augmentations
 *
 * Adds `className` prop support to React Native components.
 * This allows Tailwind classes to be used with NativeWind.
 */

import 'react-native'

declare module 'react-native' {
  interface ViewProps {
    className?: string
  }

  interface TextProps {
    className?: string
  }

  interface ImageProps {
    className?: string
  }

  interface ScrollViewProps {
    className?: string
  }

  interface TextInputProps {
    className?: string
  }

  interface TouchableOpacityProps {
    className?: string
  }

  interface TouchableHighlightProps {
    className?: string
  }

  interface PressableProps {
    className?: string
  }

  interface ActivityIndicatorProps {
    className?: string
  }

  interface FlatListProps<ItemT> {
    className?: string
  }

  interface SectionListProps<ItemT, SectionT> {
    className?: string
  }
}

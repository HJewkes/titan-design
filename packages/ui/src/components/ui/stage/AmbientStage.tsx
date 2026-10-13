import React from 'react'
import { Platform, View, type ViewProps, type ViewStyle } from 'react-native'
import { cn } from '../../../utils/cn'
import { atmosphereWashes, stageGrain, type StageWash } from './atmosphere'

/** Props for {@link AmbientStage}. */
export interface AmbientStageProps extends ViewProps {
  /** Picks the grain field. Default 0, the `.grain` tile. */
  seed?: number
  /** Tailwind overrides for the root, merged with `cn()`. */
  className?: string
  /** What stands on the stage. */
  children?: React.ReactNode
}

// backgroundImage and mixBlendMode are web-only CSS that React Native Web passes through.
const layerStyle = (style: Record<string, unknown>) => style as unknown as ViewStyle

function Layer({ style, testID }: { style: ViewStyle; testID: string }) {
  return (
    <View
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      testID={testID}
      className="absolute inset-0"
      style={[{ pointerEvents: 'none' }, style]}
    />
  )
}

const washStyle = ({ image, opacity }: StageWash) => layerStyle({ backgroundImage: image, opacity })

/**
 * The stage plane: `background-base` with the `.atmosphere-warm` brand washes behind its content and
 * the static `.grain` tile over it. Both layers are decorative and hidden from assistive tech. On
 * native it is the plain plane.
 *
 * @example
 * <AmbientStage className="h-full">{content}</AmbientStage>
 */
export function AmbientStage({ seed = 0, className, children, ...props }: AmbientStageProps) {
  const web = Platform.OS === 'web'
  const washes = atmosphereWashes()
  const grain = layerStyle({
    backgroundImage: stageGrain(seed),
    opacity: 0.015,
    mixBlendMode: 'overlay',
  })
  return (
    <View className={cn('relative overflow-hidden bg-background-base', className)} {...props}>
      {web
        ? washes.map((w, i) => <Layer key={i} testID="ambient-stage-wash" style={washStyle(w)} />)
        : null}
      {children}
      {web ? <Layer testID="ambient-stage-grain" style={grain} /> : null}
    </View>
  )
}

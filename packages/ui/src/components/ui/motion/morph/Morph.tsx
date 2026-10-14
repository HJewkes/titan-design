import { useMemo, type ReactNode } from 'react'
import { View, type ViewProps } from 'react-native'
import { usePrefersReducedMotion } from '../../../../hooks/usePrefersReducedMotion'
import { cn } from '../../../../utils/cn'
import type { MorphPart } from './match-parts'
import { partsMorph, type MorphLayer, type PartsMorphOptions } from './parts-morph'

export interface MorphProps<P extends MorphPart> extends PartsMorphOptions, Omit<ViewProps, 'children'> {
  /** The scene the morph leaves. */
  from: readonly P[]
  /** The scene the morph arrives at. */
  to: readonly P[]
  /** 0 shows `from`, 1 shows `to`. Time is a prop: derive it from a clock outside. */
  progress: number
  /** Paints one part's content to fill its own box. */
  renderPart: (part: P, layer: MorphLayer<P>) => ReactNode
  /** Stage size in px; parts are placed in this box. */
  width: number
  height: number
  className?: string
}

/**
 * A keyed morph between two scenes (Manim's TransformMatchingParts): parts whose keys match move to
 * their new box, key-mapped parts move and cross-fade, and the rest fade out and in. Under reduced
 * motion it shows `to`. Only transform and opacity animate.
 *
 * @example
 * <Morph from={before} to={after} progress={p} width={480} height={120} renderPart={paintToken} />
 */
export function Morph<P extends MorphPart>({
  from,
  to,
  progress,
  keyMap,
  ease,
  windows,
  renderPart,
  width,
  height,
  className,
  style,
  ...props
}: MorphProps<P>) {
  const isReducedMotion = usePrefersReducedMotion()
  const morph = useMemo(
    () => partsMorph(from, to, { keyMap, ease, windows }),
    [from, to, keyMap, ease, windows]
  )
  const layers = morph(isReducedMotion ? 1 : progress)

  return (
    <View
      style={[{ width, height }, style]}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      {layers.map((layer) => (
        <MorphLayerView key={layer.id} layer={layer}>
          {renderPart(layer.part, layer)}
        </MorphLayerView>
      ))}
    </View>
  )
}

function MorphLayerView<P extends MorphPart>({
  layer,
  children,
}: {
  layer: MorphLayer<P>
  children: ReactNode
}) {
  const { box } = layer.part
  const { translateX, translateY, scaleX, scaleY } = layer.transform
  // At an even cross-fade only the target is announced, so a screen reader never reads both.
  const isHidden = layer.id.startsWith('from:') ? layer.opacity <= 0.5 : layer.opacity < 0.5
  return (
    <View
      testID={`morph-layer-${layer.id}`}
      aria-hidden={isHidden || undefined}
      className="absolute"
      style={{
        left: box.x,
        top: box.y,
        width: box.width,
        height: box.height,
        opacity: layer.opacity,
        transform: [{ translateX }, { translateY }, { scaleX }, { scaleY }],
      }}
    >
      {children}
    </View>
  )
}

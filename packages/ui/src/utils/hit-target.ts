import type { Insets } from 'react-native'

/** The smallest pressable box a finger gets, in px (Apple's 44pt floor). */
export const HIT_TARGET_MIN = 44

export const HIT_TARGET_TEST_ID = 'hit-target'

export type HitTargetAxis = 'horizontal' | 'vertical'

/** Gap to the neighbouring face, in px, on the numeric spacing scale. */
export type HitTargetOutset = 0 | 4 | 8

/**
 * A row or column of pressables caps the hit box along its own axis at the gap,
 * so one control's hit box stops at its neighbour's face instead of covering it.
 */
export interface HitTargetLimit {
  axis: HitTargetAxis
  outset: HitTargetOutset
}

// Centred on the face and never smaller than it: a face already past 44 gains nothing.
const CENTRED: Record<HitTargetAxis, string> = {
  horizontal: 'left-1/2 -translate-x-1/2 w-full min-w-11',
  vertical: 'top-1/2 -translate-y-1/2 h-full min-h-11',
}

const LIMITED: Record<HitTargetAxis, Record<HitTargetOutset, string>> = {
  horizontal: { 0: 'inset-x-0', 4: '-inset-x-1', 8: '-inset-x-2' },
  vertical: { 0: 'inset-y-0', 4: '-inset-y-1', 8: '-inset-y-2' },
}

function layerClassAlong(axis: HitTargetAxis, limit?: HitTargetLimit): string {
  return limit?.axis === axis ? LIMITED[axis][limit.outset] : CENTRED[axis]
}

/**
 * Classes for the transparent layer that carries the hit box on web, where
 * react-native-web's Pressable ignores `hitSlop`. It renders inside the
 * pressable, so a press on it bubbles to the pressable and the face keeps its size.
 */
export function hitTargetLayerClass(limit?: HitTargetLimit): string {
  return `absolute ${layerClassAlong('horizontal', limit)} ${layerClassAlong('vertical', limit)}`
}

function slopAlong(axis: HitTargetAxis, length: number, limit?: HitTargetLimit): number {
  if (limit?.axis === axis) return limit.outset
  return Math.max(0, (HIT_TARGET_MIN - length) / 2)
}

/** The native `hitSlop` that grows a measured face to the same box the web layer gives. */
export function hitSlopFor(
  face: { width: number; height: number },
  limit?: HitTargetLimit
): Insets {
  const x = slopAlong('horizontal', face.width, limit)
  const y = slopAlong('vertical', face.height, limit)
  return { top: y, bottom: y, left: x, right: x }
}

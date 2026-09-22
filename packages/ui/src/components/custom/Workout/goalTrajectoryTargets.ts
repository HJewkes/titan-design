/**
 * The goal chart's two tip targets, the next-target tip and the calibrating info
 * target, share one size rule and one box shape, so placement can check one
 * against the other at the sizes they are really drawn.
 */
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import type { GeometryPoint } from './GoalTrajectoryChartGeometry'

/** Hit area: 24px for a pointer, 44px for touch (WCAG 2.5.8 and the platform minimums). */
export const HIT_TARGET_POINTER = 24
export const HIT_TARGET_TOUCH = 44

const COARSE = '(pointer: coarse)'

function coarseQuery(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(COARSE)
}

/** The hit size now: touch on native, and on a web page whose main pointer is coarse. */
export function hitTargetSize(): number {
  if (Platform.OS !== 'web') return HIT_TARGET_TOUCH
  return coarseQuery()?.matches ? HIT_TARGET_TOUCH : HIT_TARGET_POINTER
}

/** {@link hitTargetSize}, kept current when the main pointer changes (a tablet docking a mouse). */
export function useHitTargetSize(): number {
  const [size, setSize] = useState(hitTargetSize)
  useEffect(() => {
    const query = Platform.OS === 'web' ? coarseQuery() : null
    if (!query) return
    const update = () => setSize(hitTargetSize())
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return size
}

export interface HitBox {
  x: number
  y: number
  size: number
}

/** A square of `size` centred on `point`, moved inside a `width` x `height` box so it never leaves the chart. */
export function hitBoxAround(
  point: GeometryPoint,
  size: number,
  width: number,
  height: number
): HitBox {
  const clamp = (v: number, max: number) => Math.min(Math.max(v, 0), Math.max(0, max))
  return {
    x: clamp(point.x - size / 2, width - size),
    y: clamp(point.y - size / 2, height - size),
    size,
  }
}

/** True when two boxes overlap or come closer than `gap`. */
export function boxesTouch(a: HitBox, b: HitBox, gap = 0): boolean {
  return (
    a.x < b.x + b.size + gap &&
    b.x < a.x + a.size + gap &&
    a.y < b.y + b.size + gap &&
    b.y < a.y + a.size + gap
  )
}

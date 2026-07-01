import React from 'react'
import { View, Text, Pressable, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'

export interface TreemapDatum {
  /** Stable identity — returned by onPress and used as the React key. */
  id: string
  /** Area weight (e.g. size, count, severity). Non-positive values are dropped. */
  value: number
  /** Tile fill color. Falls back to a built-in categorical palette by index. */
  color?: string
  /** Optional label rendered inside sufficiently large tiles. */
  label?: string
}

export type TreemapScale = 'linear' | 'sqrt' | 'log'

export interface TreemapProps extends Omit<ViewProps, 'children'> {
  data: TreemapDatum[]
  /** Layout box. Required — the treemap fills exactly this area. */
  width: number
  height: number
  /**
   * Area scale. Real-world weights are often heavy-tailed, where one outlier
   * under a `linear` scale swallows the whole canvas. `sqrt` (default) damps
   * that while preserving order; `log` compresses hardest.
   */
  scale?: TreemapScale
  /** Show at most N tiles; the remainder collapse into one "+M more" tile. */
  maxTiles?: number
  /** Fires with a tile's id on press (never for the "+M more" tile). */
  onPress?: (id: string) => void
  /** Draws a highlight border on the matching tile. */
  selectedId?: string
  className?: string
}

/** Titan categorical fallback palette (data-1..data-8). */
const PALETTE = [
  '#5B9BD5', '#14B8A6', '#F4A736', '#F83030',
  '#823CA0', '#D4A520', '#406D87', '#43C6B7',
]

interface Rect {
  x: number
  y: number
  w: number
  h: number
  datum: TreemapDatum
}

function scaleValue(v: number, scale: TreemapScale): number {
  if (v <= 0) return 0
  if (scale === 'sqrt') return Math.sqrt(v)
  if (scale === 'log') return Math.log10(v + 1)
  return v
}

function worstRatio(row: { area: number }[], side: number): number {
  const sum = row.reduce((s, r) => s + r.area, 0)
  const thickness = sum / side
  let worst = 0
  for (const r of row) {
    const len = r.area / thickness
    const ratio = Math.max(thickness / len, len / thickness)
    if (ratio > worst) worst = ratio
  }
  return worst
}

/** Squarified treemap (Bruls, Huizing & van Wijk, 2000). */
function squarify(data: TreemapDatum[], w: number, h: number): Rect[] {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total <= 0 || w <= 0 || h <= 0) return []
  const scaled = data.map((d) => ({ datum: d, area: (d.value / total) * w * h }))
  const out: Rect[] = []
  let rx = 0
  let ry = 0
  let rw = w
  let rh = h
  let i = 0

  while (i < scaled.length) {
    const vertical = rw >= rh
    const side = vertical ? rh : rw
    let row: typeof scaled = []
    let bestWorst = Infinity
    let j = i
    while (j < scaled.length) {
      const trial = [...row, scaled[j]]
      const worst = worstRatio(trial, side)
      if (row.length > 0 && worst > bestWorst) break
      row = trial
      bestWorst = worst
      j++
    }
    const rowArea = row.reduce((s, r) => s + r.area, 0)
    const thickness = rowArea / side
    let along = vertical ? ry : rx
    for (const r of row) {
      const len = r.area / thickness
      out.push(
        vertical
          ? { x: rx, y: along, w: thickness, h: len, datum: r.datum }
          : { x: along, y: ry, w: len, h: thickness, datum: r.datum },
      )
      along += len
    }
    if (vertical) {
      rx += thickness
      rw -= thickness
    } else {
      ry += thickness
      rh -= thickness
    }
    i = j
  }
  return out
}

/**
 * Squarified treemap. SVG-free (absolutely-positioned tiles) so it renders
 * identically on web (react-native-web) and native. Layout is computed from
 * `value`; color and labels are caller-supplied.
 */
export function Treemap({
  data,
  width,
  height,
  scale = 'sqrt',
  maxTiles = 60,
  onPress,
  selectedId,
  className,
  ...props
}: TreemapProps) {
  const clean = data
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value)
    .map((d, i) => ({ ...d, color: d.color ?? PALETTE[i % PALETTE.length] }))

  let tiles = clean
  if (clean.length > maxTiles) {
    const head = clean.slice(0, maxTiles - 1)
    const restValue = clean.slice(maxTiles - 1).reduce((s, d) => s + d.value, 0)
    tiles = [
      ...head,
      { id: '__more__', value: restValue, color: '#3a3a3a', label: `+${clean.length - (maxTiles - 1)} more` },
    ]
  }

  const weighted = tiles.map((d) => ({ ...d, value: scaleValue(d.value, scale) }))
  const rects = squarify(weighted, width, height)

  return (
    <View className={cn('relative', className)} style={{ width, height }} {...props}>
      {rects.map((r) => {
        const selected = r.datum.id === selectedId
        const labelFits = r.w > 54 && r.h > 22
        const pressable = r.datum.id !== '__more__'
        return (
          <Pressable
            key={r.datum.id}
            testID={`treemap-tile-${r.datum.id}`}
            accessibilityLabel={r.datum.label ?? r.datum.id}
            onPress={pressable ? () => onPress?.(r.datum.id) : undefined}
            style={{
              position: 'absolute',
              left: r.x,
              top: r.y,
              width: Math.max(0, r.w - 2),
              height: Math.max(0, r.h - 2),
              backgroundColor: r.datum.color,
              borderRadius: 3,
              opacity: selected ? 1 : 0.9,
              borderWidth: selected ? 2 : 0,
              borderColor: '#ffffff',
              padding: 4,
              overflow: 'hidden',
            }}
          >
            {labelFits && (
              <Text numberOfLines={2} className="text-[10px] font-semibold text-[#0b0b0b]">
                {r.datum.label ?? r.datum.id}
              </Text>
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

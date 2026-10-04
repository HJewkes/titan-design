import { formatTenths } from '../../utils/number-format'
import { getSemanticColors, type ThemeMode } from '../tokens/semantic'
import { composite, contrastRatio, lightness, parseColor } from './color-math'
import type { ColorToken, NonTextPair } from './pairs'

export const MODES = ['light', 'dark'] as const satisfies readonly ThemeMode[]

export interface Measurement {
  /** `mode:pair@plane`, the line a baseline holds. */
  key: string
  passes: boolean
  /** Human-readable result, e.g. `2.19:1 (needs 3)`. */
  detail: string
}

export function measurePair(pair: NonTextPair, mode: ThemeMode, plane: ColorToken): Measurement {
  const colors = getSemanticColors(mode)
  const ground = composite(parseColor(colors[plane]), [0, 0, 0])
  const sits = pair.over ? composite(parseColor(colors[pair.over]), ground) : ground
  const painted = composite(parseColor(colors[pair.token]), sits)
  const key = `${mode}:${pair.id}@${plane}`
  if ('deltaL' in pair.floor) {
    const delta = Math.abs(lightness(painted) - lightness(sits))
    return {
      key,
      passes: delta >= pair.floor.deltaL,
      detail: `ΔL* ${formatTenths(delta)} (needs ${pair.floor.deltaL})`,
    }
  }
  const ratio = contrastRatio(painted, sits)
  return {
    key,
    passes: ratio >= pair.floor.ratio,
    detail: `${Math.round(ratio * 100) / 100}:1 (needs ${pair.floor.ratio})`,
  }
}

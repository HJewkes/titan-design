import { formatTenths } from '../../utils/number-format'
import { compositeOver, contrast, relativeLuminance } from '../color-checks'
import { getSemanticColors, type ThemeMode } from '../tokens/semantic'
import type { ColorToken, NonTextPair } from './pairs'

export const MODES = ['light', 'dark'] as const satisfies readonly ThemeMode[]

export interface Measurement {
  /** `mode:pair@plane`, the line a baseline holds. */
  key: string
  passes: boolean
  /** Human-readable result, e.g. `2.19:1 (needs 3)`. */
  detail: string
}

/** CIELAB L* (D65), the lightness axis the repo's separator floors are written in. */
function lightness(hex: string): number {
  const y = relativeLuminance(hex)
  return y > 216 / 24389 ? 116 * Math.cbrt(y) - 16 : (24389 / 27) * y
}

/** Truncates rather than rounds, so a value under its floor never prints as the floor. */
const floorTo = (n: number, digits: number) => Math.floor(n * 10 ** digits) / 10 ** digits

export function measurePair(pair: NonTextPair, mode: ThemeMode, plane: ColorToken): Measurement {
  const colors = getSemanticColors(mode)
  const ground = compositeOver(colors[plane], '#000000')
  const sits = pair.over ? compositeOver(colors[pair.over], ground) : ground
  const painted = compositeOver(colors[pair.token], sits)
  const key = `${mode}:${pair.id}@${plane}`
  if ('deltaL' in pair.floor) {
    const delta = Math.abs(lightness(painted) - lightness(sits))
    return {
      key,
      passes: delta >= pair.floor.deltaL,
      detail: `ΔL* ${formatTenths(floorTo(delta, 1))} (needs ${pair.floor.deltaL})`,
    }
  }
  const ratio = contrast(painted, sits)
  return {
    key,
    passes: ratio >= pair.floor.ratio,
    detail: `${floorTo(ratio, 2)}:1 (needs ${pair.floor.ratio})`,
  }
}

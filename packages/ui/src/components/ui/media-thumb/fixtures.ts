import type { ImageSourcePropType } from 'react-native'
import { primitiveColors, primitiveRamps } from '../../../theme/tokens/primitives'

// Posters are inline SVG, so stories render offline and the same on every run.
function poster(width: number, height: number, sky: string, ground: string): ImageSourcePropType {
  const horizon = Math.round(height * 0.6)
  const sun = Math.round(Math.min(width, height) * 0.12)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}">` +
    `<rect width="${String(width)}" height="${String(horizon)}" fill="${sky}"/>` +
    `<rect y="${String(horizon)}" width="${String(width)}" height="${String(height - horizon)}" fill="${ground}"/>` +
    `<circle cx="${String(width * 0.7)}" cy="${String(horizon * 0.5)}" r="${String(sun)}" fill="${primitiveRamps.amber[400]}"/>` +
    `</svg>`
  return { uri: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` }
}

/** Poster frames for `MediaThumb` stories. `landscape` has white ground under the badges, their hardest case. */
export const mediaThumbSources = {
  landscape: poster(1280, 720, primitiveRamps.blue[600], primitiveColors.white),
  portrait: poster(720, 1280, primitiveRamps.blue[200], primitiveRamps.green[700]),
  none: undefined,
  broken: { uri: 'data:image/png;base64,broken' },
} satisfies Record<string, ImageSourcePropType | undefined>

export type MediaThumbSourceName = keyof typeof mediaThumbSources

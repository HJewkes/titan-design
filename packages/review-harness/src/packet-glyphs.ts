// A 5x7 bitmap font for the label bars on CI packet montages, so labels need no font file or canvas.
import { fillRect, type Rect, type Rgba } from './packet-png.ts'

export const GLYPH_W = 5
export const GLYPH_H = 7

/** Seven rows per glyph, two hex digits each; bit 4 is the leftmost column. */
const GLYPHS: Record<string, string> = {
  A: '0e11111f111111',
  B: '1e11111e11111e',
  C: '0e11101010110e',
  D: '1e11111111111e',
  E: '1f10101e10101f',
  F: '1f10101e101010',
  G: '0e11101711110f',
  H: '1111111f111111',
  I: '0e04040404040e',
  J: '0702020202120c',
  K: '11121418141211',
  L: '1010101010101f',
  M: '111b1515111111',
  N: '11111915131111',
  O: '0e11111111110e',
  P: '1e11111e101010',
  Q: '0e11111115120d',
  R: '1e11111e141211',
  S: '0f10100e01011e',
  T: '1f040404040404',
  U: '1111111111110e',
  V: '11111111110a04',
  W: '1111111515150a',
  X: '11110a040a1111',
  Y: '11110a04040404',
  Z: '1f01020408101f',
  '0': '0e11131519110e',
  '1': '040c040404040e',
  '2': '0e11010204081f',
  '3': '1f02040201110e',
  '4': '02060a121f0202',
  '5': '1f101e0101110e',
  '6': '0608101e11110e',
  '7': '1f010204080808',
  '8': '0e11110e11110e',
  '9': '0e11110f01020c',
  ' ': '00000000000000',
  '-': '0000001f000000',
  '.': '00000000000c0c',
  x: '0000110a040a11',
  '>': '08040201020408',
  '%': '18190204081303',
  '(': '02040808080402',
  ')': '08040202020408',
}

/** The glyph's rows, falling back to its upper case and then to a blank. */
function rowsOf(char: string): number[] {
  const hex = GLYPHS[char] ?? GLYPHS[char.toUpperCase()] ?? GLYPHS[' ']
  return Array.from({ length: GLYPH_H }, (_, row) => parseInt(hex.slice(row * 2, row * 2 + 2), 16))
}

/** Draws `text` with its top-left at (x, y), clipped to `maxX`. */
export function drawLabel(
  image: Rgba,
  text: string,
  at: { x: number; y: number; scale: number; maxX: number },
  rgba: readonly number[]
): void {
  ;[...text].forEach((char, index) => {
    const left = at.x + index * (GLYPH_W + 1) * at.scale
    rowsOf(char).forEach((bits, row) => {
      for (let col = 0; col < GLYPH_W; col++)
        if (bits & (1 << (GLYPH_W - 1 - col)))
          fillRect(image, cell(left + col * at.scale, at.y + row * at.scale, at), rgba)
    })
  })
}

/** One font pixel as a `scale`-sized square, cut off at `maxX`. */
function cell(x: number, y: number, at: { scale: number; maxX: number }): Rect {
  return { x, y, w: Math.max(0, Math.min(at.scale, at.maxX - x)), h: at.scale }
}

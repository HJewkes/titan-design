// Pure maths for AnimatedNumber: every rendered frame is a function of `progress`; nothing reads a clock.
import { easeOut, poly } from '../motion/easing'
import { interpolate } from '../motion/interpolate'

/** Turns the numeric value into the string a reader sees. */
export type AnimatedNumberFormat = (n: number) => string

const countEase = easeOut(poly(2))

/** The unrounded value at `progress`; at 1 or beyond it is `value` itself, never an interpolation result. */
export function valueAt(progress: number, from: number, value: number): number {
  if (progress >= 1) return value
  return interpolate(progress, [0, 1], [from, value], { ease: countEase })
}

/** One cell of the reel: a digit column keyed by place value, or a fixed glyph such as `,` or `.`. */
export type ReelCell =
  | { kind: 'digit'; key: string; digit: number; next: number; offset: number }
  | { kind: 'glyph'; key: string; glyph: string }

/** The power of ten each character of `text` stands for; `null` for a non-digit. Assumes `.` is the decimal mark. */
function placesOf(text: string): (number | null)[] {
  const point = text.lastIndexOf('.')
  const end = point === -1 ? text.length : point
  let place = 0
  const places: (number | null)[] = []
  for (let i = text.length - 1; i >= 0; i--) {
    if (!/\d/.test(text[i])) places[i] = null
    else places[i] = i > end ? end - i : place++
  }
  return places
}

/** The column's position on its 0..9 wheel: its own fractional progress, odometer style. */
function wheelPosition(current: number, place: number): number {
  const scaled = Math.abs(current) / 10 ** place
  return ((scaled % 10) + 10) % 10
}

/**
 * The reel for `current`, laid out on the final string so columns keep their place and width.
 * At `progress` 1 every offset is 0 and every column shows its final digit.
 */
export function reelCells(finalText: string, current: number, settled: boolean): ReelCell[] {
  return placesOf(finalText).map((place, i) => {
    const char = finalText[i]
    if (place === null) return { kind: 'glyph', key: `g${i}`, glyph: char }
    if (settled) {
      const digit = Number(char)
      return { kind: 'digit', key: `p${place}`, digit, next: digit, offset: 0 }
    }
    const position = wheelPosition(current, place)
    const digit = Math.floor(position)
    return {
      kind: 'digit',
      key: `p${place}`,
      digit,
      next: (digit + 1) % 10,
      offset: position - digit,
    }
  })
}

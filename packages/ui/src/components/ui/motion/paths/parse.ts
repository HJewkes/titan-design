// SVG path parsing and normalisation. Ported from @remotion/paths (MIT, (c) 2023 JonnyBurger) at commit
// 4d9ff70e1f, parse-path.ts and normalize-path.ts, whose parser credits rveciana/svg-path-properties.
// Rewritten as one sticky-regex scanner; see ./LICENSE.

/** An absolute point in path coordinates. */
export interface PathPoint {
  /** Horizontal coordinate. */
  x: number
  /** Vertical coordinate. */
  y: number
}

/**
 * One absolute path command after `parsePath`: relative forms are resolved, `H`/`V` become `L`, `S` becomes
 * `C` and `T` becomes `Q`, so only `M L C Q A Z` remain.
 */
export type PathCommand =
  | { type: 'M' | 'L'; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: 'Q'; x1: number; y1: number; x: number; y: number }
  | {
      type: 'A'
      rx: number
      ry: number
      rotation: number
      largeArc: boolean
      sweep: boolean
      x: number
      y: number
    }
  | { type: 'Z' }

const ARITY: Record<string, number> = { m: 2, l: 2, h: 1, v: 1, c: 6, s: 4, q: 4, t: 2, a: 7, z: 0 }
const COMMAND = /[\s,]*([MmLlHhVvCcSsQqTtAaZz])/y
const NUMBER = /[\s,]*([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/y
// Arc flags are one digit and need no separator: `A1 1 0 011 1` (SVG 2 path grammar).
const FLAG = /[\s,]*([01])/y

interface Token {
  letter: string
  args: number[]
}

function readValue(d: string, at: number, flag: boolean): [number, number] | null {
  const pattern = flag ? FLAG : NUMBER
  pattern.lastIndex = at
  const match = pattern.exec(d)
  return match ? [Number(match[1]), pattern.lastIndex] : null
}

function readGroup(d: string, at: number, letter: string): [number[], number] | null {
  const arc = letter === 'a' || letter === 'A'
  const args: number[] = []
  let cursor = at
  for (let i = 0; i < ARITY[letter.toLowerCase()]!; i++) {
    const value = readValue(d, cursor, arc && (i === 3 || i === 4))
    if (!value) {
      if (i === 0) return null
      throw new SyntaxError(`Malformed path data: "${letter}" is missing arguments at ${cursor}`)
    }
    args.push(value[0])
    cursor = value[1]
  }
  return [args, cursor]
}

function readCommand(d: string, at: number, letter: string, out: Token[]): number {
  if (ARITY[letter.toLowerCase()] === 0) {
    out.push({ letter, args: [] })
    return at
  }
  let cursor = at
  let repeat = letter
  for (let group = readGroup(d, cursor, letter); group; group = readGroup(d, cursor, repeat)) {
    out.push({ letter: repeat, args: group[0] })
    cursor = group[1]
    // Pairs after a moveto are implicit linetos.
    if (repeat === 'M') repeat = 'L'
    if (repeat === 'm') repeat = 'l'
  }
  if (cursor === at) throw new SyntaxError(`Malformed path data: "${letter}" has no arguments`)
  return cursor
}

function tokenize(d: string): Token[] {
  const tokens: Token[] = []
  let cursor = 0
  for (;;) {
    COMMAND.lastIndex = cursor
    const match = COMMAND.exec(d)
    if (!match) break
    cursor = readCommand(d, COMMAND.lastIndex, match[1]!, tokens)
  }
  if (!/^[\s,]*$/.test(d.slice(cursor))) {
    throw new SyntaxError(`Malformed path data at ${cursor}: "${d.slice(cursor, cursor + 12)}"`)
  }
  return tokens
}

interface Cursor {
  current: PathPoint
  start: PathPoint
  /** The last cubic's second control point, or the last quadratic's control point, for S and T. */
  control: PathPoint | null
  previous: string
}

function reflect(cursor: Cursor, kinds: string): PathPoint {
  const { current, control, previous } = cursor
  if (!control || !kinds.includes(previous)) return current
  return { x: 2 * current.x - control.x, y: 2 * current.y - control.y }
}

function curveCommand(
  upper: string,
  a: number[],
  at: (i: number) => PathPoint,
  cursor: Cursor
): PathCommand {
  if (upper === 'C' || upper === 'S') {
    const c1 = upper === 'C' ? at(0) : reflect(cursor, 'CS')
    const [c2, end] = upper === 'C' ? [at(2), at(4)] : [at(0), at(2)]
    cursor.control = c2
    return { type: 'C', x1: c1.x, y1: c1.y, x2: c2.x, y2: c2.y, x: end.x, y: end.y }
  }
  const c = upper === 'Q' ? at(0) : reflect(cursor, 'QT')
  const end = upper === 'Q' ? at(2) : at(0)
  cursor.control = c
  return { type: 'Q', x1: c.x, y1: c.y, x: end.x, y: end.y }
}

function absolute(token: Token, cursor: Cursor): PathCommand {
  const upper = token.letter.toUpperCase()
  const base = token.letter === upper ? { x: 0, y: 0 } : cursor.current
  const a = token.args
  const at = (i: number): PathPoint => ({ x: base.x + a[i]!, y: base.y + a[i + 1]! })
  const { current } = cursor
  switch (upper) {
    case 'M':
    case 'L':
      return { type: upper, ...at(0) }
    case 'H':
      return { type: 'L', x: base.x + a[0]!, y: current.y }
    case 'V':
      return { type: 'L', x: current.x, y: base.y + a[0]! }
    case 'A':
      return {
        type: 'A',
        rx: a[0]!,
        ry: a[1]!,
        rotation: a[2]!,
        largeArc: a[3] === 1,
        sweep: a[4] === 1,
        ...at(5),
      }
    case 'Z':
      return { type: 'Z' }
    default:
      return curveCommand(upper, a, at, cursor)
  }
}

function advance(command: PathCommand, cursor: Cursor, letter: string): void {
  if (command.type === 'Z') cursor.current = cursor.start
  else cursor.current = { x: command.x, y: command.y }
  if (command.type === 'M') cursor.start = cursor.current
  if (command.type !== 'C' && command.type !== 'Q') cursor.control = null
  cursor.previous = letter.toUpperCase()
}

/**
 * Parses SVG path data (the full grammar: relative forms, `H V S T`, arcs with compact flags) into absolute
 * `M L C Q A Z` commands. Throws `SyntaxError` on malformed data.
 */
export function parsePath(d: string): PathCommand[] {
  const cursor: Cursor = {
    current: { x: 0, y: 0 },
    start: { x: 0, y: 0 },
    control: null,
    previous: '',
  }
  return tokenize(d).map((token) => {
    const command = absolute(token, cursor)
    advance(command, cursor, token.letter)
    return command
  })
}

/**
 * Shape equivalence for SVG path data. Both paths are filled with the nonzero rule into a large
 * 1-bit raster: a pixel is in when its centre is inside, so there is no antialiasing and the same
 * input gives the same bits on every machine. The comparison is the intersection over union of
 * the two rasters plus the pixels only one of them covers.
 */

export type Point = readonly [number, number]
export type ViewBox = readonly [number, number, number, number]

/** Path data, or closed polygons already in view-box units. */
export type Shape = string | readonly (readonly Point[])[]

export interface Raster {
  size: number
  bits: Uint8Array
}

export interface Overlap {
  /** Intersection over union of the two fills: 1 is the same shape. */
  iou: number
  both: number
  onlyA: number
  onlyB: number
}

/** Curves are flattened into this many chords: on an icon curve at 2048 px that is under a tenth of a pixel off. */
const CURVE_CHORDS = 256
const ICON_VIEW_BOX: ViewBox = [0, 0, 24, 24]

/**
 * The bar for "the same mark", measured at 2048 px on the check mark at weights 2 and 3. Identical
 * paths give 1, and moving every node by a hundredth gives at least 0.9993. Moving one of its ~60
 * nodes a whole unit gives a median of 0.981 (weight 2) and 0.987 (weight 3), and pushing the apex out
 * gives 0.957. 0.99 fails the median one-unit nudge at both weights, where 0.985 lets weight 3 pass.
 */
export const SAME_SHAPE_MIN_IOU = 0.99

const TOKEN = /[MLHVQCZmlhvqcz]|-?(?:\d+\.?\d*|\.\d+)(?:e-?\d+)?/g

const quadAt = (a: Point, c: Point, b: Point, t: number): Point => {
  const u = 1 - t
  return [
    u * u * a[0] + 2 * u * t * c[0] + t * t * b[0],
    u * u * a[1] + 2 * u * t * c[1] + t * t * b[1],
  ]
}

const cubicAt = (a: Point, c1: Point, c2: Point, b: Point, t: number): Point => {
  const u = 1 - t
  const [w0, w1, w2, w3] = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
  return [
    w0 * a[0] + w1 * c1[0] + w2 * c2[0] + w3 * b[0],
    w0 * a[1] + w1 * c1[1] + w2 * c2[1] + w3 * b[1],
  ]
}

function chords(at: (t: number) => Point): Point[] {
  return Array.from({ length: CURVE_CHORDS }, (_, i) => at((i + 1) / CURVE_CHORDS))
}

/**
 * Flattens path data into closed polygons, one per subpath. Supports M L H V Q C Z, absolute and
 * relative, which is what titan's icons use.
 */
export function flattenPath(d: string): Point[][] {
  const tokens = d.match(TOKEN) ?? []
  const polygons: Point[][] = []
  let current: Point[] = []
  let pen: Point = [0, 0]
  let command = 'M'
  let i = 0
  const num = () => Number(tokens[i++])
  const pair = (relative: boolean): Point => {
    const [x, y] = [num(), num()]
    return relative ? [pen[0] + x, pen[1] + y] : [x, y]
  }
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) command = tokens[i++]
    const relative = command === command.toLowerCase()
    switch (command.toUpperCase()) {
      case 'M':
        if (current.length > 0) polygons.push(current)
        pen = pair(relative)
        current = [pen]
        command = relative ? 'l' : 'L'
        break
      case 'L':
        pen = pair(relative)
        current.push(pen)
        break
      case 'H':
        pen = [relative ? pen[0] + num() : num(), pen[1]]
        current.push(pen)
        break
      case 'V':
        pen = [pen[0], relative ? pen[1] + num() : num()]
        current.push(pen)
        break
      case 'Q': {
        const [from, control, to] = [pen, pair(relative), pair(relative)]
        current.push(...chords((t) => quadAt(from, control, to, t)))
        pen = to
        break
      }
      case 'C': {
        const [from, c1, c2, to] = [pen, pair(relative), pair(relative), pair(relative)]
        current.push(...chords((t) => cubicAt(from, c1, c2, to, t)))
        pen = to
        break
      }
      case 'Z':
        if (current.length > 0) polygons.push(current)
        pen = current[0] ?? pen
        current = []
        break
      default:
        throw new Error(`flattenPath: unsupported command ${command}`)
    }
  }
  if (current.length > 0) polygons.push(current)
  return polygons
}

/** For each pixel row, the x and winding of every edge crossing its centre line. */
function rowCrossings(polygons: readonly (readonly Point[])[], size: number, viewBox: ViewBox) {
  const [vx, vy, vw, vh] = viewBox
  const rows: number[][] = Array.from({ length: size }, () => [])
  for (const polygon of polygons) {
    polygon.forEach((p, k) => {
      const q = polygon[(k + 1) % polygon.length]
      const [x0, y0] = [((p[0] - vx) / vw) * size, ((p[1] - vy) / vh) * size]
      const [x1, y1] = [((q[0] - vx) / vw) * size, ((q[1] - vy) / vh) * size]
      if (y0 === y1) return
      const winding = y1 > y0 ? 1 : -1
      const first = Math.max(0, Math.ceil(Math.min(y0, y1) - 0.5))
      const last = Math.min(size - 1, Math.ceil(Math.max(y0, y1) - 0.5) - 1)
      for (let row = first; row <= last; row++) {
        const t = (row + 0.5 - y0) / (y1 - y0)
        rows[row].push(x0 + (x1 - x0) * t, winding)
      }
    })
  }
  return rows
}

/** Fills a shape (nonzero rule) into a `size`×`size` 1-bit raster of the view box. */
export function rasterize(shape: Shape, size: number, viewBox = ICON_VIEW_BOX): Raster {
  const polygons = typeof shape === 'string' ? flattenPath(shape) : shape
  const bits = new Uint8Array(size * size)
  rowCrossings(polygons, size, viewBox).forEach((flat, row) => {
    const crossings: [number, number][] = []
    for (let k = 0; k < flat.length; k += 2) crossings.push([flat[k], flat[k + 1]])
    crossings.sort((a, b) => a[0] - b[0])
    let winding = 0
    crossings.forEach(([x, w], k) => {
      winding += w
      if (winding === 0 || k + 1 >= crossings.length) return
      const from = Math.max(0, Math.ceil(x - 0.5))
      const to = Math.min(size, Math.ceil(crossings[k + 1][0] - 0.5))
      bits.fill(1, row * size + from, row * size + Math.max(from, to))
    })
  })
  return { size, bits }
}

export function overlapOf(a: Raster, b: Raster): Overlap {
  let [both, onlyA, onlyB] = [0, 0, 0]
  for (let k = 0; k < a.bits.length; k++) {
    if (a.bits[k] && b.bits[k]) both++
    else if (a.bits[k]) onlyA++
    else if (b.bits[k]) onlyB++
  }
  const union = both + onlyA + onlyB
  return { iou: union === 0 ? 1 : both / union, both, onlyA, onlyB }
}

/** Renders both shapes at `size` px over the same view box and measures their overlap. */
export function compareSvgPaths(a: Shape, b: Shape, size = 2048, viewBox = ICON_VIEW_BOX): Overlap {
  return overlapOf(rasterize(a, size, viewBox), rasterize(b, size, viewBox))
}

/** Every pair of non-adjacent edges of a closed polygon that cross, with where they cross. */
export function selfCrossings(polygon: readonly Point[]): { edges: [number, number]; at: Point }[] {
  const side = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const n = polygon.length
  const found: { edges: [number, number]; at: Point }[] = []
  for (let i = 0; i < n; i++) {
    for (let j = i + 2; j < n && !(i === 0 && j === n - 1); j++) {
      const [a, b, c, d] = [polygon[i], polygon[(i + 1) % n], polygon[j], polygon[(j + 1) % n]]
      const [s1, s2] = [side(c, d, a), side(c, d, b)]
      if (s1 * s2 >= 0 || side(a, b, c) * side(a, b, d) >= 0) continue
      const t = s1 / (s1 - s2)
      found.push({ edges: [i, j], at: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] })
    }
  }
  return found
}

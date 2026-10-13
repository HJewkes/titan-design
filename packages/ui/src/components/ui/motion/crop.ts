// Crop reveals as CSS strings; a pure function, so the component that uses it owns the platform guard.

/** The fraction of each edge to crop away, each in [0, 1]. Missing edges are 0. */
export interface CropEdges {
  /** Fraction of the height cropped from the top. */
  top?: number
  /** Fraction of the width cropped from the right. */
  right?: number
  /** Fraction of the height cropped from the bottom. */
  bottom?: number
  /** Fraction of the width cropped from the left. */
  left?: number
}

// Rounded to 1e-4 %, so 0.07 prints as 7% rather than 7.000000000000001%.
const percent = (fraction = 0) => `${Math.round(Math.min(1, Math.max(0, fraction)) * 1e6) / 1e4}%`

/** A CSS `clip-path: inset(...)` value cropping each edge by its fraction. Web only. */
export function cropInset({ top, right, bottom, left }: CropEdges = {}): string {
  return `inset(${percent(top)} ${percent(right)} ${percent(bottom)} ${percent(left)})`
}

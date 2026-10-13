import { useState, type SyntheticEvent } from 'react'
import {
  frameSizeMismatch,
  type FrameReference,
  type LadderRung,
} from '@titan-design/review-schema'
import { useFitScale } from './Frame.tsx'
import { SCALE_VIEWS, viewScale, type ScaleView } from './scale.ts'

const VIEW_LABELS: Record<ScaleView, string> = { fit: 'Fit', actual: '1:1' }

export function ViewToggle({
  view,
  onChange,
}: {
  view: ScaleView
  onChange: (v: ScaleView) => void
}) {
  return (
    <span className="scale-views" role="radiogroup" aria-label="Frame view">
      {SCALE_VIEWS.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={view === v}
          className="choice"
          onClick={() => onChange(v)}
        >
          {VIEW_LABELS[v]}
        </button>
      ))}
    </span>
  )
}

/** The factor a frame is drawn at: fitted to its card until the reviewer picks 1:1. */
export function useFrameView(width: number) {
  const { ref, scale: fit } = useFitScale(width)
  const [view, setView] = useState<ScaleView>('fit')
  return { ref, view, setView, scale: viewScale(view, fit) }
}

/** "1920×1080 · shown at 47%" or "1920×1080 · 1:1": the true size, then how it is drawn. */
export function trueSizeCaption(reference: FrameReference, scale: number): string {
  const { width, height } = reference.frame
  return `${width}×${height} · ${scale < 1 ? `shown at ${Math.round(scale * 100)}%` : '1:1'}`
}

/** The ladder drawn into a true-size frame's top-right corner: each bar its rung's px at `k`. */
export function LadderOverlay({ rungs, k }: { rungs: LadderRung[]; k: number }) {
  return (
    <ol className="frame-ladder" aria-label="Size ladder" data-testid="frame-ladder">
      {rungs.map((rung) => (
        <li key={rung.label}>
          <span className="frame-ladder-bar" data-px={rung.px} style={{ height: rung.px * k }} />
          <span className="frame-ladder-label">
            {rung.label}
            <br />
            {Number(rung.px.toFixed(1))}px
          </span>
        </li>
      ))}
    </ol>
  )
}

/** `base`, plus a true-size frame's class when the frame has a reference. */
export function trueSizeClass(base: string, extra: string | false | undefined): string {
  return extra ? `${base} ${extra}` : base
}

/** The `loadedmetadata` check of a clip's real size against its frame reference. */
export function clipSizeCheck(
  reference: FrameReference | undefined,
  report: (mismatch: string | null) => void
) {
  return (e: SyntheticEvent<HTMLVideoElement>) => {
    if (!reference) return
    const { videoWidth: width, videoHeight: height } = e.currentTarget
    report(frameSizeMismatch({ width, height }, reference.frame))
  }
}

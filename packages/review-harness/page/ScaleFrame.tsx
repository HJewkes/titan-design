import { useRef, useState, type MouseEvent } from 'react'
import type { Annotation, LadderRung, StoryVariant } from '@titan-design/review-schema'
import { storyUrl, withArg } from '../src/round.ts'
import {
  PinOverlay,
  pointerPin,
  sameOriginDocument,
  useFitScale,
  useFrameKeys,
  useNearViewport,
  type PinInput,
} from './Frame.tsx'
import {
  SCALE_VIEWS,
  largestTextPx,
  scaleColumns,
  sizeLabel,
  textRuns,
  viewScale,
  type ScaleView,
} from './scale.ts'
import { useLiveArgs, type LiveArgs } from './storyArgs.ts'

type Candidate = string | number | boolean
type ScaledVariant = StoryVariant & { scale: NonNullable<StoryVariant['scale']> }

interface ScaleFrameProps {
  variant: ScaledVariant
  annotate: boolean
  pins: Annotation[]
  onPin: (pin: PinInput) => void
  liveArgs?: LiveArgs
}

const VIEW_LABELS: Record<ScaleView, string> = { fit: 'Fit', actual: '1:1' }

function Ladder({
  rungs,
  width,
  frameHeight,
}: {
  rungs: LadderRung[]
  width: number
  frameHeight: number
}) {
  return (
    <div className="scale-ladder" style={{ width }} data-testid="scale-ladder">
      {rungs.map((rung) => (
        <div key={rung.label} className="scale-rung">
          <span className="scale-rung-sample" style={{ fontSize: rung.px }}>
            Ag 1080
          </span>
          <span className="scale-rung-label">
            {rung.label} {sizeLabel(rung.px, frameHeight)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface CellProps {
  variant: StoryVariant
  candidate: Candidate
  width: number
  height: number
  liveArgs?: LiveArgs
  onMeasure: (px: number | null) => void
}

/** One candidate: the story with the scale arg set, at full frame height, measured once loaded. */
function ScaleCell({ variant, candidate, width, height, liveArgs, onMeasure }: CellProps) {
  const iframe = useRef<HTMLIFrameElement>(null)
  const attachKeys = useFrameKeys()
  const sendArgs = useLiveArgs(iframe, variant.storyId, liveArgs)
  const arg = variant.scale!.arg
  const measure = () => onMeasure(largestTextPx(textRuns(sameOriginDocument(iframe.current))))
  return (
    <iframe
      ref={iframe}
      className="scale-cell"
      title={`${variant.key} at ${arg} ${String(candidate)}`}
      src={storyUrl('', withArg(variant, arg, candidate))}
      tabIndex={-1}
      style={{ width, height }}
      onLoad={(e) => {
        attachKeys(e.currentTarget)
        sendArgs(e.currentTarget)
        measure()
        sameOriginDocument(e.currentTarget)
          ?.fonts?.ready.then(measure)
          .catch(() => {})
      }}
    />
  )
}

function ViewToggle({ view, onChange }: { view: ScaleView; onChange: (v: ScaleView) => void }) {
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

/**
 * A size question's candidates side by side in one full-size frame, beside a ladder of text at
 * known sizes. Fit shows the whole frame; 1:1 shows it at its real pixels and scrolls.
 */
export function ScaleFrame({ variant, annotate, pins, onPin, liveArgs }: ScaleFrameProps) {
  const { frame, candidates, ladder, arg } = variant.scale
  const [view, setView] = useState<ScaleView>('fit')
  const [measured, setMeasured] = useState<Record<string, number | null>>({})
  const { ref, scale: fit } = useFitScale(frame.width)
  const { ref: lazyRef, near } = useNearViewport()
  const k = viewScale(view, fit)
  const columns = scaleColumns(variant.scale)
  const onOverlayClick = (e: MouseEvent<HTMLDivElement>) =>
    onPin(pointerPin(e, k, frame.width, frame.height))

  return (
    <figure className="frame scale-frame" ref={ref} data-testid={`scale-${variant.key}`}>
      <figcaption>
        {frame.width}×{frame.height} frame ·{' '}
        {k < 1 ? `shown at ${Math.round(k * 100)}%` : 'shown at 1:1'}{' '}
        <ViewToggle view={view} onChange={setView} />
      </figcaption>
      <ol className="scale-legend">
        {candidates.map((c) => {
          const px = measured[String(c)]
          return (
            <li key={String(c)} data-testid={`scale-legend-${String(c)}`}>
              <strong>
                {arg} = {String(c)}
              </strong>
              {px ? ` · largest text ${sizeLabel(px, frame.height)}` : ''}
            </li>
          )
        })}
        <li className="scale-legend-ladder">
          ladder: {ladder.map((r) => `${r.label} ${sizeLabel(r.px, frame.height)}`).join('; ')}
        </li>
      </ol>
      <div className={`scale-viewport ${view}`}>
        <div
          className="frame-box"
          ref={lazyRef}
          style={{ width: frame.width * k, height: frame.height * k }}
        >
          <div
            className="scale-canvas"
            style={{ width: frame.width, height: frame.height, transform: `scale(${k})` }}
          >
            <Ladder rungs={ladder} width={columns.ladder} frameHeight={frame.height} />
            {near &&
              candidates.map((c) => (
                <ScaleCell
                  key={String(c)}
                  variant={variant}
                  candidate={c}
                  width={columns.cell}
                  height={frame.height}
                  liveArgs={liveArgs}
                  onMeasure={(px) => setMeasured((m) => ({ ...m, [String(c)]: px }))}
                />
              ))}
          </div>
          <PinOverlay
            variantKey={variant.key}
            width={frame.width}
            scale={k}
            annotate={annotate}
            pins={pins}
            onClick={onOverlayClick}
          />
        </div>
      </div>
    </figure>
  )
}

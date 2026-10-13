import { useEffect, useRef, useState, type RefObject, type SyntheticEvent } from 'react'
import type { ClipMotion } from '@titan-design/review-schema'
import {
  clipDuration,
  clipReadout,
  currentKeyframe,
  keyframeTime,
  scrubTo,
  seekToKeyframe,
  setLoop,
  togglePlayback,
} from './clip.ts'
import { PlayerControls } from './MotionControls.tsx'

type VideoEvent = SyntheticEvent<HTMLVideoElement>

/** Spread on the video: the element is the clock, and these keep the controls in step. */
export interface ClipVideoProps {
  ref: RefObject<HTMLVideoElement>
  loop: boolean
  onPlay: () => void
  onPause: () => void
  onTimeUpdate: (e: VideoEvent) => void
  onLoadedMetadata: (e: VideoEvent) => void
}

export interface ClipPlayer {
  playing: boolean
  loop: boolean
  seconds: number
  duration: number
  /** Runs `act` on the video, when it is mounted; for event handlers only. */
  withMedia: (act: (media: HTMLVideoElement) => void) => void
  setLoop: (loop: boolean) => void
}

/** Follows a video element: play state from its events, the playhead on animation frames. */
export function useClipPlayer(motion: ClipMotion | undefined): [ClipVideoProps, ClipPlayer] {
  const ref = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)
  const [loop, setLoopState] = useState(motion?.loop ?? true)
  const [seconds, setSeconds] = useState(0)
  const [mediaDuration, setMediaDuration] = useState(Number.NaN)
  useEffect(() => {
    if (!playing) return
    let raf = requestAnimationFrame(function step() {
      if (ref.current) setSeconds(ref.current.currentTime)
      raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [playing])
  const videoProps: ClipVideoProps = {
    ref,
    loop,
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(false),
    onTimeUpdate: (e) => setSeconds(e.currentTarget.currentTime),
    onLoadedMetadata: (e) => setMediaDuration(e.currentTarget.duration),
  }
  const withMedia = (act: (media: HTMLVideoElement) => void) => {
    if (ref.current) act(ref.current)
  }
  const onLoop = (next: boolean) => {
    withMedia((media) => setLoop(media, next))
    setLoopState(next)
  }
  const duration = clipDuration(mediaDuration, motion)
  return [videoProps, { playing, loop, seconds, duration, withMedia, setLoop: onLoop }]
}

interface ClipControlsProps {
  variantKey: string
  motion: ClipMotion | undefined
  player: ClipPlayer
}

/** The arg player's controls with a loop toggle, then the clip's keyframes, each a seek. */
export function ClipControls({ variantKey, motion, player }: ClipControlsProps) {
  const { withMedia } = player
  const keyframes = motion?.keyframes ?? []
  const current = currentKeyframe(keyframes, player.seconds)
  return (
    <>
      <PlayerControls
        testId={`clip-${variantKey}`}
        variantKey={variantKey}
        playing={player.playing}
        onToggle={() => withMedia(togglePlayback)}
        position={player.duration > 0 ? player.seconds / player.duration : 0}
        onScrub={(position) => withMedia((m) => scrubTo(m, position, player.duration))}
        scrubLabel={`Scrub ${variantKey}`}
        readout={clipReadout(player.seconds, player.duration)}
      >
        <label className="motion-mode">
          <input
            type="checkbox"
            checked={player.loop}
            onChange={(e) => player.setLoop(e.target.checked)}
          />{' '}
          Loop
        </label>
      </PlayerControls>
      {keyframes.length > 0 && (
        <ol className="clip-keyframes" aria-label={`Keyframes of ${variantKey}`}>
          {keyframes.map((k, i) => (
            <li key={k.atMs}>
              <button
                type="button"
                className="clip-keyframe"
                aria-current={i === current ? 'step' : undefined}
                onClick={() => withMedia((m) => seekToKeyframe(m, k))}
              >
                <span className="clip-keyframe-time">{keyframeTime(k)}</span> {k.label}
              </button>
            </li>
          ))}
        </ol>
      )}
    </>
  )
}

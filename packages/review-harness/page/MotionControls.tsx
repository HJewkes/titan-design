import { useEffect, useMemo, useState } from 'react'
import type { ArgMotion } from '@titan-design/review-schema'
import { advance, argAt, initialPlayer, playheadLabel, seek, toggle } from './motion.ts'
import type { LiveArgs } from './storyArgs.ts'

/** Scrubber steps: fine enough that a 10s motion moves in 10ms steps. */
const SCRUB_STEPS = 1000

export interface MotionPlayer {
  playing: boolean
  position: number
  toggle: () => void
  seek: (position: number) => void
  /** The motion's arg at the playhead, for every frame of the variant. */
  args: LiveArgs | undefined
}

/** Plays an arg motion on animation frames; inert (no args) for a variant without one. */
export function useMotionPlayer(motion: ArgMotion | undefined): MotionPlayer {
  const [state, setState] = useState(() =>
    motion ? initialPlayer(motion) : { playing: false, position: 0 }
  )
  useEffect(() => {
    if (!motion || !state.playing) return
    let last = performance.now()
    let raf = requestAnimationFrame(function step(now) {
      setState((s) => advance(s, now - last, motion))
      last = now
      raf = requestAnimationFrame(step)
    })
    return () => cancelAnimationFrame(raf)
  }, [motion, state.playing])
  const value = motion ? argAt(motion, state.position) : undefined
  const args = useMemo(
    () => (motion && value !== undefined ? { [motion.arg]: value } : undefined),
    [motion, value]
  )
  return {
    ...state,
    toggle: () => setState(toggle),
    seek: (position) => setState((s) => seek(s, position)),
    args,
  }
}

interface MotionControlsProps {
  variantKey: string
  motion: ArgMotion
  player: MotionPlayer
}

/** Play/pause, a scrubber over the whole motion, and where the playhead is. */
export function MotionControls({ variantKey, motion, player }: MotionControlsProps) {
  return (
    <div className="motion-controls" data-testid={`motion-${variantKey}`}>
      <button
        type="button"
        className="motion-play"
        aria-label={player.playing ? `Pause ${variantKey}` : `Play ${variantKey}`}
        aria-pressed={player.playing}
        onClick={player.toggle}
      >
        {player.playing ? 'Pause' : 'Play'}
      </button>
      <input
        type="range"
        className="motion-scrub"
        aria-label={`Scrub ${variantKey} through ${motion.arg}`}
        min={0}
        max={SCRUB_STEPS}
        step={1}
        value={Math.round(player.position * SCRUB_STEPS)}
        onChange={(e) => player.seek(Number(e.target.value) / SCRUB_STEPS)}
      />
      <output className="motion-readout">{playheadLabel(motion, player.position)}</output>
      <span className="motion-mode">{motion.loop ? 'loops' : 'plays once'}</span>
    </div>
  )
}

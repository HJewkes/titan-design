import { useState, type RefObject } from 'react'
import { durationText } from './audio.ts'

interface AudioPlayerProps {
  src: string
  label: string
  testId: string
  durationMs?: number
  audioRef?: RefObject<HTMLAudioElement>
}

/** The browser's own player (play, pause, scrub), with a Loop toggle and the stated length. */
export function AudioPlayer({ src, label, testId, durationMs, audioRef }: AudioPlayerProps) {
  const [loop, setLoop] = useState(false)
  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={src}
        controls
        loop={loop}
        preload="metadata"
        aria-label={label}
        data-testid={testId}
      />
      <label className="audio-loop">
        <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} /> Loop
      </label>
      {durationMs !== undefined && (
        <span className="audio-duration">{durationText(durationMs)}</span>
      )}
    </div>
  )
}

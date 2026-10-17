import type { AudioVariant } from '@titan-design/review-schema'
import { audioUrl } from './audio.ts'
import { AudioPlayer } from './AudioPlayer.tsx'

/** A sound to listen to, once per card whatever the round's widths, with what it says under it. */
export function AudioFrame({ variant }: { variant: AudioVariant }) {
  return (
    <figure className="audio-frame">
      <AudioPlayer
        src={audioUrl(variant.key)}
        label={`${variant.key} · ${variant.label}`}
        testId={`audio-${variant.key}`}
        durationMs={variant.durationMs}
      />
      <figcaption className="transcript">{variant.transcript}</figcaption>
    </figure>
  )
}

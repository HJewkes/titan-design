import type { ClipMotion, Keyframe } from '@titan-design/review-schema'

/** The part of a video element the clip controls drive, so tests can stand in for one. */
export interface ClipMedia {
  currentTime: number
  duration: number
  paused: boolean
  loop: boolean
  play: () => Promise<void> | void
  pause: () => void
}

/** The file's own length once its metadata is in, else the round's stated one, in seconds. */
export function clipDuration(mediaDuration: number, motion: ClipMotion | undefined): number {
  if (Number.isFinite(mediaDuration) && mediaDuration > 0) return mediaDuration
  return (motion?.durationMs ?? 0) / 1000
}

/** Play from where it is (an ended clip restarts), or pause. A refused play stays paused. */
export function togglePlayback(media: ClipMedia): void {
  if (!media.paused) return media.pause()
  void Promise.resolve(media.play()).catch(() => {})
}

/** The scrubber pauses, so the frame under review holds still where it was dropped. */
export function scrubTo(media: ClipMedia, position: number, duration: number): void {
  media.pause()
  media.currentTime = Math.min(1, Math.max(0, position)) * duration
}

/** A keyframe pauses on its moment, so the reviewer sees the stage it names. */
export function seekToKeyframe(media: ClipMedia, keyframe: Keyframe): void {
  media.pause()
  media.currentTime = keyframe.atMs / 1000
}

export function setLoop(media: ClipMedia, loop: boolean): void {
  media.loop = loop
}

/** "0.00 / 4.00 s", what the clip controls read out. */
export function clipReadout(seconds: number, duration: number): string {
  return `${seconds.toFixed(2)} / ${duration.toFixed(2)} s`
}

/** "2.40 s", a keyframe's time chip. */
export function keyframeTime(keyframe: Keyframe): string {
  return `${(keyframe.atMs / 1000).toFixed(2)} s`
}

/** The stage the playhead is in: the last keyframe at or before it, or none before the first. */
export function currentKeyframe(keyframes: readonly Keyframe[], seconds: number): number {
  return keyframes.findLastIndex((k) => k.atMs <= Math.round(seconds * 1000))
}

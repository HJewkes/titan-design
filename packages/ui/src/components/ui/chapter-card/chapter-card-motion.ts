// The card's entrance and exit as a pure function of progress. Imports only the stateless
// motion functions: a ui/ component takes time as a prop and never reads a motion clock.
import { easeOut, poly } from '../motion/easing'
import { interpolate } from '../motion/interpolate'
import { motionPreset } from '../motion/presets'

const riseIn = motionPreset('riseIn', 'app')

/** Share of the card's life spent entering. */
export const CHAPTER_CARD_ENTER = 0.2
/** Share spent leaving: riseIn's exit ratio, 0.85 of the entrance (decision 308). */
export const CHAPTER_CARD_EXIT = CHAPTER_CARD_ENTER * (riseIn.exitRatio ?? 1)
/** How far the card travels while it enters and leaves, in px: riseIn's rise at the app tier. */
const TRAVEL_PX = riseIn.at(0).translateY

export interface ChapterCardFrame {
  opacity: number
  translateY: number
}

export const CHAPTER_CARD_REST: ChapterCardFrame = { opacity: 1, translateY: 0 }

/** The card at `progress` through its life: rises in, holds, then lifts out. */
export function chapterCardFrame(progress: number): ChapterCardFrame {
  const enter = interpolate(progress, [0, CHAPTER_CARD_ENTER], [0, 1], { ease: easeOut(poly(3)) })
  const exit = interpolate(progress, [1 - CHAPTER_CARD_EXIT, 1], [0, 1], { ease: poly(2) })
  return {
    opacity: enter * (1 - exit),
    translateY: (1 - enter) * TRAVEL_PX - exit * TRAVEL_PX,
  }
}

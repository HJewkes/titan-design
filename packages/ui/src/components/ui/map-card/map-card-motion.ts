// The card's entrance and exit as a pure function of the map state's `enter` and `exit`. The
// leader draws out from the anchor first, then the card fades in beside it; both fade out together.
import { interpolate } from '../motion/interpolate'
import { MOTION } from '../motion/tokens'

/** Share of `enter` over which the leader draws from the anchor to the card. */
const LEADER_DRAW_END = 0.5
/** Share of `enter` at which the card starts to fade in, while the leader is still drawing. */
const CARD_FADE_START = 0.3
/** How far the card slides in from its anchor's side, in px. */
const TRAVEL_PX = 8

export interface MapCardFrame {
  /** How much of the leader is drawn, 0..1 from the anchor. */
  leaderDraw: number
  leaderOpacity: number
  cardOpacity: number
  /** Toward the anchor while entering: multiply by -1 for a card on the right. */
  cardOffset: number
}

export const MAP_CARD_REST: MapCardFrame = {
  leaderDraw: 1,
  leaderOpacity: 1,
  cardOpacity: 1,
  cardOffset: 0,
}

/** The card at `enter` and `exit`, each 0..1. */
export function mapCardFrame(enter: number, exit: number): MapCardFrame {
  const cardIn = interpolate(enter, [CARD_FADE_START, 1], [0, 1], { ease: MOTION.ease.out })
  const out = 1 - interpolate(exit, [0, 1], [0, 1], { ease: MOTION.ease.in })
  return {
    leaderDraw: interpolate(enter, [0, LEADER_DRAW_END], [0, 1], { ease: MOTION.ease.out }),
    leaderOpacity: (enter > 0 ? 1 : 0) * out,
    cardOpacity: cardIn * out,
    cardOffset: (1 - cardIn) * TRAVEL_PX,
  }
}

/** Under reduced motion the card is either fully shown or gone; it never carries a fact by motion. */
export function mapCardStill(enter: number, exit: number): MapCardFrame {
  const shown = enter > 0 && exit < 1
  return shown ? MAP_CARD_REST : { ...MAP_CARD_REST, leaderOpacity: 0, cardOpacity: 0 }
}

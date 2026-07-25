/**
 * Shared fixtures and framing for the VelocityStrip story groups.
 *
 * The strip's stories are split by VIEW (compact / expanded / hero), and each
 * group walks the SAME scenario set against the SAME datasets. That only proves
 * anything if every group is genuinely showing the same data — so the datasets,
 * the single-above-dual pairing, and the set-type board all live here rather
 * than being re-typed per file.
 *
 * Dual is not a fourth view. It is the same strip when the exercise used two
 * Voltras, so every scenario renders single ABOVE dual on one dataset and the
 * pairing itself carries the point: dual = single + a lower half.
 *
 * Not a `.stories` file on purpose — it exports no stories, and keeping it out
 * of the story glob means the chrome below is held to the same token rules as
 * component code.
 */

import type { ReactNode } from 'react'
import type { Decorator } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { VelocityStrip, DualVelocityStrip, type VelocitySet } from './VelocityStrip'
import { surfaceRampDark } from '../../../theme/tokens/primitives'
import { getSemanticColors } from '../../../theme/tokens/semantic'

const t = getSemanticColors('dark')

/** The real dark surface-background plane — stories sit on the token, not an ad-hoc grey. */
export const SURFACE_BG = surfaceRampDark.background

export const VIEW_LABEL = t['text-secondary']
export const VIEW_NOTE = t['text-tertiary']
export const VIEW_HEADING = t['text-primary']

export const LEFT_SLOT = 'Left'
export const RIGHT_SLOT = 'Right'

// ── Datasets ────────────────────────────────────────────────────────────────
// One representative set reused across every view, so a drift in one view is
// visible as a mismatch against the others rather than hiding behind new data.

/** The representative set: a clean, mildly-declining working set. */
export const REP_SET = [0.95, 0.9, 0.86, 0.8, 0.72]
/** The lagging partner — 4 reps to REP_SET's 5, so the index-lock shows an empty. */
export const REP_SET_LAGGING = [0.9, 0.83, 0.75, 0.66]

/** A hard fatigue decline — the loss colouring and VL bands have something to say. */
export const FATIGUE_SET = [0.96, 0.91, 0.83, 0.72, 0.61, 0.5]
export const FATIGUE_SET_LAGGING = [0.94, 0.87, 0.76, 0.63, 0.48]

/** Mid-set, still going: 4 done of 8 planned, newest bar live. */
export const IN_PROGRESS_SET = [0.82, 0.79, 0.81, 0.76]
export const IN_PROGRESS_LAGGING = [0.8, 0.77, 0.75]

export const dualOf = (velocities: number[], label: string) => ({ velocities, label })

// ── Framing ─────────────────────────────────────────────────────────────────

export function ViewLabel({ text }: { text: string }) {
  return (
    <Text
      style={{
        color: VIEW_LABEL,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
      }}
    >
      {text}
    </Text>
  )
}

export function Note({ children }: { children: ReactNode }) {
  return <Text style={{ color: VIEW_NOTE, fontSize: 10, lineHeight: 15 }}>{children}</Text>
}

/** Page frame every scenario story sits in — one surface, one rhythm. */
export function Sheet({ children, width = 640 }: { children: ReactNode; width?: number }) {
  return (
    <View style={{ padding: 24, backgroundColor: SURFACE_BG, gap: 26, width }}>{children}</View>
  )
}

/**
 * Wall frame for hero stories. The eyebrow is ORGANISM chrome — the north-star
 * live page renders it, the primitive does not. It sits here only so the hero
 * is judged in the context it will live in.
 */
export const wallDecorator: Decorator = (Story) => (
  <View style={{ width: 620, padding: 28, backgroundColor: SURFACE_BG }}>
    <Text
      style={{
        color: VIEW_NOTE,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
      }}
    >
      CONCENTRIC VELOCITY · THIS SET · (organism chrome — not the component)
    </Text>
    <Story />
  </View>
)

// ── The single-above-dual pairing ───────────────────────────────────────────

/** Per-view heights. Dual expanded is taller because value-height genuinely needs 2×. */
export const VIEW_HEIGHT: Record<StripView, { single: number; dual: number }> = {
  compact: { single: 11.5, dual: 11.5 },
  expanded: { single: 60, dual: 64 },
  hero: { single: 180, dual: 200 },
}

export type StripView = 'compact' | 'expanded' | 'hero'

/** The dual renderer for a view. `expanded`'s dual is the lean `rail` (a verified misnomer). */
export const dualVariantFor = (view: StripView) => (view === 'expanded' ? 'rail' : view)

/**
 * One scenario, rendered single above dual on the same dataset.
 *
 * Takes either raw velocities or full `VelocitySet` descriptors, because the
 * set-type scenarios need the descriptor form and the rest do not.
 */
export function ScenarioPair({
  view,
  title,
  note,
  single,
  left,
  right,
  singleSet,
  leftSet,
  rightSet,
  scale = 'peak',
  width,
  ...rest
}: {
  view: StripView
  title: string
  note?: string
  single?: number[]
  left?: number[]
  right?: number[]
  singleSet?: VelocitySet
  leftSet?: VelocitySet
  rightSet?: VelocitySet
  scale?: 'peak' | 'fixed'
  /** Constrains the pair, for the width-degrade ladders. Unset = fill the sheet. */
  width?: number
  targetReps?: number
  liveRepIndex?: number
  barColor?: 'zone' | 'loss'
}) {
  const h = VIEW_HEIGHT[view]
  const heroProps = view === 'hero' ? { label: 'Set' } : {}
  const bareExpanded = view === 'expanded' ? { showNumbers: false, showInfo: false } : {}

  return (
    <View style={{ gap: 10, ...(width == null ? null : { width }) }}>
      <View style={{ gap: 3 }}>
        <ViewLabel text={title} />
        {note ? <Note>{note}</Note> : null}
      </View>

      <ViewLabel text="single" />
      <VelocityStrip
        {...(singleSet ? { set: singleSet } : { velocities: single ?? [] })}
        variant={view}
        height={h.single}
        scale={scale}
        {...heroProps}
        {...bareExpanded}
        {...rest}
      />

      <ViewLabel text="dual" />
      <DualVelocityStrip
        left={leftSet ? { set: leftSet, label: LEFT_SLOT } : dualOf(left ?? [], LEFT_SLOT)}
        right={rightSet ? { set: rightSet, label: RIGHT_SLOT } : dualOf(right ?? [], RIGHT_SLOT)}
        variant={dualVariantFor(view)}
        height={h.dual}
        scale={scale}
        {...rest}
      />
    </View>
  )
}

// ── Set-type board ──────────────────────────────────────────────────────────
// The full set-type vocabulary, one row per type, each paired single-above-dual.
// Generalised over `view` so compact / expanded / hero all walk the same board
// instead of the hero owning a private copy.

export type BoardRow = {
  type: string
  note: string
  single: VelocitySet
  left: VelocitySet
  right: VelocitySet
}

export const SET_TYPE_BOARD: BoardRow[] = [
  {
    type: 'straight',
    note: 'done reps + solid to-do remainder to the planned count',
    single: { type: 'straight', velocities: [0.9, 0.86, 0.82, 0.78], planned: 6 },
    left: { type: 'straight', velocities: [0.9, 0.86, 0.82, 0.78], planned: 6 },
    right: { type: 'straight', velocities: [0.84, 0.79], planned: 6 },
  },
  {
    type: 'range',
    note: 'committed rep bars + solid floor + the cyan variable window (floor..max)',
    single: { type: 'range', velocities: [0.9, 0.86, 0.82, 0.8], floor: 6, max: 8 },
    left: { type: 'range', velocities: [0.9, 0.86, 0.82, 0.8], floor: 6, max: 8 },
    right: { type: 'range', velocities: [0.83, 0.78], floor: 6, max: 8 },
  },
  {
    type: 'amrap',
    note: 'performed reps + the trailing cyan-outline "continue" window',
    single: { type: 'amrap', velocities: [0.9, 0.85, 0.8, 0.75] },
    left: { type: 'amrap', velocities: [0.9, 0.85, 0.8, 0.75] },
    right: { type: 'amrap', velocities: [0.82, 0.76] },
  },
  {
    type: 'drop',
    note: 'one bar per rep with WIDE chunk-notch gaps splitting each sub-load',
    single: {
      type: 'drop',
      subloads: [
        [0.95, 0.9],
        [0.82, 0.76],
        [0.7, 0.64],
      ],
    },
    left: {
      type: 'drop',
      subloads: [
        [0.95, 0.9],
        [0.82, 0.76],
        [0.7, 0.64],
      ],
    },
    right: { type: 'drop', subloads: [[0.88, 0.83], [0.75, 0.68], [0.62]] },
  },
]

export function SetTypeBoard({ view }: { view: StripView }) {
  const h = VIEW_HEIGHT[view]
  return (
    <View style={{ gap: 30 }}>
      {SET_TYPE_BOARD.map((row) => (
        <View key={row.type} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <Text
              style={{
                color: VIEW_HEADING,
                fontSize: 13,
                fontWeight: '800',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {row.type}
            </Text>
            <Note>{row.note}</Note>
          </View>

          <ViewLabel text="single" />
          <VelocityStrip
            variant={view}
            set={row.single}
            height={h.single}
            scale="fixed"
            {...(view === 'hero' ? { label: 'This Set' } : {})}
            {...(view === 'expanded' ? { showNumbers: false, showInfo: false } : {})}
          />

          <ViewLabel text="dual · symmetric structure, right logs fewer → aligned empties" />
          <DualVelocityStrip
            left={{ set: row.left, label: LEFT_SLOT }}
            right={{ set: row.right, label: RIGHT_SLOT }}
            variant={dualVariantFor(view)}
            height={h.dual}
            scale="fixed"
          />
        </View>
      ))}
    </View>
  )
}

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { greyRamp } from './tokens/primitives'
import { getSemanticColors } from './tokens/semantic'
import { getBaseSurfaceColor, getElevationSurface, type ElevationLevel } from './elevation'
import { grainForTone, paperSheet } from './materials'

/**
 * Foundations/Depth Calibration — the S-6 wall gate (VW-99).
 *
 * `Foundations/Depth` explains the depth model. This file MEASURES it, and the
 * two are deliberately shaped differently:
 *
 *   Depth              small labelled swatches, captions that give the answer
 *   Depth Calibration  full-bleed fields, no labels, decoys, a hidden key
 *
 * Every threshold in the depth model (TD-07.16) is desk-verified only. The
 * north-star doc set its floors explicitly "to survive glare + a mediocre
 * panel", and none of them have been looked at on the panel. That matters more
 * than the numbers suggest: solid dark borders were DELETED, so if the hairlines
 * wash out there is no fallback, and elevation levels 1-3 are separated by tone
 * alone now that shadow is gated behind FLOATING_ELEVATION_MIN.
 *
 * WHY FORCED-CHOICE. "Does this look OK?" is close to unfalsifiable at
 * threshold — you are asking someone to report the absence of a faint thing they
 * already know is supposed to be there. So each panel asks a question with a
 * checkable answer, hides the key behind a toggle, and seeds decoys (cells with
 * NO hairline, pairs that are genuinely identical). A run that "sees" a decoy is
 * a run whose PASSes mean nothing — re-run it at the real viewing distance.
 *
 * HOW TO RUN. On the wall panel, at demo brightness, at demo viewing distance
 * (~3 m), with the room lit the way it will be lit. Answer every panel BEFORE
 * touching Reveal. Record on the sheet:
 * `voltras-workspace/sources/runbooks/VW-99-depth-wall-calibration.md`
 */
const meta: Meta = {
  title: 'Foundations/Depth Calibration',
  parameters: {
    // Global preview layout is 'centered'; every panel here needs the full
    // panel width, because half the question is whether a thing survives at size.
    layout: 'fullscreen',
  },
}
export default meta

const t = getSemanticColors('dark')
const base = getBaseSurfaceColor('dark')

/**
 * The rig's ground sits BELOW the ramp, at true black.
 *
 * Not a style choice. `grey-975` is a plane the hairlines have to work on, and
 * if the page were also 975 those cells would be invisible against it — you
 * would be judging a line with no plane around it. Nothing in the product ships
 * on true black; this is a test surface, and it is deliberately off the ramp so
 * that every step OF the ramp is itself testable.
 */
const GROUND = '#000000'

// ── furniture ───────────────────────────────────────────────────────────────

/**
 * Panel chrome: the task prompt, and a Reveal toggle that is the only thing
 * standing between the operator and a primed judgement. Children receive
 * `revealed` so each panel decides what its key looks like.
 */
function Panel({
  title,
  task,
  children,
}: {
  title: string
  task: string
  children: (revealed: boolean) => React.ReactNode
}) {
  const [revealed, setRevealed] = useState(false)
  return (
    <View style={{ backgroundColor: GROUND, padding: 28, minHeight: '100vh' as never }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
          marginBottom: 18,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text className="text-text-primary" style={{ fontSize: 22, fontWeight: '700' }}>
            {title}
          </Text>
          <Text
            className="text-text-secondary"
            style={{ fontSize: 15, marginTop: 6, maxWidth: 900 }}
          >
            {task}
          </Text>
        </View>
        <Pressable
          onPress={() => setRevealed((r) => !r)}
          style={{
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: t['hairline-strong'],
            backgroundColor: getElevationSurface(base, 2, 'dark'),
          }}
        >
          <Text className="text-text-primary" style={{ fontSize: 14, fontWeight: '600' }}>
            {revealed ? 'Hide key' : 'Reveal key'}
          </Text>
        </Pressable>
      </View>
      {children(revealed)}
    </View>
  )
}

function KeyLine({ children }: { children: string }) {
  return (
    <Text className="text-text-secondary" style={{ fontSize: 13, marginTop: 10, lineHeight: 19 }}>
      {children}
    </Text>
  )
}

// ── C1 · hairlines ──────────────────────────────────────────────────────────

type HairlineToken = 'hairline-subtle' | 'hairline-default' | 'hairline-strong'
type HairlineCondition = HairlineToken | 'none'

/**
 * A fixed 4×4 assignment, not a random one — a story that shuffles on each
 * render cannot be re-run, screenshotted, or visually regression-tested. It is
 * unprimed because the KEY is hidden, not because the layout is unpredictable.
 *
 * Rows are the ground planes a hairline actually lands on in production. Each
 * row contains all four conditions in a different order, so no column is "the
 * blank column" and no row can be answered by pattern rather than by looking.
 */
const HAIRLINE_GROUNDS = [975, 950, 925, 900] as const
const HAIRLINE_GRID: HairlineCondition[][] = [
  ['hairline-default', 'none', 'hairline-strong', 'hairline-subtle'],
  ['hairline-subtle', 'hairline-strong', 'none', 'hairline-default'],
  ['none', 'hairline-default', 'hairline-subtle', 'hairline-strong'],
  ['hairline-strong', 'hairline-subtle', 'hairline-default', 'none'],
]
const CELL_LABELS = ['A', 'B', 'C', 'D']

export const Hairlines: StoryObj = {
  name: 'C1 · Hairlines — the only separator left',
  render: () => (
    <Panel
      title="C1 · Hairlines"
      task={
        'Each cell is one flat plane cut in half by a horizontal divider — or by nothing at all. ' +
        'Four of the sixteen have NO divider. Write down every cell where you can see a line, ' +
        'from the real viewing distance, without leaning in. Then reveal.'
      }
    >
      {(revealed) => (
        <View>
          {HAIRLINE_GRID.map((row, r) => (
            <View
              key={HAIRLINE_GROUNDS[r]}
              style={{ flexDirection: 'row', gap: 14, marginBottom: 22, alignItems: 'flex-start' }}
            >
              {/* Row gutter. Labels used to sit UNDER their tiles, which made every
                  row number ambiguous the moment one row was hard to see — the
                  first real-operator run misnumbered the whole grid because of it.
                  The label now leads its tile, and the row has a fixed marker. */}
              <View style={{ width: 30, paddingTop: 22 }}>
                <Text className="text-text-tertiary" style={{ fontSize: 15, fontWeight: '700' }}>
                  {r + 1}
                </Text>
              </View>
              {row.map((condition, cIdx) => {
                const ground = greyRamp[HAIRLINE_GROUNDS[r]]
                return (
                  <View key={cIdx} style={{ flex: 1 }}>
                    <Text
                      className="text-text-tertiary"
                      style={{ fontSize: 13, marginBottom: 5, fontWeight: '600' }}
                    >
                      {`${CELL_LABELS[cIdx]}${r + 1}`}
                      {revealed
                        ? condition === 'none'
                          ? '  ·  NONE (decoy)'
                          : `  ·  ${condition.replace('hairline-', '')} on grey-${HAIRLINE_GROUNDS[r]}`
                        : ''}
                    </Text>
                    <View style={{ height: 128, backgroundColor: ground, borderRadius: 6 }}>
                      <View style={{ flex: 1 }} />
                      <View
                        style={{
                          height: 1,
                          backgroundColor: condition === 'none' ? 'transparent' : t[condition],
                        }}
                      />
                      <View style={{ flex: 1 }} />
                    </View>
                  </View>
                )
              })}
            </View>
          ))}

          {revealed ? (
            <View style={{ marginTop: 6, maxWidth: 1000 }}>
              <KeyLine>
                {'Decoys: B1, C2, A3, D4. Reporting a line in any of those invalidates the run — ' +
                  'move back to the real distance and go again.'}
              </KeyLine>
              <KeyLine>
                {'PASS: every `default` and `strong` cell seen on every ground. `subtle` is allowed ' +
                  'to disappear on grey-975 — it is a whisper by design — but if `default` is ' +
                  'missing anywhere, that is the failure that has no fallback.'}
              </KeyLine>
              <KeyLine>
                {'Retune lever: raise the alphas in tokens/semantic.ts (`hairline-*`, currently ' +
                  '.06 / .09 / .14 white). Raise the whole family together — the ratio between the ' +
                  'three is what makes them read as one scale.'}
              </KeyLine>
            </View>
          ) : null}
        </View>
      )}
    </Panel>
  ),
}

// ── C2 · tone steps ─────────────────────────────────────────────────────────

const STAIRCASE: ElevationLevel[] = [0, 1, 2, 3, 4, 5]

/**
 * Adjacent-step pairs, with the lighter side pre-assigned to a fixed side and
 * one deliberately IDENTICAL pair seeded in. Without that decoy, "I can see a
 * difference" is a question nobody answers no to.
 */
const STEP_PAIRS: { left: ElevationLevel; right: ElevationLevel; label: string }[] = [
  { left: 1, right: 0, label: '1' },
  { left: 2, right: 3, label: '2' },
  { left: 2, right: 2, label: '3' },
  { left: 3, right: 4, label: '4' },
  { left: 1, right: 2, label: '5' },
  { left: 5, right: 4, label: '6' },
]

export const ToneSteps: StoryObj = {
  name: 'C2 · Tone steps — levels 1-3 have nothing else',
  render: () => (
    <Panel
      title="C2 · Tone steps"
      task={
        'TOP: one continuous field with no borders anywhere. Count the vertical edges you can see. ' +
        'BOTTOM: six split fields. For each, say LEFT lighter, RIGHT lighter, or SAME — one pair ' +
        'genuinely is the same. Answer both before revealing.'
      }
    >
      {(revealed) => (
        <View>
          <View style={{ flexDirection: 'row', height: 200, borderRadius: 6, overflow: 'hidden' }}>
            {STAIRCASE.map((lv) => (
              <View
                key={lv}
                style={{ flex: 1, backgroundColor: getElevationSurface(base, lv, 'dark') }}
              />
            ))}
          </View>
          <Text className="text-text-tertiary" style={{ fontSize: 13, marginTop: 8 }}>
            {revealed
              ? `6 bands / 5 edges — elevation 0…5, colorAdjustment 0 · .025 · .05 · .075 · .10 · .13`
              : 'Edges visible: ______'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 14, marginTop: 26 }}>
            {STEP_PAIRS.map((pair) => (
              <View key={pair.label} style={{ flex: 1 }}>
                <View
                  style={{ flexDirection: 'row', height: 150, borderRadius: 6, overflow: 'hidden' }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: getElevationSurface(base, pair.left, 'dark'),
                    }}
                  />
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: getElevationSurface(base, pair.right, 'dark'),
                    }}
                  />
                </View>
                <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 5 }}>
                  {pair.label}
                  {revealed
                    ? pair.left === pair.right
                      ? '  ·  SAME (decoy)'
                      : `  ·  ${pair.left > pair.right ? 'LEFT' : 'RIGHT'} (lv ${pair.left}|${pair.right})`
                    : ''}
                </Text>
              </View>
            ))}
          </View>

          {revealed ? (
            <View style={{ marginTop: 14, maxWidth: 1000 }}>
              <KeyLine>
                {'Pair 1 is the one that matters: it is the 0.025 step from level 0 to level 1, the ' +
                  'smallest in the ladder and the one carrying the most UI. Pair 3 is the decoy.'}
              </KeyLine>
              <KeyLine>
                {'PASS: all five edges counted on the staircase, pairs 1/2/4/5/6 called correctly, ' +
                  'pair 3 called SAME. Missing pair 1 means level 1 is not a level — it is level 0 ' +
                  'with extra bookkeeping, and no shadow is coming to save it below level 4.'}
              </KeyLine>
              <KeyLine>
                {'Retune lever: widen `colorAdjustment` on elevation levels 1-3 in elevation.ts. ' +
                  'Level 5 is the ceiling the ladder has to fit under, so widening the bottom ' +
                  'compresses the top — re-space the whole ladder rather than nudging one entry.'}
              </KeyLine>
            </View>
          ) : null}
        </View>
      )}
    </Panel>
  ),
}

// ── C3 · paper material ─────────────────────────────────────────────────────

const PAPER_TONE = greyRamp[875]

/**
 * REWRITTEN FOR RUN 2. Run 1 asked "is the tonal fill visible?" and the answer
 * was no, so the fill was deleted — which left this panel with nothing to
 * compare. The question that survives the deletion is broader and more useful:
 * with the fill gone, does what REMAINS of the paper material read at all?
 *
 * `paperSheet` is now grain + dither + a top rim-light + a contact shadow. If
 * that stack cannot be told from a flat `backgroundColor` at 3 m, it is three
 * paint layers buying nothing and it should follow the fill out.
 *
 * The forced choice is odd-one-out with a genuine identical pair, rather than
 * "can you see it" — the operator has to say WHICH and HOW, and "they are all
 * the same" is an available, unembarrassing answer. That matters here more than
 * on C1: grain lifts apparent lightness, so a two-way comparison can be won on
 * a brightness cue without the material ever reading as a material.
 */
const PAPER_SHEETS = ['flat', 'paper', 'flat'] as const

/**
 * ADDED IN RUN 2. `insetWell` is the other material TD-07.16 shipped, and it has
 * never been on a panel. Run 2 flagged `paperSheet`'s rim-light as weak at .10 —
 * and the well's floor light, which its own docstring calls "the load-bearing
 * half", is at .04. That is below every hairline value the same run rejected as
 * too faint, so it is very likely inert on the wall and nobody has looked.
 *
 * Forced choice rather than "can you see it": the SHIPPED value, a candidate,
 * and a well with no floor line at all. Reporting a line on the decoy invalidates
 * the row. Answering it here costs one glance and saves a whole extra sitting.
 */
const WELL_TONE = greyRamp[950]
const WELL_FLOORS: { label: string; floorAlpha: number | null; answer: string }[] = [
  { label: '1', floorAlpha: 0.12, answer: 'CANDIDATE — floor light raised to .12' },
  { label: '2', floorAlpha: null, answer: 'NONE (decoy) — inner top shadow only, no floor line' },
  { label: '3', floorAlpha: 0.04, answer: 'SHIPPED — floor light at .04' },
]

export const PaperMaterial: StoryObj = {
  name: 'C3 · Paper material — what is left after the fill',
  render: () => (
    <Panel
      title="C3 · Paper material"
      task={
        'TOP: three sheets on the same tone. Two are identical. Which one differs, and in what way ' +
        '— lighter, textured, edged? "All three the same" is a real answer. BOTTOM: the same ' +
        'material at hero size. Does it read as a sheet with light on it, as visible noise, or as ' +
        'nothing at all?'
      }
    >
      {(revealed) => (
        <View>
          <View style={{ flexDirection: 'row', gap: 22 }}>
            {PAPER_SHEETS.map((kind, i) => (
              <Card
                key={i}
                label={String(i + 1)}
                revealed={revealed}
                answer={
                  kind === 'paper'
                    ? 'paperSheet() — grain + dither + rim-light + contact shadow'
                    : 'FLAT (decoy) — backgroundColor alone'
                }
                style={
                  kind === 'paper'
                    ? { ...(paperSheet(PAPER_TONE) as Record<string, unknown>) }
                    : { backgroundColor: PAPER_TONE }
                }
              />
            ))}
          </View>

          <Text
            className="text-text-secondary"
            style={{ fontSize: 15, marginTop: 26, marginBottom: 10 }}
          >
            The same material, at hero size — lit sheet, visible noise, or nothing?
          </Text>
          <View
            style={{
              height: 260,
              borderRadius: 12,
              ...(paperSheet(PAPER_TONE) as Record<string, unknown>),
            }}
          />
          <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 8 }}>
            {revealed ? 'paperSheet() at hero width' : 'reads as: ______'}
          </Text>

          <Text
            className="text-text-secondary"
            style={{ fontSize: 15, marginTop: 26, marginBottom: 10 }}
          >
            Inset wells — which of these have a light line along the FLOOR (bottom inner edge)?
          </Text>
          <View style={{ flexDirection: 'row', gap: 22 }}>
            {WELL_FLOORS.map((w) => (
              <View key={w.label} style={{ flex: 1 }}>
                <View
                  style={
                    {
                      height: 120,
                      borderRadius: 10,
                      backgroundColor: WELL_TONE,
                      boxShadow: w.floorAlpha
                        ? `inset 0 2px 6px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,${w.floorAlpha})`
                        : 'inset 0 2px 6px rgba(0,0,0,0.55)',
                    } as Record<string, unknown>
                  }
                />
                <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 6 }}>
                  {w.label}
                  {revealed ? `  ·  ${w.answer}` : '  ·  floor line? ______'}
                </Text>
              </View>
            ))}
          </View>

          {revealed ? (
            <View style={{ marginTop: 14, maxWidth: 1000 }}>
              <KeyLine>
                {'Sheet 2 is the material; 1 and 3 are the identical decoy pair. PASS: 2 picked out, ' +
                  'AND the hero sheet described as a surface rather than as noise. Invisible and ' +
                  'obvious are both failures — the same two-sided bar the fill was held to.'}
              </KeyLine>
              <KeyLine>
                {'Levers. Reads as NOTHING: the honest move is to drop grain and the dither from ' +
                  'paperSheet and keep only the rim-light and contact shadow, which are edge cues ' +
                  'and sit at a spatial frequency the wall demonstrably resolves — that is the ' +
                  'lesson C2 taught and the fill failed. Reads as NOISE: lower the grain opacity in ' +
                  'grainForTone (materials.ts) before touching its frequency.'}
              </KeyLine>
              <KeyLine>
                {'If 1 and 3 were reported as different from each other, the run is invalid at this ' +
                  'distance — they are byte-identical. Step back to 3 m and go again.'}
              </KeyLine>
            </View>
          ) : null}
        </View>
      )}
    </Panel>
  ),
}

function Card({
  label,
  answer,
  revealed,
  style,
}: {
  label: string
  answer: string
  revealed: boolean
  style: Record<string, unknown>
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ height: 300, borderRadius: 12, ...style }} />
      <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 8, lineHeight: 17 }}>
        {label}
        {revealed ? `  ·  ${answer}` : ''}
      </Text>
    </View>
  )
}

// ── C4 · banding ────────────────────────────────────────────────────────────

const BAND_TONE = greyRamp[900]

/**
 * REWRITTEN FOR RUN 2, and this panel is why the rewrite could not be skipped.
 *
 * Run 1 compared dither-on against dither-off over the tonal fill. Neither field
 * banded — but the fill was already established as invisible, so there was no
 * gradient to band and the panel could not have failed. That is a VOID result,
 * not a pass, and it is the exact failure mode a calibration rig exists to catch
 * in itself.
 *
 * Two changes:
 *
 * 1. Both material fields are now the SHIPPED stack ± dither, derived from
 *    `paperSheet` rather than reassembled by hand, so they cannot drift from
 *    what actually ships.
 * 2. A POSITIVE CONTROL is seeded: a bare low-contrast vertical gradient with no
 *    dither and no grain, which on an 8-bit panel must band. If it does not, the
 *    panel cannot detect banding under these viewing conditions and the row is
 *    VOID AGAIN — now with evidence, instead of being mistaken for a pass.
 *
 * The control cannot be disguised as one of the material fields, and does not
 * need to be: it is not part of a forced choice. Which field it is stays hidden
 * with the rest of the key, so the operator still reports what they see rather
 * than what they expect.
 */
const SHIPPED_PAPER = paperSheet(BAND_TONE) as Record<string, unknown>

/**
 * ADDED IN RUN 2, and it is the whole reason this panel is worth re-running.
 *
 * Run 2 reported NO banding anywhere — including on the control that was
 * supposed to guarantee it. By the sheet that is another VOID, but "the control
 * did not fire" has two very different causes and they demand opposite actions:
 *
 *   a. the panel/viewing setup cannot resolve banding  -> VOID, fix the setup
 *   b. the render path genuinely does not band here    -> ditherTile is dead
 *      (10-bit panel, or the browser dithers gradients itself)
 *
 * A smooth control cannot tell those apart, because both produce "no steps".
 * So: the same tone span, quantised BY HAND into five hard-edged stripes. This
 * is banding, drawn deliberately. C2 already proved hard tone edges at this
 * spacing are visible on the wall, so if these stripes read and the smooth
 * gradient beside them does not, cause (b) is established — the pipeline is not
 * producing the artefact, and the mitigation for it is unearned.
 */
const BAND_STEPS = (() => {
  const from = [0x2c, 0x2a, 0x28] // grey-900
  const to = [0x31, 0x30, 0x2f] // grey-875
  return Array.from({ length: 5 }, (_, i) => {
    const t = i / 4
    const ch = from.map((f, k) => Math.round(f + (to[k] - f) * t))
    return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`
  })
})()

const BAND_FIELDS: { key: string; answer: string; style: Record<string, unknown> }[] = [
  {
    key: '1',
    answer: 'the SHIPPED stack — dither over grain',
    style: SHIPPED_PAPER,
  },
  {
    key: '2',
    answer: 'CONTROL — a bare grey-900 → grey-875 gradient, no dither, no grain',
    style: {
      backgroundColor: BAND_TONE,
      backgroundImage: `linear-gradient(180deg, ${greyRamp[900]} 0%, ${greyRamp[875]} 100%)`,
    },
  },
  {
    key: '2b',
    answer:
      'REFERENCE — hard-edged stripes, grey-900 → grey-875 in 5 steps. This is what banding LOOKS like.',
    style: {
      backgroundImage: `linear-gradient(180deg, ${BAND_STEPS.map(
        (hex, i) =>
          `${hex} ${(i / BAND_STEPS.length) * 100}%, ${hex} ${((i + 1) / BAND_STEPS.length) * 100}%`
      ).join(', ')})`,
    },
  },
  {
    key: '3',
    answer: 'the shipped stack MINUS the dither — grain alone',
    style: { ...SHIPPED_PAPER, backgroundImage: grainForTone(BAND_TONE) },
  },
]

export const Banding: StoryObj = {
  name: 'C4 · Banding — does the dither earn its place',
  render: () => (
    <Panel
      title="C4 · Banding"
      task={
        'Four wide fields. Look for horizontal STEPS — flat stripes with a visible edge between ' +
        'them, rather than a smooth fall. Say BANDS or SMOOTH for each. This is the one check that ' +
        'cannot be done anywhere but on the panel: banding is an 8-bit artefact of this display.'
      }
    >
      {(revealed) => (
        <View>
          {BAND_FIELDS.map((field) => (
            <View key={field.key}>
              <View
                style={
                  {
                    height: 240,
                    borderRadius: 8,
                    marginTop: field.key === '1' ? 0 : 20,
                    ...field.style,
                  } as Record<string, unknown>
                }
              />
              <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 6 }}>
                {`Field ${field.key}`}
                {revealed ? `  ·  ${field.answer}` : '  ·  bands? ______'}
              </Text>
            </View>
          ))}

          {revealed ? (
            <View style={{ marginTop: 14, maxWidth: 1000 }}>
              <KeyLine>
                {'READ FIELDS 2 AND 2b FIRST — they decide whether the rest of the panel means ' +
                  'anything. 2b is banding drawn by hand: the same tone span quantised into five ' +
                  'hard-edged 1-level steps, which is exactly what the artefact looks like when it ' +
                  'occurs. Sanity-check the setup (brightness, no browser zoom) before calling it.'}
              </KeyLine>
              <KeyLine>
                {'2b reads, 2 (smooth) does not -> this render path does not band: 10-bit panel, or ' +
                  'the browser dithers gradients itself. 2b ALSO invisible -> the artefact is below ' +
                  'threshold here at this tone span. Either way ditherTile buys nothing on this ' +
                  'display and comes out of paperSheet — a real result, not a null one. The one ' +
                  'caveat is that it is a claim about THIS panel; the same recipe on a phone is a ' +
                  'separate question, and paperSheet is hero-surface-only for that reason.'}
              </KeyLine>
              <KeyLine>
                {'If 2 DOES band: compare 1 (shipped) against 3 (no dither). 3 banding and 1 not is ' +
                  'the dither earning its place — keep it.'}
              </KeyLine>
              <KeyLine>
                {'If field 1 bands too, raise the 0.02α in ditherTile (materials.ts) until it stops; ' +
                  'past ~0.03 it stops being invisible and becomes texture, at which point it is ' +
                  'grain, not dither.'}
              </KeyLine>
            </View>
          ) : null}
        </View>
      )}
    </Panel>
  ),
}

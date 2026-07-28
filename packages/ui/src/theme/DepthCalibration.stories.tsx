import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text, Pressable } from 'react-native'
import { greyRamp } from './tokens/primitives'
import { getSemanticColors } from './tokens/semantic'
import { getBaseSurfaceColor, getElevationSurface, type ElevationLevel } from './elevation'
import { tonalFill, grainForTone, ditherTile, paperSheet } from './materials'

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
 * `voltras-workspace/coordination/validation-runbooks/VW-99-depth-wall-calibration.md`
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

// ── C3 · tonal fill ─────────────────────────────────────────────────────────

const PAPER_TONE = greyRamp[875]

export const TonalFill: StoryObj = {
  name: 'C3 · Tonal fill — ΔL* 3, just under seen-as-a-gradient',
  render: () => (
    <Panel
      title="C3 · Tonal fill"
      task={
        'TOP: two sheets on the same tone — one carries the fill, one is flat. Which is which, or ' +
        'are they identical? BOTTOM: the full shipped material. Does it read as a sheet with light ' +
        'falling on it, or as a decorative gradient? Invisible and obvious are both failures.'
      }
    >
      {(revealed) => (
        <View>
          {/*
           * The forced choice is fill-vs-flat ONLY, and both sheets are tone-matched.
           * An earlier version put paperSheet() in the same row — but grain raises
           * apparent lightness, so the full recipe was picked out instantly on a cue
           * that had nothing to do with the fill, and the question the panel exists
           * to ask never got asked. The recipe is now judged separately, on its own
           * question.
           */}
          <View style={{ flexDirection: 'row', gap: 22 }}>
            <Card
              label="1"
              revealed={revealed}
              answer="tonalFill — the shipped ΔL* 3 gradient, no grain, no dither"
              style={{ backgroundColor: PAPER_TONE, backgroundImage: tonalFill(PAPER_TONE) }}
            />
            <Card
              label="2"
              revealed={revealed}
              answer="FLAT — backgroundColor alone"
              style={{ backgroundColor: PAPER_TONE }}
            />
          </View>

          <Text
            className="text-text-secondary"
            style={{ fontSize: 15, marginTop: 26, marginBottom: 10 }}
          >
            The full material, at hero size — paper, or decorative gradient?
          </Text>
          <View
            style={{
              height: 260,
              borderRadius: 12,
              ...(paperSheet(PAPER_TONE) as Record<string, unknown>),
            }}
          />
          <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 8 }}>
            {revealed
              ? 'paperSheet() — fill + grain + dither + top rim-light + contact shadow'
              : 'reads as: ______'}
          </Text>

          {revealed ? (
            <View style={{ marginTop: 14, maxWidth: 1000 }}>
              <KeyLine>
                {'PASS: sheet 1 correctly called as the one with light on it, AND the hero sheet ' +
                  'not described as a gradient. If 1 and 2 are indistinguishable, ΔL* 3 is below ' +
                  'this panel and the fill is costing a paint for nothing.'}
              </KeyLine>
              <KeyLine>
                {'Retune lever: the ±1.5 L* shift in `tonalFill` (materials.ts). The exploration ' +
                  'rejected anything past ~4 total span as decorative, so ±2.0 is the ceiling — ' +
                  'past that, drop the fill rather than push it.'}
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

export const Banding: StoryObj = {
  name: 'C4 · Banding — does the dither earn its place',
  render: () => (
    <Panel
      title="C4 · Banding"
      task={
        'Two wide fields carrying the same gradient. Look for horizontal STEPS — flat stripes with ' +
        'a visible edge between them, rather than a smooth fall. Which field bands, if either? ' +
        'This is the one check that cannot be done anywhere but on the panel: banding is an 8-bit ' +
        'artefact of this display.'
      }
    >
      {(revealed) => (
        <View>
          {/*
           * BOTH fields carry grain; the ONLY difference is the dither layer.
           * Grain also breaks up banding, so a grain-vs-no-grain comparison would
           * confound which layer is doing the work — and grain is visible, which
           * would give the answer away on a cue that is not the one under test.
           */}
          <View
            style={
              {
                height: 260,
                borderRadius: 8,
                backgroundColor: BAND_TONE,
                backgroundImage: `${grainForTone(BAND_TONE)}, ${tonalFill(BAND_TONE)}`,
              } as Record<string, unknown>
            }
          />
          <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 6 }}>
            {revealed ? 'Field 1 · NO dither — grain over the fill' : 'Field 1 · steps? ______'}
          </Text>

          <View
            style={
              {
                height: 260,
                borderRadius: 8,
                marginTop: 20,
                backgroundColor: BAND_TONE,
                backgroundImage: `${ditherTile()}, ${grainForTone(BAND_TONE)}, ${tonalFill(BAND_TONE)}`,
              } as Record<string, unknown>
            }
          />
          <Text className="text-text-tertiary" style={{ fontSize: 12, marginTop: 6 }}>
            {revealed
              ? 'Field 2 · dither ADDED over the same grain + fill — the shipped stack'
              : 'Field 2 · steps? ______'}
          </Text>

          {revealed ? (
            <View style={{ marginTop: 14, maxWidth: 1000 }}>
              <KeyLine>
                {'PASS: field 2 does not band. Field 1 banding is FINE — it is the reason dither ' +
                  'exists, and it is the evidence the dither is doing work.'}
              </KeyLine>
              <KeyLine>
                {'If NEITHER bands, the dither is unearned on this panel and `ditherTile` can come ' +
                  'out of paperSheet — that is a real result, not a null one. If BOTH band, raise ' +
                  'the 0.02α in `ditherTile` (materials.ts) until it stops; past ~0.03 it stops ' +
                  'being invisible and becomes texture, at which point it is grain, not dither.'}
              </KeyLine>
            </View>
          ) : null}
        </View>
      )}
    </Panel>
  ),
}

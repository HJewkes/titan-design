import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { alpha } from '../utils/colors'
import { getSemanticColors } from './tokens/semantic'
import { greyRamp, primitiveColors, primitiveRamps } from './tokens/primitives'
import { SectionIntro, SectionTitle, SWATCH_BORDER } from './color-story-kit'
import { ToolbarButton } from '../components/ui/toolbar-button'
import { Treemap } from '../components/custom/Treemap'

const t = getSemanticColors('dark')

/**
 * Foundations/Color/Proposed VW-82 tokens — a DECISION story, not documentation.
 *
 * VW-82 (#200) migrated component source off raw colours. Every literal that had
 * an exact token was swapped; the ones with no token were deliberately left raw
 * and proposed rather than invented, because adding a token is a design call.
 * This story renders those candidates in the context they would actually ship
 * in, so the proposal can be accepted or rejected by eye instead of by hex.
 *
 * WHY THE SCRIMS ARE TOKENS AND NOT `bg-black/50`: Tailwind v3 cannot apply an
 * opacity modifier to a `var()` colour — it fails to parse the value and emits
 * NO rule at all. So a translucent role has to ship as its own rgba token, which
 * is exactly what `hairline-*` already does (`rgba(255, 255, 255, 0.15)`, not
 * `white/15`). The four scrims below are rendered through
 * `alpha(primitiveColors.black, …)`, which is the value each token would carry.
 *
 * The two candidates that have NO token and no primitive — `on-control-idle`
 * (#D1D1D1) and `on-data-strong` (#0B0B0B) — cannot be written as literals here:
 * `no-raw-color` allots this file zero, and funding a new allowance to document
 * a proposal would push the ratchet the wrong way. They are instead shown by
 * rendering the REAL components that carry them today, side by side with the
 * existing tokens that might replace them. That is stronger evidence anyway.
 */
const meta: Meta<ProposedTokensArgs> = {
  title: 'Foundations/Color/Proposed VW-82 tokens',
  tags: ['autodocs'],
  argTypes: {
    showScrims: {
      control: 'boolean',
      description: 'Lift all four scrims off the backdrop, to judge their impact.',
    },
    backdrop: {
      control: 'radio',
      options: ['pattern', 'gradient', 'surface'],
      description:
        'What the scrims sit on. `pattern` is the honest worst case — a scrim over a flat dark surface always looks fine.',
    },
  },
  args: { showScrims: true, backdrop: 'pattern' },
}

export default meta

interface ProposedTokensArgs {
  showScrims: boolean
  backdrop: 'pattern' | 'gradient' | 'surface'
}

// ---------------------------------------------------------------------------
// 1 — scrims
// ---------------------------------------------------------------------------

/**
 * The four candidates, as the value each token would carry. Derived through
 * `alpha()` from the black primitive rather than written as rgba triples, so
 * they track the primitive the way the real token would.
 */
const SCRIMS = [
  {
    name: 'scrim-press',
    opacity: 0.1,
    usedBy: 'Alert close button — web:hover',
  },
  {
    name: 'scrim-press-strong',
    opacity: 0.2,
    usedBy: 'Alert close button — active',
  },
  {
    name: 'scrim-subtle',
    opacity: 0.3,
    usedBy: 'Modal backdrop (blurred), Select filled fill',
  },
  {
    name: 'scrim-default',
    opacity: 0.5,
    usedBy: 'Modal backdrop, Drawer overlay',
  },
] as const

const CHECKER_LIGHT = greyRamp[50]
const CHECKER_DARK = greyRamp[950]
const CHECKER_STEP = 20
const PANEL_W = 196
const PANEL_H = 140

/**
 * A deliberately hostile backdrop. A scrim over a flat dark plane reads as
 * "fine" no matter what its opacity is; the only way to judge one is to put
 * something with real tonal range under it.
 */
function Checkerboard({ rows, columns }: { rows: number; columns: number }) {
  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
      {Array.from({ length: rows }, (_, row) => (
        <View key={row} style={{ flexDirection: 'row' }}>
          {Array.from({ length: columns }, (_, column) => (
            <View
              key={column}
              style={{
                width: CHECKER_STEP,
                height: CHECKER_STEP,
                backgroundColor: (row + column) % 2 === 0 ? CHECKER_LIGHT : CHECKER_DARK,
              }}
            />
          ))}
        </View>
      ))}
    </View>
  )
}

/** Stand-in for the photographic mid-tones a real app backdrop has. */
function GradientWash() {
  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        // react-native-web renders backgroundImage at runtime (see DeviationBar).
        backgroundImage: `linear-gradient(135deg, ${primitiveRamps.blue[300]} 0%, ${primitiveRamps.magenta[300]} 38%, ${primitiveRamps.amber[200]} 72%, ${greyRamp[950]} 100%)`,
      }}
    />
  )
}

/** Cards + copy on top of the backdrop, so the scrim has content to obscure. */
function BackdropContent() {
  return (
    <View style={{ flexDirection: 'row', gap: 6, padding: 10 }}>
      {[primitiveRamps.orange[400], primitiveRamps.green[300], primitiveRamps.blue[300]].map(
        (fill) => (
          <View
            key={fill}
            style={{
              width: 56,
              height: 48,
              borderRadius: 6,
              backgroundColor: fill,
              padding: 5,
            }}
          >
            <Text style={{ color: greyRamp[975], fontSize: 10, fontWeight: '700' }}>Card</Text>
          </View>
        )
      )}
    </View>
  )
}

function ScrimPanel({ showScrims, backdrop }: ProposedTokensArgs) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
      {SCRIMS.map((scrim) => (
        <View key={scrim.name} style={{ width: PANEL_W }}>
          <View
            style={{
              height: PANEL_H,
              borderRadius: 8,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: SWATCH_BORDER,
              backgroundColor: t['surface-base'],
            }}
          >
            {backdrop === 'pattern' && (
              <Checkerboard
                rows={Math.ceil(PANEL_H / CHECKER_STEP)}
                columns={Math.ceil(PANEL_W / CHECKER_STEP)}
              />
            )}
            {backdrop === 'gradient' && <GradientWash />}
            <BackdropContent />
            {showScrims && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  backgroundColor: alpha(primitiveColors.black, scrim.opacity),
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: primitiveColors.white, fontSize: 12, fontWeight: '700' }}>
                  {scrim.name}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-text-primary text-xs font-semibold mt-2">{scrim.name}</Text>
          <Text className="text-text-tertiary" style={{ fontSize: 10 }}>
            {alpha(primitiveColors.black, scrim.opacity)}
          </Text>
          <Text className="text-text-secondary" style={{ fontSize: 10, marginTop: 2 }}>
            {scrim.usedBy}
          </Text>
        </View>
      ))}
    </View>
  )
}

// ---------------------------------------------------------------------------
// 2 — on-control
// ---------------------------------------------------------------------------

const TOOLBAR_FACE = greyRamp[800]

/**
 * A toolbar-button face rendered with a chosen label colour, matching the real
 * `ToolbarButton` geometry so the comparison beside it is like-for-like.
 */
function LabelChip({ label, color, caption }: { label: string; color: string; caption: string }) {
  return (
    <View style={{ alignItems: 'center', width: 116 }}>
      <View
        style={{
          backgroundColor: TOOLBAR_FACE,
          borderRadius: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          minHeight: 30,
          justifyContent: 'center',
        }}
      >
        <Text style={{ color, fontSize: 14, fontWeight: '700' }}>{label}</Text>
      </View>
      <Text className="text-text-secondary" style={{ fontSize: 10, marginTop: 4 }}>
        {caption}
      </Text>
      <Text className="text-text-tertiary" style={{ fontSize: 9 }}>
        {color.toUpperCase()}
      </Text>
    </View>
  )
}

function OnControlPanel() {
  return (
    <View className="bg-surface-elevated" style={{ borderRadius: 8, padding: 16 }}>
      <Text className="text-text-secondary text-xs mb-3">
        Left pair: the LIVE ToolbarButton, which is what the proposal is about. Right: the existing
        tokens, drawn on the same face at the same size — does one of them already do the job?
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, alignItems: 'flex-start' }}>
        <View style={{ alignItems: 'center', width: 116 }}>
          <ToolbarButton label="Idle" isActive={false} variant="raised" />
          <Text className="text-text-secondary" style={{ fontSize: 10, marginTop: 4 }}>
            live · on-control-idle
          </Text>
          <Text className="text-text-tertiary" style={{ fontSize: 9 }}>
            #D1D1D1
          </Text>
        </View>
        <View style={{ alignItems: 'center', width: 116 }}>
          <ToolbarButton label="Active" isActive variant="raised" />
          <Text className="text-text-secondary" style={{ fontSize: 10, marginTop: 4 }}>
            live · on-control-active
          </Text>
          <Text className="text-text-tertiary" style={{ fontSize: 9 }}>
            #FFFFFF
          </Text>
        </View>
        <LabelChip label="Idle" color={greyRamp[200]} caption="greyRamp[200]" />
        <LabelChip label="Idle" color={t['text-secondary']} caption="text-secondary" />
        <LabelChip label="Idle" color={t['text-primary']} caption="text-primary" />
        <LabelChip label="Active" color={primitiveColors.white} caption="primitiveColors.white" />
      </View>
      <Text className="text-text-tertiary text-xs mt-3">
        `on-control-active` is exactly `primitiveColors.white`, so the only real question is whether
        it deserves a NAME — the toolbar face is a grey plane, not a brand fill, so borrowing
        `on-brand-primary` for it would be the wrong role at the right value.
      </Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// 3 — on-data-strong
// ---------------------------------------------------------------------------

const LIGHT_TILES = [
  { id: 'chest', value: 34, color: primitiveRamps.amber[200], label: 'Chest' },
  { id: 'back', value: 28, color: primitiveRamps.green[200], label: 'Back' },
  { id: 'quads', value: 21, color: primitiveRamps.blue[200], label: 'Quads' },
  { id: 'delts', value: 14, color: primitiveRamps.orange[200], label: 'Delts' },
  { id: 'arms', value: 9, color: primitiveRamps.magenta[200], label: 'Arms' },
]

function TileRow({ color, caption }: { color: string; caption: string }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {LIGHT_TILES.map((tile) => (
          <View
            key={tile.id}
            style={{
              width: 62,
              height: 44,
              borderRadius: 3,
              backgroundColor: tile.color,
              opacity: 0.9,
              padding: 4,
            }}
          >
            <Text style={{ color, fontSize: 10, fontWeight: '600' }}>{tile.label}</Text>
          </View>
        ))}
      </View>
      <Text className="text-text-secondary" style={{ fontSize: 10, marginTop: 4 }}>
        {caption} · {color.toUpperCase()}
      </Text>
    </View>
  )
}

function OnDataPanel() {
  return (
    <View className="bg-surface-elevated" style={{ borderRadius: 8, padding: 16 }}>
      <Text className="text-text-secondary text-xs mb-3">
        Top: the LIVE Treemap, whose label is the proposed `on-data-strong`. Below: the same tiles
        with the nearest existing dark tokens, so the difference (or lack of one) is visible at
        label size rather than as a swatch.
      </Text>
      <View style={{ gap: 12 }}>
        <View>
          <Treemap data={LIGHT_TILES} width={320} height={92} maxTiles={5} />
          <Text className="text-text-secondary" style={{ fontSize: 10, marginTop: 4 }}>
            live Treemap · on-data-strong · #0B0B0B
          </Text>
        </View>
        <TileRow color={t['background-frame']} caption="background-frame" />
        <TileRow color={greyRamp[950]} caption="greyRamp[950]" />
        <TileRow color={primitiveColors.black} caption="primitiveColors.black" />
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------

function ApprovedSnaps() {
  return (
    <View
      style={{
        backgroundColor: t['surface-raised'],
        borderRadius: 8,
        padding: 12,
        marginBottom: 20,
      }}
    >
      <Text className="text-text-primary text-sm font-semibold mb-1">
        Already approved — the six grey snaps (follow-up, NOT in #200)
      </Text>
      <Text className="text-text-secondary text-xs">
        These need no new token: they are drifted Tailwind and ad-hoc neutrals that snap onto the
        existing warm ramp. Approved for the follow-up PR because each one moves pixels.
        {'\n\n'}
        #6B7280 (Tailwind gray-500) → result-neutral, at IntensityBar, TempoDisplay, setHeadingKit,
        Spinner · #9CA3AF (Tailwind gray-400) → text-secondary, at TempoDisplay ×4 · #333333 →
        surface-raised · #2C2C2C → surface-elevated · #3A3A3A → surface-overlay · #0A0A0A →
        background-frame
      </Text>
    </View>
  )
}

type Story = StoryObj<ProposedTokensArgs>

export const Default: Story = {
  render: (args) => (
    <View style={{ padding: 24, maxWidth: 900 }}>
      <Text className="text-2xl font-bold text-text-primary mb-2">Proposed VW-82 tokens</Text>
      <SectionIntro>
        Seven candidates from #200, rendered where they would ship. Nothing here is in the token
        layer — `semantic.ts`, `primitives.ts`, `global.css` and `tailwind.config.js` are untouched
        until these are approved.
      </SectionIntro>

      <ApprovedSnaps />

      <SectionTitle>1 · Scrims (4 candidates)</SectionTitle>
      <Text className="text-text-secondary text-xs mb-3">
        Toggle `showScrims` off to see what each one is hiding, and switch `backdrop` between the
        checkerboard, a photographic gradient, and a plain surface. The plain surface is the case
        that flatters every opacity equally — judge on the other two.
      </Text>
      <ScrimPanel {...args} />

      <SectionTitle>2 · on-control (2 candidates)</SectionTitle>
      <OnControlPanel />

      <SectionTitle>3 · on-data-strong (1 candidate)</SectionTitle>
      <OnDataPanel />
    </View>
  ),
}

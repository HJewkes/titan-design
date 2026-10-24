// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
/**
 * `Foundations/Color/Silver-Red Scheme` — the single documented source for the fatigue
 * family's line/quality colour language. SILVER when the rep is right, SHADES OF RED when
 * something's wrong — no greens, no ambers (those belong to the verdict tones + velocity-
 * loss bands, not here). Every swatch reads its value straight from `fatigue-tokens`, so
 * this story can't drift from what the components actually render.
 */
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { primitiveColors, greyRamp } from '../../../theme/tokens/primitives'
import { alpha } from '../../../utils/colors'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { StorySpecimens } from '../../../lab/story-canvas'
import {
  SILVER,
  DRIFT_GREY,
  RED_LIGHT,
  RED_MID,
  RED_DEEP,
  PHASE_AXIS_COLOR,
  FONT_HEAD,
  FONT_UI,
  MONO_TEXT,
} from './fatigue-tokens'

// The swatches are judged on the dark wall plane they are drawn on, so their panel and its ink
// stay dark in both themes while the page around it follows the toolbar.
const PANEL_BG = greyRamp[950]
const t = getSemanticColors('dark')

const meta: Meta = {
  title: 'Foundations/Color/Silver-Red Scheme',
  tags: ['autodocs', 'status:candidate', '!status:review'],
  parameters: {
    canvas: 'page',
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The locked silver→red colour language for the live-fatigue family. SILVER = the ' +
          'rep is controlled (dimming toward DRIFT_GREY with tempo drift); SHADES OF RED = a ' +
          'collapse, by severity. Plus the phase-axis tones (eccentric magenta / concentric ' +
          'cyan / idle grey) that colour the ghost band. Used by RomProgressionChart, ' +
          'GhostSpark, and the dual ghost-line. All values sourced from `fatigue-tokens`.',
      },
    },
  },
}
export default meta
type Story = StoryObj

interface SwatchDef {
  name: string
  token: string
  value: string
  note?: string
}

function Swatch({ def }: { def: SwatchDef }) {
  return (
    <View style={{ width: 132, gap: 6 }}>
      <View
        style={{
          height: 72,
          borderRadius: 10,
          backgroundColor: def.value,
          borderWidth: 1,
          borderColor: alpha(primitiveColors.white, 0.08),
        }}
      />
      <View style={{ gap: 2 }}>
        <Text
          style={{
            fontSize: 12,
            fontWeight: '800',
            fontFamily: FONT_HEAD,
            color: t['text-primary'],
          }}
        >
          {def.name}
        </Text>
        <Text style={{ fontSize: 10, ...MONO_TEXT, color: t['text-tertiary'] }}>{def.token}</Text>
        <Text style={{ fontSize: 11, ...MONO_TEXT, color: t['text-secondary'] }}>
          {def.value.toUpperCase()}
        </Text>
        {!!def.note && (
          <Text
            style={{ fontSize: 10, fontFamily: FONT_UI, color: t['text-tertiary'], lineHeight: 13 }}
          >
            {def.note}
          </Text>
        )}
      </View>
    </View>
  )
}

function SwatchGroup({ label, defs }: { label: string; defs: SwatchDef[] }) {
  return (
    <View style={{ gap: 12 }}>
      <Text
        style={{
          fontSize: 9,
          letterSpacing: 1.4,
          ...MONO_TEXT,
          color: t['text-tertiary'],
        }}
      >
        {label}
      </Text>
      <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
        {defs.map((d) => (
          <Swatch key={d.token} def={d} />
        ))}
      </View>
    </View>
  )
}

const CONTROL: SwatchDef[] = [
  {
    // eslint-disable-next-line titan/no-raw-color -- 'Silver' is the token's display name, not a CSS colour
    name: 'Silver',
    token: 'SILVER · neutral[300]',
    value: SILVER,
    note: 'On-track / at-or-above working.',
  },
  {
    name: 'Drift grey',
    token: 'DRIFT_GREY · neutral[600]',
    value: DRIFT_GREY,
    note: 'The dim-silver grey the controlled line dims toward as tempo drifts — same neutral family as SILVER, never a colour.',
  },
]

const COLLAPSE: SwatchDef[] = [
  {
    name: 'Red light',
    token: 'RED_LIGHT · red[400]',
    value: RED_LIGHT,
    note: 'First flag — collapse just crossed the grind threshold.',
  },
  { name: 'Red mid', token: 'RED_MID · red[600]', value: RED_MID, note: 'Sustained collapse.' },
  {
    name: 'Red deep',
    token: 'RED_DEEP · red[800]',
    value: RED_DEEP,
    note: 'Full collapse — form breaking down.',
  },
]

const PHASE_AXIS: SwatchDef[] = [
  {
    name: 'Eccentric',
    token: 'PHASE_AXIS_COLOR.eccentric · magenta[800]',
    value: PHASE_AXIS_COLOR.eccentric,
  },
  {
    name: 'Concentric',
    token: 'PHASE_AXIS_COLOR.concentric · cyan[800]',
    value: PHASE_AXIS_COLOR.concentric,
  },
  {
    name: 'Idle',
    token: 'PHASE_AXIS_COLOR.idle · grey[300]',
    value: PHASE_AXIS_COLOR.idle,
    note: 'Pauses / holds on the phase band.',
  },
]

export const Palette: Story = {
  name: 'Silver-Red Palette',
  render: () => (
    <StorySpecimens>
      <View style={{ gap: 8, maxWidth: 720 }}>
        <Text
          className="text-text-secondary"
          style={{ fontSize: 9, letterSpacing: 1.4, ...MONO_TEXT }}
        >
          LIVE-FATIGUE · QUALITY COLOUR LANGUAGE
        </Text>
        <Text
          className="text-text-primary"
          style={{ fontSize: 24, fontWeight: '900', fontFamily: FONT_HEAD }}
        >
          Silver → Red
        </Text>
        <Text
          className="text-text-secondary"
          style={{ fontSize: 13, fontFamily: FONT_UI, lineHeight: 19 }}
        >
          One language for every quality readout in the family: SILVER when the rep is right
          (dimming toward DRIFT_GREY with tempo drift), SHADES OF RED when something&apos;s wrong —
          by severity. No greens, no ambers; those belong to the verdict tones and velocity-loss
          bands, not here. The phase-axis tones below colour the ghost band (they carry movement
          phase, not quality).
        </Text>
      </View>

      <View style={{ borderRadius: 14, padding: 24, backgroundColor: PANEL_BG }}>
        <StorySpecimens>
          <SwatchGroup label="CONTROLLED — SILVER" defs={CONTROL} />
          <SwatchGroup
            label="COLLAPSE — SHADES OF RED (light → deep by severity)"
            defs={COLLAPSE}
          />
          <SwatchGroup label="PHASE AXIS — ghost band tones" defs={PHASE_AXIS} />
        </StorySpecimens>
      </View>

      <Text
        className="text-text-secondary"
        style={{ fontSize: 11, fontFamily: FONT_UI, fontStyle: 'italic' }}
      >
        Used by: RomProgressionChart, GhostSpark, DualGhostLine (dual ghost-line). Source of truth:
        `fatigue-tokens.ts` (SILVER, DRIFT_GREY, RED_LIGHT/MID/DEEP, PHASE_AXIS_COLOR,
        `ghostLineColor`).
      </Text>
    </StorySpecimens>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { Text, View } from 'react-native'
import { simulateCvd, type CvdKind } from '../../theme/color-checks'
import { bestTextColor } from '../../theme/tokens/primitives'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import {
  CATEGORICAL_HUES,
  CATEGORICAL_PLANES,
  CATEGORICAL_SETS,
  planeColors,
  type CategoricalSet,
  type CategoricalSetId,
} from './categorical-revisit.candidates'
import { PLANE_FLOOR, measureSet, type CvdFigure, type SetMeasurement } from './categorical-revisit'

type SetFilter = 'all' | CategoricalSetId
type ModeFilter = 'both' | ThemeMode

interface Args {
  set: SetFilter
  mode: ModeFilter
}

/**
 * Each card paints its own mode from the semantic map, so both modes sit on one page whatever the
 * toolbar theme is. Not `vars()` over `theme/config`: that import leaves a static Storybook build
 * blank (the four older decision stories are on `contrast-blank-stories.json` for it).
 */
interface Ink {
  frame: string
  primary: string
  secondary: string
}

function modeInk(mode: ThemeMode): Ink {
  const colors = getSemanticColors(mode)
  return {
    frame: colors['background-base'],
    primary: colors['text-primary'],
    secondary: colors['text-secondary'],
  }
}

const CVD_ROWS: { kind: CvdKind; label: string }[] = [
  { kind: 'deutan', label: 'deuteranopia' },
  { kind: 'protan', label: 'protanopia' },
  { kind: 'tritan', label: 'tritanopia' },
]

const SURFACE_BASE = CATEGORICAL_PLANES.findIndex((plane) => plane.token === 'surface-base')

function Swatch({ fill, caption, ink }: { fill: string; caption: string; ink: Ink }) {
  return (
    <View className="w-16 items-center gap-0.5">
      <View
        className="h-8 w-14 items-center justify-center rounded-sm"
        style={{ backgroundColor: fill }}
      >
        <Text className="font-mono text-[9px]" style={{ color: bestTextColor(fill) }}>
          {fill.toUpperCase()}
        </Text>
      </View>
      <Text className="font-mono text-[10px]" style={{ color: ink.secondary }}>
        {caption}
      </Text>
    </View>
  )
}

interface StripProps {
  label: string
  plane: string
  ink: Ink
  children: ReactNode
}

function Strip({ label, plane, ink, children }: StripProps) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="w-40 font-mono text-[10px]" style={{ color: ink.secondary }}>
        {label}
      </Text>
      <View className="flex-row gap-1 rounded-md p-1.5" style={{ backgroundColor: plane }}>
        {children}
      </View>
    </View>
  )
}

interface RowsProps {
  set: CategoricalSet
  measured: SetMeasurement
  ink: Ink
}

function PlaneRows({ set, measured, ink }: RowsProps) {
  const planes = planeColors(set.mode)
  return CATEGORICAL_PLANES.map((plane, p) => (
    <Strip key={plane.token} label={`${plane.token} (${plane.role})`} plane={planes[p]} ink={ink}>
      {measured.slots.map((slot, i) => {
        const ratio = slot.planes[p]
        const mark = ratio < PLANE_FLOOR ? ' ✗' : ''
        return <Swatch key={i} fill={slot.hex} caption={`${ratio.toFixed(2)}${mark}`} ink={ink} />
      })}
    </Strip>
  ))
}

function ValueAndCvdRows({ set, measured, ink }: RowsProps) {
  const plane = planeColors(set.mode)[SURFACE_BASE]
  return (
    <>
      <Strip label="grey of value" plane={plane} ink={ink}>
        {measured.slots.map((slot, i) => (
          <Swatch key={i} fill={slot.grey} caption={`L ${slot.lightness.toFixed(2)}`} ink={ink} />
        ))}
      </Strip>
      {CVD_ROWS.map(({ kind, label }) => (
        <Strip key={kind} label={label} plane={plane} ink={ink}>
          {measured.slots.map((slot, i) => (
            <Swatch key={i} fill={simulateCvd(slot.hex, kind)} caption={`${i}`} ink={ink} />
          ))}
        </Strip>
      ))}
    </>
  )
}

function stepsLine(set: CategoricalSet): string {
  return CATEGORICAL_HUES.map((hue, slot) => `${hue}[${set.steps[slot]}]`).join(', ')
}

const cvd = ({ gate, plan }: CvdFigure) => `${gate.toFixed(1)} (plan ${plan.toFixed(1)})`

function numbersLine(m: SetMeasurement): string {
  const worst = Math.min(...m.slots.map((slot) => slot.worst))
  return [
    `all-pairs CVD ΔE 0-5 ${cvd(m.cvdSafe)}`,
    `with slot 6 ${cvd(m.cvdWithExtended)}`,
    `adjacent CVD ${cvd(m.cvdAdjacent)}`,
    `adjacent normal ΔE ${m.normalAdjacent.toFixed(1)}`,
    `tritan 0-5 ${cvd(m.tritanSafe)}`,
    `worst plane ${worst.toFixed(2)}`,
  ].join(' · ')
}

function SetCard({ set }: { set: CategoricalSet }) {
  const measured = measureSet(set)
  const ink = modeInk(set.mode)
  return (
    <View className="gap-2 rounded-md p-3" style={{ backgroundColor: ink.frame }}>
      <Text className="text-sm font-semibold" style={{ color: ink.primary }}>
        {`${set.id} (${set.mode})`}
      </Text>
      <Text className="text-xs" style={{ color: ink.secondary }}>
        {set.rationale}
      </Text>
      <Text className="font-mono text-[10px]" style={{ color: ink.secondary }}>
        {stepsLine(set)}
      </Text>
      <Text className="font-mono text-[11px]" style={{ color: ink.primary }}>
        {numbersLine(measured)}
      </Text>
      <PlaneRows set={set} measured={measured} ink={ink} />
      <ValueAndCvdRows set={set} measured={measured} ink={ink} />
    </View>
  )
}

function visibleSets({ set, mode }: Args): CategoricalSet[] {
  return CATEGORICAL_SETS.filter(
    (candidate) =>
      (set === 'all' || candidate.id === set) && (mode === 'both' || candidate.mode === mode)
  )
}

/**
 * TD-757 decision view for the TD-756 round: each categorical set as one unit, on the five
 * planes of its mode, then its grey-of-value row and its three dichromacy rows. Every number is
 * measured from the values in `categorical-revisit.candidates.ts`, so a changed step re-measures.
 */
const meta: Meta<Args> = {
  title: 'Lab/Decisions/Categorical Light vs Dark',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { set: 'all', mode: 'both' },
  argTypes: {
    set: { control: 'select', options: ['all', ...CATEGORICAL_SETS.map((s) => s.id)] },
    mode: { control: 'inline-radio', options: ['both', 'dark', 'light'] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-757, for TD-756 D1-D9). Plain swatches, no composed components. ' +
          'Contrast is WCAG 2.x against each plane (✗ under 3:1); CVD ΔE is OKLab ×100 after ' +
          'Machado-2009 simulation, worst of deutan and protan; tritan is printed, not gated. Each CVD ' +
          "figure is the CI gate's (`cvdDelta`, unclamped) with the TD-756 plan script's in brackets " +
          '(negative simulated channels zeroed). ' +
          '`set` picks one set, `mode` keeps the sets of one mode.',
      },
    },
  },
  render: function Render(args) {
    const sets = visibleSets(args)
    return (
      <View className="gap-4 p-2">
        {sets.length === 0 ? (
          <Text className="text-sm text-text-primary">{`${args.set} is not a ${args.mode} set.`}</Text>
        ) : (
          sets.map((set) => <SetCard key={set.id} set={set} />)
        )}
      </View>
    )
  },
}
export default meta
type Story = StoryObj<Args>

export const Default: Story = {}

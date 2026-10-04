import type { Meta, StoryObj } from '@storybook/react-vite'
import { vars } from 'nativewind'
import { Text, View } from 'react-native'
import { SurfaceContext } from '../../components/ui/surface/SurfaceContext'
import { greyRamp } from '../../theme/tokens/primitives'
import {
  LIFT_AMBIENT,
  LIFT_AMBIENT_ALPHA_SCALE,
  LIFT_RIM_ALPHA,
  liftShadow,
  type LiftStep,
} from '../../theme/lift-shadow'
import { measure, overrideProperties, resolveToken, type Pair } from './light-tuning'
import { rampName } from './light-tuning-changes'

/**
 * TD-625: light elevation shadows. Each recipe is a parameter set over the LIFT_AMBIENT
 * geometry in `theme/lift-shadow.ts`; the wrapper declares the resulting box-shadows as
 * `--lab-lift-{n}` properties and every card reads its level's property. No token changes.
 */
type RecipeKey = 'today' | 'soft' | 'crisp' | 'crispRim' | 'crispRimLow' | 'ambientKey'
type LadderKey = 'today' | 'ladderA' | 'ladderB'

interface ShadowRecipe {
  name: string
  alphaScale: number
  blurScale: number
  yScale: number
  /** White inset rim alpha (today's light placeholder is 0.9). */
  rim: number
  /** A 1px black ring that draws the edge without a border token. */
  ring: number
  /** Keep one LIFT_AMBIENT layer (by index, clamped to the step's layers) as the key light. */
  keyLayer?: number
  /** A zero-offset ambient layer whose blur grows with the step. */
  ambient?: { alpha: number; blurPerStep: number }
}

const RECIPES: Record<RecipeKey, ShadowRecipe> = {
  today: {
    name: "Today: liftShadow(step, 'light')",
    alphaScale: LIFT_AMBIENT_ALPHA_SCALE.light,
    blurScale: 1,
    yScale: 1,
    rim: LIFT_RIM_ALPHA.light,
    ring: 0,
  },
  soft: {
    name: 'Soft: wide and faint, no rim',
    alphaScale: 0.25,
    blurScale: 1.5,
    yScale: 1,
    rim: 0,
    ring: 0,
  },
  crisp: {
    name: 'Crisp: tight layers plus a 1px ring, no rim',
    alphaScale: 0.5,
    blurScale: 0.6,
    yScale: 0.6,
    rim: 0,
    ring: 0.08,
  },
  crispRim: {
    name: "Crisp + today's light rim (0.9)",
    alphaScale: 0.5,
    blurScale: 0.6,
    yScale: 0.6,
    rim: LIFT_RIM_ALPHA.light,
    ring: 0.08,
  },
  crispRimLow: {
    name: 'Crisp + a lower rim (0.5)',
    alphaScale: 0.5,
    blurScale: 0.6,
    yScale: 0.6,
    rim: 0.5,
    ring: 0.08,
  },
  // Round 2 keyed from the deepest layer (y 16-32, blur 32-64), which fell below the card and
  // read as no shadow; the second layer sits under the card at every step.
  ambientKey: {
    name: 'Ambient + key: the second layer as key over a zero-offset ambient, ring, rim 0.9',
    alphaScale: 0.5,
    blurScale: 1,
    yScale: 1,
    rim: LIFT_RIM_ALPHA.light,
    ring: 0.05,
    keyLayer: 1,
    ambient: { alpha: 0.08, blurPerStep: 3 },
  },
}

const STEPS: LiftStep[] = [1, 2, 3, 4, 5]

const LEVEL_NAME: Record<LiftStep, string> = {
  1: 'Card',
  2: 'Panel',
  3: 'Raised panel',
  4: 'Popover',
  5: 'Modal',
}

// The plane each level wears (theme/elevation-planes.ts: 1 elevated, 2 raised, 3-5 overlay).
const LEVEL_CLASS: Record<LiftStep, string> = {
  1: 'bg-surface-elevated',
  2: 'bg-surface-raised',
  3: 'bg-surface-overlay',
  4: 'bg-surface-overlay',
  5: 'bg-surface-overlay',
}

/**
 * Plane ladders: the surface tokens a level wears, overridden on the wrapper. The grey ramp has
 * only grey[50] and grey[100] above L* 90, so an off-white ladder has little room (TD-4).
 */
const LADDERS: Record<LadderKey, { name: string; planes: Record<string, string> }> = {
  today: { name: 'Planes today: 1 grey[50], 2 grey[100], 3-5 white', planes: {} },
  ladderA: {
    name: 'Ladder A: 1 grey[200], 2 grey[100], 3-5 grey[50]',
    planes: {
      'surface-elevated': greyRamp[200],
      'surface-raised': greyRamp[100],
      'surface-overlay': greyRamp[50],
    },
  },
  ladderB: {
    name: 'Ladder B: 1 grey[50], 2 grey[100], 3-5 grey[50]',
    planes: { 'surface-overlay': greyRamp[50] },
  },
}

const LEVEL_TOKEN: Record<LiftStep, string> = {
  1: 'surface-elevated',
  2: 'surface-raised',
  3: 'surface-overlay',
  4: 'surface-overlay',
  5: 'surface-overlay',
}

function planeHex(ladder: LadderKey, step: LiftStep): string {
  const token = LEVEL_TOKEN[step]
  return LADDERS[ladder].planes[token] ?? resolveToken('accepted', 'light', token)
}

/** The rim's contrast against the plane it lights: 1.00 means the highlight is invisible. */
function rimContrast(rim: number, plane: string): string {
  if (rim === 0) return 'no rim'
  const pair: Pair = {
    label: 'rim',
    fg: { raw: `rgba(255, 255, 255, ${rim})` },
    bg: { raw: plane },
    plane: 'surface-base',
    floor: 1,
  }
  return `rim ${measure(pair, 'accepted', 'light').value.toFixed(2)}`
}

/** A plane by its ramp step and hex; white is the one plane off the grey ramp. */
function planeName(hex: string): string {
  const name = rampName(hex)
  if (!name.startsWith('off-ramp')) return `${name} ${hex}`
  return hex.toUpperCase() === '#FFFFFF' ? `white ${hex}` : name
}

function ladderVars(ladder: LadderKey) {
  const entries = Object.entries(LADDERS[ladder].planes).map(([k, v]) => [`--color-${k}`, v])
  return vars(Object.fromEntries(entries))
}

const PLANES = [
  { token: 'background-base', className: 'bg-background-base' },
  { token: 'surface-base', className: 'bg-surface-base' },
] as const

function shadowFor(step: LiftStep, r: ShadowRecipe): string {
  const all = LIFT_AMBIENT[step]
  const source = r.keyLayer === undefined ? all : [all[Math.min(r.keyLayer, all.length - 1)]]
  const layers = source.map(
    ({ y, blur, alpha }) =>
      `0 ${Math.round(y * r.yScale)}px ${Math.round(blur * r.blurScale)}px rgba(0,0,0,${(alpha * r.alphaScale).toFixed(2)})`
  )
  if (r.ambient) {
    layers.unshift(`0 0 ${r.ambient.blurPerStep * step}px rgba(0,0,0,${r.ambient.alpha})`)
  }
  if (r.ring > 0) layers.unshift(`0 0 0 1px rgba(0,0,0,${r.ring})`)
  if (r.rim > 0) layers.unshift(`inset 0 1px 0 rgba(255,255,255,${r.rim.toFixed(2)})`)
  return layers.join(', ')
}

function shadowVars(r: ShadowRecipe) {
  return vars(Object.fromEntries(STEPS.map((s) => [`--lab-lift-${s}`, shadowFor(s, r)])))
}

/** Today's recipe must reproduce the theme's own light lift exactly, or the baseline lies. */
function todayMatchesTheme(): boolean {
  return STEPS.every((s) => shadowFor(s, RECIPES.today) === liftShadow(s, 'light'))
}

function recipeSummary(r: ShadowRecipe): string {
  const parts = [
    `alpha ×${r.alphaScale}`,
    `blur ×${r.blurScale}`,
    `y ×${r.yScale}`,
    `rim ${r.rim}`,
    `ring ${r.ring}`,
    r.keyLayer === undefined ? 'all LIFT_AMBIENT layers' : `key = layer ${r.keyLayer} only`,
  ]
  if (r.ambient) parts.push(`ambient 0 0 ${r.ambient.blurPerStep}px×step @ ${r.ambient.alpha}`)
  return parts.join(' · ')
}

function LevelCard({ step, ladder, rim }: { step: LiftStep; ladder: LadderKey; rim: number }) {
  const hex = planeHex(ladder, step)
  return (
    <View
      className={`h-24 min-w-[150px] flex-1 justify-between rounded-lg p-inset-sm ${LEVEL_CLASS[step]}`}
      style={{ boxShadow: `var(--lab-lift-${step})` } as object}
    >
      <Text className="text-sm font-semibold text-text-primary">{LEVEL_NAME[step]}</Text>
      <Text className="font-mono text-[10px] text-text-secondary">
        {`level ${step} · ${planeName(hex)} · ${rimContrast(rim, hex)}`}
      </Text>
    </View>
  )
}

interface RowProps {
  plane: (typeof PLANES)[number]
  ladder: LadderKey
  rim: number
}

function PlaneRow({ plane, ladder, rim }: RowProps) {
  return (
    <View className={`gap-stack-sm rounded-lg p-gutter-sm ${plane.className}`}>
      <Text className="font-mono text-xs text-text-secondary">{`on ${plane.token}`}</Text>
      <View className="flex-row flex-wrap gap-6 pb-6 pt-2">
        {STEPS.map((step) => (
          <LevelCard key={step} step={step} ladder={ladder} rim={rim} />
        ))}
      </View>
    </View>
  )
}

interface Args {
  recipe: RecipeKey
  ladder: LadderKey
}

function ShadowPanel({ recipe, ladder }: Args) {
  const r = RECIPES[recipe]
  const check = recipe === 'today' ? ` · matches liftShadow: ${todayMatchesTheme()}` : ''
  return (
    <SurfaceContext.Provider value={{ mode: 'light', level: 'base' }}>
      <View
        style={[vars(overrideProperties('accepted', 'light')), ladderVars(ladder), shadowVars(r)]}
        className="gap-stack-md bg-background-base p-gutter-sm"
        testID="light-elevation-panel"
      >
        <Text className="text-sm font-semibold text-text-primary">{`${r.name} · ${LADDERS[ladder].name}`}</Text>
        <Text className="font-mono text-xs text-text-secondary">{`${recipeSummary(r)}${check}`}</Text>
        {PLANES.map((plane) => (
          <PlaneRow key={plane.token} plane={plane} ladder={ladder} rim={r.rim} />
        ))}
      </View>
    </SurfaceContext.Provider>
  )
}

const meta: Meta<Args> = {
  title: 'Lab/Decisions/Light Elevation Shadows',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { recipe: 'today', ladder: 'today' },
  argTypes: {
    recipe: {
      control: 'inline-radio',
      options: ['today', 'soft', 'crisp', 'crispRim', 'crispRimLow', 'ambientKey'],
    },
    ladder: { control: 'inline-radio', options: ['today', 'ladderA', 'ladderB'] },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (TD-625). Elevation levels 1-5 (card, panel, raised panel, popover, ' +
          'modal) on background-base and surface-base under the accepted light tokens. Each ' +
          '`recipe` is a parameter set over the LIFT_AMBIENT geometry in theme/lift-shadow.ts.',
      },
    },
  },
  render: (args) => <ShadowPanel {...args} />,
}
export default meta
type Story = StoryObj<Args>

export const Levels: Story = { globals: { theme: 'light' } }

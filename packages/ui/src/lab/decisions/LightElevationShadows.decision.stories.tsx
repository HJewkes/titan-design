import type { Meta, StoryObj } from '@storybook/react-vite'
import { vars } from 'nativewind'
import { Text, View } from 'react-native'
import { SurfaceContext } from '../../components/ui/surface/SurfaceContext'
import {
  LIFT_AMBIENT,
  LIFT_AMBIENT_ALPHA_SCALE,
  LIFT_RIM_ALPHA,
  liftShadow,
  type LiftStep,
} from '../../theme/lift-shadow'
import { overrideProperties } from './light-tuning'

/**
 * TD-625: light elevation shadows. Each recipe is a parameter set over the LIFT_AMBIENT
 * geometry in `theme/lift-shadow.ts`; the wrapper declares the resulting box-shadows as
 * `--lab-lift-{n}` properties and every card reads its level's property. No token changes.
 */
type RecipeKey = 'today' | 'soft' | 'crisp' | 'ambientKey'

interface ShadowRecipe {
  name: string
  alphaScale: number
  blurScale: number
  yScale: number
  /** White inset rim alpha (today's light placeholder is 0.9). */
  rim: number
  /** A 1px black ring that draws the edge without a border token. */
  ring: number
  /** Keep only the deepest LIFT_AMBIENT layer as the key light. */
  keyOnly: boolean
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
    keyOnly: false,
  },
  soft: {
    name: 'Soft: wide and faint, no rim',
    alphaScale: 0.25,
    blurScale: 1.5,
    yScale: 1,
    rim: 0,
    ring: 0,
    keyOnly: false,
  },
  crisp: {
    name: 'Crisp: tight layers plus a 1px ring, no rim',
    alphaScale: 0.5,
    blurScale: 0.6,
    yScale: 0.6,
    rim: 0,
    ring: 0.08,
    keyOnly: false,
  },
  ambientKey: {
    name: 'Ambient + key: one key layer over a zero-offset ambient, faint ring',
    alphaScale: 0.35,
    blurScale: 1,
    yScale: 1,
    rim: 0,
    ring: 0.05,
    keyOnly: true,
    ambient: { alpha: 0.06, blurPerStep: 4 },
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

const PLANES = [
  { token: 'background-base', className: 'bg-background-base' },
  { token: 'surface-base', className: 'bg-surface-base' },
] as const

function shadowFor(step: LiftStep, r: ShadowRecipe): string {
  const all = LIFT_AMBIENT[step]
  const source = r.keyOnly ? all.slice(-1) : all
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
    r.keyOnly ? 'key = deepest layer only' : 'all LIFT_AMBIENT layers',
  ]
  if (r.ambient) parts.push(`ambient 0 0 ${r.ambient.blurPerStep}px×step @ ${r.ambient.alpha}`)
  return parts.join(' · ')
}

function LevelCard({ step }: { step: LiftStep }) {
  return (
    <View
      className={`h-24 min-w-[150px] flex-1 justify-between rounded-lg p-inset-sm ${LEVEL_CLASS[step]}`}
      style={{ boxShadow: `var(--lab-lift-${step})` } as object}
    >
      <Text className="text-sm font-semibold text-text-primary">{LEVEL_NAME[step]}</Text>
      <Text className="font-mono text-[10px] text-text-secondary">{`level ${step}`}</Text>
    </View>
  )
}

function PlaneRow({ plane }: { plane: (typeof PLANES)[number] }) {
  return (
    <View className={`gap-stack-sm rounded-lg p-gutter-sm ${plane.className}`}>
      <Text className="font-mono text-xs text-text-secondary">{`on ${plane.token}`}</Text>
      <View className="flex-row flex-wrap gap-6 py-2">
        {STEPS.map((step) => (
          <LevelCard key={step} step={step} />
        ))}
      </View>
    </View>
  )
}

interface Args {
  recipe: RecipeKey
}

function ShadowPanel({ recipe }: Args) {
  const r = RECIPES[recipe]
  const check = recipe === 'today' ? ` · matches liftShadow: ${todayMatchesTheme()}` : ''
  return (
    <SurfaceContext.Provider value={{ mode: 'light', level: 'base' }}>
      <View
        style={[vars(overrideProperties('accepted', 'light')), shadowVars(r)]}
        className="gap-stack-md bg-background-base p-gutter-sm"
        testID="light-elevation-panel"
      >
        <Text className="text-sm font-semibold text-text-primary">{r.name}</Text>
        <Text className="font-mono text-xs text-text-secondary">{`${recipeSummary(r)}${check}`}</Text>
        {PLANES.map((plane) => (
          <PlaneRow key={plane.token} plane={plane} />
        ))}
      </View>
    </SurfaceContext.Provider>
  )
}

const meta: Meta<Args> = {
  title: 'Lab/Decisions/Light Elevation Shadows',
  tags: ['autodocs', 'status:lab', '!status:review'],
  args: { recipe: 'today' },
  argTypes: {
    recipe: { control: 'inline-radio', options: ['today', 'soft', 'crisp', 'ambientKey'] },
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

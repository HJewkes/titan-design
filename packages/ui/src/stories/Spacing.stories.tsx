import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { View, Text } from 'react-native'
import { primitiveSpacing, primitiveSizing } from '../theme/tokens/primitives'
import { space } from '../theme/tokens/semantic'
import { SectionIntro, SectionTitle } from '../theme/color-story-kit'
import { Card } from '../components/ui/card'
import { Pill } from '../components/ui/pill'
import { Badge } from '../components/ui/badge'
import { Chip } from '../components/ui/chip'
import { Button, ButtonText } from '../components/ui/button'
import { DumbbellIcon } from '../components/icons'

/**
 * Foundations/Spacing — the 4px numeric scale, the semantic keys that sit on it,
 * and the sizing floor.
 *
 * Spacing is theme-independent: one `:root` declaration serves both modes, so
 * every specimen here renders identically under the light toggle. What changes
 * with the theme is the surface a specimen sits on, which is the point — the
 * proximity rules below have to hold on either plane.
 *
 * Values are emitted in **px, not rem**. NativeWind resolves `rem` at a 14px
 * base while browsers use 16, so a rem-valued scale renders every step at 14/16
 * size on a device. See AW-142.
 */
const meta: Meta = {
  title: 'Foundations/Spacing',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

// Storybook's preview body is a centred flex row, so a section of fixed-width
// specimens shrink-wraps and a section of stretching ones fills the viewport.
// One explicit canvas width frames all eight identically.
const CANVAS_WIDTH = 980

function Page({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <View className="gap-stack-xl p-inset-xl" style={{ width: CANVAS_WIDTH }}>
      <Text className="text-2xl font-bold text-text-primary">{title}</Text>
      <SectionIntro>{intro}</SectionIntro>
      {children}
    </View>
  )
}

/** A filled bar exactly `px` wide — the measurement made visible. */
function Bar({ px, height = 12 }: { px: number; height?: number }) {
  return <View className="bg-brand-primary rounded-sm" style={{ width: px, height }} />
}

function Mono({ children }: { children: ReactNode }) {
  return <Text className="font-mono text-2xs text-text-tertiary">{children}</Text>
}

function Label({ children }: { children: ReactNode }) {
  return <Text className="text-sm font-semibold text-text-primary">{children}</Text>
}

/** One documented row: name, measurement, and the thing itself. */
function SpecRow({ name, note, children }: { name: string; note: string; children: ReactNode }) {
  return (
    <View className="flex-row items-center gap-inline-lg py-inset-xs">
      <View style={{ width: 132 }}>
        <Label>{name}</Label>
        <Mono>{note}</Mono>
      </View>
      <View className="flex-1">{children}</View>
    </View>
  )
}

// ---------------------------------------------------------------- 1. the scale

// Sorted by measurement, not by key: `0.5` and `px` are string keys, so a plain
// object always enumerates them after the integer-like steps.
const steps = Object.entries(primitiveSpacing).sort((a, b) => parseFloat(a[1]) - parseFloat(b[1]))

export const Scale: Story = {
  name: '1. The numeric scale',
  render: () => (
    <Page
      title="The 4px scale"
      intro="theme.spacing, set from primitiveSpacing. Every step Tailwind ships is kept, because p-, m-, gap-, w-, h-, size-, inset- and translate- all read this one namespace and the codebase uses steps up to 96 for sizing. Narrowing the vocabulary is the semantic layer's job, not the primitive's."
    >
      <View className="gap-stack-sm">
        <View className="flex-row gap-inline-lg">
          <Text className="text-xs font-semibold text-text-secondary" style={{ width: 56 }}>
            step
          </Text>
          <Text className="text-xs font-semibold text-text-secondary" style={{ width: 56 }}>
            px
          </Text>
          <Text className="text-xs font-semibold text-text-secondary" style={{ width: 56 }}>
            rem
          </Text>
        </View>
        {steps.map(([step, value]) => {
          const px = parseFloat(value)
          return (
            <View key={step} className="flex-row items-center gap-inline-lg">
              <View style={{ width: 56 }}>
                <Mono>{step}</Mono>
              </View>
              <View style={{ width: 56 }}>
                <Mono>{value}</Mono>
              </View>
              <View style={{ width: 56 }}>
                <Mono>{px === 0 ? '0' : `${px / 16}rem`}</Mono>
              </View>
              <Bar px={px} height={10} />
            </View>
          )
        })}
      </View>
      <Text className="text-text-secondary text-sm">
        The rem column is for orientation only — it is not what ships. A rem scale renders 14/16
        size under NativeWind, so the config emits px.
      </Text>
    </Page>
  ),
}

// ------------------------------------------------------- 2. the semantic keys

export const SemanticKeys: Story = {
  name: '2. Semantic keys',
  render: () => (
    <Page
      title="Semantic keys"
      intro="A thin situational layer over the numeric scale. Every value is a cluster the audit measured in the shipped components, so adopting a key changes no pixels. Pick by the SITUATION, not by the number: a component's own padding is control / inset / squish, page rhythm is section / gutter, gaps between siblings are stack / inline."
    >
      <SectionTitle>inset — padding inside a surface, card or panel</SectionTitle>
      <SpecRow name="p-inset-xs … xl" note="4 · 8 · 12 · 16 · 24">
        <View className="flex-row items-start gap-inline-lg">
          <View className="bg-surface-raised rounded-md p-inset-xs">
            <View className="bg-brand-primary rounded-sm" style={{ width: 40, height: 24 }} />
          </View>
          <View className="bg-surface-raised rounded-md p-inset-md">
            <View className="bg-brand-primary rounded-sm" style={{ width: 40, height: 24 }} />
          </View>
          <View className="bg-surface-raised rounded-md p-inset-xl">
            <View className="bg-brand-primary rounded-sm" style={{ width: 40, height: 24 }} />
          </View>
        </View>
      </SpecRow>

      <SectionTitle>squish — a pill-shaped atom</SectionTitle>
      <SpecRow name="px-squish-x-* py-squish-y-*" note="x 4/8/12/16 · y 1/2/4/6">
        <View className="flex-row items-center gap-inline-lg">
          <View className="bg-brand-primary-subtle rounded-full px-squish-x-xs py-squish-y-xs">
            <Text className="text-3xs text-text-primary">xs</Text>
          </View>
          <View className="bg-brand-primary-subtle rounded-full px-squish-x-sm py-squish-y-sm">
            <Text className="text-2xs text-text-primary">sm</Text>
          </View>
          <View className="bg-brand-primary-subtle rounded-full px-squish-x-md py-squish-y-md">
            <Text className="text-xs text-text-primary">md</Text>
          </View>
          <View className="bg-brand-primary-subtle rounded-full px-squish-x-lg py-squish-y-lg">
            <Text className="text-sm text-text-primary">lg</Text>
          </View>
        </View>
      </SpecRow>

      <SectionTitle>stack — vertical gap between siblings in one group</SectionTitle>
      <SpecRow name="gap-stack-sm … xl" note="4 · 8 · 16 · 24 (2x per level)">
        <View className="flex-row items-start gap-inline-lg">
          <View className="gap-stack-sm">
            <Bar px={64} />
            <Bar px={64} />
            <Bar px={64} />
          </View>
          <View className="gap-stack-lg">
            <Bar px={64} />
            <Bar px={64} />
            <Bar px={64} />
          </View>
          <View className="gap-stack-xl">
            <Bar px={64} />
            <Bar px={64} />
            <Bar px={64} />
          </View>
        </View>
      </SpecRow>

      <SectionTitle>inline — horizontal gap between items on one line</SectionTitle>
      <SpecRow name="gap-inline-sm … lg" note="4 · 8 · 12">
        <View className="gap-stack-sm">
          <View className="flex-row gap-inline-sm">
            <Bar px={32} />
            <Bar px={32} />
            <Bar px={32} />
          </View>
          <View className="flex-row gap-inline-lg">
            <Bar px={32} />
            <Bar px={32} />
            <Bar px={32} />
          </View>
        </View>
      </SpecRow>

      <SectionTitle>control — a control&apos;s own inset and height</SectionTitle>
      <SpecRow
        name="px-control-x-* py-control-y-* min-h-control-*"
        note="x 16/20/24 · y 6/8/10 · h 32/40/48"
      >
        <View className="flex-row items-center gap-inline-lg">
          <Button size="sm">
            <ButtonText>Small</ButtonText>
          </Button>
          <Button size="md">
            <ButtonText>Medium</ButtonText>
          </Button>
          <Button size="lg">
            <ButtonText>Large</ButtonText>
          </Button>
        </View>
      </SpecRow>

      <SectionTitle>section — gap between unrelated blocks</SectionTitle>
      <SpecRow name="py-section-sm … lg" note="24 · 32 · 48">
        <View className="bg-surface-raised rounded-md py-section-sm">
          <Bar px={120} height={16} />
        </View>
      </SpecRow>

      <SectionTitle>gutter — padding from the container edge</SectionTitle>
      <SpecRow name="px-gutter-sm · md" note="16 · 24">
        <View className="bg-surface-raised rounded-md px-gutter-md py-inset-sm">
          <Bar px={140} height={16} />
        </View>
      </SpecRow>

      <Text className="text-text-secondary text-sm">
        `squish` and `control` carry an explicit axis because `px-` and `py-` share one Tailwind
        namespace — a single `squish-md` key could not hold {space.squish.x.md} across and{' '}
        {space.squish.y.md} down.
      </Text>
    </Page>
  ),
}

// ------------------------------------------------------------- 3. the ratios

/** One group: a card whose padding AND inner gap are both the `inside` value. */
function RatioCard({ inside }: { inside: string }) {
  return (
    <View className={`bg-surface-raised rounded-md ${inside}`}>
      <Bar px={120} height={14} />
      <Bar px={90} height={14} />
      <Bar px={104} height={14} />
    </View>
  )
}

/**
 * A ratio needs two groups to be a ratio. One card can only show its own
 * padding; the second card is what turns "between" into something on screen.
 */
function RatioColumn({ inside, label }: { inside: string; label: string }) {
  return (
    <View style={{ width: 190 }} className="gap-stack-md">
      <Label>{label}</Label>
      <View className="gap-stack-lg">
        <RatioCard inside={inside} />
        <RatioCard inside={inside} />
      </View>
    </View>
  )
}

export const Ratios: Story = {
  name: '3. Inside versus between',
  render: () => (
    <Page
      title="Inside versus between"
      intro="Proximity is a RATIO, not a number. Items read as one group when the space inside the group is smaller than the space between it and the next one. Each column holds TWO identical cards a fixed 16px apart, and the columns differ only in what happens inside a card: padding and inner gap at 8, then 16, then 24. Read down a column, not across."
    >
      <View className="flex-row gap-inline-lg items-start">
        <RatioColumn label="inside 8 / between 16" inside="p-inset-sm gap-stack-md" />
        <RatioColumn label="inside 16 / between 16" inside="p-inset-lg gap-stack-lg" />
        <RatioColumn label="inside 24 / between 16" inside="p-inset-xl gap-stack-xl" />
      </View>
      <Text className="text-text-secondary text-sm">
        Left: inside is half of between, so each card reads as one thing and the two read as two.
        Middle: inside equals between, so the eye gets no signal and six bars read as six. Right:
        inside exceeds between, so the grouping inverts — bars pair ACROSS the gap rather than
        within a card. Only the ratio changed.
      </Text>
    </Page>
  ),
}

// --------------------------------------------------------- 4. the pill ramps

const RAMP = ['sm', 'md', 'lg'] as const
const PILL_RAMP = ['xs', 'sm', 'md', 'lg'] as const

/**
 * The three atoms as they shipped BEFORE wave two — the classes are literals on
 * purpose. The live components have moved, so the disagreement only stays
 * visible if this half is frozen.
 */
const RAMPS_BEFORE = [
  {
    atom: 'Pill',
    was: 'px-1/2/2.5/3/4, py-px/0.5/1/1.5/2 · five rungs',
    rungs: [
      { label: 'xs', shape: 'rounded-full px-1 py-px', text: 'text-3xs' },
      { label: 'sm', shape: 'rounded-full px-2 py-0.5', text: 'text-2xs' },
      { label: 'md', shape: 'rounded-full px-2.5 py-1', text: 'text-xs' },
      { label: 'lg', shape: 'rounded-full px-3 py-1.5', text: 'text-sm' },
      { label: 'xl', shape: 'rounded-full px-4 py-2', text: 'text-base' },
    ],
  },
  {
    atom: 'Badge',
    was: 'px-1.5/2/2.5, py-0.5/0.5/1',
    rungs: [
      { label: 'sm', shape: 'rounded-full px-1.5 py-0.5', text: 'text-xs' },
      { label: 'md', shape: 'rounded-full px-2 py-0.5', text: 'text-xs' },
      { label: 'lg', shape: 'rounded-full px-2.5 py-1', text: 'text-sm' },
    ],
  },
  {
    atom: 'Chip',
    was: 'px-2/3/4, py-0.5/1/1.5 — already the ramp, at every rung',
    rungs: [
      { label: 'sm', shape: 'rounded px-2 py-0.5', text: 'text-xs' },
      { label: 'md', shape: 'rounded-md px-3 py-1', text: 'text-sm' },
      { label: 'lg', shape: 'rounded-md px-4 py-1.5', text: 'text-base' },
    ],
  },
]

function FrozenRamp({ rungs }: { rungs: { label: string; shape: string; text: string }[] }) {
  return (
    <View className="flex-row items-center gap-inline-lg">
      {rungs.map((r) => (
        <View key={r.label} className={`bg-hairline-subtle self-start ${r.shape}`}>
          <Text className={`font-heading font-semibold text-text-secondary ${r.text}`}>
            {r.label}
          </Text>
        </View>
      ))}
    </View>
  )
}

export const PillRamps: Story = {
  name: '4. Three ramps for one shape',
  render: () => (
    <Page
      title="Three ramps for one shape"
      intro="Pill, Badge and Chip are the same pill-shaped atom, and each shipped its own padding ramp. The top half is frozen at what each one measured before wave two; the bottom half is the live components on the shared squish ramp. Chip already sat on the ramp at every rung, which is how the ramp's values were chosen."
    >
      {RAMPS_BEFORE.map((r) => (
        <View key={r.atom} className="gap-stack-md">
          <SectionTitle>{`Before — ${r.atom}: ${r.was}`}</SectionTitle>
          <FrozenRamp rungs={r.rungs} />
        </View>
      ))}

      <SectionTitle>After — one squish ramp: 4/1, 8/2, 12/4, 16/6</SectionTitle>
      <View className="gap-stack-lg">
        <View className="flex-row items-center gap-inline-lg">
          <Label>Pill</Label>
          {PILL_RAMP.map((s) => (
            <Pill key={s} size={s}>
              {s}
            </Pill>
          ))}
        </View>
        <View className="flex-row items-center gap-inline-lg">
          <Label>Badge</Label>
          {RAMP.map((s) => (
            <Badge key={s} size={s}>
              {s}
            </Badge>
          ))}
        </View>
        <View className="flex-row items-center gap-inline-lg">
          <Label>Chip</Label>
          {RAMP.map((s) => (
            <Chip key={s} size={s}>
              {s}
            </Chip>
          ))}
        </View>
      </View>
      <Text className="text-text-secondary text-sm">
        The ramp has four rungs. Badge and Chip take the top three, because neither shipped a
        capsule that small; `xs` is Pill&apos;s alone, and it stays a real rung because nine in-repo
        call sites already render one. Only `xl` is deprecated — it renders as `lg` for one release,
        so a five-rung call site keeps compiling.
      </Text>
    </Page>
  ),
}

// ------------------------------------------------------------- 5. do / don't

function Pair({ rule, children }: { rule: string; children: ReactNode }) {
  return (
    <View className="gap-stack-md">
      <Label>{rule}</Label>
      <View className="flex-row gap-inline-lg items-start">{children}</View>
    </View>
  )
}

function Verdict({ ok, note, children }: { ok: boolean; note: string; children: ReactNode }) {
  return (
    <View style={{ width: 230 }} className="gap-stack-sm">
      <Text className={ok ? 'text-sm text-status-success' : 'text-sm text-status-error'}>
        {ok ? '✓' : '✗'} {note}
      </Text>
      <Card variant="subtle" elevation={1}>
        {children}
      </Card>
    </View>
  )
}

export const DoAndDont: Story = {
  name: "5. Do and don't",
  render: () => (
    <Page title="Do and don't" intro="Four rules, each shown rather than stated.">
      <Pair rule="Similarity — peers take the same spacing">
        <Verdict ok note="one gap for one list">
          <View className="gap-stack-md p-inset-md">
            <Bar px={140} height={14} />
            <Bar px={140} height={14} />
            <Bar px={140} height={14} />
          </View>
        </Verdict>
        <Verdict ok={false} note="three gaps, no meaning behind the difference">
          <View className="p-inset-md">
            <Bar px={140} height={14} />
            <View className="h-1" />
            <Bar px={140} height={14} />
            <View className="h-4" />
            <Bar px={140} height={14} />
          </View>
        </Verdict>
      </Pair>

      <Pair rule="Proximity — related items sit closer than unrelated ones">
        <Verdict ok note="label hugs its value, groups separate">
          <View className="p-inset-md gap-stack-lg">
            <View className="gap-stack-sm">
              <Text className="text-2xs text-text-tertiary">PEAK VELOCITY</Text>
              <Text className="text-base text-text-primary">0.82 m/s</Text>
            </View>
            <View className="gap-stack-sm">
              <Text className="text-2xs text-text-tertiary">MEAN VELOCITY</Text>
              <Text className="text-base text-text-primary">0.61 m/s</Text>
            </View>
          </View>
        </Verdict>
        <Verdict ok={false} note="every gap equal — which label owns which value?">
          <View className="p-inset-md gap-stack-md">
            <Text className="text-2xs text-text-tertiary">PEAK VELOCITY</Text>
            <Text className="text-base text-text-primary">0.82 m/s</Text>
            <Text className="text-2xs text-text-tertiary">MEAN VELOCITY</Text>
            <Text className="text-base text-text-primary">0.61 m/s</Text>
          </View>
        </Verdict>
      </Pair>

      <Pair rule="Hierarchy — a level change is a step on the scale, not a nudge">
        <Verdict ok note="section 32 over stack 8 — two levels apart">
          <View className="p-inset-md gap-section-sm">
            <View className="gap-stack-sm">
              <Bar px={120} height={14} />
              <Bar px={100} height={14} />
            </View>
            <View className="gap-stack-sm">
              <Bar px={120} height={14} />
              <Bar px={100} height={14} />
            </View>
          </View>
        </Verdict>
        <Verdict ok={false} note="12 over 8 — the eye cannot resolve it">
          <View className="p-inset-md gap-3">
            <View className="gap-stack-sm">
              <Bar px={120} height={14} />
              <Bar px={100} height={14} />
            </View>
            <View className="gap-stack-sm">
              <Bar px={120} height={14} />
              <Bar px={100} height={14} />
            </View>
          </View>
        </Verdict>
      </Pair>

      <Pair rule="Optical adjustment — allowed, but it has to say why">
        <Verdict ok note="// optical: the cap sits 1px high at this weight">
          <View className="p-inset-md">
            <Text className="text-sm text-text-primary">a nudge with a stated reason survives</Text>
          </View>
        </Verdict>
        <Verdict ok={false} note="an unexplained 7 is indistinguishable from a typo">
          <View className="p-inset-md">
            <Text className="text-sm text-text-primary">marginTop: 7</Text>
          </View>
        </Verdict>
      </Pair>
    </Page>
  ),
}

// ------------------------------------------------------- 6. the anti-patterns

const ANTI_PATTERNS = [
  ['gap-[3px]', 'gap-0.5 (2px) or gap-1 (4px)', 'off-scale by 1px; nobody can see the difference'],
  ['gap-[7px]', 'gap-stack-sm (4px) or gap-2 (8px)', 'a rounded 8 that never got rounded'],
  ['py-[9px]', 'py-control-y-md (8px)', 'a control inset, transcribed from a specimen'],
  [
    'mt-[3px]',
    'gap-stack-sm on the parent',
    'a margin doing a parent’s job; Yoga never collapses it',
  ],
  [
    "padding: '9px 12px'",
    'px-inset-md py-squish-y-lg',
    'the inline dialect the bracket rule never saw',
  ],
] as const

export const AntiPatterns: Story = {
  name: '6. Anti-patterns',
  render: () => (
    <Page
      title="Anti-patterns"
      intro="Every value on the left is one the AW-142 audit found in this repo. None of them is individually indefensible, and collectively there is no scale left. titan/no-raw-spacing and the bracket-form selectors catch both dialects; a genuine optical nudge survives with a // optical: <why> comment."
    >
      <View className="gap-stack-md">
        {ANTI_PATTERNS.map(([bad, good, why]) => (
          <View key={bad} className="flex-row items-start gap-inline-lg">
            <View style={{ width: 170 }}>
              <Text className="font-mono text-xs text-status-error">✗ {bad}</Text>
            </View>
            <View style={{ width: 230 }}>
              <Text className="font-mono text-xs text-status-success">✓ {good}</Text>
            </View>
            <Text className="text-xs text-text-tertiary flex-1">{why}</Text>
          </View>
        ))}
      </View>
    </Page>
  ),
}

// ------------------------------------------------------------------ 7. sizing

const HIT_TARGET_FLOORS = [
  ['Apple HIG', 44, 'the strictest of the three, and the one a phone is held to'],
  ['Material', 48, 'dp, which is px at 1x'],
  ['WCAG 2.5.8 AA', 24, 'the legal floor, not a design target'],
] as const

const VIOLATORS = [
  ['Button sm', 32, 'Button.tsx — min-h-control-sm'],
  ['ToolbarButton sm', 26, 'ToolbarButton.tsx:63'],
  ['ToolbarButton md', 30, 'ToolbarButton.tsx:64'],
  ['ToolbarButton lg', 36, 'ToolbarButton.tsx:65'],
] as const

export const Sizing: Story = {
  name: '7. Sizing and hit targets',
  render: () => (
    <Page
      title="Sizing"
      intro="Control heights and the icon ramp, plus the floor a pressable has to clear. The heights below are what ships today; three of them do not clear it, and raising them is AW-144 — a visible design change that gets its own reviewed PR rather than riding inside a token migration."
    >
      <SectionTitle>Control heights — h-control-* / min-h-control-*</SectionTitle>
      <View className="flex-row items-end gap-inline-lg">
        {(['sm', 'md', 'lg'] as const).map((level) => (
          <View key={level} className="items-center gap-stack-sm">
            <Button size={level}>
              <ButtonText>{level}</ButtonText>
            </Button>
            <Mono>{primitiveSizing.control[level]}px</Mono>
          </View>
        ))}
      </View>

      <SectionTitle>Icon sizes</SectionTitle>
      <View className="flex-row items-end gap-inline-lg">
        {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((level) => (
          <View key={level} className="items-center gap-stack-sm text-text-primary">
            <DumbbellIcon size={primitiveSizing.icon[level]} />
            <Mono>
              {level} · {primitiveSizing.icon[level]}
            </Mono>
          </View>
        ))}
      </View>

      <SectionTitle>The hit-target floor</SectionTitle>
      <View className="gap-stack-sm">
        {HIT_TARGET_FLOORS.map(([name, px, note]) => (
          <View key={name} className="flex-row items-center gap-inline-lg">
            <View style={{ width: 130 }}>
              <Label>{name}</Label>
            </View>
            <View style={{ width: 48 }}>
              <Mono>{px}</Mono>
            </View>
            <Bar px={px} height={10} />
            <Text className="text-xs text-text-tertiary">{note}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>Below the floor today (AW-144)</SectionTitle>
      <View className="gap-stack-sm">
        {VIOLATORS.map(([name, px, where]) => (
          <View key={name} className="flex-row items-center gap-inline-lg">
            <View style={{ width: 130 }}>
              <Text className="text-sm font-semibold text-status-warning">{name}</Text>
            </View>
            <View style={{ width: 48 }}>
              <Mono>{px}</Mono>
            </View>
            <Bar px={px} height={10} />
            <Mono>{where}</Mono>
          </View>
        ))}
      </View>
      <Text className="text-text-secondary text-sm">
        Do not raise these here. The spacing waves are pixel-neutral by design; a height change is
        visible, and the operator reviews it on its own.
      </Text>
    </Page>
  ),
}

// --------------------------------------------------------------------- 8. FAQ

const FAQ_ENTRIES = [
  [
    'May I go off-scale?',
    'The numeric scale stays legal everywhere, so the answer is almost always a step you already have. A genuine optical correction is allowed and needs a `// optical: <why>` comment; without the reason it is indistinguishable from a typo.',
  ],
  [
    'May I use an arbitrary value?',
    'Not for spacing, radius or type in an enrolled family — that is a lint error. A one-off LAYOUT dimension (`w-[420px]` for a fixed pane) is fine; the rules target the scale, not geometry.',
  ],
  [
    'Are the tokens responsive?',
    'Not yet. They are single values, and a density mode is what the CSS-variable indirection exists for: remapping `--space-*` changes every component at once. Until then reach for a different key at a breakpoint, not an arbitrary value.',
  ],
  [
    'What about negative space?',
    'Negative margins (`-mt-2`) read from the same scale and stay available. Prefer `gap` on the parent over a negative margin undoing a positive one — margins do not collapse in Yoga, so the web and native results differ.',
  ],
  [
    'Margin or gap?',
    'Gap on the parent. Margins collapse on web and never in Yoga, so a margin-stacked list measures differently on the two platforms. `space-x-*` / `space-y-*` compile to sibling selectors and are unused here; keep it that way.',
  ],
] as const

export const FAQ: Story = {
  name: '8. FAQ',
  render: () => (
    <Page title="FAQ" intro="The questions this foundation gets asked.">
      <View className="gap-stack-xl">
        {FAQ_ENTRIES.map(([question, answer]) => (
          <View key={question} className="gap-stack-sm">
            <Label>{question}</Label>
            <Text className="text-sm text-text-secondary">{answer}</Text>
          </View>
        ))}
      </View>
    </Page>
  ),
}

import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Surface } from './Surface'
import { useOnSurfaceColor, type SurfaceLevel } from './SurfaceContext'
import type { ElevationLevel } from '../../../theme/elevation'

const meta: Meta<typeof Surface> = {
  title: 'Components/Atoms/Surface',
  component: Surface,
  tags: ['autodocs'],
  argTypes: {
    elevation: {
      control: { type: 'range', min: -2, max: 5, step: 1 },
      description: 'Elevation level (-2 to 5)',
    },
    level: {
      control: 'select',
      options: ['frame', 'background', 'base', 'elevated', 'raised', 'overlay'],
      description: 'Named grey plane (flat background from a semantic token)',
    },
    pressed: {
      control: 'boolean',
      description: 'Sunken well: one ramp step DOWN from the parent level + inner-shadow recess',
    },
    theme: {
      control: 'select',
      options: ['light', 'dark'],
      description: 'Color theme (also seeds the on-surface colour context)',
    },
    glowColor: {
      control: 'color',
      description: 'Optional glow color (hex)',
    },
    glowIntensity: {
      control: 'select',
      options: ['subtle', 'medium', 'strong'],
      description: 'Glow intensity level',
    },
  },
}

export default meta
type Story = StoryObj<typeof Surface>

export const Default: Story = {
  args: {
    elevation: 2,
    theme: 'dark',
  },
  render: (args) => (
    <Surface {...args} style={{ padding: 24 }}>
      <Text style={{ color: '#fff' }}>Default Surface</Text>
    </Surface>
  ),
}

export const ElevationLevels: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24 }}>
      {([-2, -1, 0, 1, 2, 3, 4, 5] as ElevationLevel[]).map((level) => (
        <Surface key={level} elevation={level} style={{ padding: 16 }}>
          <Text style={{ color: '#fff' }}>Elevation {level}</Text>
        </Surface>
      ))}
    </View>
  ),
}

export const WithGlow: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24 }}>
      <Surface elevation={2} glowColor="#FF7900" glowIntensity="subtle" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Subtle Orange Glow</Text>
      </Surface>
      <Surface elevation={2} glowColor="#FF7900" glowIntensity="medium" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Medium Orange Glow</Text>
      </Surface>
      <Surface elevation={2} glowColor="#FF7900" glowIntensity="strong" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Strong Orange Glow</Text>
      </Surface>
      <Surface elevation={2} glowColor="#22C55E" glowIntensity="medium" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Green Glow (Success)</Text>
      </Surface>
      <Surface elevation={2} glowColor="#EF4444" glowIntensity="medium" style={{ padding: 16 }}>
        <Text style={{ color: '#fff' }}>Red Glow (Error)</Text>
      </Surface>
    </View>
  ),
}

// The named-plane model: flat, full-bleed grey planes straight from the
// semantic surface tokens — reaching the darker nav/page shades the numeric
// lighten model can't. These back the shell / rail / stage.
export const NamedPlanes: Story = {
  render: () => (
    <View style={{ gap: 12, padding: 24 }}>
      {(['background', 'base', 'elevated', 'raised', 'overlay'] as SurfaceLevel[]).map((level) => (
        <Surface key={level} level={level} style={{ padding: 16 }}>
          <Text style={{ color: '#fff' }}>level=&quot;{level}&quot;</Text>
        </Surface>
      ))}
    </View>
  ),
}

// The pressed (sunken well) model: a `<Surface pressed>` renders ONE ramp step
// DOWN from its parent's level — the symmetric twin of a raised surface stepping
// up — plus an inner-shadow recess. It's RELATIVE: the same `pressed` well reads
// as a consistent recess on every host plane (base → background, raised →
// elevated, overlay → raised), not a single fixed black hole. It clamps at the
// `inset` floor so a well in `background` bottoms out at the ramp's pit.
function WellCard({ level }: { level: SurfaceLevel }) {
  return (
    <Surface level={level} style={{ padding: 16, gap: 12, flex: 1, borderRadius: 14 }}>
      <Eyebrow>HOST · LEVEL = {level.toUpperCase()}</Eyebrow>
      <Surface pressed style={{ padding: 16, gap: 4 }}>
        <Eyebrow>PRESSED WELL</Eyebrow>
        <OnSurfaceBody title="Sunken panel" sub="one step down + inner recess" />
      </Surface>
    </Surface>
  )
}

export const PressedWells: Story = {
  render: () => (
    <Surface level="background" style={{ flexDirection: 'row', gap: 16, padding: 24 }}>
      {(['base', 'raised', 'overlay'] as SurfaceLevel[]).map((level) => (
        <WellCard key={level} level={level} />
      ))}
    </Surface>
  ),
}

// Clamp + nesting — a well in `background` bottoms out at the inset floor
// (#13100D), and pressing again inside it stays at the floor (no underflow),
// while a well in a lighter plane still steps down normally.
export const PressedClampAndNesting: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, padding: 24 }}>
      <Surface level="background" style={{ padding: 16, gap: 12, flex: 1, borderRadius: 14 }}>
        <Eyebrow>HOST · LEVEL = BACKGROUND</Eyebrow>
        <Surface pressed style={{ padding: 16, gap: 10 }}>
          <Eyebrow>PRESSED → INSET FLOOR</Eyebrow>
          <Surface pressed style={{ padding: 12 }}>
            <Eyebrow>PRESSED AGAIN → CLAMPED</Eyebrow>
          </Surface>
        </Surface>
      </Surface>
      <Surface level="raised" style={{ padding: 16, gap: 12, flex: 1, borderRadius: 14 }}>
        <Eyebrow>HOST · LEVEL = RAISED</Eyebrow>
        <Surface pressed style={{ padding: 16, gap: 10 }}>
          <Eyebrow>PRESSED → ELEVATED</Eyebrow>
          <Surface pressed style={{ padding: 12 }}>
            <Eyebrow>PRESSED AGAIN → BASE</Eyebrow>
          </Surface>
        </Surface>
      </Surface>
    </View>
  ),
}

// On-surface colour context: descendant text reads its colour from the Surface
// via `useOnSurfaceColor` — no hard-coded hex, so it never renders black when the
// tree mounts as raw RN in the standalone wall SPA.
function OnSurfaceLabels() {
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ color: useOnSurfaceColor('primary'), fontSize: 16, fontWeight: '700' }}>
        Primary on this surface
      </Text>
      <Text style={{ color: useOnSurfaceColor('secondary') }}>Secondary on this surface</Text>
      <Text style={{ color: useOnSurfaceColor('tertiary') }}>Tertiary on this surface</Text>
    </View>
  )
}

export const OnSurfaceText: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24 }}>
      <Surface level="background" style={{ padding: 16 }}>
        <OnSurfaceLabels />
      </Surface>
      <Surface theme="light" level="base" style={{ padding: 16 }}>
        <OnSurfaceLabels />
      </Surface>
    </View>
  ),
}

export const LightTheme: Story = {
  render: () => (
    <View style={{ gap: 16, padding: 24, backgroundColor: '#F3F4F6' }}>
      {([0, 1, 2, 3, 4, 5] as ElevationLevel[]).map((level) => (
        <Surface key={level} elevation={level} theme="light" style={{ padding: 16 }}>
          <Text style={{ color: '#111' }}>Light Elevation {level}</Text>
        </Surface>
      ))}
    </View>
  ),
}

// ===========================================================================
// The Surface WORK — composition, context inheritance, and the real wall lockup.
// The stories above exercise the primitive in isolation; these show it doing the
// job it was built for (TD-05.12): stacking planes, propagating the on-surface
// colour context, and backing the migrated shell / rail / stage.
// ===========================================================================

/** An all-caps eyebrow whose colour resolves on whatever Surface encloses it. */
function Eyebrow({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: useOnSurfaceColor('tertiary'),
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
      }}
    >
      {children}
    </Text>
  )
}

/** Primary + secondary body text, both on-surface — no hard-coded hex. */
function OnSurfaceBody({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: useOnSurfaceColor('primary'), fontSize: 14, fontWeight: '600' }}>
        {title}
      </Text>
      <Text style={{ color: useOnSurfaceColor('secondary'), fontSize: 12 }}>{sub}</Text>
    </View>
  )
}

// Nesting + context inheritance — the core mechanic. Each Surface publishes its
// level; the planes read darkest → lightest as they nest (background < base <
// elevated < raised). The labels call `useOnSurfaceColor` and stay legible on
// every plane WITHOUT a hard-coded hex — on-surface text resolves from the mode,
// so one set of roles reads correctly across all the dark planes.
export const NestedPlanes: Story = {
  render: () => (
    <Surface level="background" style={{ padding: 20, gap: 14 }}>
      <Eyebrow>LEVEL = BACKGROUND</Eyebrow>
      <Surface level="base" style={{ padding: 16, gap: 14, borderRadius: 14 }}>
        <Eyebrow>LEVEL = BASE</Eyebrow>
        <Surface level="elevated" style={{ padding: 16, gap: 14, borderRadius: 12 }}>
          <Eyebrow>LEVEL = ELEVATED</Eyebrow>
          <Surface level="raised" style={{ padding: 16, gap: 6, borderRadius: 10 }}>
            <Eyebrow>LEVEL = RAISED</Eyebrow>
            <OnSurfaceBody title="On-surface text" sub="resolves from the enclosing Surface" />
          </Surface>
        </Surface>
      </Surface>
    </Surface>
  ),
}

// Theme inheritance — a Surface seeds the mode; the nested Surfaces and text with
// NO explicit `theme` inherit it. The SAME subtree renders on both grounds and
// stays legible, because on-surface colours resolve from the inherited mode
// rather than a fixed hex. (A numeric `elevation` Surface inherits mode too.)
function InheritingCard() {
  return (
    <Surface level="base" style={{ padding: 14, gap: 10, borderRadius: 12 }}>
      <OnSurfaceBody title="Inherited mode" sub="no theme prop on this card" />
      <Surface level="raised" style={{ padding: 12, borderRadius: 8 }}>
        <Eyebrow>NESTED · STILL INHERITS</Eyebrow>
      </Surface>
    </Surface>
  )
}

export const ThemeInheritance: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', gap: 16, padding: 24 }}>
      <Surface theme="dark" level="background" style={{ padding: 16, gap: 10, flex: 1 }}>
        <Eyebrow>THEME = DARK (SEEDS CONTEXT)</Eyebrow>
        <InheritingCard />
      </Surface>
      <Surface theme="light" level="background" style={{ padding: 16, gap: 10, flex: 1 }}>
        <Eyebrow>THEME = LIGHT (SEEDS CONTEXT)</Eyebrow>
        <InheritingCard />
      </Surface>
    </View>
  ),
}

// The wall lockup, as migrated (DashboardShell / SessionRail / stage). The shell
// is a `background` plane; the page a `base` plane; the session rail an
// `elevated` inset; the live stage a `raised` panel. Every eyebrow/label reads
// on-surface — this composition is what replaced the inline `getSemanticColors`
// text patches the standalone wall SPA used to carry.
function RailRow({ name, sets }: { name: string; sets: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: useOnSurfaceColor('primary'), fontSize: 13 }}>{name}</Text>
      <Text style={{ color: useOnSurfaceColor('tertiary'), fontSize: 13 }}>{sets}</Text>
    </View>
  )
}

export const WallLockup: Story = {
  render: () => (
    <Surface level="background" style={{ flexDirection: 'row', height: 320, padding: 12, gap: 12 }}>
      {/* left nav — flush to the shell edge, on the same background plane */}
      <View style={{ width: 56, alignItems: 'center', paddingTop: 10 }}>
        <Eyebrow>NAV</Eyebrow>
      </View>
      {/* page — a base plane holding the rail + stage */}
      <Surface
        level="base"
        style={{ flex: 1, flexDirection: 'row', padding: 12, gap: 12, borderRadius: 14 }}
      >
        {/* session rail — an elevated inset */}
        <Surface level="elevated" style={{ width: 150, padding: 12, gap: 10, borderRadius: 12 }}>
          <Eyebrow>SESSION</Eyebrow>
          <RailRow name="Bench" sets="3/3" />
          <RailRow name="Cable Row" sets="1/3" />
          <RailRow name="Curl" sets="0/3" />
        </Surface>
        {/* live stage — a raised panel */}
        <Surface
          level="raised"
          style={{ flex: 1, padding: 16, gap: 6, justifyContent: 'center', borderRadius: 12 }}
        >
          <Eyebrow>LIVE</Eyebrow>
          <OnSurfaceBody title="Seated Cable Row" sub="set 2 · 8 reps · 0.42 m/s" />
        </Surface>
      </Surface>
    </Surface>
  ),
}

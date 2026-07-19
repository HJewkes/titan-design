import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'

// ===========================================================================
// DESIGN EXPLORATION — NOT shipped tokens. These stories exist to compare dark
// surface RAMP options and SEPARATION treatments VISUALLY before we change any
// semantic token. See `coordination/design-explorations/surface-system-north-star.md`.
// Round 2 (pending MODERN-THEMES research): texture (gradient / noise / paper)
// and the refined-skeuomorphic recipe with real gradients.
// ===========================================================================

interface Ramp {
  name: string
  /** darkest (shell/background) → lightest (overlay/card), 5 planes. */
  planes: [string, string, string, string, string]
  note: string
}

// Each ramp is 5 planes at ~even perceptual spacing (except CURRENT, shown to
// make the cludge visible next to the fixes). Sources: SURF-PERCEPTION / -GUARDRAILS.
const RAMPS: Ramp[] = [
  {
    name: 'Neutral · even ΔL*≈4',
    planes: ['#0F0F0F', '#181818', '#212121', '#2B2B2B', '#343434'],
    note: 'pure gray, drop-in — likely pick (charcoal+orange brand)',
  },
  {
    name: 'Blue-black · cool tint',
    planes: ['#0C0F13', '#16191D', '#1F2226', '#282B30', '#32343A'],
    note: 'OKLCH C≈0.010 — reads "technical", avoids dead-gray',
  },
  {
    name: 'Warm charcoal',
    planes: ['#0F0E0C', '#1A1714', '#232019', '#2C2823', '#35302B'],
    note: 'faint warm bias — pairs with orange brand',
  },
  {
    name: 'Material · alpha-overlay',
    planes: ['#101010', '#1C1C1C', '#252525', '#2F2F2F', '#393939'],
    note: 'white-alpha (0/5/9/13/17%) over one base — runtime-generatable',
  },
  {
    name: 'CURRENT · the cludge',
    planes: ['#101010', '#161616', '#191919', '#1C1C1C', '#1C1C1C'],
    note: 'ΔL* 1.5 steps + overlay≡raised collision — the problem',
  },
]

const TEXT = { primary: '#F3F4F6', secondary: '#9CA3AF', tertiary: '#6B7280' }

type Separation = 'tonal' | 'hairline' | 'skeuo'

// The separation treatment applied to every nested plane. `tonal` leans on the
// fill step alone; `hairline` adds a surface-independent alpha-white ring;
// `skeuo` adds a top rim-light + a soft ambient shadow (first cut — gradient
// fill comes in round 2). RNW maps shadow* → CSS box-shadow.
function sepStyle(sep: Separation): object {
  if (sep === 'hairline') return { borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)' }
  if (sep === 'skeuo')
    return {
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.16)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.55,
      shadowRadius: 10,
    }
  return {}
}

function Eyebrow({ children }: { children: string }) {
  return (
    <Text style={{ color: TEXT.tertiary, fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>
      {children}
    </Text>
  )
}

// A mini wall lockup rendered under a given ramp + separation, so the plane
// boundaries (shell → page → rail → stage → card) are exactly what you judge.
function SurfaceScene({
  ramp,
  separation,
  showName = true,
}: {
  ramp: Ramp
  separation: Separation
  showName?: boolean
}) {
  const p = ramp.planes
  const sep = sepStyle(separation)
  return (
    <View style={{ width: 420, gap: 4 }}>
      {showName && (
        <Text style={{ color: TEXT.primary, fontSize: 12, fontWeight: '600' }}>{ramp.name}</Text>
      )}
      {showName && <Text style={{ color: TEXT.tertiary, fontSize: 10 }}>{ramp.note}</Text>}
      {/* shell = darkest plane */}
      <View
        style={{
          backgroundColor: p[0],
          borderRadius: 12,
          padding: 10,
          flexDirection: 'row',
          gap: 10,
          height: 210,
          marginTop: 4,
        }}
      >
        <View style={{ width: 36, alignItems: 'center', paddingTop: 8 }}>
          <Eyebrow>NAV</Eyebrow>
        </View>
        {/* page = base plane */}
        <View
          style={{
            flex: 1,
            backgroundColor: p[1],
            borderRadius: 10,
            padding: 10,
            flexDirection: 'row',
            gap: 10,
            ...sep,
          }}
        >
          {/* rail = elevated plane */}
          <View
            style={{
              width: 120,
              backgroundColor: p[2],
              borderRadius: 8,
              padding: 10,
              gap: 7,
              ...sep,
            }}
          >
            <Eyebrow>SESSION</Eyebrow>
            {['Bench 3/3', 'Row 1/3', 'Curl 0/3'].map((r) => (
              <Text key={r} style={{ color: TEXT.primary, fontSize: 12 }}>
                {r}
              </Text>
            ))}
          </View>
          {/* stage = raised plane, holding a card = overlay plane */}
          <View
            style={{ flex: 1, backgroundColor: p[3], borderRadius: 8, padding: 10, gap: 8, ...sep }}
          >
            <Eyebrow>LIVE</Eyebrow>
            <View style={{ backgroundColor: p[4], borderRadius: 6, padding: 10, gap: 3, ...sep }}>
              <Text style={{ color: TEXT.primary, fontSize: 13, fontWeight: '600' }}>
                Cable Row
              </Text>
              <Text style={{ color: TEXT.secondary, fontSize: 11 }}>set 2 · 8 reps · 0.42 m/s</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

const meta: Meta = {
  title: 'Lab/Surface Exploration',
  parameters: { layout: 'fullscreen' },
}
export default meta
type Story = StoryObj

// Compare the RAMP options — same scene + alpha-hairline separation, five ramps.
// Judge: can you cleanly read shell → page → rail → stage → card on each? The
// CURRENT ramp is included so the cludge is visible next to the fixes.
export const Ramps: Story = {
  render: () => (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 28,
        backgroundColor: '#000',
        padding: 28,
      }}
    >
      {RAMPS.map((r) => (
        <SurfaceScene key={r.name} ramp={r} separation="hairline" />
      ))}
    </View>
  ),
}

// Compare SEPARATION treatments — same neutral ramp, three treatments side by
// side: tonal-only (fill step), alpha hairline, and first-cut skeuomorphic
// (rim + soft shadow). Judge which reads cleanest without muddying.
export const SeparationTreatments: Story = {
  render: () => {
    const neutral = RAMPS[0]
    const treatments: { sep: Separation; label: string }[] = [
      { sep: 'tonal', label: 'Tonal only — fill step, no border' },
      { sep: 'hairline', label: 'Alpha hairline — rgba(255,255,255,0.09)' },
      { sep: 'skeuo', label: 'Skeuomorphic — rim + soft shadow (gradient pending)' },
    ]
    return (
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 28,
          backgroundColor: '#000',
          padding: 28,
        }}
      >
        {treatments.map(({ sep, label }) => (
          <View key={sep} style={{ gap: 6 }}>
            <Text style={{ color: TEXT.primary, fontSize: 12, fontWeight: '600' }}>{label}</Text>
            <SurfaceScene ramp={neutral} separation={sep} showName={false} />
          </View>
        ))}
      </View>
    )
  },
}

import type { ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import {
  primitiveColors,
  primitiveRamps,
  categoricalPalette,
  getCategoricalColor,
  CATEGORICAL_CVD_SAFE_MAX,
  divergingScale,
  sequentialEffort,
  bestTextColor,
} from './tokens/primitives'

const meta: Meta = {
  title: 'Design Tokens/Color System',
  tags: ['autodocs'],
}
export default meta

// ---- color math (self-contained; drives the accessibility panel) ----
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number]
}
const toHex = (v: number) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')
const lin = (c: number) => (c >= 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92)
const gamma = (c: number) => (c >= 0.0031308 ? 1.055 * Math.max(0, c) ** (1 / 2.4) - 0.055 : 12.92 * c)
const relLum = (hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(lin)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a: string, b: string) => {
  const [l1, l2] = [relLum(a), relLum(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}
const bestText = (hex: string) => (contrast(hex, '#000000') >= contrast(hex, '#FFFFFF') ? '#000000' : '#FFFFFF')
// Machado-2009 dichromacy simulation (severity 1.0)
const CVD = {
  deuteranopia: [0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182, 0.04294, 0.968881],
  protanopia: [0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882, -0.048116, 1.051998],
} as const
const simulate = (M: readonly number[], hex: string) => {
  const [r, g, b] = hexToRgb(hex).map(lin)
  const out = [
    M[0] * r + M[1] * g + M[2] * b,
    M[3] * r + M[4] * g + M[5] * b,
    M[6] * r + M[7] * g + M[8] * b,
  ].map(gamma)
  return '#' + out.map(toHex).join('')
}

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const

function SectionTitle({ children }: { children: string }) {
  return <Text className="text-lg font-bold text-text-primary mb-3 mt-2">{children}</Text>
}

function Ramp({ name, ramp }: { name: string; ramp: Record<number, string> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 }}>
      <Text className="text-text-secondary text-xs" style={{ width: 150 }}>
        {name}
      </Text>
      <View style={{ flexDirection: 'row', flex: 1, borderRadius: 6, overflow: 'hidden', borderWidth: 1, borderColor: '#2C2C2C' }}>
        {STEPS.map((s) => (
          <View key={s} style={{ flex: 1, height: 30, backgroundColor: ramp[s] }} />
        ))}
      </View>
    </View>
  )
}

function Chip({ hex, label, sub }: { hex: string; label?: string; sub?: string }) {
  return (
    <View style={{ alignItems: 'center' }}>
      <View
        style={{
          width: 58,
          height: 44,
          borderRadius: 8,
          backgroundColor: hex,
          borderWidth: 1,
          borderColor: '#2C2C2C',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {label ? <Text style={{ color: bestText(hex), fontSize: 11, fontWeight: '700' }}>{label}</Text> : null}
      </View>
      {sub ? <Text className="text-text-secondary" style={{ fontSize: 8, marginTop: 2 }}>{sub}</Text> : null}
    </View>
  )
}

const RAMP_NAMES: Array<[keyof typeof primitiveRamps, string]> = [
  ['red', 'Red'],
  ['orange', 'Orange'],
  ['amber', 'Amber'],
  ['green', 'Green'],
  ['cyan', 'Cyan'],
  ['blue', 'Blue'],
  ['magenta', 'Magenta'],
]

const SEM = {
  success: primitiveRamps.green[300],
  warning: primitiveRamps.amber[300],
  error: primitiveRamps.red[600],
  info: primitiveRamps.blue[500],
  deload: primitiveRamps.magenta[600],
  brand: primitiveRamps.orange[400],
  brandDark: primitiveRamps.orange[600],
  brandSecondary: primitiveRamps.cyan[600],
  spinner: primitiveRamps.cyan[600],
  neutral: primitiveColors.neutral[500],
} as const

// BodyMap training-status diverging scale (from the divergingScale token).
const D3_STATUS = divergingScale

export const Overview: StoryObj = {
  render: () => (
    <View style={{ padding: 24, gap: 6 }}>
      <Text className="text-2xl font-bold text-text-primary mb-1">Color System</Text>
      <Text className="text-text-secondary mb-4">
        Seven OKLCH tonal ramps and an ordered, colorblind-safe categorical palette. Ramps are the single
        source of truth; the categorical references ramp steps.
      </Text>

      <SectionTitle>Tonal ramps</SectionTitle>
      {RAMP_NAMES.map(([key, name]) => (
        <Ramp key={key} name={name} ramp={primitiveRamps[key]} />
      ))}

      <SectionTitle>Semantic tokens</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
        {Object.entries(SEM).map(([label, hex]) => (
          <View key={label} style={{ alignItems: 'center' }}>
            <Chip hex={hex} />
            <Text className="text-text-secondary" style={{ fontSize: 9, marginTop: 3 }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      <SectionTitle>Categorical — ordered, nested, CVD-safe to 6</SectionTitle>
      {(['default', 'dark'] as const).map((variant) => (
        <View key={variant} style={{ marginBottom: 10 }}>
          <Text className="text-text-secondary text-xs mb-1" style={{ textTransform: 'capitalize' }}>
            {variant}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {categoricalPalette[variant].map((hex, i) => (
              <Chip key={i} hex={hex} label={`${i + 1}`} sub={i < CATEGORICAL_CVD_SAFE_MAX ? undefined : 'ext'} />
            ))}
          </View>
        </View>
      ))}

      <SectionTitle>Data-viz scales</SectionTitle>
      <Text className="text-text-secondary text-xs mb-2">
        Diverging (BodyMap training-status) — light-centered so it reads in lightness and stays
        colorblind-stable; direction is the blue↔red axis. Labels use per-cell best-contrast text.
      </Text>
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 12 }}>
        {['under', 'maint', 'optimal', 'approach', 'over'].map((l, i) => (
          <View key={l} style={{ flex: 1, height: 40, borderRadius: 6, backgroundColor: divergingScale[i], alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: bestTextColor(divergingScale[i]), fontSize: 10, fontWeight: '700' }}>{l}</Text>
          </View>
        ))}
      </View>
      <Text className="text-text-secondary text-xs mb-2">
        Sequential effort (low → high) — an ordinal green→yellow→orange→red scale that IntensityBar uses
        in full and VelocityStrip/RPE sub-samples.
      </Text>
      <View style={{ flexDirection: 'row', gap: 4, marginBottom: 4 }}>
        {sequentialEffort.map((hex, i) => (
          <View key={i} style={{ flex: 1, height: 34, borderRadius: 5, backgroundColor: hex, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: bestTextColor(hex), fontSize: 10, fontWeight: '700' }}>{i + 1}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>Component examples — correct color roles</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* BodyMap muscle heatmap — training-status diverging (D3) */}
        <Demo label="BodyMap · training status">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 132, gap: 4 }}>
            {[
              ['Chest', 4], ['Quads', 2], ['Back', 3],
              ['Delts', 0], ['Biceps', 4], ['Calves', 1],
            ].map(([m, idx]) => (
              <View key={m as string} style={{ width: 40, backgroundColor: D3_STATUS[idx as number], borderRadius: 5, paddingVertical: 6 }}>
                <Text style={{ color: bestTextColor(D3_STATUS[idx as number]), fontSize: 8, fontWeight: '700', textAlign: 'center' }}>{m as string}</Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* StatusDot — semantic */}
        <Demo label="StatusDot · semantic">
          <View style={{ gap: 6 }}>
            {[['ok', SEM.success], ['warn', SEM.warning], ['err', SEM.error], ['neutral', SEM.neutral]].map(([l, c]) => (
              <View key={l as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c as string }} />
                <Text className="text-text-secondary" style={{ fontSize: 11 }}>{l as string}</Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* WorkoutPill — status */}
        <Demo label="WorkoutPill">
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', maxWidth: 220 }}>
            {[['Done', SEM.success], ['Now', SEM.brand], ['Next', SEM.neutral], ['Deload', SEM.deload]].map(([t, c]) => (
              <View key={t as string} style={{ borderRadius: 99, borderWidth: 1, borderColor: c as string, paddingHorizontal: 10, paddingVertical: 3 }}>
                <Text style={{ color: c as string, fontSize: 11, fontWeight: '700' }}>{t as string}</Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* StrengthTrend legend — series → semantic */}
        <Demo label="StrengthTrend · series">
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
            {[['1RM', SEM.brand], ['vel', SEM.success], ['miss', SEM.error], ['RPE', SEM.warning]].map(([l, c]) => (
              <View key={l as string} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 14, height: 3, backgroundColor: c as string, borderRadius: 2 }} />
                <Text className="text-text-secondary" style={{ fontSize: 10 }}>{l as string}</Text>
              </View>
            ))}
          </View>
        </Demo>
        {/* Treemap — ordered categorical */}
        <Demo label="Treemap · categorical">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 140, gap: 2 }}>
            {[46, 30, 30, 24, 24, 24, 20].map((h, i) => (
              <View key={i} style={{ height: h, flexGrow: 1, flexBasis: h > 40 ? 60 : 40, backgroundColor: getCategoricalColor(i), borderRadius: 3 }} />
            ))}
          </View>
        </Demo>
        {/* Spinner */}
        <Demo label="Spinner">
          <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: '#2C2C2C', borderTopColor: SEM.spinner }} />
        </Demo>
        {/* IntensityBar — full effort scale */}
        <Demo label="IntensityBar · effort">
          <View style={{ flexDirection: 'row', gap: 2, width: 132 }}>
            {sequentialEffort.map((hex, i) => (
              <View key={i} style={{ flex: 1, height: 20, backgroundColor: hex, borderRadius: 2 }} />
            ))}
          </View>
        </Demo>
        {/* VelocityStrip / RPE — effort sub-sample */}
        <Demo label="VelocityStrip · RPE">
          <View style={{ flexDirection: 'row', gap: 3 }}>
            {[sequentialEffort[0], sequentialEffort[2], sequentialEffort[3], sequentialEffort[5]].map((hex, i) => (
              <View key={i} style={{ width: 30, height: 26, borderRadius: 4, backgroundColor: hex, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: bestTextColor(hex), fontSize: 9, fontWeight: '700' }}>{['S', 'M', 'F', 'X'][i]}</Text>
              </View>
            ))}
          </View>
        </Demo>
      </View>
    </View>
  ),
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ padding: 10, backgroundColor: '#1A1A1A', borderRadius: 8 }}>
      <Text className="text-text-secondary" style={{ fontSize: 9, marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  )
}

export const Accessibility: StoryObj = {
  render: () => (
    <View style={{ padding: 24 }}>
      <Text className="text-2xl font-bold text-text-primary mb-1">Categorical Accessibility</Text>
      <Text className="text-text-secondary mb-5">
        In-place text contrast and colorblind simulation for the categorical series. Converging strips across
        two swatches signal a collision for that viewer; all pairs hold ΔE ≥ 8 through the first {CATEGORICAL_CVD_SAFE_MAX}.
      </Text>

      {(['default', 'dark'] as const).map((variant) => {
        const colors = categoricalPalette[variant]
        const textColor = variant === 'dark' ? '#FFFFFF' : '#000000'
        return (
          <View key={variant} style={{ marginBottom: 22 }}>
            <Text className="text-lg font-bold text-text-primary mb-2" style={{ textTransform: 'capitalize' }}>
              {variant}
            </Text>
            {/* swatches with in-place text + contrast ratio */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6 }}>
              {colors.map((hex, i) => (
                <View key={i} style={{ alignItems: 'center' }}>
                  <View style={{ width: 56, height: 40, borderRadius: 6, backgroundColor: hex, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: textColor, fontSize: 11, fontWeight: '700' }}>Aa</Text>
                  </View>
                  <Text className="text-text-secondary" style={{ fontSize: 8, marginTop: 2 }}>
                    {contrast(hex, textColor).toFixed(1)}:1
                  </Text>
                </View>
              ))}
            </View>
            {/* CVD simulation strips */}
            {(['deuteranopia', 'protanopia'] as const).map((mode) => (
              <View key={mode} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <Text className="text-text-secondary" style={{ fontSize: 9, width: 96 }}>{mode}</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {colors.map((hex, i) => (
                    <View key={i} style={{ width: 56, height: 14, borderRadius: 3, backgroundColor: simulate(CVD[mode], hex) }} />
                  ))}
                </View>
              </View>
            ))}
          </View>
        )
      })}
    </View>
  ),
}

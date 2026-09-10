import type { Meta, StoryObj } from '@storybook/react-vite'
import { View, Text } from 'react-native'
import { Surface } from '../../components/ui/surface/Surface'
import { useOnSurfaceColor } from '../../components/ui/surface/SurfaceContext'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardInset,
} from '../../components/ui/card/Card'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { surfaceBackground } from '../../theme/surface-planes'
import { liftStyle, LIFT_RIM_ALPHA, type LiftStep } from '../../theme/lift'
import { grainForTone } from '../../theme/materials'

/**
 * Lab/Depth — the Gate 2 specimen for the 2026-09-08 depth correction.
 *
 * Every row is the same three cards (one, two, three planes above the page)
 * under one treatment, so the operator compares treatments by looking rather
 * than by number. The CONTROL row is what shipped before the correction: a
 * grey-900 card with a 0.10 hairline ring and no shadow, which is what the
 * ActiveWork reader measured in the browser.
 *
 * Delete this file once the decision is recorded in Foundations/Depth.
 */
const meta: Meta = {
  title: 'Lab/Depth/Correction - Gate 2',
  tags: ['status:lab', '!status:review'],
  parameters: { layout: 'fullscreen' },
}
export default meta

/** paperSheet's hero rim, the alternative the default was chosen against. */
const HERO_RIM = 0.2

function Label({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: useOnSurfaceColor('tertiary'),
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  )
}

function Body({ title, sub }: { title: string; sub: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ color: useOnSurfaceColor('primary'), fontSize: 14, fontWeight: '600' }}>
        {title}
      </Text>
      <Text style={{ color: useOnSurfaceColor('secondary'), fontSize: 12 }}>{sub}</Text>
    </View>
  )
}

/** A hand-built card so a treatment can be shown exactly, outside the component. */
function RawCard({
  hex,
  style,
  title,
  sub,
}: {
  hex: string
  style: Record<string, unknown>
  title: string
  sub: string
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 200,
        padding: 14,
        borderRadius: 8,
        backgroundColor: hex,
        ...style,
      }}
    >
      <Body title={title} sub={sub} />
    </View>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 28 }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', gap: 16 }}>{children}</View>
    </View>
  )
}

const STEPS: LiftStep[] = [1, 2, 3]
const PLANE_OF: Record<LiftStep, 'elevated' | 'raised' | 'overlay'> = {
  1: 'elevated',
  2: 'raised',
  3: 'overlay',
  4: 'overlay',
  5: 'overlay',
}

function TreatmentRows({ mode }: { mode: ThemeMode }) {
  const c = getSemanticColors(mode)
  const hex = (step: LiftStep) => surfaceBackground(PLANE_OF[step], mode)
  const sub = (step: LiftStep) => `${PLANE_OF[step]} · ${hex(step)}`
  return (
    <>
      <Row label="CONTROL — WHAT SHIPPED: GREY-900, 0.10 HAIRLINE RING, NO SHADOW">
        {STEPS.map((step) => (
          <RawCard
            key={step}
            hex={c['surface-elevated']}
            style={{ borderWidth: 1, borderColor: c['hairline-subtle'] }}
            title={`card ${step}`}
            sub={`elevated · ${c['surface-elevated']} · ring`}
          />
        ))}
      </Row>
      <Row
        label={`A — CHOSEN: RIM ${LIFT_RIM_ALPHA[mode]} + AMBIENT SHADOW SCALED BY PLANES CROSSED`}
      >
        {STEPS.map((step) => (
          <RawCard
            key={step}
            hex={hex(step)}
            style={liftStyle(step, mode) as Record<string, unknown>}
            title={`+${step}`}
            sub={sub(step)}
          />
        ))}
      </Row>
      <Row label={`B — REJECTED FOR CARDS: PAPERSHEET HERO RIM ${HERO_RIM} + THE SAME SHADOW`}>
        {STEPS.map((step) => (
          <RawCard
            key={step}
            hex={hex(step)}
            style={liftStyle(step, mode, { rim: HERO_RIM }) as Record<string, unknown>}
            title={`+${step}`}
            sub={sub(step)}
          />
        ))}
      </Row>
      <Row label="C — REJECTED: A PLUS PAPERSHEET GRAIN (GRAIN STAYS HERO-ONLY)">
        {STEPS.map((step) => (
          <RawCard
            key={step}
            hex={hex(step)}
            style={{
              ...(liftStyle(step, mode) as Record<string, unknown>),
              backgroundImage: grainForTone(hex(step)),
            }}
            title={`+${step}`}
            sub={sub(step)}
          />
        ))}
      </Row>
      <Row label="D — TONE ONLY, NO TREATMENT (WHAT `FILLED` GIVES)">
        {STEPS.map((step) => (
          <RawCard key={step} hex={hex(step)} style={{}} title={`+${step}`} sub={sub(step)} />
        ))}
      </Row>
    </>
  )
}

export const Treatments: StoryObj = {
  name: '1 · Treatments side by side (dark)',
  render: () => (
    <Surface level="base" style={{ padding: 28, minHeight: '100vh' as never }}>
      <TreatmentRows mode="dark" />
    </Surface>
  ),
}

export const LightMode: StoryObj = {
  name: '2 · The same rows, light',
  render: () => (
    <Surface theme="light" level="base" style={{ padding: 28, minHeight: '100vh' as never }}>
      <TreatmentRows mode="light" />
    </Surface>
  ),
}

export const Floating: StoryObj = {
  name: '3 · Floating: ring vs rim',
  render: () => {
    const c = getSemanticColors('dark')
    return (
      <Surface level="base" style={{ padding: 28, minHeight: '100vh' as never }}>
        <Row label="LEFT: SHIPPED FLOATING (SHADOW + HAIRLINE-STRONG RING) · RIGHT: LIFT 4 (RIM + THREE-LAYER SHADOW, NO RING)">
          <View
            style={{ flex: 1, padding: 40, backgroundColor: c['surface-raised'], borderRadius: 8 }}
          >
            <RawCard
              hex={c['surface-overlay']}
              style={{
                borderWidth: 1,
                borderColor: c['hairline-strong'],
                ...(liftStyle(4, 'dark', { rim: 0 }) as Record<string, unknown>),
              }}
              title="Popover"
              sub="overlay · ring + shadow"
            />
          </View>
          <View
            style={{ flex: 1, padding: 40, backgroundColor: c['surface-raised'], borderRadius: 8 }}
          >
            <RawCard
              hex={c['surface-overlay']}
              style={liftStyle(4, 'dark') as Record<string, unknown>}
              title="Popover"
              sub="overlay · rim + shadow"
            />
          </View>
        </Row>
      </Surface>
    )
  },
}

export const Composed: StoryObj = {
  name: '4 · Through the components: Card on Surface, nested',
  render: () => (
    <Surface level="base" style={{ padding: 28, minHeight: '100vh' as never, gap: 20 }}>
      <Label>DEFAULT CARDS ON THE PAGE (RAISED, LIFT 2) · INSIDE: INSET, NOT A SECOND LIFT</Label>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        {['Open loops', 'Brief', 'Tasks'].map((title) => (
          <Card key={title} style={{ flex: 1 }}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>Two planes up from the page, rim + shadow</CardDescription>
            </CardHeader>
            <CardContent>
              <Text className="text-text-secondary text-sm">
                Body copy sits on the card plane. Grouped content inside recesses instead of lifting
                again.
              </Text>
              <View style={{ height: 12 }} />
              <CardInset className="p-3">
                <Text className="text-text-primary text-sm">CardInset · elevated, recessed</Text>
              </CardInset>
            </CardContent>
          </Card>
        ))}
      </View>
      <Label>OUTLINE AND SUBTLE STAY ON THE HOST PLANE (OPT-IN EDGE, NO LIFT)</Label>
      <View style={{ flexDirection: 'row', gap: 16 }}>
        <Card variant="outline" style={{ flex: 1 }}>
          <CardContent>
            <Text className="text-text-primary">outline · hairline-strong</Text>
          </CardContent>
        </Card>
        <Card variant="subtle" style={{ flex: 1 }}>
          <CardContent>
            <Text className="text-text-primary">subtle · hairline-subtle</Text>
          </CardContent>
        </Card>
        <Card variant="filled" style={{ flex: 1 }}>
          <CardContent>
            <Text className="text-text-primary">filled · tone only, two planes up</Text>
          </CardContent>
        </Card>
      </View>
    </Surface>
  ),
}

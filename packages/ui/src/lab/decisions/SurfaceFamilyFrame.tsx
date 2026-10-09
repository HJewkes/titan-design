import { Text, View } from 'react-native'
import { Alert } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonText } from '../../components/ui/button'
import { Pill } from '../../components/ui/pill'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import {
  EXISTING,
  FAMILY_HUES,
  fmt,
  neutralSolidPair,
  readOnPlanes,
  solidPair,
  subtlePair,
  worst,
  type SurfacePair,
} from './surface-family'
import { Caption, FrameHeader, HueCarrier, LiveChip, ModeFrame } from './SurfaceFamilyView'

export type FamilyKind = 'solid' | 'subtle'

const RULE: Record<FamilyKind, Record<ThemeMode, string>> = {
  solid: {
    light: 'Every hue at step 600, one label: white. Neutral is grey[700].',
    dark: 'The shipped status steps (300 to 500), one label: grey[950]. Neutral is grey[200].',
  },
  subtle: {
    light: 'Fill hue[100], label hue[700]: one ramp-relative rule for every hue.',
    dark: 'Fill hue[300] at 12% over the plane, label hue[300]: one ramp-relative rule.',
  },
}

function pairsOf(kind: FamilyKind, mode: ThemeMode): SurfacePair[] {
  if (kind === 'subtle') return FAMILY_HUES.map((hue) => subtlePair(hue, mode))
  return [...FAMILY_HUES.map((hue) => solidPair(hue, mode)), neutralSolidPair(mode)]
}

function existingOf(pair: SurfacePair): string {
  return pair.hue === 'neutral' ? 'status-neutral (TD-777)' : EXISTING[pair.hue]
}

function PlaneTiles({
  pair,
  mode,
  kind,
}: {
  pair: SurfacePair
  mode: ThemeMode
  kind: FamilyKind
}) {
  return readOnPlanes(pair, mode).map((r) => (
    <View
      key={r.plane.token}
      className="gap-stack-sm rounded-md p-inset-sm"
      style={{ backgroundColor: r.plane.swatch.hex }}
    >
      <LiveChip pair={pair} plane={r.plane.swatch.hex} />
      <Caption>{`on ${r.plane.swatch.label}`}</Caption>
      <Caption>
        {kind === 'solid'
          ? `label ${fmt(r.label)} · fill ${fmt(r.fill)}`
          : `label ${fmt(r.label)} · wash ${fmt(r.fill)}`}
      </Caption>
    </View>
  ))
}

/** The shipped components painted with the pair, on the mode's chart plane. */
function Components({
  pair,
  kind,
  mode,
}: {
  pair: SurfacePair
  kind: FamilyKind
  mode: ThemeMode
}) {
  const name = pair.hue
  return (
    <View
      className="rounded-md p-inset-sm"
      style={{ backgroundColor: getSemanticColors(mode)['surface-base'] }}
    >
      <HueCarrier pair={pair} kind={kind}>
        <Badge variant={kind} color="error">{`${name} badge`}</Badge>
        <Pill variant={kind} tone="error">{`${name} pill`}</Pill>
        <Alert status="error" variant={kind} message={`${name} alert`} />
        {kind === 'solid' ? (
          // Button reads the dark on-colour in both modes today (TD-773); the family's label is set here.
          <Button color="error" style={{ color: pair.on.hex } as object}>
            <ButtonText>{`${name} button`}</ButtonText>
          </Button>
        ) : null}
      </HueCarrier>
    </View>
  )
}

function HueRow({ pair, mode, kind }: { pair: SurfacePair; mode: ThemeMode; kind: FamilyKind }) {
  const readings = readOnPlanes(pair, mode)
  return (
    <View className="flex-row flex-wrap items-center gap-inline-md" testID={`row-${pair.hue}`}>
      <View className="w-48 gap-stack-sm">
        <Text className="text-sm font-semibold text-text-primary">{pair.hue}</Text>
        <Caption>{`${pair.fillLabel} + ${pair.on.label}`}</Caption>
        <Caption>{`worst label ${fmt(worst(readings, 'label'))}`}</Caption>
        <Caption>{`today: ${existingOf(pair)}`}</Caption>
      </View>
      <PlaneTiles pair={pair} mode={mode} kind={kind} />
      <Components pair={pair} kind={kind} mode={mode} />
    </View>
  )
}

export function FamilyFrame({ kind, mode }: { kind: FamilyKind; mode: ThemeMode }) {
  return (
    <ModeFrame mode={mode}>
      <FrameHeader title={`${kind} surfaces, ${mode}`} summary={RULE[kind][mode]} />
      {pairsOf(kind, mode).map((pair) => (
        <HueRow key={pair.hue} pair={pair} mode={mode} kind={kind} />
      ))}
    </ModeFrame>
  )
}

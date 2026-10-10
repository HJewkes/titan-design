import { View } from 'react-native'
import { Alert } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Pill } from '../../components/ui/pill'
import { compositeOver } from '../../theme/color-checks'
import type { ThemeMode } from '../../theme/tokens/semantic'
import {
  AA,
  SUBTLE_PACKAGES,
  TONES,
  fmt,
  readOn,
  subtleCell,
  textPlanes,
  type Plane,
  type SubtlePackage,
  type Tone,
} from './foundations'
import {
  Caption,
  CellCarrier,
  FrameHeader,
  MissSwatch,
  ModeFrame,
  PlaneTile,
} from './FoundationsKit'

const LINES: Record<ThemeMode, string[]> = {
  light: [
    'Three packages, one unit each. Every unit sets the six tones as subtle Pill, Badge and Alert on every text plane.',
    'Package 2 (fill 100, label 700, td-487) was measured on a white page. On 3b the page is grey 100.',
    'A label under AA is drawn as a swatch with its ratio, never as live text.',
  ],
  dark: [
    'Three packages, one unit each. Every unit sets the six tones as subtle Pill, Badge and Alert on every text plane.',
    'Package 1 retires the alpha washes. Its dark fill is a candidate step (hue 900), shown here, not decided.',
    'A label under AA is drawn as a swatch with its ratio, never as live text.',
  ],
}

function ToneCell({
  pkg,
  tone,
  plane,
  mode,
}: {
  pkg: SubtlePackage
  tone: Tone
  plane: Plane
  mode: ThemeMode
}) {
  const cell = subtleCell(pkg.id, tone, mode)
  const reading = readOn(cell, plane)
  const painted = { hex: compositeOver(cell.fill, plane.swatch.hex), label: cell.fillLabel }
  return (
    <View className="w-52 gap-1" testID={`cell-${pkg.id}-${tone}-${plane.level}`}>
      {reading.label >= AA ? (
        <CellCarrier subtle={cell}>
          <Pill variant="subtle" tone="error">{`${tone} pill`}</Pill>
          <Badge variant="subtle" color="error">{`${tone} badge`}</Badge>
          <Alert status="error" variant="subtle" size="compact" message={`${tone} alert`} />
        </CellCarrier>
      ) : (
        <MissSwatch fill={painted} label={cell.on} ratio={reading.label} />
      )}
      <Caption>{`fill ${cell.fillLabel} · label ${cell.on.label}`}</Caption>
      <Caption>{`label ${fmt(reading.label)} · fill vs plane ${fmt(reading.fill)}`}</Caption>
    </View>
  )
}

function PackageUnit({ pkg, mode }: { pkg: SubtlePackage; mode: ThemeMode }) {
  return (
    <View className="gap-stack-md" testID={`unit-${pkg.id}`}>
      <FrameHeader title={pkg.title} lines={[pkg.rule[mode]]} />
      {textPlanes(mode).map((plane) => (
        <PlaneTile key={plane.level} hex={plane.swatch.hex}>
          <Caption>{`${plane.level} ${plane.token} · ${plane.swatch.label}`}</Caption>
          <View className="flex-row flex-wrap gap-inline-md">
            {TONES.map((tone) => (
              <ToneCell key={tone} pkg={pkg} tone={tone} plane={plane} mode={mode} />
            ))}
          </View>
        </PlaneTile>
      ))}
    </View>
  )
}

export function Fd4SubtleFrame({ mode }: { mode: ThemeMode }) {
  return (
    <ModeFrame mode={mode} testID={`fd4-subtle-${mode}`}>
      <FrameHeader title={`FD4 · subtle recipe, ${mode}`} lines={LINES[mode]} />
      {SUBTLE_PACKAGES.map((pkg) => (
        <PackageUnit key={pkg.id} pkg={pkg} mode={mode} />
      ))}
    </ModeFrame>
  )
}

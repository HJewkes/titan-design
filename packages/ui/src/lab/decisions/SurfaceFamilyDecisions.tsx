import { Text, View } from 'react-native'
import { Alert } from '../../components/ui/alert'
import { Badge } from '../../components/ui/badge'
import { Button, ButtonText } from '../../components/ui/button'
import { Pill } from '../../components/ui/pill'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import { fmt, type SurfacePair } from './surface-family'
import {
  D2_OPTIONS,
  readD1,
  readD5,
  readRuleA,
  type CrossModeReading,
  type D2Option,
  type D5Reading,
  type LabelledFill,
} from './surface-family-decisions'
import {
  Caption,
  FrameHeader,
  HueCarrier,
  LiveChip,
  MissSwatch,
  ModeFrame,
} from './SurfaceFamilyView'

const asPair = (f: LabelledFill): SurfacePair => ({
  hue: f.hue,
  fill: f.fill.hex,
  fillLabel: f.fill.label,
  on: f.label,
})

function OptionTitle({ title, summary }: { title: string; summary: string }) {
  return (
    <View className="gap-stack-sm">
      <Text className="text-sm font-semibold text-text-primary">{title}</Text>
      <Text className="text-xs text-text-primary">{summary}</Text>
    </View>
  )
}

/** D2: the two light options, each one unit. Misses are swatches; passes are live components. */
function D2Unit({ option }: { option: D2Option }) {
  const live = option.pairs.every((p) => p.ratio >= 4.5)
  return (
    <View className="gap-stack-md rounded-md bg-surface-base p-inset-md" testID={`d2-${option.id}`}>
      <OptionTitle title={option.title} summary={option.summary} />
      {option.pairs.map((p) =>
        live ? (
          <HueCarrier key={p.hue} pair={asPair(p)} kind="solid">
            <Caption>{`${p.fill.label} + white: ${fmt(p.ratio)}`}</Caption>
            <Badge variant="solid" color="error">{`${p.hue} badge`}</Badge>
            <Pill variant="solid" tone="error">{`${p.hue} pill`}</Pill>
            <Alert status="error" variant="solid" message={`${p.hue} alert`} />
            <Button color="error" style={{ color: p.label.hex } as object}>
              <ButtonText>{`${p.hue} button`}</ButtonText>
            </Button>
          </HueCarrier>
        ) : (
          <MissSwatch key={p.hue} fill={p.fill} label={p.label} ratio={p.ratio} />
        )
      )}
    </View>
  )
}

export function D2Frame() {
  return (
    <ModeFrame mode="light">
      <FrameHeader
        title="D2 · light brand and warning solids"
        summary="Every other light solid is hue[600] + white. Brand (orange) and warning (amber) ship at 500."
      />
      {D2_OPTIONS.map((o) => (
        <D2Unit key={o.id} option={o} />
      ))}
    </ModeFrame>
  )
}

function RuleAColumn({ mode }: { mode: ThemeMode }) {
  const plane = getSemanticColors(mode)['surface-base']
  return (
    <ModeFrame mode={mode}>
      <Text className="text-sm font-semibold text-text-primary">{`${mode}: label ${readRuleA(mode)[0].label.label}`}</Text>
      <View className="flex-row flex-wrap gap-inline-sm rounded-md bg-surface-base p-inset-sm">
        {readRuleA(mode).map((f) => (
          <View key={f.hue} className="gap-stack-sm">
            <LiveChip pair={asPair(f)} plane={plane} />
            <Caption>{fmt(f.ratio)}</Caption>
          </View>
        ))}
      </View>
    </ModeFrame>
  )
}

function CrossModeColumn({ mode, rows }: { mode: ThemeMode; rows: CrossModeReading[] }) {
  return (
    <ModeFrame mode={mode}>
      <Text className="text-sm font-semibold text-text-primary">{`${mode}: label ${rows[0].label.label}`}</Text>
      <View className="gap-stack-sm rounded-md bg-surface-base p-inset-sm">
        {rows.map((r) => (
          <View key={r.hue} className="gap-stack-sm">
            <MissSwatch fill={r.fill} label={r.label} ratio={r.ratio} />
            <Caption>{`  best 3:1 fill: ${r.best.fill.label} ${fmt(r.best.ratio)}`}</Caption>
          </View>
        ))}
      </View>
    </ModeFrame>
  )
}

export function D1Frame() {
  const { whiteInDark, grey950InLight } = readD1()
  return (
    <View className="gap-section-sm bg-background-base p-gutter-sm">
      <View className="gap-stack-md" testID="d1-a">
        <OptionTitle
          title="Reading A · same rule per mode (default)"
          summary="One label per set per mode: white on every light solid, grey[950] on every dark solid. Every pair clears AA."
        />
        <View className="flex-row flex-wrap gap-gutter-sm">
          <RuleAColumn mode="light" />
          <RuleAColumn mode="dark" />
        </View>
      </View>
      <View className="gap-stack-md" testID="d1-b">
        <OptionTitle
          title="Reading B · one label hex in both modes"
          summary="White in dark misses on every hue at every step that clears 3:1 on the dark planes; grey[950] in light misses on every light solid and reaches AA only on red, orange and amber at 500. Swatches, not live labels."
        />
        <View className="flex-row flex-wrap gap-gutter-sm">
          <CrossModeColumn mode="light" rows={grey950InLight} />
          <CrossModeColumn mode="dark" rows={whiteInDark} />
        </View>
      </View>
    </View>
  )
}

function D5Cell({ r, page }: { r: D5Reading; page: string }) {
  return (
    <View className="gap-stack-sm">
      <LiveChip pair={asPair(r)} plane={page} />
      <Caption>{`label ${fmt(r.ratio)}`}</Caption>
      <Caption>{`vs page ${fmt(r.vsPage)}${r.lighter ? ' lighter' : ''}`}</Caption>
    </View>
  )
}

export function D5Frame() {
  return (
    <ModeFrame mode="light">
      <FrameHeader
        title="D5 · light subtle step per page"
        summary="Top row per page: today's 100 + 700. Bottom row: the D5 rule, fill one hue step below the page's grey step, label fill + 600."
      />
      {readD5().map(({ page, context, rows }) => (
        <View
          key={page.label}
          className="gap-stack-md rounded-md p-inset-md"
          style={{ backgroundColor: page.hex }}
          testID={`d5-${page.label}`}
        >
          <Text className="text-sm font-semibold text-text-primary">{context}</Text>
          {(['today', 'rule'] as const).map((which) => (
            <View key={which} className="flex-row flex-wrap gap-inline-md">
              {rows.map((row) => (
                <D5Cell key={row.hue} r={row[which]} page={page.hex} />
              ))}
            </View>
          ))}
        </View>
      ))}
    </ModeFrame>
  )
}

import { vars } from 'nativewind'
import { Text, View } from 'react-native'
import { Alert } from '../../components/ui/alert'
import { Pill } from '../../components/ui/pill'
import { SurfaceContext } from '../../components/ui/surface/SurfaceContext'
import { lightThemeCSSVars } from '../../theme/config'
import { primitiveRamps } from '../../theme/tokens/primitives'
import { overrideProperties, resolveToken } from './light-tuning'
import { bestDarkLabel, contrastOn, rampName } from './light-tuning-changes'

/**
 * TD-666 (round 4): the warning solid Badge and Alert on amber[400], [500] and [600], each with
 * today's white label and with the existing darker ramp step that reads best on that fill. The
 * panel sits on the round 3 picks (r3Amber600); each row re-declares only the warning solid fill
 * and label on a wrapper, and the Alert follows the badge's fill as in round 3.
 */
const STEPS = [400, 500, 600] as const
const FLOOR = 4.5

interface Option {
  key: string
  fill: string
  label: string
  labelName: string
  ratio: number
}

function optionsFor(step: (typeof STEPS)[number]): Option[] {
  const fill = primitiveRamps.amber[step]
  const white = resolveToken('main', 'light', 'on-status-warning')
  const dark = bestDarkLabel(fill)
  return [
    {
      key: `amber${step}-white`,
      fill,
      label: white,
      labelName: 'white',
      ratio: contrastOn(white, fill),
    },
    {
      key: `amber${step}-dark`,
      fill,
      label: dark.hex,
      labelName: rampName(dark.hex),
      ratio: dark.ratio,
    },
  ]
}

function OptionRow({ option }: { option: Option }) {
  const passes = option.ratio >= FLOOR
  const local = vars({
    '--color-status-warning-solid': option.fill,
    '--color-status-warning': option.fill,
    '--color-on-status-warning': option.label,
  })
  return (
    <View className="min-w-[340px] flex-1 basis-[360px] gap-stack-xs" testID={option.key}>
      <View style={local} className="gap-stack-xs">
        <View className="flex-row">
          <Pill tone="warning" variant="solid" size="sm">
            warning solid
          </Pill>
        </View>
        <Alert status="warning" variant="solid" size="compact" message="warning: solid alert" />
      </View>
      <Text className="font-mono text-xs leading-4 text-text-secondary">
        {`${rampName(option.fill)} fill · ${option.labelName} label · Badge and Alert ` +
          `${option.ratio.toFixed(2)} / ${FLOOR} ${passes ? 'passes' : '✗ misses'}`}
      </Text>
    </View>
  )
}

/** Light only by construction: the wrapper re-declares the light theme, whatever the toolbar says. */
export function WarningSolidPanel() {
  return (
    <SurfaceContext.Provider value={{ mode: 'light', level: 'base' }}>
      <View
        style={[vars(lightThemeCSSVars), vars(overrideProperties('r3Amber600', 'light'))]}
        className="gap-stack-md bg-background-base p-gutter-sm"
        testID="warning-solid-panel"
      >
        <Text className="text-sm font-semibold text-text-primary">
          Round 4 · warning solid fill and label (TD-666)
        </Text>
        <Text className="font-mono text-xs leading-4 text-text-primary">
          Each fill shows today&apos;s white label and the existing darker ramp step with the most
          contrast on it. Every value is an existing ramp step; ratios are measured.
        </Text>
        {STEPS.map((step) => (
          <View
            key={step}
            className="flex-row flex-wrap gap-stack-md rounded-lg border border-hairline bg-surface-base p-inset-md"
          >
            {optionsFor(step).map((option) => (
              <OptionRow key={option.key} option={option} />
            ))}
          </View>
        ))}
      </View>
    </SurfaceContext.Provider>
  )
}

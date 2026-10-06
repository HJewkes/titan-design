import { vars } from 'nativewind'
import { View } from 'react-native'
import { Chip } from '../../components/ui/chip'
import { Progress, type ProgressColor } from '../../components/ui/progress'
import { chipLabelFix, chipRecipe, type TokenSet } from './light-tuning'
import type { Tone } from './light-tuning-pairs'

export const PROGRESS_COLOR: Record<Tone, ProgressColor> = {
  brand: 'primary',
  success: 'success',
  info: 'info',
  warning: 'warning',
  error: 'error',
}

const FILL_CLASS: Record<Tone, string> = {
  brand: 'bg-brand-primary',
  success: 'bg-status-success',
  info: 'bg-status-info',
  warning: 'bg-status-warning',
  error: 'bg-status-error',
}

/** Progress today, or the TD-490 neutral hairline track (a recipe, not a token: simulated). */
export function ProgressSample({
  tone,
  isProposed,
  label,
}: {
  tone: Tone
  isProposed: boolean
  label: string
}) {
  if (!isProposed) {
    return <Progress value={60} color={PROGRESS_COLOR[tone]} accessibilityLabel={label} />
  }
  return (
    <View
      className="h-2 w-full overflow-hidden rounded-full bg-hairline"
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <View className={`h-full w-3/5 rounded-full ${FILL_CLASS[tone]}`} />
    </View>
  )
}

/** Selected Chip today (solid), or the set's simulated recipe (TD-490, TD-624). */
export function SelectedChip({ set }: { set: TokenSet }) {
  const recipe = chipRecipe(set)
  if (!recipe) {
    return (
      <Chip variant="solid" color="primary">
        Selected
      </Chip>
    )
  }
  if (recipe.solidFill) {
    return (
      <View style={vars({ '--color-brand-primary-solid': recipe.solidFill })}>
        <Chip variant="solid" color="primary">
          Selected
        </Chip>
      </View>
    )
  }
  return (
    <View style={vars({ '--color-on-brand-primary-subtle': recipe.label ?? '' })}>
      <Chip variant="subtle" color="primary" style={{ borderWidth: 1, borderColor: recipe.border }}>
        Selected
      </Chip>
    </View>
  )
}

/** Unselected Chip, with the set's label fix (TD-624) riding a local text-secondary. */
export function UnselectedChip({ set }: { set: TokenSet }) {
  const fix = chipLabelFix(set)
  const chip = <Chip>Unselected</Chip>
  return fix ? <View style={vars({ '--color-text-secondary': fix })}>{chip}</View> : chip
}

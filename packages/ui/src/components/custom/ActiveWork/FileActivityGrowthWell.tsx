import { View } from 'react-native'
import { CardInset } from '../../ui/card/Card'
import { SparkBars } from '../charts'
import { Typography } from '../../ui/typography'
import { Eyebrow } from '../../ui/eyebrow'
import { formatCompact, formatSignedCompact } from '../../../utils/number-format'
import { resolveColor } from '../../../theme/resolve-color'
import type { FileActivity } from './FileActivityRow'

/**
 * Growth stats are *char deltas* — a measurement moving up or down — so they take
 * the `result-*` family, not `status-*`. A file that net-shrank was refactored,
 * not broken. See TOKENS.md §1.
 */
const GROWTH_COLOR = {
  added: resolveColor('result-improve'),
  removed: resolveColor('result-degrade'),
  neutral: resolveColor('result-neutral'),
} as const

function GrowthStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View className="flex-1 gap-0.5">
      <Eyebrow>{label}</Eyebrow>
      <Typography variant="mono" className="text-lg font-bold" style={{ color }}>
        {value}
      </Typography>
    </View>
  )
}

type GrowthWellFile = Pick<FileActivity, 'path' | 'timeline'> & {
  sessions: number
  charsAdded: number
  charsRemoved: number
  netGrowth: number
}

export function GrowthWell({ file }: { file: GrowthWellFile }) {
  const grew = file.netGrowth >= 0

  return (
    <CardInset className="gap-2 rounded-lg p-3" testID="growth-well">
      <View className="flex-row items-center justify-between">
        <Eyebrow>Net change over sessions</Eyebrow>
        <Typography
          variant="mono"
          className="text-sm font-bold"
          style={{ color: grew ? GROWTH_COLOR.added : GROWTH_COLOR.removed }}
        >
          {`${formatSignedCompact(file.netGrowth)} ch`}
        </Typography>
      </View>
      <SparkBars
        values={file.timeline}
        height={34}
        label={`Per-session net char change for ${file.path}`}
      />
      <View className="flex-row gap-4">
        <GrowthStat
          label="Added"
          value={`+${formatCompact(file.charsAdded)}`}
          color={GROWTH_COLOR.added}
        />
        <GrowthStat
          label="Removed"
          value={`-${formatCompact(file.charsRemoved)}`}
          color={GROWTH_COLOR.removed}
        />
        <GrowthStat label="Sessions" value={String(file.sessions)} color={GROWTH_COLOR.neutral} />
      </View>
    </CardInset>
  )
}

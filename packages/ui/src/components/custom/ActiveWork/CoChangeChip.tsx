// Font mapping: font-heading=Space Grotesk, font-body=Nunito Sans (UI), font-sans=Inter (body)
import { View } from 'react-native'
import { Card } from '../../ui/card'
import { Pill } from '../../ui/pill'
import { Typography } from '../Typography'
import { FilePathLabel } from './FilePathLabel'

export interface CoChangeChipProps {
  /** One side of the pair. */
  a: string
  /** The other side. Order is not meaningful — co-change is symmetric. */
  b: string
  /** How many sessions changed both files. */
  count: number
  className?: string
}

/**
 * CoChangeChip — one symmetric "these two files change together" pair.
 *
 * Only basenames are shown: at chip size the directory is noise, and the pair
 * is a pointer into {@link FileActivityDetail} rather than a full identifier.
 * Used by {@link FileHistoryExplorer}'s repo-wide co-change strip.
 */
export function CoChangeChip({ a, b, count, className }: CoChangeChipProps) {
  return (
    <Card
      variant="filled"
      className={`gap-1 p-2.5 ${className ?? ''}`}
      accessibilityRole="text"
      accessibilityLabel={`${a} and ${b} changed together ${count} times`}
      testID="co-change-chip"
    >
      <View className="flex-row items-center gap-2">
        <FilePathLabel path={a} size="sm" baseOnly />
        <Typography variant="caption" className="text-text-tertiary">
          ↔
        </Typography>
        <FilePathLabel path={b} size="sm" baseOnly />
        <Pill variant="subtle" color="primary" size="xs">
          {`${count}×`}
        </Pill>
      </View>
    </Card>
  )
}

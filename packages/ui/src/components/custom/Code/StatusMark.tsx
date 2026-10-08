import type { ViewProps } from 'react-native'
import { Pill, type PillSizeLevel } from '../../ui/pill'
import { changeLabel, changeName, changeTone } from './code-status'
import type { CodeChangeKind } from './types'

export interface StatusMarkProps extends Omit<ViewProps, 'children'> {
  kind: CodeChangeKind
  /** Score change, after minus before. Shown for worsened and improved; ignored for the other kinds. */
  delta?: number
  /** Raises worsened from warning to error. The app decides it. */
  isOverCutoff?: boolean
  /** Pill size; default `sm`. */
  size?: Exclude<PillSizeLevel, 'lg'>
  className?: string
}

/** The change vocabulary of the Code family: one Pill, named in words for assistive tech. */
export function StatusMark({
  kind,
  delta,
  isOverCutoff,
  size = 'sm',
  className,
  ...viewProps
}: StatusMarkProps) {
  return (
    <Pill
      {...viewProps}
      variant="subtle"
      tone={changeTone(kind, isOverCutoff)}
      size={size}
      className={className}
      role="img"
      aria-label={changeName(kind, delta)}
    >
      {changeLabel(kind, delta)}
    </Pill>
  )
}

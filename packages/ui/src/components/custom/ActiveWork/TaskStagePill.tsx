import { Pill, type PillSizeLevel } from '../../ui/pill'
import { TASK_STAGE_META, type TaskStage } from './task-stage'

export interface TaskStagePillProps {
  stage: TaskStage
  size?: PillSizeLevel
  className?: string
}

/**
 * The one renderer of a stage outside the board columns; label and tone come from the stage table.
 * A stage missing from the table (a wire value cast through) shows its raw text on a neutral pill.
 */
export function TaskStagePill({ stage, size = 'sm', className }: TaskStagePillProps) {
  const { label, tone } = TASK_STAGE_META[stage] ?? { label: String(stage), tone: 'neutral' }
  return (
    <Pill
      variant="subtle"
      tone={tone}
      size={size}
      leading="dot"
      className={className}
      testID={`task-stage-pill-${stage}`}
    >
      {label}
    </Pill>
  )
}

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { axe } from 'jest-axe'
import { TaskStagePill } from './TaskStagePill'
import { TASK_STAGE_META, TASK_STAGE_ORDER } from './task-stage'

describe('TaskStagePill', () => {
  it('renders the label from the stage table for every stage', () => {
    for (const stage of TASK_STAGE_ORDER) {
      const { unmount } = render(<TaskStagePill stage={stage} />)
      expect(screen.getByText(TASK_STAGE_META[stage].label)).toBeInTheDocument()
      unmount()
    }
  })

  it('shows a tone dot beside the label', () => {
    render(<TaskStagePill stage="review" />)
    expect(screen.getByTestId('task-stage-pill-review-dot')).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<TaskStagePill stage="in-progress" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

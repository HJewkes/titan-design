import { describe, it, expect } from 'vitest'
import { axe } from 'jest-axe'
import { render, screen } from '@testing-library/react'
import { LiveFatigueCard } from './LiveFatigueCard'
import { FATIGUE_STATES, WARMING_UP_MODEL } from './fatigue-mock'
import { GHOST_GUTTER } from './GhostSpark'
import {
  CARD_WIDTH_BASE,
  COMPACT_CHART_GAP,
  COMPACT_CHART_HEIGHT,
  ROM_BAR_HEIGHT_BASE,
  cardSections,
} from './panel-layout'
import { resolveAll, spacingClassesAt } from '../../../test/spacing-resolver'

const model = FATIGUE_STATES[3].model

describe('LiveFatigueCard', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<LiveFatigueCard model={model} width={318} height={508} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('composes the verdict hero, lights, ROM chart and ghost spark', () => {
    render(<LiveFatigueCard model={model} width={318} height={508} />)
    expect(screen.getByTestId('live-fatigue-card')).toBeInTheDocument()
    expect(screen.getByTestId('verdict-hero')).toBeInTheDocument()
    expect(screen.getByTestId('fatigue-lights')).toBeInTheDocument()
    expect(screen.getByTestId('rom-progression')).toBeInTheDocument()
    expect(screen.getByTestId('ghost-spark')).toBeInTheDocument()
  })

  it('shows the verdict word from the model', () => {
    render(<LiveFatigueCard model={model} />)
    expect(screen.getByText('Form breaking down')).toBeInTheDocument()
  })

  it('renders a warming-up (cold start) model without a verdict', () => {
    render(<LiveFatigueCard model={WARMING_UP_MODEL} width={318} height={508} />)
    expect(screen.getByText('Warming up')).toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

/**
 * The card's spacing, pinned (AW-142 wave three).
 *
 * The top group's 12px gap is the numeric rung `gap-3`: it is a vertical gap and the
 * stack ramp runs 4 / 8 / 16 / 24, so 12 has no semantic key. `PAD` stays 18 and stays a
 * number — two MEASURED constants in `panel-layout` count it twice.
 */
describe('LiveFatigueCard geometry resolves to the spacing tokens', () => {
  it('spaces the top group by gap-3', () => {
    render(<LiveFatigueCard model={model} width={318} height={508} />)
    expect(spacingClassesAt(screen.getByTestId('verdict-hero').parentElement)).toEqual(['gap-3'])
    expect(resolveAll(['gap-3'])).toEqual(['12px'])
  })

  // 318 wide, less the card's 18px padding and the spark's own gutter on each side.
  it('sizes the plot against the spark gutter it actually renders', () => {
    render(<LiveFatigueCard model={model} width={318} height={508} />)
    const spark = screen.getByTestId('ghost-spark')
    expect(GHOST_GUTTER).toBe(4)
    expect(spark).toHaveStyle({ paddingLeft: '4px', paddingRight: '4px' })
    expect(spark.querySelector('svg')).toHaveAttribute('width', String(318 - 18 * 2 - 4 * 2))
  })
})

/** The ghost-spark svg's rendered size. */
function sparkSize() {
  const svg = screen.getByTestId('ghost-spark').querySelector('svg')
  return { width: Number(svg?.getAttribute('width')), height: Number(svg?.getAttribute('height')) }
}

describe('LiveFatigueCard layouts (TD-326)', () => {
  it('defaults to the column, with no compact chart row', () => {
    render(<LiveFatigueCard model={model} width={318} height={508} />)
    expect(screen.queryByTestId('live-fatigue-card-charts')).not.toBeInTheDocument()
    expect(sparkSize().height).toBe(cardSections('column', 508).sparkHeight)
  })

  it('puts the compact charts side by side, each at half the content width', () => {
    render(<LiveFatigueCard model={model} width={568} layout="compact" />)
    expect(screen.getByTestId('live-fatigue-card-charts')).toHaveStyle({ flexDirection: 'row' })
    expect(spacingClassesAt(screen.getByTestId('live-fatigue-card-head'))).toEqual([
      'gap-x-inline-lg',
      'gap-y-3',
    ])
    const half = Math.floor((568 - 18 * 2 - COMPACT_CHART_GAP) / 2)
    expect(sparkSize()).toEqual({ width: half - GHOST_GUTTER * 2, height: COMPACT_CHART_HEIGHT })
  })

  it('grows the wall card charts to fill the height instead of leaving a void', () => {
    render(<LiveFatigueCard model={model} width={422} height={820} layout="fill" />)
    const { sparkHeight, romHeight } = cardSections('fill', 820)
    expect(sparkSize().height).toBe(sparkHeight)
    expect(romHeight).toBeGreaterThan(ROM_BAR_HEIGHT_BASE)
  })

  it('has no accessibility violations in the compact arrangement', async () => {
    const { container } = render(<LiveFatigueCard model={model} width={568} layout="compact" />)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('LiveFatigueCard default width', () => {
  it('defaults to the panel layout card width base', () => {
    render(<LiveFatigueCard model={model} />)
    expect(screen.getByTestId('live-fatigue-card')).toHaveStyle({ width: `${CARD_WIDTH_BASE}px` })
  })
})

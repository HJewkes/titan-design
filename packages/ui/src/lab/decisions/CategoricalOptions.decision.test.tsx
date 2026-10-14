import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { composeStories } from '@storybook/react-vite'
import preview from '../../../.storybook/preview'
import { compositeOver, contrast } from '../../theme/color-checks'
import { getElevationSurface } from '../../theme/elevation'
import { getSemanticColors, type ThemeMode } from '../../theme/tokens/semantic'
import * as stories from './CategoricalOptions.decision.stories'
import {
  CATEGORICAL_OPTIONS,
  OPTION_PLANES,
  measureOption,
  optionById,
  planeColors,
  statusErrorAccent,
  type CategoricalOptionId,
  type LabelMode,
} from './categorical-options'

const composed = composeStories(stories, { decorators: preview.decorators })

/** The option record prints two decimals; the story must agree with it to 0.05. */
const TOLERANCE = 0.05
const MODES: readonly ThemeMode[] = ['light', 'dark']

const measured = (id: CategoricalOptionId, mode: ThemeMode) => measureOption(optionById(id), mode)

function expectNear(actual: number[], planned: number[]) {
  expect(actual).toHaveLength(planned.length)
  actual.forEach((value, i) =>
    expect(Math.abs(value - planned[i]), `#${i}`).toBeLessThanOrEqual(TOLERANCE)
  )
}

interface Planned {
  under: [number, number]
  /** AA passes for white, ink and ramp, then the ramp step the ramp mode settled on. */
  labels: [number, number, number, number]
  /** All-pairs minimum ΔE through slot 5: deutan, protan, tritan. */
  cvd: [number, number, number]
  /** Console, then agents, at 3:1 on both shell planes. */
  shell: [boolean, boolean]
}

const DARK_CURRENT: Planned = {
  under: [1, 0],
  labels: [1, 6, 5, 950],
  cvd: [8.34, 13.92, 5.23],
  shell: [true, true],
}

/** The option record's summary row per option and mode. */
const PLAN: Record<CategoricalOptionId, Record<ThemeMode, Planned>> = {
  'O1-current': {
    light: { under: [4, 2], labels: [4, 3, 3, 950], cvd: [4.87, 7.3, 6.08], shell: [true, false] },
    dark: DARK_CURRENT,
  },
  'O2-bprime': {
    light: { under: [4, 3], labels: [3, 4, 4, 950], cvd: [8.65, 10.9, 2.53], shell: [false, true] },
    dark: DARK_CURRENT,
  },
  'O3-solid': {
    light: { under: [3, 0], labels: [5, 2, 2, 50], cvd: [2.16, 3.44, 3.28], shell: [true, false] },
    dark: { under: [0, 0], labels: [0, 7, 6, 950], cvd: [2.69, 9.28, 4.7], shell: [true, true] },
  },
  'O4-subtle': {
    light: { under: [7, 7], labels: [0, 7, 7, 950], cvd: [0.2, 1.14, 0.44], shell: [false, false] },
    dark: { under: [0, 0], labels: [0, 7, 7, 950], cvd: [0.2, 1.14, 0.44], shell: [true, true] },
  },
  'O5-ink': {
    light: { under: [1, 0], labels: [6, 1, 5, 50], cvd: [8.83, 9.14, 8.68], shell: [false, true] },
    dark: { under: [0, 0], labels: [0, 7, 6, 950], cvd: [8.34, 13.92, 5.23], shell: [true, true] },
  },
}

const LABEL_ORDER: readonly LabelMode[] = ['white', 'ink', 'ramp']

describe('Categorical options decision', () => {
  it.each(CATEGORICAL_OPTIONS.flatMap((o) => MODES.map((mode) => [o.id, mode] as const)))(
    'measures %s in %s as the option record prints it',
    (id, mode) => {
      const m = measured(id, mode)
      const plan = PLAN[id][mode]
      expect([m.under3, m.under2]).toEqual(plan.under)
      expect(LABEL_ORDER.map((label) => m.labels[label].passAA)).toEqual(plan.labels.slice(0, 3))
      expect(m.labels.ramp.rampStep).toBe(plan.labels[3])
      expectNear([m.cvd.deutan.min, m.cvd.protan.min, m.cvd.tritan.min], plan.cvd)
      expect(m.shell.map((accent) => accent.passes)).toEqual(plan.shell)
    }
  )

  it('measures the 3b light planes and the dark elevation planes', () => {
    const light = getSemanticColors('light')
    expect(planeColors('light')).toEqual(OPTION_PLANES.map((plane) => light[plane.token]))
    expect(planeColors('dark')).toEqual([
      getElevationSurface(-1, 'dark'),
      getElevationSurface(0, 'dark'),
      getElevationSurface(1, 'dark'),
      getElevationSurface(2, 'dark'),
      getElevationSurface(3, 'dark'),
    ])
  })

  it("prints B' red[400] and blue[500] on the light planes as PR #794 records them", () => {
    const light = measured('O2-bprime', 'light')
    expectNear(light.slots[2].planes, [1.82, 2.31, 2.58, 2.77, 2.77])
    expectNear(light.slots[0].planes, [2.05, 2.61, 2.9, 3.12, 3.12])
    expectNear(light.slots[4].planes, [4.27, 5.42, 6.03, 6.5, 6.5])
  })

  it('names the weakest CVD pairs the record calls out', () => {
    expect(measured('O1-current', 'light').cvd.deutan.pair).toEqual([2, 4])
    expect(measured('O2-bprime', 'light').cvd.tritan.pair).toEqual([2, 3])
    expect(measured('O3-solid', 'light').cvd.deutan.pair).toEqual([1, 5])
    expect(measured('O3-solid', 'dark').cvd.deutan.pair).toEqual([1, 5])
    expect(measured('O4-subtle', 'light').cvd.deutan.pair).toEqual([0, 5])
  })

  it('finds a per-hue ramp label never beats white or ink on any option', () => {
    for (const option of CATEGORICAL_OPTIONS) {
      for (const mode of MODES) {
        const { white, ink, ramp } = measureOption(option, mode).labels
        expect(ramp.passAA, `${option.id} ${mode}`).toBeLessThanOrEqual(
          Math.max(white.passAA, ink.passAA)
        )
      }
    }
  })

  it('holds status-error at 3:1 on both shell planes in both modes, the variant A console accent', () => {
    for (const mode of MODES) expect(statusErrorAccent(mode).passes, mode).toBe(true)
    expectNear(statusErrorAccent('light').planes, [3.01, 4.24])
    expectNear(statusErrorAccent('dark').planes, [4.59, 3.75])
  })

  it('finds the dark *-subtle washes within 1.3:1 of surface-base, so O4 has no dark counterpart', () => {
    const dark = getSemanticColors('dark') as Record<string, string>
    const washes = [
      'status-info-subtle',
      'status-error-subtle',
      'brand-primary-subtle',
      'status-success-subtle',
      'brand-secondary-subtle',
      'status-warning-subtle',
    ]
    for (const token of washes) {
      const over = compositeOver(dark[token], dark['surface-base'])
      expect(contrast(over, dark['surface-base']), token).toBeLessThanOrEqual(1.3)
    }
  })

  it('renders every option in both modes on the Default story', () => {
    render(<composed.Default />)
    for (const option of CATEGORICAL_OPTIONS) {
      for (const mode of MODES) {
        expect(screen.getByTestId(`option-${option.id}-${mode}`)).toBeTruthy()
      }
    }
  })

  it('renders one option in both modes on each option story', () => {
    const perOption: [CategoricalOptionId, () => React.ReactElement][] = [
      ['O1-current', () => <composed.Current />],
      ['O2-bprime', () => <composed.BPrime />],
      ['O3-solid', () => <composed.Solid />],
      ['O4-subtle', () => <composed.Subtle />],
      ['O5-ink', () => <composed.Ink />],
    ]
    for (const [id, story] of perOption) {
      const { unmount } = render(story())
      expect(screen.getAllByTestId(/^option-/)).toHaveLength(2)
      expect(screen.getByTestId(`option-${id}-light`)).toBeTruthy()
      unmount()
    }
  })
})

import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { capturedByNode } from '../../../test/classname-capture'
import { Metric, MetricGroup, type MetricProps } from './Metric'

// Pins the markup every pre-`align`/`tone` story and test rendered, so the move to `ui/metric`
// and the two new props provably leave existing callers byte-identical. NativeWind never runs
// under vitest, so the DOM alone carries no class; each element's captured `className` rides along.
function characterise(container: HTMLElement): string {
  const classes = Array.from(container.querySelectorAll('*'), (node) => capturedByNode.get(node))
  return [container.innerHTML, ...classes.map((c, i) => `${i}: ${c ?? '(none)'}`)].join('\n')
}

const cases: [string, MetricProps][] = [
  ['Default', { value: '42', label: 'Total Reps' }],
  ['WithUnit', { value: '1.24', label: 'Peak Velocity', unit: 'm/s' }],
  ['WithTrendUp', { value: '85', label: 'Performance', trend: 'up' }],
  ['WithTrendDown', { value: '62', label: 'Fatigue Index', trend: 'down' }],
  ['WithTrendNeutral', { value: '70', label: 'Consistency', trend: 'neutral' }],
  ['FullMetric', { value: '0.98', label: 'Mean Velocity', unit: 'm/s', trend: 'up', size: 'lg' }],
  ['Small', { value: '12', label: 'Sets', size: 'sm' }],
  ['Large', { value: '315', label: 'Max Load', unit: 'lbs', size: 'lg' }],
  ['md', { value: '42', label: 'Reps', size: 'md' }],
  ['a test id', { value: '42', label: 'Reps', testID: 'metric' }],
  [
    'class overrides',
    {
      value: '42',
      label: 'Reps',
      className: 'items-start',
      valueClassName: 'leading-none',
      labelClassName: 'text-sm',
    },
  ],
]

describe('Metric characterisation', () => {
  it.each(cases)('renders the %s case unchanged', (_name, props) => {
    const { container } = render(<Metric {...props} />)
    expect(characterise(container)).toMatchSnapshot()
  })

  it('renders the default-size group unchanged', () => {
    const { container } = render(
      <MetricGroup>
        <Metric value="12" label="Sets" />
        <Metric value="42" label="Reps" />
        <Metric value="1.24" label="Avg Velocity" unit="m/s" trend="up" />
      </MetricGroup>
    )
    expect(characterise(container)).toMatchSnapshot()
  })

  it('renders the small group unchanged', () => {
    const { container } = render(
      <MetricGroup>
        <Metric value="8" label="Sets" size="sm" />
        <Metric value="315" label="Load" unit="lbs" size="sm" />
        <Metric value="0.82" label="Velocity" unit="m/s" size="sm" trend="down" />
        <Metric value="92" label="Score" size="sm" trend="up" />
      </MetricGroup>
    )
    expect(characterise(container)).toMatchSnapshot()
  })
})

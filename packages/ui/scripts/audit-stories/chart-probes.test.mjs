import { describe, expect, it } from 'vitest'
import {
  CHART_LABEL_CLIP,
  CHART_LABEL_COLLISION,
  KINDS,
  RULES,
  judge,
  judgeChartLabelClip,
  judgeChartLabelCollision,
} from './chart-probes.mjs'
import { PROBE_RULES } from './probe-suite.mjs'

const svg = (w = 300, h = 150) => ({
  id: '0',
  parent: null,
  selector: '.chart',
  tag: 'svg',
  box: [0, 0, w, h],
})
// A label whose ink spans [x, y, w, h] on one line.
const label = (i, [x, y, w, h], extra = {}) => ({
  id: `0.${i}`,
  parent: '0',
  selector: `.l${i}`,
  tag: 'text',
  box: [x, y, w, h],
  text: { left: x, right: x + w, first: { inkTop: y }, last: { inkBottom: y + h } },
  ...extra,
})
const layoutOf = (...nodes) => ({ nodes })

describe('chart probe module contract', () => {
  it('maps both kinds to DR-CH-04 and registers in the suite', () => {
    expect(KINDS).toEqual([CHART_LABEL_COLLISION, CHART_LABEL_CLIP])
    expect(RULES).toEqual({ [CHART_LABEL_COLLISION]: 'DR-CH-04', [CHART_LABEL_CLIP]: 'DR-CH-04' })
    expect(PROBE_RULES[CHART_LABEL_COLLISION]).toBe('DR-CH-04')
    expect(PROBE_RULES[CHART_LABEL_CLIP]).toBe('DR-CH-04')
  })

  it('tolerates empty, null and text-free layouts', () => {
    expect(judge(undefined)).toEqual([])
    expect(judge(layoutOf())).toEqual([])
    expect(judge(layoutOf(svg()))).toEqual([])
  })
})

describe('judgeChartLabelCollision', () => {
  it('flags overlapping labels once, on the later one', () => {
    const found = judgeChartLabelCollision(
      layoutOf(svg(), label(1, [10, 10, 40, 12]), label(2, [30, 14, 40, 12]))
    )
    expect(found).toEqual([
      {
        kind: CHART_LABEL_COLLISION,
        selector: '.l2',
        detail: 'label overlaps .l1 by 20×8px (limit 1px)',
      },
    ])
  })

  it('accepts labels that only touch or sit apart', () => {
    const found = judgeChartLabelCollision(
      layoutOf(
        svg(),
        label(1, [10, 10, 40, 12]),
        label(2, [50, 10, 40, 12]),
        label(3, [10, 40, 40, 12])
      )
    )
    expect(found).toEqual([])
  })

  it('does not compare labels of different charts', () => {
    const other = { ...svg(), id: '1', selector: '.other' }
    const l2 = label(2, [10, 10, 40, 12], { id: '1.0', parent: '1' })
    expect(
      judgeChartLabelCollision(layoutOf(svg(), label(1, [10, 10, 40, 12]), other, l2))
    ).toEqual([])
  })

  it('judges one label (one-point chart) and skips a label with no ink', () => {
    const blank = label(2, [0, 0, 0, 0], { text: null, box: undefined, ink: null })
    expect(judgeChartLabelCollision(layoutOf(svg(), label(1, [10, 10, 40, 12]), blank))).toEqual([])
  })
})

describe('judgeChartLabelClip', () => {
  it('flags a long label running past the right edge', () => {
    const found = judgeChartLabelClip(layoutOf(svg(), label(1, [250, 10, 90, 12])))
    expect(found).toEqual([
      {
        kind: CHART_LABEL_CLIP,
        selector: '.l1',
        detail: 'label ink past .chart edge: right 40px (limit 0.5px)',
      },
    ])
  })

  it('names every clipped side', () => {
    const [f] = judgeChartLabelClip(layoutOf(svg(), label(1, [-5, -3, 20, 12])))
    expect(f.detail).toBe('label ink past .chart edge: left 5px, top 3px (limit 0.5px)')
  })

  it('accepts labels inside, including those flush with the edge', () => {
    expect(judgeChartLabelClip(layoutOf(svg(), label(1, [0, 0, 300, 150])))).toEqual([])
  })

  it('ignores text outside any svg', () => {
    const html = label(1, [500, 500, 40, 12], { parent: null, id: '9' })
    expect(judgeChartLabelClip(layoutOf(svg(), html))).toEqual([])
  })
})

describe('transformed labels and overflow', () => {
  it('uses the collector svgInk over line ink for a rotated label', () => {
    const rotated = label(1, [150, 20, 12, 12], { svgInk: [150, -80, 12, 100] })
    const [f] = judgeChartLabelClip(layoutOf(svg(), rotated))
    expect(f.detail).toBe('label ink past .chart edge: top 80px (limit 0.5px)')
  })

  it('finds a collision between rotated labels along their length', () => {
    const a = label(1, [100, 100, 12, 12], { svgInk: [94, 40, 12, 70] })
    const b = label(2, [106, 100, 12, 12], { svgInk: [100, 30, 12, 80] })
    expect(judgeChartLabelCollision(layoutOf(svg(), a, b))).toHaveLength(1)
  })

  it('does not report a clip inside an svg with overflow visible', () => {
    const visible = { ...svg(), overflow: 'visible' }
    expect(judgeChartLabelClip(layoutOf(visible, label(1, [250, 10, 90, 12])))).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { contrast } from '../color-checks'
import { primitiveRamps as ramp } from './primitives'
import { getSemanticColors } from './semantic'

const light = getSemanticColors('light')

const SUBTLE_TONES = [
  { tone: 'brand-primary', ramp: ramp.orange },
  { tone: 'brand-secondary', ramp: ramp.cyan },
  { tone: 'status-success', ramp: ramp.green },
  { tone: 'status-error', ramp: ramp.red },
  { tone: 'status-warning', ramp: ramp.amber },
  { tone: 'status-info', ramp: ramp.blue },
] as const

describe('light subtle faces', () => {
  it.each(SUBTLE_TONES)('$tone label clears 4.5:1 on its subtle fill', ({ tone }) => {
    const label = light[`on-${tone}-subtle`]
    const fill = light[`${tone}-subtle`]

    expect(contrast(label, fill)).toBeGreaterThanOrEqual(4.5)
  })

  it.each(SUBTLE_TONES)('$tone pairs a ramp[700] label with a ramp[100] fill', ({ tone, ramp }) => {
    expect(light[`${tone}-subtle`]).toBe(ramp[100])
    expect(light[`on-${tone}-subtle`]).toBe(ramp[700])
  })
})

describe('light solid faces', () => {
  it('white clears 4.5:1 on the success solid fill', () => {
    expect(
      contrast(light['on-status-success'], light['status-success-solid'])
    ).toBeGreaterThanOrEqual(4.5)
  })

  it('warning solid is amber[500]', () => {
    expect(light['status-warning-solid']).toBe(ramp.amber[500])
  })
})

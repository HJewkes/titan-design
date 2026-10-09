import { describe, expect, it } from 'vitest'
import { D3_OPTIONS, D4_OPTIONS, readOption } from './categorical-one-label'

const at2 = (n: number) => Number(n.toFixed(2))
const option = (id: string) => [...D3_OPTIONS, ...D4_OPTIONS].find((o) => o.id === id)!

describe('categorical one label (plan §3)', () => {
  it('W2 clears AA with white on every slot, red lowest at 4.57, CVD 9.9', () => {
    const w2 = readOption(option('w2'))

    expect(at2(w2.worstLabel)).toBe(4.57)
    expect(Number(w2.cvd.toFixed(1))).toBe(9.9)
  })

  it('B′ reaches only a 3:1 floor with on-data-strong (green[700] 3.03, magenta[600] 3.60)', () => {
    const b = readOption(option('bprime-floor'))

    expect(at2(b.slots[4].label)).toBe(3.03)
    expect(at2(b.slots[1].label)).toBe(3.6)
  })

  it('D4: on-data-strong clears AA; grey[950] misses magenta[500] at 4.48; the swap costs CVD', () => {
    const strong = readOption(option('dark-on-data-strong'))
    const grey = readOption(option('dark-grey950'))
    const swapped = readOption(option('dark-grey950-magenta400'))

    expect(at2(strong.worstLabel)).toBe(5.04)
    expect(at2(grey.worstLabel)).toBe(4.48)
    expect(swapped.worstLabel).toBeGreaterThanOrEqual(4.5)
    expect(at2(strong.cvd)).toBe(8.34)
    expect(at2(swapped.cvd)).toBe(7.53)
  })
})

import { render, screen } from '@testing-library/react'
import { Text } from 'react-native'
import { describe, expect, it } from 'vitest'
import { Beat } from './Beat'
import { seekClock } from './clocks'
import { envelope, useBeatEnvelope } from './envelope'
import { MotionProvider } from './MotionProvider'

describe('envelope', () => {
  it.each([
    { t: -0.1, phase: 'before' },
    { t: 0.25, phase: 'in' },
    { t: 2, phase: 'hold' },
    { t: 3.75, phase: 'out' },
    { t: 4, phase: 'after' },
    { t: 4.1, phase: 'after' },
  ])('of 4 s with 0.5 s in and out is $phase at $t', ({ t, phase }) => {
    expect(envelope(t, 4, { inS: 0.5, outS: 0.5 }).phase).toBe(phase)
  })

  it('gives the hold whatever the window leaves', () => {
    expect(envelope(2, 4, { inS: 0.5, outS: 0.5 })).toEqual({
      phase: 'hold',
      inP: 1,
      outP: 0,
      holdT: 1.5,
      holdS: 3,
    })
    expect(envelope(3.75, 4, { inS: 0.5, outS: 0.5 }).outP).toBe(0.5)
  })

  it('compresses both the entrance and the exit when they overrun the window', () => {
    const at = (t: number) => envelope(t, 1, { inS: 0.6, outS: 0.6 })
    expect(at(0.25)).toMatchObject({ phase: 'in', inP: 0.5, holdS: 0 })
    expect(at(0.75)).toMatchObject({ phase: 'out', outP: 0.5 })
    expect(envelope(0.875, 1, { inS: 3, outS: 1 })).toMatchObject({
      phase: 'out',
      inP: 1,
      outP: 0.5,
    })
  })

  it('treats a missing entrance or exit as already done or not yet begun', () => {
    expect(envelope(0, 2)).toMatchObject({ phase: 'hold', inP: 1, outP: 0, holdS: 2 })
    expect(envelope(-1, 2)).toMatchObject({ phase: 'before', inP: 0, holdT: 0 })
    expect(envelope(2, 2).outP).toBe(1)
  })

  it('throws on a negative length', () => {
    expect(() => envelope(0, 1, { inS: -0.1 })).toThrow(RangeError)
    expect(() => envelope(0, -1)).toThrow(RangeError)
  })
})

function EnvelopeReading() {
  const { phase, inP, outP } = useBeatEnvelope({ inS: 0.5, outS: 0.5 })
  return <Text testID="envelope">{`${phase} ${inP} ${outP}`}</Text>
}

describe('useBeatEnvelope', () => {
  it.each([
    { at: 1.6, reading: 'before 0 0' },
    { at: 2.25, reading: 'in 0.5 0' },
    { at: 4.75, reading: 'out 1 0.5' },
    { at: 5.2, reading: 'after 1 1' },
  ])('reads beat-local time at $at s in a beat from 2 s to 5 s', ({ at, reading }) => {
    render(
      <MotionProvider clock={seekClock(at)}>
        <Beat startS={2} durationS={3}>
          <EnvelopeReading />
        </Beat>
      </MotionProvider>
    )
    expect(screen.getByTestId('envelope').textContent).toBe(reading)
  })
})

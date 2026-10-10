import { describe, expect, it } from 'vitest'
import { greyRamp, primitiveColors, primitiveRamps as ramp } from './primitives'
import { getSemanticColors, type ThemeMode } from './semantic'

/**
 * Decision 0004: the colour family cells, and the six tone roles that alias them.
 *
 * Each member has four cells per mode, every one a ramp step. The role keeps its own
 * name and takes the cell's value, so a role that drifts off its cell, or a cell that
 * goes missing, fails here, as does a cell that leaves its decided step.
 */
const MODES: ThemeMode[] = ['dark', 'light']

const ROLE_HUE = [
  ['brand-primary', 'orange'],
  ['brand-secondary', 'cyan'],
  ['status-success', 'green'],
  ['status-warning', 'amber'],
  ['status-error', 'red'],
  ['status-info', 'blue'],
] as const

const ALIAS_PAIRS = ROLE_HUE.flatMap(([role, hue]) => [
  [`${role}-solid`, `tint-${hue}-solid`],
  [`on-${role}`, `on-tint-${hue}`],
  [`${role}-subtle`, `tint-${hue}-subtle`],
  [`on-${role}-subtle`, `on-tint-${hue}-subtle`],
])

type Cells = { solid: string; on: string; subtle: string; onSubtle: string }

const white = primitiveColors.white
const hueCells = (h: keyof typeof ramp, solid: number, subtle: number, onSubtle: number) => ({
  solid: ramp[h][solid as keyof (typeof ramp)[typeof h]],
  subtle: ramp[h][subtle as keyof (typeof ramp)[typeof h]],
  onSubtle: ramp[h][onSubtle as keyof (typeof ramp)[typeof h]],
})

/** Light: the decision 0003 ladder under white; hue 100 under hue 700; grey 700 and grey 200. */
const LIGHT: Record<string, Cells> = {
  red: { on: white, ...hueCells('red', 600, 100, 700) },
  orange: { on: white, ...hueCells('orange', 500, 100, 700) },
  amber: { on: white, ...hueCells('amber', 500, 100, 700) },
  green: { on: white, ...hueCells('green', 600, 100, 700) },
  cyan: { on: white, ...hueCells('cyan', 600, 100, 700) },
  blue: { on: white, ...hueCells('blue', 600, 100, 700) },
  magenta: { on: white, ...hueCells('magenta', 600, 100, 700) },
  neutral: { solid: greyRamp[700], on: white, subtle: greyRamp[200], onSubtle: greyRamp[800] },
}

/** Dark: the shipped step under grey 950; hue 900 under hue 300; grey 200 and grey 800. */
const DARK: Record<string, Cells> = {
  red: { on: greyRamp[950], ...hueCells('red', 500, 900, 300) },
  orange: { on: greyRamp[950], ...hueCells('orange', 400, 900, 300) },
  amber: { on: greyRamp[950], ...hueCells('amber', 300, 900, 300) },
  green: { on: greyRamp[950], ...hueCells('green', 300, 900, 300) },
  cyan: { on: greyRamp[950], ...hueCells('cyan', 500, 900, 300) },
  blue: { on: greyRamp[950], ...hueCells('blue', 500, 900, 300) },
  magenta: { on: greyRamp[950], ...hueCells('magenta', 400, 900, 300) },
  neutral: {
    solid: greyRamp[200],
    on: greyRamp[950],
    subtle: greyRamp[800],
    onSubtle: greyRamp[200],
  },
}

describe('colour family cells (decision 0004)', () => {
  describe.each([
    ['light', LIGHT],
    ['dark', DARK],
  ] as const)('%s', (mode, expected) => {
    const colors: Record<string, string> = getSemanticColors(mode)

    it.each(Object.entries(expected))('%s sits on its decided steps', (member, cells) => {
      expect(colors[`tint-${member}-solid`]).toBe(cells.solid)
      expect(colors[`on-tint-${member}`]).toBe(cells.on)
      expect(colors[`tint-${member}-subtle`]).toBe(cells.subtle)
      expect(colors[`on-tint-${member}-subtle`]).toBe(cells.onSubtle)
    })
  })
})

describe('tone roles alias their family cells (decision 0004)', () => {
  it('names the 24 alias pairs', () => {
    expect(ALIAS_PAIRS).toHaveLength(24)
  })

  describe.each(MODES)('%s', (mode) => {
    const colors: Record<string, string> = getSemanticColors(mode)

    it.each(ALIAS_PAIRS)('%s equals %s', (role, cell) => {
      expect(colors[cell], `${cell} is missing`).toMatch(/^#[0-9A-F]{6}$/i)
      expect(colors[role]).toBe(colors[cell])
    })
  })

  it('moves the light info solid to the ladder step through the alias', () => {
    expect(getSemanticColors('light')['status-info-solid']).toBe(ramp.blue[600])
  })
})

import { describe, expect, it } from 'vitest'
import { insetFieldFill } from './insetField'
import { surfaceBackground, type SurfaceLevel } from './SurfaceContext'

const PLANES: SurfaceLevel[] = ['background', 'base', 'elevated', 'raised', 'overlay']

describe('insetFieldFill', () => {
  it('gives every light plane colour one well, its own colour, never the grey 400 frame', () => {
    const wells = PLANES.map((level) => insetFieldFill(level, 'light'))

    expect(wells).toEqual(PLANES.map((level) => surfaceBackground(level, 'light')))
    expect(wells).toEqual(['#EDEAE7', '#FFFFFF', '#F9F6F3', '#EDEAE7', '#FFFFFF'])
  })

  it('steps each dark plane one plane down, so a lighter plane has a lighter well', () => {
    const wells = PLANES.map((level) => insetFieldFill(level, 'dark'))

    expect(wells).toEqual(['#100D0A', '#1C1916', '#252321', '#2C2A28', '#31302F'])
  })
})

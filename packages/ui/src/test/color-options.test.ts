import { createRequire } from 'node:module'

type Options = {
  rungsByRole: Record<string, string[]>
  colorsByRoot: Record<string, string[]>
  onSurfaceRoles: string[]
}
type ColorOptions = {
  classOptions: (id: string, value: string, before?: string) => string[]
  styleOptions: string
  washRungs: (prop: string, token: string) => string[]
  optionList: (options: string[]) => string
}

const colorOptions = createRequire(import.meta.url)('../../eslint-rules/color-options') as {
  fromOptions: (options: Options) => ColorOptions
  optionList: (options: string[]) => string
  MAX_OPTIONS: number
}

const fixture = {
  rungsByRole: {
    'status-error': ['DEFAULT', 'subtle', 'foo'],
    surface: ['base', 'raised'],
    scrim: ['DEFAULT', 'bar'],
    data: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  },
  colorsByRoot: { 'on-brand': ['on-brand-baz'], surface: ['surface-base'] },
  onSurfaceRoles: ['primary', 'quux'],
}
const { classOptions, styleOptions, washRungs } = colorOptions.fromOptions(fixture)

describe('color-options: derived from fix-options, not hand-kept', () => {
  it('lists the rungs of the role a palette hue maps to', () => {
    expect(classOptions('twPalette', 'bg-red-500')).toEqual([
      'bg-status-error',
      'bg-status-error-subtle',
      'bg-status-error-foo',
    ])
  })

  it('maps neutrals to the role the utility paints and other hues to data', () => {
    expect(classOptions('twPalette', 'bg-slate-800')).toEqual([
      'bg-surface-base',
      'bg-surface-raised',
    ])
    expect(classOptions('twPalette', 'bg-purple-500')).toHaveLength(10)
  })

  it('maps white to the on-colour classes and black to the scrim rungs', () => {
    expect(classOptions('twAchromatic', 'text-white')).toEqual(['text-on-brand-baz'])
    expect(classOptions('twAchromatic', 'bg-black')).toEqual(['bg-scrim', 'bg-scrim-bar'])
  })

  it('names every on-surface role in the style options', () => {
    expect(styleOptions).toContain("`useOnSurfaceColor('primary'|'quux')`")
  })

  it('lists only the non-default rungs a token publishes', () => {
    expect(washRungs('bg', 'scrim')).toEqual(['bg-scrim-bar'])
    expect(washRungs('bg', 'divider')).toEqual([])
  })

  it('caps a rendered option list at MAX_OPTIONS', () => {
    const rendered = colorOptions.optionList(classOptions('twPalette', 'bg-purple-500'))
    expect(rendered.split(', ')).toHaveLength(colorOptions.MAX_OPTIONS)
  })
})

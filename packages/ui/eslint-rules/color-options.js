/**
 * The fix options colour lint messages list (TD-193, TD-23 S3).
 *
 * Every class and role named here comes from `fix-options.js`, so a message
 * never offers a class the config does not publish. `fromOptions` is pure so a
 * test can run it on fixture options; the module exports it bound to the real
 * ones.
 */

const fixOptions = require('./fix-options')

const MAX_OPTIONS = 8

/** A Tailwind palette hue that carries a meaning -> the status role that owns it. */
const HUE_ROLE = {
  red: 'status-error',
  green: 'status-success',
  amber: 'status-warning',
  yellow: 'status-warning',
  blue: 'status-info',
  sky: 'status-info',
}

const NEUTRAL_HUES = new Set(['slate', 'gray', 'zinc', 'neutral', 'stone'])

/** A neutral colour's role by the utility that paints it; any other utility paints a surface. */
const NEUTRAL_ROLE = {
  text: 'text',
  border: 'hairline',
  divide: 'hairline',
  ring: 'hairline',
  outline: 'hairline',
}

const COLOR_PROP =
  /(bg|text|border|fill|stroke|ring|outline|divide|shadow|from|via|to|decoration|caret|accent)(?:-[a-z]+)?-$/

const tick = (option) => `\`${option}\``

/** Backticked and capped at MAX_OPTIONS, as the message contract asks. */
const optionList = (options) => options.slice(0, MAX_OPTIONS).map(tick).join(', ')

const classOf = (prop, role, rung) =>
  rung === 'DEFAULT' ? `${prop}-${role}` : `${prop}-${role}-${rung}`

function paletteRole(prop, hue) {
  if (HUE_ROLE[hue]) return HUE_ROLE[hue]
  if (NEUTRAL_HUES.has(hue)) return NEUTRAL_ROLE[prop] ?? 'surface'
  return 'data'
}

function fromOptions({ rungsByRole, colorsByRoot, onSurfaceRoles }) {
  const familyClasses = (prop, role) =>
    (rungsByRole[role] ?? []).map((rung) => classOf(prop, role, rung))

  const onColorClasses = () =>
    Object.entries(colorsByRoot)
      .filter(([root]) => root.startsWith('on-'))
      .flatMap(([, names]) => names.map((name) => `text-${name}`))

  /** `bg-red-500`, `text-white`, or `[#fff]` with the text before it -> the classes to write instead. */
  function classOptions(id, value, before = '') {
    const [prop, hue] = value.split('-')
    if (id === 'twPalette') return familyClasses(prop, paletteRole(prop, hue))
    if (id === 'twAchromatic') return hue === 'white' ? onColorClasses() : familyClasses('bg', 'scrim')
    const arbitraryProp = COLOR_PROP.exec(before)?.[1] ?? 'bg'
    return familyClasses(arbitraryProp, NEUTRAL_ROLE[arbitraryProp] ?? 'surface')
  }

  const roles = onSurfaceRoles.map((role) => `'${role}'`).join('|')
  const styleOptions = `${tick(`useOnSurfaceColor(${roles})`)} for text on a surface, or ${tick('resolveColor(token)')} for any other token`

  /** The wash rungs `token` publishes, as `prop` classes; empty when it publishes none. */
  const washRungs = (prop, token) =>
    (rungsByRole[token] ?? [])
      .filter((rung) => rung !== 'DEFAULT')
      .map((rung) => classOf(prop, token, rung))

  return { classOptions, familyClasses, styleOptions, washRungs, optionList }
}

module.exports = { ...fromOptions(fixOptions), fromOptions, MAX_OPTIONS }

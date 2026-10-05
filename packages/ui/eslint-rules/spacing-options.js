/**
 * The fix options spacing and type lint messages list (TD-194, TD-23 S4).
 *
 * Steps, `space.*` keys, classes, font sizes and Typography variants all come
 * from `fix-options.js`, so a message never offers a step the config does not
 * publish. `fromOptions` is pure so a test can run it on fixture options; the
 * module exports it bound to the real ones.
 */

const fixOptions = require('./fix-options')
const { optionList } = require('./color-options')

const tick = (option) => `\`${option}\``

/** The 4px scale without its zero step: zero is never a spacing value to point at. */
const positive = (step) => (step && step.px > 0 ? step : undefined)

function fromOptions({ nearestSpacing, fontSizes, typographyVariants }) {
  const neighbours = (px) => {
    const { below, above } = nearestSpacing(px)
    const steps = [positive(below), positive(above)].filter(Boolean)
    // On a step, `below` and `above` are the same step: name it once.
    return steps.filter((step, i) => i === 0 || step.px !== steps[0].px)
  }

  const describeStep = (step) =>
    step.spaceKeys.length ? `${step.px} (${optionList(step.spaceKeys)})` : String(step.px)

  /** `9` -> "use 8 (`space.stack.md`, …) or 10 (`space.control.y.lg`)". */
  function spacingAdvice(px) {
    return `use ${neighbours(Math.abs(px)).map(describeStep).join(' or ')}`
  }

  /** `gap`, 13 -> [`gap-3`, `gap-3.5`]: the scale classes either side of the value. */
  const nearestClasses = (prop, px) => neighbours(px).map((step) => `${prop}-${step.key}`)

  const typeOptions = `a Typography variant (${typographyVariants.map((name) => tick(`variant="${name}"`)).join(', ')}) or a font-size class (${fontSizes
    .map((key) => tick(`text-${key}`))
    .join(', ')})`

  return { spacingAdvice, nearestClasses, typeOptions }
}

module.exports = { ...fromOptions(fixOptions), fromOptions }

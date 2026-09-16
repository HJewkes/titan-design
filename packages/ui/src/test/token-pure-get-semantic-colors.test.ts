import { RuleTester } from 'eslint'
import { builtinRules } from 'eslint/use-at-your-own-risk'
import config from '../../eslint.config.js'

const noRestrictedSyntax = builtinRules.get('no-restricted-syntax')

// Reads the live selector out of eslint.config.js instead of copying it here,
// so a future edit to the token-pure block can't drift out of sync with this
// test unnoticed (VW-381).
function findGetSemanticColorsOption() {
  for (const entry of config) {
    const options = entry.rules?.['no-restricted-syntax']
    if (!Array.isArray(options)) continue
    const match = options.find(
      (o: { selector?: string }) =>
        typeof o === 'object' && o.selector?.includes('getSemanticColors')
    )
    if (match) return match
  }
  throw new Error('token-pure getSemanticColors restriction not found in eslint.config.js')
}

const restriction = findGetSemanticColorsOption()

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

// RuleTester.run() must sit directly in the describe body, not nested inside
// an `it()`: under Vitest's globals it registers its own nested `it`s, and
// one raised inside an already-running `it` is silently dropped — the test
// then reports as passing regardless of what the rule does.
describe('token-pure getSemanticColors restriction', () => {
  ruleTester.run('no-restricted-syntax', noRestrictedSyntax as never, {
    valid: [
      // The exact render-time form the rule's own message recommends (VW-381).
      { code: 'const t = getSemanticColors(useSurfaceMode())', options: [restriction] },
      // Reached through a namespace import is the same shape.
      { code: 'const t = theme.getSemanticColors(useSurfaceMode())', options: [restriction] },
    ],
    invalid: [
      // Positive control: the frozen literal-mode call the rule exists to catch.
      {
        code: "const t = getSemanticColors('dark')",
        options: [restriction],
        errors: [{ message: restriction.message }],
      },
      // A bare identifier arg is frozen too — it isn't the render-time form.
      {
        code: 'const t = getSemanticColors(mode)',
        options: [restriction],
        errors: [{ message: restriction.message }],
      },
    ],
  })
})

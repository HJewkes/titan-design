import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-local-formatter'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

// Fake, but real-shaped: everything after the rule's cwd is what baselineKey
// reads. No baseline for this filename, so every occurrence is unallowanced.
// (The formatter module itself is exempted in eslint.config.js via `ignores`,
// not inside the rule, so it isn't exercised here — see no-raw-color's
// src/theme/** exemption for the same split.)
const componentFile = '/repo/packages/ui/src/components/custom/Widget/Widget.tsx'

describe('no-local-formatter', () => {
  ruleTester.run('no-local-formatter', rule as never, {
    valid: [
      // A non-format-named local helper, even one that rounds, is fine.
      { code: 'function roundIt(v) { return Math.round(v) }', filename: componentFile },
      // Calling an imported formatter isn't a local declaration.
      {
        code: "import { formatVelocity } from '../../../utils/workout-format'\nformatVelocity(v)",
        filename: componentFile,
      },
    ],
    invalid: [
      // Positive control: the exact gap VW-88 found — a local format*
      // function re-rolling what the shared module already does.
      {
        code: 'function formatFoo(v) { return v.toFixed(1) }',
        filename: componentFile,
        errors: [{ messageId: 'formatFn' }, { messageId: 'toFixed' }],
      },
      // An arrow assigned to a format*-named const is the same shape.
      {
        code: 'const formatBar = (v) => v.toFixed(2)',
        filename: componentFile,
        errors: [{ messageId: 'formatFn' }, { messageId: 'toFixed' }],
      },
      // A bare toFixed call with no wrapping function still counts.
      {
        code: 'const label = value.toFixed(2)',
        filename: componentFile,
        errors: [{ messageId: 'toFixed' }],
      },
    ],
  })
})

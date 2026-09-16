import { RuleTester } from 'eslint'
import * as tsParser from '@typescript-eslint/parser'
import rule from '../../eslint-rules/no-frozen-theme'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

// Fake paths: no baseline entry can match them, so the rule reports every
// occurrence here regardless of what frozen-theme-baseline.json records.
const componentFile = '/fake/packages/ui/src/components/custom/Fatigue/GhostBand.tsx'

// `ruleTester.run` must sit directly in the `describe` callback, not nested
// inside `it()` — nesting it inside `it()` makes RuleTester's internal
// assertions no-op silently (see no-raw-device-data-in-chat.test.ts).
describe('no-frozen-theme', () => {
  ruleTester.run('no-frozen-theme', rule as never, {
    valid: [
      // The convention: mode comes from the nearest Surface, at render time.
      {
        code: 'function Band() { const t = getSemanticColors(useSurfaceMode()); return t }',
        filename: componentFile,
      },
      // A mode parameter threaded through a helper is equally theme-aware.
      {
        code: 'export function tone(mode) { return getSemanticColors(mode)["status-error"] }',
        filename: componentFile,
      },
      // An arrow component body counts as inside a function.
      {
        code: 'const Band = () => getSemanticColors(useSurfaceMode())',
        filename: componentFile,
      },
      // Only the call is checked — a type query names the function, never runs it.
      {
        code: 'type ColorToken = keyof ReturnType<typeof getSemanticColors>',
        filename: componentFile,
        languageOptions: { parser: tsParser },
      },
      // An unrelated call with a literal is not this rule's business.
      { code: "const t = getWorkoutColors('dark')", filename: componentFile },
    ],
    invalid: [
      // Positive control: the exact shape VW-88 gap 2 counted 38 times.
      {
        code: "const t = getSemanticColors('dark')",
        filename: componentFile,
        errors: [{ messageId: 'literalMode' }],
      },
      // A literal mode is frozen wherever it sits, including inside a component.
      {
        code: "function Band() { const t = getSemanticColors('light'); return t }",
        filename: componentFile,
        errors: [{ messageId: 'literalMode' }],
      },
      // Module scope freezes even a computed mode: it runs once, at import.
      {
        code: 'const t = getSemanticColors(DEFAULT_MODE)',
        filename: componentFile,
        errors: [{ messageId: 'moduleScope' }],
      },
      // Reached through a namespace import rather than a bare identifier.
      {
        code: "const t = semantic.getSemanticColors('dark')",
        filename: componentFile,
        errors: [{ messageId: 'literalMode' }],
      },
      // Both calls report: the allowance is per frozen value, not per file.
      {
        code: "const a = getSemanticColors('dark')\nconst b = getSemanticColors('dark')",
        filename: componentFile,
        errors: [{ messageId: 'literalMode' }, { messageId: 'literalMode' }],
      },
    ],
  })
})

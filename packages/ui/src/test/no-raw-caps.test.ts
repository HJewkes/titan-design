import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Linter, RuleTester, type Rule } from 'eslint'
import tseslint from 'typescript-eslint'
import baseline from '../../eslint-rules/no-raw-caps-baseline.json'
import { uiRoot } from './tailwind-compile'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../eslint.config.js') as Linter.Config[]

// One Linter per file: building it per fixture re-resolves the whole config each time (TD-732).
let linter: Linter | undefined
function sharedLinter(): Linter {
  return (linter ??= new Linter({ configType: 'flat' }))
}

// Required rather than imported: the rule is untyped CommonJS, and this gives it a type.
const rule = createRequire(import.meta.url)('../../eslint-rules/no-raw-caps') as Rule.RuleModule

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

// Outside the package, so no baseline entry applies and every site is unallowanced.
const componentFile = '/repo/packages/ui/src/components/custom/Widget/Widget.tsx'

const valid = (code: string) => ({ code, filename: componentFile })
const invalid = (code: string, ...messageIds: string[]) => ({
  code,
  filename: componentFile,
  errors: messageIds.map((messageId) => ({ messageId })),
})

/** The no-raw-caps messages the real config reports for `code` at a package-relative path. */
function lintAt(file: string, code: string): Linter.LintMessage[] {
  return sharedLinter()
    .verify(code, config, { filename: path.join(uiRoot, file) })
    .filter((m) => m.ruleId === 'titan/no-raw-caps')
}

describe('no-raw-caps', () => {
  ruleTester.run('no-raw-caps', rule, {
    valid: [
      valid("<Typography variant='overline' color='secondary'>{label}</Typography>"),
      valid("const c = 'text-xs font-semibold text-text-secondary'"),
      // normal-case undoes a caps treatment; it is not one.
      valid("const c = 'normal-case'"),
      valid("const c = 'text-[var(--size)]'"),
      // A type position names a value, it applies nothing.
      valid("type Case = 'uppercase' | 'none'"),
      valid('const s = { fontWeight: 600 }'),
    ],
    invalid: [
      invalid("<Text className='text-xs uppercase'>{label}</Text>", 'uppercase'),
      invalid("const c = 'web:uppercase md:!tracking-wide'", 'uppercase', 'tracking'),
      invalid("const c = 'tracking-[0.4px]'", 'tracking'),
      invalid("const c = 'text-[10px] text-[8.5px]'", 'arbitrarySize', 'arbitrarySize'),
      invalid('const c = `${base} uppercase`', 'uppercase'),
      // The property is the site; its string reports nothing more.
      invalid("const s = { textTransform: 'uppercase' }", 'textTransform'),
      invalid("const s = { textTransform: 'uppercase' as const }", 'textTransform'),
      invalid("const s = { 'letterSpacing': 1 }", 'letterSpacing'),
      invalid('<SvgText letterSpacing={1}>{label}</SvgText>', 'letterSpacing'),
    ],
  })
})

// Linting a fixture parses the whole config; the first one is slow under coverage.
describe('no-raw-caps under the real config', { timeout: 30_000 }, () => {
  const caps = "export const c = 'uppercase tracking-wider'"

  it('fails a new component file that hand-rolls caps', () => {
    for (const file of [
      'src/components/ui/widget/Widget.tsx',
      'src/components/custom/Workout/Widget.tsx',
      'src/components/shell/Widget.tsx',
    ]) {
      expect(lintAt(file, caps).map((m) => m.messageId)).toEqual(['uppercase', 'tracking'])
    }
  })

  it('leaves Typography, Eyebrow, stories, tests and the lab alone', () => {
    for (const file of [
      'src/components/ui/typography/Typography.tsx',
      'src/components/ui/eyebrow/Eyebrow.tsx',
      'src/components/ui/widget/Widget.stories.tsx',
      'src/components/ui/widget/Widget.test.tsx',
      'src/lab/x/X.tsx',
    ]) {
      expect(lintAt(file, caps)).toEqual([])
    }
  })

  it('names the role variants and the escape hatch', () => {
    const [message] = lintAt('src/components/ui/widget/Widget.tsx', caps)
    expect(message.message).toContain('variant="overline"')
    expect(message.message).toContain('variant="microLabel"')
    expect(message.message).toContain('eslint-disable-next-line titan/no-raw-caps')
  })

  it('reports a baselined site that is gone until the baseline is regenerated', () => {
    const [file] = Object.keys(baseline)
    const messages = lintAt(file, 'export const nothingShouts = 1')
    expect(messages.map((m) => m.messageId)).toEqual(['stale'])
    expect(messages[0].message).toContain('scripts/update-no-raw-caps-baseline.mjs')
  })
})

describe('no-raw-caps baseline', () => {
  it('names only files that exist', () => {
    const missing = Object.keys(baseline).filter((file) => !fs.existsSync(path.join(uiRoot, file)))
    expect(missing, 'regenerate the baseline after deleting a file').toEqual([])
  })
})

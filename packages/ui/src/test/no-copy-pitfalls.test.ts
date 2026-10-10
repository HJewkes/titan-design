import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Linter, RuleTester, type Rule } from 'eslint'
import baseline from '../../eslint-rules/no-copy-pitfalls-baseline.json'
import glossary from '../../eslint-rules/copy-glossary.json'
import { uiRoot } from './tailwind-compile'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../eslint.config.js') as Linter.Config[]

// Required rather than imported: the rule is untyped CommonJS, and this gives it a type.
const rule = createRequire(import.meta.url)(
  '../../eslint-rules/no-copy-pitfalls'
) as Rule.RuleModule

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

// Outside the package, so no baseline entry applies and every site is unallowanced.
const componentFile = '/repo/packages/ui/src/components/custom/Widget/Widget.jsx'

let linter: Linter | undefined
/** The no-copy-pitfalls messages the real config reports for `code` at a package-relative path. */
function lintAt(file: string, code: string): Linter.LintMessage[] {
  linter ??= new Linter({ configType: 'flat' })
  return linter
    .verify(code, config, { filename: path.join(uiRoot, file) })
    .filter((m) => m.ruleId === 'titan/no-copy-pitfalls')
}

const valid = (code: string) => ({ code, filename: componentFile })
const invalid = (code: string, ...messageIds: string[]) => ({
  code,
  filename: componentFile,
  errors: messageIds.map((messageId) => ({ messageId })),
})

describe('no-copy-pitfalls: spaced multiplication', () => {
  ruleTester.run('no-copy-pitfalls', rule as never, {
    valid: [
      valid('<Text>8×5</Text>'),
      valid('<Text>{sets} × {reps}</Text>'),
      valid("<Chip label='3x10' />"),
      // A class name or other non-display prop is never copy.
      valid("<View className='8 x 5' testID='8 × 5' />"),
    ],
    invalid: [
      invalid('<Text>8 × 5</Text>', 'times'),
      invalid("<Chip label='3 x 10' />", 'times'),
      invalid("<Chip label={done ? '3 ×10' : '3×10'} />", 'times'),
      invalid('<Text>{`${n} sets, 4 × 8`}</Text>', 'times'),
    ],
  })
})

describe('no-copy-pitfalls: all-caps words', () => {
  ruleTester.run('no-copy-pitfalls', rule as never, {
    valid: [
      valid('<Text>Rest</Text>'),
      // Three letters or fewer, and glossary terms, are allowed.
      valid('<Text>BPM at RPE 8, new PR</Text>'),
      valid("<Stat title='e1RM' />"),
      valid("const LABEL = 'TODAY'"),
      valid("<View accessibilityRole='HEADER' />"),
    ],
    invalid: [
      invalid('<Text>UPCOMING</Text>', 'caps'),
      invalid("<Section title='THIS WEEK' />", 'caps', 'caps'),
      invalid("<Input placeholder='SEARCH' />", 'caps'),
      invalid("<Badge accessibilityLabel='LIVE' />", 'caps'),
      invalid("<Card emptyText='NONE' />", 'caps'),
      invalid("<>{'DONE'}</>", 'caps'),
    ],
  })
})

describe('no-copy-pitfalls: ampersand', () => {
  ruleTester.run('no-copy-pitfalls', rule as never, {
    valid: [valid('<Text>Sets and reps</Text>'), valid('<Text>R&amp;D</Text>')],
    invalid: [
      invalid('<Text>Sets &amp; reps</Text>', 'ampersand'),
      invalid("<Tab label='Volume & trend' />", 'ampersand'),
    ],
  })
})

describe('no-copy-pitfalls: exclamation marks in errors', () => {
  ruleTester.run('no-copy-pitfalls', rule as never, {
    valid: [
      valid('<Text>Nice work!</Text>'),
      valid("<Alert status='success' message='Saved!' />"),
      valid("<Field errorMessage='Enter a weight.' />"),
    ],
    invalid: [
      invalid("<Field errorMessage='Invalid weight!' />", 'bang'),
      invalid("<Field error='Required!' />", 'bang'),
      invalid("<Alert status='error' message='Sync failed!' />", 'bang'),
      invalid("<Toast status='error'><ToastTitle>Failed!</ToastTitle></Toast>", 'bang'),
      invalid("<Alert color='error'><Text>{'Try again!'}</Text></Alert>", 'bang'),
    ],
  })
})

describe('no-copy-pitfalls under the real config', { timeout: 30_000 }, () => {
  it('fails a component that adds <Text>8 × 5</Text>', () => {
    const messages = lintAt(
      'src/components/ui/widget/Widget.tsx',
      'export const W = () => <Text>8 × 5</Text>'
    )
    expect(messages.map((m) => m.messageId)).toEqual(['times'])
  })

  it('covers custom/ and shell/ but leaves tests, stories and lab alone', () => {
    const code = 'export const W = () => <Text>8 × 5</Text>'
    expect(lintAt('src/components/custom/Widget/Widget.tsx', code)).toHaveLength(1)
    expect(lintAt('src/components/shell/Widget.tsx', code)).toHaveLength(1)
    expect(lintAt('src/components/ui/widget/Widget.stories.tsx', code)).toEqual([])
    expect(lintAt('src/components/ui/widget/Widget.test.tsx', code)).toEqual([])
    expect(lintAt('src/lab/widget/Widget.tsx', code)).toEqual([])
  })

  it('reports a baselined site that is gone until the baseline is regenerated', () => {
    const [file, allowances] = Object.entries(baseline)[0]
    const messages = lintAt(file, 'export const nothingShouts = 1')
    expect(messages.map((m) => m.messageId)).toEqual(Object.keys(allowances).map(() => 'stale'))
    expect(messages[0].message).toContain('scripts/update-no-copy-pitfalls-baseline.mjs')
  })

  it('spends a baselined allowance on the same fragment, not on a new one', () => {
    const file = 'src/components/custom/Workout/RestTimerBar.tsx'
    expect(baseline[file as keyof typeof baseline]).toEqual({ REST: 1 })
    expect(lintAt(file, 'export const T = () => <Text>REST</Text>')).toEqual([])
    const swapped = lintAt(file, 'export const T = () => <Text>PAUSE</Text>')
    expect(swapped.map((m) => m.messageId).sort()).toEqual(['caps', 'stale'])
  })
})

describe('no-copy-pitfalls baseline and glossary', () => {
  it('names only files that exist', () => {
    const missing = Object.keys(baseline).filter((file) => !fs.existsSync(path.join(uiRoot, file)))
    expect(missing, 'regenerate the baseline after deleting a file').toEqual([])
  })

  it('gives every glossary term a meaning', () => {
    for (const [term, meaning] of Object.entries(glossary.terms)) {
      expect(meaning, term).toMatch(/\S/)
    }
  })
})

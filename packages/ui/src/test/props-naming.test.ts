import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Linter, RuleTester, type Rule } from 'eslint'
import tseslint from 'typescript-eslint'
import baseline from '../../eslint-rules/props-naming-baseline.json'
import { uiRoot } from './tailwind-compile'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../eslint.config.js') as Linter.Config[]

// Required rather than imported: the rule is untyped CommonJS, and this gives it a type.
const rule = createRequire(import.meta.url)('../../eslint-rules/props-naming') as Rule.RuleModule

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    ecmaVersion: 2022,
    sourceType: 'module',
  },
})

// Outside the package, so no baseline entry applies and every site is unallowanced.
const componentFile = '/repo/packages/ui/src/components/custom/Widget/Widget.tsx'

const valid = (code: string) => ({ code, filename: componentFile })
// A message regex rather than messageId + data: RuleTester needs every placeholder for data.
const invalid = (code: string, ...fixes: string[]) => ({
  code,
  filename: componentFile,
  errors: fixes.map((fix) => ({
    message: new RegExp(`off the props convention[^]*Use \`${fix}\``),
  })),
})

/** The props-naming messages the real config reports for `code` at a package-relative path. */
function lintAt(file: string, code: string): Linter.LintMessage[] {
  return new Linter({ configType: 'flat' })
    .verify(code, config, { filename: path.join(uiRoot, file) })
    .filter((m) => m.ruleId === 'titan/props-naming')
}

describe('props-naming', () => {
  ruleTester.run('props-naming', rule, {
    valid: [
      valid('export interface WidgetProps { isDisabled?: boolean; onPress?: () => void }'),
      valid('export type WidgetProps = { isLoading: boolean; isSelected?: boolean }'),
      // Only a type whose name ends in Props is a component API.
      valid('export interface WidgetState { disabled: boolean; selected: boolean }'),
      valid('export type WidgetOptions = { onClick: () => void }'),
      // Inherited members are the upstream API, not a declaration here.
      valid('export interface WidgetProps extends PressableProps { label: string }'),
      valid('export type WidgetProps = PressableProps & { label: string }'),
      // A non-boolean `selected` is a controlled value, not a flag.
      valid(
        'export interface WidgetProps { selected: Item | null; onSelectedChange: (i: Item) => void }'
      ),
      valid("export type WidgetProps = { selected: 'a' | 'b' }"),
      valid('export interface WidgetProps { disabled: string[] }'),
    ],
    invalid: [
      invalid('export interface WidgetProps { disabled?: boolean }', 'isDisabled'),
      invalid('export interface WidgetProps { loading: boolean }', 'isLoading'),
      invalid('export interface WidgetProps { selected: boolean }', 'isSelected'),
      invalid('export interface WidgetProps { onClick: () => void }', 'onPress'),
      invalid('export interface WidgetProps { onClick(): void }', 'onPress'),
      // An unannotated or boolean-bearing union still reads as a flag.
      invalid('export interface WidgetProps { disabled }', 'isDisabled'),
      invalid("export interface WidgetProps { selected: boolean | 'partial' }", 'isSelected'),
      invalid('export interface WidgetProps { selected?: true }', 'isSelected'),
      // A type alias declares its members just as an interface does.
      invalid('export type WidgetProps = { disabled: boolean }', 'isDisabled'),
      invalid('export type WidgetProps = PressableProps & { disabled: boolean }', 'isDisabled'),
      invalid(
        'export type WidgetProps = { kind: "a"; loading: boolean } | { kind: "b" }',
        'isLoading'
      ),
      invalid('export type WidgetProps = ({ selected: boolean })', 'isSelected'),
      // The convention is per component, so a Props type that is not exported counts too.
      invalid('interface RowProps { selected: boolean }', 'isSelected'),
      invalid('type RowProps = { onClick: () => void }', 'onPress'),
      // Each off-convention member is its own site.
      invalid(
        'export interface WidgetProps { disabled: boolean; onClick: () => void }',
        'isDisabled',
        'onPress'
      ),
    ],
  })
})

// Linting a fixture parses the whole config; the first one is slow under coverage.
describe('props-naming under the real config', { timeout: 30_000 }, () => {
  const offConvention = 'export interface WidgetProps { disabled?: boolean }'

  it('reports on the key, so the baseline name reads straight off the range', () => {
    const [message] = lintAt('src/components/ui/widget/Widget.tsx', offConvention)
    expect([message.column, message.endColumn]).toEqual([32, 40])
  })

  it('fails a new component file that declares an off-convention prop', () => {
    const messages = lintAt('src/components/ui/widget/Widget.tsx', offConvention)
    expect(messages.map((m) => m.messageId)).toEqual(['offConvention'])
    expect(messages[0].message).toContain('`disabled` on WidgetProps')
    expect(messages[0].message).toContain('Use `isDisabled` here')
  })

  it('leaves stories, tests and lab alone', () => {
    for (const file of [
      'src/components/ui/widget/Widget.stories.tsx',
      'src/components/ui/widget/Widget.test.tsx',
      'src/lab/widget/Widget.tsx',
    ]) {
      expect(lintAt(file, offConvention), file).toEqual([])
    }
  })

  it('reports a baselined site that is gone until the baseline is regenerated', () => {
    const [file] = Object.keys(baseline)
    const messages = lintAt(file, 'export const nothingRenders = 1')
    expect(messages.map((m) => m.messageId)).toEqual(['stale'])
    expect(messages[0].message).toContain('scripts/update-props-naming-baseline.mjs')
  })

  it('spends an allowance only on the prop it was recorded for', () => {
    const [file, entry] = Object.entries(baseline).find(([, e]) => 'selected' in e) as [
      string,
      Record<string, number>,
    ]
    const members = Object.entries(entry)
      .flatMap(([name, n]) => Array.from({ length: n }, () => `${name}?: boolean`))
      .join('; ')
    expect(lintAt(file, `export interface AProps { ${members} }`)).toEqual([])
    // One selected swapped for a disabled: the disabled is new and the selected allowance is
    // unspent. The stale report sits on line 1, column 0, so it sorts first.
    const swapped = members.replace('selected?: boolean', 'disabled?: boolean')
    expect(lintAt(file, `export interface AProps { ${swapped} }`).map((m) => m.messageId)).toEqual([
      'stale',
      'offConvention',
    ])
  })
})

describe('props-naming baseline', () => {
  it('names only files that exist', () => {
    const missing = Object.keys(baseline).filter((file) => !fs.existsSync(path.join(uiRoot, file)))
    expect(missing, 'regenerate the baseline after deleting a file').toEqual([])
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Linter, RuleTester, type Rule } from 'eslint'
import baseline from '../../eslint-rules/no-truncation-baseline.json'
import allowlist from '../../eslint-rules/truncation-allowlist.json'
import { uiRoot } from './tailwind-compile'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../eslint.config.js') as Linter.Config[]

// Required rather than imported: the rule is untyped CommonJS, and this gives it a type.
const rule = createRequire(import.meta.url)(
  '../../eslint-rules/no-truncation'
) as Rule.RuleModule & {
  parseAllowlist: (entries: unknown[]) => Record<string, Record<string, number>>
}
const { parseAllowlist } = rule

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

// Outside the package, so no baseline entry applies and every site is unallowanced.
const componentFile = '/repo/packages/ui/src/components/custom/Widget/Widget.jsx'

/** The no-truncation messages the real config reports for `code` at a package-relative path. */
function lintAt(file: string, code: string): Linter.LintMessage[] {
  return new Linter({ configType: 'flat' })
    .verify(code, config, { filename: path.join(uiRoot, file) })
    .filter((m) => m.ruleId === 'titan/no-truncation')
}

describe('no-truncation', () => {
  ruleTester.run('no-truncation', rule as never, {
    valid: [
      { code: '<Text>{title}</Text>', filename: componentFile },
      {
        code: "<Text className='text-sm text-text-primary'>{title}</Text>",
        filename: componentFile,
      },
      // Destructuring a prop to forward it is not a truncation decision.
      { code: 'function Row({ numberOfLines }) { return numberOfLines }', filename: componentFile },
      {
        code: 'function Title({ numberOfLines }) { return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        filename: componentFile,
      },
      {
        code: 'function Title(props) { return <Text numberOfLines={props.numberOfLines}>{t}</Text> }',
        filename: componentFile,
      },
      ...[
        'const Title = forwardRef((props, ref) => <Text ref={ref} numberOfLines={props.numberOfLines}>{t}</Text>)',
        'const Title = React.forwardRef(({ numberOfLines }, ref) => <Text ref={ref} numberOfLines={numberOfLines}>{t}</Text>)',
        'const Title = memo(function Title({ numberOfLines }) { return <Text numberOfLines={numberOfLines}>{t}</Text> })',
        'const Title = ({ numberOfLines: numberOfLines }) => <Text numberOfLines={numberOfLines}>{t}</Text>',
        'export function Title({ numberOfLines }) { const tall = numberOfLines > 1; return <Text numberOfLines={numberOfLines}>{tall}</Text> }',
        'const Title = memo(forwardRef((props, ref) => <Text ref={ref} numberOfLines={props.numberOfLines}>{t}</Text>))',
      ].map((code) => ({ code, filename: componentFile })),
      { code: "const label = 'truncated'", filename: componentFile },
      { code: "const c = cn('flex line-clamp-none')", filename: componentFile },
      { code: "import { truncate } from './truncate'", filename: componentFile },
      { code: "export { truncate } from './truncate'", filename: componentFile },
      { code: "const isCut = variant === 'truncate'", filename: componentFile },
      { code: "const isCut = 'truncate' !== variant", filename: componentFile },
      { code: "switch (variant) { case 'truncate': break }", filename: componentFile },
      { code: 'const { truncate } = props', filename: componentFile },
      { code: "const style = { textOverflow: 'clip' }", filename: componentFile },
    ],
    invalid: [
      ...['truncate', 'noWrap', 'maxLines={1}', 'numberOfLines={1}', "ellipsizeMode='tail'"].map(
        (attribute) => ({
          code: `<Text ${attribute}>{title}</Text>`,
          filename: componentFile,
          errors: [{ messageId: 'attribute' }],
        })
      ),
      {
        code: 'function Title() { const n = 2; return <Text numberOfLines={n}>{t}</Text> }',
        filename: componentFile,
        errors: [{ messageId: 'attribute' }],
      },
      {
        code: 'function Title({ lines }) { return <Text numberOfLines={1}>{lines}</Text> }',
        filename: componentFile,
        errors: [{ messageId: 'attribute' }],
      },
      ...[
        'function T({ lines }) { return <Text numberOfLines={lines}>{t}</Text> }',
        'function T({ numberOfLines = 2 }) { return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        'function T(numberOfLines = 2) { return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        'items.map((item) => <Text numberOfLines={item.lines}>{t}</Text>)',
        'items.map((_, i) => <Text numberOfLines={i}>{t}</Text>)',
        'items.map((numberOfLines) => <Text numberOfLines={numberOfLines}>{t}</Text>)',
        'items.map((item) => <Text numberOfLines={item.numberOfLines}>{t}</Text>)',
        'items.map(({ numberOfLines }) => <Text numberOfLines={numberOfLines}>{t}</Text>)',
        'function T({ lines: numberOfLines }) { return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        'function T({ numberOfLines: lines }) { return <Text numberOfLines={lines}>{t}</Text> }',
        'function T({ style }) { return <Text numberOfLines={style.numberOfLines}>{t}</Text> }',
        'function T(props, numberOfLines) { return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        'const T = (numberOfLines) => <Text numberOfLines={numberOfLines}>{t}</Text>',
        'function T({ maxLines }) { return <Text numberOfLines={maxLines}>{t}</Text> }',
        'function T(props) { return <Text numberOfLines={props.maxLines}>{t}</Text> }',
        'function T({ a: { numberOfLines } }) { return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        // Written after the destructure: a default or a hard-coded value, not the caller's.
        'function T({ numberOfLines }) { numberOfLines ??= 2; return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        'function T({ numberOfLines }) { numberOfLines = 2; return <Text numberOfLines={numberOfLines}>{t}</Text> }',
        'function T(props) { props.numberOfLines ??= 2; return <Text numberOfLines={props.numberOfLines}>{t}</Text> }',
        'function T(props) { props.numberOfLines++; return <Text numberOfLines={props.numberOfLines}>{t}</Text> }',
        'function T(props) { ({ a: props.numberOfLines } = x); return <Text numberOfLines={props.numberOfLines}>{t}</Text> }',
        'function T(props) { props = defaults; return <Text numberOfLines={props.numberOfLines}>{t}</Text> }',
        // Not a component: a render prop, a named helper, an object method, a camelCase function.
        '<List renderItem={({ numberOfLines }) => <Text numberOfLines={numberOfLines}>{t}</Text>} />',
        'const row = ({ numberOfLines }) => <Text numberOfLines={numberOfLines}>{t}</Text>; items.map(row)',
        'const cfg = { render({ numberOfLines }) { return <Text numberOfLines={numberOfLines}>{t}</Text> } }',
        'function title(props) { return <Text numberOfLines={props.numberOfLines}>{t}</Text> }',
        'items.map(function Row(props) { return <Text numberOfLines={props.numberOfLines}>{t}</Text> })',
      ].map((code) => ({
        code,
        filename: componentFile,
        errors: [{ messageId: 'attribute' }],
      })),
      ...['maxLines', 'numberOfLines'].map((property) => ({
        code: `const titleProps = { ${property}: 2 }`,
        filename: componentFile,
        errors: [{ messageId: 'property' }],
      })),
      ...['truncate', 'line-clamp-2', 'text-ellipsis', 'web:truncate'].map((token) => ({
        code: `<Text className='text-sm ${token}'>{title}</Text>`,
        filename: componentFile,
        errors: [{ messageId: 'className' }],
      })),
      {
        code: 'const c = `flex ${tone} line-clamp-3`',
        filename: componentFile,
        errors: [{ messageId: 'className' }],
      },
      {
        code: 'const c = `flex line-clamp-${lines}`',
        filename: componentFile,
        errors: [{ messageId: 'className' }],
      },
      {
        code: 'const c = `flex md:line-clamp-${lines} ${tone}`',
        filename: componentFile,
        errors: [{ messageId: 'className' }],
      },
      ...['truncate', 'noWrap', 'ellipsizeMode', 'maxLines', 'numberOfLines'].map((key) => ({
        code: `const c = cn({ ${key}: x })`,
        filename: componentFile,
        errors: [{ messageId: 'property' }],
      })),
      ...['truncate', 'noWrap', 'ellipsizeMode'].map((key) => ({
        code: `const titleProps = { ${key}: true }`,
        filename: componentFile,
        errors: [{ messageId: 'property' }],
      })),
      ...['line-clamp-2', 'web:text-ellipsis'].map((key) => ({
        code: `const c = cn({ '${key}': x })`,
        filename: componentFile,
        errors: [{ messageId: 'className' }],
      })),
      {
        code: "const style = { textOverflow: 'ellipsis' }",
        filename: componentFile,
        errors: [{ messageId: 'property' }],
      },
      {
        code: "const c = cn('flex', 'line-clamp-none', 'truncate')",
        filename: componentFile,
        errors: [{ messageId: 'className' }],
      },
    ],
  })
})

// Linting a fixture parses the whole config; the first one is slow under coverage.
describe('no-truncation under the real config', { timeout: 30_000 }, () => {
  it('fails a new custom/ file that adds numberOfLines', () => {
    const messages = lintAt(
      'src/components/custom/Widget/Widget.tsx',
      'export const Title = () => <Text numberOfLines={1}>{title}</Text>'
    )
    expect(messages.map((m) => m.messageId)).toEqual(['attribute'])
  })

  it('reports a baselined site that is gone until the baseline is regenerated', () => {
    const [file, allowances] = Object.entries(baseline)[0]
    const messages = lintAt(file, 'export const nothingTruncates = 1')
    expect(messages.map((m) => m.messageId)).toEqual(Object.keys(allowances).map(() => 'stale'))
    expect(messages[0].message).toContain('scripts/update-no-truncation-baseline.mjs')
  })

  it('spends one baselined allowance per site and reports the remainder as stale', () => {
    const file = 'src/components/shell/workout/pinnedLiveStripParts.tsx'
    expect(baseline[file as keyof typeof baseline]).toEqual({ numberOfLines: 2 })
    const both = lintAt(
      file,
      'export const T = ({ lines }) => <><Text numberOfLines={lines} /><Text numberOfLines={1} /></>'
    )
    expect(both).toEqual([])
    const one = lintAt(file, 'export const T = () => <Text numberOfLines={1} />')
    expect(one.map((m) => m.messageId)).toEqual(['stale'])
    expect(one[0].message).toContain("still allows 1 'numberOfLines'")
  })

  it('leaves ui/ components, tests and stories alone', () => {
    const code = 'export const Title = () => <Text numberOfLines={1}>{title}</Text>'
    expect(lintAt('src/components/ui/widget/Widget.tsx', code)).toEqual([])
    expect(lintAt('src/components/custom/Widget/Widget.stories.tsx', code)).toEqual([])
  })
})

describe('no-truncation baseline and allowlist', () => {
  it('names only files that exist', () => {
    const missing = Object.keys(baseline).filter((file) => !fs.existsSync(path.join(uiRoot, file)))
    expect(missing, 'regenerate the baseline after deleting a file').toEqual([])
  })

  it('allowlist loads with every entry carrying a kind and an affordance', () => {
    expect(() => parseAllowlist(allowlist)).not.toThrow()
  })

  it('rejects an allowlist entry with no affordance', () => {
    const entry = { file: 'src/components/shell/X.tsx', value: 'numberOfLines', kind: 'path' }
    expect(() => parseAllowlist([entry])).toThrow(/affordance/)
  })

  it('counts allowlist entries per file and value', () => {
    const entry = {
      file: 'src/components/shell/X.tsx',
      value: 'numberOfLines',
      kind: 'path',
      affordance: 'tooltip',
    }
    expect(parseAllowlist([entry, entry])).toEqual({
      'src/components/shell/X.tsx': { numberOfLines: 2 },
    })
  })
})

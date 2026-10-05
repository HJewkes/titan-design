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
      { code: "const label = 'truncated'", filename: componentFile },
    ],
    invalid: [
      ...['truncate', 'noWrap', 'maxLines={1}', 'numberOfLines={1}', "ellipsizeMode='tail'"].map(
        (attribute) => ({
          code: `<Text ${attribute}>{title}</Text>`,
          filename: componentFile,
          errors: [{ messageId: 'attribute' }],
        })
      ),
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
    ],
  })
})

describe('no-truncation under the real config', () => {
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

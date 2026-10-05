import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Linter, RuleTester, type Rule } from 'eslint'
import baseline from '../../eslint-rules/no-unstyled-text-baseline.json'
import { uiRoot } from './tailwind-compile'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../eslint.config.js') as Linter.Config[]

// Required rather than imported: the rule is untyped CommonJS, and this gives it a type.
const rule = createRequire(import.meta.url)(
  '../../eslint-rules/no-unstyled-text'
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
const RN = "import { Text, View } from 'react-native';\n"

const valid = (code: string, imports = RN) => ({ code: imports + code, filename: componentFile })
const invalid = (code: string, imports = RN) => ({
  code: imports + code,
  filename: componentFile,
  errors: [{ messageId: 'unstyled' }],
})

/** The no-unstyled-text messages the real config reports for `code` at a package-relative path. */
function lintAt(file: string, code: string): Linter.LintMessage[] {
  return new Linter({ configType: 'flat' })
    .verify(code, config, { filename: path.join(uiRoot, file) })
    .filter((m) => m.ruleId === 'titan/no-unstyled-text')
}

describe('no-unstyled-text', () => {
  ruleTester.run('no-unstyled-text', rule, {
    valid: [
      valid("<View><Text className='text-text-secondary'>{badge}</Text></View>"),
      valid('<View><Text style={styles.badge}>{badge}</Text></View>'),
      // A spread may carry className or style, so the rule can't call it bare.
      valid('<View><Text {...labelProps}>{badge}</Text></View>'),
      // A nested Text inherits its parent's style, at any depth.
      valid("<Text className='text-sm'><Text>{unit}</Text></Text>"),
      valid("<Text className='text-sm'><View><Text>{unit}</Text></View></Text>"),
      valid("<Text className='text-sm'>{items.map((i) => <Text key={i}>{i}</Text>)}</Text>"),
      // A Text that isn't react-native's is someone else's contract.
      valid('<View><Text>{badge}</Text></View>', "import { Text } from '@/components/ui/text';\n"),
      valid('<View><Text>{badge}</Text></View>', ''),
    ],
    invalid: [
      invalid('<View><Text>{badge}</Text></View>'),
      invalid(
        '<View><Label>{badge}</Label></View>',
        "import { Text as Label } from 'react-native';\n"
      ),
      invalid('<View><RN.Text>{badge}</RN.Text></View>', "import * as RN from 'react-native';\n"),
      invalid('<View><Text>{badge}</Text></View>', "import { Text } from 'react-native-web';\n"),
      // A prop value lands wherever the receiving component puts it; the Text around it is no ancestor.
      invalid("<Text className='text-sm' title={<Text>{badge}</Text>} />"),
      invalid("<Text className='text-sm'><List renderItem={() => <Text>{i}</Text>} /></Text>"),
      // A render helper has no JSX ancestor the rule can see.
      invalid('function renderBadge() { return <Text>{badge}</Text> }'),
    ],
  })
})

// Linting a fixture parses the whole config; the first one is slow under coverage.
describe('no-unstyled-text under the real config', { timeout: 30_000 }, () => {
  const bare = `${RN}export const Badge = () => <View><Text>{badge}</Text></View>`

  it('fails a new file anywhere in src that adds a bare Text', () => {
    for (const file of ['src/components/ui/widget/Widget.tsx', 'src/lab/x/X.stories.tsx']) {
      expect(lintAt(file, bare).map((m) => m.messageId)).toEqual(['unstyled'])
    }
  })

  it('leaves tests alone, since jsdom never paints', () => {
    expect(lintAt('src/components/ui/widget/Widget.test.tsx', bare)).toEqual([])
  })

  it('reports a baselined site that is gone until the baseline is regenerated', () => {
    const [file] = Object.keys(baseline)
    const messages = lintAt(file, 'export const nothingRenders = 1')
    expect(messages.map((m) => m.messageId)).toEqual(['stale'])
    expect(messages[0].message).toContain('scripts/update-no-unstyled-text-baseline.mjs')
  })
})

describe('no-unstyled-text baseline', () => {
  it('names only files that exist', () => {
    const missing = Object.keys(baseline).filter((file) => !fs.existsSync(path.join(uiRoot, file)))
    expect(missing, 'regenerate the baseline after deleting a file').toEqual([])
  })
})

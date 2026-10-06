import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { Linter, RuleTester, type Rule } from 'eslint'
import baseline from '../../eslint-rules/no-html-element-baseline.json'
import { uiRoot } from './tailwind-compile'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../eslint.config.js') as Linter.Config[]

// Required rather than imported: the rule is untyped CommonJS, and this gives it a type.
const rule = createRequire(import.meta.url)('../../eslint-rules/no-html-element') as Rule.RuleModule

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

// Outside the package, so no baseline entry applies and every site is unallowanced.
const componentFile = '/repo/packages/ui/src/components/custom/Widget/Widget.jsx'

const KIND = { html: 'is an HTML element', svg: 'is a web SVG element' }

const valid = (code: string) => ({ code, filename: componentFile })
// A message regex rather than messageId + data: RuleTester needs every placeholder for data.
const invalid = (code: string, kind: keyof typeof KIND, fix: string) => ({
  code,
  filename: componentFile,
  errors: [{ message: new RegExp(`${KIND[kind]}[^]*Use ${fix}`) }],
})

/** The no-html-element messages the real config reports for `code` at a package-relative path. */
function lintAt(file: string, code: string): Linter.LintMessage[] {
  return new Linter({ configType: 'flat' })
    .verify(code, config, { filename: path.join(uiRoot, file) })
    .filter((m) => m.ruleId === 'titan/no-html-element')
}

describe('no-html-element', () => {
  ruleTester.run('no-html-element', rule, {
    valid: [
      valid('const a = <View><Text>{label}</Text></View>'),
      valid('const a = <Svg><Path d={d} /></Svg>'),
      // A member expression is a component lookup, never an intrinsic.
      valid('const a = <motion.div />'),
      valid('const a = <RN.View />'),
      valid('const a = <></>'),
    ],
    invalid: [
      invalid('const a = <div />', 'html', 'View'),
      invalid('const a = <span>{label}</span>', 'html', 'Text'),
      invalid('const a = <button onClick={go} />', 'html', 'Pressable'),
      invalid('const a = <a href={href} />', 'html', 'Pressable'),
      invalid('const a = <input value={v} />', 'html', 'TextInput'),
      invalid('const a = <img src={src} />', 'html', 'Image'),
      // An element outside the table still gets the full list of primitives.
      invalid(
        'const a = <canvas />',
        'html',
        'one of View, Text, Pressable, TextInput, Image or ScrollView'
      ),
      invalid('const a = <path d={d} />', 'svg', 'Path'),
      invalid('const a = <linearGradient id="g" />', 'svg', 'LinearGradient'),
      invalid('const a = <text>{label}</text>', 'svg', 'Text'),
      // react-native-svg has no Title; the accessible name goes on the Svg.
      invalid('const a = <title>{label}</title>', 'svg', 'an accessibilityLabel on Svg'),
    ],
  })
})

// Linting a fixture parses the whole config; the first one is slow under coverage.
describe('no-html-element under the real config', { timeout: 30_000 }, () => {
  const html = 'export const Box = () => <div>{children}</div>'
  const svg = 'export const Mark = () => <svg><path d={d} /></svg>'

  it('reports on the element name, so the baseline key reads straight off the range', () => {
    const [message] = lintAt(
      'src/components/ui/widget/Widget.tsx',
      'const a = <div className="x" />'
    )
    expect([message.column, message.endColumn]).toEqual([12, 15])
  })

  it('fails a new component file that adds an HTML or SVG intrinsic', () => {
    expect(lintAt('src/components/ui/widget/Widget.tsx', html).map((m) => m.messageId)).toEqual([
      'html',
    ])
    expect(lintAt('src/components/custom/Widget/Mark.tsx', svg).map((m) => m.messageId)).toEqual([
      'svg',
      'svg',
    ])
  })

  it('names the react-native primitive, and the react-native-svg component', () => {
    expect(lintAt('src/components/ui/widget/Widget.tsx', html)[0].message).toContain(
      'Use View here'
    )
    expect(lintAt('src/components/ui/widget/Mark.tsx', svg)[1].message).toContain(
      'Use Path from react-native-svg here'
    )
  })

  it('leaves stories, tests and lab alone', () => {
    for (const file of [
      'src/components/ui/widget/Widget.stories.tsx',
      'src/components/ui/widget/Widget.test.tsx',
      'src/lab/widget/Widget.tsx',
    ]) {
      expect(lintAt(file, html), file).toEqual([])
    }
  })

  it('reports a baselined site that is gone until the baseline is regenerated', () => {
    const [file] = Object.keys(baseline)
    const messages = lintAt(file, 'export const nothingRenders = 1')
    expect(messages.map((m) => m.messageId)).toEqual(['stale'])
    expect(messages[0].message).toContain('scripts/update-no-html-element-baseline.mjs')
  })

  it('spends an allowance only on the element it was recorded for', () => {
    const [file, entry] = Object.entries(baseline).find(([, e]) => 'svg' in e) as [
      string,
      Record<string, number>,
    ]
    const svgs = Array.from({ length: entry.svg }, () => '<svg />').join('')
    const others = Object.entries(entry)
      .filter(([element]) => element !== 'svg')
      .flatMap(([element, n]) => Array.from({ length: n }, () => `<${element} />`))
      .join('')
    const exact = `export const a = <>${svgs}${others}</>`
    expect(lintAt(file, exact)).toEqual([])
    // One svg swapped for a div: the div is new and the svg allowance is unspent. The stale
    // report sits on line 1, so it sorts first.
    const swapped = `export const a = <>${svgs.replace('<svg />', '<div />')}${others}</>`
    expect(lintAt(file, swapped).map((m) => m.messageId)).toEqual(['stale', 'html'])
  })
})

describe('no-html-element baseline', () => {
  it('names only files that exist', () => {
    const missing = Object.keys(baseline).filter((file) => !fs.existsSync(path.join(uiRoot, file)))
    expect(missing, 'regenerate the baseline after deleting a file').toEqual([])
  })
})

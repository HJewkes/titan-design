import { RuleTester, type Rule } from 'eslint'
import rule from '../../eslint-rules/no-raw-color'
import { lintMessages } from './lint-rule-messages'

const messageFor = (code: string) =>
  lintMessages('no-raw-color', rule as Rule.RuleModule, code)[0]?.message ?? ''

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

describe('no-raw-color', () => {
  ruleTester.run('no-raw-color', rule as never, {
    valid: [
      // (a) enum-typed prop value: a bare colour word passed as color/variant/tone.
      { code: '<Spinner color="white" />' },
      // (a) the same enum's members listed in a Storybook argTypes options array.
      {
        code: "const meta = { argTypes: { color: { control: 'select', options: ['primary', 'white'] } } }",
      },
      // (b) { value, label } demo data reusing colour words as IDs.
      { code: "const colorOptions = [{ value: 'red', label: 'Red' }]" },
      // (c) documentation text in a <Text> element's children.
      { code: '<Text>{`background-color: #3C3C3C;`}</Text>' },
    ],
    invalid: [
      // Positive control: a real raw hex in a style prop must still be flagged,
      // including on a <Text> element — only its *children* are exempt.
      {
        code: "<Text style={{ backgroundColor: '#123456' }} />",
        errors: [{ messageId: 'hex' }],
      },
      // Positive control: a bare colour word outside any exempt shape is still named.
      { code: "const bg = 'white'", errors: [{ messageId: 'named' }] },
    ],
  })
})

describe('no-raw-color messages name derived options', () => {
  it('maps a red palette class to the status-error role', () => {
    expect(messageFor("const c = 'bg-red-500'")).toContain('`bg-status-error`')
  })

  it('points a hex in a style at useOnSurfaceColor, never at a bare getSemanticColors(', () => {
    const message = messageFor("<View style={{ color: '#fff' }} />")
    expect(message).toContain("`useOnSurfaceColor('primary'|'secondary'|'tertiary')`")
    expect(message).toContain('`resolveColor(token)`')
    expect(message).not.toContain('getSemanticColors(')
  })

  it('maps white to the on-colour classes and black to the scrim rungs', () => {
    expect(messageFor("const c = 'text-white'")).toContain('`text-on-brand-primary`')
    expect(messageFor("const c = 'bg-black'")).toContain('`bg-scrim-subtle`')
  })

  it('names alpha() for a functional colour', () => {
    expect(messageFor("const c = 'rgba(0, 0, 0, 0.5)'")).toContain('`alpha(color, a)`')
  })

  it('lists the class for the utility an arbitrary colour sits on', () => {
    expect(messageFor("const c = 'border-[#123456]'")).toContain('`border-hairline`')
  })
})

import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-raw-color'

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

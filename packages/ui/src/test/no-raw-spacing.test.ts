import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-raw-spacing'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

describe('no-raw-spacing', () => {
  ruleTester.run('no-raw-spacing', rule as never, {
    valid: [
      // Zero is the absence of spacing, not a value off the scale.
      'const s = { padding: 0 }',
      "const s = { margin: '0' }",
      // A computed value is layout arithmetic no scale can express.
      'const s = { paddingTop: rowHeight / 2 }',
      // Not a spacing property.
      'const s = { width: 9, fontSize: 12, borderRadius: 6 }',
      // The escape hatch, on the line above and on the same line.
      '// optical: the cap sits 1px high at this weight\nconst s = { paddingTop: 7 }',
      'const s = { marginTop: 3 } // optical: aligns the rule to the x-height',
    ],
    invalid: [
      // The exact shapes the AW-142 audit found in the inline dialect.
      { code: 'const s = { paddingVertical: 9 }', errors: [{ messageId: 'rawSpacing' }] },
      { code: 'const s = { gap: 3 }', errors: [{ messageId: 'rawSpacing' }] },
      { code: 'const s = { marginBottom: 22 }', errors: [{ messageId: 'rawSpacing' }] },
      { code: "const s = { padding: '9px 12px' }", errors: [{ messageId: 'rawSpacing' }] },
      { code: "const s = { rowGap: '7px' }", errors: [{ messageId: 'rawSpacing' }] },
      // A quoted key is the same property.
      { code: "const s = { 'paddingLeft': 5 }", errors: [{ messageId: 'rawSpacing' }] },
      // An unrelated comment does not buy the exemption.
      {
        code: '// tweak\nconst s = { marginTop: 3 }',
        errors: [{ messageId: 'rawSpacing' }],
      },
      // `optical:` must give a reason.
      {
        code: '// optical:\nconst s = { marginTop: 3 }',
        errors: [{ messageId: 'rawSpacing' }],
      },
    ],
  })
})

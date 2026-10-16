import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-raw-spacing'
import { lintMessages } from './lint-rule-messages'

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
      // A negative literal is the same value; the escape hatch covers it too.
      '// optical: pulls the avatar stack into its overlap\nconst s = { marginLeft: -7 }',
      'const s = { margin: -4 } // optical: bleeds the hit area past the glyph',
      // Zero stays zero with a sign.
      'const s = { marginLeft: -0 }',
      // Not a spacing property.
      'const s = { zIndex: -1, top: -7 }',
      // A negated expression is layout arithmetic.
      'const s = { marginLeft: -gutter }',
    ],
    invalid: [
      // Negative literals parse as a UnaryExpression over a Literal.
      { code: 'const s = { marginLeft: -7 }', errors: [{ messageId: 'rawSpacing' }] },
      { code: 'const s = { margin: -4 }', errors: [{ messageId: 'rawSpacing' }] },
      { code: 'const s = { marginHorizontal: -16 }', errors: [{ messageId: 'rawSpacing' }] },
      { code: 'const s = { marginLeft: -0.5 }', errors: [{ messageId: 'rawSpacing' }] },
      { code: 'const s = { marginTop: -9 }', errors: [{ messageId: 'rawSpacing' }] },
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

describe('no-raw-spacing: the message names the nearest steps', () => {
  const messageFor = (code: string) =>
    lintMessages('no-raw-spacing', rule as never, code)[0]?.message ?? ''

  it('names the steps either side of 9 and the space keys of the lower one', () => {
    const message = messageFor('const s = { paddingVertical: 9 }')
    expect(message).toContain('use 8 (')
    expect(message).toContain('`space.stack.md`')
    expect(message).toContain(' or 10 (`space.control.y.lg`)')
  })

  it('names the one step a value on the scale sits on', () => {
    const message = messageFor('const s = { gap: 8 }')
    expect(message).toMatch(/use 8 \(.*\), or add/)
    expect(message).not.toContain(' or 10')
  })

  it('names only the smallest step for a value below it', () => {
    expect(messageFor('const s = { gap: 0.25 }')).toContain('use 1 (`space.squish.y.xs`), or add')
  })

  it('names only the largest step for a value above it', () => {
    expect(messageFor('const s = { gap: 500 }')).toContain('use 384, or add')
  })

  it('advises on the first length of a shorthand and on a negative number', () => {
    expect(messageFor("const s = { padding: '9px 12px' }")).toContain('use 8 (')
    const negative = messageFor('const s = { marginTop: -9 }')
    expect(negative).toContain("'marginTop: -9'")
    expect(negative).toContain('use 8 (')
  })
})

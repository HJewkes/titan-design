/* eslint-disable titan/no-device-internals --
 * This file is the rule's own test bench, so it necessarily contains the shapes
 * the rule rejects. Every value below is invented for the test — none is a real
 * device value.
 */
import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-device-internals'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

describe('no-device-internals', () => {
  it('flags device internals without flagging design-system content', () => {
    ruleTester.run('no-device-internals', rule as never, {
      valid: [
        // Hex colours are the dominant hex form in this package.
        { code: "const bg = '#1C1C1C'" },
        { code: "const bg = '#fff'" },
        { code: 'const bg = `${base} #1C1C1CFF`' },
        // Dimension and ratio strings: the `\b` guard before `0x` means a digit
        // followed by `x` never reads as a hex literal. These exact strings
        // tripped an earlier, looser sweep.
        { code: '// icons render at 20x20' },
        { code: '// 200x400 intrinsic -> ~160x320 px' },
        // SVG path coordinates — digit-only runs are not byte frames.
        { code: 'const d = "M12 2 22 12 12 22 2 12Z"' },
        { code: 'const d = "M7 7 17 17 12 22 12 2 17 7 7 17"' },
        // Timestamps — `-` and `:` are not byte separators.
        { code: '// datetime // 2024-01-15 14:30' },
        // "cascade" in its CSS sense is ordinary styling vocabulary.
        { code: "// RN doesn't cascade text color, so hand-color the text" },
        // Plain numbers and durations.
        { code: 'const duration = 300' },
      ],
      invalid: [
        // Bare hex identifier, in code and in a comment.
        { code: 'const mode = 0xab', errors: [{ messageId: 'hex' }] },
        { code: '// resistance mode (cmd=0xab)', errors: [{ messageId: 'hex' }] },
        { code: "const s = 'send cmd=0xab now'", errors: [{ messageId: 'hex' }] },
        // Raw byte frame: 4+ space-separated pairs including hex letters.
        { code: '// frame: ab cd ef 01', errors: [{ messageId: 'frame' }] },
        // Transport UUID.
        {
          code: "const id = '0000fe59-1234-5678-9abc-def012345678'",
          errors: [{ messageId: 'uuid' }],
        },
      ],
    })
  })
})

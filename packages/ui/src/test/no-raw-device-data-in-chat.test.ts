/* eslint-disable titan/no-device-internals --
 * This file is the rule's own test bench, so it necessarily contains the
 * shapes it rejects. Every value below is invented for the test — none is a
 * real device value.
 */
import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-raw-device-data-in-chat'

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

// `ruleTester.run` must sit directly in the `describe` callback, not nested
// inside `it()` — nesting it inside `it()` makes RuleTester's internal
// assertions silently no-op under this repo's vitest globals (found in
// VW-381; see no-frozen-theme.test.ts and no-device-internals.test.ts, which
// carry the broken nested-in-it() shape and so never actually assert).
describe('no-raw-device-data-in-chat', () => {
  ruleTester.run('no-raw-device-data-in-chat', rule as never, {
    valid: [
      // Buffer/Uint8Array/ArrayBuffer are only banned inside a component or
      // render function — a module-scope reference is not a render path.
      { code: "const decode = Buffer.from" },
      { code: 'const Encoder = Uint8Array' },
      // An interpreted value, not a raw frame, in a render function.
      { code: "function Bubble({ part }) { return part.summary }" },
      // A data-* part key with no hyphen after the prefix.
      { code: "const type = 'data-typing'" },
      // A raw-frame-shaped name accessed on something that isn't a chat part.
      { code: 'const opcode = settings.opcode' },
      // Ordinary numbers/prose, not hex or byte shapes.
      { code: "const label = 'reps: 12'" },
    ],
    invalid: [
      {
        code: "function Bubble({ part }) { return Buffer.from(part.summary).toString() }",
        errors: [{ messageId: 'rawConstructor' }],
      },
      {
        code: 'function useDecoder() { const view = new Uint8Array(4); return view }',
        errors: [{ messageId: 'rawConstructor' }],
      },
      {
        code: "const frame = '0x1a2b3c'",
        errors: [{ messageId: 'hexLiteral' }],
      },
      {
        code: "const frame = 'a9:c7:00:04'",
        errors: [{ messageId: 'byteSequence' }],
      },
      {
        code: 'function Bubble({ dataPart }) { return dataPart.raw }',
        errors: [{ messageId: 'rawFieldAccess' }],
      },
      {
        code: "const type = 'data-cable-health'",
        errors: [{ messageId: 'hyphenatedDataKey' }],
      },
    ],
  })
})

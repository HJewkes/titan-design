/**
 * ESLint rule: no-device-internals
 *
 * titan is a presentation layer. It renders values that a machine has already
 * interpreted — velocities, forces, weights, modes — and it should describe them
 * in those terms. Low-level device/transport identifiers (hex opcodes, register
 * addresses, raw byte frames, characteristic UUIDs) carry no meaning for a
 * component and tend to arrive by copy-paste from an integration layer, in
 * comments as often as in code. This rule keeps them out of `src/`, including
 * out of comments, which AST-only rules never see.
 *
 * Scope is deliberately narrow so it stays at zero false positives on a design
 * system. Specifically it does NOT flag:
 *   - hex COLOURS (`#1C1C1C`) — the dominant hex form here,
 *   - dimension/ratio strings (`20x20`, `200x400`) — the `\b` before `0x` means
 *     `0x` preceded by a word character never matches,
 *   - the word "cascade" in its CSS sense.
 * If a legitimate case ever needs one of these, disable per-line with cause.
 */

/** Bare hex integer literal: `0x10`. `\b` keeps `20x20` / `200x400` from matching. */
const HEX_LITERAL = /\b0x[0-9a-fA-F]{2,}\b/

/**
 * A run of 4+ space-separated byte pairs, i.e. a raw frame dump.
 *
 * Two deliberate narrowings, each pinned by a real false positive found in this
 * package when the pattern was looser:
 *   - separators are spaces only. Allowing `-`/`:` matched the timestamp
 *     `2024-01-15 14:30` in DateTime.tsx.
 *   - the run must contain at least one hex LETTER (checked separately below).
 *     Digit-only pairs matched SVG path coordinates like `M12 2 22 12 12 22`
 *     in icons.tsx. Frame dumps in practice always carry some a–f.
 */
const BYTE_FRAME = /\b(?:[0-9a-fA-F]{2} +){3,}[0-9a-fA-F]{2}\b/
const HEX_LETTER = /[a-fA-F]/

/** A 128-bit UUID, the shape of a BLE service/characteristic identifier. */
const UUID = /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/

const PATTERNS = [
  { re: HEX_LITERAL, id: 'hex' },
  {
    re: BYTE_FRAME,
    id: 'frame',
    // Digit-only runs are SVG coordinates, not frames. See BYTE_FRAME above.
    refine: (match) => HEX_LETTER.test(match),
  },
  { re: UUID, id: 'uuid' },
]

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow low-level device/transport identifiers in source and comments; describe behaviour in fitness-facing terms.',
    },
    schema: [],
    messages: {
      hex: 'Avoid raw hex identifiers here. Describe what the value means to a lifter (mode, weight, phase) rather than how the device encodes it.',
      frame:
        'Avoid raw byte sequences here. titan renders interpreted values, not transport payloads.',
      uuid: 'Avoid device/transport UUIDs here. titan renders interpreted values, not transport identifiers.',
    },
  },

  create(context) {
    const source = context.sourceCode ?? context.getSourceCode()

    const check = (text, node, loc) => {
      for (const { re, id, refine } of PATTERNS) {
        const match = re.exec(text)
        if (match && (!refine || refine(match[0]))) {
          context.report(loc ? { loc, messageId: id } : { node, messageId: id })
          return
        }
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node.value, node)
      },
      TemplateElement(node) {
        check(node.value.raw, node)
      },
      Program() {
        for (const comment of source.getAllComments()) {
          check(comment.value, null, comment.loc)
        }
      },
    }
  },
}

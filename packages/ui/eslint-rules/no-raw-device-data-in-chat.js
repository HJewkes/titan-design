/**
 * ESLint rule: no-raw-device-data-in-chat
 *
 * The in-app chat design (VW-391/VW-393) renders AI SDK `data-*` message
 * parts, whose shape an agent picks freely. That is a new path for a raw
 * device frame to reach a surface, opened before the Chat component family
 * that would carry it exists (VW-394) — so this rule holds the line at zero
 * from the start rather than auditing it in later.
 *
 * It mirrors the SEMANTICS of voltras-mcp's `no-protocol-detail` (NF-07):
 * device values have a shape, not a spelling, so the checks below match
 * shapes rather than known instances. Scoped in eslint.config.js to
 * `src/components/custom/Chat/**` only — that glob is empty today and is
 * the contract this rule exists to hold.
 *
 * Four independent checks:
 *   - `Buffer.*`, `new Uint8Array(...)`, `new ArrayBuffer(...)` inside a
 *     component or render function (a bare import or a module-scope
 *     re-export is not a render path and is not flagged).
 *   - a string or template literal shaped like a hex literal or a raw byte
 *     sequence, the same shapes voltras-mcp's rule matches.
 *   - a raw-frame field name (see RAW_FIELD_NAMES) accessed on something
 *     that reads as a chat data part.
 *   - a `data-*` part key with a hyphen after the `data-` prefix — the
 *     Claude Code channel meta drops such a key silently, so this is a
 *     functional bug as much as a confidentiality one.
 */

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

/** True when no enclosing function stands between `node` and the module body. */
function isAtModuleScope(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (FUNCTION_TYPES.has(current.type)) return false
  }
  return true
}

const HEX_LITERAL = /(?<!\d)0x[0-9a-f]+/i
const BYTE_SEQUENCE = /(?<![\w#])[0-9a-f]{2}(?:[ ,:.-][0-9a-f]{2}){2,}(?![\w-])/i

/**
 * Raw-frame field names that name transport bytes rather than an interpreted
 * value. Starting list, not exhaustive — extend it as new raw-shaped fields
 * turn up, the same way NF-07 grew in voltras-mcp.
 */
const RAW_FIELD_NAMES = new Set(['raw', 'frame', 'bytes', 'payloadHex', 'register', 'opcode'])

const RAW_CONSTRUCTORS = new Set(['Uint8Array', 'ArrayBuffer'])

/** A `data-<name>` key where `<name>` itself contains a hyphen. */
const DATA_PART_KEY_EXTRA_HYPHEN = /^data-[^-]+-/

/** Heuristic for "this object looks like a chat data part": its own text names `part` or `data`. */
function looksLikeChatPart(node, sourceCode) {
  return /part|data/i.test(sourceCode.getText(node))
}

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        "Ban raw device/protocol shapes from Chat's data-* part renderers, mirroring voltras-mcp's no-protocol-detail (NF-07).",
    },
    schema: [],
    messages: {
      rawConstructor:
        '{{name}} has no place in a chat data-* part renderer. Render an interpreted value, never a raw device buffer (see voltras-mcp no-protocol-detail, NF-07).',
      hexLiteral:
        'This string reads as a hex literal. Raw device values may not reach a chat data-* part (see voltras-mcp no-protocol-detail, NF-07).',
      byteSequence:
        'This string reads as a raw byte sequence. Raw device values may not reach a chat data-* part (see voltras-mcp no-protocol-detail, NF-07).',
      rawFieldAccess:
        '"{{field}}" reads as a raw-frame field name accessed on a data-* part. Render an interpreted value, never a raw device field (see voltras-mcp no-protocol-detail, NF-07).',
      hyphenatedDataKey:
        'A data-* part key may not contain a hyphen after the "data-" prefix — such a key is silently dropped by the Claude Code channel meta (VW-394).',
    },
  },

  create(context) {
    const sourceCode = context.sourceCode ?? context.getSourceCode()

    function checkStringValue(value, node) {
      if (HEX_LITERAL.test(value)) {
        context.report({ node, messageId: 'hexLiteral' })
        return
      }
      if (BYTE_SEQUENCE.test(value)) {
        context.report({ node, messageId: 'byteSequence' })
        return
      }
      if (DATA_PART_KEY_EXTRA_HYPHEN.test(value)) {
        context.report({ node, messageId: 'hyphenatedDataKey' })
      }
    }

    return {
      Literal(node) {
        if (typeof node.value === 'string') checkStringValue(node.value, node)
      },
      TemplateElement(node) {
        checkStringValue(node.value.raw, node)
      },
      MemberExpression(node) {
        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Buffer' &&
          !isAtModuleScope(node)
        ) {
          context.report({ node, messageId: 'rawConstructor', data: { name: 'Buffer' } })
          return
        }

        const propName =
          !node.computed && node.property.type === 'Identifier' ? node.property.name : null
        if (
          propName &&
          RAW_FIELD_NAMES.has(propName) &&
          looksLikeChatPart(node.object, sourceCode)
        ) {
          context.report({
            node: node.property,
            messageId: 'rawFieldAccess',
            data: { field: propName },
          })
        }
      },
      Identifier(node) {
        if (!RAW_CONSTRUCTORS.has(node.name)) return
        // Skip the property side of a member/import (`x.Uint8Array`, `import { Uint8Array }`).
        if (
          node.parent.type === 'MemberExpression' &&
          node.parent.property === node &&
          !node.parent.computed
        ) {
          return
        }
        if (node.parent.type.startsWith('Import')) return
        if (!isAtModuleScope(node)) {
          context.report({ node, messageId: 'rawConstructor', data: { name: node.name } })
        }
      },
    }
  },
}

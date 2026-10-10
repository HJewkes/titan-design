/**
 * ESLint rule: props-naming
 *
 * Every titan component takes the same vocabulary for the same thing (CLAUDE.md, Props
 * Conventions): boolean state is `isDisabled`, `isLoading`, `isSelected`, and the press handler
 * is `onPress`. A component that declares `disabled` or `onClick` instead composes differently
 * from its siblings, and nothing but a reviewer's eye catches it (TD-690).
 *
 * Flags a property named `disabled`, `loading`, `selected` or `onClick` declared in the body of
 * a type alias or interface whose name ends in `Props`, exported or not: the convention is per
 * component, and adding `export` later must not be the moment a rename is demanded. Members
 * written inside an intersection or union of object literals count as declared; members
 * inherited through `extends PressableProps` or a type reference do not, since the rule has no
 * type information and the upstream API is not titan's to rename. The three state names are
 * flagged only when their annotation is absent or boolean-shaped: `selected: Item | null` is a
 * controlled value, which CLAUDE.md names `x` / `defaultX` / `onXChange`, not a flag.
 *
 * RATCHET, same shape as no-html-element: today's sites are recorded in
 * `props-naming-baseline.json`, keyed by file and then property name, so swapping a baselined
 * `selected` for a `disabled` is still a new site. The baseline only shrinks, and it must stay
 * exact: an allowance a file no longer spends is reported as `stale`.
 *
 *   Regenerate after fixing some:  node scripts/update-props-naming-baseline.mjs
 */

const { loadBaseline, baselineKey } = require('./ratchet')

const BASELINE_FILE = 'props-naming-baseline.json'

/** Off-convention prop name -> the name CLAUDE.md gives the same thing. */
const REPLACEMENT = {
  disabled: 'isDisabled',
  loading: 'isLoading',
  selected: 'isSelected',
  onClick: 'onPress',
}

/** The names whose replacement is a flag, so a non-boolean annotation is a different prop. */
const STATE_NAMES = new Set(['disabled', 'loading', 'selected'])

const isPropsName = (id) => id?.type === 'Identifier' && /Props$/.test(id.name)

/** The object-literal bodies a type is declared from, through intersections, unions and parens. */
function literalBodies(typeNode) {
  if (!typeNode) return []
  switch (typeNode.type) {
    case 'TSTypeLiteral':
      return [typeNode.members]
    case 'TSIntersectionType':
    case 'TSUnionType':
      return typeNode.types.flatMap(literalBodies)
    case 'TSParenthesizedType':
      return literalBodies(typeNode.typeAnnotation)
    default:
      return []
  }
}

/** The member's property name when it is a plain identifier or string key, else null. */
function memberName(member) {
  if (member.type !== 'TSPropertySignature' && member.type !== 'TSMethodSignature') return null
  if (member.computed) return null
  const { key } = member
  if (key.type === 'Identifier') return key.name
  if (key.type === 'Literal' && typeof key.value === 'string') return key.value
  return null
}

/** True when a type annotation is missing or mentions boolean anywhere in its union. */
function looksBoolean(annotation) {
  if (!annotation) return true
  const type = annotation.typeAnnotation ?? annotation
  switch (type.type) {
    case 'TSBooleanKeyword':
      return true
    case 'TSLiteralType':
      return typeof type.literal?.value === 'boolean'
    case 'TSUnionType':
      return type.types.some(looksBoolean)
    case 'TSParenthesizedType':
      return looksBoolean(type.typeAnnotation)
    default:
      return false
  }
}

/** The replacement to name for a member, or null when the member is on convention. */
function violationOf(member) {
  const name = memberName(member)
  if (name === null || !Object.hasOwn(REPLACEMENT, name)) return null
  if (STATE_NAMES.has(name) && !looksBoolean(member.typeAnnotation)) return null
  return { name, replacement: REPLACEMENT[name] }
}

const unspent = (remaining) => [...remaining.values()].reduce((sum, n) => sum + n, 0)

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow disabled, loading, selected and onClick on *Props types outside the shrink-only baseline; the convention is isDisabled, isLoading, isSelected and onPress.',
    },
    schema: [],
    messages: {
      offConvention:
        '`{{name}}` on {{type}} is off the props convention: every titan component names boolean state ' +
        'isDisabled, isLoading and isSelected and its press handler onPress (CLAUDE.md, Props Conventions), ' +
        'so a consumer composes `Button`, `Link` and this component the same way. Use `{{replacement}}` here. ' +
        'A prop that must mirror a third-party API keeps `// eslint-disable-next-line titan/props-naming -- <why>`.',
      stale: `${BASELINE_FILE} still allows {{count}} off-convention prop(s) this file no longer declares. Use \`scripts/update-props-naming-baseline.mjs\` to shrink the baseline so the site can't come back unnoticed.`,
    },
  },

  create(context) {
    const remaining = new Map(
      Object.entries(loadBaseline(BASELINE_FILE)[baselineKey(context)] ?? {})
    )

    function checkMembers(typeName, members) {
      for (const member of members) {
        const violation = violationOf(member)
        if (violation === null) continue
        const left = remaining.get(violation.name) ?? 0
        if (left > 0) {
          remaining.set(violation.name, left - 1)
          continue
        }
        // Reported on the key alone, so the baseline script reads the name straight off the range.
        context.report({
          node: member.key,
          messageId: 'offConvention',
          data: { ...violation, type: typeName },
        })
      }
    }

    return {
      TSInterfaceDeclaration(node) {
        if (!isPropsName(node.id)) return
        checkMembers(node.id.name, node.body.body)
      },

      TSTypeAliasDeclaration(node) {
        if (!isPropsName(node.id)) return
        for (const members of literalBodies(node.typeAnnotation)) {
          checkMembers(node.id.name, members)
        }
      },

      'Program:exit'() {
        const count = unspent(remaining)
        if (count === 0) return
        context.report({
          loc: { line: 1, column: 0 },
          messageId: 'stale',
          data: { count: String(count) },
        })
      },
    }
  },
}

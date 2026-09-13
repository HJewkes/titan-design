/**
 * ESLint rule: story-title-prefix
 *
 * Storybook's sidebar reads as one system only if every story's top-level group
 * is one of the approved roots. The six-group reorg (#170) fixed that set —
 * `Foundations`, `Components`, `Custom`, `Shell`, `Pages`, `Lab`, plus `Docs` —
 * and it is duplicated here from `.storybook/preview.tsx`'s `storySort.order`
 * (the sidebar's own source of truth) because that file is TSX and can't be
 * `require`d from a CommonJS eslint rule. Update both together if the taxonomy
 * changes.
 *
 * Flags a `meta.title` (or a CSF3 `title` export) whose first path segment
 * isn't in the allowed set, so a new story can't invent an eighth root.
 */

const ALLOWED_PREFIXES = ['Foundations', 'Components', 'Custom', 'Shell', 'Pages', 'Lab', 'Docs']

const findTitleProperty = (objectExpression) =>
  objectExpression.properties.find(
    (prop) =>
      prop.type === 'Property' &&
      ((prop.key.type === 'Identifier' && prop.key.name === 'title') ||
        (prop.key.type === 'Literal' && prop.key.value === 'title'))
  )

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Storybook meta title must start with an approved top-level group.',
    },
    schema: [],
    messages: {
      unknownPrefix:
        "Story title root '{{ prefix }}' is not an approved group. Use one of: {{ allowed }}.",
    },
  },

  create(context) {
    const check = (objectExpression) => {
      const titleProp = findTitleProperty(objectExpression)
      if (!titleProp || titleProp.value.type !== 'Literal') return
      const title = titleProp.value.value
      if (typeof title !== 'string') return
      const prefix = title.split('/')[0]
      if (!ALLOWED_PREFIXES.includes(prefix)) {
        context.report({
          node: titleProp.value,
          messageId: 'unknownPrefix',
          data: { prefix, allowed: ALLOWED_PREFIXES.join(', ') },
        })
      }
    }

    return {
      // `const meta: Meta<typeof X> = { title: '...', ... }`
      'VariableDeclarator[id.name="meta"] > ObjectExpression'(node) {
        check(node)
      },
      // CSF3 also allows `export default { title: '...', ... }` with no
      // intermediate `meta` binding.
      'ExportDefaultDeclaration > ObjectExpression'(node) {
        check(node)
      },
    }
  },
}

/**
 * ESLint rule: story-title-prefix
 *
 * Storybook's sidebar reads as one system only if every story's top-level group
 * is one of the approved roots. Those roots are the string entries of
 * `.storybook/preview.tsx`'s `storySort.order` (the sidebar's own source of
 * truth), read through `fix-options.js` so the list lives in one place.
 *
 * Flags a `meta.title` (or a CSF3 `title` export) whose first path segment
 * isn't in the allowed set, so a new story can't invent a new root. The message
 * suggests the root the file's directory implies (`ui/` -> `Components/`,
 * `custom/<Family>/` -> `Custom/<Family>`) when that root is in the list.
 */

const { storyRoots } = require('./fix-options')

/** `src`-relative directory pattern -> the title root it implies. */
const ROOT_BY_DIR = [
  [/\/src\/components\/ui\//, () => 'Components/Atoms|Molecules|Organisms'],
  [/\/src\/components\/custom\/([^/]+)\//, (family) => `Custom/${family}`],
  [/\/src\/components\/shell\//, () => 'Shell/'],
  [/\/src\/components\/pages\//, () => 'Pages/'],
  [/\/src\/lab\/([^/]+)\//, (family) => `Lab/${family}`],
  [/\/src\/theme\//, () => 'Foundations/'],
]

function suggestedRoot(filename) {
  const posix = filename.split('\\').join('/')
  for (const [pattern, rootOf] of ROOT_BY_DIR) {
    const match = pattern.exec(posix)
    if (!match) continue
    const root = rootOf(match[1])
    return storyRoots.includes(root.split('/')[0]) ? root : null
  }
  return null
}

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
        "Story title root '{{ prefix }}' is not a sidebar root in .storybook/preview.tsx. {{ suggestion }}The roots are {{ allowed }}.",
    },
  },

  create(context) {
    const filename = context.filename ?? context.getFilename()
    const root = suggestedRoot(filename)
    const suggestion = root ? `This file's directory puts it under \`${root}\`; use that. ` : ''

    const check = (objectExpression) => {
      const titleProp = findTitleProperty(objectExpression)
      if (!titleProp || titleProp.value.type !== 'Literal') return
      const title = titleProp.value.value
      if (typeof title !== 'string') return
      const prefix = title.split('/')[0]
      if (!storyRoots.includes(prefix)) {
        context.report({
          node: titleProp.value,
          messageId: 'unknownPrefix',
          data: {
            prefix,
            suggestion,
            allowed: storyRoots.map((r) => `\`${r}/\``).join(', '),
          },
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

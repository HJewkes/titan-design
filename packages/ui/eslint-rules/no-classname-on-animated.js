/**
 * ESLint rule: no-classname-on-animated
 *
 * NativeWind does not compile `className` on an `Animated.*` element. It does
 * not warn and it does not fall back: in Storybook the element renders only its
 * react-native-web base class, so every Tailwind class on it is silently dead
 * (TD-13). jsdom strips classes too, so no test sees the loss.
 *
 * Every `className` is flagged, not only spacing (TD-13 Q1): a colour, radius
 * or layout class is dropped the same way.
 *
 * Use instead:
 *   - a plain `View` (or `Text`) inside the animated element, carrying the classes
 *   - an inline `style` that reads the JS token export (`space.inset.md`,
 *     `resolveColor(token)`), as VelocityStripFramed does
 *
 * Only the element whose name is a member of `Animated` is checked, so a
 * `className` on a plain child nested inside it is fine.
 */

function animatedName(name) {
  if (name.type !== 'JSXMemberExpression') return undefined
  if (name.object.type !== 'JSXIdentifier' || name.object.name !== 'Animated') return undefined
  return `Animated.${name.property.name}`
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow className on Animated.* elements, where NativeWind compiles it to nothing',
    },
    schema: [],
    messages: {
      animated:
        'className on <{{element}}> is dropped: NativeWind does not compile className on an Animated component, so the class renders nothing. Move the classes onto a plain View inside it, or use an inline style that reads the JS token export (`space.inset.md`, `resolveColor(token)`). See TD-13.',
    },
  },

  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className') return
        const element = animatedName(node.parent.name)
        if (element) context.report({ node, messageId: 'animated', data: { element } })
      },
    }
  },
}

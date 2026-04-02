/**
 * Custom JSX runtime for titan-design's web distribution.
 *
 * Converts className props to $$css style objects at build time,
 * eliminating the need for NativeWind's runtime interopComponents
 * Map lookup. RNW's styleq recognizes $$css objects and applies
 * their values as CSS class names on DOM elements.
 *
 * This file is NOT used by source builds (specimen, storybook,
 * native Metro). It is only inlined into the dist by tsup via
 * an esbuild onResolve plugin.
 */
import {
  jsx as reactJsx,
  jsxs as reactJsxs,
  Fragment,
} from 'react/jsx-runtime'
import type { StyleProp } from 'react-native'

type JsxFn = typeof reactJsx

function wrapJsx(fn: JsxFn): JsxFn {
  return function (type, props, ...rest) {
    if (props && typeof props.className === 'string' && props.className) {
      const cn = props.className
      const cssStyle = { $$css: true, [cn]: cn } as unknown as StyleProp<any>
      const existing = props.style
      props = {
        ...props,
        style: existing ? [cssStyle, existing] : cssStyle,
      }
      delete props.className
    }
    return fn(type, props, ...rest)
  } as JsxFn
}

const jsx = wrapJsx(reactJsx)
const jsxs = wrapJsx(reactJsxs)

export { jsx, jsxs, Fragment }

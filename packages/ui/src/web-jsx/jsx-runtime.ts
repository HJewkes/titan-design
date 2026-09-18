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
 * its jsxImportSource option.
 */
import { jsx as reactJsx, jsxs as reactJsxs, Fragment } from 'react/jsx-runtime'
import { classNameToStyle } from './class-name-style'

type JsxFn = typeof reactJsx

function wrapJsx(fn: JsxFn): JsxFn {
  return function (type, props, ...rest) {
    return fn(type, classNameToStyle(props), ...rest)
  } as JsxFn
}

const jsx = wrapJsx(reactJsx)
const jsxs = wrapJsx(reactJsxs)

export { jsx, jsxs, Fragment }

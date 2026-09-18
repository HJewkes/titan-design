/**
 * Development-mode custom JSX runtime for titan-design's web distribution.
 * See jsx-runtime.ts for details on the $$css conversion approach.
 */
import { jsxDEV as reactJsxDEV, Fragment } from 'react/jsx-dev-runtime'
import { classNameToStyle } from './class-name-style'

type JsxDevFn = typeof reactJsxDEV

function wrapJsxDev(fn: JsxDevFn): JsxDevFn {
  return function (type, props, ...rest) {
    return fn(type, classNameToStyle(props), ...rest)
  } as JsxDevFn
}

const jsxDEV = wrapJsxDev(reactJsxDEV)

export { jsxDEV, Fragment }

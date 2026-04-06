/**
 * Development-mode custom JSX runtime for titan-design's web distribution.
 * See jsx-runtime-web.ts for details on the $$css conversion approach.
 */
import { jsxDEV as reactJsxDEV, Fragment } from 'react/jsx-dev-runtime'
import type { StyleProp } from 'react-native'

type JsxDevFn = typeof reactJsxDEV

function wrapJsxDev(fn: JsxDevFn): JsxDevFn {
  return function (type, props: Record<string, any>, ...rest) {
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
  } as JsxDevFn
}

const jsxDEV = wrapJsxDev(reactJsxDEV)

export { jsxDEV, Fragment }

/**
 * Token CSS Generator
 *
 * Emits a static `:root {}` CSS block from the canonical theme token maps
 * (`darkThemeCSSVars` / `lightThemeCSSVars`). HTML prototypes import the
 * generated stylesheet so they always resolve to the exact same values as
 * the design system. Pure codegen: deterministic and diffable against source.
 *
 * Dark mode is the default (`:root`); light mode is activated with `.light`,
 * matching the convention in `theme/global.css`.
 */

import { darkThemeCSSVars, lightThemeCSSVars } from './config'

type CSSVarMap = Record<string, string>

const GENERATED_HEADER = '/* Generated from theme token maps. Do not edit by hand. */'

function formatBlock(selector: string, vars: CSSVarMap): string {
  const declarations = Object.entries(vars)
    .map(([name, value]) => `  ${name}: ${value};`)
    .join('\n')
  return `${selector} {\n${declarations}\n}`
}

/**
 * Build the full `tokens.css` contents: a default (dark) `:root` block plus a
 * `.light` override block, driven entirely by the exported token maps.
 */
export function generateTokensCss(): string {
  const root = formatBlock(':root', darkThemeCSSVars)
  const light = formatBlock('.light, :root.light', lightThemeCSSVars)
  return `${GENERATED_HEADER}\n\n${root}\n\n${light}\n`
}

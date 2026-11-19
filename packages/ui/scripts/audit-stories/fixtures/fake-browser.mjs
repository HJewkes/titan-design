/**
 * A browser double for `captureAll`'s `launch`. Each page answers the functions the audit sends
 * into it, and `domFor({ spaced })` decides the in-page check result, where `spaced` is true once
 * the text-spacing stylesheet is injected and false again after the next navigation.
 */
import { domChecks, tokenColours } from '../checks.mjs'
import { TEXT_SPACING_CSS } from '../text-spacing.mjs'

const emptyLayout = { nodes: [], truncated: false, declared: {} }
const contentClip = { x: 0, y: 0, width: 100, height: 40 }

export const emptyDom = Object.freeze({
  blockers: [],
  warnings: [],
  spacing: [],
  spacingVars: {},
  metrics: {},
  geometry: [],
  texts: [],
})

function answer(fn, state, domFor) {
  if (fn === domChecks) return domFor(state)
  if (fn === tokenColours) return {}
  const source = fn.toString()
  if (source.includes('collectLayout')) return emptyLayout
  if (source.includes('window.axe.run')) return []
  if (source.includes('sb-show-errordisplay')) return null
  if (source.includes('getBoundingClientRect')) return contentClip
  return true
}

function fakePage(domFor, log) {
  const state = { spaced: false }
  return {
    on: () => {},
    goto: async (url) => {
      state.spaced = false
      log.push(`goto ${url}`)
    },
    evaluate: async (fn) => answer(fn, state, domFor),
    addScriptTag: async () => {},
    addStyleTag: async ({ content }) => {
      if (content === TEXT_SPACING_CSS) state.spaced = true
      log.push('text-spacing stylesheet')
    },
    waitForTimeout: async () => {},
    screenshot: async () => log.push(`screenshot spaced=${state.spaced}`),
  }
}

export function fakeBrowser(domFor) {
  const log = []
  const browser = {
    newContext: async () => ({ newPage: async () => fakePage(domFor, log), close: async () => {} }),
    close: async () => {},
  }
  return { browser, log }
}

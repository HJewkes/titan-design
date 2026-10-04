// titan's spacing scale, read from the tree's tailwind.config.js rather than hard-coded.
import { createRequire } from 'node:module'

const HAIRLINE_MAX_PX = 2

export function loadSpacingConfig(uiDir) {
  const config = createRequire(`${uiDir}/x.js`)(`${uiDir}/tailwind.config.js`)
  return parseSpacingConfig(config)
}

// Splits theme spacing into literal px steps and the custom properties the page must resolve.
export function parseSpacingConfig(config) {
  const values = [
    ...Object.values(config.theme?.spacing ?? {}),
    ...Object.values(config.theme?.extend?.spacing ?? {}),
  ]
  const px = new Set()
  const vars = new Set()
  for (const raw of values.map(String)) {
    const varName = raw.match(/^var\((--[\w-]+)/)?.[1]
    if (varName) vars.add(varName)
    else if (raw === '0' || /^-?[\d.]+px$/.test(raw)) px.add(parseFloat(raw))
  }
  return { px: [...px], vars: [...vars] }
}

export function buildScale(pxSteps, resolvedVars) {
  return new Set(
    [...pxSteps, ...Object.values(resolvedVars).filter(Number.isFinite)].map((v) =>
      round(Math.abs(v))
    )
  )
}

export function isOnScale(px, scale) {
  const v = round(Math.abs(px))
  return v <= HAIRLINE_MAX_PX || scale.has(v)
}

const round = (v) => Math.round(v * 100) / 100

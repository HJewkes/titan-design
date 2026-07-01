#!/usr/bin/env node
/**
 * Extract a CSS property manifest from a rendered HTML source.
 *
 * Given an HTML file and a CSS selector, this loads the file in a headless
 * Chromium page (via Playwright), reads window.getComputedStyle for the matched
 * element, and emits a manifest conforming to css-property-manifest.schema.json.
 * Measuring the *rendered* computed styles removes the hand-transcription errors
 * that come from reading values out of an HTML prototype by eye.
 *
 * Extracted properties carry `token: null`: getComputedStyle yields literal
 * resolved values, not the semantic token they were sourced from, so tokens are
 * annotated in a later step. The schema explicitly permits null tokens for
 * literal (non-tokenized) values.
 *
 * Usage:
 *   node scripts/extract-css-properties.mjs <html> <selector> <component> \
 *     [--out <file>] [--variant <axis>=<value> ...]
 */

import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

/**
 * Visual CSS properties captured for each component. camelCase and letters-only
 * so every emitted property name satisfies the schema's `^[a-zA-Z]+$` pattern.
 */
export const DEFAULT_VISUAL_PROPERTIES = [
  'backgroundColor',
  'color',
  'borderColor',
  'borderStyle',
  'borderWidth',
  'borderRadius',
  'boxShadow',
  'opacity',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'lineHeight',
  'letterSpacing',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
]

/** Convert a camelCase CSS property name to its kebab-case getPropertyValue key. */
export const toKebabCase = (property) =>
  property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)

/**
 * Read computed values for `properties` off `element` using `getComputed`, keyed
 * by the original camelCase property name. Shared by the jsdom tests; mirrored
 * in-page by extractStyleMapFromHtml (which cannot cross the browser boundary).
 */
export function readComputedStyleMap(element, properties, getComputed) {
  const style = getComputed(element)
  const styleMap = {}
  for (const property of properties) {
    styleMap[property] = style.getPropertyValue(toKebabCase(property))
  }
  return styleMap
}

/**
 * Turn a camelCase-keyed computed-style map into manifest property entries,
 * dropping properties whose computed value is empty so that every entry meets
 * the schema's non-empty resolvedValue requirement.
 */
export function styleMapToProperties(styleMap) {
  return Object.entries(styleMap)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([property, value]) => ({ property, token: null, resolvedValue: value.trim() }))
}

/** Assemble a CssPropertyManifest from a component name and a computed-style map. */
export function buildCssPropertyManifest({ component, styleMap, baseVariant, description }) {
  const properties = styleMapToProperties(styleMap)
  if (properties.length === 0) {
    throw new Error('No non-empty computed CSS properties were extracted for the selector')
  }
  const manifest = { component, properties }
  if (description) manifest.description = description
  if (baseVariant && Object.keys(baseVariant).length > 0) manifest.baseVariant = baseVariant
  return manifest
}

/**
 * Launch headless Chromium, load `htmlPath`, and read computed styles for the
 * first element matching `selector`. Returns a camelCase-keyed style map.
 */
export async function extractStyleMapFromHtml(
  htmlPath,
  selector,
  properties = DEFAULT_VISUAL_PROPERTIES
) {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: 'networkidle' })
    await page.waitForSelector(selector)
    return await page.evaluate(
      ({ selector: sel, properties: props }) => {
        const element = document.querySelector(sel)
        if (!element) throw new Error(`No element matched selector: ${sel}`)
        const style = getComputedStyle(element)
        const styleMap = {}
        for (const property of props) {
          const kebab = property.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
          styleMap[property] = style.getPropertyValue(kebab)
        }
        return styleMap
      },
      { selector, properties }
    )
  } finally {
    await browser.close()
  }
}

/** High-level driver: extract a schema-shaped manifest from an HTML file + selector. */
export async function extractCssPropertyManifest({
  htmlPath,
  selector,
  component,
  baseVariant,
  description,
}) {
  const styleMap = await extractStyleMapFromHtml(htmlPath, selector)
  return buildCssPropertyManifest({ component, styleMap, baseVariant, description })
}

/** Parse CLI argv into positional args and flags (--out, repeatable --variant k=v). */
export function parseArgs(argv) {
  const positional = []
  const baseVariant = {}
  let out
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--out') {
      i += 1
      out = argv[i]
    } else if (arg === '--variant') {
      i += 1
      const [axis, value] = (argv[i] ?? '').split('=')
      if (axis && value) baseVariant[axis] = value
    } else {
      positional.push(arg)
    }
  }
  const [htmlPath, selector, component] = positional
  return { htmlPath, selector, component, out, baseVariant }
}

async function main() {
  const { htmlPath, selector, component, out, baseVariant } = parseArgs(process.argv.slice(2))
  if (!htmlPath || !selector || !component) {
    console.error(
      'Usage: node scripts/extract-css-properties.mjs <html> <selector> <component> ' +
        '[--out <file>] [--variant <axis>=<value> ...]'
    )
    process.exitCode = 1
    return
  }
  const manifest = await extractCssPropertyManifest({ htmlPath, selector, component, baseVariant })
  const json = JSON.stringify(manifest, null, 2)
  if (out) {
    const outPath = path.resolve(out)
    await writeFile(outPath, `${json}\n`, 'utf8')
    console.log(
      `Wrote ${path.relative(process.cwd(), outPath)} (${manifest.properties.length} properties)`
    )
  } else {
    console.log(json)
  }
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}

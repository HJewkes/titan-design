#!/usr/bin/env node
/**
 * Run the design-freeze workflow (TD-06.04) against an approved HTML prototype.
 *
 * Implements Stage 3 ("Design Freeze") of the HTML-to-React extraction pipeline
 * described in the sibling voltras repo's docs/improved-workflow.md: once a
 * prototype is approved, freeze it as ground truth before any React
 * implementation work starts, so agents never build against a moving target.
 *
 * Three steps, run in order:
 *
 *   1. Tag the HTML file in git — refuse to freeze a prototype with
 *      uncommitted changes, then create an annotated tag at HEAD recording the
 *      freeze point (`design-freeze/<component>-<version>`).
 *   2. Extract a CSS property manifest — delegates to
 *      extract-css-properties.mjs (TD-06.02) and writes a schema-conforming
 *      (TD-06.01) manifest to packages/ui/src/theme/manifest/<component>.manifest.json.
 *   3. Generate a specimen-page skeleton — emits a ComparisonPair snippet
 *      (matching packages/ui/specimen/comparison.tsx's convention) with the
 *      frozen HTML inlined and a TODO placeholder for the React side, ready to
 *      paste into the specimen page.
 *
 * This script never dispatches implementation work itself — see
 * docs/agent-prompts/component-implementation.md (TD-06.03) for the prompt
 * template that consumes the manifest this script produces. A component
 * should not be handed to that template until it has been frozen here.
 *
 * Usage:
 *   node scripts/design-freeze.mjs <html> <selector> <component> \
 *     [--out-manifest <file>] [--out-skeleton <file>] [--tag-version <v>] \
 *     [--skip-git-tag] [--variant <axis>=<value> ...]
 */

import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import {
  extractCssPropertyManifest,
  parseArgs as parseExtractArgs,
} from './extract-css-properties.mjs'

/** Default location manifests are frozen to, matching TD-06.01's schema directory. */
export const DEFAULT_MANIFEST_DIR = 'src/theme/manifest'

/** Build the annotated git tag name a freeze is recorded under. */
export function buildFreezeTagName(component, version) {
  if (!component) throw new Error('buildFreezeTagName requires a component name')
  return `design-freeze/${component}-${version}`
}

/** Build the message body for the annotated freeze tag. */
export function buildFreezeTagMessage({ component, htmlPath, selector }) {
  return (
    `Design freeze: ${component}\n\n` +
    `Prototype: ${htmlPath}\n` +
    `Selector: ${selector}\n` +
    'No further visual changes to this prototype after this point. ' +
    'Design changes require a re-freeze (new tag) per docs/design-freeze-workflow.md.'
  )
}

/**
 * Parse `git status --porcelain -- <file>` output and throw if it reports the
 * file as dirty (staged or unstaged changes, or untracked). A clean result
 * means the working tree's copy of the file matches HEAD, so HEAD is a valid
 * freeze point for it.
 */
export function assertFileCommitted(porcelainOutput, filePath) {
  const trimmed = porcelainOutput.trim()
  if (trimmed.length > 0) {
    throw new Error(
      `Cannot freeze ${filePath}: it has uncommitted changes. Commit the prototype first ` +
        `so the freeze tag points at the exact approved version.\n${trimmed}`
    )
  }
}

/** Run `git status --porcelain -- <file>` and validate it reports no changes. */
export function verifyHtmlCommitted(htmlPath, { cwd } = {}) {
  const output = execFileSync('git', ['status', '--porcelain', '--', htmlPath], {
    cwd,
    encoding: 'utf8',
  })
  assertFileCommitted(output, htmlPath)
}

/** Create the annotated freeze tag at HEAD. Returns the tag name. */
export function createFreezeTag({ component, version, htmlPath, selector }, { cwd } = {}) {
  const tagName = buildFreezeTagName(component, version)
  const message = buildFreezeTagMessage({ component, htmlPath, selector })
  execFileSync('git', ['tag', '-a', tagName, '-m', message], { cwd })
  return tagName
}

/** Slugify a variant-axes object into a specimen testId/label suffix, e.g. { size: 'md' } -> 'size-md'. */
export function slugifyVariant(baseVariant) {
  if (!baseVariant || Object.keys(baseVariant).length === 0) return ''
  return Object.entries(baseVariant)
    .map(([axis, value]) => `${axis}-${value}`)
    .join('-')
}

/**
 * Build a specimen-page skeleton snippet for a frozen component, matching the
 * <ComparisonPair> convention in packages/ui/specimen/comparison.tsx: the
 * frozen HTML inlined verbatim as ground truth, a TODO placeholder for the
 * not-yet-implemented React side.
 */
export function generateSpecimenSkeleton({ component, htmlSnippet, baseVariant }) {
  if (!component) throw new Error('generateSpecimenSkeleton requires a component name')
  if (!htmlSnippet) throw new Error('generateSpecimenSkeleton requires an htmlSnippet')

  const slug = slugifyVariant(baseVariant)
  const testId = `compare-${component}${slug ? `-${slug}` : ''}`
  const label = `${component}${slug ? ` ${slug.replace(/-/g, ' ')}` : ''}`
  const escapedHtml = htmlSnippet.replace(/`/g, '\\`')

  return (
    `{/* TODO(design-freeze): ${component} — replace the placeholder React child\n` +
    `   once its component is implemented per docs/agent-prompts/component-implementation.md. */}\n` +
    `<ComparisonPair\n` +
    `  testId="${testId}"\n` +
    `  label="${label}"\n` +
    `  htmlContent={\`${escapedHtml}\`}\n` +
    `>\n` +
    `  {/* TODO: render <${component} /> here */}\n` +
    `</ComparisonPair>\n`
  )
}

/**
 * Read the matched element's outerHTML from the rendered prototype, so the
 * specimen skeleton can inline the exact frozen markup as ground truth rather
 * than a placeholder comment. Mirrors extractStyleMapFromHtml's page-loading
 * approach (TD-06.02) but reads markup instead of computed style.
 */
export async function extractOuterHtmlFromHtml(htmlPath, selector) {
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: 'networkidle' })
    await page.waitForSelector(selector)
    return await page.evaluate((sel) => {
      const element = document.querySelector(sel)
      if (!element) throw new Error(`No element matched selector: ${sel}`)
      return element.outerHTML
    }, selector)
  } finally {
    await browser.close()
  }
}

/**
 * Run the full design-freeze workflow. Returns the manifest, tag name (or
 * null), and specimen skeleton snippet built from the frozen markup.
 */
export async function runDesignFreeze({
  htmlPath,
  selector,
  component,
  version,
  baseVariant,
  skipGitTag = false,
  cwd,
}) {
  let tagName = null
  if (!skipGitTag) {
    verifyHtmlCommitted(htmlPath, { cwd })
    tagName = createFreezeTag({ component, version, htmlPath, selector }, { cwd })
  }

  const manifest = await extractCssPropertyManifest({ htmlPath, selector, component, baseVariant })
  const htmlSnippet = await extractOuterHtmlFromHtml(htmlPath, selector)

  const skeleton = generateSpecimenSkeleton({ component, htmlSnippet, baseVariant })

  return { manifest, tagName, skeleton }
}

/** Parse CLI argv for design-freeze, layering its own flags on parseExtractArgs. */
export function parseArgs(argv) {
  const outManifestIndex = argv.indexOf('--out-manifest')
  const outSkeletonIndex = argv.indexOf('--out-skeleton')
  const tagVersionIndex = argv.indexOf('--tag-version')
  const skipGitTag = argv.includes('--skip-git-tag')

  const consumedIndices = new Set(
    [outManifestIndex, outSkeletonIndex, tagVersionIndex]
      .filter((index) => index >= 0)
      .flatMap((index) => [index, index + 1])
  )
  const stripped = argv.filter((arg, i) => !consumedIndices.has(i) && arg !== '--skip-git-tag')

  const { htmlPath, selector, component, baseVariant } = parseExtractArgs(stripped)

  return {
    htmlPath,
    selector,
    component,
    baseVariant,
    outManifest: outManifestIndex >= 0 ? argv[outManifestIndex + 1] : undefined,
    outSkeleton: outSkeletonIndex >= 0 ? argv[outSkeletonIndex + 1] : undefined,
    version:
      tagVersionIndex >= 0 ? argv[tagVersionIndex + 1] : new Date().toISOString().slice(0, 10),
    skipGitTag,
  }
}

async function main() {
  const {
    htmlPath,
    selector,
    component,
    baseVariant,
    outManifest,
    outSkeleton,
    version,
    skipGitTag,
  } = parseArgs(process.argv.slice(2))

  if (!htmlPath || !selector || !component) {
    console.error(
      'Usage: node scripts/design-freeze.mjs <html> <selector> <component> ' +
        '[--out-manifest <file>] [--out-skeleton <file>] [--tag-version <v>] ' +
        '[--skip-git-tag] [--variant <axis>=<value> ...]'
    )
    process.exitCode = 1
    return
  }

  const manifestPath = outManifest ?? path.join(DEFAULT_MANIFEST_DIR, `${component}.manifest.json`)

  const { manifest, tagName, skeleton } = await runDesignFreeze({
    htmlPath,
    selector,
    component,
    version,
    baseVariant,
    skipGitTag,
  })

  await mkdir(path.dirname(path.resolve(manifestPath)), { recursive: true })
  await writeFile(path.resolve(manifestPath), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
  console.log(`Wrote ${manifestPath} (${manifest.properties.length} properties)`)

  if (tagName) {
    console.log(`Tagged HEAD as ${tagName}`)
  } else {
    console.log('Skipped git tag (--skip-git-tag)')
  }

  if (outSkeleton) {
    await mkdir(path.dirname(path.resolve(outSkeleton)), { recursive: true })
    await writeFile(path.resolve(outSkeleton), skeleton, 'utf8')
    console.log(
      `Wrote specimen skeleton to ${outSkeleton} — paste into packages/ui/specimen/comparison.tsx`
    )
  } else {
    console.log('\n--- specimen skeleton (paste into packages/ui/specimen/comparison.tsx) ---\n')
    console.log(skeleton)
  }
}

const invokedDirectly = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (invokedDirectly) {
  main().catch((error) => {
    console.error(error.message ?? error)
    process.exitCode = 1
  })
}

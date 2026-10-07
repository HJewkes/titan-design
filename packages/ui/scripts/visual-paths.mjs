import { appendFileSync } from 'node:fs'

import { isEntryPoint } from './lib/entry.mjs'

/**
 * Decides whether a pull request needs the `visual` job's layers (TD-645) and the `check`
 * job's stories-axe and play steps (TD-725). Both jobs always report, because the ruleset
 * requires them; on a PR whose changed paths miss every pattern below, those steps are skipped.
 *
 * A false skip lets a regression merge, a false run only costs minutes, so a path is listed
 * here whenever a visual layer, the stories-axe suite or a play function could read it.
 */
export const RENDERED_UI_PATTERNS = [
  // Storybook's stories glob is ../src/**, and stories import across all of src (lab, utils,
  // hooks, theme fonts and tokens, test/blank-render.ts); only test files never render.
  /^packages\/ui\/src\/(?!.*\.test(-d)?\.tsx?$)/,
  // The stories-axe suite is itself a test file.
  /^packages\/ui\/src\/test\/stories-axe[^/]*\.test\.tsx$/,
  /\.stories\.(ts|tsx|mdx)$/,
  /^packages\/ui\/\.storybook\//,
  /^packages\/ui\/(tailwind\.config\.js|postcss\.config\.js|vite-rn-svg-plugins\.ts|tsconfig\.json|vitest\.config\.ts)$/,
  /^packages\/ui\/specimen\//,
  /^packages\/ui\/tests\/(visual|interaction|offline-fonts)\//,
  /^packages\/ui\/playwright[^/]*\.config\.[^/]+$/,
  // Playwright starts Storybook through the launcher (pnpm storybook --ci).
  // test:storybook ends with the play-count check.
  /^packages\/ui\/scripts\/(storybook-launch\.mjs|check-play-count\.mjs$|lib\/|visual-paths\.mjs$)/,
  /^packages\/ui\/package\.json$/,
  // test:axe and test:storybook run through Turbo.
  /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|turbo\.json)$/,
  /^\.github\/workflows\/ci\.yml$/,
]

// GET /pulls/{n}/files lists at most 3000 files; past that the list is incomplete.
const API_FILE_CAP = 3000

/** The first changed path a visual layer reads, or undefined when none does. */
export function firstRenderedPath(paths) {
  return paths.find((path) => RENDERED_UI_PATTERNS.some((pattern) => pattern.test(path)))
}

/** Every path a pull request changes, renamed files counted under both names. */
export async function fetchChangedPaths({ repo, pr, token, fetchImpl = fetch }) {
  const paths = []
  for (let page = 1; ; page++) {
    const url = `https://api.github.com/repos/${repo}/pulls/${pr}/files?per_page=100&page=${page}`
    const response = await fetchImpl(url, {
      headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json' },
    })
    if (!response.ok) throw new Error(`GET ${url} failed with ${response.status}`)
    const files = await response.json()
    for (const file of files)
      paths.push(file.filename, ...(file.previous_filename ? [file.previous_filename] : []))
    if (files.length < 100) return paths
  }
}

/** The run decision and the one line the job logs for it. */
export function decide(paths) {
  if (paths.length >= API_FILE_CAP) {
    return {
      run: true,
      reason: `${paths.length} changed paths reach the API cap; running every layer`,
    }
  }
  const rendered = firstRenderedPath(paths)
  if (rendered) return { run: true, reason: `${rendered} is rendered UI; running every layer` }
  return {
    run: false,
    reason: `none of ${paths.length} changed paths is rendered UI; skipping every visual layer`,
  }
}

async function main() {
  const { GITHUB_REPOSITORY, PR_NUMBER, GITHUB_TOKEN, GITHUB_OUTPUT } = process.env
  let decision
  try {
    const paths = await fetchChangedPaths({
      repo: GITHUB_REPOSITORY,
      pr: PR_NUMBER,
      token: GITHUB_TOKEN,
    })
    decision = decide(paths)
  } catch (error) {
    decision = {
      run: true,
      reason: `could not list changed paths (${error.message}); running every layer`,
    }
  }
  console.log(`visual-paths: ${decision.reason}`)
  if (GITHUB_OUTPUT) appendFileSync(GITHUB_OUTPUT, `run=${decision.run}\n`)
}

if (isEntryPoint(import.meta.url, process.argv[1])) await main()

// Fails the publish job when the npm registry does not serve the tagged react-ui version.
// `npm publish` can exit 0 (or a job can be skipped) while the registry still lacks the version,
// so this reads the registry document back, polling because the registry is eventually consistent.
// Usage: node check-npm-published.mjs <version>
import { pathToFileURL } from 'node:url'

const PACKAGE = '@titan-design/react-ui'
const REGISTRY_URL = `https://registry.npmjs.org/${PACKAGE.replace('/', '%2F')}`
const DEFAULT_RETRIES = 10
const DEFAULT_DELAY_MS = 15_000

/** One registry read: `{ found }` or `{ found: false, reason }`. Never throws. */
async function readOnce(version, fetchImpl) {
  try {
    const response = await fetchImpl(REGISTRY_URL, { headers: { accept: 'application/json' } })
    if (!response.ok) return { found: false, reason: `registry answered HTTP ${response.status}` }
    const doc = await response.json()
    return Object.hasOwn(doc?.versions ?? {}, version)
      ? { found: true }
      : { found: false, reason: 'version not in registry document' }
  } catch (error) {
    return { found: false, reason: `network error: ${error?.message ?? error}` }
  }
}

/** Polls up to `retries` reads, `delayMs` apart. Resolves `{ ok, message }`. */
export async function checkNpmPublished({
  version,
  fetchImpl = fetch,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  retries = DEFAULT_RETRIES,
  delayMs = DEFAULT_DELAY_MS,
}) {
  let reason = 'no read attempted'
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    const read = await readOnce(version, fetchImpl)
    if (read.found) return { ok: true, message: `${PACKAGE}@${version} is served by npm` }
    reason = read.reason
    if (attempt < retries) await sleep(delayMs)
  }
  return {
    ok: false,
    message: `${PACKAGE}@${version} is not served by npm after ${retries} reads (last: ${reason})`,
  }
}

async function main(argv) {
  const version = argv[2]
  if (!version) {
    console.error('usage: check-npm-published.mjs <version>')
    return 2
  }
  const { ok, message } = await checkNpmPublished({ version })
  if (ok) console.log(message)
  else console.error(message)
  return ok ? 0 : 1
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  process.exit(await main(process.argv))
}

/**
 * Shared plumbing for the baseline-ratchet rules: load a committed baseline, key a file
 * into it, find the `src/` root, and tell module scope from function scope.
 */

const fs = require('node:fs')
const path = require('node:path')

const FUNCTION_TYPES = new Set([
  'FunctionDeclaration',
  'FunctionExpression',
  'ArrowFunctionExpression',
])

const baselineCache = new Map()

/**
 * The parsed baseline in `fileName` (beside this file unless `dir` says otherwise), `{}` when the file is missing.
 * A file that exists but does not parse throws: swallowing it would let the ratchet allow everything.
 */
function loadBaseline(fileName, dir = __dirname) {
  const file = path.join(dir, fileName)
  if (baselineCache.has(file)) return baselineCache.get(file)
  let baseline = {}
  try {
    baseline = JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch (error) {
    if (error.code !== 'ENOENT' && error.code !== 'MODULE_NOT_FOUND') {
      throw new Error(`Cannot load lint baseline ${fileName}: ${error.message}`, { cause: error })
    }
  }
  baselineCache.set(file, baseline)
  return baseline
}

function cwdOf(context) {
  return context.cwd ?? context.getCwd?.() ?? process.cwd()
}

/** Baseline keys are package-relative POSIX paths, so they're stable across machines. */
function baselineKey(context) {
  return path
    .relative(cwdOf(context), context.filename ?? context.getFilename())
    .split(path.sep)
    .join('/')
}

/**
 * Absolute path of the `src/` root of the file being linted: the LAST `/src/` segment, so a
 * checkout under a directory that is itself named `src` still resolves. Falls back to the cwd.
 */
function srcRootOf(context) {
  const filename = context.filename ?? context.getFilename()
  const marker = `${path.sep}src${path.sep}`
  const i = filename.lastIndexOf(marker)
  return i === -1 ? cwdOf(context) : filename.slice(0, i + marker.length - 1)
}

/** True when no enclosing function stands between `node` and the module body. */
function isAtModuleScope(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (FUNCTION_TYPES.has(current.type)) return false
  }
  return true
}

module.exports = { loadBaseline, baselineKey, srcRootOf, isAtModuleScope }

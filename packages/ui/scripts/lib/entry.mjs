import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * True when the module at `metaUrl` is the process entry point, even when invoked through a
 * symlink or from a path holding a space, `%` or non-ASCII (where `import.meta.url` is
 * percent-encoded and a string comparison with `argv[1]` never matches).
 */
export function isEntryPoint(metaUrl, entry, real = realpathSync) {
  if (!entry) return false
  try {
    return real(fileURLToPath(metaUrl)) === real(entry)
  } catch {
    return false
  }
}

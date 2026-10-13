import type { Lock } from './locks.ts'

// How every check reads what a lock covers. lockConflicts here and the harness's `locks check`
// and `locks sync` all match tokens through this module, so they agree on what a lock hits.

/** A token a plan or lock names; leaving `mode` out means both modes. */
export interface ModeToken {
  name: string
  mode?: 'light' | 'dark'
}

/** What a lock covers: paths, tokens (a name may be a family), and the components reading them. */
export interface LockSurface {
  /** Paths the holder changes or the decision declares: a plan touching one conflicts. */
  files: string[]
  tokens: ModeToken[]
  /** Components that read a locked token: a plan touching one renders under the lock. */
  readers: string[]
}

const escapeRegExp = (s: string) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&')

/** `**` crosses directories, `*` and `?` do not. */
export function globRegExp(glob: string): RegExp {
  const body = glob
    .split(/(\*\*\/|\*\*|\*|\?)/)
    .map((part) =>
      part === '**/'
        ? '(?:.*/)?'
        : part === '**'
          ? '.*'
          : part === '*'
            ? '[^/]*'
            : part === '?'
              ? '[^/]'
              : escapeRegExp(part)
    )
    .join('')
  return new RegExp(`^${body}$`)
}

/** A lock may name a token family (`*-subtle`, `tint-{hue}-solid / on-tint-{hue}`). */
function tokenNamePatterns(name: string): RegExp[] {
  return name.split(' / ').map((alt) => globRegExp(alt.trim().replace(/\{[^}]*\}/g, '*')))
}

function namesMatch(a: string, b: string): boolean {
  return (
    tokenNamePatterns(a).some((re) => re.test(b)) || tokenNamePatterns(b).some((re) => re.test(a))
  )
}

export const tokenKey = (t: ModeToken) => (t.mode ? `${t.name}/${t.mode}` : t.name)

/** Whether two tokens can be one property: names match as families, modes agree or one is open. */
export function tokensMatch(a: ModeToken, b: ModeToken): boolean {
  return (!a.mode || !b.mode || a.mode === b.mode) && namesMatch(a.name, b.name)
}

/** The derived footprint and the declared touches together. */
export function lockSurface(lock: Pick<Lock, 'footprint' | 'touches'>): LockSurface {
  const fp = lock.footprint
  return {
    files: [
      ...new Set([
        ...(fp?.files ?? []),
        ...(fp?.components.direct ?? []),
        ...(lock.touches?.components ?? []),
      ]),
    ],
    tokens: [...(fp?.tokens ?? []), ...(lock.touches?.tokens ?? [])],
    readers: fp?.components.readers ?? [],
  }
}

/** The tokens of `tokens` that some locked token matches, each once, in their own order. */
export function lockedTokens(tokens: ModeToken[], lock: Pick<Lock, 'footprint' | 'touches'>) {
  const locked = lockSurface(lock).tokens
  const seen = new Set<string>()
  return tokens.filter((t) => {
    const key = tokenKey(t)
    const hit = !seen.has(key) && locked.some((l) => tokensMatch(l, t))
    seen.add(key)
    return hit
  })
}

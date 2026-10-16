// Types for the exports of doc-claims.mjs, so its test type-checks under the examples project
// (check-examples-types.mjs).

/** Doc path, relative to the repo root, to its sorted `kind:claim` keys. */
export type ClaimsByDoc = Record<string, string[]>

export interface RetiredTerm {
  term: string
  why: string
}

export interface RepoContext {
  files: string[]
  pathSuffixes: Set<string>
  scripts: Set<string>
  packages: Set<string>
  retired: RetiredTerm[]
}

export const REPO_ROOT: string
export const BASELINE_PATH: string

export function isScopedDoc(file: string): boolean

export function splitFences(markdown: string): {
  prose: string[]
  fences: { lang: string; code: string }[]
}

export function pathCandidate(span: string): string | undefined

export function pnpmScripts(text: string): string[]

export function importedPackages(code: string): string[]

export function extractClaims(markdown: string, retired: RetiredTerm[]): string[]

export function resolvePath(claim: string, doc: string, context: RepoContext): boolean

export function resolveScript(name: string, context: RepoContext): boolean

export function resolveImport(name: string, context: RepoContext): boolean

export function resolveClaim(key: string, doc: string, context: RepoContext): boolean

export function checkedText(doc: string, markdown: string): string

export function deadClaims(doc: string, markdown: string, context: RepoContext): string[]

export function pathSuffixSet(files: string[]): Set<string>

export function listRepoFiles(root: string): string[]

export function loadRepoContext(root?: string): RepoContext

export function collectDeadClaims(context: RepoContext, root?: string): ClaimsByDoc

export function compareToBaseline(
  findings: ClaimsByDoc,
  baseline: ClaimsByDoc
): { unlisted: string[]; stale: string[] }

export function updatedBaseline(
  findings: ClaimsByDoc,
  baseline: ClaimsByDoc,
  options?: { allowIncrease?: boolean }
): ClaimsByDoc

export function readBaseline(): ClaimsByDoc

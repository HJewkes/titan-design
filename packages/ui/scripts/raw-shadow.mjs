/**
 * Raw Tailwind shadow check (TD-286, E1 of the library roadmap).
 *
 * Pure over a tree: an object mapping a path relative to `src/components` to that
 * file's source. `src/arch/raw-shadow.test.ts` feeds it the real tree.
 *
 * Matches the preset scale (`shadow-sm` to `shadow-2xl`, `shadow-inner`) and arbitrary
 * `shadow-[...]`, with any variant prefix. Bare `shadow` and `shadow-glow-*` pass.
 */
const RAW_SHADOW =
  /(?<![\w-])(?:[\w[\]-]+:)*shadow-(?:(?:sm|md|lg|xl|2xl|inner)(?![\w-])|\[[^\s'"`]*\])/g

const SOURCE_FILE = /\.tsx?$/

export function findRawShadows(tree) {
  const hits = []
  for (const [file, source] of Object.entries(tree)) {
    if (!SOURCE_FILE.test(file)) continue
    source.split('\n').forEach((text, index) => {
      for (const match of text.matchAll(RAW_SHADOW)) {
        hits.push({ file, line: index + 1, match: match[0] })
      }
    })
  }
  return hits
}

export function describeShadow({ file, line, match }) {
  return `${file}:${line} uses \`${match}\`; use the floating lift recipe (liftStyle in theme/lift) instead of a Tailwind shadow`
}

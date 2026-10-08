// @vitest-environment node
//
// The DEFAULT variant of a colour token is the suffix-less utility:
// `colors.border.DEFAULT` emits `border-border`, never `border-border-default`.
// A `*-default` class names a token Tailwind never generates, so it renders
// nothing and NativeWind falls back to currentColor (black borders).
// Stories, tests and visual specs are exempt: they may show the mistake on purpose.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const COMPONENTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../components')

const DEFAULT_SUFFIX_CLASS =
  /(bg|text|border|divide|ring|fill|stroke|outline|caret|accent|placeholder|decoration|from|via|to)-[a-z]+(-[a-z]+)*-default\b/
const EXEMPT_MARKERS = ['.test.', '.stories.', '.visual.', 'var(--']
const SOURCE_EXTENSIONS = ['.ts', '.tsx']

type Tree = Record<string, string>

function readSourceTree(root: string): Tree {
  const tree: Tree = {}
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
        tree[path.relative(root, abs).split(path.sep).join('/')] = fs.readFileSync(abs, 'utf8')
      }
    }
  }
  walk(root)
  return tree
}

/** `file:line: text` for each offending line, exempting as the old grep pipeline did. */
function findDefaultSuffixClasses(tree: Tree): string[] {
  return Object.entries(tree).flatMap(([file, source]) =>
    source.split('\n').flatMap((text, index) => {
      const hit = `${file}:${index + 1}: ${text.trim()}`
      const isExempt = EXEMPT_MARKERS.some((marker) => `${file}:${text}`.includes(marker))
      return DEFAULT_SUFFIX_CLASS.test(text) && !isExempt ? [hit] : []
    })
  )
}

const scan = (source: string, file = 'ui/box/Box.tsx') =>
  findDefaultSuffixClasses({ [file]: source })

describe('DEFAULT-suffix token classes', () => {
  it('finds none in the component tree', () => {
    expect(findDefaultSuffixClasses(readSourceTree(COMPONENTS_ROOT))).toEqual([])
  })

  it('reports file, line and text of a border-border-default class', () => {
    const source = 'const a = 1\n<View className="border border-border-default" />'

    expect(scan(source)).toEqual([
      'ui/box/Box.tsx:2: <View className="border border-border-default" />',
    ])
  })

  it('finds a multi-segment token on another utility', () => {
    expect(scan('<View className="bg-surface-raised-default" />')).toHaveLength(1)
  })

  it('accepts the suffix-less DEFAULT class', () => {
    expect(scan('<View className="border border-border bg-border divide-border" />')).toEqual([])
  })

  it('ignores a longer word that starts with default', () => {
    expect(scan('<View className="text-text-defaultish" />')).toEqual([])
  })

  it('exempts stories, tests and visual specs', () => {
    const line = '<View className="border-border-default" />'

    expect([
      ...scan(line, 'ui/box/Box.stories.tsx'),
      ...scan(line, 'ui/box/Box.test.tsx'),
      ...scan(line, 'ui/box/Box.visual.tsx'),
    ]).toEqual([])
  })

  it('exempts a line that reads the CSS variable', () => {
    expect(scan("const c = 'var(--color-border-default)' // border-border-default")).toEqual([])
  })
})

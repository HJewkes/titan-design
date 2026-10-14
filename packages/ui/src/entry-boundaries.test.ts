import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const SRC_DIR = path.dirname(fileURLToPath(import.meta.url))
const UI_DIR = path.join(SRC_DIR, '..')
const PACKAGES_DIR = path.join(UI_DIR, '..')
const MOTION_DIR = path.join(SRC_DIR, 'components', 'ui', 'motion')
const SELF = fileURLToPath(import.meta.url)
const SKIPPED_DIRS = new Set([
  'node_modules',
  'dist',
  '.turbo',
  '.git',
  'coverage',
  'storybook-static',
])
const CODE_EXT = /\.(?:[cm]?[jt]sx?)$/

// Modules that own time. Everything else under ui/motion is pure math a main-entry component may import.
const RUNTIME_MODULES = new Set([
  'clocks',
  'hooks',
  'MotionProvider',
  'Beat',
  'bridge',
  'cues',
  'envelope',
])
const RUNTIME_NAMES = new Set([
  'mediaClock',
  'rafClock',
  'seekClock',
  'MotionProvider',
  'Beat',
  'BeatFrame',
  'envelope',
  'useBeatEnvelope',
  'useCue',
  'localTime',
  'useLocalTime',
  'useMotionTime',
  'useRawLocalTime',
  'useWaitUntil',
])
const FORBIDDEN_PACKAGE =
  /^(?:zod(?:\/|$)|@titan-design\/beats(?:\/|$)|@titan-platform\/|titan-platform(?:\/|$))/

// Allowlist of pre-existing violations, as repo-relative paths. Only ever shrinks; empty today.
const RUNTIME_IMPORT_ALLOWLIST: readonly string[] = []

const IMPORT_CLAUSE = String.raw`(?:import|export)\s+(?:type\s+)?([^'";]*?)\s*from\s*['"]([^'"]+)['"]`
const SIDE_EFFECT_OR_DYNAMIC = String.raw`(?:import\s*\(\s*|require\s*\(\s*|^\s*import\s+)['"]([^'"]+)['"]`

interface ImportRef {
  specifier: string
  clause: string
}

function importsOf(source: string): ImportRef[] {
  const refs: ImportRef[] = []
  for (const m of source.matchAll(new RegExp(IMPORT_CLAUSE, 'g'))) {
    refs.push({ clause: m[1], specifier: m[2] })
  }
  for (const m of source.matchAll(new RegExp(SIDE_EFFECT_OR_DYNAMIC, 'gm'))) {
    refs.push({ clause: '', specifier: m[1] })
  }
  return refs
}

function boundImports(clause: string): string[] {
  return clause
    .replace(/[{}*]/g, ' ')
    .split(',')
    .flatMap((part) =>
      part
        .trim()
        .split(/\s+as\s+/)[0]
        .replace(/^type\s+/, '')
        .trim()
    )
    .filter(Boolean)
}

/** True when `specifier`, imported from `fromFile`, reaches a time-owning motion module or symbol. */
function reachesMotionRuntime(fromFile: string, ref: ImportRef): boolean {
  if (!ref.specifier.startsWith('.')) return false
  const target = path.resolve(path.dirname(fromFile), ref.specifier)
  const rel = path.relative(MOTION_DIR, target)
  if (rel.startsWith('..') || path.isAbsolute(rel)) return false
  if (RUNTIME_MODULES.has(rel.split(path.sep)[0].replace(/\.[jt]sx?$/, ''))) return true
  const isBarrel = rel === '' || rel === 'index'
  if (!isBarrel) return false
  const names = boundImports(ref.clause)
  return names.length === 0 || names.some((n) => RUNTIME_NAMES.has(n)) || /\*/.test(ref.clause)
}

function findRuntimeImports(fromFile: string, source: string): string[] {
  return importsOf(source)
    .filter((ref) => reachesMotionRuntime(fromFile, ref))
    .map((ref) => ref.specifier)
}

function findForbiddenPackages(source: string): string[] {
  return importsOf(source)
    .map((ref) => ref.specifier)
    .filter((specifier) => FORBIDDEN_PACKAGE.test(specifier))
}

function* walk(dir: string): Generator<string> {
  for (const name of readdirSync(dir)) {
    if (SKIPPED_DIRS.has(name)) continue
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) yield* walk(full)
    else yield full
  }
}

const rel = (file: string) => path.relative(PACKAGES_DIR, file)

describe('entry boundaries', () => {
  it('keeps motion clocks, hooks, MotionProvider and Beat inside components/ui/motion', () => {
    const offenders = [...walk(SRC_DIR)]
      .filter((f) => CODE_EXT.test(f) && f !== SELF)
      .filter((f) => !f.startsWith(MOTION_DIR + path.sep))
      .filter((f) => path.relative(SRC_DIR, f) !== 'motion.ts')
      .filter((f) => findRuntimeImports(f, readFileSync(f, 'utf8')).length > 0)
      .map(rel)
      .filter((f) => !RUNTIME_IMPORT_ALLOWLIST.includes(f))
    expect(offenders).toEqual([])
  })

  it('imports no zod, @titan-design/beats or titan-platform package in packages/ui', () => {
    const offenders = [...walk(UI_DIR)]
      .filter((f) => CODE_EXT.test(f) && f !== SELF)
      .filter((f) => findForbiddenPackages(readFileSync(f, 'utf8')).length > 0)
      .map(rel)
    expect(offenders).toEqual([])
  })

  it('has no .py file under packages', () => {
    const offenders = [...walk(PACKAGES_DIR)].filter((f) => f.endsWith('.py')).map(rel)
    expect(offenders).toEqual([])
  })

  it('lists no MotionProvider or seekClock in the index api report', () => {
    const report = readFileSync(path.join(UI_DIR, 'api', 'index.api.md'), 'utf8')
    expect(report).not.toMatch(/MotionProvider|seekClock/)
  })

  describe('scanner', () => {
    const component = path.join(SRC_DIR, 'components', 'ui', 'chip', 'Chip.tsx')

    it.each([
      ["import { seekClock } from '../motion/clocks'"],
      ["import { useLocalTime } from '../motion/hooks'"],
      ["import { MotionProvider } from '../motion/MotionProvider'"],
      ["import { Beat } from '../motion'"],
      ["import { seekClock } from '../motion/index'"],
      ["export * from '../motion'"],
      ["const m = await import('../motion/Beat')"],
    ])('flags %s', (line) => {
      expect(findRuntimeImports(component, line)).not.toEqual([])
    })

    it.each([
      ["import { interpolate } from '../motion/interpolate'"],
      ["import { easeOut, poly } from '../motion/easing'"],
      ["import { MOTION } from '../motion'"],
      ["import { useState } from 'react'"],
    ])('allows %s', (line) => {
      expect(findRuntimeImports(component, line)).toEqual([])
    })

    it.each([
      ["import { z } from 'zod'"],
      ["import x from '@titan-design/beats'"],
      ["import y from '@titan-platform/render-qa'"],
    ])('flags package import %s', (line) => {
      expect(findForbiddenPackages(line)).not.toEqual([])
    })
  })
})

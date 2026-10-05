/* eslint-disable titan/no-var-color-opacity --
 * The fixtures and checker cases below quote dead classes on purpose.
 */
import fs from 'node:fs'
import path from 'node:path'
import { Linter } from 'eslint'
import fixOptions from '../../eslint-rules/fix-options'
import { compileClasses, uiRoot } from './tailwind-compile'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const config = require('../../eslint.config.js') as Linter.Config[]

/**
 * The lint message contract (eslint-rules/README.md): every custom lint message
 * names the violation, says what owns the value, lists real options and names
 * the escape hatch. This test enumerates every message the `titan` plugin and
 * `no-restricted-syntax` can emit, and holds each one that has a fixture to the
 * contract. Ids in PENDING predate the contract and are exempt until the slice
 * that rewrites them removes them; PENDING may only shrink.
 */

type Fixture = { code: string; filename: string }

const SYMBOLS = fixOptions.SYMBOLS as Record<string, string>
const SRC = path.join(uiRoot, 'src')
const FIX_CLAUSE = /\b(use|move|resolve|build|compose|render|describe|add|call|derive|reuse)\b/i
const SYMBOL_OPTION = /^([A-Za-z_$][\w$]*)\(.*\)$/
const CLASS_OPTION = /^(?:[a-z]+:)*-?[a-z][a-z0-9]*(?:-[a-z0-9.[\]/]+)+$/
const PATH_OPTION = /^[a-z][\w-]*\/[\w./-]*$/
const ROOT_OPTION = /^[A-Z][\w ]*\/[\w|/ ]*$/
const EXPORT_OPTION = /^[A-Z][A-Za-z0-9]*$/
const STORY_ROOTS = fixOptions.storyRoots as string[]
const PATH_SUFFIXES = ['', '.ts', '.tsx', '/index.ts', '/index.tsx']

const HEX_RESTRICTED = 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]'
const HEX_TEMPLATE = 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]'
const GRADIENT_LITERAL = 'Literal[value=/linear-gradient/]'
const GRADIENT_TEMPLATE = 'TemplateElement[value.raw=/linear-gradient/]'
const SCALE_PROPS =
  '\\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|text|rounded|space-x|space-y)-\\[[0-9.]+px\\]'
const ARBITRARY_LITERAL = `Literal[value=/${SCALE_PROPS}/]`
const ARBITRARY_TEMPLATE = `TemplateElement[value.raw=/${SCALE_PROPS}/]`
const FONT_SIZE = 'Property[key.name="fontSize"][value.type="Literal"]'
const FROZEN_CALL =
  'CallExpression[callee.name="getSemanticColors"]:not(:has(> CallExpression[callee.name="useSurfaceMode"]))'

const PENDING = new Set<string>([
  'titan/no-device-internals:hex',
  'titan/no-device-internals:frame',
  'titan/no-device-internals:uuid',
  'titan/no-frozen-theme:literalMode',
  'titan/no-frozen-theme:moduleScope',
  'titan/no-local-formatter:toFixed',
  'titan/no-local-formatter:formatFn',
  'titan/no-raw-composition:rawButton',
  'titan/no-raw-composition:d3Import',
  'titan/no-raw-composition:pathMath',
  'titan/no-raw-device-data-in-chat:rawConstructor',
  'titan/no-raw-device-data-in-chat:hexLiteral',
  'titan/no-raw-device-data-in-chat:byteSequence',
  'titan/no-raw-device-data-in-chat:rawFieldAccess',
  'titan/no-raw-device-data-in-chat:hyphenatedDataKey',
  'titan/no-raw-spacing:rawSpacing',
  `no-restricted-syntax:${ARBITRARY_LITERAL}`,
  `no-restricted-syntax:${ARBITRARY_TEMPLATE}`,
  `no-restricted-syntax:${FONT_SIZE}`,
])

const SHELL_FILE = 'src/components/shell/ContractFixture.tsx'
const UI_FILE = 'src/components/ui/contract-fixture/ContractFixture.tsx'
const TOKEN_PURE_FILE = 'src/components/custom/ActiveWork/ContractFixture.tsx'
const inShell = (code: string): Fixture => ({ code, filename: SHELL_FILE })
const FIXTURES: Record<string, Fixture> = {
  'titan/no-raw-color:hex': inShell("export const s = { color: '#123456' }"),
  'titan/no-raw-color:functional': inShell("export const s = { color: 'rgba(0, 0, 0, 0.5)' }"),
  'titan/no-raw-color:twPalette': inShell("export const c = 'bg-red-500'"),
  'titan/no-raw-color:twAchromatic': inShell("export const c = 'text-white'"),
  'titan/no-raw-color:twArbitrary': inShell("export const c = 'border-[#123456]'"),
  'titan/no-raw-color:named': inShell("export const c = 'white'"),
  'titan/no-var-color-opacity:deadClass': inShell("export const c = 'bg-hairline/20'"),
  'titan/no-var-color-opacity:deadClassNoRung': inShell("export const c = 'bg-divider/50'"),
  [`no-restricted-syntax:${GRADIENT_LITERAL}`]: inShell(
    "export const g = 'linear-gradient(transparent, transparent)'"
  ),
  [`no-restricted-syntax:${GRADIENT_TEMPLATE}`]: inShell(
    'export const g = `linear-gradient(transparent, transparent)`'
  ),
  [`no-restricted-syntax:${FROZEN_CALL}`]: {
    code: "export const c = getSemanticColors('dark')",
    filename: TOKEN_PURE_FILE,
  },
  'titan/no-deprecated-import:deprecated': {
    code: "import { StatusDot } from '@/components/custom/Workout/StatusDot'",
    filename: UI_FILE,
  },
  'titan/no-upward-tier-import:upward': {
    code: "import { PrBadge } from '@/components/custom/Workout/PrBadge'",
    filename: UI_FILE,
  },
  'titan/story-title-prefix:unknownPrefix': {
    code: "const meta = { title: 'Widgets/ContractFixture' }\nexport default meta",
    filename: 'src/components/ui/contract-fixture/ContractFixture.stories.tsx',
  },
  [`no-restricted-syntax:${HEX_RESTRICTED}`]: {
    code: "export const a = '#123456'",
    filename: SHELL_FILE,
  },
  [`no-restricted-syntax:${HEX_TEMPLATE}`]: {
    code: 'export const a = `#123456`',
    filename: SHELL_FILE,
  },
}

type Entry = { id: string; template: string }

function titanEntries(): Entry[] {
  const plugin = config.find((block) => block.plugins?.titan)?.plugins?.titan as {
    rules: Record<string, { meta: { messages: Record<string, string> } }>
  }
  return Object.entries(plugin.rules).flatMap(([rule, { meta }]) =>
    Object.entries(meta.messages).map(([messageId, template]) => ({
      id: `titan/${rule}:${messageId}`,
      template,
    }))
  )
}

function restrictedEntries(): Entry[] {
  const entries = new Map<string, Entry>()
  for (const block of config) {
    const [, ...options] = (block.rules?.['no-restricted-syntax'] ?? []) as unknown[] as Array<
      { selector: string; message: string } | string
    >
    for (const option of options) {
      if (typeof option === 'string') continue
      const id = `no-restricted-syntax:${option.selector}`
      entries.set(id, { id, template: option.message })
    }
  }
  return [...entries.values()]
}

const ENTRIES = [...titanEntries(), ...restrictedEntries()]

function render(entry: Entry, fixture: Fixture): string | undefined {
  const [ruleId, messageId] = entry.id.startsWith('titan/')
    ? [entry.id.split(':')[0], entry.id.split(':')[1]]
    : ['no-restricted-syntax', undefined]
  const messages = new Linter({ configType: 'flat' }).verify(fixture.code, config, {
    filename: path.join(uiRoot, fixture.filename),
  })
  return messages.find(
    (m) =>
      m.ruleId === ruleId && (messageId ? m.messageId === messageId : m.message === entry.template)
  )?.message
}

async function symbolProblem(span: string): Promise<string | undefined> {
  const name = span.match(SYMBOL_OPTION)?.[1] as string
  const mod = SYMBOLS[name]
  if (!mod) return `symbol \`${name}\` is not in SYMBOLS`
  const exported = await import(/* @vite-ignore */ path.join(SRC, mod))
  return name in exported ? undefined : `symbol \`${name}\` is not exported from ${mod}`
}

/**
 * A path as a message names it: under `src/components/` (`ui/`, `custom/X`), `src`-relative
 * (`theme/gradients`), or package-relative from `src/` (`src/hooks/x.ts`).
 */
function pathProblem(span: string): string | undefined {
  const bases = [path.join(SRC, 'components', span), path.join(SRC, span), path.join(uiRoot, span)]
  const exists = bases.some((base) => PATH_SUFFIXES.some((ext) => fs.existsSync(base + ext)))
  return exists ? undefined : `path \`${span}\` does not exist under src`
}

function rootProblem(span: string): string | undefined {
  const root = span.split('/')[0]
  return STORY_ROOTS.includes(root) ? undefined : `story root \`${root}\` is not in preview.tsx`
}

async function exportProblem(span: string): Promise<string | undefined> {
  const exported = await import(/* @vite-ignore */ path.join(SRC, 'index'))
  return span in exported ? undefined : `\`${span}\` is not exported from the package`
}

export async function contractProblems(message: string): Promise<string[]> {
  const spans = [...message.matchAll(/`([^`]+)`/g)].map((m) => m[1])
  const of = (kind: RegExp) => spans.filter((span) => kind.test(span))
  const [symbols, classes, paths, roots, components] = [
    of(SYMBOL_OPTION),
    of(CLASS_OPTION),
    // A class with an opacity modifier (`bg-white/50`) is path-shaped too; it goes to the compile check.
    of(PATH_OPTION).filter((span) => !CLASS_OPTION.test(span)),
    of(ROOT_OPTION),
    of(EXPORT_OPTION),
  ]
  const problems: string[] = []
  if (!FIX_CLAUSE.test(message)) problems.push('has no fix clause')
  const optionCount =
    symbols.length + classes.length + paths.length + roots.length + components.length
  if (optionCount === 0) problems.push('lists no backticked option')
  const compiled = classes.length ? await compileClasses(classes) : new Set<string>()
  for (const cls of classes)
    if (!compiled.has(cls)) problems.push(`class \`${cls}\` does not compile`)
  const resolved = await Promise.all([
    ...symbols.map(symbolProblem),
    ...components.map(exportProblem),
    ...paths.map(pathProblem),
    ...roots.map(rootProblem),
  ])
  return [...problems, ...resolved.filter((p): p is string => Boolean(p))]
}

describe('lint message contract: the checker', () => {
  it('accepts a message with a fix clause, a compiling class and an exported symbol', async () => {
    const message = 'Use `bg-surface-base` or `resolveColor(token)` instead.'
    expect(await contractProblems(message)).toEqual([])
  })

  it('rejects a message with no fix clause or option', async () => {
    expect(await contractProblems('Raw colour.')).toEqual([
      'has no fix clause',
      'lists no backticked option',
    ])
  })

  it('rejects a class that is not in the Tailwind config', async () => {
    expect(await contractProblems('Use `bg-surface-hover` instead.')).toEqual([
      'class `bg-surface-hover` does not compile',
    ])
  })

  it('rejects a symbol that its SYMBOLS module does not export', async () => {
    expect(await contractProblems('Use `noSuchHelper()` instead.')).toEqual([
      'symbol `noSuchHelper` is not in SYMBOLS',
    ])
  })

  it('accepts a real path, story root and package export as options', async () => {
    const message = 'Move `custom/Workout` to `ui/`, title it `Components/`, or use `Indicator`.'
    expect(await contractProblems(message)).toEqual([])
  })

  it('rejects a path, story root or export that does not exist', async () => {
    const message = 'Move it to `ui/no-such-dir`, title it `Widgets/`, or use `NoSuchThing`.'
    expect(await contractProblems(message)).toEqual([
      '`NoSuchThing` is not exported from the package',
      'path `ui/no-such-dir` does not exist under src',
      'story root `Widgets` is not in preview.tsx',
    ])
  })

  it('accepts a class with an opacity modifier that compiles, without a path check', async () => {
    expect(await contractProblems('Use `bg-white/50` instead.')).toEqual([])
  })

  it('rejects a class with an opacity modifier that compiles to nothing, as a class', async () => {
    expect(await contractProblems('Use `bg-hairline/20` instead.')).toEqual([
      'class `bg-hairline/20` does not compile',
    ])
  })

  it('accepts a package-relative path under src', async () => {
    expect(await contractProblems('Move it to `src/hooks/useMeasuredWidth.ts`.')).toEqual([])
  })

  it('rejects a package-relative path under src that does not exist', async () => {
    expect(await contractProblems('Move it to `src/hooks/no-such-hook.ts`.')).toEqual([
      'path `src/hooks/no-such-hook.ts` does not exist under src',
    ])
  })

  it('rejects a symbol missing from the module SYMBOLS names for it', async () => {
    const original = SYMBOLS.alpha
    SYMBOLS.alpha = 'theme/gradients'
    try {
      expect(await contractProblems('Use `alpha(token, 0.5)` instead.')).toEqual([
        'symbol `alpha` is not exported from theme/gradients',
      ])
    } finally {
      SYMBOLS.alpha = original
    }
  })
})

describe('lint message contract: every message the config can emit', () => {
  it('enumerates the titan plugin and the restricted-syntax messages', () => {
    const ids = ENTRIES.map((entry) => entry.id)
    expect(ids).toContain('titan/no-var-color-opacity:deadClass')
    expect(ids).toContain(`no-restricted-syntax:${HEX_RESTRICTED}`)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has a fixture for every id that is not PENDING', () => {
    const missing = ENTRIES.map((e) => e.id).filter((id) => !PENDING.has(id) && !FIXTURES[id])
    expect(
      missing,
      'a new message id needs a fixture that meets the contract; PENDING is closed to new ids'
    ).toEqual([])
  })

  it('keeps PENDING shrink-only: only ids that exist and have no fixture', () => {
    const known = new Set(ENTRIES.map((entry) => entry.id))
    const stale = [...PENDING].filter((id) => !known.has(id))
    const reAdded = [...PENDING].filter((id) => FIXTURES[id])
    expect(stale, 'PENDING lists an id the config no longer emits').toEqual([])
    expect(reAdded, 'a conforming id (it has a fixture) may not be PENDING').toEqual([])
  })

  it.each(ENTRIES.filter((entry) => FIXTURES[entry.id]))(
    '$id renders a message that meets the contract',
    async (entry) => {
      const message = render(entry, FIXTURES[entry.id])
      expect(message, 'the fixture must trigger the message').toBeDefined()
      expect(await contractProblems(message as string)).toEqual([])
    },
    // Linting a fixture parses the whole config; the first one is slow under coverage.
    30_000
  )
})

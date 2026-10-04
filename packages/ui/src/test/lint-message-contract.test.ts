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
  'titan/no-deprecated-import:deprecated',
  'titan/no-device-internals:hex',
  'titan/no-device-internals:frame',
  'titan/no-device-internals:uuid',
  'titan/no-frozen-theme:literalMode',
  'titan/no-frozen-theme:moduleScope',
  'titan/no-local-formatter:toFixed',
  'titan/no-local-formatter:formatFn',
  'titan/no-raw-color:hex',
  'titan/no-raw-color:functional',
  'titan/no-raw-color:twPalette',
  'titan/no-raw-color:twAchromatic',
  'titan/no-raw-color:twArbitrary',
  'titan/no-raw-color:named',
  'titan/no-raw-composition:rawButton',
  'titan/no-raw-composition:d3Import',
  'titan/no-raw-composition:pathMath',
  'titan/no-raw-device-data-in-chat:rawConstructor',
  'titan/no-raw-device-data-in-chat:hexLiteral',
  'titan/no-raw-device-data-in-chat:byteSequence',
  'titan/no-raw-device-data-in-chat:rawFieldAccess',
  'titan/no-raw-device-data-in-chat:hyphenatedDataKey',
  'titan/no-raw-spacing:rawSpacing',
  'titan/no-upward-tier-import:upward',
  'titan/no-var-color-opacity:deadClass',
  'titan/story-title-prefix:unknownPrefix',
  `no-restricted-syntax:${GRADIENT_LITERAL}`,
  `no-restricted-syntax:${GRADIENT_TEMPLATE}`,
  `no-restricted-syntax:${ARBITRARY_LITERAL}`,
  `no-restricted-syntax:${ARBITRARY_TEMPLATE}`,
  `no-restricted-syntax:${FONT_SIZE}`,
  `no-restricted-syntax:${FROZEN_CALL}`,
])

const SHELL_FILE = 'src/components/shell/ContractFixture.tsx'
const FIXTURES: Record<string, Fixture> = {
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

export async function contractProblems(message: string): Promise<string[]> {
  const spans = [...message.matchAll(/`([^`]+)`/g)].map((m) => m[1])
  const symbols = spans.filter((span) => SYMBOL_OPTION.test(span))
  const classes = spans.filter((span) => CLASS_OPTION.test(span))
  const problems: string[] = []
  if (!FIX_CLAUSE.test(message)) problems.push('has no fix clause')
  if (symbols.length + classes.length === 0) problems.push('lists no backticked option')
  const compiled = classes.length ? await compileClasses(classes) : new Set<string>()
  for (const cls of classes)
    if (!compiled.has(cls)) problems.push(`class \`${cls}\` does not compile`)
  const symbolProblems = await Promise.all(symbols.map(symbolProblem))
  return [...problems, ...symbolProblems.filter((p): p is string => Boolean(p))]
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
    }
  )
})

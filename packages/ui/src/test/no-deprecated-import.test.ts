import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-deprecated-import'

// The rule loads the registry through Node's require; an ESM import here gets a second instance with its own cache.
const nativeRequire = createRequire(import.meta.url)
const { registryFor } = nativeRequire('../../eslint-rules/deprecated-export-registry')

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

// The registry reads real @deprecated tags off real files (no fixtures to
// swap in), so these cases resolve against this repo's actual src tree.
// Filenames are fake, non-existent consumer locations — only their
// DIRECTORY needs to be real, since that's what relative imports resolve
// against — chosen so none collides with an existing baseline entry.
const srcRoot = path.resolve(__dirname, '..')
const newUiConsumer = path.join(srcRoot, 'components/ui/newthing/NewThing.tsx')
const newCustomConsumer = path.join(srcRoot, 'components/custom/newthing/NewThing.tsx')

describe('no-deprecated-import', () => {
  it('shares the registry instance the rule loads', () => {
    const ruleRequire = createRequire(
      nativeRequire.resolve('../../eslint-rules/no-deprecated-import')
    )
    expect(registryFor).toBe(ruleRequire('./deprecated-export-registry').registryFor)
  })

  // The registry's cold scan of src takes 5-8 s on a CI runner; pay it here, not in the first case.
  beforeAll(() => {
    registryFor(srcRoot)
  }, 30_000)

  ruleTester.run('no-deprecated-import', rule as never, {
    valid: [
      // A live (non-deprecated) component is untouched.
      { code: "import { Card } from '../../ui/card/Card'", filename: newCustomConsumer },
      // Regression: `Workout/icons.tsx` deprecates its `WorkoutIconProps`
      // ALIAS in favour of using `IconProps` directly — the real `IconProps`
      // in `components/icons` must not be caught by that propagation.
      { code: "import { IconProps } from '../../icons'", filename: newCustomConsumer },
      // Positive control for `export *`: a live export through the same top-level barrel.
      { code: "import { Card } from '@/components/ui'", filename: newCustomConsumer },
      // The alias regression again, two `export *` hops up where both names are reachable.
      { code: "import { IconProps } from '@/components'", filename: newCustomConsumer },
      // Migration M9: Metric's new home and the root barrel stay clean.
      { code: "import { Metric } from '../../ui/metric'", filename: newCustomConsumer },
      { code: "import { Metric, MetricGroup } from '@/components'", filename: newCustomConsumer },
    ],
    invalid: [
      // Migration M9: the old custom/Metric path still resolves through its shim and is flagged.
      {
        code: "import { Metric, MetricGroup } from '../Metric'",
        filename: newCustomConsumer,
        errors: [
          { message: /'Metric' is deprecated.*Moved to `ui\/metric`/ },
          { message: /'MetricGroup' is deprecated.*Moved to `ui\/metric`/ },
        ],
      },
      // Positive control: BaseBadge's tag sits on its own declaration —
      // the exact gap VW-88 found (a docblock nobody enforced).
      {
        code: "import { BaseBadge } from '../../custom/Workout/BaseBadge'",
        filename: newUiConsumer,
        errors: [{ messageId: 'deprecated' }],
      },
      // Positive control via an UNTAGGED intermediate barrel: Tile's tag is
      // on Tile.tsx itself, not on ui/tile's re-export — a consumer reaching
      // it through that barrel must still be caught.
      {
        code: "import { Tile } from '../../ui/tile'",
        filename: newCustomConsumer,
        errors: [{ messageId: 'deprecated' }],
      },
      // Positive control the other direction: StatusDot's tag sits only on
      // the `custom/Workout` barrel's re-export line, not on StatusDot.tsx —
      // every real consumer imports the module file directly.
      // The message inlines the tag's first sentence, so it names the replacement.
      {
        code: "import { StatusDot } from '../../custom/Workout/StatusDot'",
        filename: newUiConsumer,
        errors: [
          {
            message:
              "'StatusDot' is deprecated and must not gain new consumers. Use `Indicator` " +
              '(roadmap decision 10) — removed after AW-127 consumer migration. ' +
              'Use that replacement instead (DEPRECATIONS.md).',
          },
        ],
      },
      // A pure rename suggests the new name under the old binding, so call sites still compile.
      {
        code: "import { DashboardShell } from '@/components/shell/workout/WorkoutShell'",
        filename: newCustomConsumer,
        errors: [
          {
            message: /Renamed to `WorkoutShell`/,
            suggestions: [
              {
                desc: "Import `WorkoutShell` in place of 'DashboardShell'.",
                output:
                  "import { WorkoutShell as DashboardShell } from '@/components/shell/workout/WorkoutShell'",
              },
            ],
          },
        ],
      },
      // An aliased import only swaps the imported name.
      {
        code: "import { DashboardShell as Frame } from '@/components/shell/workout/WorkoutShell'",
        filename: newCustomConsumer,
        errors: [
          {
            messageId: 'deprecated',
            suggestions: [
              {
                desc: "Import `WorkoutShell` in place of 'DashboardShell'.",
                output:
                  "import { WorkoutShell as Frame } from '@/components/shell/workout/WorkoutShell'",
              },
            ],
          },
        ],
      },
      // VW-322: `ui/index.ts` reaches Tile only through `export * from './tile'`.
      {
        code: "import { Tile } from '@/components/ui'",
        filename: newCustomConsumer,
        errors: [{ messageId: 'deprecated' }],
      },
      // Two `export *` hops, ending on StatusDot's tag on the `custom/Workout` barrel.
      {
        code: "import { StatusDot } from '@/components'",
        filename: newUiConsumer,
        errors: [{ messageId: 'deprecated' }],
      },
    ],
  })
})

describe('deprecated-export-registry export * semantics', () => {
  let fixtureRoot: string

  function writeFixture(files: Record<string, string>) {
    for (const [rel, text] of Object.entries(files)) {
      const abs = path.join(fixtureRoot, rel)
      fs.mkdirSync(path.dirname(abs), { recursive: true })
      fs.writeFileSync(abs, text)
    }
  }

  beforeEach(() => {
    fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'deprecated-registry-'))
  })

  afterEach(() => {
    fs.rmSync(fixtureRoot, { recursive: true, force: true })
  })

  it('lets a name the barrel exports itself shadow a deprecated star re-export', () => {
    writeFixture({
      'components/old.ts': '/** @deprecated */\nexport const Thing = 1\nexport const Other = 2\n',
      'components/fresh.ts': 'export const Thing = 3\n',
      'components/index.ts': "export * from './old'\nexport { Thing } from './fresh'\n",
    })

    const registry = registryFor(fixtureRoot)

    expect(registry.isDeprecated('components/index.ts', 'Thing')).toBe(false)
    expect(registry.isDeprecated('components/old.ts', 'Thing')).toBe(true)
  })

  it('keeps the first sentence of a multi-line tag and drops the rest', () => {
    writeFixture({
      'components/old.ts':
        '/**\n * Summary.\n *\n * @deprecated Moved to `ui/new` (migration M9). Import it\n' +
        ' * from the package as before. Removed in 0.23.0.\n * @see elsewhere\n */\n' +
        'export const Old = 1\n/** @deprecated */\nexport const Bare = 2\n',
    })

    const registry = registryFor(fixtureRoot)

    expect(registry.deprecation('components/old.ts', 'Old')).toBe(
      'Moved to `ui/new` (migration M9).'
    )
    expect(registry.deprecation('components/old.ts', 'Bare')).toBe('')
  })

  it('terminates on an export * cycle and still finds a tag inside it', () => {
    writeFixture({
      'components/a.ts': "export * from './b'\n",
      'components/b.ts': "export * from './a'\nexport * from './c'\n",
      'components/c.ts': '/** @deprecated */\nexport const Gone = 1\nexport const Live = 2\n',
    })

    const registry = registryFor(fixtureRoot)

    expect(registry.isDeprecated('components/a.ts', 'Gone')).toBe(true)
    expect(registry.isDeprecated('components/a.ts', 'Live')).toBe(false)
    expect(registry.isDeprecated('components/a.ts', 'Missing')).toBe(false)
  })
})

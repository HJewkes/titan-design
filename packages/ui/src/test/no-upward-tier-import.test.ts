import path from 'node:path'
import { RuleTester } from 'eslint'
import { createRequire } from 'node:module'
import rule from '../../eslint-rules/no-upward-tier-import'

// The rule loads the registry through Node's require; an ESM import here gets a second instance with its own cache.
const { registryFor } = createRequire(import.meta.url)(
  '../../eslint-rules/deprecated-export-registry'
)

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

// Fake, but real-shaped: everything after `/src/` is what the rule reads.
const uiFile = '/repo/packages/ui/src/components/ui/select/Select.tsx'
const customFile = '/repo/packages/ui/src/components/custom/Metric/Metric.tsx'
const themeFile = '/repo/packages/ui/src/theme/config.ts'
const labFile = '/repo/packages/ui/src/lab/specimens/Sample.tsx'

describe('no-upward-tier-import', () => {
  ruleTester.run('no-upward-tier-import', rule as never, {
    valid: [
      // custom -> ui is downward (allowed).
      { code: "import { Pill } from '../../ui/pill/Pill'", filename: customFile },
      // ui -> theme is downward.
      { code: "import { config } from '../../../theme/config'", filename: uiFile },
      // Same tier, sibling directory.
      { code: "import { Badge } from '../badge/Badge'", filename: uiFile },
      // The `@/` alias, resolved downward (custom -> ui).
      { code: "import { Pill } from '@/components/ui/pill/Pill'", filename: customFile },
      // A bare package import has no tier and is never checked.
      { code: "import { clsx } from 'clsx'", filename: themeFile },
      // src/lab is exempt as an import target...
      { code: "import { sample } from '../../../lab/specimens/Sample'", filename: uiFile },
      // ...and as a source: lab isn't a tiered file, so it isn't checked at all.
      { code: "import { Pill } from '../../components/ui/pill/Pill'", filename: labFile },
    ],
    invalid: [
      // Positive control: ui reaching into custom is the exact gap VW-88 found.
      // The message names the move target and the placement rule, never "promote the importer".
      {
        code: "import { Typography } from '../../custom/Typography'",
        filename: uiFile,
        errors: [
          {
            message:
              "'../../custom/Typography' imports from the custom tier, which sits above ui " +
              '(tier order: theme -> icons -> ui -> custom -> shell -> pages). ' +
              'Move `custom/Typography` down to `ui/`, the lowest tier that makes this import legal. ' +
              'Never copy it, and never replace it with a slot.',
          },
        ],
      },
      // Same violation, via the `@/` alias instead of a relative path.
      {
        code: "import { Typography } from '@/components/custom/Typography'",
        filename: uiFile,
        errors: [{ messageId: 'upward' }],
      },
      // theme is the floor tier — importing anything above it is upward.
      {
        code: "import { Pill } from '../components/ui/pill/Pill'",
        filename: themeFile,
        errors: [{ message: /Move `ui\/pill\/Pill` down to `theme\/`/ }],
      },
      // A re-export counts too, not just a direct import.
      {
        code: "export { Metric } from '../../custom/Metric/Metric'",
        filename: uiFile,
        errors: [{ messageId: 'upward' }],
      },
    ],
  })

  describe('a deprecated shim', () => {
    // The registry reads real tags, so this case imports a real shim from a fake file under the real src.
    const srcRoot = path.resolve(__dirname, '..')
    const realUiFile = path.join(srcRoot, 'components/ui/newthing/NewThing.tsx')

    // The registry's cold scan of src takes 5-8 s on a CI runner; pay it here, not in the case.
    beforeAll(() => {
      registryFor(srcRoot)
    }, 30_000)

    ruleTester.run('no-upward-tier-import', rule as never, {
      valid: [],
      invalid: [
        {
          code: "import { Eyebrow } from '../../custom/ActiveWork/Eyebrow'",
          filename: realUiFile,
          errors: [
            {
              message: /import it from `ui\/eyebrow`, where it already moved\. Never copy it/,
            },
          ],
        },
      ],
    })
  })
})

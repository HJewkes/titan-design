import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-upward-tier-import'

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
      {
        code: "import { Typography } from '../../custom/Typography'",
        filename: uiFile,
        errors: [{ messageId: 'upward' }],
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
        errors: [{ messageId: 'upward' }],
      },
      // A re-export counts too, not just a direct import.
      {
        code: "export { Metric } from '../../custom/Metric/Metric'",
        filename: uiFile,
        errors: [{ messageId: 'upward' }],
      },
    ],
  })
})

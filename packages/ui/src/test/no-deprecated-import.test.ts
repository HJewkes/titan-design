import path from 'node:path'
import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-deprecated-import'

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
  it('flags a new consumer of a deprecated export, direct or via an untagged barrel', () => {
    ruleTester.run('no-deprecated-import', rule as never, {
      valid: [
        // A live (non-deprecated) component is untouched.
        { code: "import { Card } from '../../ui/card/Card'", filename: newCustomConsumer },
        // Regression: `Workout/icons.tsx` deprecates its `WorkoutIconProps`
        // ALIAS in favour of using `IconProps` directly — the real `IconProps`
        // in `components/icons` must not be caught by that propagation.
        { code: "import { IconProps } from '../../icons'", filename: newCustomConsumer },
      ],
      invalid: [
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
        {
          code: "import { StatusDot } from '../../custom/Workout/StatusDot'",
          filename: newUiConsumer,
          errors: [{ messageId: 'deprecated' }],
        },
      ],
    })
  })
})

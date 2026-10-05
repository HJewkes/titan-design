import { createRequire } from 'node:module'
import { RuleTester, type Rule } from 'eslint'

// The rules are CommonJS with no declarations; require keeps the test inside the type check.
const nativeRequire = createRequire(import.meta.url)
const rule = nativeRequire('../../eslint-rules/story-title-prefix') as Rule.RuleModule
const { storyRoots } = nativeRequire('../../eslint-rules/fix-options') as { storyRoots: string[] }

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
})

// Fake, but real-shaped: everything after `/src/` is what the rule reads.
const uiStory = '/repo/packages/ui/src/components/ui/foo/Foo.stories.tsx'
const customStory = '/repo/packages/ui/src/components/custom/Workout/Foo.stories.tsx'
const shellStory = '/repo/packages/ui/src/components/shell/Foo.stories.tsx'
const untieredStory = '/repo/packages/ui/src/docs/Foo.stories.tsx'

// The roots come from preview.tsx through fix-options; fix-options.test.ts pins that parse.
const rootList = storyRoots.map((root) => `\`${root}/\``).join(', ')
const metaWithTitle = (title: string) => `const meta = { title: '${title}' }\nexport default meta`

describe('story-title-prefix', () => {
  ruleTester.run('story-title-prefix', rule, {
    valid: [
      { code: metaWithTitle('Components/Atoms/Foo'), filename: uiStory },
      { code: metaWithTitle('Custom/Workout/Foo'), filename: customStory },
      { code: "export default { title: 'Docs/Intro' }", filename: untieredStory },
      // A non-literal title is not checked.
      { code: 'const meta = { title: `${"Widgets"}/Foo` }', filename: uiStory },
    ],
    invalid: [
      {
        code: metaWithTitle('Widgets/X'),
        filename: uiStory,
        errors: [
          {
            message:
              "Story title root 'Widgets' is not a sidebar root in .storybook/preview.tsx. " +
              "This file's directory puts it under `Components/Atoms|Molecules|Organisms`; use that. " +
              `The roots are ${rootList}.`,
          },
        ],
      },
      {
        code: metaWithTitle('Workout/Foo'),
        filename: customStory,
        errors: [{ message: /puts it under `Custom\/Workout`; use that\./ }],
      },
      {
        code: "export default { title: 'Chrome/Foo' }",
        filename: shellStory,
        errors: [{ message: /puts it under `Shell\/`; use that\./ }],
      },
      // No directory rule applies, so the message lists the roots and suggests none.
      {
        code: metaWithTitle('Widgets/X'),
        filename: untieredStory,
        errors: [{ message: /preview\.tsx\. The roots are `Foundations\/`/ }],
      },
    ],
  })
})

import path from 'node:path'
import { RuleTester } from 'eslint'
import rule from '../../eslint-rules/no-raw-composition'

const jsxTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

// Fake, but real-shaped: the rule scopes on everything after `/src/`, and
// keys its baseline on the path relative to the cwd.
const pkgFile = (relative: string) => path.join(process.cwd(), relative)
const componentFile = pkgFile('src/components/custom/Fake/Fake.tsx')
const chartFile = pkgFile('src/components/ui/charts/fake/FakeChart.tsx')
const testFile = pkgFile('src/components/custom/Fake/Fake.test.tsx')
const storyFile = pkgFile('src/components/custom/Fake/Fake.stories.tsx')
const utilFile = pkgFile('src/utils/fake.ts')
const labFile = pkgFile('src/lab/fake/Fake.tsx')

const allowance = rule.withBaseline({
  'src/components/custom/Fake/Fake.tsx': { rawButton: 1, d3Import: 1 },
})

describe('no-raw-composition', () => {
  jsxTester.run('no-raw-composition', rule as never, {
    valid: [
      { code: '<Pressable onPress={go} />', filename: componentFile },
      { code: "createElement('div')", filename: componentFile },
      { code: '<button>Open</button>', filename: testFile },
      { code: '<button>Open</button>', filename: storyFile },
      { code: '<button>Open</button>', filename: labFile },
      // A button outside src/components is not a component composition.
      { code: "createElement('button')", filename: utilFile },
      { code: "import { line } from 'd3-shape'", filename: chartFile },
      { code: "import { scaleLinear } from 'd3-scale'", filename: labFile },
      // Only `d3` and `d3-*` count, not a package that merely starts with d3.
      { code: "import x from 'd3fc'", filename: componentFile },
    ],
    invalid: [
      {
        code: '<button onClick={go}>Save</button>',
        filename: componentFile,
        errors: [{ messageId: 'rawButton' }],
      },
      {
        code: "React.createElement('button', null, 'Save')",
        filename: componentFile,
        errors: [{ messageId: 'rawButton' }],
      },
      {
        code: 'createElement(`button`)',
        filename: componentFile,
        errors: [{ messageId: 'rawButton' }],
      },
      {
        code: "import { line } from 'd3-shape'",
        filename: componentFile,
        errors: [{ messageId: 'd3Import' }],
      },
      {
        code: "import * as d3 from 'd3'",
        filename: utilFile,
        errors: [{ messageId: 'd3Import' }],
      },
      {
        code: "export { scaleLinear } from 'd3-scale'",
        filename: componentFile,
        errors: [{ messageId: 'd3Import' }],
      },
      {
        code: "const shape = await import('d3-shape')",
        filename: componentFile,
        errors: [{ messageId: 'd3Import' }],
      },
      {
        code: "const { scaleLinear } = require('d3-scale')",
        filename: componentFile,
        errors: [{ messageId: 'd3Import' }],
      },
      // d3 stays out of tests too: geometry tests belong beside the chart.
      {
        code: "import { scaleLinear } from 'd3-scale'",
        filename: testFile,
        errors: [{ messageId: 'd3Import' }],
      },
    ],
  })

  jsxTester.run('no-raw-composition (baseline allowance)', allowance as never, {
    valid: [{ code: "<button>One</button>; import 'd3-shape'", filename: componentFile }],
    invalid: [
      {
        code: "<button>One</button>; <button>Two</button>; import 'd3-shape'; import 'd3-scale'",
        filename: componentFile,
        errors: [{ messageId: 'rawButton' }, { messageId: 'd3Import' }],
      },
    ],
  })

  it('names the titan alternative in each message', () => {
    expect(rule.meta?.messages?.rawButton).toMatch(
      /Button.*ToolbarButton.*TriggerSurface.*Pressable/
    )
    expect(rule.meta?.messages?.d3Import).toMatch(/ui\/charts\/kit/)
  })
})

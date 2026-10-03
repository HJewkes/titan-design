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
const shellFile = pkgFile('src/components/shell/fake/FakeRow.tsx')

const allowance = rule.withBaseline({
  'src/components/custom/Fake/Fake.tsx': { rawButton: 1, d3Import: 1, pathMath: 1 },
})

// Built path strings the pathMath check must report, outside ui/charts.
const pathMathCode = [
  'const d = `M${x},${y}L${x2},${y2}`',
  "const d = 'M' + x",
  "const d = 'M' + x + ',' + y + 'L' + x2 + ',' + y2",
  'd += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x} ${y}`',
  'const area = `${line(points)} L ${right} ${base} L ${left} ${base} Z`',
  'const arc = `V${y + h - r}A${r},${r} 0 0 1 ${x + w - r},${y + h}`',
  'const lead = `m${dx} ${dy}`',
  "const top = 'M ' + x + ' ' + y + ' H ' + (x + width)",
  'const wedge = `M${cx},${cy}` + `L${ax},${ay}` + `A${r},${r} 0 0 1 ${bx},${by}Z`',
  'const d = `M${points.join(" L ")}`',
]

// Near-misses from the repo: static path data, labels, CSS and SVG transforms.
const notPathMathCode = [
  "const STAR_ICON_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'",
  '<path d="M5 12h14M12 5l7 7-7 7" />',
  '<path d={`M4 6h16M4 12h16M4 18h16`} />',
  '<svg viewBox={`0 0 ${size} ${size}`} />',
  '<circle transform={`rotate(-90 ${center} ${center})`} />',
  'const t = `translate(${cx} ${cy}) scale(${s}) ` + `translate(${-x} ${-y})`',
  'const style = { transform: `translateX(${x}px)`, clipPath: `inset(0 ${pct}% 0 0)` }',
  'const clip = `polygon(0 0, ${w}px 0, ${w}px ${h}px)`',
  'const variant = `h${level}`',
  'const testId = `treemap-tile-t${i}`',
  'const elapsed = hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`',
  'const quarter = `Q${q} ${year}`',
  "const quarterLabel = 'Q' + q + ' ' + year",
  'const label = `OKLCH L ${lightness}`',
  'const duration = `${ms / 1000}s`',
  "const cls = 'mt-' + gap + ' h-' + size",
  'const sum = x + width - r',
  'const version = `v${major}.${minor}`',
  'const color = `#${hex}`',
]

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
      ...notPathMathCode.map((code) => ({ code, filename: componentFile })),
      // Chart primitives, tests, stories and the lab may build paths.
      ...[chartFile, testFile, storyFile, labFile].map((filename) => ({
        code: pathMathCode[0],
        filename,
      })),
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
      ...pathMathCode.map((code) => ({
        code,
        filename: componentFile,
        errors: [{ messageId: 'pathMath' }],
      })),
      // Path math is scoped to all of src, not only src/components.
      ...[shellFile, utilFile].map((filename) => ({
        code: pathMathCode[1],
        filename,
        errors: [{ messageId: 'pathMath' }],
      })),
    ],
  })

  jsxTester.run('no-raw-composition (baseline allowance)', allowance as never, {
    valid: [
      { code: "<button>One</button>; import 'd3-shape'; `M${x} ${y}`", filename: componentFile },
    ],
    invalid: [
      {
        code: "<button>One</button>; <button>Two</button>; import 'd3-shape'; import 'd3-scale'",
        filename: componentFile,
        errors: [{ messageId: 'rawButton' }, { messageId: 'd3Import' }],
      },
      {
        code: "const a = `M${x} ${y}`; const b = 'M' + x",
        filename: componentFile,
        errors: [{ messageId: 'pathMath' }],
      },
    ],
  })

  it('names the titan alternative in each message', () => {
    expect(rule.meta?.messages?.rawButton).toMatch(
      /Button.*ToolbarButton.*TriggerSurface.*Pressable/
    )
    expect(rule.meta?.messages?.d3Import).toMatch(/ui\/charts\/kit/)
    expect(rule.meta?.messages?.pathMath).toMatch(/d3-shape.*ui\/charts\/kit/)
  })
})

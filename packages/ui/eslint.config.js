const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const noDeprecatedImport = require('./eslint-rules/no-deprecated-import')
const noDeviceInternals = require('./eslint-rules/no-device-internals')
const noFrozenTheme = require('./eslint-rules/no-frozen-theme')
const noLocalFormatter = require('./eslint-rules/no-local-formatter')
const noRawColor = require('./eslint-rules/no-raw-color')
const noRawSpacing = require('./eslint-rules/no-raw-spacing')
const noUpwardTierImport = require('./eslint-rules/no-upward-tier-import')
const noVarColorOpacity = require('./eslint-rules/no-var-color-opacity')
const storyTitlePrefix = require('./eslint-rules/story-title-prefix')

module.exports = tseslint.config(
  // Global ignores
  {
    ignores: [
      'dist/',
      'node_modules/',
      'storybook-static/',
      'coverage/',
      '*.config.js',
      '*.config.ts',
      '*.config.mjs',
      '.storybook/',
    ],
  },

  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React recommended rules
  {
    ...react.configs.flat.recommended,
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  // React JSX runtime (no need to import React in scope)
  react.configs.flat['jsx-runtime'],

  // React Hooks rules
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: reactHooks.configs.recommended.rules,
  },

  // Project-specific overrides
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      // Relax rules that conflict with the codebase patterns
      '@typescript-eslint/no-empty-interface': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],

      // React Native uses different accessibility patterns
      'react/prop-types': 'off',
      'react/display-name': 'off',

      // Allow spreading props (common in component libraries)
      'react/jsx-props-no-spreading': 'off',
    },
  },

  // titan renders values a machine has already interpreted, so low-level device
  // identifiers (hex opcodes, raw byte frames, transport UUIDs) have no business
  // in this package. Errors rather than warns: unlike the guardrails below there
  // are no existing violators, so this holds the line at zero instead of
  // documenting a backlog. Covers comments too, which AST selectors never match.
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      // The whole `titan` plugin is declared here — a flat config may only
      // define a plugin name once, so rules scoped differently (see no-raw-color
      // below) are enabled in their own block without re-declaring `plugins`.
      titan: {
        rules: {
          'no-deprecated-import': noDeprecatedImport,
          'no-device-internals': noDeviceInternals,
          'no-frozen-theme': noFrozenTheme,
          'no-local-formatter': noLocalFormatter,
          'no-raw-color': noRawColor,
          'no-raw-spacing': noRawSpacing,
          'no-upward-tier-import': noUpwardTierImport,
          'no-var-color-opacity': noVarColorOpacity,
          'story-title-prefix': storyTitlePrefix,
        },
      },
    },
    rules: {
      'titan/no-device-internals': 'error',
      // Tailwind v3 emits NO rule for an opacity modifier on a var()-backed
      // colour, so `bg-brand-primary/10` is dead CSS while `text-white/70`
      // compiles. Repo-wide and at zero: VW-308 cleared the last four. Unlike
      // no-raw-color there is no backlog to ratchet down.
      'titan/no-var-color-opacity': 'error',
    },
  },

  // The VW-308 test quotes the dead classes deliberately — they are its probe
  // list, compiled against the real config to prove they still emit no rule.
  {
    files: ['src/theme/tailwind-var-opacity.test.ts'],
    rules: {
      'titan/no-var-color-opacity': 'off',
    },
  },

  // src/lab/** is exempt from no-device-internals. Lab holds specimen fixtures
  // mined from real session transcripts, whose session UUIDs the rule reads as
  // transport identifiers — a false positive: they are inert data in a scratch
  // surface, never rendered as device internals. Lab is already excluded from
  // what ships (package.json `files` carries `!src/lab`), so this doesn't weaken
  // the guarantee for anything a consumer receives.
  //
  // Scoped as its own block rather than an `ignores` on the block above: that
  // block is where the `titan` plugin is declared, and narrowing it would leave
  // the plugin undefined for lab files, breaking the no-raw-color block below.
  {
    files: ['src/lab/**/*.{ts,tsx}'],
    rules: {
      'titan/no-device-internals': 'off',
    },
  },

  // Colour has one source of truth: the ramps, and the semantic tokens that
  // reference them. A raw colour in a component can't theme, can't be audited
  // for contrast/CVD, and won't move when the ramps are re-spaced — the v0.10.0
  // surface work re-spaced the dark ramp and left every hardcoded colour behind.
  //
  // Errors, but RATCHETED: each file's existing count is recorded in
  // raw-color-baseline.json and only occurrences beyond it fail. New colour is
  // blocked immediately; the backlog burns down file by file. A rule that failed
  // on all ~250 existing violations would just get switched off.
  //
  // src/theme/** is exempt — it IS the colour system.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      // The colour system itself.
      'src/theme/**',
      // Colour maths (parsing/blending) legitimately handles literal values.
      'src/utils/colors.ts',
      // Tests assert against literal hex on purpose: under the RNW vitest alias
      // a token reference resolves to `var(...)`, which breaks toHaveStyle. A
      // literal is the correct assertion, not debt.
      'src/**/*.test.{ts,tsx}',
      // Lab specimen fixtures are mined from session transcripts: the hex that
      // trips this rule sits inside prose `notes` strings, not styling. Same
      // false positive as no-device-internals above, and lab never ships.
      'src/lab/**',
      // Promoted fixtures carry real session/brief/loop prose: a PR ref like
      // `#102` reads as a 3-digit hex, and a brief naming the brand orange
      // carries `#FF7900` — both inside data strings, not styling.
      'src/**/*-fixture.ts',
    ],
    rules: {
      'titan/no-raw-color': 'error',
    },
  },

  // Design-system reuse guardrails: components should compose shared primitives,
  // not hand-roll paints. (Warn — surfaces existing violators without breaking CI.)
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.tsx', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/linear-gradient/]',
          message:
            'Use surfaceGradient / linearGradient from theme/gradients instead of an inline linear-gradient string.',
        },
        {
          selector: 'TemplateElement[value.raw=/linear-gradient/]',
          message:
            'Use surfaceGradient / linearGradient from theme/gradients instead of an inline linear-gradient string.',
        },
      ],
    },
  },

  // Stricter token discipline for the newer, token-pure families (shell + icons).
  // A codebase-wide hex→token migration is a separate effort; scoping here keeps
  // this guardrail actionable (0 warnings today) instead of burying 140+ legacy hits.
  {
    files: ['src/components/shell/**/*.{ts,tsx}', 'src/components/icons/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.tsx', '**/*.test.tsx'],
    rules: {
      // Flat config replaces (not merges) this rule per file, so repeat the
      // gradient selectors here alongside the shell/icons-only hex ones.
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/linear-gradient/]',
          message:
            'Use surfaceGradient / linearGradient from theme/gradients instead of an inline linear-gradient string.',
        },
        {
          selector: 'TemplateElement[value.raw=/linear-gradient/]',
          message:
            'Use surfaceGradient / linearGradient from theme/gradients instead of an inline linear-gradient string.',
        },
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
          message:
            'Avoid raw hex colors — use a semantic token (className `bg-*`/`text-*`, or `resolveColor(token)` for inline styles).',
        },
        {
          selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]',
          message:
            'Avoid raw hex colors — use a semantic token (className `bg-*`/`text-*`, or `resolveColor(token)` for inline styles).',
        },
      ],
    },
  },

  // Fully token-pure families: everything shell/icons enforces, plus the scale
  // rules, at ERROR. These families were brought to zero violations when they were
  // hardened, so the ratchet holds instead of accumulating warnings nobody reads.
  //
  // Adding a family here is the last step of hardening it — see TOKENS.md §6.
  {
    files: [
      'src/components/custom/ActiveWork/**/*.{ts,tsx}',
      'src/components/custom/Prose/**/*.{ts,tsx}',
      'src/components/custom/charts/**/*.{ts,tsx}',
      // Workout batch B1 (E3) — hardened file by file, not family-wide yet.
      'src/components/custom/Workout/SetStrip.tsx',
      'src/components/custom/Workout/SetTableHeader.tsx',
      'src/components/custom/Workout/SetsRepsLoad.tsx',
      'src/components/custom/Workout/ExerciseHeading.tsx',
      'src/components/custom/Workout/ExerciseIndicator.tsx',
      'src/components/custom/Workout/ExerciseCardHeading.tsx',
      'src/components/custom/Workout/PrBadge.tsx',
      // The Pill primitive and its four presets (E2).
      'src/components/ui/pill/**/*.{ts,tsx}',
      'src/components/ui/badge/**/*.{ts,tsx}',
      'src/components/ui/chip/**/*.{ts,tsx}',
      'src/components/custom/Workout/StatusPill.tsx',
      'src/components/custom/Workout/MuscleGroupChip.tsx',
      // Workout batch B2 (E3). StatusPill and MuscleGroupChip are already above,
      // enrolled with the Pill presets in E2.
      'src/components/custom/Workout/SegmentedBar.tsx',
      'src/components/custom/Workout/PlaceholderStrip.tsx',
      'src/components/custom/Workout/ScheduleTiles.tsx',
      'src/components/custom/Workout/SupersetWrapper.tsx',
      'src/components/custom/Workout/MesoProgressBar.tsx',
      'src/components/custom/Workout/Sparkline.tsx',
      'src/components/custom/Workout/VolumeLandmarkBar.tsx',
      'src/components/custom/Workout/SessionHeader.tsx',
      'src/components/custom/Workout/WeekRow.tsx',
      'src/components/custom/Workout/WorkoutCard.tsx',
      // Workout batch B3 (E3).
      'src/components/custom/Workout/StatusDot.tsx',
      'src/components/custom/Workout/WeightBadge.tsx',
      'src/components/custom/Workout/ExerciseCard.tsx',
      'src/components/custom/Workout/SetRow.tsx',
      'src/components/custom/Workout/SetBar.tsx',
      'src/components/custom/Workout/WorkoutPill.tsx',
    ],
    // Fixtures hold real prose (PR refs like `#102` read as hex); stories/tests exempt as elsewhere.
    ignores: ['**/*.stories.tsx', '**/*.test.tsx', '**/*-fixture.ts'],
    rules: {
      // Flat config replaces (not merges) this rule per file, so the gradient and
      // hex selectors are repeated here rather than inherited.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/linear-gradient/]',
          message:
            'Use surfaceGradient / linearGradient from theme/gradients instead of an inline linear-gradient string.',
        },
        {
          selector: 'TemplateElement[value.raw=/linear-gradient/]',
          message:
            'Use surfaceGradient / linearGradient from theme/gradients instead of an inline linear-gradient string.',
        },
        {
          selector: 'Literal[value=/#[0-9a-fA-F]{3,8}\\b/]',
          message:
            'Avoid raw hex colors — use a semantic token (className `bg-*`/`text-*`, or `resolveColor(token)` for inline styles).',
        },
        {
          selector: 'TemplateElement[value.raw=/#[0-9a-fA-F]{3,8}\\b/]',
          message:
            'Avoid raw hex colors — use a semantic token (className `bg-*`/`text-*`, or `resolveColor(token)` for inline styles).',
        },
        // Arbitrary spacing / radius / type values. `w-[420px]` and `min-w-[130px]`
        // are deliberate layout geometry and stay allowed; the scale properties are
        // where a specimen's hand-tuned pixels leak into the library.
        {
          selector:
            'Literal[value=/\\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|text|rounded|space-x|space-y)-\\[[0-9.]+px\\]/]',
          message:
            'Arbitrary spacing/radius/type value — use the scale (gap-2, p-3, text-sm, rounded-md). See TOKENS.md §5.',
        },
        {
          selector:
            'TemplateElement[value.raw=/\\b(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|text|rounded|space-x|space-y)-\\[[0-9.]+px\\]/]',
          message:
            'Arbitrary spacing/radius/type value — use the scale (gap-2, p-3, text-sm, rounded-md). See TOKENS.md §5.',
        },
        // Hardcoded inline fontSize defeats the type scale and its paired
        // line-height. Restricted to literals on purpose: a *computed* size
        // (`fontSize: valueLabelFontSize(height)`) is chart geometry fitting text
        // to its container, which no scale can express — that stays allowed.
        {
          selector: 'Property[key.name="fontSize"][value.type="Literal"]',
          message:
            'Hardcoded inline fontSize defeats the type scale — use a Typography variant or a text-* class. See TOKENS.md §4.',
        },
        // Freezes the value to one palette at import time. Resolve at render
        // time instead — titan/no-frozen-theme below says the same thing for
        // every component family, ratcheted.
        {
          selector: 'CallExpression[callee.name="getSemanticColors"]',
          message:
            'getSemanticColors() freezes to one theme — resolve at render time with useOnSurfaceColor(role), or getSemanticColors(useSurfaceMode()) for other tokens. See TOKENS.md §3.',
        },
      ],
    },
  },

  // Inline-style spacing (AW-142). The bracket-form selectors above catch
  // `gap-[3px]` in a className; they cannot see `paddingVertical: 9` or
  // `padding: '9px 12px'` in a style object, which is the dialect the
  // specimen-derived families write. `titan/no-raw-spacing` covers that shape
  // and honours a `// optical: <why>` comment — the reason it is a rule and not
  // two more selectors, since a selector cannot read comments.
  //
  // Enrolled per WAVE, never ahead of one (spec decision 2: one allow-list, no
  // second count ratchet). Wave one hardened the theme tokens and Button; wave
  // two widens to the whole ui tier, which the rule finds already clean — ui/**
  // writes spacing as classes, so there was no inline dialect to migrate here.
  // The 58 occurrences across the Workout batch and `charts/flatBarGeometry`
  // are wave three; enrolling them now would buy 58 disable comments and no
  // migration.
  //
  // Wave three adds `shell/**`, whose dialect was the bracket className rather
  // than the style object — the rule finds it clean, and holds it that way.
  // Shell is deliberately NOT added to the token-pure bracket selectors above:
  // NavItem's 3px and BrandLockup's 7px are optical keepers the operator signed
  // off, and a selector cannot read their `// optical:` reason, so enrolling
  // there would buy two disable comments. That block also gates `rounded-[…]`
  // and `text-[…]`, which are AW-145 and AW-134, not this wave.
  {
    files: [
      'src/theme/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/shell/**/*.{ts,tsx}',
    ],
    // `color-story-kit` is story chrome that happens not to be named `.stories.tsx`
    // — exempt on the same grounds as the stories themselves, not as a backlog.
    ignores: ['**/*.stories.tsx', '**/*.test.{ts,tsx}', 'src/theme/color-story-kit.tsx'],
    rules: {
      'titan/no-raw-spacing': 'error',
    },
  },

  // A module-scope `const t = getSemanticColors('dark')` captures the dark
  // palette at import time, so the component can never follow the theme. The
  // token-pure selector above has banned it per family since E2, which leaves
  // 35 component files (all of Fatigue, 29 of 54 Workout, Gauge, TimerReadout,
  // Treemap, 4 ui files) frozen — VW-88 gap 2.
  //
  // Errored across every component family, but RATCHETED like no-raw-color:
  // today's offenders are recorded per file in frozen-theme-baseline.json,
  // keyed by frozen value, and only calls beyond the allowance fail. New frozen
  // theme is blocked immediately; the backlog migrates in batches (VW-316).
  //
  // Stories and tests are exempt for the same reason as everywhere else: a
  // concrete value IS the point there (`toHaveStyle` cannot match the `var()`
  // string resolveColor returns under the RNW vitest alias).
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: [
      '**/*.stories.tsx',
      '**/*.test.{ts,tsx}',
      '**/*-fixture.ts',
      // Story-only fixtures, resolved colours are demo data; VW-316.
      'src/components/custom/Workout/setHeadingKit.tsx',
      'src/components/custom/Workout/velocity-story-kit.tsx',
    ],
    rules: {
      'titan/no-frozen-theme': 'error',
    },
  },

  // Tier order (ui/README.md): theme -> icons -> ui -> custom -> shell -> pages.
  // A lower tier importing from a higher one compiles fine but breaks the
  // dependency direction the family split depends on (VW-88 gap 1).
  //
  // Errored, but RATCHETED like no-raw-color: main carries 7 existing upward
  // imports (recorded in tier-import-baseline.json, VW-315) — new ones are
  // blocked immediately and the backlog burns down file by file.
  //
  // src/lab/** is exempt — see no-upward-tier-import.js and the
  // no-device-internals exemption above for the same rationale.
  {
    files: [
      'src/theme/**/*.{ts,tsx}',
      'src/components/icons/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/custom/**/*.{ts,tsx}',
      'src/components/shell/**/*.{ts,tsx}',
      'src/components/pages/**/*.{ts,tsx}',
    ],
    rules: {
      'titan/no-upward-tier-import': 'error',
    },
  },

  // An export's @deprecated JSDoc is a promise that no NEW usage appears
  // before its migration task removes it (DEPRECATIONS.md). Nothing checked
  // that promise (VW-88 gap 6) — a docblock is just a comment.
  //
  // Errored, but RATCHETED like no-raw-color: main carries 59 existing
  // consumers across 45 files of StatusDot/Tile/MetricCell/BaseBadge/etc.
  // (recorded in deprecated-import-baseline.json, VW-318) — new ones are
  // blocked immediately and the backlog burns down file by file as each
  // migrates to the replacement named in its @deprecated tag.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'titan/no-deprecated-import': 'error',
    },
  },

  // Decision 13: numbers are formatted by the shared formatter module
  // (utils/workout-format.ts, utils/number-format.ts) — the one place rounding
  // rules live. VW-88 gap 3 found raw `.toFixed(` calls and local `format*`
  // functions duplicating it all over the tree.
  //
  // Errored, but RATCHETED like no-raw-color/no-upward-tier-import: existing
  // occurrences are recorded in no-local-formatter-baseline.json, keyed by
  // value (the toFixed argument, or the function name) — new debt is blocked
  // immediately and the backlog burns down file by file.
  //
  // src/lab/** is exempt — scratch/fixture code that never ships, same
  // rationale as no-device-internals and no-upward-tier-import above.
  // *.test.{ts,tsx} is exempt too — same as no-raw-color: assertion messages
  // and expected-value fixtures legitimately use toFixed on purpose, they
  // aren't display code that could drift from the shared formatter. The
  // formatter module itself is exempt — it IS the thing everything else
  // should call into (same shape as no-raw-color exempting src/theme/**).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: [
      'src/lab/**',
      'src/**/*.test.{ts,tsx}',
      'src/utils/workout-format.ts',
      'src/utils/number-format.ts',
      'src/components/custom/ActiveWork/format-time.ts',
    ],
    rules: {
      'titan/no-local-formatter': 'error',
    },
  },

  // Every story's top-level Storybook group must be one of the six-group-plus-Docs
  // roots the reorg (#170) settled on, so a new story can't quietly invent an
  // eighth root that the sidebar and storySort don't know about.
  {
    files: ['src/**/*.stories.{ts,tsx}'],
    rules: {
      'titan/story-title-prefix': 'error',
    },
  }
)

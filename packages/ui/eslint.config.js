const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const globals = require('globals')
const noClassnameOnAnimated = require('./eslint-rules/no-classname-on-animated')
const noDeprecatedImport = require('./eslint-rules/no-deprecated-import')
const noDeviceInternals = require('./eslint-rules/no-device-internals')
const noFrozenTheme = require('./eslint-rules/no-frozen-theme')
const noHtmlElement = require('./eslint-rules/no-html-element')
const noLocalFormatter = require('./eslint-rules/no-local-formatter')
const noRawColor = require('./eslint-rules/no-raw-color')
const noRawComposition = require('./eslint-rules/no-raw-composition')
const noRawDeviceDataInChat = require('./eslint-rules/no-raw-device-data-in-chat')
const noRawSpacing = require('./eslint-rules/no-raw-spacing')
const noTruncation = require('./eslint-rules/no-truncation')
const noUnstyledText = require('./eslint-rules/no-unstyled-text')
const noUpwardTierImport = require('./eslint-rules/no-upward-tier-import')
const noVarColorOpacity = require('./eslint-rules/no-var-color-opacity')
const propsNaming = require('./eslint-rules/props-naming')
const restrictedSyntax = require('./eslint-rules/restricted-syntax')
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
          'no-classname-on-animated': noClassnameOnAnimated,
          'no-deprecated-import': noDeprecatedImport,
          'no-device-internals': noDeviceInternals,
          'no-frozen-theme': noFrozenTheme,
          'no-html-element': noHtmlElement,
          'no-local-formatter': noLocalFormatter,
          'no-raw-color': noRawColor,
          'no-raw-composition': noRawComposition,
          'no-raw-device-data-in-chat': noRawDeviceDataInChat,
          'no-raw-spacing': noRawSpacing,
          'no-truncation': noTruncation,
          'no-unstyled-text': noUnstyledText,
          'no-upward-tier-import': noUpwardTierImport,
          'no-var-color-opacity': noVarColorOpacity,
          'props-naming': propsNaming,
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

  // The in-app chat design (VW-391/VW-393) renders AI SDK `data-*` message
  // parts before the Chat component family exists to carry them — this rule
  // holds the path at zero from the start. Scoped narrowly: the glob is empty
  // today and is the contract (VW-394). See no-raw-device-data-in-chat.js for
  // what it flags and why; it mirrors voltras-mcp's no-protocol-detail (NF-07).
  {
    files: ['src/components/custom/Chat/**/*.{ts,tsx}'],
    rules: {
      'titan/no-raw-device-data-in-chat': 'error',
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
  // not hand-roll paints. (Warn, but any hit still fails `pnpm lint` through --max-warnings 0.)
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['**/*.stories.tsx', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': ['warn', ...restrictedSyntax.gradient],
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
      'no-restricted-syntax': ['warn', ...restrictedSyntax.gradient, ...restrictedSyntax.hex],
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
      'src/components/ui/charts/spark-bars/**/*.{ts,tsx}',
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
      'src/components/custom/Workout/SparklineParts.tsx',
      'src/components/custom/Workout/sparklineGeometry.ts',
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
        ...restrictedSyntax.gradient,
        ...restrictedSyntax.hex,
        ...restrictedSyntax.arbitrarySpacing,
        ...restrictedSyntax.fontSize,
        // Freezes the value to one palette at import time. Resolve at render
        // time instead — titan/no-frozen-theme below says the same thing for
        // every component family, ratcheted.
        ...restrictedSyntax.frozenTheme,
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
  //
  // Wave three takes custom/Workout file by file, cards and rows first, for the
  // same reason batches B1-B3 above did: the family is ~45 files and one PR that
  // touched all of them could not be reviewed.
  //
  // Wave three also adds `custom/Fatigue/**`. Its remaining numbers are all
  // either a named constant (`PAD`, `TIER_GAP_*`, `GHOST_GUTTER`) or carry an
  // `// optical:` reason, so the rule holds the family at zero with no disable
  // comments.
  {
    files: [
      'src/theme/**/*.{ts,tsx}',
      'src/components/ui/**/*.{ts,tsx}',
      'src/components/shell/**/*.{ts,tsx}',
      // Wave three, Workout molecules (AW-142). Enrolled file by file, as
      // batches B1-B3 above were: the family is ~45 files and one PR touching
      // all of them could not be reviewed.
      'src/components/custom/Workout/ExerciseHeading.tsx',
      'src/components/custom/Workout/InputBar.tsx',
      'src/components/custom/Workout/IntensityBar.tsx',
      'src/components/custom/Workout/MesoProgressBar.tsx',
      'src/components/custom/Workout/PlaceholderStrip.tsx',
      'src/components/custom/Workout/PrHistoryModal.tsx',
      'src/components/custom/Workout/ReadinessCheck.tsx',
      'src/components/custom/Workout/RestTimer.tsx',
      'src/components/custom/Workout/RestTimerBar.tsx',
      'src/components/custom/Workout/SessionHeader.tsx',
      'src/components/custom/Workout/SetTableHeader.tsx',
      'src/components/custom/Workout/StatusDot.tsx',
      'src/components/custom/Workout/SupersetWrapper.tsx',
      'src/components/custom/Workout/TempoDisplay.tsx',
      'src/components/custom/Workout/tempoDisplayParts.tsx',
      'src/components/custom/Workout/WeightBadge.tsx',
      'src/components/custom/Workout/WorkoutPill.tsx',
      // Wave three, cards and rows (AW-142).
      'src/components/custom/Workout/BaseBadge.tsx',
      'src/components/custom/Workout/ExerciseCard.tsx',
      'src/components/custom/Workout/ExerciseCardHeading.tsx',
      'src/components/custom/Workout/MesoCard.tsx',
      'src/components/custom/Workout/MesoStatusCard.tsx',
      'src/components/custom/Workout/SetRow.tsx',
      'src/components/custom/Workout/WeekRow.tsx',
      'src/components/custom/Workout/WorkoutCard.tsx',
      // Wave three, Workout pages and charts (AW-142). Enrolled file by file,
      // as batches B1-B3 above were: the family is ~45 files and one PR
      // touching all of them could not be reviewed.
      'src/components/custom/Workout/ActiveWorkoutPage.tsx',
      'src/components/custom/Workout/ExerciseDetailPage.tsx',
      'src/components/custom/Workout/GoalLiftCard.tsx',
      'src/components/custom/Workout/GoalMuscleCard.tsx',
      'src/components/custom/Workout/MuscleGlyph.tsx',
      'src/components/custom/Workout/GoalTrajectoryChart.tsx',
      'src/components/custom/Workout/GoalMilestoneTile.tsx',
      'src/components/custom/Workout/GoalMilestoneWeekStrip.tsx',
      'src/components/custom/Workout/goalMilestone.ts',
      'src/components/custom/Workout/ProgramPlanningPage.tsx',
      'src/components/custom/Workout/StrengthTrendChart.tsx',
      'src/components/custom/Workout/TrainingStatusPage.tsx',
      'src/components/custom/Workout/VelocityStrip.tsx',
      'src/components/custom/Workout/VelocityStripFramed.tsx',
      // The TD-6 split wave moved code out of enrolled parents above into these
      // siblings; enrolled with no source change (TD-657).
      'src/components/custom/Workout/DualVelocityCharts.tsx',
      'src/components/custom/Workout/DualVelocityStrip.tsx',
      'src/components/custom/Workout/dual-velocity-slots.ts',
      'src/components/custom/Workout/ExerciseDetailSectionCard.tsx',
      'src/components/custom/Workout/GoalTrajectoryChartParts.tsx',
      'src/components/custom/Workout/goalTrajectoryChartModel.ts',
      'src/components/custom/Workout/MesoCard.parts.tsx',
      'src/components/custom/Workout/MesoStatusCard.parts.tsx',
      'src/components/custom/Workout/ProgramPlanningBreadcrumbs.tsx',
      'src/components/custom/Workout/tempoDisplayModel.ts',
      'src/components/custom/Workout/useGoalTrajectoryChart.ts',
      'src/components/custom/Workout/VelocityLossBands.tsx',
      'src/components/custom/Workout/velocity-scale.ts',
      'src/components/custom/Workout/velocity-slots.ts',
      'src/components/custom/Workout/velocity-strip-model.ts',
      'src/components/custom/Workout/VelocityStripVariants.tsx',
      'src/components/custom/Fatigue/**/*.{ts,tsx}',
    ],
    // `color-story-kit` is story chrome that happens not to be named `.stories.tsx`
    // — exempt on the same grounds as the stories themselves, not as a backlog.
    // `setHeadingKit` is the same category: throwaway S3 rail R&D on raw `<div>`s
    // whose every importer is a story under `lab/explorations`.
    ignores: [
      '**/*.stories.tsx',
      '**/*.test.{ts,tsx}',
      'src/theme/color-story-kit.tsx',
      'src/components/custom/Workout/setHeadingKit.tsx',
    ],
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
  //
  // theme/materials.ts joins the scope (TD-521): its default tones once froze
  // to the dark palette at module scope, so a light caller got dark fills.
  {
    files: ['src/components/**/*.{ts,tsx}', 'src/theme/materials.ts'],
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

  // Compose titan's primitives instead of reaching past them (TD-24 S4): no raw
  // <button> in components, and d3 only under src/components/ui/charts. The rule
  // scopes itself (tests and stories may render a <button>; src/lab is exempt),
  // so one glob covers it.
  //
  // Errored, but RATCHETED like no-upward-tier-import: existing occurrences are
  // recorded per file and messageId in composition-baseline.json, and only
  // occurrences beyond that allowance fail.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'titan/no-raw-composition': 'error',
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
      'src/utils/time-format.ts',
    ],
    rules: {
      'titan/no-local-formatter': 'error',
    },
  },

  // TD-317 row 9: a domain component that clips its own text hides the data the reader came
  // for, so truncation in custom/ and shell/ is an explicit decision. ui/ is out of scope:
  // there truncation is a consumer prop. RATCHETED: today's sites are in
  // no-truncation-baseline.json, which must stay exact (an unspent allowance is reported as
  // stale); sanctioned sites go in truncation-allowlist.json. Tests and stories are exempt,
  // since they exercise the props rather than ship them.
  {
    files: ['src/components/custom/**/*.{ts,tsx}', 'src/components/shell/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}'],
    rules: {
      'titan/no-truncation': 'error',
    },
  },

  // TD-659: on React Native Web a Text inherits nothing from the View around it, so a bare
  // react-native Text renders black 14px System, and jsdom strips the classes that would
  // show it in a test. RATCHETED: today's sites are in no-unstyled-text-baseline.json, which
  // must stay exact (an unspent allowance is reported as stale). Stories are in scope, since
  // they render on web; tests are not, since jsdom never paints.
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}'],
    rules: {
      'titan/no-unstyled-text': 'error',
    },
  },

  // TD-689: components render on web and native, so a lowercase JSX element (`<div>`,
  // `<path>`) mounts on web only, and jsdom renders it without complaint. RATCHETED:
  // today's sites are in no-html-element-baseline.json, keyed by file and element name,
  // which must stay exact (an unspent allowance is reported as stale). Stories and tests
  // are exempt, since they are web-only by construction; src/lab is outside the glob.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}'],
    rules: {
      'titan/no-html-element': 'error',
    },
  },

  // TD-690: every component takes the same prop vocabulary (CLAUDE.md, Props Conventions):
  // `isDisabled`, `isLoading`, `isSelected` and `onPress`, never `disabled`, `loading`,
  // `selected` or `onClick`. RATCHETED: today's sites are in props-naming-baseline.json,
  // keyed by file and property name, which must stay exact (an unspent allowance is reported
  // as stale). Stories and tests are exempt, since they declare no component API; src/lab is
  // outside the glob.
  {
    files: ['src/components/**/*.{ts,tsx}'],
    ignores: ['src/**/*.test.{ts,tsx}', 'src/**/*.stories.{ts,tsx}'],
    rules: {
      'titan/props-naming': 'error',
    },
  },

  // TD-13: NativeWind does not compile className on an Animated.* element, so every class on
  // one renders nothing on web and jsdom strips it in tests. Every className is flagged, not
  // only spacing. A className on a plain child inside the animated element is fine.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'titan/no-classname-on-animated': 'error',
    },
  },

  // The two sites that carry a className on an Animated.View today. TD-305 (TD-13 S12)
  // moves their classes onto a plain child or an inline style and deletes this block.
  {
    files: [
      'src/components/custom/Workout/BodyMapDetailPanel.tsx',
      'src/components/custom/Workout/VelocityStripFramed.tsx',
    ],
    rules: {
      'titan/no-classname-on-animated': 'off',
    },
  },

  // A '' or 0 on the left of && renders a bare text node, and React Native throws on it
  // (audit findings D04b-04, D03b-01). Write !!x &&, a ternary or an explicit comparison.
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['coerce', 'ternary'] }],
    },
  },

  // Files still to fix. Each TD-536 slice deletes its group; the slice that empties the list
  // deletes this block.
  {
    files: [
      // TD-536 b2
      'src/lab/north-star/EmptyLiveView.tsx',
      'src/lab/north-star/HeroTempo.exploration.stories.tsx',
      'src/lab/north-star/LivePage.tsx',
      'src/lab/north-star/LiveView.tsx',
      'src/lab/north-star/VelocityDiverging.exploration.stories.tsx',
      'src/lab/north-star/fatigue-lab-shared.tsx',
      // TD-536 b3
      'src/components/ui/autocomplete/Autocomplete.tsx',
      'src/components/ui/checkbox/Checkbox.tsx',
      'src/components/ui/radio/Radio.tsx',
      'src/components/ui/switch/Switch.tsx',
      // TD-536 b4
      'src/components/custom/Fatigue/DualGhostSpark.tsx',
      'src/components/custom/Fatigue/SilverRedPalette.stories.tsx',
      'src/components/ui/card/Card.tsx',
      'src/components/ui/metric/Metric.tsx',
      'src/components/ui/section/Section.tsx',
      'src/components/ui/tooltip/Tooltip.tsx',
      // TD-536 b5
      'src/components/custom/Workout/ExerciseHeading.tsx',
      'src/components/custom/Workout/GoalMilestoneSummary.tsx',
      'src/components/custom/Workout/GoalTrajectoryChartParts.tsx',
      'src/components/custom/Workout/GoalTrajectoryMini.tsx',
      'src/components/custom/Workout/GoalTrajectoryWeekTips.tsx',
      'src/components/custom/Workout/GoalsWholeBody.composition.stories.tsx',
      // TD-536 b7
      'src/components/ui/alert/Alert.tsx',
      'src/components/ui/button/Button.tsx',
      'src/components/ui/charts/gauge/Gauge.tsx',
      'src/components/ui/charts/scatter/ScatterFrame.tsx',
      'src/components/ui/charts/scatter/ScatterPointMark.tsx',
      'src/components/ui/charts/treemap/Treemap.tsx',
      'src/components/ui/drawer/Drawer.tsx',
      'src/components/ui/empty-state/EmptyState.tsx',
      'src/components/ui/link/Link.tsx',
      'src/components/ui/list-item/ListItem.tsx',
      'src/components/ui/toolbar-button/ToolbarButton.tsx',
      // TD-536 b8
      'src/components/ui/chip/Chip.tsx',
      'src/components/ui/progress/Progress.tsx',
      'src/components/ui/select/Select.tsx',
      'src/components/ui/skeleton/Skeleton.tsx',
      'src/components/ui/table/TableEmptyState.tsx',
      'src/components/ui/table/TableSelection.tsx',
      // TD-536 b9
      'src/components/ui/autocomplete/AutocompleteParts.tsx',
      'src/components/ui/form-field/FormField.tsx',
      'src/components/ui/help-tip/HelpTip.tsx',
      'src/components/ui/input/Input.tsx',
      'src/components/ui/menu/Menu.tsx',
      'src/components/ui/toast/Toast.tsx',
      // TD-536 b10
      'src/components/custom/Fatigue/GhostBand.tsx',
      'src/components/custom/Sidebar/Sidebar.tsx',
      'src/components/custom/Workout/ActiveWorkoutPage.tsx',
      'src/components/custom/Workout/CapacityBandPlot.tsx',
      'src/components/custom/Workout/ExerciseCard.tsx',
      'src/components/custom/Workout/GoalTrajectoryPlot.tsx',
      'src/components/custom/Workout/MesoCard.tsx',
      'src/components/custom/Workout/ReadinessCheck.tsx',
      'src/components/custom/Workout/StrengthTrendChart.tsx',
      'src/components/custom/Workout/TempoDisplay.tsx',
      // TD-536 b11
      'src/components/custom/Workout/BodyMapDetailPanel.tsx',
      'src/components/custom/Workout/GoalCard.tsx',
      'src/components/custom/charts/SetBarChart.tsx',
    ],
    rules: {
      'react/jsx-no-leaked-render': 'off',
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
  },

  // Build, audit and baseline scripts run under Node. Page-side functions that are
  // serialised into a browser declare their own browser globals where they are written.
  {
    files: ['scripts/**/*.{mjs,js}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },

  // These two scripts hand a callback to page.evaluate. A /* global */ comment would widen to the
  // whole file anyway, so the browser names are granted here, to the files that need them.
  {
    files: ['scripts/design-freeze.mjs', 'scripts/extract-css-properties.mjs'],
    languageOptions: {
      globals: { document: 'readonly', getComputedStyle: 'readonly' },
    },
  }
)

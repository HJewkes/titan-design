const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const noDeviceInternals = require('./eslint-rules/no-device-internals')
const noRawColor = require('./eslint-rules/no-raw-color')

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
          'no-device-internals': noDeviceInternals,
          'no-raw-color': noRawColor,
        },
      },
    },
    rules: {
      'titan/no-device-internals': 'error',
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
  }
)

const js = require('@eslint/js')
const tseslint = require('typescript-eslint')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')

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
  }
)

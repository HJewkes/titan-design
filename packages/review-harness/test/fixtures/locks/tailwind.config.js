// A cut-down shape of packages/ui/tailwind.config.js: a preset the loader must not resolve,
// spacing and heights built with Object.fromEntries, DEFAULT keys, a font family array and a
// shadow that reads an -rgb property.
const SEMANTIC_SPACING_KEYS = ['inset-md', 'stack-md']
const CONTROL_HEIGHT_KEYS = ['control-md']

module.exports = {
  presets: [require('nativewind/preset')],
  theme: {
    spacing: { px: '1px', 0: '0' },
    extend: {
      spacing: Object.fromEntries(SEMANTIC_SPACING_KEYS.map((key) => [key, `var(--space-${key})`])),
      height: Object.fromEntries(CONTROL_HEIGHT_KEYS.map((key) => [key, `var(--size-${key})`])),
      colors: {
        brand: { primary: { DEFAULT: 'var(--color-brand-primary)' } },
        surface: { base: 'var(--color-surface-base)', raised: 'var(--color-surface-raised)' },
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          brand: { secondary: 'var(--color-text-brand-secondary)' },
        },
        border: { input: 'var(--color-border-input)' },
        hairline: {
          subtle: 'var(--color-hairline-subtle)',
          DEFAULT: 'var(--color-hairline-default)',
        },
        scrim: { DEFAULT: 'var(--color-scrim-default)', press: 'var(--color-scrim-press)' },
      },
      fontFamily: { mono: ['var(--font-family-mono)', 'monospace'] },
      boxShadow: { 'glow-primary': '0 0 20px rgba(var(--color-brand-primary-rgb, 0, 0, 0), 0.4)' },
      borderRadius: { md: '8px' },
    },
  },
}

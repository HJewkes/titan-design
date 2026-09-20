// Spacing + sizing (AW-142). This file is CJS and cannot import the TypeScript
// token modules, so it repeats the STRUCTURE of the scale (the step list, the
// semantic key names) but never a semantic VALUE: every semantic key resolves to
// a `var(--space-*)` / `var(--size-*)` custom property whose number lives once in
// `src/theme/tokens/semantic.ts`. `spacing-tokens.test.ts` resolves this config
// and fails if either half drifts from the tokens — the same two-sources,
// one-test arrangement the colour vars already use.

// Tailwind's default numeric scale, emitted in px rather than rem: NativeWind
// resolves rem at a 14px base on native, so a rem scale renders 14/16 size there.
const SPACING_STEPS = [
  0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44,
  48, 52, 56, 60, 64, 72, 80, 96,
]

const numericSpacing = {
  px: '1px',
  ...Object.fromEntries(SPACING_STEPS.map((step) => [step, step === 0 ? '0' : `${step * 4}px`])),
}

// `squish` and `control` carry an explicit axis because `px-`/`py-` share one
// namespace — a single `squish-md` key cannot hold 12 across and 4 down.
const SEMANTIC_SPACING_KEYS = [
  'inset-xs',
  'inset-sm',
  'inset-md',
  'inset-lg',
  'inset-xl',
  'squish-x-xs',
  'squish-x-sm',
  'squish-x-md',
  'squish-x-lg',
  'squish-y-xs',
  'squish-y-sm',
  'squish-y-md',
  'squish-y-lg',
  'stack-sm',
  'stack-md',
  'stack-lg',
  'stack-xl',
  'inline-sm',
  'inline-md',
  'inline-lg',
  'control-x-sm',
  'control-x-md',
  'control-x-lg',
  'control-y-sm',
  'control-y-md',
  'control-y-lg',
  'section-sm',
  'section-md',
  'section-lg',
  'gutter-sm',
  'gutter-md',
]

const CONTROL_HEIGHT_KEYS = ['control-sm', 'control-md', 'control-lg']

const semanticSpacing = Object.fromEntries(
  SEMANTIC_SPACING_KEYS.map((key) => [key, `var(--space-${key})`])
)

const controlHeights = Object.fromEntries(
  CONTROL_HEIGHT_KEYS.map((key) => [key, `var(--size-${key})`])
)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    spacing: numericSpacing,
    extend: {
      spacing: semanticSpacing,
      height: controlHeights,
      minHeight: controlHeights,
      colors: {
        // Every leaf here is a `var(--color-*)` reference, which is what makes
        // light/dark switching work — and also why an opacity modifier
        // (`bg-brand-primary/10`) emits NO rule at all under Tailwind v3 and
        // renders as nothing. Reach for a wash rung instead; see VW-308 and
        // `titan/no-var-color-opacity`.
        //
        // The wash ladder (`-subtle`/`-muted`/`-strong`) is the translucency
        // vocabulary. All three rungs are published as classes so a component
        // never has to hand-mix alpha.
        brand: {
          primary: {
            DEFAULT: 'var(--color-brand-primary)',
            light: 'var(--color-brand-primary-light)',
            dark: 'var(--color-brand-primary-dark)',
            subtle: 'var(--color-brand-primary-subtle)',
            muted: 'var(--color-brand-primary-muted)',
            strong: 'var(--color-brand-primary-strong)',
            solid: 'var(--color-brand-primary-solid)',
            hover: 'var(--color-brand-primary-hover)',
            active: 'var(--color-brand-primary-active)',
          },
          secondary: {
            DEFAULT: 'var(--color-brand-secondary)',
            light: 'var(--color-brand-secondary-light)',
            dark: 'var(--color-brand-secondary-dark)',
            subtle: 'var(--color-brand-secondary-subtle)',
            muted: 'var(--color-brand-secondary-muted)',
            strong: 'var(--color-brand-secondary-strong)',
            solid: 'var(--color-brand-secondary-solid)',
            hover: 'var(--color-brand-secondary-hover)',
            active: 'var(--color-brand-secondary-active)',
          },
        },
        // Text on brand backgrounds. `-subtle` is text ON the `-subtle` fill, a
        // separate role from the white label a solid fill carries.
        'on-brand': {
          primary: {
            DEFAULT: 'var(--color-on-brand-primary)',
            subtle: 'var(--color-on-brand-primary-subtle)',
          },
          secondary: {
            DEFAULT: 'var(--color-on-brand-secondary)',
            subtle: 'var(--color-on-brand-secondary-subtle)',
          },
        },
        // Status colors
        status: {
          success: {
            DEFAULT: 'var(--color-status-success)',
            light: 'var(--color-status-success-light)',
            dark: 'var(--color-status-success-dark)',
            subtle: 'var(--color-status-success-subtle)',
            muted: 'var(--color-status-success-muted)',
            strong: 'var(--color-status-success-strong)',
            solid: 'var(--color-status-success-solid)',
          },
          // Live-session accent — own role, decoupled from success
          live: {
            DEFAULT: 'var(--color-status-live)',
            muted: 'var(--color-status-live-muted)',
          },
          // A deload week, wherever it is drawn
          deload: 'var(--color-status-deload)',
          error: {
            DEFAULT: 'var(--color-status-error)',
            light: 'var(--color-status-error-light)',
            dark: 'var(--color-status-error-dark)',
            subtle: 'var(--color-status-error-subtle)',
            muted: 'var(--color-status-error-muted)',
            strong: 'var(--color-status-error-strong)',
            solid: 'var(--color-status-error-solid)',
          },
          'error-vivid': {
            DEFAULT: 'var(--color-status-error-vivid)',
            light: 'var(--color-status-error-vivid-light)',
            dark: 'var(--color-status-error-vivid-dark)',
            subtle: 'var(--color-status-error-vivid-subtle)',
            muted: 'var(--color-status-error-vivid-muted)',
            strong: 'var(--color-status-error-vivid-strong)',
          },
          warning: {
            DEFAULT: 'var(--color-status-warning)',
            light: 'var(--color-status-warning-light)',
            dark: 'var(--color-status-warning-dark)',
            subtle: 'var(--color-status-warning-subtle)',
            muted: 'var(--color-status-warning-muted)',
            strong: 'var(--color-status-warning-strong)',
            solid: 'var(--color-status-warning-solid)',
          },
          info: {
            DEFAULT: 'var(--color-status-info)',
            light: 'var(--color-status-info-light)',
            dark: 'var(--color-status-info-dark)',
            subtle: 'var(--color-status-info-subtle)',
            muted: 'var(--color-status-info-muted)',
            strong: 'var(--color-status-info-strong)',
            solid: 'var(--color-status-info-solid)',
          },
        },
        // Text on status backgrounds. `-subtle` is text ON the `-subtle` fill.
        'on-status': {
          success: {
            DEFAULT: 'var(--color-on-status-success)',
            subtle: 'var(--color-on-status-success-subtle)',
          },
          error: {
            DEFAULT: 'var(--color-on-status-error)',
            subtle: 'var(--color-on-status-error-subtle)',
          },
          warning: {
            DEFAULT: 'var(--color-on-status-warning)',
            subtle: 'var(--color-on-status-warning-subtle)',
          },
          info: {
            DEFAULT: 'var(--color-on-status-info)',
            subtle: 'var(--color-on-status-info-subtle)',
          },
        },
        // Result/outcome colors
        result: {
          improve: {
            DEFAULT: 'var(--color-result-improve)',
            light: 'var(--color-result-improve-light)',
            dark: 'var(--color-result-improve-dark)',
          },
          degrade: {
            DEFAULT: 'var(--color-result-degrade)',
            light: 'var(--color-result-degrade-light)',
            dark: 'var(--color-result-degrade-dark)',
          },
          inconclusive: {
            DEFAULT: 'var(--color-result-inconclusive)',
            light: 'var(--color-result-inconclusive-light)',
          },
          neutral: 'var(--color-result-neutral)',
        },
        // Text on result backgrounds
        'on-result': {
          improve: 'var(--color-on-result-improve)',
          degrade: 'var(--color-on-result-degrade)',
          inconclusive: 'var(--color-on-result-inconclusive)',
        },
        // Data visualization colors
        data: {
          1: 'var(--color-data-1)',
          2: 'var(--color-data-2)',
          3: 'var(--color-data-3)',
          4: 'var(--color-data-4)',
          5: 'var(--color-data-5)',
          6: 'var(--color-data-6)',
          7: 'var(--color-data-7)',
          8: 'var(--color-data-8)',
          9: 'var(--color-data-9)',
          10: 'var(--color-data-10)',
        },
        // Chart palettes (VW-371) — the three shipped scales as theme-aware
        // roles. Index is the array index of the underlying palette, so
        // `bg-dataviz-diverging-2` is the diverging scale's optimal centre.
        dataviz: {
          diverging: {
            0: 'var(--color-dataviz-diverging-0)',
            1: 'var(--color-dataviz-diverging-1)',
            2: 'var(--color-dataviz-diverging-2)',
            3: 'var(--color-dataviz-diverging-3)',
            4: 'var(--color-dataviz-diverging-4)',
          },
          sequential: {
            0: 'var(--color-dataviz-sequential-0)',
            1: 'var(--color-dataviz-sequential-1)',
            2: 'var(--color-dataviz-sequential-2)',
            3: 'var(--color-dataviz-sequential-3)',
            4: 'var(--color-dataviz-sequential-4)',
            5: 'var(--color-dataviz-sequential-5)',
          },
          categorical: {
            0: 'var(--color-dataviz-categorical-0)',
            1: 'var(--color-dataviz-categorical-1)',
            2: 'var(--color-dataviz-categorical-2)',
            3: 'var(--color-dataviz-categorical-3)',
            4: 'var(--color-dataviz-categorical-4)',
            5: 'var(--color-dataviz-categorical-5)',
            6: 'var(--color-dataviz-categorical-6)',
          },
        },
        // Surface colors (for elevated containers)
        surface: {
          base: 'var(--color-surface-base)',
          elevated: 'var(--color-surface-elevated)',
          raised: 'var(--color-surface-raised)',
          overlay: 'var(--color-surface-overlay)',
          input: 'var(--color-surface-input)',
        },
        // Background colors
        background: {
          base: 'var(--color-background-base)',
          DEFAULT: 'var(--color-background-default)',
          subtle: 'var(--color-background-subtle)',
          frame: 'var(--color-background-frame)',
        },
        // Text colors
        text: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          tertiary: 'var(--color-text-tertiary)',
          disabled: 'var(--color-text-disabled)',
          inverse: 'var(--color-text-inverse)',
          link: {
            DEFAULT: 'var(--color-text-link)',
            hover: 'var(--color-text-link-hover)',
          },
        },
        // Border colors — DEFAULT/subtle/strong are RETIRED (TD-07.14); use the
        // `hairline` family below for separation.
        border: {
          prominent: 'var(--color-border-prominent)',
          focus: 'var(--color-border-focus)',
          input: {
            DEFAULT: 'var(--color-border-input)',
            hover: 'var(--color-border-input-hover)',
            focus: 'var(--color-border-input-focus)',
            error: 'var(--color-border-input-error)',
          },
        },
        // Interactive states
        interactive: {
          hover: 'var(--color-interactive-hover)',
          focus: 'var(--color-interactive-focus)',
          active: 'var(--color-interactive-active)',
          selected: 'var(--color-interactive-selected)',
          disabled: {
            DEFAULT: 'var(--color-interactive-disabled)',
            text: 'var(--color-interactive-disabled-text)',
          },
        },
        // Alpha hairline separators (surface-independent — §4/S-2)
        hairline: {
          subtle: 'var(--color-hairline-subtle)',
          DEFAULT: 'var(--color-hairline-default)',
          strong: 'var(--color-hairline-strong)',
        },
        // Scrims — translucent black overlays (VW-82). Their own tokens rather
        // than `bg-black/50`: Tailwind v3 drops the `/n` modifier on a `var()`
        // colour, so a translucent role has to carry its alpha itself.
        scrim: {
          DEFAULT: 'var(--color-scrim-default)',
          subtle: 'var(--color-scrim-subtle)',
          press: 'var(--color-scrim-press)',
          'press-strong': 'var(--color-scrim-press-strong)',
        },
        // Label on a toolbar control face (VW-82) — a grey plane, not a fill.
        'on-control': {
          idle: 'var(--color-on-control-idle)',
          active: 'var(--color-on-control-active)',
        },
        // Label on a light categorical data fill (VW-82).
        'on-data': {
          strong: 'var(--color-on-data-strong)',
        },
        // Divider
        divider: 'var(--color-divider)',
        // Avatar
        avatar: {
          background: 'var(--color-avatar-background)',
          text: 'var(--color-avatar-text)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family-sans)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['var(--font-family-body)', 'sans-serif'],
        heading: ['var(--font-family-heading)', 'sans-serif'],
        mono: ['var(--font-family-mono)', 'monospace'],
      },
      fontSize: {
        // Micro steps. `2xs` carries a paired line-height like the rest of the
        // scale (Typography's microLabel needs it); `3xs` is bare because a pill
        // capsule takes its height from padding, not from the label's leading.
        '3xs': '0.5625rem',
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.5rem', { lineHeight: '2rem' }],
        '2xl': ['2rem', { lineHeight: '2.5rem' }],
        '3xl': ['2.25rem', { lineHeight: '2.75rem' }],
        '4xl': ['3rem', { lineHeight: '3.5rem' }],
        '5xl': ['3.5rem', { lineHeight: '4rem' }],
      },
      boxShadow: {
        sm: '0px 1px 2px rgba(100, 116, 139, 0.12)',
        DEFAULT: '0px 1px 3px rgba(100, 116, 139, 0.12), 0px 1px 2px rgba(100, 116, 139, 0.24)',
        md: '0px 4px 6px rgba(100, 116, 139, 0.12)',
        lg: '0px 10px 15px rgba(100, 116, 139, 0.12)',
        xl: '0px 20px 25px rgba(100, 116, 139, 0.12)',
        // Glow shadows (colored radial glow for emphasis)
        'glow-primary': '0 0 20px 2px rgba(var(--color-brand-primary-rgb, 255, 121, 0), 0.4)',
        'glow-secondary': '0 0 20px 2px rgba(var(--color-brand-secondary-rgb, 48, 123, 155), 0.4)',
        'glow-success': '0 0 20px 2px rgba(var(--color-status-success-rgb, 46, 213, 115), 0.35)',
        'glow-error': '0 0 20px 2px rgba(var(--color-status-error-rgb, 209, 67, 67), 0.4)',
        'glow-warning': '0 0 20px 2px rgba(var(--color-status-warning-rgb, 249, 180, 21), 0.35)',
        'glow-info': '0 0 20px 2px rgba(var(--color-status-info-rgb, 33, 150, 243), 0.35)',
        'glow-sm': '0 0 12px 0px',
        'glow-md': '0 0 20px 2px',
        'glow-lg': '0 0 30px 4px',
      },
      borderRadius: {
        DEFAULT: '8px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        normal: '250ms',
        slow: '400ms',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-down': 'slide-down 250ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slide-up 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'scale-in': 'scale-in 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}

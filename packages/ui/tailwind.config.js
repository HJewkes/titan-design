/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: {
            DEFAULT: 'var(--color-brand-primary)',
            light: 'var(--color-brand-primary-light)',
            dark: 'var(--color-brand-primary-dark)',
            subtle: 'var(--color-brand-primary-subtle)',
            hover: 'var(--color-brand-primary-hover)',
            active: 'var(--color-brand-primary-active)',
          },
          secondary: {
            DEFAULT: 'var(--color-brand-secondary)',
            light: 'var(--color-brand-secondary-light)',
            dark: 'var(--color-brand-secondary-dark)',
            subtle: 'var(--color-brand-secondary-subtle)',
            hover: 'var(--color-brand-secondary-hover)',
            active: 'var(--color-brand-secondary-active)',
          },
        },
        // Text on brand backgrounds
        'on-brand': {
          primary: 'var(--color-on-brand-primary)',
          secondary: 'var(--color-on-brand-secondary)',
        },
        // Status colors
        status: {
          success: {
            DEFAULT: 'var(--color-status-success)',
            light: 'var(--color-status-success-light)',
            dark: 'var(--color-status-success-dark)',
            subtle: 'var(--color-status-success-subtle)',
          },
          error: {
            DEFAULT: 'var(--color-status-error)',
            light: 'var(--color-status-error-light)',
            dark: 'var(--color-status-error-dark)',
            subtle: 'var(--color-status-error-subtle)',
          },
          warning: {
            DEFAULT: 'var(--color-status-warning)',
            light: 'var(--color-status-warning-light)',
            dark: 'var(--color-status-warning-dark)',
            subtle: 'var(--color-status-warning-subtle)',
          },
          info: {
            DEFAULT: 'var(--color-status-info)',
            light: 'var(--color-status-info-light)',
            dark: 'var(--color-status-info-dark)',
            subtle: 'var(--color-status-info-subtle)',
          },
        },
        // Text on status backgrounds
        'on-status': {
          success: 'var(--color-on-status-success)',
          error: 'var(--color-on-status-error)',
          warning: 'var(--color-on-status-warning)',
          info: 'var(--color-on-status-info)',
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
        // Border colors
        border: {
          DEFAULT: 'var(--color-border-default)',
          subtle: 'var(--color-border-subtle)',
          strong: 'var(--color-border-strong)',
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
        // Divider
        divider: 'var(--color-divider)',
        // Avatar
        avatar: {
          background: 'var(--color-avatar-background)',
          text: 'var(--color-avatar-text)',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['Nunito Sans', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
      },
      fontSize: {
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
        'glow-secondary': '0 0 20px 2px rgba(var(--color-brand-secondary-rgb, 64, 109, 135), 0.4)',
        'glow-success': '0 0 20px 2px rgba(var(--color-status-success-rgb, 20, 184, 166), 0.35)',
        'glow-error': '0 0 20px 2px rgba(var(--color-status-error-rgb, 209, 67, 67), 0.4)',
        'glow-warning': '0 0 20px 2px rgba(var(--color-status-warning-rgb, 255, 176, 32), 0.35)',
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
        'out': 'cubic-bezier(0.22, 1, 0.36, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
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

export interface ThemePresetColors {
  'brand-primary'?: string
  'brand-primary-light'?: string
  'brand-primary-dark'?: string
  'brand-primary-subtle'?: string
  'brand-primary-hover'?: string
  'brand-primary-active'?: string
  'brand-secondary'?: string
  'brand-secondary-light'?: string
  'brand-secondary-dark'?: string
  'brand-secondary-subtle'?: string
  'brand-secondary-hover'?: string
  'brand-secondary-active'?: string
  'on-brand-primary'?: string
  'on-brand-secondary'?: string
  'status-success'?: string
  'status-error'?: string
  'status-warning'?: string
  'status-info'?: string
  'text-primary'?: string
  'text-secondary'?: string
  'text-tertiary'?: string
  'surface-base'?: string
  'surface-elevated'?: string
  'surface-raised'?: string
  'surface-overlay'?: string
  'surface-input'?: string
  'background-base'?: string
  'background-default'?: string
  'background-subtle'?: string
  'hairline-default'?: string
  'hairline-subtle'?: string
  'hairline-strong'?: string
  'border-focus'?: string
  'divider'?: string
  [key: `${string}`]: string | undefined
}

export interface ThemePresetFonts {
  sans?: string
  body?: string
  heading?: string
  mono?: string
}

export interface ThemePresetRadii {
  sm?: string
  DEFAULT?: string
  md?: string
  lg?: string
  xl?: string
}

export interface ThemePresetShadows {
  sm?: string
  DEFAULT?: string
  md?: string
  lg?: string
  xl?: string
}

export interface ThemePreset {
  name: string
  description?: string
  colors?: {
    dark?: ThemePresetColors
    light?: ThemePresetColors
  }
  fonts?: ThemePresetFonts
  radii?: ThemePresetRadii
  shadows?: ThemePresetShadows
  /** Additional CSS classes to add to root element */
  rootClasses?: string[]
  /** Google Fonts import URL (appended to existing imports) */
  fontImport?: string
}

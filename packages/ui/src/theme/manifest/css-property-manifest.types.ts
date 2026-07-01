/**
 * TypeScript mirror of css-property-manifest.schema.json.
 *
 * A manifest records, per component, which visual CSS properties are tracked,
 * which design token each one resolves from, the expected computed style
 * value, and any per-variant overrides. Manifests are the fixtures consumed
 * by Playwright computed-style assertions (see packages/ui/tests/visual).
 */

/** Variant axis name/value pairs, e.g. { variant: 'solid', color: 'primary', size: 'md' }. */
export type VariantAxes = Record<string, string>

/** A resolvedValue/token override that applies when the given variant axes match. */
export interface VariantOverride {
  /** Partial variant axis values that trigger this override, merged onto baseVariant. */
  variant: VariantAxes
  /** Semantic token key for this override, or null for a literal (non-tokenized) value. */
  token?: string | null
  /** CSS custom property backing the token for this override, if any. */
  cssVariable?: string | null
  /** Expected getComputedStyle value when the variant axes match. */
  resolvedValue: string
}

/** A single tracked CSS property for a component. */
export interface CssPropertyEntry {
  /** CSS property name in camelCase, as returned by window.getComputedStyle (e.g. "backgroundColor"). */
  property: string
  /** Semantic token key this property is sourced from, or null if not backed by a token. */
  token: string | null
  /** CSS custom property backing the token (e.g. "--color-brand-primary"), if any. */
  cssVariable?: string | null
  /** Expected computed style value for baseVariant. */
  resolvedValue: string
  /** Overrides of token/resolvedValue for specific variant axis combinations. */
  variantOverrides?: VariantOverride[]
}

/** The full per-component CSS property manifest. */
export interface CssPropertyManifest {
  /** Component identifier matching its src/components/ui/{component} directory and Storybook id. */
  component: string
  /** Optional human-readable note about what this manifest covers. */
  description?: string
  /** Variant axis values each property's top-level resolvedValue was captured against. */
  baseVariant?: VariantAxes
  /** Tracked CSS properties for this component. */
  properties: CssPropertyEntry[]
}

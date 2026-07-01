import type { CssPropertyManifest, VariantAxes } from './css-property-manifest.types'

/** Result of validating a candidate manifest: valid iff errors is empty. */
export interface ManifestValidationResult {
  valid: boolean
  errors: string[]
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isVariantAxes = (value: unknown): value is VariantAxes =>
  isPlainObject(value) &&
  Object.keys(value).length > 0 &&
  Object.values(value).every((axisValue) => typeof axisValue === 'string')

function collectVariantOverrideErrors(override: unknown, path: string): string[] {
  if (!isPlainObject(override)) return [`${path} must be an object`]
  const errors: string[] = []
  if (!isVariantAxes(override.variant))
    errors.push(`${path}.variant must be a non-empty string-keyed object`)
  if (
    override.token !== undefined &&
    override.token !== null &&
    typeof override.token !== 'string'
  ) {
    errors.push(`${path}.token must be a string or null`)
  }
  if (typeof override.resolvedValue !== 'string' || override.resolvedValue.length === 0) {
    errors.push(`${path}.resolvedValue must be a non-empty string`)
  }
  return errors
}

function collectPropertyErrors(entry: unknown, path: string): string[] {
  if (!isPlainObject(entry)) return [`${path} must be an object`]
  const errors: string[] = []
  if (typeof entry.property !== 'string' || entry.property.length === 0) {
    errors.push(`${path}.property must be a non-empty string`)
  }
  if (entry.token !== null && typeof entry.token !== 'string') {
    errors.push(`${path}.token must be a string or null`)
  }
  if (typeof entry.resolvedValue !== 'string' || entry.resolvedValue.length === 0) {
    errors.push(`${path}.resolvedValue must be a non-empty string`)
  }
  if (entry.variantOverrides !== undefined) {
    if (!Array.isArray(entry.variantOverrides)) {
      errors.push(`${path}.variantOverrides must be an array`)
    } else {
      entry.variantOverrides.forEach((override, i) =>
        errors.push(...collectVariantOverrideErrors(override, `${path}.variantOverrides[${i}]`))
      )
    }
  }
  return errors
}

/** Structurally validates a candidate value against the CssPropertyManifest shape. */
export function validateCssPropertyManifest(candidate: unknown): ManifestValidationResult {
  if (!isPlainObject(candidate)) return { valid: false, errors: ['manifest must be an object'] }

  const errors: string[] = []
  if (typeof candidate.component !== 'string' || candidate.component.length === 0) {
    errors.push('component must be a non-empty string')
  }
  if (candidate.baseVariant !== undefined && !isVariantAxes(candidate.baseVariant)) {
    errors.push('baseVariant must be a non-empty string-keyed object')
  }
  if (!Array.isArray(candidate.properties) || candidate.properties.length === 0) {
    errors.push('properties must be a non-empty array')
  } else {
    candidate.properties.forEach((entry, i) =>
      errors.push(...collectPropertyErrors(entry, `properties[${i}]`))
    )
  }

  return { valid: errors.length === 0, errors }
}

/** Type guard variant of validateCssPropertyManifest for use in narrowing contexts. */
export function isCssPropertyManifest(candidate: unknown): candidate is CssPropertyManifest {
  return validateCssPropertyManifest(candidate).valid
}

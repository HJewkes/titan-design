/**
 * Compact integer formatting for dense readouts (stat tiles, sparkline
 * captions) where a full-precision number would blow the column width.
 */

/** 1234 → "1.2k", 1048576 → "1.0M", 42 → "42". Sign is preserved. */
export function formatCompact(n: number): string {
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (abs >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
}

/** Like {@link formatCompact} but always signed: 514689 → "+514.7k", -20 → "-20". */
export function formatSignedCompact(n: number): string {
  return (n >= 0 ? '+' : '') + formatCompact(n)
}

/** An integer renders bare; anything else renders to `decimals` places. */
export function formatTrimmedDecimal(n: number, decimals: number): string {
  return Number.isInteger(n) ? `${n}` : n.toFixed(decimals)
}

/** A value to one decimal place, always shown: `1.5`, `0.0`, `-0.6`. */
export function formatTenths(n: number): string {
  return n.toFixed(1)
}

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

/**
 * A dollar amount to the cent: `$4.81`, `$4,812.50`. A positive amount under a cent reads
 * `<$0.01` rather than a misleading `$0.00`; a non-finite value reads `—`, never `$NaN`.
 */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (n > 0 && n < 0.01) return '<$0.01'
  return USD.format(n)
}

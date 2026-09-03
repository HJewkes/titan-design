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

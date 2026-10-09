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

const BYTE_UNITS = ['B', 'kB', 'MB', 'GB']

/** 0 → "0 B", 1536 → "1.5 kB", 2097152 → "2 MB". A negative or non-finite count reads as zero. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const unit = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), BYTE_UNITS.length - 1)
  const value = bytes / 1024 ** unit
  return `${formatTrimmedDecimal(Math.round(value * 10) / 10, 1)} ${BYTE_UNITS[unit]}`
}

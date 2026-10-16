import { getSemanticColors, type ThemeMode } from '../theme/tokens/semantic'

const SLOT_COUNT = 7

export function avatarColorSlot(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % SLOT_COUNT
}

export function avatarColors(mode: ThemeMode): string[] {
  const colors = getSemanticColors(mode)
  return Array.from(
    { length: SLOT_COUNT },
    (_, slot) => colors[`dataviz-categorical-${slot}` as keyof typeof colors] as string
  )
}

export function avatarColor(name: string, mode: ThemeMode): string {
  return avatarColors(mode)[avatarColorSlot(name)]
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

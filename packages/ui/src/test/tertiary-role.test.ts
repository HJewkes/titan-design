import fs from 'node:fs'
import path from 'node:path'
import allowlist from './tertiary-role-allowlist.json'
import { countTertiaryRoleSites, scanTertiaryRoleSites } from './tertiary-role'
import { uiRoot } from './tailwind-compile'

const srcRoot = path.join(uiRoot, 'src')
const allowed: Record<string, { count: number; reason: string }> = allowlist

describe('countTertiaryRoleSites', () => {
  it('counts a tertiary caption, single-line or multi-line', () => {
    const multiLine =
      '<Typography\n  variant="caption"\n  color="tertiary"\n>\n  {at}\n</Typography>'
    expect(
      countTertiaryRoleSites('<Typography variant="caption" color="tertiary">x</Typography>')
    ).toBe(1)
    expect(countTertiaryRoleSites(multiLine)).toBe(1)
  })

  it('counts every content variant and a DateTime, but not a body or mono variant', () => {
    for (const variant of ['body2', 'overline', 'microLabel', 'monoLabel']) {
      expect(countTertiaryRoleSites(`<Typography variant="${variant}" color="tertiary" />`)).toBe(1)
    }
    expect(
      countTertiaryRoleSites('<DateTime value={at} variant="caption" color="tertiary" />')
    ).toBe(1)
    expect(countTertiaryRoleSites('<Typography variant="mono" color="tertiary" />')).toBe(0)
  })

  it('counts a tertiary caption set by class or by a conditional colour', () => {
    const conditional = "<Typography variant=\"caption\" color={failed ? 'error' : 'tertiary'} />"
    expect(
      countTertiaryRoleSites('<Typography variant="caption" className="text-text-tertiary" />')
    ).toBe(1)
    expect(countTertiaryRoleSites(conditional)).toBe(1)
  })

  it('counts a small tertiary class string, including one assembled by cn()', () => {
    const helper =
      "<Text className={cn('text-xs', isInvalid ? 'text-text-error' : 'text-text-tertiary')} />"
    expect(
      countTertiaryRoleSites('<Text className="text-xs text-text-tertiary">{hint}</Text>')
    ).toBe(1)
    expect(countTertiaryRoleSites(helper)).toBe(1)
  })

  it('counts a tag matching both checks once', () => {
    const both =
      '<Typography variant="caption" className="text-xs text-text-tertiary">x</Typography>'
    expect(countTertiaryRoleSites(both)).toBe(1)
  })

  it('leaves secondary captions, placeholders and unsized glyphs alone', () => {
    expect(countTertiaryRoleSites('<Typography variant="caption" color="secondary" />')).toBe(0)
    expect(
      countTertiaryRoleSites('<TextInput className="text-sm placeholder:text-text-tertiary" />')
    ).toBe(0)
    expect(countTertiaryRoleSites('<Text className="text-text-tertiary">×</Text>')).toBe(0)
  })
})

describe('tertiary text role ratchet', () => {
  const found = scanTertiaryRoleSites(srcRoot)

  it('allows no tertiary content-role site beyond the allowlist', () => {
    const over = Object.entries(found)
      .filter(([file, count]) => count > (allowed[file]?.count ?? 0))
      .map(([file, count]) => `${file}: ${count} > ${allowed[file]?.count ?? 0}`)
    expect(
      over,
      'use text-secondary; tertiary is for units, separators, placeholders, glyphs'
    ).toEqual([])
  })

  it('has no stale allowlist entry once a site moves to text-secondary', () => {
    const stale = Object.entries(allowed)
      .filter(([file, { count }]) => (found[file] ?? 0) < count)
      .map(([file, { count }]) => `${file}: ${found[file] ?? 0} < ${count}`)
    expect(stale, 'lower the count in tertiary-role-allowlist.json').toEqual([])
  })

  it('names only files that exist, each with a reason', () => {
    const bad = Object.entries(allowed).filter(
      ([file, { reason }]) => !fs.existsSync(path.join(srcRoot, file)) || !reason
    )
    expect(bad).toEqual([])
  })
})

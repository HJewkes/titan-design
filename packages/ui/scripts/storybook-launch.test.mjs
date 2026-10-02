import { describe, expect, it } from 'vitest'
import { buildStorybookArgs, refuseWithoutLsof, resolveLsof } from './storybook-launch.mjs'

describe('buildStorybookArgs', () => {
  it('passes --ci and --exact-port on the chosen port', () => {
    const args = buildStorybookArgs(6123)
    expect(args).toEqual(['dev', '-p', '6123', '--exact-port', '--ci'])
  })

  it('does not duplicate --ci when the caller already passed it', () => {
    const args = buildStorybookArgs(6006, ['--ci', '--quiet'])
    expect(args.filter((a) => a === '--ci')).toHaveLength(1)
    expect(args).toContain('--quiet')
  })
})

describe('resolveLsof', () => {
  it('prefers the absolute /usr/sbin path when PATH lacks it', () => {
    const exists = (p) => p === '/usr/sbin/lsof'
    expect(resolveLsof({ exists, pathDirs: ['/bin'] })).toBe('/usr/sbin/lsof')
  })

  it('falls back to a PATH lookup', () => {
    const exists = (p) => p === '/opt/tools/lsof'
    expect(resolveLsof({ exists, pathDirs: ['/bin', '/opt/tools'] })).toBe('/opt/tools/lsof')
  })

  it('returns null when lsof cannot be found', () => {
    expect(resolveLsof({ exists: () => false, pathDirs: ['/bin'] })).toBeNull()
  })
})

describe('refuseWithoutLsof', () => {
  it('prints a reason and exits 1 when lsof is missing', () => {
    const lines = []
    const codes = []
    refuseWithoutLsof(null, { error: (l) => lines.push(l), exit: (c) => codes.push(c) })
    expect(codes).toEqual([1])
    expect(lines.join('\n')).toMatch(/lsof was not found/)
  })

  it('does nothing when lsof resolved', () => {
    const codes = []
    refuseWithoutLsof('/usr/sbin/lsof', { error: () => {}, exit: (c) => codes.push(c) })
    expect(codes).toEqual([])
  })
})

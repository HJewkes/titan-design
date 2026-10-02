import { describe, expect, it } from 'vitest'
import { createServer } from 'node:net'
import { networkInterfaces } from 'node:os'
import {
  buildStorybookArgs,
  isEntryPoint,
  isPortFree,
  pickFreePort,
  printInventory,
  refuseWithoutLsof,
  resolveLsof,
} from './storybook-launch.mjs'

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
  const run = (lsof, args) => {
    const lines = []
    const codes = []
    refuseWithoutLsof(lsof, args, { error: (l) => lines.push(l), exit: (c) => codes.push(c) })
    return { lines: lines.join('\n'), codes }
  }

  it.each([['--list'], ['--reap'], ['--reap=foreign'], ['--reap-all']])(
    'refuses %s with a printed reason when lsof is missing',
    (flag) => {
      const { lines, codes } = run(null, [flag])
      expect(codes).toEqual([1])
      expect(lines).toMatch(/lsof was not found/)
    }
  )

  it('lets a plain or isolated launch through when lsof is missing', () => {
    expect(run(null, []).codes).toEqual([])
    expect(run(null, ['--isolated']).codes).toEqual([])
  })

  it('does nothing when lsof resolved', () => {
    expect(run('/usr/sbin/lsof', ['--list']).codes).toEqual([])
  })
})

describe('pickFreePort', () => {
  it('picks the first port when the probe says it is free', async () => {
    expect(await pickFreePort([6100, 6102], { isFree: async () => true })).toBe(6100)
  })

  it('skips ports the inventory lists as busy', async () => {
    const port = await pickFreePort([6100, 6102], {
      busy: new Set([6100]),
      isFree: async () => true,
    })
    expect(port).toBe(6101)
  })

  it('returns null when every port is taken', async () => {
    expect(await pickFreePort([6100, 6101], { isFree: async () => false })).toBeNull()
  })

  it('skips a port held open by a real listener (default bind probe)', async () => {
    const holder = createServer()
    await new Promise((ok) => holder.listen(0, '127.0.0.1', ok))
    const held = holder.address().port
    try {
      expect(await isPortFree(held)).toBe(false)
      const port = await pickFreePort([held, held + 1])
      expect(port).not.toBe(held)
    } finally {
      await new Promise((ok) => holder.close(ok))
    }
  })
})

describe('isEntryPoint', () => {
  it('matches when argv[1] is a symlink to the script', () => {
    const real = (p) => (p === '/link/launch.mjs' ? '/pkg/scripts/launch.mjs' : p)
    expect(isEntryPoint('file:///pkg/scripts/launch.mjs', '/link/launch.mjs', real)).toBe(true)
  })

  it('does not match another entry file or a missing one', () => {
    expect(isEntryPoint('file:///pkg/scripts/launch.mjs', '/other.mjs', (p) => p)).toBe(false)
    expect(isEntryPoint('file:///pkg/scripts/launch.mjs', undefined)).toBe(false)
  })
})

describe('isPortFree without lsof', () => {
  const hasIpv6 = Boolean(
    Object.values(networkInterfaces())
      .flat()
      .find((i) => i.address === '::1')
  )

  const holdOn = async (host) => {
    const holder = createServer()
    await new Promise((ok) => holder.listen(0, host, ok))
    return { port: holder.address().port, close: () => new Promise((ok) => holder.close(ok)) }
  }

  it.each([
    ['127.0.0.1', true],
    ['0.0.0.0', true],
    ['::1', hasIpv6],
  ])('reports busy for a listener on %s', async (host, supported) => {
    if (!supported) return
    const held = await holdOn(host)
    try {
      expect(await isPortFree(held.port)).toBe(false)
    } finally {
      await held.close()
    }
  })

  it('reports free for an unheld port', async () => {
    const held = await holdOn('127.0.0.1')
    await held.close()
    expect(await isPortFree(held.port)).toBe(true)
  })

  it('does not print Nothing listening when lsof is missing', () => {
    const lines = []
    printInventory([], { lsof: null, log: (l) => lines.push(l) })
    expect(lines.join('\n')).not.toMatch(/Nothing listening/)
    expect(lines.join('\n')).toMatch(/needs lsof/)
  })
})

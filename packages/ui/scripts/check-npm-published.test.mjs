import { describe, expect, it, vi } from 'vitest'
import { checkNpmPublished } from './check-npm-published.mjs'

const registryWith = (...versions) => ({
  ok: true,
  status: 200,
  json: async () => ({ versions: Object.fromEntries(versions.map((v) => [v, {}])) }),
})

const run = (fetchImpl, overrides = {}) =>
  checkNpmPublished({
    version: '9.9.9',
    fetchImpl,
    sleep: vi.fn(async () => {}),
    retries: 4,
    ...overrides,
  })

describe('checkNpmPublished', () => {
  it('succeeds when the version is present on the first read', async () => {
    const fetchImpl = vi.fn(async () => registryWith('9.9.8', '9.9.9'))

    const result = await run(fetchImpl)

    expect(result.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it('succeeds when the version appears after two misses', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(registryWith('9.9.8'))
      .mockResolvedValueOnce(registryWith('9.9.8'))
      .mockResolvedValueOnce(registryWith('9.9.8', '9.9.9'))

    const result = await run(fetchImpl)

    expect(result.ok).toBe(true)
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it('fails naming the version when it never appears', async () => {
    const fetchImpl = vi.fn(async () => registryWith('9.9.8'))

    const result = await run(fetchImpl)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('9.9.9')
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('retries a network error and then reports it', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('socket hang up')
    })

    const result = await run(fetchImpl)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('9.9.9')
    expect(result.message).toContain('socket hang up')
    expect(fetchImpl).toHaveBeenCalledTimes(4)
  })

  it('recovers when a network error is followed by the version', async () => {
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce(registryWith('9.9.9'))

    const result = await run(fetchImpl)

    expect(result.ok).toBe(true)
  })

  it('treats a non-200 registry response as a miss', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) }))

    const result = await run(fetchImpl)

    expect(result.ok).toBe(false)
    expect(result.message).toContain('503')
  })
})

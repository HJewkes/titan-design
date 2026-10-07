import { describe, expect, it } from 'vitest'
import storybookConfig from '../playwright.config'
import baselineConfig from '../playwright.baseline.config'
import comparisonConfig from '../playwright.comparison.config'
import tokensConfig from '../playwright.tokens.config'

const configs = {
  'playwright.config.ts': storybookConfig,
  'playwright.baseline.config.ts': baselineConfig,
  'playwright.comparison.config.ts': comparisonConfig,
  'playwright.tokens.config.ts': tokensConfig,
}

const webServers = Object.entries(configs).flatMap(([file, config]) =>
  [config.webServer ?? []].flat().map((server) => ({ file, server, port: serverPort(server) }))
)

function serverPort(server) {
  return server.port ?? Number(new URL(server.url).port)
}

describe('Playwright webServer configs (TD-512)', () => {
  it('covers every config that starts a server', () => {
    expect(webServers.map((w) => w.file)).toEqual(Object.keys(configs))
  })

  it.each(webServers)(
    'never reuses an existing server on a shared port in $file',
    ({ server, port }) => {
      expect([5200, 6006]).toContain(port)
      expect(server.reuseExistingServer).not.toBe(true)
    }
  )

  it.each(webServers.filter((w) => w.port === 5200))(
    'starts the specimen server with --strictPort in $file',
    ({ server }) => {
      expect(server.command).toContain('pnpm specimen')
      expect(server.command).toContain('--strictPort')
    }
  )

  it.each(webServers.filter((w) => w.port === 6006))(
    'serves the static Storybook build with --strictPort in $file',
    ({ server }) => {
      expect(server.command).toContain('vite preview --outDir storybook-static')
      expect(server.command).toContain('--strictPort')
    }
  )

  // The launcher's bind probe holds the port for an instant; a port wait took it for readiness (TD-735).
  it.each(webServers.filter((w) => w.port === 6006))(
    'waits for Storybook to serve its index, not for the port, in $file',
    ({ server }) => {
      expect(server.port).toBeUndefined()
      expect(new URL(server.url).pathname).toBe('/index.json')
    }
  )
})

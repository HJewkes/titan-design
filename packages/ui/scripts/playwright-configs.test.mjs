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
  [config.webServer ?? []].flat().map((server) => ({ file, server }))
)

describe('Playwright webServer configs (TD-512)', () => {
  it('covers every config that starts a server', () => {
    expect(webServers.map((w) => w.file)).toEqual(Object.keys(configs))
  })

  it.each(webServers)(
    'never reuses an existing server on a shared port in $file',
    ({ server }) => {
      expect([5200, 6006]).toContain(server.port)
      expect(server.reuseExistingServer).not.toBe(true)
    }
  )

  it.each(webServers.filter((w) => w.server.port === 5200))(
    'starts the specimen server with --strictPort in $file',
    ({ server }) => {
      expect(server.command).toContain('pnpm specimen')
      expect(server.command).toContain('--strictPort')
    }
  )

  it.each(webServers.filter((w) => w.server.port === 6006))(
    'serves the static Storybook build with --strictPort in $file',
    ({ server }) => {
      expect(server.command).toContain('vite preview --outDir storybook-static')
      expect(server.command).toContain('--strictPort')
    }
  )
})

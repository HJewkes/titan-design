import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { createServer, type Plugin, type ViteDevServer } from 'vite'
import { PAGE_BASE, type PageHandler } from './server.ts'

const PAGE_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'page')
const TOKENS_ID = 'virtual:titan-tokens.css'
const RESOLVED_TOKENS_ID = `\0${TOKENS_ID}`

function titanTokensSource(): string {
  const require = createRequire(import.meta.url)
  const globalCss = require.resolve('@titan-design/react-ui/theme/global.css')
  return join(dirname(globalCss), 'tokens-css.ts')
}

/** Titan's token custom properties, generated from source so the page needs no ui build. */
function titanTokens(): Plugin {
  let server: ViteDevServer
  return {
    name: 'titan-review:tokens',
    configureServer(s) {
      server = s
    },
    resolveId: (id) => (id === TOKENS_ID ? RESOLVED_TOKENS_ID : undefined),
    async load(id) {
      if (id !== RESOLVED_TOKENS_ID) return undefined
      const mod = await server.ssrLoadModule(titanTokensSource())
      return (mod as { generateTokensCss: () => string }).generateTokensCss()
    },
  }
}

export interface PageServer {
  handler: PageHandler
  close: () => Promise<void>
}

export async function createPageServer(): Promise<PageServer> {
  const vite = await createServer({
    configFile: false,
    root: PAGE_ROOT,
    base: PAGE_BASE,
    appType: 'spa',
    logLevel: 'warn',
    plugins: [react(), titanTokens()],
    server: { middlewareMode: true, hmr: false },
  })
  return {
    handler: (req, res, next) => vite.middlewares(req, res, next),
    close: () => vite.close(),
  }
}

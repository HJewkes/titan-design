#!/usr/bin/env node
/**
 * Stands in for `storybook-launch.mjs --isolated` in tests. Like the real launcher it prints
 * `http://127.0.0.1:<port>` and then spawns the server as a non-detached child with inherited
 * stdio. The port comes from the OS (`listen(0)`), so it never collides with a real Storybook.
 *
 *   --port <n>           print this port instead of a free one (a second launcher racing the first)
 *   --idle               the child binds nothing, like a Storybook that lost the race for its port
 *   --die-before-ready   print the port line, then exit 3 without starting a server
 *   --no-line            start nothing and print no port line, then wait
 *   --ignore-term        the server child ignores SIGTERM (exercises the SIGKILL fallback)
 *   --serve <port>       internal: be the server child
 *
 * It prints `fake-server-pid <pid>` so a test can watch the child as well as the launcher.
 */
/* global process, console, setTimeout, setInterval */
import { spawn } from 'node:child_process'
import { createServer as createHttpServer } from 'node:http'
import { createServer } from 'node:net'
import { fileURLToPath } from 'node:url'

const argv = process.argv.slice(2)
const has = (flag) => argv.includes(flag)
const valueOf = (flag) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined)
const CHILD_FLAGS = ['--ignore-term', '--idle']

const INDEX = {
  v: 5,
  entries: {
    'fake-button--default': {
      type: 'story',
      id: 'fake-button--default',
      importPath: './src/components/ui/fake-button/FakeButton.stories.tsx',
    },
  },
}

function serve(port) {
  if (has('--ignore-term')) process.on('SIGTERM', () => {})
  if (has('--idle')) return setInterval(() => {}, 1000)
  const server = createHttpServer((req, res) => {
    if (req.url !== '/index.json') return res.writeHead(404).end()
    res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify(INDEX))
  })
  // A short delay, so readiness has to be polled rather than found on the first try.
  setTimeout(() => server.listen(port, '127.0.0.1'), 300)
}

function freePort() {
  return new Promise((done) => {
    const probe = createServer().listen(0, '127.0.0.1', () => {
      const { port } = probe.address()
      probe.close(() => done(port))
    })
  })
}

async function launch() {
  if (has('--no-line')) return setInterval(() => {}, 1000)
  const port = valueOf('--port') ?? (await freePort())
  console.log(`  http://127.0.0.1:${port}\n`)
  if (has('--die-before-ready')) process.exit(3)
  const self = fileURLToPath(import.meta.url)
  const extra = CHILD_FLAGS.filter(has)
  const child = spawn(process.execPath, [self, '--serve', String(port), ...extra], {
    stdio: 'inherit',
  })
  console.log(`fake-server-pid ${child.pid}`)
  child.on('exit', (code) => process.exit(code ?? 0))
}

const servePort = valueOf('--serve')
if (servePort) serve(Number(servePort))
else launch()

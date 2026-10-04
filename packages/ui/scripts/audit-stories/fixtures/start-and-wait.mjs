#!/usr/bin/env node
/**
 * A stand-in for the audit command in the lifecycle tests: starts the fake launcher through
 * `startStorybook`, installs `stopOnSignals`, and prints `ready <launcher pid> <server pid>`.
 *
 *   (default)          then waits to be signalled
 *   --ignore-term      the fake server ignores SIGTERM, so a stop lasts the whole grace period
 *   --stop-and-return  stops the server and returns, leaving the process to exit on its own
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startStorybook, stopOnSignals } from '../storybook.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const argv = process.argv.slice(2)

const server = await startStorybook({
  launcher: join(here, 'fake-launcher.mjs'),
  args: argv.filter((a) => a === '--ignore-term'),
  readyTimeoutMs: 30_000,
  pollMs: 50,
  graceMs: 1000,
})
stopOnSignals(server)
const serverPid = server.output().match(/fake-server-pid (\d+)/)[1]
console.log(`ready ${server.pid} ${serverPid}`)
if (argv.includes('--stop-and-return')) await server.stop()
else setInterval(() => {}, 1000)

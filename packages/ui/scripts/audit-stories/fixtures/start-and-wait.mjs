#!/usr/bin/env node
/**
 * A stand-in for the audit command in the signal test: starts the fake launcher through
 * `startStorybook`, installs `stopOnSignals`, prints `ready <launcher pid> <server pid>`, and
 * then waits to be signalled.
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { startStorybook, stopOnSignals } from '../storybook.mjs'

const here = dirname(fileURLToPath(import.meta.url))

const server = await startStorybook({
  launcher: join(here, 'fake-launcher.mjs'),
  args: [],
  readyTimeoutMs: 10_000,
  pollMs: 50,
  graceMs: 1000,
})
stopOnSignals(server)
const serverPid = server.output().match(/fake-server-pid (\d+)/)[1]
console.log(`ready ${server.pid} ${serverPid}`)
setInterval(() => {}, 1000)

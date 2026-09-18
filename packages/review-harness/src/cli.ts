#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { captureRound } from './capture.ts'
import { createPageServer } from './page-server.ts'
import { runCli } from './run.ts'

const controller = new AbortController()
process.once('SIGINT', () => controller.abort())

const code = await runCli(process.argv.slice(2), {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(`${text}\n`),
  openBrowser: (url) => spawn('open', [url], { stdio: 'ignore', detached: true }).unref(),
  capture: (round, outDir) => captureRound(round.manifest, round.storybookUrl, outDir),
  createPage: createPageServer,
  signal: controller.signal,
})
process.exit(code)

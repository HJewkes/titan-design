#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { treeGit } from './build.ts'
import { captureRound } from './capture.ts'
import { measureRound } from './contrast-measure.ts'
import { checkHarnessFreshness } from './harness-freshness.ts'
import { createPageServer } from './page-server.ts'
import { runCli } from './run.ts'

const controller = new AbortController()
process.once('SIGINT', () => controller.abort())

const code = await runCli(process.argv.slice(2), {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(`${text}\n`),
  openBrowser: (url) => spawn('open', [url], { stdio: 'ignore', detached: true }).unref(),
  capture: (round, outDir) =>
    captureRound(round.manifest, round.storybookUrl, outDir, round.images),
  measure: (round) => measureRound(round.manifest, round.storybookUrl),
  git: treeGit,
  createPage: createPageServer,
  harnessFreshness: checkHarnessFreshness,
  signal: controller.signal,
})
process.exit(code)

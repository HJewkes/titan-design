#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { basename, dirname } from 'node:path'
import { treeGit } from './build.ts'
import { captureRound } from './capture.ts'
import { measureRound } from './contrast-measure.ts'
import { renderFrames } from './frames.ts'
import { checkHarnessFreshness } from './harness-freshness.ts'
import { locksIo } from './locks.ts'
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
  renderFrames: (round, roundDir) =>
    renderFrames(round.manifest, round.storybookUrl, {
      roundsDir: dirname(roundDir),
      roundId: basename(roundDir),
      manifestSha256: round.manifestSha256,
    }),
  git: treeGit,
  createPage: createPageServer,
  harnessFreshness: checkHarnessFreshness,
  locks: locksIo,
  signal: controller.signal,
})
process.exit(code)

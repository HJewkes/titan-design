import { dirname, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { buildRound, contrastWarning, type BuildIo } from './build.ts'
import { calibrationReport, readFeedbackFiles } from './calibration.ts'
import { exampleManifest, sectionedExampleManifest } from './example.ts'
import {
  EXIT_INTERRUPTED,
  EXIT_INVALID,
  EXIT_OK,
  ReviewError,
  assertStoriesExist,
  collectFeedback,
  loadRound,
  writeFeedback,
  type LoadedRound,
  type ReviewDeps,
} from './review.ts'

export const USAGE = `titan-review <round.json> [options]
titan-review --example [--storybook <url>]
titan-review build <draft.json> [--storybook <url>]
titan-review calibration <feedback.json...>

Serves one review round (live Storybook iframes or static PNGs, picks, comments, pins) on
127.0.0.1, blocks until the human submits, writes <out>/feedback.json plus one PNG per story
variant per width and a copy of each image variant's PNG, prints the feedback JSON on stdout
and exits 0. Ctrl-C exits 130, writing nothing.

build measures every story frame of a draft round at every width, light and dark, in
headless Chromium: text at 4.5:1 (3:1 when large), control boundaries, separators, tracks and
marks at 3:1. It writes contrast.json beside the draft and copies the draft to round.json
only if every miss is declared in contrast.knownDefects with its route; otherwise it exits 3.

calibration reads feedback files and prints how often the owner's answer matched our
recommendation: per round, overall, and by confidence band (<0.5, 0.5-0.75, >=0.75).

  --storybook <url>  Storybook base url (default: the manifest's storybookUrl)
  --out <dir>        Where feedback.json and PNGs go (default: the manifest's directory)
  --port <n>         Review page port (default: a free one)
  --no-open          Print the page url instead of opening the browser
  --no-capture       Skip the post-submit PNGs
  --example          Print a sample manifest built from Lab/Decisions stories
  --sections         With --example, print the question-first sectioned shape
  --help             Print this help`

export interface CliIo extends Omit<ReviewDeps, 'onReady'>, Pick<BuildIo, 'measure'> {
  stdout: (text: string) => void
  stderr: (text: string) => void
  openBrowser: (url: string) => void
  capture: (round: LoadedRound, outDir: string) => Promise<string[]>
}

function parseCli(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      storybook: { type: 'string' },
      out: { type: 'string' },
      port: { type: 'string' },
      'no-open': { type: 'boolean' },
      'no-capture': { type: 'boolean' },
      example: { type: 'boolean' },
      sections: { type: 'boolean' },
      help: { type: 'boolean' },
    },
  })
}

type Parsed = ReturnType<typeof parseCli>

async function captureQuietly(io: CliIo, round: LoadedRound, outDir: string): Promise<void> {
  try {
    const files = await io.capture(round, outDir)
    files.forEach((f) => io.stderr(`captured ${f}`))
  } catch (err) {
    io.stderr(`capture failed (feedback.json is still written): ${(err as Error).message}`)
  }
}

async function review(parsed: Parsed, io: CliIo): Promise<number> {
  const manifestPath = resolve(parsed.positionals[0])
  const round = await loadRound(manifestPath, parsed.values.storybook)
  await assertStoriesExist(round)
  const unmeasured = await contrastWarning(manifestPath, round.manifestSha256)
  if (unmeasured) io.stderr(`titan-review: warning: ${unmeasured}`)
  const onReady = (url: string) => {
    io.stderr(`titan-review: ${round.manifest.unit} round ${round.manifest.round} at ${url}`)
    if (!parsed.values['no-open']) io.openBrowser(url)
  }
  const port = parsed.values.port ? Number(parsed.values.port) : io.port
  const feedback = await collectFeedback(round, { ...io, port, onReady })
  if (!feedback) return EXIT_INTERRUPTED
  const outDir = resolve(parsed.values.out ?? dirname(manifestPath))
  io.stderr(`wrote ${await writeFeedback(outDir, feedback)}`)
  if (!parsed.values['no-capture']) await captureQuietly(io, round, outDir)
  io.stdout(`${JSON.stringify(feedback, null, 2)}\n`)
  return EXIT_OK
}

function isUsageError(err: unknown): err is Error {
  const code = (err as { code?: unknown }).code
  return (
    err instanceof ReviewError || (typeof code === 'string' && code.startsWith('ERR_PARSE_ARGS'))
  )
}

async function dispatch(parsed: Parsed, io: CliIo): Promise<number> {
  if (parsed.values.help) {
    io.stdout(`${USAGE}\n`)
    return EXIT_OK
  }
  if (parsed.values.example) {
    const sb = parsed.values.storybook ?? 'http://127.0.0.1:6100'
    const build = parsed.values.sections ? sectionedExampleManifest : exampleManifest
    io.stdout(`${JSON.stringify(build(sb), null, 2)}\n`)
    return EXIT_OK
  }
  if (parsed.positionals[0] === 'build') {
    if (parsed.positionals.length !== 2) throw new ReviewError(`expected one draft\n\n${USAGE}`)
    return buildRound(resolve(parsed.positionals[1]), parsed.values.storybook, io)
  }
  if (parsed.positionals[0] === 'calibration') {
    const rounds = await readFeedbackFiles(parsed.positionals.slice(1).map((p) => resolve(p)))
    io.stdout(`${calibrationReport(rounds)}\n`)
    return EXIT_OK
  }
  if (parsed.positionals.length !== 1) throw new ReviewError(`expected one manifest\n\n${USAGE}`)
  return review(parsed, io)
}

export async function runCli(argv: string[], io: CliIo): Promise<number> {
  try {
    return await dispatch(parseCli(argv), io)
  } catch (err) {
    if (!isUsageError(err)) throw err
    io.stderr(`titan-review: ${err.message}`)
    return EXIT_INVALID
  }
}

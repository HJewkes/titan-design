import { writeFile } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import {
  ROUND_FILE,
  buildRound,
  contrastProblem,
  overrideRecord,
  recordOverride,
  type BuildIo,
} from './build.ts'
import { calibrationReport, readFeedbackFiles } from './calibration.ts'
import { sectionedExampleManifest } from './example.ts'
import { buildMorningDraft } from './morning.ts'
import { harnessVerdict, serveMainCommand, type HarnessFreshness } from './harness-freshness.ts'
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
titan-review round from-morning <items.json> [--decider <file>] [--out <draft.json>]

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

round from-morning builds a draft round from seat Morning items (titan-review/morning-items@1)
with no agent in the loop: one section per item grouped by seat, every option with its
proposal text labelled Proposed, and the decider's recommendations from a separate file. It
writes draft.json beside the items file (or --out); run build on it next.

  --storybook <url>  Storybook base url (default: the manifest's storybookUrl)
  --decider <file>   Decider recommendations for round from-morning (questionId, answer, cite)
  --out <dir>        Where feedback.json and PNGs go (default: the manifest's directory)
  --port <n>         Review page port (default: a free one)
  --no-open          Print the page url instead of opening the browser
  --no-capture       Skip the post-submit PNGs
  --contrast-override <reason>
                     Serve a round with no passing contrast.json; the page shows the reason
  --allow-stale      Serve even when this harness differs from origin/main's; the page says so
  --example          Print a sample manifest built from Lab/Decisions stories
  --help             Print this help`

const DRAFT_FILE = 'draft.json'

export interface CliIo extends Omit<ReviewDeps, 'onReady'>, Pick<BuildIo, 'measure'> {
  stdout: (text: string) => void
  stderr: (text: string) => void
  openBrowser: (url: string) => void
  capture: (round: LoadedRound, outDir: string) => Promise<string[]>
  harnessFreshness: () => Promise<HarnessFreshness>
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
      'contrast-override': { type: 'string' },
      'allow-stale': { type: 'boolean' },
      decider: { type: 'string' },
      example: { type: 'boolean' },
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

/** The same serve, minus --allow-stale, with the Storybook and output pinned to this round's. */
function roundArgs(manifestPath: string, round: LoadedRound, parsed: Parsed): string[] {
  const { out, port, 'no-open': noOpen, 'no-capture': noCapture } = parsed.values
  const override = parsed.values['contrast-override']
  return [
    manifestPath,
    ...['--storybook', round.storybookUrl],
    ...(out ? ['--out', resolve(out)] : []),
    ...(port ? ['--port', port] : []),
    ...(noOpen ? ['--no-open'] : []),
    ...(noCapture ? ['--no-capture'] : []),
    ...(override !== undefined ? ['--contrast-override', override] : []),
  ]
}

/**
 * Refuses to serve from a harness whose tree differs from origin/main's, printing how to serve
 * main's; --allow-stale serves anyway with a banner. A failed fetch only warns.
 */
async function harnessGate(manifestPath: string, round: LoadedRound, parsed: Parsed, io: CliIo) {
  const command = serveMainCommand(roundArgs(manifestPath, round, parsed))
  const verdict = harnessVerdict(
    await io.harnessFreshness(),
    !!parsed.values['allow-stale'],
    command
  )
  if ('refusal' in verdict) throw new ReviewError(verdict.refusal)
  if (verdict.banner) io.stderr(`titan-review: ${verdict.banner}`)
  return verdict.banner
}

/**
 * Serving refuses a round the gate did not pass, unless an override gives its reason; the
 * override is then written into round.json. A round that passed is served as it is, and an
 * override given for it is ignored, so it shows no banner. The harness gate runs first, so a
 * refusal there never rewrites round.json.
 */
async function gatedRound(manifestPath: string, parsed: Parsed, io: CliIo): Promise<LoadedRound> {
  const round = await loadRound(manifestPath, parsed.values.storybook)
  await assertStoriesExist(round)
  const harnessWarning = await harnessGate(manifestPath, round, parsed, io)
  const problem = await contrastProblem(manifestPath, round.manifestSha256)
  const reason = parsed.values['contrast-override']?.trim()
  if (parsed.values['contrast-override'] !== undefined && !reason)
    throw new ReviewError('--contrast-override needs a reason the owner can read')
  if (!problem) return { ...round, harnessWarning }
  if (!reason)
    throw new ReviewError(
      `${problem}. Run titan-review build <draft.json>, or pass --contrast-override "<reason>"`
    )
  io.stderr(`titan-review: contrast not gated (${problem}); serving with override: ${reason}`)
  const override = await overrideRecord(manifestPath, problem, reason)
  return {
    ...(await recordOverride(manifestPath, override, parsed.values.storybook)),
    harnessWarning,
  }
}

async function review(parsed: Parsed, io: CliIo): Promise<number> {
  const manifestPath = resolve(parsed.positionals[0])
  const round = await gatedRound(manifestPath, parsed, io)
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

/** Writes the draft beside the items file unless --out says where; never over round.json. */
async function fromMorning(parsed: Parsed, io: CliIo): Promise<number> {
  const [, kind, itemsArg] = parsed.positionals
  if (kind !== 'from-morning' || itemsArg === undefined || parsed.positionals.length !== 3)
    throw new ReviewError(`expected: round from-morning <items.json>\n\n${USAGE}`)
  const itemsPath = resolve(itemsArg)
  const draftPath = resolve(parsed.values.out ?? join(dirname(itemsPath), DRAFT_FILE))
  if (basename(draftPath) === ROUND_FILE)
    throw new ReviewError(`the draft must not be ${ROUND_FILE}; build writes that file`)
  const draft = await buildMorningDraft(itemsPath, parsed.values.decider, draftPath)
  await writeFile(draftPath, `${JSON.stringify(draft, null, 2)}\n`)
  io.stderr(`wrote ${draftPath}; next: titan-review build ${draftPath}`)
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
    io.stdout(`${JSON.stringify(sectionedExampleManifest(sb), null, 2)}\n`)
    return EXIT_OK
  }
  if (parsed.positionals[0] === 'build') {
    if (parsed.positionals.length !== 2) throw new ReviewError(`expected one draft\n\n${USAGE}`)
    return buildRound(resolve(parsed.positionals[1]), parsed.values.storybook, io)
  }
  if (parsed.positionals[0] === 'round') return fromMorning(parsed, io)
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

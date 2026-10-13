import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import http from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Duplex } from 'node:stream'
import { FeedbackSchema, type Feedback, type Manifest } from '@titan-design/review-schema'
import { feedbackProblems, normalizeFeedback } from './round.ts'
import { proxyRequest, proxyUpgrade } from './proxy.ts'

export const PAGE_BASE = '/__review/'
const API = `${PAGE_BASE}api/`
const MAX_BODY_BYTES = 5_000_000

class BodyTooLarge extends Error {
  constructor() {
    super(`the submission is larger than ${MAX_BODY_BYTES} bytes`)
  }
}

export type PageHandler = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: () => void
) => void

export interface ReviewServerOptions {
  manifest: Manifest
  manifestSha256: string
  storybookUrl: string
  page: PageHandler
  port?: number
  /** Absolute PNG path by variant key (a base render by `<key>.base`); served at `api/image/<key>`, never by path. Keys need no decoding. */
  images?: Record<string, string>
  /** Absolute mp4 or webm path by variant key; served at `api/clip/<key>` with byte ranges. */
  clips?: Record<string, string>
  harnessWarning?: string
}

export interface ReviewServer {
  url: string
  submitted: Promise<Feedback>
  close: () => Promise<void>
}

type Accept = (feedback: Feedback) => void

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' })
  res.end(JSON.stringify(body))
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += (chunk as Buffer).length
    if (size > MAX_BODY_BYTES) throw new BodyTooLarge()
    chunks.push(chunk as Buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

function submissionError(opts: ReviewServerOptions, body: unknown): [number, string[]] | Feedback {
  const parsed = FeedbackSchema.safeParse(body)
  if (!parsed.success)
    return [400, parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)]
  if (parsed.data.manifestSha256 !== opts.manifestSha256)
    return [409, ['the manifest changed since this page loaded; reload the page']]
  const problems = feedbackProblems(parsed.data, opts.manifest)
  return problems.length ? [422, problems] : normalizeFeedback(parsed.data, opts.manifest)
}

function createSubmitHandler(opts: ReviewServerOptions, accept: Accept) {
  let done = false
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (done) return sendJson(res, 409, { errors: ['this round was already submitted'] })
    const body = await readJson(req).catch((err: unknown) => err)
    if (body instanceof BodyTooLarge) return sendJson(res, 413, { errors: [body.message] })
    if (body instanceof Error) return sendJson(res, 400, { errors: ['body is not JSON'] })
    if (body === undefined) return sendJson(res, 400, { errors: ['body is not JSON'] })
    const result = submissionError(opts, body)
    if (Array.isArray(result)) return sendJson(res, result[0], { errors: result[1] })
    done = true
    sendJson(res, 200, { ok: true })
    const { contrastOverride: _posted, ...unoverridden } = result
    const { contrastOverride } = opts.manifest
    accept(contrastOverride ? { ...unoverridden, contrastOverride } : unoverridden)
  }
}

function sendImage(opts: ReviewServerOptions, key: string, res: http.ServerResponse): void {
  const file = Object.hasOwn(opts.images ?? {}, key) ? opts.images?.[key] : undefined
  if (!file) return sendJson(res, 404, { errors: [`no image variant ${key}`] })
  createReadStream(file)
    .once('open', () =>
      res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'no-store' })
    )
    .once('error', () => (res.headersSent ? res.destroy() : sendJson(res, 404, {})))
    .pipe(res)
}

/** The byte range a `Range: bytes=a-b` header asks of a file of `size`, or null for the whole file. */
export function byteRange(header: string | undefined, size: number): [number, number] | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '')
  if (!match || (match[1] === '' && match[2] === '')) return null
  const [start, end] =
    match[1] === ''
      ? [Math.max(0, size - Number(match[2])), size - 1]
      : [Number(match[1]), match[2] === '' ? size - 1 : Math.min(Number(match[2]), size - 1)]
  return start <= end && start < size ? [start, end] : null
}

const CLIP_TYPES: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm' }

/** A clip, by variant key, in byte ranges: a video element seeks and loops by them. */
async function sendClip(
  opts: ReviewServerOptions,
  key: string,
  req: http.IncomingMessage,
  res: http.ServerResponse
) {
  const file = Object.hasOwn(opts.clips ?? {}, key) ? opts.clips?.[key] : undefined
  const size = file
    ? await stat(file).then(
        (s) => s.size,
        () => null
      )
    : null
  if (!file || size === null) return sendJson(res, 404, { errors: [`no clip variant ${key}`] })
  const type = CLIP_TYPES[file.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream'
  const range = byteRange(req.headers.range, size)
  const [start, end] = range ?? [0, size - 1]
  res.writeHead(range ? 206 : 200, {
    'content-type': type,
    'content-length': end - start + 1,
    'accept-ranges': 'bytes',
    'cache-control': 'no-store',
    ...(range && { 'content-range': `bytes ${start}-${end}/${size}` }),
  })
  createReadStream(file, { start, end })
    .once('error', () => res.destroy())
    .pipe(res)
}

function createRouter(opts: ReviewServerOptions, accept: Accept): http.RequestListener {
  const upstream = new URL(opts.storybookUrl)
  const submit = createSubmitHandler(opts, accept)
  return (req, res) => {
    const path = (req.url ?? '/').split('?')[0]
    if (path === '/') {
      res.writeHead(302, { location: PAGE_BASE })
      return res.end()
    }
    if (path === `${API}round` && req.method === 'GET')
      return sendJson(res, 200, {
        manifest: opts.manifest,
        manifestSha256: opts.manifestSha256,
        harnessWarning: opts.harnessWarning,
      })
    if (path === `${API}submit` && req.method === 'POST') return void submit(req, res)
    if (path.startsWith(`${API}image/`) && req.method === 'GET')
      return sendImage(opts, path.slice(`${API}image/`.length), res)
    if (path.startsWith(`${API}clip/`) && req.method === 'GET')
      return void sendClip(opts, path.slice(`${API}clip/`.length), req, res)
    if (path.startsWith(API)) return sendJson(res, 404, { errors: ['unknown endpoint'] })
    if (path.startsWith(PAGE_BASE)) return opts.page(req, res, () => sendJson(res, 404, {}))
    proxyRequest(upstream, req, res)
  }
}

/** Serves the review page and proxies Storybook on one 127.0.0.1 origin. */
export async function startReviewServer(opts: ReviewServerOptions): Promise<ReviewServer> {
  let accept: Accept = () => {}
  const submitted = new Promise<Feedback>((resolve) => (accept = resolve))
  const server = http.createServer(createRouter(opts, (f) => accept(f)))
  const upstream = new URL(opts.storybookUrl)
  const tunnels = new Set<Duplex>()
  server.on('upgrade', (req, socket, head) => {
    if ((req.url ?? '').startsWith(PAGE_BASE)) return socket.destroy()
    tunnels.add(socket)
    socket.on('close', () => tunnels.delete(socket))
    proxyUpgrade(upstream, req, socket, head)
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(opts.port ?? 0, '127.0.0.1', resolve)
  })
  const { port } = server.address() as AddressInfo
  const close = () =>
    new Promise<void>((resolve) => {
      server.closeAllConnections()
      tunnels.forEach((socket) => socket.destroy())
      server.close(() => resolve())
    })
  return { url: `http://127.0.0.1:${port}${PAGE_BASE}`, submitted, close }
}

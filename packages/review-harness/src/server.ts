import http from 'node:http'
import type { AddressInfo } from 'node:net'
import type { Duplex } from 'node:stream'
import { FeedbackSchema, type Feedback, type Manifest } from './schema.ts'
import { feedbackProblems } from './round.ts'
import { proxyRequest, proxyUpgrade } from './proxy.ts'

export const PAGE_BASE = '/__review/'
const API = `${PAGE_BASE}api/`
const MAX_BODY_BYTES = 5_000_000

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
    if (size > MAX_BODY_BYTES) throw new Error('body too large')
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
  return problems.length ? [422, problems] : parsed.data
}

function createSubmitHandler(opts: ReviewServerOptions, accept: Accept) {
  let done = false
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (done) return sendJson(res, 409, { errors: ['this round was already submitted'] })
    const body = await readJson(req).catch(() => undefined)
    if (body === undefined) return sendJson(res, 400, { errors: ['body is not JSON'] })
    const result = submissionError(opts, body)
    if (Array.isArray(result)) return sendJson(res, result[0], { errors: result[1] })
    done = true
    sendJson(res, 200, { ok: true })
    accept(result)
  }
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
      return sendJson(res, 200, { manifest: opts.manifest, manifestSha256: opts.manifestSha256 })
    if (path === `${API}submit` && req.method === 'POST') return void submit(req, res)
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

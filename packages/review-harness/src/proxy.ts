import http from 'node:http'
import net from 'node:net'
import type { Duplex } from 'node:stream'

/** Forwards a request to Storybook so its iframes are same-origin with the review page. */
export function proxyRequest(
  upstream: URL,
  req: http.IncomingMessage,
  res: http.ServerResponse
): void {
  const outgoing = http.request(
    {
      host: upstream.hostname,
      port: upstream.port || 80,
      method: req.method,
      path: req.url,
      headers: { ...req.headers, host: upstream.host },
    },
    (upstreamRes) => {
      res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers)
      upstreamRes.pipe(res)
    }
  )
  outgoing.on('error', (err) => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'text/plain' })
    res.end(`Storybook at ${upstream.origin} is unreachable: ${err.message}`)
  })
  req.pipe(outgoing)
}

function rawHead(req: http.IncomingMessage, host: string): string {
  const lines = [`${req.method} ${req.url} HTTP/${req.httpVersion}`]
  for (let i = 0; i < req.rawHeaders.length; i += 2) {
    const name = req.rawHeaders[i]
    lines.push(`${name}: ${name.toLowerCase() === 'host' ? host : req.rawHeaders[i + 1]}`)
  }
  return `${lines.join('\r\n')}\r\n\r\n`
}

/** Tunnels a websocket upgrade (Storybook's channel and its Vite HMR) to Storybook. */
export function proxyUpgrade(
  upstream: URL,
  req: http.IncomingMessage,
  socket: Duplex,
  head: Buffer
): void {
  const tunnel = net.connect(Number(upstream.port || 80), upstream.hostname, () => {
    tunnel.write(rawHead(req, upstream.host))
    if (head.length) tunnel.write(head)
    tunnel.pipe(socket).pipe(tunnel)
  })
  const destroy = () => {
    tunnel.destroy()
    socket.destroy()
  }
  tunnel.on('error', destroy)
  socket.on('error', destroy)
}

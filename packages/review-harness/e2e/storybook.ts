import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const UI_DIR = fileURLToPath(new URL('../../ui/', import.meta.url))

export interface RunningStorybook {
  url: string
  stop: () => void
}

/** Reuses TITAN_REVIEW_STORYBOOK if set, else launches an isolated one through titan's launcher. */
export async function isolatedStorybook(): Promise<RunningStorybook> {
  const given = process.env.TITAN_REVIEW_STORYBOOK
  if (given) return { url: given.replace(/\/$/, ''), stop: () => {} }
  const child = spawn('node', ['scripts/storybook-launch.mjs', '--isolated', '--no-open'], {
    cwd: UI_DIR,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const port = await launchedPort(child)
  const url = `http://127.0.0.1:${port}`
  await waitForIndex(url)
  return { url, stop: () => process.kill(-(child.pid as number), 'SIGTERM') }
}

function launchedPort(child: ChildProcess): Promise<string> {
  return new Promise((resolve, reject) => {
    let log = ''
    const onData = (chunk: Buffer) => {
      log += chunk.toString()
      const port = log.match(/Starting Storybook on (\d+)/)?.[1]
      if (port) resolve(port)
    }
    child.stdout?.on('data', onData)
    child.stderr?.on('data', onData)
    child.once('exit', (code) => reject(new Error(`storybook launcher exited ${code}:\n${log}`)))
  })
}

async function waitForIndex(url: string): Promise<void> {
  for (let i = 0; i < 120; i++) {
    const res = await fetch(`${url}/index.json`).catch(() => null)
    if (res?.ok) return
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(`Storybook at ${url} never served index.json`)
}

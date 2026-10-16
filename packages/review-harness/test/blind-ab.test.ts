import type http from 'node:http'
import { mkdir, mkdtemp, readFile, realpath, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BLIND_CHOICES,
  blindAbKey,
  engineOf,
  type BlindAbQuestion,
  type Feedback,
  type Manifest,
} from '@titan-design/review-schema'
import { App, Sent } from '../page/App.tsx'
import { playBackToBack } from '../page/audio.ts'
import { loadDraft, saveDraft } from '../page/draftStore.ts'
import { ReviewScreen } from '../page/ReviewScreen.tsx'
import { createReducer, initialState } from '../page/state.ts'
import { blindReveal, type BlindReveal } from '../src/blind-ab.ts'
import { buildFeedback, emptyDraft, type ReviewDraft } from '../src/feedback.ts'
import { feedbackProblems } from '../src/round.ts'
import { ReviewError, isAudioHead, loadRound, type LoadedRound } from '../src/review.ts'
import { startReviewServer, type ReviewServer } from '../src/server.ts'

const FIXTURE = join(import.meta.dirname, 'fixtures', 'blind-ab', 'round.json')

/** A mono 16-bit PCM wav of a sine tone: generated, so no recording ships with the repo. */
function toneWav(hz: number, ms = 400, rate = 8000): Buffer {
  const samples = Math.round((rate * ms) / 1000)
  const data = Buffer.alloc(samples * 2)
  for (let i = 0; i < samples; i++)
    data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * hz * i) / rate) * 8000), i * 2)
  const head = Buffer.alloc(44)
  head.write('RIFF', 0)
  head.writeUInt32LE(36 + data.length, 4)
  head.write('WAVEfmt ', 8)
  head.writeUInt32LE(16, 16)
  head.writeUInt16LE(1, 20)
  head.writeUInt16LE(1, 22)
  head.writeUInt32LE(rate, 24)
  head.writeUInt32LE(rate * 2, 28)
  head.writeUInt16LE(2, 32)
  head.writeUInt16LE(16, 34)
  head.write('data', 36)
  head.writeUInt32LE(data.length, 40)
  return Buffer.concat([head, data])
}

// Each file its own pitch, so a served take is identified by its bytes.
const TONES: Record<string, number> = {
  'ref.wav': 330,
  'p1-x.wav': 440,
  'p1-y.wav': 494,
  'p2-x.wav': 523,
  'p2-y.wav': 587,
}

const ENGINES = ['engine-x', 'engine-y']

async function fixtureDir(overrides: Record<string, Buffer> = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'titan-review-blind-'))
  await mkdir(join(dir, 'audio'))
  for (const [name, hz] of Object.entries(TONES))
    await writeFile(join(dir, 'audio', name), overrides[name] ?? toneWav(hz))
  const path = join(dir, 'round.json')
  await writeFile(path, await readFile(FIXTURE))
  return { dir, path }
}

const blindOf = (m: Manifest) => m.questions.find((q) => q.kind === 'blind-ab') as BlindAbQuestion
const page = (_req: http.IncomingMessage, res: http.ServerResponse) => res.end('page')

describe('the fixture round', () => {
  // Catches: a pair served at the author's take order instead of the seeded one.
  it('resolves each take by its played position', async () => {
    const { dir, path } = await fixtureDir()
    const round = await loadRound(path)
    const key = blindAbKey(round.manifest, blindOf(round.manifest))
    const audioDir = join(await realpath(dir), 'audio')
    expect(round.audio).toEqual({
      ref: join(audioDir, 'ref.wav'),
      ...Object.fromEntries(
        key.flatMap((p) =>
          BLIND_CHOICES.map((c) => [`tts/${p.pair}/${c}`, join(audioDir, '..', p[c].src)])
        )
      ),
    })
    expect(round.audio['tts/p1/A']).not.toBe(round.audio['tts/p1/B'])
  })

  // Catches: a balanced order that swaps no pair, so position would give the engine away.
  it('plays one pair in the authored order and the other swapped', async () => {
    const round = await loadRound((await fixtureDir()).path)
    const lead = blindAbKey(round.manifest, blindOf(round.manifest)).map((p) => p.A.engine)
    expect([...lead].sort()).toEqual(ENGINES)
  })

  // Catches: a take accepted without the audio sniff.
  it('refuses a take that is not audio', async () => {
    const { path } = await fixtureDir({ 'p2-y.wav': Buffer.from('not a recording') })
    await expect(loadRound(path)).rejects.toThrow(
      new ReviewError(
        'question tts: pair p2 take audio/p2-y.wav is not a wav, mp3, ogg or m4a file'
      )
    )
  })

  // Catches: an audio variant whose file is never checked.
  it('refuses an audio variant whose file is missing', async () => {
    const { dir, path } = await fixtureDir()
    await writeFile(path, (await readFile(path, 'utf8')).replace('audio/ref.wav', 'audio/gone.wav'))
    await expect(loadRound(path)).rejects.toThrow(
      `variant ref: audio audio/gone.wav does not exist (paths resolve against ${await realpath(dir)})`
    )
  })
})

describe('the audio sniff', () => {
  // Catches: a sniff that drops one of the four formats the schema allows.
  it.each([
    ['wav', toneWav(440)],
    ['mp3 with a tag', Buffer.from('ID3\x04\x00\x00\x00\x00\x00\x00')],
    ['mp3 frame', Buffer.from([0xff, 0xfb, 0x90, 0x00])],
    ['ogg', Buffer.from('OggS\x00\x02')],
    ['m4a', Buffer.concat([Buffer.from([0, 0, 0, 0x20]), Buffer.from('ftypM4A ')])],
  ])('knows %s', (_name, head) => {
    expect(isAudioHead(head.subarray(0, 12))).toBe(true)
  })

  // Catches: a RIFF of another kind (an AVI) taken for a wav.
  it('refuses a RIFF that is not WAVE', () => {
    expect(isAudioHead(Buffer.from('RIFF\x00\x00\x00\x00AVI '))).toBe(false)
  })
})

describe('serving the fixture round', () => {
  let round: LoadedRound
  let server: ReviewServer
  beforeEach(async () => {
    round = await loadRound((await fixtureDir()).path)
    server = await startReviewServer({ ...round, page })
  })
  afterEach(() => server.close())

  const pageRound = async () => (await fetch(`${server.url}api/round`)).text()

  // Catches: the raw round sent to the page, which carries the key.
  it('sends the page no engine, no take path and no seed', async () => {
    const text = await pageRound()
    for (const secret of [...ENGINES, 'p1-x.wav', 'p1-y.wav', 'p2-x.wav', 'p2-y.wav', 'seed'])
      expect(text).not.toContain(secret)
    expect(JSON.parse(text).manifest.questions[0].pairs[0].takes).toEqual([
      { engine: 'A', src: '', durationMs: 400 },
      { engine: 'B', src: '', durationMs: 400 },
    ])
  })

  // Catches: a page that renders from the key, or a take URL that names its file or engine.
  it('renders players, transcripts and A/B picks without the key', async () => {
    const { manifest, manifestSha256 } = JSON.parse(await pageRound())
    const markup = renderToStaticMarkup(createElement(App, { manifest, manifestSha256 }))
    for (const secret of [...ENGINES, 'p1-x.wav', 'p2-y.wav']) expect(markup).not.toContain(secret)
    expect(markup).toContain('src="api/audio/tts/p1/A"')
    expect(markup).toContain('src="api/audio/tts/p2/B"')
    expect(markup).toContain('Seven boats left the harbour before noon.')
    expect(markup.match(/Play A then B/g)).toHaveLength(2)
    expect(markup).toContain('aria-label="Pair 1: which take?"')
  })

  // Catches: a player without scrub (no controls) or without a loop toggle; an audio variant drawn per width.
  it('gives every sound a scrubbable player with a loop toggle', async () => {
    const { manifest, manifestSha256 } = JSON.parse(await pageRound())
    const markup = renderToStaticMarkup(createElement(App, { manifest, manifestSha256 }))
    expect(markup.match(/<audio [^>]*controls=""/g)).toHaveLength(5)
    expect(markup.match(/type="checkbox"[^>]*\/> Loop/g)).toHaveLength(5)
    expect(markup.match(/data-testid="audio-ref"/g)).toHaveLength(1)
    expect(markup).toContain('The kettle is on and the window is open.')
  })

  // Catches: a take served from the wrong file, or without the ranges a scrub needs.
  it('serves each take at its position, as wav, in byte ranges', async () => {
    const res = await fetch(`${server.url}api/audio/tts/p1/A`)
    expect([res.status, res.headers.get('content-type'), res.headers.get('accept-ranges')]).toEqual(
      [200, 'audio/wav', 'bytes']
    )
    const bytes = Buffer.from(await res.arrayBuffer())
    expect(bytes.equals(await readFile(round.audio['tts/p1/A']))).toBe(true)
    const part = await fetch(`${server.url}api/audio/tts/p1/A`, { headers: { range: 'bytes=0-3' } })
    expect([part.status, Buffer.from(await part.arrayBuffer()).toString()]).toEqual([206, 'RIFF'])
  })

  // Catches: a take route that answers for a pair or position the round does not have.
  it.each(['tts/p9/A', 'tts/p1/C', 'tts', 'toString'])('answers 404 for %s', async (key) => {
    expect((await fetch(`${server.url}api/audio/${key}`)).status).toBe(404)
  })

  const send = (body: unknown) =>
    fetch(`${server.url}api/submit`, { method: 'POST', body: JSON.stringify(body) })

  function answered(): Feedback {
    const draft: ReviewDraft = emptyDraft(round.manifest)
    draft.answers.tts = { comment: '', blind: { p1: 'A', p2: 'B' } }
    return buildFeedback(round.manifest, round.manifestSha256, draft, new Date('2026-10-14T00:00Z'))
  }

  // Catches: stored feedback without engines, or engines read off the wrong position.
  it('records each pick and maps it back to its engine through the key', async () => {
    const res = await send(answered())
    expect(res.status).toBe(200)
    const stored = await server.submitted
    const key = blindAbKey(round.manifest, blindOf(round.manifest))
    expect(stored.answers).toEqual([
      {
        questionId: 'tts',
        pairs: [
          { pair: 'p1', choice: 'A', engine: engineOf(key, 'p1', 'A') },
          { pair: 'p2', choice: 'B', engine: engineOf(key, 'p2', 'B') },
        ],
      },
    ])
    expect(stored.answers[0].pairs?.map((p) => p.engine).every((e) => ENGINES.includes(e!))).toBe(
      true
    )
  })

  // Catches: a reveal missing from the submit reply, or a tally off by the key.
  it('reveals the key and the tally in the reply to the submit', async () => {
    const { reveal } = (await (await send(answered())).json()) as { reveal: BlindReveal[] }
    const key = blindAbKey(round.manifest, blindOf(round.manifest))
    expect(reveal).toEqual([
      {
        questionId: 'tts',
        pairs: key.map((p, i) => ({
          pair: p.pair,
          A: p.A.engine,
          B: p.B.engine,
          choice: i === 0 ? 'A' : 'B',
        })),
        // The balanced order swaps one of the two pairs, so p1's A and p2's B are one engine.
        tally: { [key[0].A.engine]: 2, [key[0].B.engine]: 0 },
      },
    ])
  })

  // Catches: a server that trusts an engine the page claims for a pick.
  it('refuses an answer that names an engine', async () => {
    const forged = answered()
    forged.answers[0].pairs![0].engine = 'engine-x'
    const res = await send(forged)
    expect([res.status, (await res.json()).errors]).toEqual([
      422,
      ['tts: engines are revealed by the server, never sent'],
    ])
  })
})

describe('answering the pairs', () => {
  const m = () => JSON.parse(JSON.stringify(blindRound)) as Manifest
  let blindRound: Manifest
  beforeEach(async () => {
    blindRound = (await loadRound((await fixtureDir()).path)).manifest
  })

  // Catches: one picked pair counting as an answered question.
  it('counts the question answered only once every pair is picked', () => {
    const draft = emptyDraft(m())
    draft.answers.tts = { comment: '', blind: { p1: 'B' } }
    const partial = buildFeedback(m(), 'x'.repeat(64), draft, new Date())
    expect(partial.answers).toEqual([{ questionId: 'tts', pairs: [{ pair: 'p1', choice: 'B' }] }])
    expect(feedbackProblems(partial, m())).toEqual(['tts: required'])
  })

  // Catches: a pick that does not toggle off, or that clears the other pairs.
  it('picks, re-picks and clears a pair from the page', () => {
    const reduce = createReducer(m())
    const pick = (s: ReturnType<typeof initialState>, pair: string, choice: 'A' | 'B') =>
      reduce(s, { type: 'blindPick', id: 'tts', pair, choice })
    const picked = pick(pick(initialState(m()), 'p1', 'A'), 'p2', 'B')
    expect(picked.draft.answers.tts.blind).toEqual({ p1: 'A', p2: 'B' })
    expect(pick(picked, 'p1', 'B').draft.answers.tts.blind).toEqual({ p1: 'B', p2: 'B' })
    expect(pick(picked, 'p1', 'A').draft.answers.tts.blind).toEqual({ p2: 'B' })
  })

  // Catches: a draft schema that strips blind picks, losing them on reload.
  it('keeps the picks across a reload', () => {
    const items = new Map<string, string>()
    const storage = {
      getItem: (k: string) => items.get(k) ?? null,
      setItem: (k: string, v: string) => void items.set(k, v),
      removeItem: (k: string) => void items.delete(k),
    }
    const draft = emptyDraft(m())
    draft.answers.tts = { comment: '', blind: { p1: 'A' } }
    saveDraft(storage, 'sha', draft)
    expect(loadDraft(storage, m(), 'sha')?.answers.tts.blind).toEqual({ p1: 'A' })
  })

  // Catches: the final check printing nothing for a blind answer.
  it('lists each pick on the final check', () => {
    const draft = emptyDraft(m())
    draft.answers.tts = { comment: '', blind: { p1: 'A', p2: 'B' } }
    const feedback = buildFeedback(m(), 'x'.repeat(64), draft, new Date())
    const markup = renderToStaticMarkup(
      createElement(ReviewScreen, {
        manifest: m(),
        feedback,
        problems: [],
        sendErrors: [],
        unanswered: [],
        sending: false,
        dispatch: () => {},
        onSubmit: () => {},
      })
    )
    expect(markup).toContain('p1 A, p2 B')
  })

  // Catches: a sent screen that drops the reveal.
  it('shows the revealed engines and the tally once sent', () => {
    const feedback = {
      answers: [
        {
          questionId: 'tts',
          pairs: [
            { pair: 'p1', choice: 'A' as const },
            { pair: 'p2', choice: 'A' as const },
          ],
        },
      ],
    } as Feedback
    const reveal = blindReveal(m(), feedback)
    const markup = renderToStaticMarkup(createElement(Sent, { reveal }))
    expect(markup).toContain('data-testid="reveal-tts"')
    expect(markup).toContain('engine-x 1 · engine-y 1')
    expect(markup).toContain(`A: ${reveal[0].pairs[0].A}`)
  })
})

describe('playing a pair back to back', () => {
  function take() {
    const ended = new EventTarget()
    return {
      loop: true,
      currentTime: 3,
      play: vi.fn(async () => {}),
      pause: vi.fn(),
      addEventListener: ended.addEventListener.bind(ended),
      end: () => ended.dispatchEvent(new Event('ended')),
    }
  }

  // Catches: both takes started at once, or B never started after A ends.
  it('starts B only when A ends, both from the beginning', () => {
    const [a, b] = [take(), take()]
    playBackToBack(a, b)
    expect([a.play.mock.calls.length, b.play.mock.calls.length]).toEqual([1, 0])
    expect([a.currentTime, b.currentTime]).toEqual([0, 0])
    a.end()
    expect(b.play).toHaveBeenCalledTimes(1)
  })

  // Catches: A left looping (so it never ends), or its loop setting lost after its turn.
  it('stops A looping for its turn, then gives its loop back', () => {
    const [a, b] = [take(), take()]
    playBackToBack(a, b)
    expect(a.loop).toBe(false)
    a.end()
    expect(a.loop).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import type { ChatMessage } from '@titan-design/chat-protocol'

import { aggregateDelivery, buildThreadRows, messageBody, plainText } from './chatThread'
import { ATHLETE, COACH, COACH_THREAD, chatMessage, localIso } from './coach-thread-fixture'

function rowSummary(messages: ChatMessage[]) {
  return buildThreadRows(messages).map((row) => {
    if (row.kind === 'date') return row.showDay ? 'day' : 'time'
    return `${row.message.id}${row.startsGroup ? '^' : ''}`
  })
}

describe('buildThreadRows', () => {
  it('opens each calendar day with a day row and starts a run on every new day', () => {
    expect(rowSummary(COACH_THREAD)).toEqual([
      'day',
      'm1^',
      'm2^',
      'm3^',
      'day',
      'm4^',
      'm5',
      'm6^',
    ])
  })

  it('splits a run when the same author pauses longer than five minutes', () => {
    const messages = [
      chatMessage('a', COACH, localIso(0, 8, 0), []),
      chatMessage('b', COACH, localIso(0, 8, 5), []),
      chatMessage('c', COACH, localIso(0, 8, 11), []),
    ]
    expect(rowSummary(messages)).toEqual(['day', 'a^', 'b', 'c^'])
  })

  it('opens a time row, without a day, after a pause of more than an hour in one day', () => {
    const messages = [
      chatMessage('a', COACH, localIso(0, 8, 0), []),
      chatMessage('b', COACH, localIso(0, 9, 30), []),
    ]
    expect(rowSummary(messages)).toEqual(['day', 'a^', 'time', 'b^'])
  })

  it('keeps a pause of exactly an hour inside the thread without a time row', () => {
    const messages = [
      chatMessage('a', ATHLETE, localIso(0, 8, 0), []),
      chatMessage('b', COACH, localIso(0, 9, 0), []),
    ]
    expect(rowSummary(messages)).toEqual(['day', 'a^', 'b^'])
  })

  it('returns no rows for an empty thread', () => {
    expect(buildThreadRows([])).toEqual([])
  })
})

describe('aggregateDelivery', () => {
  const at = localIso(0, 8, 0)

  it('reports the least-advanced recipient', () => {
    const message = chatMessage(
      'a',
      ATHLETE,
      at,
      [],
      [
        { participantId: 'coach', status: 'read', at },
        { participantId: 'observer', status: 'accepted', at },
      ]
    )
    expect(aggregateDelivery(message)).toBe('accepted')
  })

  it('surfaces an undeliverable recipient over a read one', () => {
    const message = chatMessage(
      'a',
      ATHLETE,
      at,
      [],
      [
        { participantId: 'coach', status: 'read', at },
        { participantId: 'observer', status: 'undeliverable', at },
      ]
    )
    expect(aggregateDelivery(message)).toBe('undeliverable')
  })

  it('treats absent delivery as untracked, not delivered', () => {
    expect(aggregateDelivery(chatMessage('a', ATHLETE, at, []))).toBeUndefined()
    expect(aggregateDelivery(chatMessage('b', ATHLETE, at, [], []))).toBeUndefined()
  })
})

describe('messageBody', () => {
  it('joins text parts and skips every other part type', () => {
    const message = chatMessage('a', COACH, localIso(0, 8, 0), [
      { type: 'text', text: 'First' },
      { type: 'reasoning', text: 'hidden thinking' },
      { type: 'data-checkin', data: {} },
      { type: 'text', text: 'Second' },
    ])
    expect(messageBody(message)).toBe('First\n\nSecond')
  })
})

describe('plainText', () => {
  it('drops the bold markers the bubble renders', () => {
    expect(plainText('moved at **0.52 m/s**, on target')).toBe('moved at 0.52 m/s, on target')
  })

  it('unwraps inline code', () => {
    expect(plainText('run `pnpm test` first')).toBe('run pnpm test first')
  })

  it('drops heading and bullet markers and joins lines', () => {
    const body = '## Plan\n\n- Bench 3x5\n* Rows\nthen rest'
    expect(plainText(body)).toBe('Plan Bench 3x5 Rows then rest')
  })

  it('keeps single asterisks the bubble shows literally', () => {
    expect(plainText('2*3*4')).toBe('2*3*4')
  })

  it('keeps a quote marker the bubble shows literally', () => {
    expect(plainText('> 5 reps')).toBe('> 5 reps')
  })

  it('keeps numbered prefixes the bubble shows literally', () => {
    expect(plainText('1. Squat')).toBe('1. Squat')
    expect(plainText('2026. A good year')).toBe('2026. A good year')
  })

  it('keeps italics, underscores and links the bubble shows literally', () => {
    const body = 'a _light_ day, see top_set_velocity and [the plan](https://example.com)'
    expect(plainText(body)).toBe(body)
  })

  it('stays linear on unclosed markup', () => {
    const started = performance.now()
    plainText('[a('.repeat(80_000) + '**a'.repeat(80_000) + '`a'.repeat(80_000))
    expect(performance.now() - started).toBeLessThan(200)
  })
})

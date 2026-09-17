import { describe, it, expect } from 'vitest'
import type { ChatMessage } from '@titan-design/chat-protocol'

import { aggregateDelivery, buildThreadRows, messageBody } from './chatThread'
import { ATHLETE, COACH, COACH_THREAD, chatMessage, localIso } from './coach-thread-fixture'

function rowSummary(messages: ChatMessage[]) {
  return buildThreadRows(messages).map((row) =>
    row.kind === 'date' ? 'date' : `${row.message.id}${row.startsGroup ? '*' : ''}`
  )
}

describe('buildThreadRows', () => {
  it('opens each calendar day with a separator and starts a group on every new day', () => {
    expect(rowSummary(COACH_THREAD)).toEqual([
      'date',
      'm1*',
      'm2*',
      'm3*',
      'date',
      'm4*',
      'm5',
      'm6*',
    ])
  })

  it('starts a new group when the same author pauses longer than five minutes', () => {
    const messages = [
      chatMessage('a', COACH, localIso(0, 8, 0), []),
      chatMessage('b', COACH, localIso(0, 8, 5), []),
      chatMessage('c', COACH, localIso(0, 8, 11), []),
    ]
    expect(rowSummary(messages)).toEqual(['date', 'a*', 'b', 'c*'])
  })

  it('returns no rows for an empty thread', () => {
    expect(buildThreadRows([])).toEqual([])
  })
})

describe('aggregateDelivery', () => {
  const at = localIso(0, 8, 0)

  it('reports the least-advanced recipient', () => {
    const message = chatMessage('a', ATHLETE, at, [], [
      { participantId: 'coach', status: 'read', at },
      { participantId: 'observer', status: 'accepted', at },
    ])
    expect(aggregateDelivery(message)).toBe('accepted')
  })

  it('surfaces an undeliverable recipient over a read one', () => {
    const message = chatMessage('a', ATHLETE, at, [], [
      { participantId: 'coach', status: 'read', at },
      { participantId: 'observer', status: 'undeliverable', at },
    ])
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

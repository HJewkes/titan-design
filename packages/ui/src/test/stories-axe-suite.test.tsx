import { describe, it, expect } from 'vitest'
import { Text } from 'react-native'
import { violatedRules, type AxeRun } from './stories-axe-suite'

// Mirrors axe-core's single-run guard, which a timed-out real run trips for every later story.
function guardedFakeAxe(delayMs: number, seen: string[]): AxeRun {
  let running = false
  return async (element) => {
    if (running) throw new Error('Axe is already running. Use `await axe.run()`')
    running = true
    seen.push(element.textContent ?? '')
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    running = false
    return { violations: [] }
  }
}

const SlowStory = () => <Text>slow story</Text>
const NextStory = () => <Text>next story</Text>

describe('violatedRules', () => {
  it('starts the next story clean after an earlier run was abandoned mid-axe', async () => {
    const seen: string[] = []
    const fakeAxe = guardedFakeAxe(50, seen)

    const abandoned = violatedRules(SlowStory, fakeAxe)
    const next = await violatedRules(NextStory, fakeAxe)

    expect(next).toEqual([])
    expect(seen).toEqual(['slow story', 'next story'])
    await abandoned
  })

  it('unmounts the story when axe throws', async () => {
    const failingAxe: AxeRun = () => Promise.reject(new Error('axe crashed'))

    await expect(violatedRules(SlowStory, failingAxe)).rejects.toThrow('axe crashed')

    expect(document.body.textContent).toBe('')
  })
})

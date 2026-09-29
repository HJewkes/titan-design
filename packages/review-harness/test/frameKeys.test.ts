import { describe, expect, it } from 'vitest'
import { forwardedKey } from '../page/frameKeys.ts'

const press = (key: string, target: unknown, mods: { metaKey?: boolean } = {}) => ({
  key,
  code: key,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
  repeat: false,
  target,
  ...mods,
})

const storyBody = { tagName: 'BODY', isContentEditable: false }
const storyInput = { tagName: 'INPUT', isContentEditable: false }

describe('a key pressed inside a story frame', () => {
  it('reaches the page as Cmd+Enter when focus sits on the story', () => {
    expect(forwardedKey(press('Enter', storyBody, { metaKey: true }))).toMatchObject({
      key: 'Enter',
      metaKey: true,
      bubbles: true,
      cancelable: true,
    })
  })

  it('reaches the page as a pick digit when focus sits on the story', () => {
    expect(forwardedKey(press('1', storyBody))).toMatchObject({ key: '1' })
  })

  it('stays in the story while one of its own fields takes typing', () => {
    expect(forwardedKey(press('1', storyInput))).toBeNull()
    expect(forwardedKey(press('Enter', { tagName: 'DIV', isContentEditable: true }))).toBeNull()
  })

  it('still sends from a story field, because Cmd+Enter types nothing', () => {
    expect(forwardedKey(press('Enter', storyInput, { metaKey: true }))).not.toBeNull()
  })
})

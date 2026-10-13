import { useEffect, type RefObject } from 'react'

export type LiveArgs = Record<string, string | number | boolean>

interface Channel {
  emit: (event: string, payload: unknown) => void
  once?: (event: string, listener: () => void) => void
  on?: (event: string, listener: () => void) => void
  off?: (event: string, listener: () => void) => void
}

/** Storybook's preview event that sets args on a rendered story without a reload. */
export const UPDATE_STORY_ARGS = 'updateStoryArgs'
const STORY_RENDERED = 'storyRendered'

function channelOf(win: Window | null): Channel | undefined {
  try {
    return (win as { __STORYBOOK_ADDONS_CHANNEL__?: Channel } | null)?.__STORYBOOK_ADDONS_CHANNEL__
  } catch {
    return undefined
  }
}

/**
 * Sends args to the story in a same-origin Storybook iframe through its preview channel, so a
 * story re-renders in place. False when the window has no channel yet (still loading) or is
 * not readable; the next value, or the load handler, sends again.
 */
export function pushStoryArgs(win: Window | null, storyId: string, args: LiveArgs): boolean {
  const channel = channelOf(win)
  if (!channel) return false
  channel.emit(UPDATE_STORY_ARGS, { storyId, updatedArgs: args })
  return true
}

/** Calls `listener` after each render of the story in `win`; returns the unsubscribe. */
export function onStoryRendered(win: Window | null, listener: () => void): () => void {
  const channel = channelOf(win)
  channel?.on?.(STORY_RENDERED, listener)
  return () => channel?.off?.(STORY_RENDERED, listener)
}

/** Keeps a story iframe on `args` as they change; call `onLoad` from the iframe's load event. */
export function useLiveArgs(
  iframe: RefObject<HTMLIFrameElement | null>,
  storyId: string,
  args: LiveArgs | undefined
) {
  useEffect(() => {
    if (args) pushStoryArgs(iframe.current?.contentWindow ?? null, storyId, args)
  }, [iframe, storyId, args])
  return (loaded: HTMLIFrameElement) => {
    if (!args) return
    const win = loaded.contentWindow
    pushStoryArgs(win, storyId, args)
    // The window can load before the story first renders, which would drop the args just sent.
    channelOf(win)?.once?.(STORY_RENDERED, () => pushStoryArgs(win, storyId, args))
  }
}

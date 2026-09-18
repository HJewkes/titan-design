import { useEffect, useRef, type Dispatch } from 'react'
import type { Manifest } from '../src/schema.ts'
import { numberKeyAction, stopsFor, type Action, type ReviewState } from './state.ts'

function isTyping(target: EventTarget | null): boolean {
  return target instanceof HTMLTextAreaElement || target instanceof HTMLInputElement
}

interface KeyContext {
  manifest: Manifest
  state: ReviewState
  dispatch: Dispatch<Action>
  submit: () => void
}

function onFormKey(e: KeyboardEvent, { manifest, state, dispatch }: KeyContext): void {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    ;(document.activeElement as HTMLElement | null)?.blur()
    return dispatch({ type: 'advance' })
  }
  if (e.key === 'Escape' && state.annotate) return dispatch({ type: 'toggleAnnotate' })
  if (isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return
  if (e.key === 'a') return dispatch({ type: 'toggleAnnotate' })
  if (e.key === 'l') return dispatch({ type: 'toggleColumns' })
  if (/^[0-9]$/.test(e.key)) {
    const action = numberKeyAction(manifest, stopsFor(manifest)[state.active], e.key)
    if (action) dispatch(action)
  }
}

function onKey(e: KeyboardEvent, ctx: KeyContext): void {
  const { state, dispatch } = ctx
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    if (state.screen === 'review') return ctx.submit()
    if (state.screen === 'form') dispatch({ type: 'screen', screen: 'review' })
    return
  }
  if (state.screen === 'review' && e.key === 'Escape')
    return dispatch({ type: 'screen', screen: 'form' })
  if (state.screen === 'form') onFormKey(e, ctx)
}

/** Keyboard-first: digits pick, Tab reaches the comment, Enter advances, Cmd+Enter reviews and sends. */
export function useKeyboard(ctx: KeyContext): void {
  const latest = useRef(ctx)
  useEffect(() => {
    latest.current = ctx
  })
  useEffect(() => {
    const listener = (e: KeyboardEvent) => onKey(e, latest.current)
    window.addEventListener('keydown', listener)
    return () => window.removeEventListener('keydown', listener)
  }, [])
}

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, renderHook } from '@testing-library/react'
import { AudioPlayer, useAudioPlayer } from './AudioPlayer'

// Mock HTMLAudioElement
const mockPlay = vi.fn().mockResolvedValue(undefined)
const mockPause = vi.fn()
let audioEventListeners: Record<string, (() => void)[]> = {}

class MockAudio {
  src = ''
  preload = ''
  currentTime = 0
  duration = 120
  paused = true
  play = mockPlay
  pause = mockPause

  addEventListener(event: string, handler: () => void) {
    audioEventListeners[event] = audioEventListeners[event] ?? []
    audioEventListeners[event].push(handler)
  }

  removeEventListener(event: string, handler: () => void) {
    audioEventListeners[event] = (audioEventListeners[event] ?? []).filter(h => h !== handler)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).Audio = MockAudio

beforeEach(() => {
  audioEventListeners = {}
  mockPlay.mockClear()
  mockPause.mockClear()
})

describe('useAudioPlayer', () => {
  it('returns correct initial state', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ src: '/audio/test.mp3' })
    )

    expect(result.current.isPlaying).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.currentTime).toBe(0)
    expect(result.current.duration).toBe(0)
    expect(result.current.progress).toBe(0)
  })

  it('togglePlay calls play on the audio element', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ src: '/audio/test.mp3' })
    )

    result.current.togglePlay()
    expect(mockPlay).toHaveBeenCalled()
  })

  it('pause calls pause on the audio element', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ src: '/audio/test.mp3' })
    )

    result.current.pause()
    expect(mockPause).toHaveBeenCalled()
  })

  it('formatTime formats seconds to m:ss', () => {
    const { result } = renderHook(() =>
      useAudioPlayer({ src: '/audio/test.mp3' })
    )

    expect(result.current.formatTime(0)).toBe('0:00')
    expect(result.current.formatTime(65)).toBe('1:05')
    expect(result.current.formatTime(3661)).toBe('61:01')
    expect(result.current.formatTime(9)).toBe('0:09')
  })
})

describe('AudioPlayer', () => {
  it('renders play button', () => {
    render(<AudioPlayer src="/audio/test.mp3" />)

    const playButton = screen.getByRole('button', { name: 'Play' })
    expect(playButton).toBeInTheDocument()
  })

  it('renders title when provided', () => {
    render(<AudioPlayer src="/audio/test.mp3" title="Test Track" />)

    expect(screen.getByText('Test Track')).toBeInTheDocument()
  })

  it('does not render title when not provided', () => {
    render(<AudioPlayer src="/audio/test.mp3" />)

    expect(screen.queryByText('Test Track')).not.toBeInTheDocument()
  })

  it('renders seek bar in default variant', () => {
    render(<AudioPlayer src="/audio/test.mp3" />)

    expect(screen.getByRole('slider', { name: 'Seek' })).toBeInTheDocument()
  })

  it('does not render seek bar in compact variant', () => {
    render(<AudioPlayer src="/audio/test.mp3" variant="compact" />)

    expect(screen.queryByRole('slider', { name: 'Seek' })).not.toBeInTheDocument()
  })

  it('renders time display', () => {
    render(<AudioPlayer src="/audio/test.mp3" />)

    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument()
  })

  it('compact variant renders play button and time display', () => {
    render(<AudioPlayer src="/audio/test.mp3" variant="compact" title="Compact Track" />)

    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
    expect(screen.getByText('Compact Track')).toBeInTheDocument()
    expect(screen.getByText('0:00 / 0:00')).toBeInTheDocument()
  })
})

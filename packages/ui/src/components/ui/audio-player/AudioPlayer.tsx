import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react'
import { View, Text, Pressable, Platform, type ViewProps } from 'react-native'
import { cn } from '../../../utils/cn'
import { Spinner } from '../spinner/Spinner'

// ---------------------------------------------------------------------------
// useAudioPlayer hook (headless)
// ---------------------------------------------------------------------------

export interface UseAudioPlayerOptions {
  src: string
  autoPlay?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onError?: (error: string) => void
}

export interface UseAudioPlayerReturn {
  isPlaying: boolean
  isLoading: boolean
  error: string | null
  currentTime: number
  duration: number
  progress: number
  togglePlay: () => void
  play: () => void
  pause: () => void
  seek: (time: number) => void
  seekPercent: (percent: number) => void
  audioRef: React.RefObject<HTMLAudioElement | null>
  formatTime: (seconds: number) => string
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const noopReturn: UseAudioPlayerReturn = {
  isPlaying: false,
  isLoading: false,
  error: 'Audio not supported on this platform',
  currentTime: 0,
  duration: 0,
  progress: 0,
  togglePlay: () => {},
  play: () => {},
  pause: () => {},
  seek: () => {},
  seekPercent: () => {},
  audioRef: { current: null },
  formatTime,
}

export function useAudioPlayer(options: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const { src, autoPlay = false, onPlay, onPause, onEnded, onError } = options

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const isWeb = Platform.OS === 'web'

  useEffect(() => {
    if (!isWeb) return

    const audio = new Audio()
    audio.preload = 'metadata'
    audio.src = src
    audioRef.current = audio
    setIsLoading(true)

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
      onEnded?.()
    }
    const handleError = () => {
      const msg = 'Failed to load audio'
      setError(msg)
      setIsLoading(false)
      onError?.(msg)
    }
    const handlePlay = () => {
      setIsPlaying(true)
      onPlay?.()
    }
    const handlePause = () => {
      setIsPlaying(false)
      onPause?.()
    }
    const handleWaiting = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('waiting', handleWaiting)
    audio.addEventListener('canplay', handleCanPlay)

    if (autoPlay) {
      audio.play().catch(() => {})
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('waiting', handleWaiting)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.pause()
      audio.src = ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isWeb])

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {})
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
  }, [])

  const togglePlay = useCallback(() => {
    if (!audioRef.current) return
    if (audioRef.current.paused) {
      audioRef.current.play().catch(() => {})
    } else {
      audioRef.current.pause()
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  const seekPercent = useCallback((percent: number) => {
    if (!audioRef.current || !audioRef.current.duration) return
    const time = (percent / 100) * audioRef.current.duration
    audioRef.current.currentTime = time
    setCurrentTime(time)
  }, [])

  if (!isWeb) return noopReturn

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return {
    isPlaying,
    isLoading,
    error,
    currentTime,
    duration,
    progress,
    togglePlay,
    play,
    pause,
    seek,
    seekPercent,
    audioRef,
    formatTime,
  }
}

// ---------------------------------------------------------------------------
// AudioPlayer compound component
// ---------------------------------------------------------------------------

interface AudioPlayerContextValue extends UseAudioPlayerReturn {
  variant: 'default' | 'compact'
  title?: string
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null)

function useAudioPlayerContext(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext)
  if (!ctx) throw new Error('AudioPlayer sub-components must be used within <AudioPlayer>')
  return ctx
}

export interface AudioPlayerProps extends ViewProps {
  src: string
  title?: string
  autoPlay?: boolean
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onError?: (error: string) => void
  variant?: 'default' | 'compact'
  className?: string
  children?: React.ReactNode
}

function PlayButton({ className }: { className?: string }) {
  const { isPlaying, isLoading, togglePlay, variant } = useAudioPlayerContext()
  const size = variant === 'compact' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <Pressable
      onPress={togglePlay}
      accessibilityRole="button"
      accessibilityLabel={isPlaying ? 'Pause' : 'Play'}
      className={cn(
        'rounded-full bg-brand-primary items-center justify-center flex-shrink-0',
        size,
        className
      )}
    >
      {isLoading ? (
        <Spinner size="sm" color="white" />
      ) : (
        <Text className="text-white text-center" selectable={false}>
          {isPlaying ? '\u275A\u275A' : '\u25B6'}
        </Text>
      )}
    </Pressable>
  )
}

function SeekBar({ className }: { className?: string }) {
  const { progress, seekPercent } = useAudioPlayerContext()

  const handlePress = (e: { nativeEvent: { locationX: number } } & { currentTarget: { getBoundingClientRect?: () => DOMRect } }) => {
    if (Platform.OS === 'web') {
      const target = e.currentTarget as unknown as HTMLElement
      const rect = target.getBoundingClientRect()
      const x = (e.nativeEvent as unknown as { pageX: number }).pageX - rect.left
      const percent = (x / rect.width) * 100
      seekPercent(Math.max(0, Math.min(100, percent)))
    }
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="adjustable"
      accessibilityLabel="Seek"
      className={cn('flex-1 min-h-[6px] h-1.5 rounded-full bg-border-default overflow-hidden web:cursor-pointer', className)}
    >
      <View
        className="h-full rounded-full bg-brand-primary"
        style={{ width: `${progress}%` }}
        pointerEvents="none"
      />
    </Pressable>
  )
}

function TimeDisplay({ className }: { className?: string }) {
  const { currentTime, duration, formatTime: fmt } = useAudioPlayerContext()

  return (
    <Text className={cn('font-mono text-xs text-text-tertiary', className)} selectable={false}>
      {fmt(currentTime)} / {fmt(duration)}
    </Text>
  )
}

function Title({ className }: { className?: string }) {
  const { title } = useAudioPlayerContext()
  if (!title) return null

  return (
    <Text className={cn('text-sm text-text-primary truncate', className)} numberOfLines={1}>
      {title}
    </Text>
  )
}

/**
 * AudioPlayer compound component for playing audio files.
 *
 * @example
 * <AudioPlayer src="/audio/track.mp3" title="My Track" />
 *
 * // Compact variant
 * <AudioPlayer src="/audio/track.mp3" title="My Track" variant="compact" />
 *
 * // Custom layout
 * <AudioPlayer src="/audio/track.mp3">
 *   <AudioPlayer.PlayButton />
 *   <AudioPlayer.SeekBar />
 *   <AudioPlayer.TimeDisplay />
 * </AudioPlayer>
 */
export function AudioPlayer({
  src,
  title,
  autoPlay,
  onPlay,
  onPause,
  onEnded,
  onError,
  variant = 'default',
  className,
  children,
  ...props
}: AudioPlayerProps) {
  const player = useAudioPlayer({ src, autoPlay, onPlay, onPause, onEnded, onError })
  const ctx: AudioPlayerContextValue = { ...player, variant, title }

  const defaultLayout = variant === 'compact' ? (
    <View className="flex-row items-center gap-3">
      <PlayButton />
      <Title className="flex-1" />
      <TimeDisplay />
    </View>
  ) : (
    <View className="gap-1">
      <View className="flex-row items-center gap-3">
        <PlayButton />
        <SeekBar />
        <TimeDisplay />
      </View>
      {title && (
        <View className="flex-row pl-[52px]">
          <Title />
        </View>
      )}
    </View>
  )

  return (
    <AudioPlayerContext.Provider value={ctx}>
      <View className={cn('p-2', className)} {...props}>
        {children ?? defaultLayout}
      </View>
    </AudioPlayerContext.Provider>
  )
}

AudioPlayer.PlayButton = PlayButton
AudioPlayer.SeekBar = SeekBar
AudioPlayer.TimeDisplay = TimeDisplay
AudioPlayer.Title = Title

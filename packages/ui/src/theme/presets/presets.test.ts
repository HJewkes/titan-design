import { describe, it, expect, afterEach } from 'vitest'
import { applyThemePreset } from './apply'
import type { ThemePreset } from './types'

describe('applyThemePreset', () => {
  let cleanup: () => void

  afterEach(() => {
    cleanup?.()
  })

  it('applies color overrides to document root', () => {
    const preset: ThemePreset = {
      name: 'test',
      colors: {
        dark: {
          'brand-primary': '#FF0000',
        },
      },
    }
    cleanup = applyThemePreset(preset)
    const value = document.documentElement.style.getPropertyValue('--color-brand-primary')
    expect(value).toBe('#FF0000')
  })

  it('returns cleanup function that removes overrides', () => {
    const preset: ThemePreset = {
      name: 'test',
      colors: {
        dark: {
          'brand-primary': '#FF0000',
        },
      },
    }
    cleanup = applyThemePreset(preset)
    cleanup()
    const value = document.documentElement.style.getPropertyValue('--color-brand-primary')
    expect(value).toBe('')
  })

  it('adds root classes', () => {
    const preset: ThemePreset = {
      name: 'test',
      rootClasses: ['atmosphere-warm'],
    }
    cleanup = applyThemePreset(preset)
    expect(document.documentElement.classList.contains('atmosphere-warm')).toBe(true)
    cleanup()
    expect(document.documentElement.classList.contains('atmosphere-warm')).toBe(false)
  })
})

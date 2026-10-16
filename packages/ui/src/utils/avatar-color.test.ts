import { describe, it, expect } from 'vitest'
import { avatarColor, avatarColors, getInitials } from './avatar-color'

describe('avatarColor', () => {
  it.each(['dark', 'light'] as const)('returns a categorical role colour in %s', (mode) => {
    expect(avatarColors(mode)).toContain(avatarColor('Alice', mode))
  })
  it('is deterministic', () => {
    expect(avatarColor('Bob', 'light')).toBe(avatarColor('Bob', 'light'))
  })
  it('varies across names', () => {
    const colors = new Set(['Alice', 'Bob', 'Charlie', 'Dave'].map((n) => avatarColor(n, 'dark')))
    expect(colors.size).toBeGreaterThan(1)
  })
  it('the same name lands on the same palette slot in dark and light', () => {
    const dark = avatarColors('dark')
    const light = avatarColors('light')
    for (const name of ['Alice', 'Bob', 'Charlie', 'Dave', 'Eve', 'Frank', 'Grace']) {
      expect(light.indexOf(avatarColor(name, 'light'))).toBe(
        dark.indexOf(avatarColor(name, 'dark'))
      )
    }
  })
})

describe('getInitials', () => {
  it('returns first+last initials', () => {
    expect(getInitials('John Doe')).toBe('JD')
  })
  it('handles single name', () => {
    expect(getInitials('Alice')).toBe('A')
  })
  it('handles empty string', () => {
    expect(getInitials('')).toBe('?')
  })
  it('handles multi-part names', () => {
    expect(getInitials('Mary Jane Watson')).toBe('MW')
  })
})

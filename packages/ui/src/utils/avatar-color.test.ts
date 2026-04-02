import { describe, it, expect } from 'vitest'
import { avatarColor, getInitials, AVATAR_COLORS } from './avatar-color'

describe('avatarColor', () => {
  it('returns a color from the palette', () => {
    expect(AVATAR_COLORS).toContain(avatarColor('Alice'))
  })
  it('is deterministic', () => {
    expect(avatarColor('Bob')).toBe(avatarColor('Bob'))
  })
  it('varies across names', () => {
    const colors = new Set(['Alice', 'Bob', 'Charlie', 'Dave'].map(avatarColor))
    expect(colors.size).toBeGreaterThan(1)
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

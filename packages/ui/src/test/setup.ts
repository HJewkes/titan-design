/// <reference types="vitest/globals" />
import '@testing-library/jest-dom'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { toHaveNoViolations } from 'jest-axe'
import { captureClassName, capturedClassNames } from './classname-capture'

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations)

// Cleanup after each test
afterEach(() => {
  cleanup()
  capturedClassNames.clear()
})

const CAPTURED_PRIMITIVES = [
  'View',
  'Text',
  'Pressable',
  'ScrollView',
  'Image',
  'TextInput',
] as const

// Mock react-native components for web testing
vi.mock('react-native', async () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RNW = (await vi.importActual('react-native-web')) as Record<string, any>
  const wrapped: Record<string, unknown> = { ...RNW }
  for (const name of CAPTURED_PRIMITIVES) {
    if (RNW[name]) wrapped[name] = captureClassName(RNW[name])
  }
  if (RNW.Animated) {
    wrapped.Animated = {
      ...RNW.Animated,
      View: captureClassName(RNW.Animated.View),
      Text: captureClassName(RNW.Animated.Text),
    }
  }
  return wrapped
})

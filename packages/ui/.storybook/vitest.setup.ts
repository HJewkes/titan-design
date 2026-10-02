import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview'
import { setProjectAnnotations } from '@storybook/react'
import { afterEach } from 'vitest'
import * as previewAnnotations from './preview'

// jest-axe stays the a11y gate; the browser project only runs play functions (VW-481 Q2).
const a11yOff = { parameters: { a11y: { test: 'off' } } }

setProjectAnnotations([a11yAddonAnnotations, previewAnnotations, a11yOff])

// Stories share one page here, unlike Storybook's per-story iframe. react-native-web's
// scroll-end timer (100 ms) and the carousel's settle timer (150 ms) can outlive an
// unmount, so let them fire before the next story clears its mocks.
const STRAY_TIMER_DRAIN_MS = 400

afterEach(() => new Promise<void>((resolve) => setTimeout(resolve, STRAY_TIMER_DRAIN_MS)))

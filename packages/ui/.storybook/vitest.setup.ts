import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview'
import { setProjectAnnotations } from '@storybook/react'
import { afterEach } from 'vitest'
import * as previewAnnotations from './preview'

// jest-axe stays the a11y gate; the browser project only runs play functions (VW-481 Q2).
const a11yOff = { parameters: { a11y: { test: 'off' } } }

setProjectAnnotations([a11yAddonAnnotations, previewAnnotations, a11yOff])

// Unmounted carousels' scroll timers leak into the next story's mocks; VW-756 fixes Carousel and deletes this drain.
const STRAY_TIMER_DRAIN_MS = 400

afterEach(() => new Promise<void>((resolve) => setTimeout(resolve, STRAY_TIMER_DRAIN_MS)))

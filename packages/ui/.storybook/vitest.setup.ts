import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview'
import { setProjectAnnotations } from '@storybook/react'
import * as previewAnnotations from './preview'

// jest-axe stays the a11y gate; the browser project only runs play functions (VW-481 Q2).
const a11yOff = { parameters: { a11y: { test: 'off' } } }

setProjectAnnotations([a11yAddonAnnotations, previewAnnotations, a11yOff])

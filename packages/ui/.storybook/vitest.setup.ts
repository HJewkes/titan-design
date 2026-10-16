import * as a11yAddonAnnotations from '@storybook/addon-a11y/preview'
import { setProjectAnnotations } from '@storybook/react-vite'
import * as previewAnnotations from './preview'

// Off by decision (VW-481 Q2, TD-94); the a11y gates are listed in docs/test-layers.md.
const a11yOff = { parameters: { a11y: { test: 'off' } } }

setProjectAnnotations([a11yAddonAnnotations, previewAnnotations, a11yOff])

import type { Meta, StoryObj } from '@storybook/react-vite'
import { D1Frame, D2Frame, D5Frame } from './SurfaceFamilyDecisions'
import { FamilyFrame } from './SurfaceFamilyFrame'

/**
 * Surface-system plan S2: one story per frame, so each Gate 2 question sits beside its own frame
 * in review. Every colour is named by its ramp step and every ratio is measured in
 * `surface-family.ts`; a pair that misses AA is a swatch with its ratio, never live text.
 */
const meta: Meta = {
  title: 'Lab/Decisions/Surface Family',
  tags: ['autodocs', 'status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (surface-system plan S2; D1, D2, D5, D6). A solid and a subtle surface ' +
          'for each of the seven ramp hues, each with one label rule per mode, on every content ' +
          'plane of its mode, then the shipped Badge, Pill, Alert and Button painted with the pair ' +
          '(through the `error` tone, overridden locally). Plane tiles print the label ratio on the ' +
          'fill and the fill against the plane (WCAG 2.x). No token changes.',
      },
    },
  },
}
export default meta
type Story = StoryObj

/** D6, D1 (light half): the light solid family, hue[600] + white. */
export const SolidLight: Story = { render: () => <FamilyFrame kind="solid" mode="light" /> }

/** D6, D1 (dark half): the dark solid family, shipped steps + grey[950]. */
export const SolidDark: Story = { render: () => <FamilyFrame kind="solid" mode="dark" /> }

/** D6: the light subtle family, hue[100] + hue[700]. */
export const SubtleLight: Story = { render: () => <FamilyFrame kind="subtle" mode="light" /> }

/** D6: the dark subtle family, 12% wash of hue[300] + hue[300]. */
export const SubtleDark: Story = { render: () => <FamilyFrame kind="subtle" mode="dark" /> }

/** D1: reading A (same rule per mode) beside reading B (one label hex in both modes). */
export const D1ConsistentAcrossModes: Story = { render: () => <D1Frame /> }

/** D2: light brand and warning kept at 500 (named exceptions) or moved to 600. */
export const D2BrandWarningLight: Story = { render: () => <D2Frame /> }

/** D5: the light subtle step on each candidate page of the elevation ramp decision. */
export const D5SubtleStepLight: Story = { render: () => <D5Frame /> }

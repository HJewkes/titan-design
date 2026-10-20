import type { Meta, StoryObj } from '@storybook/react-vite'
import { Fd1PlanesFrame } from './Fd1PlanesFrame'
import { Fd3LadderFrame } from './Fd3LadderFrame'
import { Fd4SubtleFrame } from './Fd4SubtleFrame'
import { Fd5FamilyFrame } from './Fd5FamilyFrame'

/**
 * The colour foundations frames: one story per frame, so each question sits beside its own frame
 * in review. Every colour is named by hue and ramp step, and every ratio is measured in
 * `foundations.ts` on the 3b planes. A label under AA is a swatch with its ratio, never live text.
 */
const meta: Meta = {
  title: 'Lab/Decisions/Foundations',
  tags: ['autodocs', 'status:lab', '!status:review'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**Lab decision** (colour foundations FD1, FD3, FD4, FD5). The plane ladder with its ' +
          'text-bearing planes; three subtle packages on every text plane; the solid and subtle ' +
          'family for seven hues plus neutral; and the light solid ladder as a record. Shipped ' +
          'Pill, Badge, Alert and ToolBadge are painted ' +
          'with each candidate through locally overridden tokens. No token changes.',
      },
    },
  },
}
export default meta
type Story = StoryObj

/** FD1: the dark ramp -2..+5 plus input, text-bearing planes marked. */
export const Fd1PlanesD: Story = { render: () => <Fd1PlanesFrame mode="dark" /> }

/** FD1: the light (3b) ramp -2..+5 plus input, text-bearing planes marked. */
export const Fd1PlanesL: Story = { render: () => <Fd1PlanesFrame mode="light" /> }

/** FD4: the three dark subtle packages on every dark text plane. */
export const Fd4SubtleD: Story = { render: () => <Fd4SubtleFrame mode="dark" /> }

/** FD4: the three light subtle packages on every 3b text plane. */
export const Fd4SubtleL: Story = { render: () => <Fd4SubtleFrame mode="light" /> }

/** FD5: the dark family, solid and subtle cells, then Pill, Badge and ToolBadge per hue. */
export const Fd5FamilyD: Story = { render: () => <Fd5FamilyFrame mode="dark" /> }

/** FD5: the light family, solid and subtle cells, then Pill, Badge and ToolBadge per hue. */
export const Fd5FamilyL: Story = { render: () => <Fd5FamilyFrame mode="light" /> }

/** FD3 (record): the six light solids at their decided steps, the two exceptions marked. */
export const Fd3LadderL: Story = { render: () => <Fd3LadderFrame /> }

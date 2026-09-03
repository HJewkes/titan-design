import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MarkdownProse, type ProseLinker } from './MarkdownProse'

const SAMPLE = `# Shipped AW-17 and AW-18

Resolved the cwd to an initiative via the registered worktree, then folded the
result into [[bootstrap-prompt]]. See #157 for the file-history explorer.

## What changed

- \`active-work open\` now resolves **worktree-registered** cwds first
- A missing worktree no longer aborts the launch; AW-116 tracks the prune
- TD-07.14 unified the greys, so the shell planes moved with it

### Follow-ups

Nothing blocks AW-22; the reader is next.`

const TASK_LINKER: ProseLinker = {
  id: 'task',
  pattern: /\b[A-Z]{2,}-\d+(?:\.\d+)?\b/,
  tone: 'brand',
}
const WIKI_LINKER: ProseLinker = {
  id: 'wiki',
  pattern: /\[\[[^\]]+\]\]/,
  tone: 'link',
  label: (ref) => ref.slice(2, -2),
}
const PR_LINKER: ProseLinker = { id: 'pr', pattern: /#\d+\b/, tone: 'muted' }

/**
 * **MarkdownProse** — a small markdown subset (headings, bullets, paragraphs,
 * bold, code) rendered as themed prose, with caller-described references
 * auto-linked in one of three tones.
 *
 * Composes `Typography`. Used by `SessionDetail` and the initiative reader.
 */
const meta: Meta<typeof MarkdownProse> = {
  title: 'Custom/Prose/MarkdownProse',
  component: MarkdownProse,
  args: {
    body: SAMPLE,
    linkers: [TASK_LINKER, WIKI_LINKER, PR_LINKER],
  },
  argTypes: {
    linkers: { table: { disable: true } },
  },
  decorators: [
    (Story) => (
      <View className="w-full max-w-[640px] p-4">
        <Story />
      </View>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'Composes **Typography**. Linkers are tried in order; a match renders in its tone and, when the linker carries `onPress`, as a pressable link.',
      },
    },
  },
}
export default meta

type Story = StoryObj<typeof MarkdownProse>

/** Task ids in brand, `[[links]]` as links, PR numbers muted. */
export const Default: Story = {}

/** The same body with no linkers: plain prose. */
export const NoLinkers: Story = {
  args: { linkers: [] },
}

/** Pressable references: each linker carries an `onPress`. */
export const Pressable: Story = {
  args: {
    linkers: [
      { ...TASK_LINKER, onPress: (id) => console.log('task', id) },
      { ...WIKI_LINKER, onPress: (name) => console.log('link', name) },
      { ...PR_LINKER, onPress: (ref) => console.log('pr', ref) },
    ],
  },
}

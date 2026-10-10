import type { Meta, StoryObj } from '@storybook/react-vite'
import { View } from 'react-native'
import { MarkdownProse, type ProseLinker } from './MarkdownProse'

const SAMPLE = `# Shipped AW-17 and AW-18

Resolved the cwd to an initiative via the registered worktree, then folded the
result into [[bootstrap-prompt]]. See #42 for the file-history explorer.

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
 * bold, code, fenced code blocks, pipe tables) rendered as themed prose, with caller-described references
 * auto-linked in one of three tones.
 *
 * Composes `Typography` and `Table`. Used by `SessionDetail` and the initiative reader.
 */
const meta: Meta<typeof MarkdownProse> = {
  title: 'Custom/Prose/MarkdownProse',
  component: MarkdownProse,
  tags: ['autodocs', 'status:candidate', '!status:review'],
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
          'Composes [Typography](?path=/docs/foundations-typography--docs) and [Table](?path=/docs/components-organisms-table--docs). Linkers are tried in order; a match renders in its tone and, when the linker carries `onPress`, as a pressable link.',
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

const CODE_BODY = `Run the check before pushing:

\`\`\`bash
pnpm exec vitest run --project threads packages/ui/src/components/custom/Prose/MarkdownProse.test.tsx --reporter=verbose
\`\`\`

An unterminated fence renders the rest as code:

\`\`\`ts
const open = true`

const TABLE_BODY = `| Task | Owner | Done |
| :--- | :---: | ---: |
| Parser | design | 3 |
| Renderer | design | 5 |
| Ragged row | design |`

/** A fenced block: language label, mono text, scrolls sideways. An unterminated fence runs to the end. */
export const CodeBlocks: Story = {
  args: { body: CODE_BODY, linkers: [] },
}

/** A pipe table: alignment from the delimiter row, ragged rows padded to the header. */
export const Tables: Story = {
  args: { body: TABLE_BODY, linkers: [] },
}

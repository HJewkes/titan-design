import type { Meta, StoryObj } from '@storybook/react-vite'
import { Text, View } from 'react-native'
import { Surface } from '../../ui/surface'
import { Typography } from '../../ui/typography'
import { MarkdownProse, type ProseLinker } from './MarkdownProse'
import { DOCS_FIXTURE } from './proseDocsFixture'

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
 * **MarkdownProse** — a markdown subset (anchored headings, nested bullet and ordered lists, paragraphs,
 * bold, italic, code, links, fenced code blocks, pipe tables, `:::` containers) rendered as themed prose,
 * with caller-described references auto-linked in one of three tones.
 *
 * Composes `Typography`, `Alert` and `Table`. Used by `SessionDetail` and the initiative reader.
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
          'Composes [Typography](?path=/docs/foundations-typography--docs), [Alert](?path=/docs/components-molecules-alert--docs) for `:::` containers and [Table](?path=/docs/components-organisms-table--docs). Linkers are tried in order; a match renders in its tone and, when the linker carries `onPress`, as a pressable link. `[text](url)` links render through `renderLink` (default `ProseAnchor`, an inline `<a href>` on web).',
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

/** A docs page: frontmatter and comments dropped, anchored headings, nested lists, links, containers, code. */
export const DocsPage: Story = {
  args: { body: DOCS_FIXTURE, linkers: [], size: 'md' },
}

const LINKS_BODY = `Links stay in the line: a [relative page](/guides/setup), an [anchor](#top), an
[external site](https://example.com) and [**bold** link text](./next). A target outside the
policy, like [this one](javascript:void(0)), shows its text and links nowhere.`

/** \`[text](url)\` links: http(s), mailto and relative targets link; anything else reads as muted text. */
export const Links: Story = {
  args: { body: LINKS_BODY, linkers: [] },
}

const CALLOUTS_BODY = ['tip', 'info', 'warning', 'danger']
  .map(
    (kind) =>
      `::: ${kind}\nA \`${kind}\` container holds **prose**, [links](/guides) and lists:\n\n- one\n- two\n:::`
  )
  .join('\n\n')

/** \`::: tip|info|warning|danger [title]\` containers as subtle Alerts with a note role; the title defaults to the kind. */
export const Callouts: Story = {
  args: { body: CALLOUTS_BODY, linkers: [] },
}

const LISTS_BODY = `1. Ordered items keep their numbers.
2. A nested list sits inside its item:
   - a bullet
   - another, with \`code\`
3. So do fences and paragraphs:

   \`\`\`sh
   widget run
   \`\`\`

   After the fence.`

/** Ordered and nested lists: a list item holds paragraphs, lists and fences indented under it. */
export const NestedLists: Story = {
  args: { body: LISTS_BODY, linkers: [], size: 'md' },
}

/** \`inline\`: the spans of one line inside the caller's own Text, with no block wrapper. */
export const Inline: Story = {
  render: function Render() {
    return (
      <Typography variant="body2" className="text-text-primary">
        Option:{' '}
        <MarkdownProse inline body="keep the *current* plan, see [the brief](/brief) and `AW-12`" />
      </Typography>
    )
  },
}

const KEYWORDS = /\b(const|return|function)\b/

/** The \`highlight\` seam: the caller's spans replace the plain code. This toy one colours three keywords. */
export const Highlighted: Story = {
  args: {
    body: '```ts\nfunction size(x) {\n  const y = x * 2\n  return y\n}\n```',
    linkers: [],
    highlight: (code: string) =>
      code.split(KEYWORDS).map((part, i) =>
        KEYWORDS.test(part) ? (
          <Text key={i} className="text-text-brand">
            {part}
          </Text>
        ) : (
          part
        )
      ),
  },
}

const PLANES = [
  { label: 'background', props: { level: 'background' } },
  { label: 'base', props: { level: 'base' } },
  { label: 'raise 1', props: { raise: 1 } },
  { label: 'raise 2', props: { raise: 2 } },
  { label: 'raise 3', props: { raise: 3 } },
] as const

/** The same prose on every plane it renders on: bullets, brand, link and muted tones all clear AA on each. */
export const OnEveryPlane: Story = {
  render: function Render(args) {
    return (
      <Surface level="base" className="gap-4 p-2">
        {PLANES.map(({ label, props }) => (
          <Surface key={label} {...props} className="p-4" testID={`plane-${label}`}>
            <MarkdownProse {...args} />
          </Surface>
        ))}
      </Surface>
    )
  },
}

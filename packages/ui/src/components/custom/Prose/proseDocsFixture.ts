/** A synthetic docs page with one of every construct `MarkdownProse` reads, for tests and stories. */
export const DOCS_FIXTURE = `---
title: Synthetic page
---

# Widget guide {#guide}

<!-- generated:summary start -->
A paragraph with *italic*, _also italic_, **bold with \`code\`**, \`inline code\`, a
[relative link](/guides/other#part), an [anchor](#widget-guide), an [external](https://example.com/docs)
and a [bad one](javascript:alert(1)).
<!-- generated:summary end -->

The count is <!-- generated:n start -->three<!-- generated:n end --> widgets.

## Setup steps

1. Install the widget.
2. Configure it:
   - set \`size\`
   - set **colour**
3. Run it:

   \`\`\`sh
   widget run
   \`\`\`

   It prints a report.

The total was
60. A line that only looks like a list item.

### The \`option\` flag

::: tip Before you start
Read the [overview](./overview) first.
:::

::: warning
Nothing here is real. A fence inside a container:

\`\`\`
echo none
:::
\`\`\`
:::

| Option | Meaning |
|---|---|
| \`size\` | how big, see [sizes](/ref/sizes) |

## Setup steps

### Again

#### Deep heading
`

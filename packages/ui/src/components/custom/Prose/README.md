# `custom/Prose` — long-form text rendering

One component. It exists because the ActiveWork readers display markdown written
by humans and agents — briefs, session notes, open loops — and a `<Text>` per
paragraph loses headings, bullets, emphasis and, critically, the domain
references (`AW-124`, `#172`, a file path) that make that prose navigable.

This README is the **index**: **composes ↓** and **used-by ↑**, so the tree
navigates both ways. Counts come from
[`src/arch/arch-graph.json`](../../../arch/arch-graph.json).

## Dependency map

| Member                               | Kind     | Composes ↓                           | Used-by ↑                                                                |
| ------------------------------------ | -------- | ------------------------------------ | ------------------------------------------------------------------------ |
| `MarkdownProse`                      | molecule | `Typography`, `Alert`, `Table`, `cn` | InitiativeBrief, OpenLoops, SessionDetail (all ActiveWork)               |
| `ProseAnchor`                        | atom     | `anchorProps` (Link)                 | `MarkdownProse` (default `renderLink`), docs-site link slots             |
| `parseProseBlocks`                   | pure fn  | —                                    | `MarkdownProse`, `custom/Chat/chatThread.ts`, its own tests              |
| `safeHref`, `slugify`, `plainInline` | pure fns | —                                    | `MarkdownProse`, `chatThread.ts`, consumers building a table of contents |
| `ProseLinker` / `ProseLinkTone`      | types    | —                                    | every consumer that supplies reference patterns                          |

Four in-repo consumers, zero external — `keep-internal` in the arch graph. The
parser is exported separately on purpose: block-splitting is the part worth
testing directly, and it is testable without rendering.

## The two halves

**`parseProseBlocks(body)`** splits markdown into the block kinds this
renderer understands (`h1` `h2` `h3` `li` `p`, plus `code`, `table` and `callout`). A fenced block keeps its lines verbatim and, left unterminated, takes the rest of the body; a table is a pipe header line over a delimiter row (`:---`, `:---:`, `---:` set alignment) and its rows are padded or truncated to the header count. Consecutive text lines join into
one paragraph and a blank line ends it. A list item (`-`, `*`, `+`, `1.`, `1)`) takes every
line indented past its marker, blank lines between them included, and parses them as its
`children`; its first paragraph is its `text`. An ordered item numbered other than 1 cannot
interrupt a paragraph, so a wrapped `60. An id…` stays prose. `::: kind [title]` up to its
matching `:::` is a `callout` (fences inside are skipped). Deeper headings flatten to `h3` in
`type` and keep their source `level`; every heading gets an `id` by the VitePress slug rule
(`{#id}` pins one, repeats get `-1`, `-2`), so a site moved off VitePress keeps its fragments.
A leading YAML frontmatter block and comment-only lines are dropped. Nesting stops at eight
levels, and every scan stops at the next opener, so hostile input costs linear time. It is
pure, so it is unit-tested on its own.

**Inline spans** are HTML comments (dropped), code, `[text](url)` links, `**bold**` and
`*italic*` / `_italic_` (never intraword, so `2*3*4` and `snake_case` stay literal), then each
linker. Bold, italic and link text nest the other spans. A link's target goes through
`safeHref`: http(s), mailto and relative targets link, anything else (`javascript:`, `data:`,
a scheme hidden behind a tab) shows its text in the muted tone. `renderLink` receives
`{ href, label, children, isExternal }`; the default, `ProseAnchor`, is a `<Text>` that is an
`<a href>` on web so it stays in the line (`Link` is a pressable view and would break it), and
takes an `onPress` for client routing. `highlight(code, lang)` returns spans for a fence's
code; nothing is bundled. `inline` renders the spans alone inside the caller's own `Text`.
Nothing reads `window` or `document` during render, so the prose renders on a server.

**`MarkdownProse`** renders those blocks and inline-links references. `linkers`
is an ordered list of `{ id, pattern, tone, label, onPress }`; the renderer
combines the patterns into one tokenizer, which is why **a `ProseLinker.pattern`
must carry neither the `g` flag nor capture groups**. `tone` chooses how a
reference reads: `brand` for the domain's own ids, `link` for cross-references,
`muted` for asides. A linker with `onPress` becomes pressable and takes a link
role; without one it is styled text, not an interactive element.

## Reuse audit

| Leaf                   | Should compose     | Status                                                                                                                                                                                    |
| ---------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headings and body copy | `Typography`       | **Closed.** `h1`/`h2` → `h5`/`h6`, `h3` → `subtitle2`, paragraphs and bullets → `body2`.                                                                                                  |
| Bold and code spans    | `Typography`       | **Open, deliberately.** Inline spans are raw `<Text>` with `font-semibold` / `font-mono`, because they nest inside a parent `<Text>` run where a `Typography` block would break the flow. |
| Bullet glyph           | a shared list mark | **Open.** The `•` is drawn inline. One consumer family, so no primitive is justified yet — revisit at the second.                                                                         |
| Colour                 | semantic tokens    | **Closed.** `text-text-primary` / `text-text-brand` throughout; the family is in the token-pure eslint error block.                                                                       |
| Class merging          | `cn()`             | **Closed.**                                                                                                                                                                               |

## States

Code and table blocks are pure renderings of the body, so they hold no loading or error state of their own: an
empty body renders nothing, a malformed fence or table degrades to code or paragraph text, and there is no
disabled state because nothing in them is interactive. Table cells keep inline bold, code and linkers.

## Watch list

- **The tokenizer contract is unenforced.** A `linkers` entry with a `g` flag or a
  capture group breaks reference splitting at runtime with no type error. If a
  third consumer arrives, validate in `MarkdownProse` rather than in each caller.
- **Markdown coverage is intentionally partial** — no images, blockquotes,
  reference-style links, autolinks, HTML blocks or backslash escapes. It covers the
  docs site's pages as of TD-1022; widen it only against a real document that needs
  it, since the parser's value is that it is small enough to read.
- **A mermaid fence is code.** A consumer that draws diagrams does it through
  `highlight` (which renders inside the code well) or by splitting the body.
- **Zero external consumers.** Prop changes are cheap while that holds.

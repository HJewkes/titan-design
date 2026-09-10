# `custom/Prose` — long-form text rendering

One component. It exists because the ActiveWork readers display markdown written
by humans and agents — briefs, session notes, open loops — and a `<Text>` per
paragraph loses headings, bullets, emphasis and, critically, the domain
references (`AW-124`, `#172`, a file path) that make that prose navigable.

This README is the **index**: **composes ↓** and **used-by ↑**, so the tree
navigates both ways. Counts come from
[`src/arch/arch-graph.json`](../../../arch/arch-graph.json).

## Dependency map

| Member                          | Kind     | Composes ↓         | Used-by ↑                                                  |
| ------------------------------- | -------- | ------------------ | ---------------------------------------------------------- |
| `MarkdownProse`                 | molecule | `Typography`, `cn` | InitiativeBrief, OpenLoops, SessionDetail (all ActiveWork) |
| `parseProseBlocks`              | pure fn  | —                  | `MarkdownProse`, and its own tests                         |
| `ProseLinker` / `ProseLinkTone` | types    | —                  | every consumer that supplies reference patterns            |

Four in-repo consumers, zero external — `keep-internal` in the arch graph. The
parser is exported separately on purpose: block-splitting is the part worth
testing directly, and it is testable without rendering.

## The two halves

**`parseProseBlocks(body)`** splits markdown into the five block kinds this
renderer understands (`h1` `h2` `h3` `li` `p`). Consecutive text lines join into
one paragraph and a blank line ends it; an indented line straight after a bullet
continues that bullet; deeper headings flatten to `h3`, because session prose
never needs more than three levels. It is pure, so it is unit-tested on its own.

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
| Colour                 | semantic tokens    | **Closed.** `text-text-primary` / `text-brand-primary` throughout; the family is in the token-pure eslint error block.                                                                    |
| Class merging          | `cn()`             | **Closed.**                                                                                                                                                                               |

## Watch list

- **The tokenizer contract is unenforced.** A `linkers` entry with a `g` flag or a
  capture group breaks reference splitting at runtime with no type error. If a
  third consumer arrives, validate in `MarkdownProse` rather than in each caller.
- **Markdown coverage is intentionally partial** — no tables, links, images,
  blockquotes or nested lists. Widen it only against a real document that needs
  it; the parser's value is that it is small enough to read.
- **Zero external consumers.** Prop changes are cheap while that holds.

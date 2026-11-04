---
section: Added
---

`MarkdownProse` reads docs pages (TD-1022, covers TD-998): `[text](url)` links under a safe-URL
policy (http(s), mailto and relative targets link; anything else shows its text) through a
`renderLink` slot whose default is the new inline `ProseAnchor`; italic; heading anchor ids by the
VitePress slug rule, `{#id}` included, with headings keeping their source `aria-level`; ordered and
nested lists, with paragraphs, fences and tables inside an item; `::: tip|info|warning|danger`
containers as `Alert`s with a note role; a `highlight` seam for fenced code (no highlighter
bundled); an `inline` mode with no block wrapper; and leading frontmatter and HTML comments
dropped. It renders on a server. New exports: `ProseAnchor`, `safeHref`, `slugify`,
`plainInline`. Lines like `1. Squat` now render as an ordered list, and the chat `plainText`
drops the italic and link markup the bubble now renders.

# titan-review

A local design-review page over Storybook. An agent writes one round manifest; the human
picks, comments and pins on live stories in the browser; the agent gets the answers back
as JSON on stdout and in `feedback.json`. Private workspace tool, not published.

## The human's flow

1. The agent runs `pnpm review <round-dir>/round.json`; a browser tab opens.
2. Every variant renders live at every manifest width (wide frames scaled to fit, phone at 1:1).
3. The active card has an orange border. `1` chosen, `2` rejected, `3` maybe, `0` clears.
4. `Tab` jumps to that card's comment box. `Enter` moves to the next card or question.
5. `a` turns pins on: click a spot on any frame, type a note. `Esc` turns pins off.
6. On a question, `1`-`9` pick its options; the scale takes its value directly.
7. The last box is for general notes. `l` toggles one column per variant.
8. `Cmd+Enter` opens the final check, which lists every answer and anything missing.
9. `Cmd+Enter` again sends. The tab says "Sent", and the agent is already iterating.
10. Nothing leaves the Mac: the page binds 127.0.0.1 and loads no external resources.

## The agent's side

```sh
# Storybook first, from packages/ui (never bare `storybook dev`):
node scripts/storybook-launch.mjs --isolated          # prints its port, e.g. 6107

pnpm review --example --storybook http://127.0.0.1:6107 > <round-dir>/round.json   # a starting point
pnpm review <round-dir>/round.json [--storybook <url>] [--out <dir>] [--no-open] [--no-capture]
```

The command blocks until the human sends, then:

- writes `<out>/feedback.json` (default `<out>` = the manifest's directory, i.e.
  `sources/artifacts/<unit>/round-<n>/`),
- captures `<width>-<key>-<story-name>.png` per variant per width with Playwright (the key
  keeps two variants of one story apart; a failed capture warns and still exits 0),
- prints the feedback JSON on stdout and exits 0.

Ctrl-C before sending exits 130 and writes nothing. A bad manifest, an unreachable
Storybook, or a story id that port does not serve (another worktree's server) exits 2 before
anything opens.

`pnpm review` is a root script that calls `node` directly, and it is deliberately not a task in
`turbo.json`. It is interactive, it blocks until a human sends, and its output depends on that
human, so there is nothing for Turbo to cache or orchestrate and CI never runs it.

Quote `comment`, `note` and `text` verbatim when acting on them. `verdict` maps onto the
Lab/Decisions CHOSEN / NOT CHOSEN marks. Reject feedback whose `manifestSha256` is not the
sha256 of the manifest you wrote.

## Schemas

`schema/round.schema.json` and `schema/feedback.schema.json` are generated from
`src/schema.ts` (`pnpm --filter @titan-design/review-harness schema`; a test fails if they drift).

- Manifest `titan-review/round@1`: `unit`, `round`, `storybookUrl`, `context?`, `widths[]`,
  `height` (default 900), `variants[{key, storyId, label, args?, globals?}]`,
  `questions[{id, kind: pick-one|pick-many|scale|text, prompt, options | min+max, required?, scope?}]`.
  A question over variant keys is variant-scoped and sits right under the variants; set
  `scope` to override. Args and globals go in the Storybook URL, so keys and values are
  limited to letters, digits, space, `_` and `-` (numbers and booleans are fine); anything
  else is refused, because Storybook would silently drop it. Give such a variant its own story.
- Feedback `titan-review/feedback@1`: `manifestSha256`, `submittedAt`,
  `answers[{questionId, pick | picks | value | text, comment?}]`,
  `variants[{key, storyId, verdict: chosen|rejected|maybe|null, comment, annotations[]}]`,
  `general`. Each annotation has `width`, `x`/`y` in CSS px of the story frame, `xPct`/`yPct`
  as fractions of it, a `note`, and `target {testId?, role?, text?}` from element hit-testing.

## How it works

One Node server on 127.0.0.1 serves the page (Vite, middleware mode) under `/__review/` and
proxies every other path, websockets included, to Storybook. The story iframes are therefore
same-origin with the page, which lets a pin read the element under it
(`elementFromPoint`, nearest `data-testid`, role and text). The page's colours are titan's
token custom properties, generated from `@titan-design/react-ui` source at serve time.

## Tests

- `pnpm --filter @titan-design/review-harness test`: schemas, feedback building, the
  keyboard model, and the server's proxy, submit and exit paths against a fake Storybook.
- `pnpm --filter @titan-design/review-harness test:e2e`: a real isolated Storybook (or
  `TITAN_REVIEW_STORYBOOK=<url>`), a keyboard pick, a comment, a pin, send, then asserts the
  written JSON and PNGs. Local only; it needs Storybook and Chromium.

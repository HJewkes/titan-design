# titan-review

A local design-review page over Storybook. An agent writes one round manifest; the human
picks, comments and pins on live stories in the browser; the agent gets the answers back
as JSON on stdout and in `feedback.json`. Private workspace tool, not published.

## The human's flow

1. The agent runs `pnpm review <round-dir>/round.json`; a browser tab opens.
2. Every variant renders live at every manifest width (wide frames scaled to fit, phone at 1:1),
   each frame sized to its story unless the round fixed a height.
3. The active card has an orange border. `1` chosen, `2` rejected, `3` maybe, `0` clears.
4. `Tab` jumps to that card's comment box. `Enter` moves to the next card or question.
5. `a` turns pins on: click a spot on any frame, type a note. `Esc` turns pins off.
6. On a question, `1`-`9` pick its options; the scale takes its value directly.
7. The last box is for general notes. `l` toggles one column per variant.
   A sectioned round asks each group's question above that group's frames, and every frame
   carries the question it belongs to in its (sticky) header. It shows one section at a time:
   `]` pages to the next section, `[` to the previous one, and `Enter` past a section's last
   stop carries on into the next. The header lists every section as a link.
8. `Cmd+Enter` opens the final check, which lists every answer and anything missing.
9. `Cmd+Enter` again sends. The tab says "Sent", and the agent is already iterating.
10. Nothing leaves the Mac: the page binds 127.0.0.1 and loads no external resources.

## The agent's side

```sh
# Storybook first, from packages/ui (never bare `storybook dev`):
node scripts/storybook-launch.mjs --isolated          # prints its port, e.g. 6107

pnpm review --example --storybook http://127.0.0.1:6107 > <round-dir>/round.json   # a starting point
pnpm review --example --sections --storybook http://127.0.0.1:6107                # the same, grouped
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
  `height` (a number of px or `"auto"`, default `"auto"`; at round level a number caps every
  frame), `maxHeight` (default 1200, the cap when the round's `height` is `"auto"`),
  `variants[{key, storyId | image, label, args?, globals?, height?}]` (at most 12, or at most 80
  in a round with `sections`),
  `questions[{id, kind: pick-one|pick-many|scale|text, prompt, options | min+max, required?, scope?, optionVariants?}]`,
  `sections?[{id, title, context?, questionIds[], variantKeys[], seeAlso?[], height?}]`.
  A question over variant keys is variant-scoped and sits right under the variants; set
  `scope` to override. Args and globals go in the Storybook URL, so keys and values are
  limited to letters, digits, space, `_` and `-` (numbers and booleans are fine); anything
  else is refused, because Storybook would silently drop it. Give such a variant its own story.
- Image variants: a variant names exactly one of `storyId` (a live Storybook story) or `image`
  (a static PNG, for app-level screens Storybook cannot render). `image` is a path relative to
  the round file, with no `..` segments. Load time follows symlinks and refuses an image that is
  missing, is not a PNG, or resolves outside the round's directory. The page draws it in the same
  card, with the same verdict, comment, pin and keyboard controls, at each declared width.
  Heights follow the same rules as a story frame (see _Heights_): an `"auto"` frame is as tall
  as the image at that width up to the cap, a section or variant number fixes the frame, and an
  image taller than its frame scrolls inside it. Pins carry no `target`, since there is no DOM
  to hit-test. `args` and `globals` are refused on an image variant. Feedback echoes `image`
  where a story variant echoes `storyId`. Capture copies the PNG to `<out>/<key>-image.png`
  instead of shooting it (`<key>-image-2.png` and so on if that name is one of the round's
  source images; capture never writes over a source), and a round whose variants are all images
  needs no Storybook running (`storybookUrl` is still required).
- Feedback `titan-review/feedback@1`: `manifestSha256`, `submittedAt`,
  `answers[{questionId, pick | picks | value | text, comment?, variantComments?}]`,
  `variants[{key, storyId | image, verdict: chosen|rejected|maybe|null, comment, annotations[], relatedQuestionIds?}]`,
  `general`. Each annotation has `width`, `x`/`y` in CSS px of the story frame, `xPct`/`yPct`
  as fractions of it, a `note`, and `target {testId?, role?, text?}` from element hit-testing.
  `variantComments[{key, comment}]` repeats, under the answer, every comment left on a frame
  that question's section showed; `relatedQuestionIds` is the same link from the frame's side.
  Both appear only in a sectioned round. Everything else is unchanged and means what it always did.

## Writing a sectioned round (VW-530)

Without `sections` the page renders exactly as it always has: all frames, then all questions.
With them, it renders group by group, each group's QUESTION FIRST and then the frames that
answer it, so the human knows what he is being asked before he looks.

```json
{
  "schema": "titan-review/round@1",
  "unit": "vw-455-whole-body",
  "round": 4,
  "storybookUrl": "http://127.0.0.1:6107",
  "widths": [1920, 360],
  "height": "auto",
  "variants": [
    { "key": "R-pct", "storyId": "custom-...--default", "label": "Rate: the percent alone" },
    { "key": "R-word", "storyId": "custom-...--rate-verdict", "label": "Rate: percent plus word" },
    {
      "key": "Page",
      "storyId": "pages-goals-whole-body--default",
      "label": "Both cards on the page",
      "height": 1100
    }
  ],
  "questions": [
    {
      "id": "rate-length",
      "kind": "pick-one",
      "prompt": "How long is the rate line?",
      "options": ["R-pct", "R-word"],
      "required": true
    },
    {
      "id": "alignment",
      "kind": "pick-one",
      "prompt": "Do the two cards end level?",
      "options": ["Right", "No, see my comments"],
      "required": true
    },
    {
      "id": "sign-off",
      "kind": "pick-one",
      "prompt": "Round outcome",
      "options": ["Lock it", "Another round"],
      "required": true
    }
  ],
  "sections": [
    {
      "id": "rate",
      "title": "How long is the rate line?",
      "context": "Same card, two lengths. Your comment on a card lands on this question too.",
      "questionIds": ["rate-length"],
      "variantKeys": ["R-pct", "R-word"]
    },
    {
      "id": "page",
      "title": "The two cards on the page",
      "questionIds": ["alignment"],
      "variantKeys": ["Page"],
      "seeAlso": ["R-pct"]
    }
  ]
}
```

Rules worth knowing:

- **Options that are variant keys become the pick.** Inside a section, choosing `R-word`
  answers the question AND marks that frame chosen, and marking the frame chosen answers the
  question. One action, not two. When the options are prose, spell the link out with
  `optionVariants: {"the shorter one": "R-pct"}` on the question.
- **A comment on a frame reaches the question.** It is still written on the variant, and it is
  repeated under the section's answers as `variantComments`, so nothing has to be retyped or
  moved. This is why the frames belong under their question rather than in one long wall.
- **Leftovers have a home.** A variant in no section renders under "Other frames"; a question in
  no section renders under "Overall", which is where sign-off belongs.
- **One frame per section.** A frame that also bears on another group goes in that group's
  `seeAlso`, which renders a link to it instead of a second iframe. Validation refuses a variant
  or question claimed by two sections, and refuses an unknown key with the id in the message.
- **Sections are optional.** A round that does not need them should not have them.
- **Sections page a big round (TD-343).** A round without sections shows every frame on one
  page and is capped at 12 variants. A round with sections shows one section at a time, so it
  takes up to 80, for example one Gate 2 batch of main and PR-head frames in light and dark.
  The page order is the sections, then "Other frames", then "Overall" with the general note.
  A `seeAlso` link pages to the section that holds that frame. `feedback.json` is unchanged.

### Heights

`height` may be a number of CSS px or `"auto"`, at three levels: the variant, its section, then
the round. A number means something different at each level:

- **Round: a cap.** Every frame still fits its own story, and none grows past the number. A
  round with `height: 1300` shows a short card in a short frame and a tall page at 1300.
- **Section or variant: a fixed box.** The frame is exactly that tall, whatever the story
  draws. The more specific level wins.

With no number anywhere, every frame is `"auto"` and the cap is `maxHeight` (default 1200).
Set the round's `height` or `maxHeight`, not both; when both are set, `height` is the cap.

`"auto"` measures the story itself and sizes the frame to it. The iframes are same-origin (the
harness proxies Storybook on its own origin), so the page reads the story's own elements after
load, after `fonts.ready` and on every reflow, and never reads the frame's own box, which is
what it is sizing. A story taller than the cap stops there and scrolls inside its frame. A
frame the page cannot measure stays at 900 px (or the cap, if lower), which is also what it
shows until the first measurement lands. Widths are unchanged.

Do not set the round's height to fit the tallest story; omit it, or treat it as the most any
frame may take. Give a section or variant a fixed number only when the frame should be a
page-sized box on purpose (a `Pages/*` story), or when a story sets its own `100vh` and would
otherwise grow to the cap. A card in a 1500 px box was the complaint that produced this.

### Open-tip stories are open by STATE

A story whose tip, popover or menu must be visible in the round is a story that renders open,
not a story the human has to hover. Write the open state into the story (a separate
`--tip-open` story or a `play` function), not into the manifest: the harness never interacts
with a frame before he does, and args in the URL are limited to plain letters and digits.

## How it works

One Node server on 127.0.0.1 serves the page (Vite, middleware mode) under `/__review/` and
proxies every other path, websockets included, to Storybook. The story iframes are therefore
same-origin with the page, which lets a pin read the element under it
(`elementFromPoint`, nearest `data-testid`, role and text). The page's colours are titan's
token custom properties, generated from `@titan-design/react-ui` source at serve time.
A click inside a story moves keyboard focus into its iframe, so each loaded frame hands its
keys back to the page; the shortcuts, `Cmd+Enter` included, work wherever focus sits. A story's
own text field keeps its typing, except `Cmd+Enter`.

## Tests

- `pnpm --filter @titan-design/review-harness test`: schemas, feedback building, the
  keyboard model, the section layout and the pick-to-verdict link, the fitted-height maths,
  the page's markup for a sectioned and an unsectioned round (`react-dom/server`), section
  paging over a 60-frame image round, and the
  server's proxy, submit and exit paths against a fake Storybook. `test/fixtures/rounds/`
  holds four real rounds, copied verbatim, that must keep parsing.
- `pnpm --filter @titan-design/review-harness test:e2e`: a real isolated Storybook (or
  `TITAN_REVIEW_STORYBOOK=<url>`), a keyboard pick, a comment, a pin, send, then asserts the
  written JSON and PNGs; it also checks that a round-level height caps fitted frames while a
  variant height stays fixed. Local only; it needs Storybook and Chromium.

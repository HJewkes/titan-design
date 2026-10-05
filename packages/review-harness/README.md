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
   A sectioned round asks each group's question above that group's frames. It shows one
   section at a time:
   `]` pages to the next section, `[` to the previous one, and `Enter` past a section's last
   stop carries on into the next. The header lists every section as a link and says
   "Section N of M"; the end of every section repeats it between Previous and Next. Next is the
   primary button and takes focus whenever a section opens, so moving on is the default; on the
   last page Review answers takes that place.
8. `Cmd+Enter` opens the final check, which lists every answer and anything missing.
9. `Cmd+Enter` again sends once every question has an answer. The tab says "Sent", and the
   agent is already iterating. If any question is unanswered, the check says how many, Back
   becomes the primary button, `Cmd+Enter` does nothing, and the send button reads
   "Send partial: K unanswered". Clicking it is the only way to send a partial review; the
   feedback then lists what was left out in `unansweredQuestionIds`.
10. Nothing leaves the Mac: the page binds 127.0.0.1 and loads no external resources.

## The agent's side

```sh
# Storybook first, from packages/ui (never bare `storybook dev`):
node scripts/storybook-launch.mjs --isolated          # prints its port, e.g. 6107

pnpm review --example --storybook http://127.0.0.1:6107 > <round-dir>/draft.json   # a starting point
pnpm review build <round-dir>/draft.json [--storybook <url>]   # contrast gate; writes round.json
pnpm review <round-dir>/round.json [--storybook <url>] [--out <dir>] [--no-open] [--no-capture]
            [--contrast-override "<reason>"]
```

Write the manifest as `draft.json` and let `build` produce `round.json` (see _Contrast gate_).
`pnpm review` **refuses** (exit 2) a `round.json` without a passing `contrast.json` for its
exact bytes. To serve one anyway, pass `--contrast-override "<reason>"`; the reason is
required. The override is then recorded where it outlives the serve. `round.json` is
rewritten with `contrastOverride {reason, problem, failures[{variant, element, mode, kind,
ratio, required}]}`, where the failures are copied from `contrast.json` when there is one.
`feedback.json` (and stdout) echo the same record, and `manifestSha256` is the sha of the
rewritten file. The page shows the reason in a sticky banner ("Contrast was not gated for
this round: …") that stays above the section and frame heads while the owner scrolls. A
round whose contrast passed is served unchanged, with no record and no banner, even when
the flag is given. `build` refuses a draft that already carries `contrastOverride`, so a
built round can never show the banner. There is no environment variable and no silent
bypass. Hand-written test rounds and the e2es pass the flag.

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

- Manifest `titan-review/round@2`: `unit`, `round`, `storybookUrl`, `context?`, `widths[]`,
  `height` (a number of px or `"auto"`, default `"auto"`; at round level a number caps every
  frame), `maxHeight` (default 1200, the cap when the round's `height` is `"auto"`),
  `variants[{key, storyId | image, label, args?, globals?, height?}]` (at most 12, or at most 80
  in a round with `sections`; empty for a round of questions only, which needs no placeholder
  frame; every frame sits in a section),
  `questions[{id, kind: pick-one|pick-many|scale|text, prompt, options | min+max, required?, scope?, optionVariants?, recommendation?, signsOff (pick-one)}]`,
  `sections[{id, title, deciding, changed, context, kind?: CHOICE|STATES, questionIds[], variantKeys[], seeAlso?[], height?}]`,
  `recommendations` (`"after-answer"`, the default, or `"shown"`),
  `contrast?{knownDefects[], measured[], unmeasured[]}` (also on a section; see _Contrast gate_).
  The round and section `context`, each question `prompt` and each recommendation `rationale`
  render as GitHub-flavoured markdown (headings, lists, code, links, tables), and a single
  newline is a line break. A prompt is a heading, so it keeps only inline markup. Raw HTML
  shows as text; links keep only http, https, mailto and relative URLs; images show their alt
  text.
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
- Recommendations (TD-351): a pick-one, pick-many or scale question may carry
  `recommendation {answer, rationale, confidence, by}`, our own answer to it. `answer` is one of
  the options (pick-one), a list of them (pick-many) or a value on the scale; `confidence` is
  0 to 1; `by` names the recommender (an agent name or `design-coord`). A text question takes
  none. The page hides the recommendation until the owner answers the question, so it cannot
  anchor them, then shows it under their pick with whether the two match. Set the round's
  `recommendations` to `"shown"` to show every recommendation from the start.
- Feedback `titan-review/feedback@1`: `manifestSha256`, `submittedAt`,
  `answers[{questionId, pick | picks | value | text | revisionRequested, comment?, variantComments?, recommendation?, agreed?}]`,
  `variants[{key, storyId | image, verdict: chosen|rejected|maybe|null, comment, annotations[], relatedQuestionIds?}]`,
  `general`, `unansweredQuestionIds?`, `contrastOverride?` (see _The agent's side_). Each annotation has `width`,
  `x`/`y` in CSS px of the story frame, `xPct`/`yPct` as fractions of it, a `note`, and `target {testId?, role?, text?}` from element hit-testing.
  `variantComments[{key, comment}]` repeats, under the answer, every comment left on a frame
  that question's section showed; `relatedQuestionIds` is the same link from the frame's side.
  Both appear only in a sectioned round. `recommendation` echoes the question's recommendation,
  and `agreed` says whether the owner's answer equals it (pick-many: the same set); `agreed` is
  absent when the owner only commented. Both appear only when the question has a
  recommendation. `unansweredQuestionIds` marks a deliberate partial submit: it lists, in
  manifest order, every question the owner sent without an answer (a comment alone is not an
  answer), and a required question it lists is not an error. A full submit omits the field; the
  page sends one only when every question has an answer. The server rejects a list that
  disagrees with the answers sent. Every required pick-one also offers a final "None of these, request a revision". Choosing it
  writes `revisionRequested: true` and no `pick`; the comment is then required, and a send
  without one is blocked with a message. It counts as answered, and `agreed` is `false` against
  a recommendation, even when the recommended answer is the round's own `revisionOption`. Anything that reads `pick` must check `revisionRequested` first. A round
  that lists its own such option names it in the question's `revisionOption` (one of its
  `options`); the built-in is then not added, and picking that option is recorded the same
  way. The match is by that field, never by option text. Everything else is unchanged and means what it always did.

## Contrast gate (TD-478)

`titan-review build <draft.json>` measures every story variant at every manifest width in
**light and dark** (the Storybook `theme` global; light is `.light` on `<html>`) in headless
Chromium, using the same renderer as capture. It writes `contrast.json` beside the draft and
copies the draft byte for byte to `round.json` only when nothing undeclared failed. Otherwise
it exits 3 and `round.json` is not written. A frame whose theme did not apply is an error,
never a pass.

Thresholds (WCAG 2.1 SC 1.4.3 and 1.4.11): text 4.5:1; large text (24px, or 18.66px at
weight 700 or more) 3:1; non-text 3:1 against the adjacent plane. Each colour is composited
over its **effective background**: every ancestor's background from the canvas down, each
faded by its subtree's `opacity`, so an alpha fill over the plane counts.

What it measures:

- **Text**: every element with its own text node, and input values.
- **Control boundaries**: buttons, inputs and ARIA controls. The border or the fill,
  whichever contrasts more, against the parent's plane. A control that paints neither is
  identified by its label and is skipped.
- **Separators**: `hr`, `role=separator`, one-side or two-opposite-side borders, and fills
  2px thick or less.
- **Tracks**: fills 8px thick or less and at least four times as long.
- **Marks**: elements 24px or smaller with a border or fill, and every SVG shape's fill and
  stroke.
- **Portals**: everything the story renders into `<body>` outside `#storybook-root`, such as
  popovers, tooltips and modals, when it is open as the frame renders. Storybook's own
  chrome (`sb-*`, `#storybook-docs`) is skipped. To measure a tip, write a story that renders
  it open (README > _Open-tip stories are open by STATE_).

What it does not measure:

- Large non-control fills and full borders, such as cards, panels and surfaces. These are
  planes, not marks. TD-486 gates their token pairs.
- Planes painted by a non-ancestor (an absolutely positioned overlay) or by another SVG
  shape.
- Gradients, background images and pattern paints. They are listed as `indeterminate` and
  never block.
- Hover, focus and pressed states. A frame is measured as it first renders.
- Disabled controls, which WCAG exempts. They are counted as `exempt`.

**Declaring a miss.** A section's `contrast` holds the declarations for its own frames. The
round-level `contrast` holds them for every frame:

```json
"contrast": {
  "knownDefects": [
    { "element": "chip-label", "mode": "light", "kind": "text", "minRatio": 3.2, "route": "TD-490", "reason": "text-muted on the light base" }
  ],
  "measured": [
    { "variant": "Wall", "mode": "dark", "kind": "text", "element": "header", "ratio": 5.1, "source": "picker on the PNG" }
  ],
  "unmeasured": [{ "variant": "Wall", "mode": "light", "reason": "device capture, no DOM" }]
}
```

- A `knownDefects` entry excuses the miss of exactly one element. `element`, `mode` and `kind`
  are required, and loading refuses an entry that omits one. `element` is the failing
  element's own `data-testid`, or the full selector `build` printed for it in brackets. It is
  compared exactly, never as a substring. `variant` narrows the match further. `minRatio`,
  the recorded contrast of the miss, excuses it only at or above that ratio, so a regression
  below it blocks again. The old `maxRatio` is refused at load. `route` is required. It is the task id of the primitive or token audit that owns an
  inherited miss, or `component` for the component's own miss. A declared miss is still
  printed and written with its route and ratio. Only undeclared misses block. A declaration
  that matched nothing prints `UNMATCHED` so it does not linger and hide a later miss.
- An **image variant** has no DOM. **Each mode**, light and dark, needs a `measured` ratio
  (judged at the same thresholds) or an `unmeasured` entry with a reason. A light measurement
  does not cover dark. A story variant takes neither.

`contrast.json` (`titan-review/contrast@1`) records `manifestSha256`, `passed`, the
thresholds, the coverage lists above, a per-frame summary (checks, failures, known defects,
exempt, indeterminate), and every failure, known defect, unmeasured frame, indeterminate
pair and unmatched declaration. Passing checks are counted, not listed.

## Calibration

`titan-review calibration <feedback.json...>` reads feedback files and prints how often the
owner's answer matched the recommendation: one row per round, the overall rate, and the rate
per confidence band (`<0.5`, `0.5-0.75`, `>=0.75`). An answer counts only when it has both a
recommendation and an owner's answer.

## The review contract (TD-670)

`serve` and `build` refuse a round that does not meet it, naming the section or question and
the field. The page still renders an older `round@1` file, but the CLI refuses to serve one.

- **Every section says three things.** `deciding`: what this section asks the owner to decide.
  `changed`: the diff against the last approved state. `context`: what is shown for context
  only and is out of scope. The page shows deciding first, then changed, with context set back
  as secondary. A frame that did not change belongs in `context`, not in `changed`.
- **Every strip has a kind.** A section with frames sets `kind`. `CHOICE`: the frames differ
  only in the property being decided. The harness refuses a CHOICE strip whose frames differ in
  a frame setting the manifest records (`height`, `globals`, image or live story) or whose
  image captures differ in pixel width. `STATES`: one design shown in several states. It asks
  no choice, so none of its questions picks a frame.
- **Every pick-one names what it signs off.** `signsOff` names the changed part an answer
  approves. A prompt, option or `signsOff` that is only a blanket phrase such as "sign off as
  built" is refused. A question's options are its own: none repeats within it, and no prose
  option repeats another pick-one's (variant keys excepted).

## Writing a sectioned round (VW-530)

A round renders group by group, each group's QUESTION FIRST and then the frames that
answer it, so the human knows what he is being asked before he looks.

```json
{
  "schema": "titan-review/round@2",
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
      "signsOff": "the rate line's length",
      "required": true
    },
    {
      "id": "alignment",
      "kind": "pick-one",
      "prompt": "Do the two cards end level?",
      "options": ["The cards end level", "Not level, see my comments"],
      "signsOff": "how the two cards align on the page",
      "required": true
    }
  ],
  "sections": [
    {
      "id": "rate",
      "title": "How long is the rate line?",
      "deciding": "Which rate line the card keeps.",
      "changed": "The rate line gains a verdict word; R-pct is the approved line.",
      "context": "Same card, two lengths. Your comment on a card lands on this question too.",
      "kind": "CHOICE",
      "questionIds": ["rate-length"],
      "variantKeys": ["R-pct", "R-word"]
    },
    {
      "id": "page",
      "title": "The two cards on the page",
      "deciding": "Whether the two cards end level.",
      "changed": "Nothing in the page layout; the card heights change with the rate line.",
      "context": "The header and the rest of the page are not under review.",
      "kind": "STATES",
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
- **Leftovers have a home.** A question in no section renders under "Overall". A variant in no
  section is refused: every frame belongs to a strip.
- **One frame per section.** A frame that also bears on another group goes in that group's
  `seeAlso`, which renders a link to it instead of a second iframe. Validation refuses a variant
  or question claimed by two sections, and refuses an unknown key with the id in the message.
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
  paging over a 60-frame image round, each refusal of the review contract
  (`test/contract.test.ts`), and the
  server's proxy, submit and exit paths against a fake Storybook. `test/fixtures/rounds/`
  holds four real rounds, copied verbatim, that must keep parsing.
- `pnpm --filter @titan-design/review-harness test:e2e`: a real isolated Storybook (or
  `TITAN_REVIEW_STORYBOOK=<url>`), a keyboard pick, a comment, a pin, send, then asserts the
  written JSON and PNGs; it also checks that a round-level height caps fitted frames while a
  variant height stays fixed. Local only; it needs Storybook and Chromium.
  `e2e/contrast.e2e.ts` needs no Storybook. It serves a synthetic story, with a portal and
  Storybook chrome. It proves three things. Light-mode misses block `round.json`. Declaring
  one miss excuses only that one. Declaring them all passes. `e2e/image.e2e.ts` checks the
  override banner.

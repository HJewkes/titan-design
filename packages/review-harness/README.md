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
   A sectioned round asks each question directly under the frames it names (`frames`); a
   question without `frames` sits above its section's other frames, and a Ship question reads
   last, under every frame. It shows one page at a time, a page being one section or every
   section of one PR group:
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
            [--tree <path>]                                   # required when a question binds a PR head
pnpm review <round-dir>/round.json [--storybook <url>] [--out <dir>] [--no-open] [--no-capture]
            [--contrast-override "<reason>"] [--allow-stale]
```

### Serve main's harness (TD-671)

The Storybook is the round tree's; the harness must be `origin/main`'s, or the owner reviews
on an old page. Before serving, `pnpm review` runs `git fetch origin main` and compares the
tree hash of its own `packages/review-harness` (`HEAD:./`) with `origin/main`'s, and checks
`git status` for uncommitted edits to tracked files there. It compares trees, not commits, so a
commit on main outside the harness does not trip it.

- **Equal, no uncommitted edits**: it serves.
- **Different, or edited but not committed**: it refuses (exit 2) before serving or rewriting
  anything. It prints the harness commits on main this checkout lacks, then the commands that
  serve main's harness against this round's Storybook URL and round file, from a detached
  checkout:

  ```sh
  git -C <repo> worktree add --detach "${TMPDIR:-/tmp}/titan-review-main-<hash>" origin/main 2>/dev/null ||
    git -C "${TMPDIR:-/tmp}/titan-review-main-<hash>" checkout --quiet --detach origin/main
  pnpm -C "${TMPDIR:-/tmp}/titan-review-main-<hash>" install --frozen-lockfile
  pnpm -C "${TMPDIR:-/tmp}/titan-review-main-<hash>" review <round-dir>/round.json --storybook <url> [your flags]
  ```

  `<hash>` is the first 12 hex digits of the SHA-256 of the round directory's absolute path, so
  each round gets its own checkout and the `checkout` fallback never moves files under a server
  for another round. Re-serving the same round reuses its checkout; check `uptime` before the
  install. Remove it with `git worktree remove` on the printed path when the review is done.
  `feedback.json` and the PNGs still land beside the round, because the round path is absolute.

- **`--allow-stale`** serves the different harness anyway. The terminal and a red banner at the
  top of the page both say it is behind main. Use it to test harness changes on their own
  branch (the e2es pass it); never for a round the owner reads.
- **Fetch fails** (offline, no remote) or the harness is not in a git checkout: it serves, and
  the terminal and the page banner say the harness was not checked against `origin/main`.

The CLI prints these commands rather than running them. The install takes minutes on a
monorepo, and a worktree is a lasting side effect that counts against the repo's worktree
budget, so it should be a step the agent sees and chooses.

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

The schemas live in [`@titan-design/review-schema`](../review-schema/README.md), which the harness
imports. Its `schema/round.schema.json` and `schema/feedback.schema.json` are generated from its
`src/schema.ts` (`pnpm --filter @titan-design/review-schema schema`; a test fails if they drift).

- Manifest `titan-review/round@2`: `unit`, `round`, `storybookUrl`, `context?`, `widths[]`,
  `height` (a number of px or `"auto"`, default `"auto"`; at round level a number caps every
  frame), `maxHeight` (default 1200, the cap when the round's `height` is `"auto"`),
  `variants[{key, storyId | image, label, args?, globals?, height?, variantUnit?, alternate?, change?: changed|new|removed|unchanged}]` (at most 12 in a round
  without `sections`, uncapped in one with them; empty for a round of questions only, which needs no placeholder
  frame; every frame sits in a section),
  `questions[{id, kind: pick-one|pick-many|scale|text, prompt, options | min+max, required?, scope?, optionVariants?, recommendation?, signsOff (pick-one), page?, merge? (pick-one), frames?[], decision?: iterate|ship|decide, outcomes? (option to accept|changes|neutral), implemented? (the option, or options for pick-many, the PR implements)}]`,
  `sections[{id, title, deciding, changed, context, kind?: CHOICE|STATES, questionIds[], variantKeys[], seeAlso?[], height?}]`,
  `prGroups?[{pr: owner/name#n, headSha, sectionIds[]}]` (a PR group named outright),
  `build?{mainSha, mergeSha}` (written by `build --tree`; a draft that carries it is refused),
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
  way: the server rewrites a `pick` of it to `revisionRequested` before validating or storing.
  The match is by that field, never by option text. Option text is unique across a round's
  pick-ones, so only one question can list a plain `"none"`; the rest use the built-in. A
  `revisionRequested` on a pick-one that offers neither is rejected. Everything else is unchanged and means what it always did.

- **A PR gets one page and one ship/no-ship question.** Any question may carry `page`, a PR key
  `owner/name#pr`; a question with no `page` sits on the general page. Each PR page carries exactly
  one required pick-one, "Ship owner/name#pr at <head12>?", with options exactly
  `["Ship", "Don't ship"]`, and only that question carries
  `merge: {repo, pr, headSha, ship: ["Ship"]}` (`headSha` is 40 lower-case hex). The design
  questions on the page carry no `merge`: they are feedback, not the merge decision. The schema
  refuses a bound question that is not required, has other options or another ship set, or whose
  `page` is not its own `repo#pr`; a PR bound by two questions (at one head or two); and a `page`
  naming a PR that has no ship/no-ship question. A ship option can never be the question's
  `revisionOption`: an option that requests a revision can never also approve a merge. A round
  without `merge`, `page` or `build` parses as before.

  ```json
  [
    {
      "id": "tb-icon",
      "kind": "pick-one",
      "prompt": "Where does the icon sit?",
      "signsOff": "the toolbar icon",
      "options": ["In the well, as built", "Bare above the title"],
      "page": "owner/name#123"
    },
    {
      "id": "tb-ship",
      "kind": "pick-one",
      "prompt": "Ship owner/name#123 at 0123456789ab?",
      "signsOff": "merging the toolbar",
      "options": ["Ship", "Don't ship"],
      "required": true,
      "page": "owner/name#123",
      "merge": {
        "repo": "owner/name",
        "pr": 123,
        "headSha": "0123456789abcdef0123456789abcdef01234567",
        "ship": ["Ship"]
      }
    }
  ]
  ```

## A round from Morning items (TD-680)

`titan-review round from-morning <items.json> [--decider <file>] [--out <draft.json>]` builds a
`round@2` draft from a seat's Morning items with no agent in the loop: the same items always
give the same draft. It writes `draft.json` beside the items file (never `round.json`, which
`build` owns) and prints the `build` command to run next. A draft that would fail the review
contract is refused with the field named, so nothing reaches `build` broken.

The items file is `titan-review/morning-items@1`:

```json
{
  "schema": "titan-review/morning-items@1",
  "unit": "widget-shop-morning",
  "round": 1,
  "storybookUrl": "http://127.0.0.1:6006",
  "widths": [1280],
  "context": "Shown at the top of the round (markdown).",
  "items": [
    {
      "id": "paint-1",
      "seat": "paint-seat",
      "morning": "1",
      "door": "two-way",
      "title": "Repaint the widget shelf in teal?",
      "body": "What the item is and why it reaches the owner (markdown).",
      "options": [
        { "label": "A: Teal", "proposal": "Repaint in teal this week. Pro: matches the lamps." },
        { "label": "B: Keep beige", "proposal": "Leave it. Pro: no paint cost." },
        { "label": "C: Defer", "proposal": "Decide after the lamps arrive." }
      ],
      "images": [
        { "key": "before", "file": "shots/before.png", "label": "Beige, today" },
        { "key": "after", "file": "shots/after.png", "label": "Teal, proposed" }
      ],
      "signsOff": "the shelf colour"
    }
  ]
}
```

- `unit` and `round` are the round's. `storybookUrl` (default `http://127.0.0.1:6006`), `widths`
  (default `[1280]`) and `context` are optional.
- Each item is one question and one section. `id` is the question and section id (letters,
  digits, `_`, `-`; at most 32). `seat` groups the items: sections follow the seats' order of
  first appearance, each seat's items together in file order. `morning` is the item's number on
  the seat's list and is optional. `door` is `one-way` or `two-way` and is said in the section's
  context. `title` is the question prompt (inline markdown only). `body` is the section's
  `changed` text.
- **Every option carries its proposal text.** `label` is the pick as the owner clicks it;
  `proposal` is what picking it proposes, with its reasoning, and must not be blank. The
  section's `deciding` lists each option as `**label** Proposed: proposal`, so an option is never
  a bare heading. A label two items share (seats reuse "C: Defer") is qualified with the item's
  id in every item, because options are a question's own under the contract.
- `images` are optional captures of the change, paths relative to the items file. They become a
  `STATES` strip of image variants, each declared `unmeasured` in light and dark; replace that
  with `measured` in the draft when a ratio is known. The draft must sit beside, or below, the
  items file so the paths stay inside its directory. An item with no images has no strip, and a
  round with no images has no variants at all. Variant keys are the round's, so a `key` two
  items share (every item's "before") becomes `<key>-<item id>` in each of them.
- `signsOff` is optional; the default names the seat, the Morning number and the title.
- Seat text (`body`, each `proposal`, the round `context`) is relabelled and repaired before it
  is written: a "Recommended default", "Recommend yes" or "Default:" label becomes "Proposed",
  "recommend" as a verb in a sentence becomes "propose", a table with no header row gets a
  blank one (a table that has one is left alone), and an orphan `**` on a line is dropped.
  Running it twice gives the same text. Code spans and fenced blocks are quoted verbatim.

The decider's answers are a separate file so they never sit in the seat's text:

```json
[
  {
    "questionId": "paint-1",
    "answer": "A: Teal",
    "rationale": "The lamps are warm and teal reads well under them.",
    "confidence": 0.7,
    "cite": "paint-notes section 2"
  }
]
```

`answer` is the item's own option label (before any qualification); `cite` says where the
reasoning is recorded and is appended to the rationale. Each becomes the question's
`recommendation` with `by: "decider"`, hidden until the owner answers (`after-answer`). An
answer that is not one of the options, or a `questionId` no item has, is refused.

## Contrast gate (TD-478)

`titan-review build <draft.json>` measures every story variant at every manifest width in
**light and dark** (the Storybook `theme` global; light is `.light` on `<html>`) in headless
Chromium, using the same renderer as capture. It writes `contrast.json` beside the draft and
writes the draft, with the builder rules below applied, to `round.json` only when nothing undeclared failed. Otherwise
it exits 3 and `round.json` is not written. A frame whose theme did not apply is an error,
never a pass.

`--tree <path>` names the checkout the Storybook was built from. A round in which any pick-one
carries `merge` needs it: without it, `build` exits 3 naming the bound questions. With it,
`build` reads the tree's `HEAD` and exits 3, naming each `repo#pr` and head, unless every bound
`headSha` is an ancestor of that `HEAD` (`git merge-base --is-ancestor`), so a ship pick never
names a head the Storybook did not render. On success `round.json` is the draft plus
`build: {mainSha, mergeSha}`: `mergeSha` is the tree's `HEAD`, `mainSha` its `origin/main`.
`contrast.json` records the sha of those bytes, so the round still serves. A rebuild at the same
heads rewrites `build` only. A round without bindings needs no tree.

### Builder rules (TD-768)

`build` rewrites the draft into `round.json` under these rules (`src/round-rules.ts`,
`src/ship-gate.ts`); applying them twice changes nothing.

- **Stable ids.** A question's id is the one the draft supplies and `build` never renumbers it.
  The ask's identity across rounds is its `ask:` topic: `ask:<repo>#<pr>/ship` for a Ship
  question (so it holds across units) and `ask:<unit>/<id>` for any other. Draft-supplied
  `topics` are kept. Keep the id for as long as the ask is the same ask.
- **Labels.** Every prompt starts `ITERATION: ` or `SHIP: ` (a pick-one with `merge` is SHIP) and
  carries `topic:iteration` or `topic:ship`.
- **Stacked PRs.** A draft's `stackedOn` is written through. When no question is about the base
  PR, every frame in the base PR's sections is labelled `base PR #n, not under review: <label>`.
- **Stacked PR groups.** A `prGroups` entry's own `stackedOn` is written through, so groups in one
  round can render on different bases. When no question is about a group's base, each frame in
  that base's sections gets the prefix `rendered on #n at <short sha>, context, not under review: `
  on its label. A base named by a group and by the round takes the group's prefix.
- **Ships after.** On the page, the Ship of a group stacked on another group of the round reads
  `ships after #n`, and is disabled, naming the holder, while the holder's Ship is answered Don't
  ship or asks for a revision. The cross-round Ship gate below ignores the holder: a holder's
  answer orders one round and does not refuse its dependent's Ship in the next.
- **Grouping.** A section belongs to a PR by the `prGroups` entry that lists it, else its
  questions' `page`, else a leading `#n` or `owner/name#n` in its title. Each PR's sections sit
  together, at the first one's place, the section holding its Ship question last, and the Ship
  question last in that section. The page shows each such group as one page and never splits one.
- **Layout lint.** The ruled round must pass `lintRound` from `@titan-design/review-schema`, or
  `build` throws with one `<rule>: <message>` line per problem: a deciding question without
  `frames`, a frame outside its question's section or under two questions, a variant unit split
  across blocks or alternates, alternates shown over different modes, a split PR group, a Ship
  that is not last in its group, a Ship whose head or PR is not its group's one PR at one head, or
  an `iterate` or `decide` pick question without `implemented`.
- **Ship gate.** `build` exits 3, writing no `round.json`, for a Ship question whose PR had a
  changes-requested (`revisionRequested`), declined (a pick outside `merge.ship`) or non-agreed
  (`agreed: false`) answer in the latest earlier round that asked about it. It reads
  `feedback.json` beside a `round.json` (whose sha it must match) in sibling round directories of
  the same unit with a lower round number, and any `--prior-feedback <feedback.json>` given. A Ship
  bound to a different head than that round's is a fix round's and is not blocked. The same gate
  refuses on the owner's Ship rule (`shipBlocks` in review-schema): an answer in the PR's group
  carries free text, or picks other than the question's `implemented` option. The page applies
  the rule live: a blocked group's Ship option is disabled and the reasons show under it.

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

## Static frames (TD-752)

`build` also renders every story frame of a passing round to static PNGs, so a round can be
read somewhere no Storybook is running (the console's rounds view). They land beside the round:

```
<round-dir>/frames/<width>-<key>-<story-name>.png   one per story variant per width
<round-dir>/frames/frames.json                      the index (titan-review/frames@1)
```

The file name is the same one the post-submit capture writes, so a frame has one name in both
places. `frames.json` lists `unit`, `round`, `storybookUrl`, the `manifestSha256` of the
`round.json` the frames were rendered for, and one record per frame: `key` (the file stem),
`variant`, `storyId`, `theme` (`light` or `dark`, as it applied on `<html>`), `viewport`
(`{width, height}`), `file` (relative to the round directory) and `sha256` of the PNG. A variant
whose `globals.theme` did not apply is an error, never a frame in the other theme. Image
variants are already static files beside the round and are not copied. Frames are rendered
only when the contrast gate passes, after `contrast.json` and before `round.json`; a refused
build writes none. A render is staged in a sibling directory and swapped in for `frames/`
only when every frame passes, so a failed render (a theme that did not apply, a story that
throws, a browser that dies) leaves the previous frames and `frames.json` exactly as they
were, and a successful one leaves no file an earlier render wrote.

The renderer is the harness's package-local subpath export (the harness is `private`, so the
export resolves inside this workspace, not from npm):

```ts
import { renderFrames } from '@titan-design/review-harness/frames'

const index = await renderFrames(manifest, 'http://127.0.0.1:6100', {
  roundsDir: '/path/to/rounds', // frames go under <roundsDir>/<roundId>/frames/
  roundId: 'td-752-fixture',
  manifestSha256, // optional, recorded in the index
})
```

`manifest` is a parsed `round@2` (`RoundSchema` or `ManifestSchema` from
`@titan-design/review-schema`). No server is started: the renderer needs only a Storybook on a
loopback host (any other host is refused before anything is read) and headless Chromium at 2x,
the same shooter as the post-submit capture. The contrast gate shares its story loading
(`renderStory`, `STORY_ROOT`) but opens its own 1x page. It refuses a story the Storybook does
not serve before a browser opens, naming each missing id. `frameKey(variant, width)` gives a
frame's stem, `framesDir(roundsDir, roundId)` its directory, and `readFramesIndex(dir)` reads
an index back. The `open` and `storyIds` options inject the browser and the story list for
tests. Errors are `FrameRenderError`, which the CLI reports as a usage error (exit 2).

## Calibration

`titan-review calibration <feedback.json...>` reads feedback files and prints how often the
owner's answer matched the recommendation: one row per round, the overall rate, and the rate
per confidence band (`<0.5`, `0.5-0.75`, `>=0.75`). An answer counts only when it has both a
recommendation and an owner's answer.

## Lock footprint (TD-808)

`titan-review locks footprint <pr>` prints what a PR head changes, as the `footprint` of a
`titan-locks/1` lock (`LockFootprintSchema` in review-schema). It reads through `gh` and `git`
only and writes nothing; the registry is never touched.

```sh
pnpm review locks footprint 800                     # gh pr view, then fetch base and refs/pull/800/head
pnpm review locks footprint --base origin/main --head <sha>   # offline: no gh, no fetch
            [--repo <path>]                         # the checkout to read (default: this one)
```

The diff is `merge-base(base, head)..head`; `derivedFrom` records both shas, `mainSha` being
the merge-base. The output has:

- `tokens`: every custom property of `packages/ui/src/theme/global.css` whose value differs,
  per mode. The `:root` block is `dark` and the `.light` block is `light`; a token that moves in
  one mode only is listed once. `name` is the token: `surface-raised` for
  `--color-surface-raised`, and the property without its dashes for any other
  (`space-inset-md`). `from` and `to` are the CSS values; an added token has only `to`, a
  removed one only `from`. Comments and spacing never count as a change.
- `files`: every changed path, sorted.
- `components.direct`: the changed files that are component sources, that is `.ts` or `.tsx`
  under `packages/ui/src/components/` that are not tests, type tests, stories, snapshots or type
  stubs.
- `components.readers`: every other component source that reads a changed property, plus every
  source that imports a `direct` file, transitively (wrapped import clauses included). The
  import closure is keyed by file, so two components that share a name never merge.
- `components.rendersCount`: the size of the reverse import closure over `direct` and
  `readers` together, which is where frames render.

**What counts as a read.** The classes come from the head's `packages/ui/tailwind.config.js`,
not from a guess: the command loads the config in a bare sandbox (`require` returns an empty
object, so presets and plugins never load) and takes every `theme` and `theme.extend` entry whose
value reads a `var(--…)`, `DEFAULT` keys and entries built in code included. Each entry gives a
class stem under its theme key, and the theme key gives its Tailwind utilities, so
`--color-hairline-default` is read by `border-hairline` or `divide-hairline`, `--space-inset-md`
by `p-inset-md`, `gap-inset-md` or `-mt-inset-md`, and `--size-control-md` by `h-control-md` or
`min-h-control-md`, each under any variant prefix (`web:hover:`, `[.light_&]:`). A stem never
matches a longer one (`text-secondary` and `text-brand-secondary`; `border-hairline` and
`border-hairline-subtle`). Two more forms count: a raw `var(--property)` anywhere in the source,
and, for a colour, the token name as a string literal (`resolveColor('surface-raised')`). A head
without the config is refused, since readers would be silently incomplete.

Limits that remain: a token composed at runtime (`` `bg-${tone}` ``, a name built from parts) is
not found; a theme key the utility table does not know (`src/tailwind-theme.ts`) is matched by
any utility, which over-reports rather than under-reports; and only
`packages/ui/src/components/` is read, so a change under `src/hooks`, `src/utils` or `src/theme`
shows in `files` and `tokens`, not in `direct`, and reaches no component through the closure.

The core is pure (`src/locks-footprint.ts`, given both CSS texts, the theme entries, the changed
paths and a map of sources) and the tests run on fixtures under `test/fixtures/locks/` with git
and gh faked; `test/tailwind-theme.test.ts` also reads the real config, so a config shape the
loader cannot follow fails there first.

## Lock check (TD-814)

`titan-review locks check` is the dispatch check: before a seat spawns an implementer, it gives
the planned files and tokens and gets an exit code and advice to paste into the brief.

```sh
pnpm review locks check --registry <locks.json> \
  --files 'packages/ui/src/components/ui/select/**' --tokens surface-base/light,text-secondary
```

`--files` takes paths or globs (`**` crosses directories, `*` and `?` do not); `--tokens` takes
`name/light`, `name/dark`, or a bare name for both modes. Both are comma-separated and
repeatable. Only `open` locks count. A lock's surface is its footprint's `files` and
`components.direct`, its `touches.components`, and the tokens of both; a lock's token may name a
family (`*-subtle`, `tint-{hue}-solid / on-tint-{hue}`).

| exit | verdict    | when                                                                                                                                         |
| ---- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 0    | `clear`    | no open lock's surface is touched. A plan that edits only a lock's `components.readers` is clear, with a note that it renders under the lock |
| 10   | `stack-on` | every lock touched has holders, and they are all one PR: the advice names its branch and head                                                |
| 11   | `defer`    | a touched lock has no holder, or the touched locks are held by different PRs                                                                 |

A lock with no holder is a decision only. The plan defers on it and the advice says not to
re-ask the decision; if the task is the one that implements it, file it as the lock's holder.
For example:

```text
Stack on #101 (branch feat/planes, lock L-0001): branch from feat/planes at aaaaaaa and open the
PR with --base feat/planes; it retargets to main when #101 merges. Overlap: L-0001 on tokens
text-secondary/light.
```

`--json` prints the verdict, the holder, the conflicts and render overlaps, and the advice. A
usage error (no plan, a bad mode, no registry) exits 2. The pure core is `src/locks-check.ts`.

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
- **A question sits under its own frames (TD-794).** `frames` on a question names the variant
  keys it asks about. The page renders those frames, then the question, as one block, so a
  decision is never read away from what it decides. A section reads top to bottom: questions
  without `frames`, the strip of frames no question names, each question under its `frames`,
  then the section's Ship question. Every key in `frames` must be a frame of the question's own
  section, and a frame sits above one question only; `lintRound` refuses anything else, naming
  the question, the frame and the section it is in. A STATES strip may hold a question that
  picks among its own `frames`, and a CHOICE strip holds settings constant within each
  question's `frames` (then among the frames no question names), not across the whole strip.
- **Sections page a big round (TD-343, TD-794).** A round without sections shows every frame on
  one page and is capped at 12 variants. A round with sections shows one page at a time and is
  not capped: frames mount only as they near the viewport, so the round's size does not bound
  what is on screen. (The old cap of 80 was sized for one Gate 2 batch, not a limit of the page.)
  Consecutive sections about one PR (by their questions' `page`, else a leading `#n` in the
  title, as the builder groups them) share a page, so a PR's frames, its picks and its Ship are
  read together. The page order is those pages, then "Other frames", then "Overall" with the
  general note.
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

- `pnpm --filter @titan-design/review-harness test`: schemas, feedback building, the harness
  freshness gate (git mocked; equal, behind and offline), the
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

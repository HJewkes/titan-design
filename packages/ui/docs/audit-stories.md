# `pnpm audit:stories`

Renders the stories a diff touches in a real browser and checks each rendered frame's layout.
jsdom has no layout, so none of this can be a Vitest test. The command lives in
`scripts/audit-stories.mjs` and `scripts/audit-stories/`, and is not published.

```bash
pnpm audit:stories [--base <ref>] [--stories <id,...>] [--all] [--dependents]
                   [--widths 360,768,1280] [--themes dark,light] [--touch]
                   [--out <dir>] [--url <loopback url>]
```

## What it checks

Every target story is rendered at each width in each theme. Each frame gets the checks below.
A **blocker** fails the run (exit 1). A **warning** is reported and never fails it.

### Blockers

| Kind             | Meaning                                                                                                                                                                                       |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `overflow`       | A box leaves the viewport (or its fixed-width story frame), the page scrolls sideways, or content is cut by an `overflow: hidden` box. Content inside a horizontal scroller is exempt.        |
| `clipped-text`   | Text needs more room than its box or a clipping ancestor gives it.                                                                                                                            |
| `truncated-text` | Text is ellipsised or line-clamped and the full text does not fit.                                                                                                                            |
| `text-overlap`   | Two text boxes overlap.                                                                                                                                                                       |
| `hit-target`     | An interactive element is under 24x24px and closer than 24px to another target (WCAG 2.5.8). With `--touch` the minimum is 44x44px and spacing no longer excuses it. Inline links are exempt. |
| `contrast`       | An axe `color-contrast` failure where at least one colour is not a titan token.                                                                                                               |
| `render-error`   | The story threw, logged a console error, rendered an empty root, or failed to load (after one retry). It comes from the capture step, not the page checks, and makes the exit code 2.         |

### Warnings

| Kind                   | Meaning                                                                                                                                                                                                                                                                                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `story-frame-overflow` | A story's own fixed-width frame (inline `style.width`) is wider than the viewport. The content inside is then audited against the frame, not the viewport.                                                                                                                                                                                                                                              |
| `small-text`           | Text under 11px.                                                                                                                                                                                                                                                                                                                                                                                        |
| `off-scale-spacing`    | Padding, margin or gap that is not on the spacing scale read from `tailwind.config.js`. 1px hairlines are on scale.                                                                                                                                                                                                                                                                                     |
| `theme-geometry-shift` | An element's box differs by more than 1px between dark and light. Only the outermost shifted box is reported.                                                                                                                                                                                                                                                                                           |
| `stacked-inset`        | Padding on a box that paints nothing widens the visible gap between two siblings by 4px or more (`ink gap = layout gap + paddingBottom 12px on <selector>`). Exempt: interactive boxes (the padding is a hit target), painted boxes (the padding shows), and a stack where every gap carries the same hidden padding (rhythm).                                                                          |
| `edge-clearance`       | Text or a replaced element (`img`, `svg`, `canvas`, `video`) sits closer to the inside edge of its painted surface than the surface's declared padding by 1px or more, or sits under 4px from an edge declared with no padding. Glyph ink is measured, so a pill with `line-height: 1` and a 2px inset is fine. The surface is the nearest ancestor that paints a background or border, never an `svg`. |
| `inset-asymmetry`      | A painted surface with equal padding on two opposite sides whose content fills 80% of that axis sits more than 2px nearer one side (a row whose last cell stops short). Across is measured on ink, down on layout boxes. A short label never triggers it.                                                                                                                                               |

`contrast-token` is a separate finding list, `contrast_token`, not a blocker: a contrast failure
where both colours are titan tokens is a token-pair question, not a story defect. It is counted in
the summary line but never fails the run.

At most 25 findings per kind are kept per frame.

## Reading `dom.json`

`dom.json` sits in the output directory next to one PNG per frame (`<story id>/<width>-<theme>.png`).
The summary prints at most 30 lines and groups repeated blockers, so read the file, not only the
printed lines. The PNGs show what geometry cannot measure; look at them too.

`{ "stories": [...] }` holds one entry per story, width and theme:

- `id`, `title`, `width`, `theme`, `touch` (`on`, `minTarget`): which frame this is.
- `rendered`: `false` means the story did not render; `error` says why.
- `blockers`, `warnings`, `contrast_token`: arrays of `{ kind, selector, detail }`. `selector` is a
  short path from `#storybook-root` (a `data-testid` when one exists); `detail` carries the measured
  numbers, such as the box that left the viewport and by how far.
- `metrics`, `axe.violations`: raw page metrics and the axe contrast result.
- `shot`: the PNG, relative to the output directory.

## Fixing findings

- Fix at the cause. Find the element that is too wide or too tight and change it.
- Never hide an overflow with `overflow-hidden`. It turns `overflow` into `clipped-text`, and the
  content is still lost.
- Truncating a primary title is always a defect, even when the check cannot tell.
- Do not delete a story to clear a finding.
- Fix `off-scale-spacing` unless it is chart geometry, and fix `theme-geometry-shift`.

### Two-loop limit

Audit, then fix (loop 1). Audit again, then fix what remains (loop 2). A third audit may record
the final state, but start no third fix loop. Report each remaining blocker with its story, width,
theme and the reason it remains.

## Targeting

Without `--stories` or `--all`, the targets come from the diff against `--base` (default
`origin/main`): committed changes, working tree changes and untracked files.

- A changed `*.stories.tsx` targets itself. Any other changed file under `src/` targets every story
  in its own directory.
- `--dependents` adds the stories of components whose `dependsOn` in `src/arch/arch-graph.json`
  names a changed component, one level only.
- A change under `src/theme/`, `tailwind.config.js` or `.storybook/` touches every story, so the
  command refuses and asks for `--stories` or `--all`.
- More than 40 targets refuses without `--all`.
- No target at all (a `src/hooks/` change, say) exits 1 and lists the changed files, so a silent
  no-op cannot pass as clean. Name the stories with `--stories`.

| Flag                 | Default        | Effect                                                             |
| -------------------- | -------------- | ------------------------------------------------------------------ |
| `--stories <id,...>` | from the diff  | Audit exactly these story ids.                                     |
| `--all`              | off            | Audit the whole catalogue and lift the 40-story cap.               |
| `--widths <list>`    | `360,768,1280` | Integers from 200 to 4000.                                         |
| `--themes <list>`    | `dark,light`   | Any of `dark`, `light`.                                            |
| `--touch`            | off            | Adds a 320 width and holds hit targets to 44px.                    |
| `--out <dir>`        | under `TMPDIR` | Output directory; must be outside the repo.                        |
| `--url <loopback>`   | start our own  | Reuse a Storybook you already run. The command then stops nothing. |

## Exit codes

| Code | Meaning                                                                                                |
| ---- | ------------------------------------------------------------------------------------------------------ |
| 0    | Clean. Warnings are allowed.                                                                           |
| 1    | Blockers remain, or the diff touches no story.                                                         |
| 2    | A story failed to render. Fix this first; it wins over exit 1.                                         |
| 64   | Usage error, targeting refusal (theme or config change, over 40 stories) or Storybook failed to start. |
| 70   | Unexpected error.                                                                                      |
| 130  | Interrupted by SIGINT, SIGTERM or SIGHUP, after the Storybook it started was stopped.                  |

## Load and port rules

- **It starts its own isolated Storybook.** It runs `scripts/storybook-launch.mjs --isolated`,
  which takes a port from 6100 to 6199 and passes `--exact-port`. Port 6006 is never used or
  touched, so another session's Storybook is safe. Do not start a Storybook for it.
- **It stops only what it started.** Stopping signals the launcher's process group by PID
  (SIGTERM, then SIGKILL after 5s), on success, on error and on interrupt. Nothing is killed by
  name. The run also checks that the process listening on the port belongs to its own group, so it
  cannot audit another tree's server.
- **`--url` stops nothing.** It must be an `http` loopback URL. Use it to point at a server you
  already run.
- **Output stays out of the repo.** It goes to `$TMPDIR/titan-audit-stories/<short sha>/run-<n>/`,
  or `--out`. With `TMPDIR` unset and no `--out` it refuses.
- **Load is bounded.** One Chromium, at most three pages at once, one retry per failed render.
  Budget about 20s to start Storybook and about 6s per story. Narrow with `--stories` rather than
  reaching for `--all`.

`pnpm storybook:ports` lists the servers running; the run leaves none rooted in its tree.

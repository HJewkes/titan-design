# VW-397 Storybook light mode, evidence

The Storybook theme toggle (`withThemeByClassName`) only set `.light` on `<html>`.
That moves the CSS-variable tokens, but `Surface`, `Card` and on-surface text resolve
literal hex from `SurfaceContext`, whose runtime default is dark. Light mode therefore
painted dark planes under dark text. `.storybook/withSurfaceTheme.tsx` now provides
`SurfaceContext` from the `theme` global. `SurfaceContext.ts` is unchanged.

All captures use `iframe.html?id=<story>&globals=theme:light`.

| File                                       | Tree                                   | What it shows                                                                                                          |
| ------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `before-main-bodyweightgoalcard-light.png` | main at a113334                        | `<html class="light">`, card plane rgb(44,42,40) (dark `raised`), figure text rgb(18,24,40): dark text on a dark card. |
| `after-bodyweightgoalcard-light.png`       | this branch                            | Same story. Card plane rgb(249,246,243) (light `raised`), dark text reads.                                             |
| `after-goals-whole-body-light.png`         | this branch                            | `Pages/Goals/Whole body` Default: hero, per-lift and whole-body cards all on light planes.                             |
| `after-chat-coachpreset-phone-light.png`   | scratch merge of #247 with this branch | VW-393 `Custom/Chat/CoachPreset` Phone: bubbles, check-in card and composer on light planes.                           |

Provenance: the Chat capture came from a server whose index lists `custom-chat-*`
stories, which exist only on #247. The other captures came from this worktree's server.

## Still dark in light mode (not this fix)

`ZoneTrack` paints its track `greyRamp[800]` (`DEFAULT_TRACK_COLOR`) in both modes. It
shows as the dark bar in the bodyweight card. It is a component bug, not a context bug.

# Alert API note

Source: VW-31 audit (slice S1). This note records what `ui/alert` covers today, how nine alert-shaped
candidates map onto it, and the additive API delta that closes the gaps. It changes no component code.
Each candidate was read at its source before it was listed here.

## Pending owner

These questions are open. Each carries a recommended default that the slices assume until the owner answers.

| #   | Question                                                                                                                                               | Recommended default                                                                                                                                 | Status        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Q1  | Name the six-colour prop by widening `status`, or add a `color` prop per the props table in `CLAUDE.md`?                                               | Widen `status`. It is additive, keeps every caller and test, and the six values match `ButtonColor`.                                                | pending owner |
| Q2  | Should a deload get its own Alert colour? `status-deload` has no `-subtle` or `on-` pair, so it needs new tokens, and token files are frozen.          | No. Deload uses `warning`. Revisit once the token freeze lifts.                                                                                     | pending owner |
| Q3  | Add glyphs titan lacks (thumbs up/down, lightbulb, sparkles, check, close) for the coaching-cue and insight patterns?                                  | No new icons. Reactions are text buttons ("Helpful" / "Not for me"). Insight uses `InfoIcon`. Alert keeps its unicode default glyphs.               | pending owner |
| Q4  | Thin the per-state Alert stories to `Default` plus controls now (roadmap E4.7)?                                                                        | Yes, inside the pattern-stories slice, since that slice already edits the stories file and the owner reviews it.                                    | pending owner |
| Q5  | Migrate the seven candidates inside the legacy mobile app?                                                                                             | No. The app pins an old titan release and is parked. Its screens adopt the patterns when they port.                                                 | pending owner |
| Q6  | Move the live-page `AlertCue` onto titan Alert? Its wash and border change from 14% / 45% `alpha()` blends to the `status-*-subtle` wash and hairline. | Yes. The `CompactLiveCue` story already names this cue as its consumption target. The icon-only mode stays local.                                   | pending owner |
| Q7  | Render the unrendered dashboard banners (banner read-model, disconnect banner) with Alert? Their `attention` tone has no titan colour.                 | Out of VW-31 scope. File a separate task that renders the top banner as Alert, maps `attention` to `primary`, and puts the destination in `action`. | pending owner |

## 1. What Alert covers today

`Components/Molecules/Alert`, tagged `status:stable`. Source: `Alert.tsx` in this directory.

| Capability     | Today                                                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `status`       | `success`, `info`, `warning`, `error`. No `primary` or `secondary`, so brand-tinted insight and suggestion surfaces cannot be expressed. |
| `variant`      | `subtle` (wash), `outline` (2px status border), `solid` (fill plus on-colour).                                                           |
| `size`         | `default` (padded block) and `compact` (one-line cue pill, hairline border on `subtle`). `compact` absorbed the R2 `CueFlag`.            |
| Content        | `message` (status-coloured one-liner), `children`, `AlertTitle`, `AlertDescription`.                                                     |
| Icon           | Unicode default glyph per status, `icon` override, `showIcon`.                                                                           |
| Dismiss        | `onClose` renders a `×` button labelled "Close alert". No text dismiss.                                                                  |
| Action         | None. A button or reaction row must be hand-placed in `children`, which stacks it under the text.                                        |
| Eyebrow / kind | None.                                                                                                                                    |
| Role           | `accessibilityRole="alert"` is set before the `...props` spread, so a consumer can already override it. Nothing documents or tests that. |
| Type exports   | `Alert.tsx` exports `AlertSize`, but `index.ts` re-exports only `AlertStatus` and `AlertVariant`.                                        |
| Stories        | `Default` with controls plus 13 other stories (roadmap E4.7 thinning target).                                                            |

## 2. Candidate audit

"Covered" means today's Alert already expresses it. A slice name (S2 to S4, S7) means the mapping needs that slice.
Seven candidates live in the legacy mobile app (`voltras/mobile/src/components/`, a parked repo that pins
`@titan-design/react-ui ^0.6.0`). `AlertCue` lives in the `voltras-mcp` dashboard. Neither repo is edited here.

| Candidate          | Where it lives                                                                            | What it renders                                                                                                                                                                            | Verdict                                                                                                                                                                                                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BLEWarning         | `device/BLEWarning.tsx`, used by `device/DeviceConnectionCard.tsx`                        | Warning glyph, title ("Simulator Detected" or "Expo Go Detected"), message, on an 8% warning wash from `alpha()`.                                                                          | Maps, covered today: `status="warning" variant="subtle"` with `AlertTitle` and `AlertDescription`. The title choice stays in the consumer.                                                                                                                                                                                                    |
| DeloadBanner       | `analytics/dashboard/DeloadBanner.tsx`, used by `screens/AnalyticsDashboard.tsx`          | `Card` around a 6% warning wash: bed icon, title, message, two stat pills (volume, duration). Calls its own deload planner and renders null when no deload applies.                        | Maps, works today in `children`: `status="warning"`, title, description, two `Pill`s. The host `Card` goes. Excluded: the deload decision logic (consumer) and a dedicated deload colour (Q2).                                                                                                                                                |
| JunkVolumeAlert    | `exercise/JunkVolumeAlert.tsx`, used by `screens/exercise/WorkoutView.tsx`                | Error or warning wash chosen by an `isJunkVolume` flag, stop-circle or trending-down icon, title, a metrics line (rep drop %, velocity recovery %).                                        | Maps, covered today: `status="error"` or `"warning"`, `icon` of `CircleSlashIcon` or `TrendingDownIcon`, `AlertTitle`, `AlertDescription`.                                                                                                                                                                                                    |
| LoadSuggestionCard | `exercise/LoadSuggestionCard.tsx`, used by `screens/exercise/WorkoutView.tsx`             | `Card` with a direction-coloured wash (success, warning, brand), arrow icon, headline ("Increase to N lbs"), coloured delta, reason, confidence chip.                                      | Maps with S2 and S3: `status` success, warning or `primary`; icon `TrendingUpIcon`, `TrendingDownIcon` or `EqualIcon`; headline in `AlertTitle`; delta and reason in `AlertDescription`; confidence `Pill` in the `action` slot.                                                                                                              |
| CoachingCueCard    | `coaching/CoachingCueCard.tsx`, used by `screens/exercise/WorkoutView.tsx`                | Slide-in animated `Card`, 12% wash by cue type (brand, warning, success), type label, close button, message, "Suggested" load chip, thumbs-up and thumbs-down buttons, timed auto-dismiss. | Maps with S2, S3 and S4 (coaching-cue pattern): `status` primary, warning or success; `eyebrow`; `message`; `Pill` for the load; reactions as `Button`s in `footer`; `onClose`. Excluded: the entrance animation and the auto-dismiss timer (consumer). Thumbs glyphs do not exist in titan (Q3).                                             |
| ContextualTooltip  | `ui/ContextualTooltip.tsx`, exported from `ui/index.ts`; no JSX call site found in mobile | Brand 10% wash with a 20% brand border, bulb icon, title, body, "Got it" text dismiss. Marks a milestone as seen through a preferences store.                                              | Maps with S2, S3 and S4 (inline-insight pattern): `status="primary" variant="subtle"`, `AlertTitle`, `AlertDescription`, `onClose` with `dismissLabel="Got it"`. It is a callout, not a tooltip, so it does not map to `ui/tooltip`. Excluded: the seen-once persistence (consumer). No bulb icon in titan; the pattern uses `InfoIcon` (Q3). |
| SuggestionCard     | `exercise/SuggestionCard.tsx`, used by `screens/SimpleExerciseScreen.tsx`                 | `Card` on a 7% brand wash: sparkles icon and "SUGGESTED" eyebrow, exercise name, history or reason line, solid brand "Start" button. Near-duplicate of an auto-plan card.                  | Maps with S2, S3 and S4 (suggestion pattern): `eyebrow`, `AlertTitle`, `AlertDescription`, `action` holding `Button size="sm" color={status}`, offered for every value of the widened `status`.                                                                                                                                               |
| CueFlag            | Absorbed into `ui/alert` (the R2 cue pill)                                                | Velocity-loss threshold cue pill.                                                                                                                                                          | Maps, shipped: `size="compact"` with `message`.                                                                                                                                                                                                                                                                                               |
| AlertCue           | `voltras-mcp`, `src/dashboard/spa/live-page/LiveControlsRow.tsx`                          | Hand-rolled live verdict cue: `alpha()` wash (14%) and border (45%) by verdict (productive, threshold, stop), contextual icon, verdict and message. Sheds to compact, then icon-only.      | Maps in S7 (Q6): `full` and `compact` modes become `<Alert size="compact">` with verdicts mapped to success, warning, error. Excluded: the icon-only mode, which has no Alert equivalent and stays local.                                                                                                                                     |

Also seen, not candidates: a mobile velocity warning with the same icon, severity and message shape is covered by
today's Alert and needs no action. The dashboard's pace-suggestion caption is plain secondary text waiting on a
`SessionRail` footer slot, so it is excluded.

## 3. Proposed API delta

Every addition is an optional prop. No existing prop changes meaning and every existing test stays as is. Every
class named below already exists in `tailwind.config.js`. The delta adds no token, palette entry, primitive or icon,
makes no `alpha()` call, and edits neither `theme/tokens/semantic.ts` nor `theme/global.css`.

### 3a. Semantic colours (S3, gated on Q1)

`AlertStatus` becomes `'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error'`, the same six names as
`ButtonColor`, so an `action` button can take `color={status}`. The default stays `info`. The new rows reuse existing
tokens:

| Key       | subtle                      | outline                                          | solid                | onSolid                   | border, icon, text  | subtleText                       |
| --------- | --------------------------- | ------------------------------------------------ | -------------------- | ------------------------- | ------------------- | -------------------------------- |
| primary   | `bg-brand-primary-subtle`   | `border-2 border-brand-primary bg-transparent`   | `bg-brand-primary`   | `text-on-brand-primary`   | `*-brand-primary`   | `text-on-brand-primary-subtle`   |
| secondary | `bg-brand-secondary-subtle` | `border-2 border-brand-secondary bg-transparent` | `bg-brand-secondary` | `text-on-brand-secondary` | `*-brand-secondary` | `text-on-brand-secondary-subtle` |

`Pill` already pairs `bg-brand-*-subtle` with `text-on-brand-*-subtle`, so the contrast pairing has precedent.
The default glyph for both new statuses is the info glyph.

### 3b. Slots, action and dismiss (S2)

| Prop           | Type        | Behaviour                                                                                                                                                     |
| -------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `eyebrow`      | `ReactNode` | Above the title or message, rendered through `ui/eyebrow` in the status text class for the variant. Holds consumer wording ("Suggested", "Insight", "Coach"). |
| `action`       | `ReactNode` | Trailing slot, vertically centred, after the content and before dismiss. Intended for one `Button size="sm"` or a `Pill`.                                     |
| `footer`       | `ReactNode` | Below the content block, full width of the content column. For reaction rows or secondary actions.                                                            |
| `dismissLabel` | `string`    | With `onClose`, renders a `Button variant="link" size="sm"` with this text (for example "Got it") instead of `×`. Without `onClose` it does nothing.          |
| `AlertSize`    | type export | Add to `index.ts`, where it is missing today.                                                                                                                 |

Role: `accessibilityRole="alert"` stays the default. S2 documents and tests that a consumer override wins, so a
non-urgent suggestion or insight can pass `accessibilityRole="summary"` and avoid interrupting a screen reader.

Structure: `Alert` is already past the 30-line guideline. S2 extracts private `AlertGlyph`, `AlertContent` and
`AlertDismiss` helpers inside `Alert.tsx`. The exported surface does not change.

### 3c. Patterns (S4)

Patterns are stories on `Components/Molecules/Alert` with `status` and `variant` as controls. They add no component
and no file outside `ui/alert/`.

| Pattern        | Composition                                                                                                                             | Absorbs                            |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Suggestion     | Any of six `status`, `subtle`, `eyebrow`, title, description, `action` with `Button size="sm" color={status}`, role `summary`.          | SuggestionCard, LoadSuggestionCard |
| Inline insight | `status="primary"`, `subtle`, `InfoIcon`, title, description, `onClose` with `dismissLabel="Got it"`, role `summary`.                   | ContextualTooltip                  |
| Coaching cue   | `status` primary, warning or success, `eyebrow`, `message`, optional `Pill` in `children`, `footer` with two text `Button`s, `onClose`. | CoachingCueCard                    |

The existing compact cue stories stay. They already document the live-cue pattern (CueFlag, AlertCue).

## 4. Slices

S1 is this note. S2 (slots), S3 (colours, waits on Q1) and S4 (patterns, stories, README row) follow on the same
branch. Each titan slice must leave `theme/tokens/semantic.ts`, `theme/global.css` and
`utils/colors.alpha-adoption.test.ts` untouched.

# Component catalog

Generated from `src/arch/component-catalog.json` by `pnpm catalog`. Do not edit by hand.

| Name | Status | Family | Purpose | Composes | First story |
| --- | --- | --- | --- | --- | --- |
| ActiveWorkoutPage | review | custom/Workout | ActiveWorkoutPage — the during-workout screen, built as a zoom hierarchy over `ExerciseCard`s. | ExerciseCard, InputBar, RestTimer, SetRow, SupersetWrapper | pages-active-workout--all-collapsed |
| Alert | stable | ui/alert | Alert component for displaying status messages. | — | components-molecules-alert--all-statuses |
| AppShell | candidate | shell | `AppShell` — the generic dashboard chrome: a {@link TopBar} band over a {@link SideNav} rail and a `children` content region. | SideNav, Surface, TopBar, brands | pages-appshell--audiobook-app |
| Autocomplete | stable | ui/autocomplete | Autocomplete component for searchable dropdown selection. | Surface | components-molecules-autocomplete--custom-no-results-text |
| Avatar | stable | ui/avatar | Avatar component for user/entity representation. | — | components-atoms-avatar--all-sizes |
| Badge | stable | ui/badge | Badge — a `Pill` preset for status indicators and labels. | Indicator, Pill | components-atoms-badge--all-colors |
| BaseBadge | review | custom/Workout | — | — | custom-workout-basebadge--all-variants |
| BodyMap | review | custom/Workout | Interactive SVG body map with tappable muscle groups and a volume heatmap. | — | custom-workout-dataviz-bodymap--back |
| BodyMapDetailPanel | review | custom/Workout | Sheet of detailed weekly-volume info for a tapped muscle group: a MEV\|current\|MRV gradient progress bar, the big weekly set count against MRV, an optional volume sparkline, the per-exercise strength / this-week plan / PR sections, and the contributing / upcoming exercise lists. | Badge, BodyMapDetailSections, Sparkline | custom-workout-dataviz-bodymapdetailpanel--default |
| BodyweightGoalCard | review | custom/Workout | A bodyweight goal on `#/goals`: the latest weight, its rate this week beside it ("Rate: -0.6%/wk", or "Rate: N/A" before there is one; the bands sit in the tip), then the weigh-in against this week's band in the goal chart's own band colour. | GoalTrajectoryBand, StatCard, Typography, ZoneTrack, wholeBodyCardParts | custom-workout-goals-bodyweightgoalcard--default |
| BrandLockup | candidate | shell | Product identity lockup for the top bar: mark + wordmark + optional subtitle. | Typography, brands | shell-brandlockup--brand-variants |
| Breadcrumbs | stable | ui/breadcrumbs | Breadcrumbs navigation component. | — | components-molecules-breadcrumbs--custom-separator |
| Button | stable | ui/button | Button component following compound component pattern. | — | components-molecules-button--all-colors |
| CapacityBandChart | review | custom/Workout | Gentler-Streak-inspired fatigue visualization. | — | custom-workout-dataviz-capacitybandchart--compact |
| Card | stable | ui/card | Card component for containing related content. | Surface | components-molecules-card--brand-colored-cards |
| Carousel | candidate | ui/carousel | A row of peer cards, one per view with the neighbours peeking, that a phone swipes through instead of scrolling past. | Button, icons | components-molecules-carousel--default |
| ChatCard | candidate | custom/Chat | A structured card a message carries in a `data-*` part: a status line, a title, a subtitle, a body, small print and up to three actions. | Button, Card, Typography | custom-chat-chatcard--checkin |
| Checkbox | stable | ui/checkbox | Checkbox component for boolean inputs. | — | components-molecules-checkbox--all-sizes |
| Chip | stable | ui/chip | Chip — a `Pill` preset for tags, labels, and filters. | Pill | components-atoms-chip--all-colors |
| CircularTimer | candidate | custom/CircularTimer | A circular countdown / countup with a time readout in the center — the graphical sibling of {@link TimerReadout }. | Progress | components-molecules-circulartimer--countdown-midway |
| CoChangeChip | candidate | custom/ActiveWork | CoChangeChip — one symmetric "these two files change together" pair. | Card, FilePathLabel, Pill, Typography | custom-activework-cochangechip--default |
| Collapse | stable | ui/collapse | Collapsible content container. | — | components-organisms-accordion--allow-multiple |
| Composer | candidate | custom/Chat | The message input bar. | Button, Input, Surface | custom-chat-composer--default |
| ConversationIdentity | candidate | custom/Chat | Who a direct thread is with, shown once at the top instead of on every message, the way Messages heads a conversation. | Avatar, Typography | custom-chat-conversationidentity--default |
| DataRow | stable | ui/data-row | A label-and-value row: the dense rung of the row ladder. | — | components-molecules-datarow--custom-class-name |
| DateSeparator | candidate | custom/Chat | — | DateTime, Divider, Typography | custom-chat-messagelist-dateseparator--older |
| DateTime | candidate | ui/date-time | DateTime component for displaying formatted dates and times. | Typography | components-molecules-datetime--all-formats |
| DeviationBar | review | custom/Workout | — | — | custom-workout-dataviz-deviationbar--full-range |
| DeviceIndicator | candidate | shell | The device/BLE connection glyph — a color-coded bluetooth mark, no label. | icons | shell-workout-deviceindicator--default |
| DeviceMenu | candidate | shell | The device glyph + its dropdown of individual devices (availability, slot binding, id, connection state). | DeviceIndicator, DeviceRow, Popover, Typography | shell-workout-devicemenu--default |
| DeviceRow | candidate | shell | One device in the DeviceMenu: status dot · name · Bluetooth id. | Indicator, Typography | shell-workout-devicerow--default |
| Divider | stable | ui/divider | Divider component for visual separation of content. | — | components-atoms-divider--default |
| Drawer | stable | ui/drawer | Drawer component for side panel overlays. | Surface | components-organisms-drawer--all-sizes |
| DualGhostSpark | candidate | custom/Fatigue | — | GhostBand, GhostBloom, GhostSpark | custom-fatigue-dual-ghost-spark--asymmetric-controlled |
| DualPinnedLiveStrip | candidate | shell | Shell · DualPinnedLiveStrip (VW-439): the pinned live strip for a two-Voltra session. | Typography, VelocityStrip, icons, pinnedLiveStripParts | shell-workout-dualpinnedlivestrip--default |
| EmptyState | candidate | ui/empty-state | Empty state component for when there's no data to display. | — | components-molecules-emptystate--default |
| ExerciseCard | review | custom/Workout | The data-contract exercise card, in three representations — all three now ONE {@link ExerciseCardHeading}, selected by its `density`, rather than three hand-rolled heads: - `upcoming` — a dimmed, not-yet-reached row (`density="upcoming"`). | ExerciseCardHeading, ExerciseIndicator, SetBar, SetRow, SetTableHeader, VelocityStrip | custom-workout-exercisecard--collapsed-with-pr |
| ExerciseCardHeading | review | custom/Workout | The exercise row — one component for all three densities the workout surfaces list an exercise in: the standalone session-rail heading (`rail`), the collapsed card row (`compact`) and the not-yet-reached row (`upcoming`). | ExerciseHeading, SetBar, SetStrip, Tooltip | custom-workout-exercisecardheading--compact |
| ExerciseDetailPage | review | custom/Workout | ExerciseDetailPage — a tabbed per-exercise view. | CapacityBandChart, ExerciseCard, MesoStatusCard, SetRow, StrengthTrendChart, VelocityStrip | pages-exercise-detail--default |
| ExerciseHeading | review | custom/Workout | The exercise-heading info block (no strip): the name + {@link ExerciseIndicator} title row, its prescription line, and — `inline` only — a trailing previous-best caption. | ExerciseIndicator, SetsRepsLoad, TempoDisplay, Typography | custom-workout-exerciseheading--default |
| ExerciseIndicator | review | custom/Workout | A small circular outlined chip for an exercise heading. | SvgIcon, icons | custom-workout-exerciseindicator--all-kinds |
| Eyebrow | candidate | ui/eyebrow | Eyebrow — an uppercase micro-label used above a value or a section of content (e.g. "Focused · by rank", a stat tile's caption). | Typography | components-molecules-eyebrow--default |
| FatigueLights | candidate | custom/Fatigue | — | StatusDot, Tooltip | custom-fatigue-fatigue-lights--across-states |
| FatigueMeter | review | custom/Workout | A fatigue meter: a sliding needle over a fixed green→gold→orange→red velocity-loss gradient with VL10/VL20/VL30/stop scale markers. | ZoneTrack | custom-workout-dataviz-fatiguemeter--custom-scale |
| FileActivityDetail | candidate | custom/ActiveWork | FileActivityDetail — the right-hand pane of {@link FileHistoryExplorer }: one file's full mined history. | Card, DataRow, DateTime, Eyebrow, FileActivityRow, FilePathLabel, Pill, SparkBars, Tile, Typography | custom-activework-fileactivitydetail--default |
| FileActivityRow | candidate | custom/ActiveWork | FileActivityRow — one file in the ranked "hottest files" list: its path, total touches, the read/write/edit split, and a sparkline of per-session growth. | FilePathLabel, SparkBars, Typography | custom-activework-fileactivityrow--default |
| FileHistoryExplorer | candidate | custom/ActiveWork | FileHistoryExplorer — a file browser ranked by mined activity instead of alphabetised by name: a KPI strip, a two-pane hottest-files list ⇄ detail, and the repo's strongest co-change pairs. | Card, CoChangeChip, Divider, Eyebrow, FileActivityDetail, FileActivityRow, Tile, Typography | custom-activework-filehistoryexplorer--default |
| FilePathLabel | review | custom/ActiveWork | FilePathLabel — a file path with the directory dimmed and the basename bright. | Typography | — |
| FormField | stable | ui/form-field | FormField component for wrapping form inputs with label, help text, and error states. | — | components-molecules-formfield--complete-form-example |
| Gauge | candidate | ui/charts/gauge | SVG-free radial gauge (absolutely-positioned segment Views), matching the codebase's chart convention so it renders identically on web and native. | — | components-atoms-gauge--arbitrary-domain |
| GhostBand | review | custom/Fatigue | The phase-coloured axis band — ONE contiguous strip whose internal boundaries land exactly on the sparkline's phase transitions. | — | — |
| GhostBloom | review | custom/Fatigue | The ghost fan + the paper-treated tinted current line. | — | — |
| GhostSpark | candidate | custom/Fatigue | — | GhostBand, GhostBloom | custom-fatigue-ghost-spark--control-aware-tint |
| GoalCard | candidate | custom/Workout | A goal at card scale, in one of two sizes. | Card, GoalMilestoneSummary, GoalMilestoneWeekStrip, GoalPriorityIcon, GoalTrajectoryChart, GoalWeekColumnsChart, Indicator, Pill, PrBadge, TipTrigger, Typography | custom-workout-goals-goalcard--ahead |
| GoalMilestoneSummary | review | custom/Workout | Hero, facts row and week cells, on whatever plane the caller is already on. | GoalMilestoneWeekStrip, GoalTrajectoryPlot, Typography | — |
| GoalMilestoneTile | candidate | custom/Workout | The goal's meso target — the block's committed value, due in its last week — on its own inset plane: {@link GoalMilestoneSummary} in the frame the per-lift slot wants. | GoalMilestoneSummary, Indicator, Surface, Typography | custom-workout-goalmilestonetile--ahead |
| GoalMilestoneWeekStrip | review | custom/Workout | The block's weeks as cells, on the same `SegmentedBar` atom the rep and set strips are built from: each past week carries its verdict, the current week stands taller and wears the ring, and every cell opens a tip card. | GoalTrajectoryPlot, Pill, SegmentedBar, TipTrigger, Typography | — |
| GoalMuscleCard | review | custom/Workout | A muscle priority's goal state at card scale: the figure with this muscle lit by its status, the lifts-on-track count beneath it as a label, and every contributing lift listed to its right. | Card, GoalCard, Indicator, MuscleGlyph, Pill, Typography | custom-workout-goalmusclecard--default |
| GoalPriorityIcon | review | custom/Workout | The goal's priority level as a mark, sized and placed like `PrBadge`'s compact star so a card's upper right reads as one row of marks. | SvgIcon, TipTrigger, Typography, icons | — |
| GoalPriorityIndex | review | custom/Workout | Every declared priority on one wrapping line, grouped by level: the page's index of what the lifter asked this block for. | GoalPriorityIcon, Typography | custom-workout-goals-goalpriorityindex--default |
| GoalTrajectoryChart | review | custom/Workout | Goal trajectory over a block: the coach's expected band as a shaded polygon, the committed and stretch rules, the athlete's actual line with PR stars, meso boundary rules and deload shading. | GoalTrajectoryBand, GoalTrajectoryCalibrating, GoalTrajectoryPlot, GoalTrajectoryWeekTips | custom-workout-dataviz-goaltrajectorychart--ahead |
| GoalTrajectoryMini | review | custom/Workout | A lift's trajectory at card scale: the big chart's inset plane, monotone line, points, PR star and next-target marker, without axes, band or gridlines. | GoalTrajectoryChart, GoalTrajectoryPlot | — |
| GoalTrajectoryPlot | review | custom/Workout | — | GoalTrajectoryBand, GoalTrajectoryCalibrating, SvgIcon, icons | — |
| GoalTrajectoryWeekTips | review | custom/Workout | The week targets over the plot, absolute against the chart's own box. | Metric, Pill, PrBadge, TipTrigger, Tooltip, Typography | — |
| GoalWeekColumnsChart | review | custom/Workout | — | GoalMilestoneWeekStrip, GoalTrajectoryMini | — |
| HelpTip | candidate | ui/help-tip | HelpTip component for displaying contextual help information. | Surface | components-molecules-helptip--all-colors |
| IconBox | stable | ui/icon-box | — | — | components-atoms-iconbox--all-colors |
| Indicator | stable | ui/indicator | — | — | components-atoms-indicator--all-colors |
| InitiativeBrief | candidate | custom/ActiveWork | InitiativeBrief — an initiative's brief prose as a single-open accordion of its `##` sections: click any heading to open it, or step through them with the prev/next controls in the header, which close the current section and open the next. | Eyebrow, MarkdownProse, Typography | custom-activework-initiativebrief--default |
| InitiativeCard | candidate | custom/ActiveWork | InitiativeCard — an at-a-glance summary of one active-work initiative: state, rank, open-task count, a severity-mix bar, and its top-priority open task. | Card, Pill, SegmentedBar, SeverityLabel, StatusDot, Typography | custom-activework-initiativecard--backburner |
| InitiativeHeader | candidate | custom/ActiveWork | InitiativeHeader — an initiative's identity line: title, slug, state, rank, ship target and when it was last touched. | DateTime, InitiativeCard, Pill, StatusDot, Typography | custom-activework-initiativeheader--backburner |
| Input | stable | ui/input | Input component for text entry. | — | components-molecules-input--all-sizes |
| InputBar | review | custom/Workout | — | — | custom-workout-inputbar--default |
| IntensityBar | review | custom/Workout | — | — | custom-workout-dataviz-intensitybar--all-zones |
| Link | stable | ui/link | Link component for navigation. | — | components-atoms-link--all-colors |
| ListItem | stable | ui/list-item | — | — | components-molecules-listitem--basic |
| LiveAuraFrame | review | custom/Workout | Full-surface color-flood frame tied to a coaching category. | — | custom-workout-liveauraframe--all-states |
| LiveFatigueCard | candidate | custom/Fatigue | — | FatigueLights, GhostSpark, RomProgressionChart, Surface, VerdictHero | custom-fatigue-live-fatigue-card--default |
| LiveFatiguePanel | candidate | custom/Fatigue | — | LiveAuraFrame, LiveFatigueCard, VelocityHero | custom-fatigue-live-fatigue-panel--live-panel-v-2 |
| MarkdownProse | candidate | custom/Prose | MarkdownProse — renders a small, predictable markdown subset as themed prose and auto-links references the caller describes. | Typography | custom-prose-markdownprose--default |
| Menu | review | ui/menu | Menu component for dropdown menus. | Surface, TriggerSurface | components-molecules-menu--controlled |
| MesoCard | review | custom/Workout | A mesocycle card with name, goal, split, week range, an optional volume heatmap strip, and an expandable WeekRow list. | Badge, Card, WeekRow | custom-workout-mesocard--collapsed |
| MesoProgressBar | review | custom/Workout | Segmented horizontal bar of mesocycles. | — | custom-workout-mesoprogressbar--active-current |
| MesoStatusCard | review | custom/Workout | Mesocycle context card for a specific exercise: prescription vs actual metrics, intensity/volume gauges, and coaching guidance. | Card, StatusDot | custom-workout-mesostatuscard--default |
| MessageBubble | candidate | custom/Chat | One chat message: markdown prose in a bubble and any `data-*` parts rendered by the caller beneath it. | Avatar, MarkdownProse, Surface, Typography | custom-chat-messagelist-messagebubble--default |
| MessageList | candidate | custom/Chat | A chat thread, oldest at the top. | Button, ConversationIdentity, DateSeparator, MarkdownProse, MessageBubble, RevealRow, TypingIndicator, UnreadBadge | custom-chat-messagelist--default |
| Metric | candidate | custom/Metric | — | — | components-molecules-metric--all-sizes |
| MetricTiles | review | custom/Workout | MetricTiles — a row of equal-width stat tiles. | Stack, Tile | custom-workout-metrictiles--four-tiles |
| Modal | review | ui/modal | Modal component for dialogs and overlays. | Surface | components-organisms-modal--backdrop-blur |
| MuscleGlyph | review | custom/Workout | — | — | — |
| MuscleGroupChip | review | custom/Workout | MuscleGroupChip — a `Pill` preset that labels a muscle group with a volume-status dot. | Pill | custom-workout-musclegroupchip--all-statuses |
| MuscleStrip | review | custom/Workout | MuscleStrip — all 15 `MuscleGroupChip`s in one wrapping row, each labeled with its weekly sets against target. | MuscleGroupChip | custom-workout-musclestrip--default |
| NavItem | candidate | shell | Shell S2 · NavItem — one category button in the {@link SideNav }: a 20px glyph over an uppercase micro-label in a 46×46 target. | Typography | shell-navitem--active |
| OpenLoops | candidate | custom/ActiveWork | OpenLoops — the initiative's hanging threads from the session ledger: each loop's kind, age and auto-linked text. | Divider, Eyebrow, MarkdownProse, Pill, Typography | custom-activework-openloops--default |
| Pill | stable | ui/pill | The single pill primitive: a capsule of tone-coloured label with optional leading and trailing slots. | — | components-atoms-pill--all-sizes |
| PinnedLiveStrip | review | shell | Shell · PinnedLiveStrip (VW-429): the row pinned atop every non-live page while a set or rest runs, so the lifter never loses the live set. | SetBarChart, VelocityStrip, icons, pinnedLiveStripParts | shell-workout-pinnedlivestrip--default |
| PlaceholderStrip | review | custom/Workout | — | — | custom-workout-placeholderstrip--default |
| Popover | review | ui/popover | Popover component for displaying floating content. | Surface, TriggerSurface | components-molecules-popover--controlled |
| PortfolioOverview | candidate | custom/ActiveWork | PortfolioOverview — at-a-glance status across every tracked initiative: a KPI row followed by initiative groups (typically Focused, then Backburner). | Card, Eyebrow, InitiativeCard, Metric, Typography | custom-activework-portfoliooverview--default |
| PrBadge | review | custom/Workout | — | BaseBadge, Typography, icons | custom-workout-prbadge--all-types |
| PrHistoryModal | review | custom/Workout | Bottom-sheet modal listing an exercise's personal-record history. | Drawer, icons | custom-workout-prhistorymodal--default |
| PrimaryGoalCard | review | custom/Workout | The wall's lead goal card: {@link GoalCard} at `full` size. | GoalCard | — |
| ProgramPlanningPage | review | custom/Workout | ProgramPlanningPage — a meso -> week -> workout drill-down over an entire training program. | ExerciseCard, MesoCard, MesoProgressBar, WeekRow, WorkoutCard, WorkoutPill | pages-program-planning--default |
| Progress | stable | ui/progress | Linear progress bar component. | — | components-molecules-progress--all-colors |
| Radio | stable | ui/radio | Radio button component. | — | components-molecules-radio--all-colors |
| ReadinessCheck | review | custom/Workout | Pre-workout readiness assessment combining subjective emoji sliders with an objective VBT warm-up validation and a computed readiness score. | Badge, Card | custom-workout-readinesscheck--default |
| RestTimer | review | custom/Workout | — | CircularTimer | custom-workout-resttimer--default |
| RevealRow | review | custom/Chat | One thread row that slides left with the drag and carries its message time in a column parked past the right edge. | DateTime | — |
| RomProgressionChart | candidate | custom/Fatigue | — | SetBarChart | custom-fatigue-rom-progression--across-states |
| Scatter | candidate | ui/charts/scatter | SVG-free scatter / bubble plot (absolutely-positioned Views), matching the codebase's chart convention so it renders identically on web and native. | — | components-atoms-scatter--default |
| ScheduleTiles | review | custom/Workout | ScheduleTiles — Date / Time / Until row for an upcoming session. | DateTime, Stack, Tile | custom-workout-scheduletiles--soon-under-a-day |
| Section | stable | ui/section | — | — | components-atoms-section--default |
| SegmentedBar | review | custom/Workout | A horizontal track split into weighted, individually-fillable segments — the presentational atom the per-set strips are built from. | — | custom-workout-segmentedbar--equal-segments |
| SegmentedProgressBar | review | custom/Workout | A progress bar segmented by weighted slots (one chunk per exercise, width ∝ its set count): `value` fills the chunks left-to-right, and a single pace colour spans them all — green when at/ahead of the `target` pace, amber when behind, steel when there is no target. | SegmentedBar | custom-workout-segmentedprogressbar--ahead |
| Select | review | ui/select | Select component for single or multi-selection. | Surface | components-molecules-select--controlled |
| SessionDetail | candidate | custom/ActiveWork | SessionDetail — one session log, readable: its title, when it ran and for how long, the tasks it touched (as pills, or as a table when the host supplies the rows), then the markdown body with task ids, `[[name]]` links and PR numbers auto-linked. | Card, Collapse, DateTime, Divider, MarkdownProse, Pill, SessionListItem, TaskRow, TaskTable, Tooltip, Typography | custom-activework-sessiondetail--ad-hoc |
| SessionHeader | review | custom/Workout | The session-rail heading: the session title over a stat row and a chunked pace bar. | MetricTiles, ScheduleTiles, SegmentedProgressBar, Surface, TimerReadout, Typography | shell-sessionrail-sessionheader--live-behind |
| SessionList | candidate | custom/ActiveWork | SessionList — the selectable list half of the session reader. | Divider, Eyebrow, SessionListItem, Typography | custom-activework-sessionlist--custom-label |
| SessionListItem | candidate | custom/ActiveWork | SessionListItem — one session in the reader's list, led by its title, with a footer of age · duration · tasks touched · track. | DateTime, Tooltip, Typography | custom-activework-sessionlistitem--ad-hoc |
| SessionRail | review | custom/Workout | The live-workout session rail: a flat raised {@link SessionHeader} glance (title, stat tiles, chunked pace bar) over a sunk, inset list of {@link ExerciseCardHeading} exercise headings. | ExerciseCard, ExerciseCardHeading, ExerciseIndicator, MetricTiles, SessionHeader, SetBar, SetRow, Surface | shell-sessionrail--default |
| SessionStatePill | candidate | shell | The global session-state readout (dot + label). | Indicator, Typography | shell-workout-sessionstatepill--default |
| SessionsGoalCard | review | custom/Workout | A training-days goal on `#/goals`: the count in the rolling window against the commitment, what is due beside it (the rest sit in the tip), then one cell per committed day, a darker cell per day past it, and a marker at the count due by now. | GoalCard, Progress, SegmentedBar, StatCard, wholeBodyCardParts | custom-workout-goals-sessionsgoalcard--default |
| SetBar | review | custom/Workout | ONE set's multi-coloured bar: the butted per-rep colour segments for a single set (`done` = velocity-coloured reps · `active` = performed reps pulsing + grey remainder · `todo` = a solid grey bar), composed over {@link SegmentedBar}. | SegmentedBar | custom-workout-setbar--active |
| SetBarChart | review | custom/charts | — | — | — |
| SetRow | review | custom/Workout | ONE set row of the unified expanded exercise table. | Typography, VelocityStrip | custom-workout-setrow--done |
| SetStrip | review | custom/Workout | The per-set segmented performance strip: one continuous {@link SetBar} per set (rep intensities as butted color segments, no rep gaps), sets separated by a fixed gap. | SetBar | custom-workout-setstrip--active-range-set |
| SetTableHeader | review | custom/Workout | The expanded-set-table column-header row: SET · PREV · REPS · LOAD · RPE, with the weight column reflecting `unit`. | Typography | custom-workout-settableheader--kg |
| SetsRepsLoad | review | custom/Workout | The `sets × reps @ load` prescription line, in the TempoDisplay visual language (Inter · letter-spacing 1 · value cells with muted `×` / `@` separators). | metricText | custom-workout-setsrepsload--default |
| SeverityLabel | candidate | custom/ActiveWork | SeverityLabel — a task's severity as a coloured dot plus its label. | Indicator, Typography | custom-activework-severitylabel--all-severities |
| SideNav | candidate | shell | Shell S2 · SideNav — the persistent 60px left rail that switches the main viewport between an app's categories. | NavItem | shell-sidenav--another-app |
| Sidebar | candidate | custom/Sidebar | Sidebar navigation component. | — | components-organisms-sidebar--collapsed |
| Skeleton | stable | ui/skeleton | Skeleton component for loading placeholders. | — | components-atoms-skeleton--avatar |
| SparkBars | candidate | ui/charts/spark-bars | SparkBars — a tiny bar-mark sparkline for a signed series. | — | components-atoms-sparkbars--all-negative |
| Sparkline | review | custom/Workout | — | Typography | custom-workout-dataviz-sparkline--all-shapes |
| Spinner | stable | ui/spinner | Spinner component for loading states. | — | components-atoms-spinner--all-colors |
| Stack | stable | ui/stack | — | — | components-atoms-stack--default |
| StatCard | candidate | ui/stat-card | The stat card template: a header row, a lead figure with one caption, and a body pinned to the bottom. | Card, Typography | components-molecules-statcard--default |
| StatusDot | review | custom/Workout | — | Typography | custom-workout-statusdot--all-variants |
| StatusPill | review | custom/Workout | Verdict pill: a glowing status dot + coloured verdict text in a tinted capsule. | Pill, StatusDot | custom-workout-statuspill--all-states |
| Stepper | candidate | custom/stepper | Stepper component for multi-step flows. | — | components-molecules-stepper--active-step-progression |
| StrengthTrendChart | review | custom/Workout | Estimated-1RM line chart over time with an optional dashed plan-projection line and PR star markers. | — | custom-workout-dataviz-strengthtrendchart--compact |
| SupersetWrapper | review | custom/Workout | — | Typography | custom-workout-supersetwrapper--custom-color |
| Surface | stable | ui/surface | A container that OWNS its background and establishes an on-surface colour context. | — | components-atoms-surface--default |
| SvgIcon | review | icons | — | — | — |
| Switch | stable | ui/switch | Switch component for toggling boolean values. | — | components-molecules-switch--all-sizes |
| Table | candidate | ui/table | Table component with sorting support. | — | components-organisms-table--column-drop-order |
| TableCell | review | ui/table | Table data cell. | — | — |
| TableEmptyState | review | ui/table | Empty state component for tables with no data. | — | — |
| TableHeaderCell | review | ui/table | Table header cell with optional sorting. | Tooltip | — |
| TablePagination | review | ui/table | Pagination controls for table. | — | — |
| Tabs | stable | ui/tabs | Tabs component for tabbed navigation. | — | components-molecules-tabs--all-variants |
| TaskRow | candidate | custom/ActiveWork | TaskRow — one task as a dense grid row: initiative, id, title, severity, priority, estimate, tags and age. | DateTime, Pill, SeverityLabel, Table, TableCell, Tooltip, Typography | custom-activework-taskrow--critical-with-overflowing-tags |
| TaskTable | candidate | custom/ActiveWork | TaskTable — every open task across initiatives in one dense, sortable grid. | Eyebrow, SeverityLabel, Table, TableHeaderCell, TaskRow, Typography | custom-activework-tasktable--default |
| TempoDisplay | review | custom/Workout | — | metricText | custom-workout-tempodisplay--active-tempo-conditions |
| Tile | candidate | ui/tile | Tile — a compact label-over-value stat card. | — | components-atoms-tile--default |
| TimerReadout | candidate | custom/TimerReadout | Atom · TimerReadout — a small textual timer (⏱ + mono, right-justified) built on [useTimer]. | Typography | components-molecules-timerreadout--countdown-running |
| TipTrigger | review | ui/tooltip | One tip that opens on hover (web), focus (keyboard) and press (native) — the three affordances share a single open state, because RNW ends a wrapper's hover the moment a nested Pressable claims the pointer. | Tooltip | — |
| Toast | stable | ui/toast | Standalone Toast component (for static rendering without provider). | Surface | components-molecules-toast--all-statuses |
| ToolbarButton | stable | ui/toolbar-button | ToolbarButton component for toolbar actions with toggle state support. | Surface | components-molecules-toolbarbutton--active-vs-inactive |
| Tooltip | review | ui/tooltip | Tooltip component for showing additional information on hover/press. | Surface, TriggerSurface | components-molecules-tooltip--all-placements |
| TopBar | candidate | shell | S1 · TopBar — the persistent shell chrome band, generic over the app. | BrandLockup, DateTime, Divider, brands | shell-topbar--default |
| TrainingStatusPage | review | custom/Workout | TrainingStatusPage — a body-map training dashboard that composes the mesocycle context banner (`MesoStatusCard`), side-by-side front/back `BodyMap`s with a shared heatmap legend, per-status summary cards, and a tap-to-detail `BodyMapDetailPanel`. | BodyMap, BodyMapDetailPanel, MesoStatusCard | pages-training-status--default |
| Treemap | candidate | ui/charts/treemap | Squarified treemap. | — | components-atoms-treemap--default |
| TriggerSurface | review | ui/trigger | Give interaction handling to a composed child instead of wrapping it in a second Pressable. | — | — |
| TypingIndicator | candidate | custom/Chat | Three staggered dots in a small bubble, plus who is composing. | Indicator, Surface, Typography | custom-chat-messagelist-typingindicator--default |
| Typography | candidate | ui/typography | Typography component for consistent text styling. | — | foundations-typography--all-body |
| UnreadBadge | candidate | custom/Chat | Unread count as a brand capsule. | Pill | custom-chat-messagelist-unreadbadge--capped |
| VelocityBandOverlay | candidate | custom/Workout | The band-scale marks for a `SetBarChart`: the rep-range target zone, up to two guard lines, the past-cue count and the setting-change mark. | SetBarChart, Typography | custom-workout-velocitybandoverlay--default |
| VelocityBandPreview | review | custom/Workout | The band overlay on a real `SetBarChart`, for stories and review rounds only. | SetBarChart, VelocityBandOverlay | — |
| VelocityHero | candidate | custom/Fatigue | — | VelocityStrip | custom-fatigue-velocity-hero--default |
| VelocityStrip | review | custom/Workout | — | SetBarChart | custom-workout-dataviz-velocitystrip--all-views |
| VerdictHero | candidate | custom/Fatigue | — | — | custom-fatigue-verdict-hero--across-states |
| VolumeLandmarkBar | review | custom/Workout | Horizontal weekly-volume bar with MEV / MAV / MRV landmark ticks and a HEAT-scale fill positioned against the MAV target. | DataRow, Typography, ZoneTrack | custom-workout-dataviz-volumelandmarkbar--all-zones |
| WeekRow | review | custom/Workout | A single week within a mesocycle, showing the week number, its workout pills, and a right-aligned vertical intensity indicator. | IntensityBar, Typography, WorkoutPill | custom-workout-weekrow--current-week |
| WeightBadge | review | custom/Workout | — | BaseBadge, Typography, icons | custom-workout-weightbadge--all-variants |
| WorkoutCard | review | custom/Workout | A workout within a week: name, date, duration, muscle-group pills, and a stats summary. | Card, ExerciseCard, MuscleGroupChip, Typography | custom-workout-workoutcard--completed |
| WorkoutPill | review | custom/Workout | — | Typography | custom-workout-workoutpill--all-statuses |
| WorkoutShell | candidate | shell | — | AppShell, DeviceRow, SessionStatePill, SideNav, WorkoutTopBar, workoutNavItems | pages-workoutshell--default |
| WorkoutTopBar | candidate | shell | The workout app's top bar — the generic {@link TopBar} with the workout's own chrome in its `trailing` slot: session state, then the device menu. | DeviceMenu, DeviceRow, SessionStatePill, TopBar | shell-workout-workouttopbar--default |
| ZoneTrack | review | custom/Workout | Low-level gauge primitive: a horizontal pill track carrying an N-band zone gradient, optional tick marks with labels, and a single value marker (a needle line or a left-anchored fill). | Tooltip | custom-workout-dataviz-zonetrack--band-with-marker |

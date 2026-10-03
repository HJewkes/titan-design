# Page: API design note

`Page` is generic (its first consumer is a console app, not the Voltras dashboard). Round 0 contract: TD-408.

- **Why a component and not an `AppShell` prop**: `shell/README.md` says a second app does not get a new prop on `AppShell`; `children` is already the slot. Views differ (a status list wants a cap, a board wants full width and its own scroll), so the choice belongs to something the view renders. `ui/page` also works without a shell, in a `Drawer`, a `Modal` or a story frame.
- **Props**: `header`, `children`, `gutter` (`sm` | `md`, default `md`), `maxWidth` (`narrow` | `wide` | `full`, default `full`), `isScrollable` (default true), `className` (root), `contentClassName` (padded column). `PageHeader`: `title`, `description`, `trailing`, `className`.
- **State**: none. Scroll position belongs to the platform scroller. No ref API in v1. No loading, empty, error or disabled state: the view renders `Spinner`, `EmptyState` or `Alert` in the body.
- **Slots**: `header` is a named `ReactNode` slot because its wording and actions are consumer vocabulary. `PageHeader` is the default part for it, built from `Typography`. `children` is the body.
- **Accessibility**: the root is the `main` landmark, one per screen. The `PageHeader` title is the level-1 heading (`aria-level={1}`), so section headers and card titles sit below it. Nesting a `Page` in a `Page` is a misuse.
- **Scroll**: `Page` owns vertical scroll, and the header scrolls with the body. `isScrollable={false}` is for a view with its own panes: the column and body become `flex-1`, and the gutter and cap still apply. A long list uses `isScrollable={false}` and its own virtual list.
- **Width cap**: bracket classes (`max-w-[760px]`, `max-w-[1100px]`), local layout geometry. Named Tailwind steps are rem-based and NativeWind resolves rem at 14 px, so the cap would differ between web and device. The capped column sits left-aligned against the gutter.
- **No breakpoints**: a phone consumer passes `gutter="sm"`.
- **Composes**: `Typography`. Views compose `Section`, `Card`, `EmptyState` and `Alert` inside it.

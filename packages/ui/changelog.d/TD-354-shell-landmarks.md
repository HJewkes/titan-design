---
section: Changed
---

The shell exposes page landmarks. `SideNav` is now a `navigation` landmark (named by a new `accessibilityLabel` prop, default `'Primary'`) instead of a `tablist`, and each `NavItem` is a `button` with `aria-current="page"` when active instead of a `tab` with `aria-selected`; native screen readers still get `accessibilityState.selected`. `TopBar` is a `banner` landmark. `AppShell` takes `isMainLandmark` to render its content region as `main` when the children are not a `Page` (off by default, since `Page` supplies `main`). Tests or automation that query the shell nav by `tab` or `tablist` must query `button` and `navigation` instead (TD-354).

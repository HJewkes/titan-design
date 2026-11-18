---
section: Fixed
---

The `Menu` backdrop is out of the tab order and hidden from assistive tech (`tabindex="-1"`, `aria-hidden`), matching `Popover`, `Select` and `Drawer`; pressing it still closes the menu (TD-1063).

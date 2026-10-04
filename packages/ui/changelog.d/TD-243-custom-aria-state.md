---
section: Fixed
---

Selection, expansion and current-page state now reach the DOM under react-native-web, which drops `accessibilityState`. Table select cells emit `aria-checked` (`"mixed"` on a partially selected select-all), InitiativeBrief section headings emit `aria-expanded`, the active SidebarItem carries `aria-current="page"`, and the lab AwShell nav tabs emit `aria-selected`. The table `aria-required-attr` stories-axe baseline entries are gone (TD-243).

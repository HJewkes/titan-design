---
section: Fixed
---

Checked and selected state now reach the DOM under react-native-web, which drops `accessibilityState`. `Checkbox` emits `aria-checked` (`"mixed"` when indeterminate), `Radio` emits `aria-checked`, `Tabs` emits `aria-selected` on each `Tab`, and `Switch` drops its duplicate `accessibilityState.checked`. The checkbox and radio `aria-required-attr` stories-axe baseline entries are gone (TD-241).

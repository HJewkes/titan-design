---
section: Fixed
---

Text with no `font-*` class (`TableCell`, `Link`, `Avatar` initials and other React Native Web `<Text>`) now renders in the body face instead of the system sans stack; `global.css` sets it on RNW's text reset class, and any `font-*` class still overrides it. `Tab` labels take the sans face explicitly, like `Badge` and `Chip` (TD-1036).

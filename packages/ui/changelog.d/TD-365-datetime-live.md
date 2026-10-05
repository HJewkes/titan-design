---
section: Changed
---

`DateTime` with `isLive` and a `value` now re-renders that value relative to the current time
("5 minutes ago" advances); without a `value` it is still a clock. An unparseable `value` renders
`fallback` ('-' by default) instead of the string "Invalid Date", in both `DateTime` and
`formatDateTime`. Both take a `locale`, and `formatDateTime` takes an options object
`{ isUTC, hour12, seconds, locale, fallback }` as its third argument; the positional `isUTC` and
`fallback` still work. `customFormat`, which was never applied, is `@deprecated` (TD-365).

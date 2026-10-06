---
section: Changed
---

`DateTime` with `isLive` and a `value` now re-renders that value relative to the current time
("5 minutes ago" advances), ticking once per displayed unit (at most hourly) rather than every
`refreshMs`; without a `value` it is still a clock. An unparseable `value` renders `fallback` ('-'
by default) instead of the string "Invalid Date", in both `DateTime` and `formatDateTime`.
`formatDateTime` gains an options overload `{ isUTC, hour12, seconds, locale, fallback, now }`;
the positional `isUTC` and `fallback` still work. Relative time now rounds the magnitude, so past
and future agree at half-unit edges: 89.5 minutes reads "1 hour", where it used to read "2 hours".
`customFormat`, which was never applied, is `@deprecated` (TD-365).

---
section: Added
---

Two colour tokens for badges over media, such as a duration badge or a muted icon on a video thumbnail:
`scrim-strong` (`rgba(0, 0, 0, 0.78)`, `bg-scrim-strong`) is the badge ground and `on-scrim`
(`#FFFFFF`, `text-on-scrim`) is its ink. Neither changes with the theme. White over `scrim-strong` measures
11.7:1 over a white frame, 16.8:1 over mid grey and 21:1 over black, so it clears AA wherever the badge
lands (TD-987).

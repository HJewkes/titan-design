---
section: Added
---

`MapCard` and `FileCard` (`@titan-design/react-ui/motion` only, until the `/diagram` subpath lands). `MapCard`
is a Surface at elevation 3 joined to a screen-space anchor by a leader line, with a content slot: it sits
right of the anchor, flips left near the right edge, and stays above the 83% caption keep-out. `enter`
draws the leader and then fades the card in; `exit` fades both out. `FileCard` shows a file's path, change
status and metric rows in codewatch's panel order (TD-897).

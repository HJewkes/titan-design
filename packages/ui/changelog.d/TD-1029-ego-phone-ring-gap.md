---
section: Changed
---

`egoLayout` stops shrinking its rings once two of them are 80 px apart (`MIN_RING_GAP`), so on a phone-width viewport the rings and their labels stay readable and the canvas scrolls instead. Default-safe, no new option: the floor only binds where fitting would have pulled two rings closer than 80 px, so a viewport that already fits (the 720 × 420 story and wider) lays out exactly as before. The `Ego on a phone` story shows a 20-node ego graph at 375 px, and the `Ego (20)` fixture joins `networkGraphFixtures` (TD-1029).

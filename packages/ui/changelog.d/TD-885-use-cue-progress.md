---
section: Added
---

`useCueProgress(name, durationS = MOTION.video.enter)` in `/motion` returns 0 to 1 progress over
`durationS` seconds from a Beat cue (TD-885), equal to `useLocalTime(useCue(name), durationS).progress`.

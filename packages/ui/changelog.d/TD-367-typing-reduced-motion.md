---
section: Fixed
---

`TypingIndicator` holds its dots at full opacity and starts no pulse loop when the user prefers reduced
motion, and stops a running loop if the preference turns on mid-session (TD-367).
`usePrefersReducedMotion` no longer throws on unmount on a native platform where react-native-web
returns no listener subscription.

---
section: Internal
---

`pnpm test:capture` builds a Vite beat page that renders six react-ui components through
react-native-web and nativewind. It captures the page frame by frame under virtual time and checks
that runs are identical, that frames do not depend on capture order, and that the seek median is
under 100 ms (TD-845).

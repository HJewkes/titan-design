---
section: Internal
---

`MesoCard`, `MesoStatusCard` and `WorkoutCard` are split under 100 lines per function. `MesoCard` and `MesoStatusCard` each gain an unexported `.parts.tsx` sibling (highlight animation, accent strip, press region and week list; coaching and next-target callouts), and `MesoStatusCard` and `WorkoutCard` gain in-file parts for the header, muscle chips and press region. No rendered, prop, export or className change (TD-216).

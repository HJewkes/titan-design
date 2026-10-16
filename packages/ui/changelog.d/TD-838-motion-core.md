---
section: Added
---

`ui/motion`, the time-driven motion core: every animated value is a function of clock seconds. Clocks `seekClock`, `rafClock` and `mediaClock`; `MotionProvider`; hooks `useMotionTime`, `useLocalTime`, `useRawLocalTime`, `useWaitUntil` and the pure `localTime`; `Beat`, `BeatFrame` and `useBeatTime`; `cubicBezier`, `linear` and `MOTION` (`duration` in seconds, `ease` as curves). Without a provider the hooks share one requestAnimationFrame loop that stops once a window ends, and start at the end under reduced motion (web and native), on the server and after hydration. The theme gains `motion`, the one source of the `--ease-*` and `--duration-*` values, with `motionCSSVars` and `cubicBezierCss`; the CSS values are unchanged (TD-838).

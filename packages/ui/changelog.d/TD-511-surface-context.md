---
section: Changed
---

The surface context (`SurfaceContext`, `useSurface`, `useSurfaceMode`) now lives in `src/theme/`, so `ThemeProvider` no longer imports from `components/`; `ui/surface` re-exports it unchanged (TD-511).

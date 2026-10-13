---
section: Changed
---

Light `brand-primary-solid` is orange 500 under the white `on-brand-primary` label, and light
`brand-primary-hover` / `brand-primary-active` step down to orange 600 / 700; `Button` solid primary
hovers and presses on those two tokens (TD-774). `Button` labels follow the theme: solid labels read
the per-mode `on-*` token, so the light warning solid reads white on amber 500 (TD-773), and outline,
ghost and link labels read `text-{tone}` instead of the base tone (TD-415). Decision 0003 records the
tone recipe and the light solid ladder.

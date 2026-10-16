---
section: Added
---

`stageBox(frame, chrome?)` splits a video or page frame into a header band, a stage, a chip band and an 83% caption keep-out, in frame px, scaled by `height / 1080` from the S96 explainer metrics (`STAGE_METRICS_S96`). The keep-out is on by default; `keepOutFraction: 1` turns it off. `useStageFit(ref, label, measure?)` throws in development when content runs past its stage (`"<label> overflows its stage box by N px (…)"`, 1 px tolerance), with `stageOverflow` and `describeOverflow` as its pure parts (TD-885).

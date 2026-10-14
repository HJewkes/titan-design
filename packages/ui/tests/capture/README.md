# Capture proof (TD-845)

A Vite page renders six react-ui components through react-native-web and nativewind. Playwright
captures it frame by frame under virtual time. `pnpm test:capture` builds the page, serves it with
`vite preview` on a free port, and runs `capture.spec.ts`. The `visual` CI job runs it too.
`UPDATE_STILLS=1 pnpm test:capture` rewrites `stills/`.

| File                 | Role                                                                                           |
| -------------------- | ---------------------------------------------------------------------------------------------- |
| `page/ProofBeat.tsx` | One `Beat` holding the six components, each driven by its own staggered window                 |
| `page/main.tsx`      | `MotionProvider(seekClock)` and a local `window.__titanMotion` shim                            |
| `vite.config.ts`     | The RNW alias, nativewind as the JSX runtime and Tailwind; `no-rnw-alias` mode drops the alias |
| `virtual-time.ts`    | The spike's virtual-time init script, unchanged                                                |
| `capture.ts`         | Open, seek, `ready()`, screenshot                                                              |

The shim has the bridge's shape (`seek`, `ready`, `duration`). When TD-842a lands, the page
switches to the bridge and drops the shim.

## Result

**Criterion 4 (titan reuses at least 6 react-ui components): met.** All six components render
from the package source with no change to any component:

- ChapterCard;
- AnimatedNumber;
- StatCard, with AnimatedNumber `reel` as its figure;
- ProgressSteps `rail`;
- Timeline with a playhead;
- EvidenceChip at a video `fontPx`.

The spike reported 0 because react-ui needs react-native-web on the web, and at the time it
shipped no fonts. With one alias, and the fonts now bundled in `global.css`, nothing else was
needed. The svg resolution Storybook carries is not needed for these six components.

| Measure                                       | Value                                                      |
| --------------------------------------------- | ---------------------------------------------------------- |
| Two 90-frame captures                         | byte-identical, 90 of 90 frames                            |
| Scrambled-order capture against a sweep       | identical, 90 of 90 frames                                 |
| Seek + `ready()`, 90 seeks in scrambled order | median 6.7 ms, max 11.9 ms                                 |
| Build without the alias                       | fails: Rollup parses `react-native/index.js` (Flow source) |
| react-native-web in the page bundle           | 256 kB raw, 79 kB gzip, of 490 kB / 157 kB JS              |

The timings come from one local run on Linux with headless Chromium.

**Partial raster makes frames depend on the previous frame.** Chromium re-rasters only the
tiles that changed, so a fractional edge can keep the previous frame's anti-aliasing:

- With partial raster on, a scrambled-order capture differed from a sweep on 77 of 90 frames, in 3
  of 3 runs.
- For a single frame, 3 of 10 runs differed by up to 36 levels on the rail connector, and one
  differed by 6 levels.
- With `--disable-partial-raster` (in `playwright.capture.config.ts`), every run matched: 25
  single-frame runs and every full-suite run.

This is probably the cause of the spike's unexplained chunk-boundary anti-aliasing (1-6 levels).
That is inferred: it was not reproduced against the spike's 16-worker render. frame-capture should
launch Chromium with this flag.

**One build quirk a consumer page must carry.** `react-native-css-interop/dist/doctor.js`
(nativewind's runtime) ships JSX in a `.js` file. A production build must transform it as JSX
(`vite.config.ts`). The dev server's dep optimizer already handles it, which is why only a build
hits it.

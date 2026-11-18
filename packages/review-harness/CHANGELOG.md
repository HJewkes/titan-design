# Changelog

All notable changes to `@titan-design/review-harness` are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). The package is
private and unversioned, so every entry sits under `[Unreleased]`.

## [Unreleased]

### Added

- `clipDiff` in `src/clip-oracle.ts` (TD-1080): a pure pixel oracle that compares a clipped and a
  released render of a text box and reports a clip when at least 8 pixels outside the box plus a
  2 px guard band changed. It runs at full size (delta over 16) and on a 0.25x box-averaged
  downscale (delta over 8, since averaging can't raise a delta).
- `titan-review build --storybook-build` (needs `--tree`, TD-996). Before `round.json` lands it
  runs `build-storybook --output-dir <round>/storybook/static` in the tree and writes
  `<round>/storybook/storybook.json` (`titan-review/storybook@1`): `repo`, `sha`, `dirty`,
  `builtAt`, `storybookVersion`, `storyIds` (the story count) and `files`
  (`[{ path, sha256, bytes }]`, relative to `storybook/static`, sorted by path). A symlink in
  the build, a build without `index.json`, or a built sha other than the round's
  `build.mergeSha` refuses it. The build prints its file count, total bytes and time.

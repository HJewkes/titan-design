#!/usr/bin/env node
// Runs first in prepublishOnly: releases publish only from .github/workflows/publish.yml,
// which has the OIDC token npm provenance needs. GitHub Actions always sets GITHUB_ACTIONS=true.

if (process.env.GITHUB_ACTIONS !== 'true') {
  console.error(
    [
      'ci-only-publish: refusing to publish outside GitHub Actions.',
      'Releases publish from CI via .github/workflows/publish.yml on a v* tag push.',
      'To release: push the release commit to main, then push a v* tag (e.g. git push origin v1.2.3).',
    ].join('\n')
  )
  process.exit(1)
}

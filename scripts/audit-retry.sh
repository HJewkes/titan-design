#!/usr/bin/env bash
# Retry `pnpm audit` only when the registry failed; an advisory report fails at once.
set -uo pipefail

export npm_config_fetch_retries=0
delays=(10 30)

for attempt in 1 2 3; do
  out=$(pnpm audit --audit-level=critical 2>&1)
  status=$?
  echo "$out"
  [ "$status" -eq 0 ] && exit 0
  # pnpm prints this summary only when the registry returned an advisory report.
  if grep -q "vulnerabilities found" <<<"$out"; then exit "$status"; fi
  [ "$attempt" -eq 3 ] && exit "$status"
  echo "audit: registry error on attempt $attempt, retrying in ${delays[$attempt-1]}s" >&2
  sleep "${delays[$attempt-1]}"
done

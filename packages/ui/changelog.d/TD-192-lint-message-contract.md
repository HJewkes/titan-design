---
section: Internal
---

Lint message contract: `eslint-rules/README.md` states it, and `lint-message-contract.test.ts` enumerates every `titan` and `no-restricted-syntax` message, requiring a fixture per new id and a shrink-only `PENDING` list for older ones. The Tailwind compile helper moves to `src/test/tailwind-compile.ts` (TD-192).

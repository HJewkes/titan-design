# titan lint rules: the message contract

Every custom lint message (a `titan` rule message or a `no-restricted-syntax` entry) follows four lines:

1. Name the violation.
2. Say what owns the value (the token layer, the shared formatter, the tier order).
3. List the real options, derived from the source that defines them (`fix-options.js`) and capped at 8 for the matched family. A class-shaped option must compile against `tailwind.config.js`; a symbol option must be exported from its `SYMBOLS` module.
4. Name the escape hatch if one exists (for example `// optical: <why>`).

`src/test/lint-message-contract.test.ts` enforces this. It enumerates the plugin's messages and every `no-restricted-syntax` message in `eslint.config.js`, and requires a fixture per id that renders through `Linter` with a fix clause and at least one backticked option. A new message id with no fixture fails. Ids that predate the contract sit in `PENDING` in that test; the list only shrinks, and a conforming id (one with a fixture) may not be added back.

The raw-hex `no-restricted-syntax` message in `eslint.config.js` already meets the contract and is the one to copy.

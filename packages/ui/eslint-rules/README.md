# titan lint rules: the message contract

Every custom lint message (a `titan` rule message or a `no-restricted-syntax` entry) follows four lines:

1. Name the violation.
2. Say what owns the value (the token layer, the shared formatter, the tier order).
3. List the real options, derived from the source that defines them (`fix-options.js`) and capped at 8 for the matched family (a closed set such as the Typography variants is listed whole). A class-shaped option must compile against `tailwind.config.js`; a symbol option must be exported from its `SYMBOLS` module; a path option (`ui/`, `custom/Workout`) must exist under `src/components` or `src`; a story root (`Components/`) must be in `preview.tsx`; a PascalCase name must be a package export; a `space.*` key must be a number in `space` (`semantic.ts`); a `variant="x"` must be a `TypographyVariant`.
4. Name the escape hatch if one exists (for example `// optical: <why>`).

`src/test/lint-message-contract.test.ts` enforces this. It enumerates the plugin's messages and every `no-restricted-syntax` message in `eslint.config.js`, and requires a fixture per id that renders through `Linter` with a fix clause and at least one backticked option. A new message id with no fixture fails. Option kinds it validates include d3 package names, checked against `dependencies` in `package.json`. Pressable (a react-native export) and TriggerSurface (an internal helper, not in the package barrel) stay in prose, unbackticked, because no validator source covers them.

The raw-hex `no-restricted-syntax` message in `eslint.config.js` already meets the contract and is the one to copy.

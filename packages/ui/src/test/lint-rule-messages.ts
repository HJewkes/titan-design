import { Linter, type Rule } from 'eslint'

/** The messages one titan rule reports for `code`, linted as a JSX module. */
export function lintMessages(
  ruleName: string,
  rule: Rule.RuleModule,
  code: string
): Linter.LintMessage[] {
  const config: Linter.Config = {
    files: ['**/*.js'],
    plugins: { titan: { rules: { [ruleName]: rule } } },
    rules: { [`titan/${ruleName}`]: 'error' },
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
  }
  return new Linter({ configType: 'flat' }).verify(code, [config], { filename: 'fixture.js' })
}

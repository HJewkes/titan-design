import { createRequire } from 'node:module'
import { RuleTester, type Rule } from 'eslint'

// Required rather than imported: the rule is untyped CommonJS, and this gives it a type.
const rule = createRequire(import.meta.url)(
  '../../eslint-rules/no-classname-on-animated'
) as Rule.RuleModule

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

const invalid = (code: string, element: string) => ({
  code,
  errors: [{ messageId: 'animated', data: { element } }],
})

describe('no-classname-on-animated', () => {
  ruleTester.run('no-classname-on-animated', rule, {
    valid: [
      { code: 'const a = <Animated.View><View className="p-4" /></Animated.View>' },
      { code: 'const a = <Animated.View style={{ opacity }} />' },
      { code: 'const a = <View className="p-4" />' },
      { code: 'const a = <Motion.View className="p-4" />' },
    ],
    invalid: [
      invalid('const a = <Animated.View className="p-4" />', 'Animated.View'),
      invalid(
        'const a = <Animated.Text className="text-text-primary">hi</Animated.Text>',
        'Animated.Text'
      ),
      invalid(
        'const a = <Animated.ScrollView className={cn(base, className)} />',
        'Animated.ScrollView'
      ),
      {
        code: 'const a = <Animated.View className="p-4"><Animated.Text className="m-2" /></Animated.View>',
        errors: [
          { messageId: 'animated', data: { element: 'Animated.View' } },
          { messageId: 'animated', data: { element: 'Animated.Text' } },
        ],
      },
    ],
  })
})

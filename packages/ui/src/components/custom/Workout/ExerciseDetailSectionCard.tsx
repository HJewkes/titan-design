import { View, Text } from 'react-native'

export function SectionCard({
  title,
  children,
  testID,
}: {
  title: string
  children: React.ReactNode
  testID: string
}) {
  return (
    <View
      className="bg-surface-elevated border-hairline p-inset-md gap-2.5"
      style={{
        borderWidth: 1,
        borderRadius: 12,
      }}
      testID={testID}
    >
      <Text
        className="text-text-tertiary"
        style={{
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          letterSpacing: 0.6,
          textTransform: 'uppercase',
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  )
}

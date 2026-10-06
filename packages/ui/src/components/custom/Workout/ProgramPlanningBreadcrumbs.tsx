import { View, Text, Pressable } from 'react-native'
import { getSemanticColors } from '../../../theme/tokens/semantic'
import { useSurfaceMode } from '../../ui/surface'

/** Current depth of the meso -> week -> workout drill-down. */
export type ProgramNavLevel = 'meso' | 'week' | 'workout'

/** One tappable step in the breadcrumb trail. */
export interface ProgramBreadcrumb {
  key: string
  label: string
  level: ProgramNavLevel
}

interface BreadcrumbsProps {
  crumbs: ProgramBreadcrumb[]
  onNavigate: (level: ProgramNavLevel) => void
}

export function Breadcrumbs({ crumbs, onNavigate }: BreadcrumbsProps) {
  const brandPrimary = getSemanticColors(useSurfaceMode())['brand-primary']
  return (
    <View
      className="flex-row items-center flex-wrap gap-inline-sm"
      testID="program-planning-page-breadcrumbs"
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1
        return (
          <View key={crumb.key} className="flex-row items-center gap-inline-sm">
            {index > 0 && (
              <Text className="text-text-tertiary" style={{ fontSize: 12 }}>
                {'›'}
              </Text>
            )}
            <Pressable
              onPress={() => onNavigate(crumb.level)}
              disabled={isLast}
              accessibilityRole="button"
              testID={`program-planning-page-crumb-${crumb.key}`}
            >
              <Text
                className={isLast ? 'text-text-primary' : undefined}
                style={{
                  fontSize: 12,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: isLast ? '700' : '500',
                  color: isLast ? undefined : brandPrimary,
                }}
              >
                {crumb.label}
              </Text>
            </Pressable>
          </View>
        )
      })}
    </View>
  )
}

import { View, Text, type ViewProps } from 'react-native'
import { cn } from '../../utils/cn'

export interface BrandLockupProps extends ViewProps {
  /** The "/ subtitle" that follows the wordmark. Default "wall dashboard". */
  subtitle?: string
  /** Show the subtitle. Hidden at tablet width and below (S1-Q4 responsive). */
  showSubtitle?: boolean
  className?: string
}

/**
 * Product identity lockup for the top bar: ◇ mark + VOLTRAS wordmark + optional
 * subtitle. Bespoke brand molecule (S1 · BrandLockup).
 */
export function BrandLockup({
  subtitle = 'wall dashboard',
  showSubtitle = true,
  className,
  ...props
}: BrandLockupProps) {
  return (
    <View className={cn('flex-row items-center gap-[7px]', className)} {...props}>
      <Text className="text-brand-primary text-[14px]">◇</Text>
      <Text className="text-text-primary font-extrabold text-[12px] tracking-[1.5px]">VOLTRAS</Text>
      {showSubtitle && subtitle ? (
        <Text className="text-text-tertiary font-semibold text-[10px] tracking-[0.4px]">
          / {subtitle}
        </Text>
      ) : null}
    </View>
  )
}
